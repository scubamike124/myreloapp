// ---------------------------------------------------------------------------
// Illustration provider chain.
//
// Gemini stays the primary and does the work for every page in a normal run:
// it is the only provider here that can take the child's photograph and draw
// that same child consistently across every page, which is the whole point of
// the product. Another provider is used only when Gemini has actually failed.
//
// The fallback is deliberately narrower. It draws the *scene* from the story's
// own description and does not receive the child's photograph, so it cannot
// place the child in the picture. That is a real reduction in what the page
// delivers, so it is reported per page (`personalised: false`) rather than
// quietly passed off as the same thing.
// ---------------------------------------------------------------------------

export type ImageProviderId = "gemini" | "openai";

export type IllustrationResult = {
  /** data: URL, or "" when every provider failed. A page with no art is still readable. */
  image: string;
  provider: ImageProviderId | null;
  /** False when the art is a generic scene rather than the child as the hero. */
  personalised: boolean;
  errors: string[];
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const OPENAI_IMAGE_MODEL = "chatgpt-image-latest";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 160);

export function imageProviderConfigured(id: ImageProviderId): boolean {
  return id === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
}

async function geminiIllustrate(params: {
  prompt: string;
  photo: string;
  mimeType: string;
  timeoutMs: number;
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(
    `${GEMINI_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: params.prompt },
              { inline_data: { mime_type: params.mimeType, data: params.photo } },
            ],
          },
        ],
        generationConfig: { temperature: 0.8 },
      }),
      signal: AbortSignal.timeout(params.timeoutMs),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
  }
  const data = await res.json();
  const part = (data?.candidates?.[0]?.content?.parts ?? []).find(
    (p: Record<string, unknown>) => p.inlineData || p.inline_data,
  );
  const payload = (part?.inlineData || part?.inline_data) as
    | { data?: string; mimeType?: string }
    | undefined;
  if (!payload?.data) throw new Error("no image in response");
  return `data:${payload.mimeType ?? "image/png"};base64,${payload.data}`;
}

async function openaiIllustrate(params: { prompt: string; timeoutMs: number }): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: params.prompt.slice(0, 3800),
      n: 1,
      size: "1024x1024",
    }),
    signal: AbortSignal.timeout(params.timeoutMs),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  }
  const first = data?.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) {
    const img = await fetch(first.url, { signal: AbortSignal.timeout(params.timeoutMs) });
    if (!img.ok) throw new Error(`image download HTTP ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
  throw new Error("no image in response");
}

export type IllustrateOptions = {
  /** Prompt including the child-likeness instruction — Gemini only. */
  personalisedPrompt: string;
  /** Scene-only prompt with no reference to a real person — used by the fallback. */
  scenePrompt: string;
  photo: string;
  mimeType: string;
  geminiAttempts?: number;
  timeoutMs?: number;
  /** Allow the non-personalised fallback. */
  allowFallback?: boolean;
};

/**
 * Illustrate one page. Never throws — a page without art is still readable, so
 * total failure returns an empty image rather than taking the book down.
 */
export async function illustratePage(opts: IllustrateOptions): Promise<IllustrationResult> {
  const {
    personalisedPrompt,
    scenePrompt,
    photo,
    mimeType,
    geminiAttempts = 3,
    timeoutMs = 120_000,
    allowFallback = true,
  } = opts;

  const errors: string[] = [];

  if (imageProviderConfigured("gemini")) {
    for (let attempt = 1; attempt <= geminiAttempts; attempt++) {
      try {
        const image = await geminiIllustrate({ prompt: personalisedPrompt, photo, mimeType, timeoutMs });
        return { image, provider: "gemini", personalised: true, errors };
      } catch (e) {
        errors.push(`gemini#${attempt}: ${short(e)}`);
        // The image model returns 503 "high demand" under load; backing off
        // rather than hammering is what usually gets the page drawn.
        if (attempt < geminiAttempts) await sleep(2500 * attempt);
      }
    }
  } else {
    errors.push("gemini: not configured");
  }

  if (allowFallback && imageProviderConfigured("openai")) {
    try {
      const image = await openaiIllustrate({ prompt: scenePrompt, timeoutMs });
      return { image, provider: "openai", personalised: false, errors };
    } catch (e) {
      errors.push(`openai: ${short(e)}`);
    }
  }

  return { image: "", provider: null, personalised: false, errors };
}
