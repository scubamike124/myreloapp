import { NextResponse } from "next/server";
import {
  PayloadTooLarge,
  UnsafeUrlError,
  assertSafeUrl,
  clientId,
  createDailyLimiter,
  readJsonLimited,
} from "@/lib/api-guard";
import { chargeFor, refundCharge } from "@/lib/charge";
import { scrapePage } from "@/lib/scrape";

// ---------------------------------------------------------------------------
// Product Commercial.
//
// A photo of the thing you sell becomes a short cinematic ad for it.
//
// Not the same tool as Website Commercial, which puts a HeyGen presenter on
// screen to talk about a business. Here the product IS the shot: the uploaded
// image is animated directly by Veo, so what the customer sees moving is their
// own product rather than a stock spokesperson holding something.
//
// A product URL is optional and only informs the writing — the image is what
// gets animated, so there is nothing to render without one.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXT_MODEL = "gemini-2.5-flash";
const VEO_MODEL = "veo-3.1-fast-generate-preview";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 6);

const MAX_BODY = 12 * 1024 * 1024;
const limiter = createDailyLimiter(Number(process.env.VIDEO_DAILY_LIMIT ?? 5));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Camera and lighting language per look, so "Neon" means something specific. */
const LOOKS: Record<string, string> = {
  Studio:
    "seamless studio backdrop, controlled softbox lighting, slow orbiting camera move, crisp product focus, premium commercial photography",
  Lifestyle:
    "warm natural daylight, real home or cafe setting, shallow depth of field, gentle handheld drift, aspirational lifestyle advertising",
  Outdoor:
    "golden-hour sunlight, open natural landscape, lens flare, slow push-in, adventurous outdoor brand film",
  Neon: "dark scene lit by saturated neon rims of magenta and cyan, wet reflective surface, slow dolly, high-contrast night commercial",
  "Marble & Gold":
    "polished white marble surface, brushed gold accents, soft luxury key light, slow elegant rotation, high-end luxury advertising",
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

async function startVeo(key: string, prompt: string, imageBase64: string, mimeType: string, tries = 3): Promise<string> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(`${BASE}/models/${VEO_MODEL}:predictLongRunning?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt, image: { bytesBase64Encoded: imageBase64, mimeType } }],
        // Same 6s as the other Veo tools: it is a direct cost lever ($0.60 at
        // the Fast 720p rate) and a natural length for a social ad.
        parameters: { aspectRatio: "9:16", durationSeconds: VIDEO_SECONDS },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    if (res.ok && data.name) return data.name as string;
    const msg = data?.error?.message || `Veo start failed (${res.status}).`;
    if ((res.status === 429 || /quota|rate limit|resource has been exhausted/i.test(msg)) && attempt < tries) {
      await sleep(20_000);
      continue;
    }
    throw new Error(msg);
  }
  throw new Error("Veo start failed.");
}

async function awaitVeo(key: string, op: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await sleep(8000);
    const res = await fetch(`${BASE}/${op}?key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(30_000) });
    const data = await res.json();
    if (data.done) {
      if (data.error) throw new Error(data.error.message || "Generation failed.");
      const uri = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error("Veo returned no video.");
      return uri;
    }
  }
  throw new Error("Generation timed out.");
}

type Concept = { headline: string; voiceover: string; caption: string; shot: string };

/**
 * The ad concept. Written from the product photo itself, so the shot direction
 * describes the actual object rather than a generic product.
 */
