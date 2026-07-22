import { NextResponse } from "next/server";
import { chargeFor, refundCharge, refundLater } from "@/lib/charge";

export const runtime = "nodejs";
export const maxDuration = 60; // submit + status are fast; no long blocking poll.

const HEYGEN_BASE = "https://api.heygen.com";

// --- Tunables (overridable via .env.local) ---------------------------------
const DAILY_LIMIT = Number(process.env.HEYGEN_DAILY_LIMIT ?? 5); // videos per user/day
const MAX_SECONDS = Number(process.env.HEYGEN_MAX_SECONDS ?? 30); // hard cap on clip length
// HeyGen avatar videos have no "duration" param — length is driven by how much
// text the voice speaks. At a natural ~2.7 words/sec, MAX_SECONDS maps to a word
// budget we truncate the script to, keeping every clip at/under the cap.
const WORDS_PER_SECOND = 2.7;
const MAX_WORDS = Math.floor(MAX_SECONDS * WORDS_PER_SECOND);

// Sensible defaults (real IDs from this account, verified to render together).
// NOTE: use a STANDARD TTS voice — "voice-design" preview voices have no
// VideoTTS mapping to avatars and cause "No VideoTTS mapping" render failures.
const DEFAULT_AVATAR_ID = "Abigail_expressive_2024112501";
const DEFAULT_VOICE_ID = "f8c69e517f424cafaecde32dde57096b"; // Allison (English) — verified with Abigail
const DEFAULT_SCRIPT =
  "Welcome to Reelo, where your ideas become studio-quality videos in minutes. " +
  "No cameras, no crews, no editing — just type your message and press generate. " +
  "It's the fastest way to turn words into content your audience will love. " +
  "Try it today and see what you can create.";

// --- Best-effort per-IP daily rate limit -----------------------------------
// In-memory: resets on server restart / serverless cold start. Good enough for
// dev and single-instance hosting; swap for Vercel KV / Redis / a DB for a
// durable production limit shared across instances.
type Bucket = { day: string; count: number };
const buckets = new Map<string, Bucket>();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC daily window)
}

function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

// Increments and returns remaining, or null if the daily cap is already reached.
// Checks the cap BEFORE consuming so it is correct for any limit (including 0).
function consume(id: string): number | null {
  const day = todayUTC();
  let b = buckets.get(id);
  if (!b || b.day !== day) {
    b = { day, count: 0 };
    buckets.set(id, b);
  }
  if (b.count >= DAILY_LIMIT) return null; // already at/over the cap → deny
  b.count += 1;
  return DAILY_LIMIT - b.count;
}

function refund(id: string) {
  const b = buckets.get(id);
  if (b) b.count = Math.max(0, b.count - 1);
}

// Truncate the script to the word budget so the spoken clip stays <= MAX_SECONDS.
function capScript(raw: string): { script: string; truncated: boolean } {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS) return { script: words.join(" "), truncated: false };
  return { script: words.slice(0, MAX_WORDS).join(" "), truncated: true };
}

async function heygen(path: string, init: RequestInit, key: string) {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: { "X-Api-Key": key, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data } as const;
}

// GET — two modes:
//   /api/heygen-video                    → diagnostic: config + remaining account quota
//   /api/heygen-video?video_id=<id>      → poll: status + final video_url when ready
export async function GET(req: Request) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "HEYGEN_API_KEY is not set in .env.local" }, { status: 500 });

  const videoId = new URL(req.url).searchParams.get("video_id");

  if (videoId) {
    const { res, data } = await heygen(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, { method: "GET" }, key);
    if (!res.ok) return NextResponse.json({ ok: false, error: data?.message || "Status lookup failed." }, { status: 502 });
    const d = data?.data ?? {};

    // HeyGen fails asynchronously, long after the POST that started the job
    // returned, so the refund has to happen here. Keyed on the video id, which
    // makes it idempotent — the client polls this endpoint every few seconds
    // and would otherwise be refunded once per poll.
    if (d.status === "failed") {
      await refundLater("ai-avatar-studio", `heygen:${videoId}`);
    }

    return NextResponse.json({
      ok: true,
      videoId,
      status: d.status, // "processing" | "completed" | "failed" | "pending" | "waiting"
      videoUrl: d.video_url ?? null,
      thumbnailUrl: d.thumbnail_url ?? null,
      duration: d.duration ?? null,
      error: d.error ?? null,
    });
  }

  const { res, data } = await heygen("/v2/user/remaining_quota", { method: "GET" }, key);
  return NextResponse.json({
    ok: res.ok,
    config: { dailyLimit: DAILY_LIMIT, maxSeconds: MAX_SECONDS, maxWords: MAX_WORDS },
    remainingQuota: data?.data?.remaining_quota ?? null,
  });
}

// POST — submit an avatar video and return immediately (async).
// Body: { script?, avatarId?, voiceId?, width?, height? }
// Response: { videoId, status: "processing", remainingToday, script, truncated }
// Poll GET /api/heygen-video?video_id=<videoId> until status === "completed".
export async function POST(req: Request) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return NextResponse.json({ error: "HEYGEN_API_KEY is not set in .env.local" }, { status: 500 });

  // 1. Daily per-user limit.
  const id = clientId(req);
  const remainingToday = consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${DAILY_LIMIT} videos per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  // 2. Parse + cap the script to the max duration.
  let body: { script?: string; avatarId?: string; voiceId?: string; width?: number; height?: number; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body → use defaults */
  }
  const { script, truncated } = capScript(body.script?.trim() || DEFAULT_SCRIPT);
  const avatarId = body.avatarId?.trim() || DEFAULT_AVATAR_ID;
  const voiceId = body.voiceId?.trim() || DEFAULT_VOICE_ID;

  // Both tools that use this route cost the same, so an unexpected value
  // cannot mis-bill; the distinction only makes the ledger readable.
  const action = body.action === "website-commercial" ? "website-commercial" : "ai-avatar-studio";

  // 3. Charge before submitting: HeyGen deducts its own credits the moment the
  //    job is accepted, so waiting for completion would mean spending their
  //    credits without spending the customer's tokens.
  const charged = await chargeFor(action);
  if (!charged.ok) {
    refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  // 4. Kick off generation and return the id right away.
  try {
    const { res, data } = await heygen(
      "/v2/video/generate",
      {
        method: "POST",
        body: JSON.stringify({
          video_inputs: [
            {
              character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
              voice: { type: "text", input_text: script, voice_id: voiceId },
            },
          ],
          dimension: { width: body.width ?? 1280, height: body.height ?? 720 },
        }),
      },
      key,
    );

    const videoId = data?.data?.video_id;
    if (!res.ok || !videoId) {
      refund(id); // no video was actually created — give the quota unit back
      await refundCharge(charged.charge); // and the customer's tokens with it
      const msg = data?.error?.message || data?.message || `HeyGen generate failed (${res.status}).`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      videoId,
      status: "processing",
      remainingToday,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      script,
      truncated,
      maxSeconds: MAX_SECONDS,
      poll: `/api/heygen-video?video_id=${videoId}`,
    });
  } catch (e) {
    refund(id);
    await refundCharge(charged.charge);
    return NextResponse.json({ error: e instanceof Error ? e.message : "HeyGen video generation failed." }, { status: 502 });
  }
}
