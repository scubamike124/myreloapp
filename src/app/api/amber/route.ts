import { asRecord, errorMessage } from "@/lib/json";
import {
  AMBER_SYSTEM_PROMPT,
  AMBER_ADMIN_OPERATOR_ADDENDUM,
  AMBER_FIX_SURFACE_ADDENDUM,
} from "@/lib/amber/persona";
import { parseContext, renderContext, renderServiceState } from "@/lib/amber/context";
import { normalizeRegion } from "@/lib/locale-region";
import { isAdminSession } from "@/lib/admin-session";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/admin-auth";
import { runAgentTurn, agentProviderConfigured, type AgentMessage, type AgentEvent } from "@/lib/ai/agent-chain";
import { commandCenterToolDefs, executeCommandCenterTool } from "@/lib/ai/command-center-tools";
import { isAmberFixWorkIntent, modeInstruction, type AmberMode } from "@/lib/amber/intent";
import { amberDevBridgeConfigured, startDevTask } from "@/lib/amber/dev-bridge";

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
 * Michael's own verified-owner turn.
 *
 * On Amber Fixes (/amber-builder), work-intent messages do NOT go to the LLM
 * first. Production proved the model still asks "which line / which page"
 * even with strong prompts. For those turns we auto-queue start_dev_task with
 * an investigative brief, then narrate — no clarifying interview.
 */
