import { asRecord, errorMessage } from "@/lib/json";
import { AMBER_SYSTEM_PROMPT, AMBER_ADMIN_OPERATOR_ADDENDUM } from "@/lib/amber/persona";
import { parseContext, renderContext, renderServiceState } from "@/lib/amber/context";
import { isAdminSession } from "@/lib/admin-session";
import { runAgentTurn, agentProviderConfigured, type AgentMessage, type AgentEvent } from "@/lib/ai/agent-chain";
import { commandCenterToolDefs, executeCommandCenterTool } from "@/lib/ai/command-center-tools";

// ---------------------------------------------------------------------------
// Public "Ask Amber" widget — POST /api/amber. Mounted once, unauthenticated,
// on every page of the whole site (see layout.tsx's <AmberDock />). Every
// real visitor always gets the plain Gemini assistant below — unchanged.
//
// Michael, recognized by his own real Headquarters admin session (the exact
// same isAdminSession() check /api/command-center/* already enforces), gets
// routed instead to the same tool-calling agent and toolset that already
// powers the admin Command Center: one real build/fix/repair agent, reused
// here rather than reimplemented, so there is exactly one canonical backend
// behind "Amber," not two. The owner check runs before any tool is ever
// handed to a model — nothing here can expose repo/deploy tools to an
// unauthenticated caller, since every other branch never imports them.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 20;

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

// Best-effort per-IP rate limit. In-memory, so it resets on cold start and is
// per-instance — enough to blunt abuse, not a durable quota.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { start: number; count: number }>();

function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") || "local";
}

function rateLimited(id: string): boolean {
  const now = Date.now();
  const rec = hits.get(id);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(id, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

function parseMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Message => {
      if (!m || typeof m !== "object") return false;
      const r = (m as Message).role;
      return (r === "user" || r === "assistant") && typeof (m as Message).content === "string";
    })
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content.trim().length > 0);
}

/** Wraps a producer that enqueues text chunks into the same plain-text
 *  streaming Response shape both the owner and public turns return, so
 *  AmberDock's frontend (which just appends decoded bytes to a bubble) never
 *  has to know which path served it. */
function textStream(fn: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await fn(controller);
      } catch {
        controller.enqueue(encoder.encode("\n\n(Amber's reply was cut short.)"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Michael's own verified-owner turn: the exact same tool-calling agent loop
 * (runAgentTurn), toolset (commandCenterToolDefs — including the dev-bridge
 * build/fix tools), and executor (executeCommandCenterTool) already used by
 * the admin Command Center chat. No conversation is persisted here — this
 * widget keeps its own history client-side, same as it already does for the
 * public path — so the tool executor is called with a null conversation id,
 * a shape it already supports (Command Center's own route falls back to the
 * same null when conversation creation fails).
 */
function runOwnerTurn(messages: Message[], contextBlock: string): Response {
  if (!agentProviderConfigured()) {
    return new Response(
      "Amber's build/fix tools need ANTHROPIC_API_KEY or OPENAI_API_KEY set on this Reelo service before they'll work — nothing is wired up yet on this deploy.",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  // Gemini has no live clock and the dev-bridge tools reason about "right
  // now" (a queued task, a deploy "a few minutes" out) — same fix Command
  // Center's own chat route already applies for this agent loop.
  const now = new Date();
  const nowLine = `\n\n# Current time\nRight now it is ${now.toISOString()} (UTC), a ${now.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}.`;
  const systemPrompt = `${AMBER_SYSTEM_PROMPT}\n\n${AMBER_ADMIN_OPERATOR_ADDENDUM}\n\n# CONTEXT\n${contextBlock}${nowLine}`;
  const agentMessages: AgentMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
  const tools = commandCenterToolDefs();

  return textStream(async (controller) => {
    const encoder = new TextEncoder();
    await runAgentTurn({
      systemPrompt,
      messages: agentMessages,
      tools,
      executeTool: (name, args) => executeCommandCenterTool(name, args, null, []),
      onEvent: (event: AgentEvent) => {
        if (event.type === "text" && event.delta) controller.enqueue(encoder.encode(event.delta));
        if (event.type === "error") controller.enqueue(encoder.encode(`\n\n(${event.message})`));
      },
    });
  });
}

/** The plain, tool-free assistant every real site visitor gets — verbatim
 *  behavior from before this file gained an owner branch. */
async function runPublicTurn(messages: Message[], contextBlock: string): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Amber is unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  // Gemini uses "model" for the assistant role and takes the system prompt separately.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}/models/${MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: `${AMBER_SYSTEM_PROMPT}\n\n# CONTEXT\n${contextBlock}` }],
        },
        // Google Search grounding. Without it Amber has no way to answer the
        // single most common question people ask a video assistant — "what's
        // trending right now" — and has to deflect. Gemini decides per-turn
        // whether a search is warranted, so ordinary product questions still
        // answer straight from the prompt.
        tools: [{ google_search: {} }],
        // 800 was not enough: a grounded trend answer runs well past it, and
        // thinking tokens are billed against this same budget, so replies were
        // being truncated mid-sentence. Thinking stays on — it improves the
        // answer — but the ceiling now leaves room for both.
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return Response.json({ error: "Amber could not be reached. Try again." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    let msg = `Amber is temporarily unavailable (${upstream.status}).`;
    try {
      const data = asRecord(await upstream.json());
      const m = errorMessage(data, "");
      if (m) msg = m;
    } catch {
      /* keep the generic message */
    }
    return Response.json({ error: msg }, { status: 502 });
  }

  // Re-emit Gemini's SSE as a plain text stream so the client can just append.
  return textStream(async (controller) => {
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are newline-delimited; keep the trailing partial line.
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            // A grounded turn can split a chunk across several parts, so take
            // all of them rather than just the first.
            const parts: unknown = json?.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              const text = parts
                .map((p) => (typeof p?.text === "string" ? p.text : ""))
                .join("");
              if (text.length > 0) controller.enqueue(encoder.encode(text));
            }
          } catch {
            // Partial or non-JSON frame — skip it.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  });
}

export async function POST(req: Request) {
  if (rateLimited(clientId(req))) {
    return Response.json({ error: "You're sending messages very quickly — give it a moment." }, { status: 429 });
  }

  let messages: Message[];
  let contextBlock: string;
  try {
    const body = asRecord(await req.json());
    messages = parseMessages(body.messages);
    // Client-supplied context is sanitised; service status is added here on the
    // server so it cannot be spoofed by the browser.
    // Vercel and Cloudflare both resolve the country at the edge and overwrite
    // these headers, so they beat anything the browser says about itself.
    const edgeCountry =
      req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? undefined;
    const ctx = parseContext(body.context);
    contextBlock = `${renderContext({
      ...ctx,
      country: /^[A-Za-z]{2}$/.test(edgeCountry ?? "") ? edgeCountry : undefined,
    })}\n${renderServiceState()}`;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (messages.length === 0) {
    return Response.json({ error: "Say something to Amber first." }, { status: 400 });
  }

  if (await isAdminSession()) return runOwnerTurn(messages, contextBlock);
  return runPublicTurn(messages, contextBlock);
}
