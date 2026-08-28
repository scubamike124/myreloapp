import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Provider fallback chain for JSON generation.
//
// A storybook used to die if one call to one provider hiccuped: a single
// `fetch failed` — a transport blip, not a model refusal — returned 502 and the
// parent got nothing. Generating story JSON is not a capability only one
// provider has, so it should never be a single point of failure.
//
// Order is Gemini → Claude Haiku → GPT-4.1-mini. Gemini stays first so output
// is consistent with everything already produced; the others exist so a
// temporary failure costs a second or two instead of the whole book.
// ---------------------------------------------------------------------------

export type TextProviderId = "gemini" | "claude" | "openai";

export type TextAttempt = {
  provider: TextProviderId;
  attempt: number;
  ok: boolean;
  ms: number;
  /** Why it failed, short enough to log. Absent when it succeeded. */
  error?: string;
  /** Whether the failure was worth retrying on the same provider. */
  retryable?: boolean;
};

export type JsonResult<T> = {
  data: T;
  /** Which provider actually produced the result. */
  provider: TextProviderId;
  /** Every attempt made, in order — the audit trail for a degraded run. */
  attempts: TextAttempt[];
};

export class AllProvidersFailedError extends Error {
  readonly attempts: TextAttempt[];
  constructor(attempts: TextAttempt[]) {
    const summary = attempts
      .map((a) => `${a.provider}#${a.attempt}: ${a.error ?? "unknown"}`)
      .join(" | ");
    super(`all text providers failed — ${summary}`.slice(0, 600));
    this.name = "AllProvidersFailedError";
    this.attempts = attempts;
  }
}

/**
 * A failure worth retrying on the *same* provider: the request never really
 * got a verdict. Transport errors, timeouts, rate limits and 5xx qualify.
 *
 * A 4xx (bad key, malformed request, content refusal) will fail identically
 * however many times we send it, so those move straight to the next provider.
 */
function isRetryable(err: unknown): boolean {
  if (err instanceof HttpStatusError) return err.status === 429 || err.status >= 500;
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network|aborted|timeout|TimeoutError|AbortError/i.test(
    msg,
  );
}

class HttpStatusError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpStatusError";
    this.status = status;
  }
}

function short(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).slice(0, 200);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pull the first JSON object out of a response that may be wrapped in prose. */
function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON object in response");
    return JSON.parse(match[0]);
  }
}

// --- provider implementations ---------------------------------------------

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function callGemini(prompt: string, maxOutputTokens: number, timeoutMs: number): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(
    `${GEMINI_BASE}/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          // Thinking tokens bill against maxOutputTokens on this model and will
          // consume the whole budget before writing any JSON.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HttpStatusError(
      res.status,
      (data as { error?: { message?: string } } | null)?.error?.message ?? `HTTP ${res.status}`,
    );
  }
  const text = ((data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null)
    ?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  if (!text) throw new Error("empty response");
  return extractJson(text);
}

async function callClaude(
  prompt: string,
  schema: Record<string, unknown>,
  maxTokens: number,
  timeoutMs: number,
): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: timeoutMs });

  let message;
  try {
    // Structured outputs constrain the response to the schema, so there is no
    // prose to scrape and no "no story returned" failure mode.
    message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema } },
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError && typeof e.status === "number") {
      throw new HttpStatusError(e.status, e.message);
    }
    throw e;
  }

  if (message.stop_reason === "refusal") throw new Error("model declined the request");
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text) throw new Error("empty response");
  return extractJson(text);
}

async function callOpenAI(
  prompt: string,
  schema: Record<string, unknown>,
  maxTokens: number,
  timeoutMs: number,
): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "story", strict: true, schema },
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HttpStatusError(
      res.status,
      (data as { error?: { message?: string } } | null)?.error?.message ?? `HTTP ${res.status}`,
    );
  }
  const text =
    (data as { choices?: Array<{ message?: { content?: string } }> } | null)?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("empty response");
  return extractJson(text);
}

// --- the chain -------------------------------------------------------------

export type GenerateJsonOptions<T> = {
  prompt: string;
  /** JSON Schema used by the providers that support constrained output. */
  schema: Record<string, unknown>;
  maxTokens?: number;
  timeoutMs?: number;
  /** Attempts per provider before moving to the next one. */
  attemptsPerProvider?: number;
  /** Provider order. Defaults to Gemini → Claude → OpenAI. */
  order?: TextProviderId[];
  /**
   * Turn a raw parsed object into the shape the caller needs. Throwing here is
   * treated as a provider failure, so a structurally valid but useless response
   * (no pages, wrong shape) falls through to the next provider rather than
   * being handed back to the user.
   */
  validate: (raw: unknown) => T;
  onAttempt?: (attempt: TextAttempt) => void;
};

const DEFAULT_ORDER: TextProviderId[] = ["gemini", "claude", "openai"];

/** Is this provider usable at all? Skipped without burning an attempt if not. */
export function textProviderConfigured(id: TextProviderId): boolean {
  if (id === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (id === "claude") return Boolean(process.env.ANTHROPIC_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateJson<T>(opts: GenerateJsonOptions<T>): Promise<JsonResult<T>> {
  const {
    prompt,
    schema,
    maxTokens = 4096,
    timeoutMs = 90_000,
    attemptsPerProvider = 2,
    order = DEFAULT_ORDER,
    validate,
    onAttempt,
  } = opts;

  const attempts: TextAttempt[] = [];

  for (const provider of order) {
    if (!textProviderConfigured(provider)) {
      const rec: TextAttempt = {
        provider,
        attempt: 0,
        ok: false,
        ms: 0,
        error: "not configured",
        retryable: false,
      };
      attempts.push(rec);
      onAttempt?.(rec);
      continue;
    }

    for (let attempt = 1; attempt <= attemptsPerProvider; attempt++) {
      const started = Date.now();
      try {
        const raw =
          provider === "gemini"
            ? await callGemini(prompt, maxTokens, timeoutMs)
            : provider === "claude"
              ? await callClaude(prompt, schema, maxTokens, timeoutMs)
              : await callOpenAI(prompt, schema, maxTokens, timeoutMs);

        const data = validate(raw);
        const rec: TextAttempt = { provider, attempt, ok: true, ms: Date.now() - started };
        attempts.push(rec);
        onAttempt?.(rec);
        return { data, provider, attempts };
      } catch (e) {
        const retryable = isRetryable(e);
        const rec: TextAttempt = {
          provider,
          attempt,
          ok: false,
          ms: Date.now() - started,
          error: short(e),
          retryable,
        };
        attempts.push(rec);
        onAttempt?.(rec);

        // A definitive rejection won't change on a re-send — move on now.
        if (!retryable) break;
        if (attempt < attemptsPerProvider) await sleep(600 * attempt);
      }
    }
  }

  throw new AllProvidersFailedError(attempts);
}