function runOwnerTurn(
  messages: Message[],
  contextBlock: string,
  opts: { onAmberFix: boolean; mode: AmberMode | null },
): Response {
  if (!agentProviderConfigured()) {
    return new Response(
      "Amber's build/fix tools need ANTHROPIC_API_KEY or OPENAI_API_KEY set on this Reelo service before they'll work — nothing is wired up yet on this deploy.",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() || "";
  const autoFix = opts.onAmberFix && isAmberFixWorkIntent(lastUser);

  if (autoFix) {
    return textStream(async (controller) => {
      const encoder = new TextEncoder();
      if (!amberDevBridgeConfigured()) {
        controller.enqueue(
          encoder.encode(
            "I would start that Relo change now, but the coding-agent bridge isn't configured on this deploy (REELO_DEV_BRIDGE_SECRET). Once that's set I can inspect the repo and queue the work without asking you for file paths.",
          ),
        );
        return;
      }

      const title =
        lastUser.length <= 72
          ? lastUser.replace(/\?+$/, "").trim() || "Relo change"
          : `Relo: ${lastUser.slice(0, 60).trim()}…`;

      const description = [
        "Owner request via Amber Fixes (/amber-builder):",
        lastUser,
        "",
        "IMPORTANT — the owner did NOT specify file paths, routes, or exact copy.",
        "You must inspect the Relo (myreloapp) repository and live product yourself,",
        "locate the relevant code, choose the best interpretation of their outcome,",
        "implement the change, test it, and open a PR through the normal coding-agent workflow.",
        "Do not block on asking the owner which line/page/file — discovering that is your job.",
        "If multiple interpretations exist, pick the highest-value single change on a primary",
        "Relo surface that matches their wording and document the assumption in the PR.",
      ].join("\n");

      try {
        const result = await startDevTask({
          title,
          description,
          acceptanceCriteria:
            "Change is implemented in the Relo repo, tests/quality gate pass, PR opened with a clear summary of what was inspected and changed.",
        });
        controller.enqueue(
          encoder.encode(
            `Starting now — I queued a real engineering task against the Relo repo to inspect the code, pick the right change, implement it, and test it (taskId \`${result.taskId}\`, status \`${result.status}\`). I am not going to ask you which file or line; that's the coding agent's job. I'll check progress with check_dev_task.`,
          ),
        );
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `I tried to queue that Relo change just now and the bridge failed: ${e instanceof Error ? e.message : "unknown error"}. I'm not asking you for implementation details — once the bridge is healthy I'll retry the same investigative task.`,
          ),
        );
      }
    });
  }

  // Gemini has no live clock and the dev-bridge tools reason about "right
  // now" (a queued task, a deploy "a few minutes" out) — same fix Command
  // Center's own chat route already applies for this agent loop.
  const now = new Date();
  const nowLine = `\n\n# Current time\nRight now it is ${now.toISOString()} (UTC), a ${now.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}.`;
  const fixBlock = opts.onAmberFix ? `\n\n${AMBER_FIX_SURFACE_ADDENDUM}` : "";
  const modeBlock =
    opts.mode != null
      ? `\n\n${modeInstruction(opts.mode, { surface: opts.onAmberFix ? "amber-fix" : "general" })}`
      : "";
  const systemPrompt = `${AMBER_SYSTEM_PROMPT}\n\n${AMBER_ADMIN_OPERATOR_ADDENDUM}${fixBlock}${modeBlock}\n\n# CONTEXT\n${contextBlock}${nowLine}`;
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
  let onAmberFix = false;
  let mode: AmberMode | null = null;
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
    onAmberFix = typeof ctx.path === "string" && ctx.path.startsWith("/amber-builder");
    if (body.mode === "execution" || body.mode === "conversation") {
      mode = body.mode;
    }
    contextBlock = `${renderContext({
      ...ctx,
      country: normalizeRegion(edgeCountry),
    })}\n${renderServiceState()}`;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (messages.length === 0) {
    return Response.json({ error: "Say something to Amber first." }, { status: 400 });
  }

  if (await isAdminSession()) {
    const res = runOwnerTurn(messages, contextBlock, { onAmberFix, mode });
    // Sliding renewal, same intent as middleware.ts's for /admin/*, extended
    // to cover the one major owner surface it never actually reached.
    //
    // Confirmed live: middleware.ts's matcher is /admin/:path* only — using
    // Amber Fix (/amber-builder, and this route generally) never renews the
    // admin cookie, no matter how actively it's used, so its fixed 30-day
    // ceiling from the owner's last real /admin/* visit is the only thing
    // that determines whether he's still recognized here. When it lapses,
    // isAdminSession() silently starts returning false and every message —
    // including a plain status question about a real, existing task — falls
    // through to runPublicTurn: a tool-free assistant with zero database
    // access, that answers confidently anyway ("that task ID doesn't exist")
    // because it was never told it might be wrong to. The page still looks
    // signed in; nothing here ever said otherwise. Renewing on every owner
    // turn closes the actual gap instead of only ever answering "yes, only
    // /admin/* renews" when someone reads the code closely enough to ask.
    try {
      const renewed = await createSessionToken();
      if (renewed) {
        res.headers.append(
          "Set-Cookie",
          `${ADMIN_COOKIE}=${renewed}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${
            process.env.NODE_ENV === "production" ? "; Secure" : ""
          }`,
        );
      }
    } catch {
      /* renewal is best-effort — never block the actual reply on it */
    }
    return res;
  }

  // /amber-builder's own page load already redirects to /admin/login when
  // there's no valid session (see src/app/amber-builder/page.tsx) — so
  // reaching here with onAmberFix true and isAdminSession() false means a
  // session that WAS valid when the page loaded has since expired mid-use
  // (see the renewal comment above for why that can happen even during
  // active use). Falling through to runPublicTurn here is exactly the bug
  // this whole change exists to close: a tool-free assistant with no
  // database access, answering a real internal-system question as if it
  // had one, on the one surface that is never meant to serve anyone but
  // the owner. Say plainly what happened instead of guessing an answer.
  if (onAmberFix) {
    return new Response(
      "Your session looks like it's expired — I can't reach the real tools (repo, tasks, deploys) from here right now, and I'm not going to guess at an answer about system state I can't actually check. Please sign in again at /admin/login and ask me again.",
      { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  return runPublicTurn(messages, contextBlock);
}
