import { NextResponse } from "next/server";
import { PayloadTooLarge, clientId, createDailyLimiter, readJsonLimited } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 300;

// Every call here starts a paid Veo render, so it must be metered.
const limiter = createDailyLimiter(Number(process.env.VIDEO_DAILY_LIMIT ?? 5));
// Uploaded photos arrive base64-encoded in the JSON body.
const MAX_BODY = 12 * 1024 * 1024;

const VEO_MODEL = "veo-3.1-fast-generate-preview";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STYLE = "Photoreal, natural expressive motion, cinematic lighting, smooth camera, high quality, 4k.";

async function startVeo(key: string, prompt: string, imageBase64: string, mimeType: string, tries = 3): Promise<string> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(`${BASE}/models/${VEO_MODEL}:predictLongRunning?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: `${prompt}\n\n${STYLE}`, image: { bytesBase64Encoded: imageBase64, mimeType } }],
        parameters: { aspectRatio: "9:16" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (res.ok && data.name) return data.name as string;
    const msg = data?.error?.message || `Veo start failed (${res.status}).`;
    if ((res.status === 429 || /quota|rate limit|resource has been exhausted/i.test(msg)) && attempt < tries) {
      await sleep(20000);
      continue;
    }
    throw new Error(msg);
  }
  throw new Error("Veo start failed.");
}

async function awaitVeo(key: string, op: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await sleep(8000);
    const res = await fetch(`${BASE}/${op}?key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(30000) });
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

  let imageBase64: string, mimeType: string, prompt: string;
  try {
    const body = (await readJsonLimited(req, MAX_BODY)) as Record<string, unknown>;
    imageBase64 = String(body.imageBase64 ?? "");
    mimeType = String(body.mimeType || "image/jpeg");
    prompt = String(body.prompt ?? "").trim();
    if (!imageBase64) throw new Error("no image");
    if (!prompt) prompt = "The person in the photo comes to life with natural, expressive motion.";
  } catch (e) {
    limiter.refund(id); // nothing was rendered — don't charge the quota unit
    if (e instanceof PayloadTooLarge) {
      return NextResponse.json({ error: "That photo is too large. Try one under 10MB." }, { status: 413 });
    }
    return NextResponse.json({ error: "Please upload a photo first." }, { status: 400 });
  }

  try {
    const op = await startVeo(key, prompt, imageBase64, mimeType);
    const uri = await awaitVeo(key, op);

    const r = await fetch(`${uri}&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(90000) });
    const buf = Buffer.from(await r.arrayBuffer());

    return NextResponse.json({
      ok: true,
      remainingToday,
      videoUrl: `data:video/mp4;base64,${buf.toString("base64")}`,
    });
  } catch (e) {
    limiter.refund(id); // render failed — give the quota unit back
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 502 });
  }
}
