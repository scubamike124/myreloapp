// ---------------------------------------------------------------------------
// One way to ask Gemini for structured JSON.
//
// The existing routes each grew their own copy of this — build a prompt, fetch,
// pull the first {...} out of the text with a regex, hope. The regex version
// fails in a way that is hard to see: a stray brace in a written sentence and
// the parse either throws or, worse, succeeds on the wrong span.
//
// The director runs four model calls per attempt and up to three attempts, so
// twelve chances for that to happen. Here it asks for responseSchema instead,
// which makes the model emit JSON of a known shape, and the caller gets either
// a typed object or an error — no partial parses.
// ---------------------------------------------------------------------------

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

/** The subset of JSON Schema Gemini accepts for responseSchema. */
export type JsonSchema = {
  type: "object" | "array" | "string" | "number" | "integer" | "boolean";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  description?: string;
};

export class ModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelError";
  }
}

export async function askJson<T>(opts: {
  key: string;
  prompt: string;
  schema: JsonSchema;
  /** High for creative divergence, low for analysis that must stay grounded. */
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Pictures to reason over — the finished frames, when judging a commercial
   *  rather than a plan. Sent after the prompt so the instructions come first. */
  images?: { mimeType: string; base64: string }[];
}): Promise<T> {
  const { key, prompt, schema, temperature = 0.9, maxOutputTokens = 8192, timeoutMs = 90_000, images = [] } = opts;

  let res: Response;
  try {
    res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.base64 } })),
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: schema,
          // Thinking is billed against maxOutputTokens on this model, and a
          // storyboard is a long answer. Left on, the whole budget goes to
          // reasoning, the response is cut off mid-object, and the JSON parse
          // fails after a minute of waiting. Same reason the other Gemini
          // routes here disable it.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // A timeout here is the common failure, and "fetch failed" tells the
    // customer nothing about which of the four stages gave up.
    throw new ModelError(e instanceof Error && e.name === "TimeoutError" ? "the model took too long to answer" : "could not reach the model");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ModelError(data?.error?.message ?? `model returned HTTP ${res.status}`);

  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new ModelError("the model returned nothing");

  try {
    return JSON.parse(text) as T;
  } catch {
    // Naming the finish reason matters here: "malformed JSON" and "the answer
    // was cut off at the token limit" look identical from the parse but need
    // opposite fixes, and the first version of this cost an hour to tell apart.
    const reason = typeof candidate?.finishReason === "string" ? candidate.finishReason : "";
    throw new ModelError(reason && reason !== "STOP" ? `the answer was cut short (${reason})` : "the model returned malformed JSON");
  }
}

/** Trim and cap an untrusted string field. Mirrors the helper in the routes. */
export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/** Trim and cap an untrusted array of strings, dropping the empties. */
export function strList(v: unknown, max: number, each = 200): string[] {
  return (Array.isArray(v) ? v : []).slice(0, max).map((x) => str(x, each)).filter(Boolean);
}

/** Clamp an untrusted number into range, falling back when it is not a number. */
export function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Snap an untrusted string onto a known vocabulary, so the DNA stays closed. */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const s = str(v, 60).toLowerCase();
  return allowed.find((a) => a.toLowerCase() === s) ?? fallback;
}