async function writeConcept(
  key: string,
  imageBase64: string,
  mimeType: string,
  productName: string,
  details: string,
  pageText: string,
  look: string,
  music: string,
): Promise<Concept> {
  const prompt =
    `You are a commercial director writing a ${VIDEO_SECONDS}-second social advert for the product in the attached photograph.\n\n` +
    (productName ? `Product: ${productName}\n` : "") +
    (details ? `What the seller says about it: ${details}\n` : "") +
    (pageText ? `From the product page:\n${pageText}\n` : "") +
    `Visual look: ${look} — ${LOOKS[look] ?? LOOKS.Studio}\n` +
    `Music mood: ${music}\n\n` +
    `Return ONLY JSON, no markdown fence:\n` +
    `{"headline": "...", "voiceover": "...", "caption": "...", "shot": "..."}\n\n` +
    `- "headline": 2 to 5 words. The hook on screen.\n` +
    `- "voiceover": one sentence a narrator can read in about ${VIDEO_SECONDS} seconds.\n` +
    `- "caption": a short social caption with 3 to 5 relevant hashtags.\n` +
    `- "shot": camera direction for a ${VIDEO_SECONDS}-second clip of THIS product, in the look above. ` +
    `Describe the movement, the lighting and the framing. Keep the product exactly as it appears in the ` +
    `photograph — do not restyle, relabel or redesign it. No people, no text, no logos added.\n` +
    `- Claim nothing about the product that the seller has not said. No invented statistics, prices or awards.`;

  const res = await fetch(`${BASE}/models/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
      // Thinking is billed against maxOutputTokens on this model and will spend
      // the whole budget before writing any JSON.
      generationConfig: { temperature: 0.9, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no concept returned");
  const parsed = JSON.parse(match[0]);
  return {
    headline: str(parsed.headline, 80),
    voiceover: str(parsed.voiceover, 300),
    caption: str(parsed.caption, 400),
    shot: str(parsed.shot, 900),
  };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${limiter.limit} videos per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return NextResponse.json(
      { error: tooBig ? "That image is too large. Try one under 10MB." : "Invalid request." },
      { status: tooBig ? 413 : 400 },
    );
  }

  const imageBase64 = str(body.imageBase64, 16_000_000);
  const mimeType = str(body.mimeType, 60) || "image/jpeg";
  if (!imageBase64) {
    limiter.refund(id);
    return NextResponse.json({ error: "Upload a photo of your product to start." }, { status: 400 });
  }

  const productName = str(body.productName, 80);
  const details = str(body.details, 600);
  const look = LOOKS[str(body.look, 40)] ? str(body.look, 40) : "Studio";
  const music = str(body.music, 40) || "Upbeat";

  // Optional, and never fatal: the video comes from the photo, so a page that
  // will not load costs the customer nothing but a little extra copy quality.
  let pageText = "";
  const rawUrl = str(body.url, 500);
  if (rawUrl) {
    try {
      const safe = await assertSafeUrl(rawUrl);
      pageText = await scrapePage(safe, 4000);
    } catch (e) {
      if (e instanceof UnsafeUrlError) {
        limiter.refund(id);
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      pageText = "";
    }
  }

  const charged = await chargeFor("product-commercial");
  if (!charged.ok) {
    limiter.refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  try {
    const concept = await writeConcept(key, imageBase64, mimeType, productName, details, pageText, look, music);

    const veoPrompt =
      `${concept.shot}\n\n` +
      `${LOOKS[look]}. Photoreal product commercial, ${VIDEO_SECONDS} seconds, smooth cinematic camera, ` +
      `sharp focus on the product, high quality, 4k. The product must stay exactly as it appears in the ` +
      `reference image. No added text, no captions, no watermarks, no people.`;

    const op = await startVeo(key, veoPrompt, imageBase64, mimeType);
    const uri = await awaitVeo(key, op);

    const r = await fetch(`${uri}&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(90_000) });
    const buf = Buffer.from(await r.arrayBuffer());

    return NextResponse.json({
      ok: true,
      remainingToday,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      headline: concept.headline,
      voiceover: concept.voiceover,
      caption: concept.caption,
      // Shown to the customer so the video is not a black box: this is the
      // direction the model was actually given.
      shot: concept.shot,
      scannedPage: Boolean(pageText),
      videoUrl: `data:video/mp4;base64,${buf.toString("base64")}`,
    });
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge); // no advert was made — do not charge for one
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Product video generation failed." },
      { status: 502 },
    );
  }
}
