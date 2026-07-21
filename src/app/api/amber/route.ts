import { AMBER_SYSTEM_PROMPT } from "@/lib/amber/persona";
import { parseContext, renderContext, renderServiceState } from "@/lib/amber/context";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Amber is unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  if (rateLimited(clientId(req))) {
    return Response.json({ error: "You're sending messages very quickly — give it a moment." }, { status: 429 });
  }

  let messages: Message[];
  let contextBlock: string;
  try {
    const body = await req.json();
    messages = parseMessages(body.messages);
    // Client-supplied context is sanitised; service status is added here on the
    // server so it cannot be spoofed by the browser.
    contextBlock = `${renderContext(parseContext(body.context))}\n${renderServiceState()}`;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (messages.length === 0) {
    return Response.json({ error: "Say something to Amber first." }, { status: 400 });
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return Response.json({ error: "Amber could not be reached. Try again." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    let msg = `Amber is temporarily unavailable (${upstream.status}).`;
    try {
      const data = await upstream.json();
      if (data?.error?.message) msg = data.error.message;
    } catch {
      /* keep the generic message */
    }
    return Response.json({ error: msg }, { status: 502 });
  }

  // Re-emit Gemini's SSE as a plain text stream so the client can just append.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (typeof text === "string" && text.length > 0) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // Partial or non-JSON frame — skip it.
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n(Amber's reply was cut short.)"));
      } finally {
        controller.close();
        reader.releaseLock();
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
