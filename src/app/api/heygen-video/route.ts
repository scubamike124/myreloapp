import { asRecord, asString, childRecord, errorMessage } from "@/lib/json";
import { NextResponse } from "next/server";
import { chargeFor, refundCharge, refundLater } from "@/lib/charge";
import { clampDurationSeconds } from "@/lib/token-costs";
import { DEFAULT_REELO_VOICE_ID } from "@/lib/reelo-avatar-eligibility";
import { validateHeygenProductionSubmission } from "@/lib/validate-heygen-production";

export const runtime = "nodejs";
// Status poll may download + re-host the finished MP4 so playback keeps audio.
export const maxDuration = 120;

// One durable URL per HeyGen video id for this isolate — avoids re-downloading
// the full file on every 5s client poll after completion.
const finalizedUrls = new Map<string, string>();
// Remember which product charged the job so async failures refund correctly.
const chargedActionByVideo = new Map<string, string>();
const chargedAmountByVideo = new Map<string, number>();

/** Prefer durable storage; fall back to the provider URL for playback.
 *
 * We used to wrap HeyGen CDN links in `/api/media/remote`, but Cloudflare
 * Workers receive HTTP 403 from HeyGen's signed CDN (IP / bot filtering). That
 * made the player load a 40-byte JSON error and look like a silent/broken video
 * even though the real MP4 has an audio track. The browser can fetch the
 * signed URL directly; Workers often cannot. The browser then POSTs bytes to
 * /api/media/ingest for same-origin playback.
 */
async function durablePlaybackUrl(videoId: string, providerUrl: string): Promise<{ url: string; durable: boolean }> {
  const cached = finalizedUrls.get(videoId);
  if (cached) return { url: cached, durable: !/^https?:\/\/[^/]*heygen\./i.test(cached) };

  // Never call store(providerUrl) on Workers — that fetches HeyGen and 403s.
  // Client materialize + ingest is the durable path.
  finalizedUrls.set(videoId, providerUrl);
  return { url: providerUrl, durable: false };
}

const HEYGEN_BASE = "https://api.heygen.com";

// --- Tunables (overridable via .env.local) ---------------------------------
const DAILY_LIMIT = Number(process.env.HEYGEN_DAILY_LIMIT ?? 5); // videos per user/day
const MAX_SECONDS = Number(process.env.HEYGEN_MAX_SECONDS ?? 30); // hard cap on clip length
// HeyGen avatar videos have no "duration" param — length is driven by how much
// text the voice speaks. At a natural ~2.7 words/sec, seconds map to a word budget.
const WORDS_PER_SECOND = 2.7;

/** No default Abigail / desk / sofa — client must pass a registry avatar, or we stop. */
const DEFAULT_VOICE_ID = DEFAULT_REELO_VOICE_ID;
const DEFAULT_SCRIPT =
  "Welcome to Reelo, where your ideas become studio-quality videos in minutes. " +
  "No cameras, no crews, no editing — just type your message and press generate. " +
  "It's the fastest way to turn words into content your audience will love. " +
  "Try it today and see what you can create.";

// --- Best-effort per-IP daily rate limit -----------------------------------
type Bucket = { day: string; count: number };
const buckets = new Map<string, Bucket>();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

function consume(id: string): number | null {
  const day = todayUTC();
  let b = buckets.get(id);
  if (!b || b.day !== day) {
    b = { day, count: 0 };
    buckets.set(id, b);
  }
  if (b.count >= DAILY_LIMIT) return null;
  b.count += 1;
  return DAILY_LIMIT - b.count;
}

function refund(id: string) {
  const b = buckets.get(id);
  if (b) b.count = Math.max(0, b.count - 1);
}

/** Fit the script to the customer's chosen length (longer = more tokens). */
function capScript(
  raw: string,
  targetSeconds: number,
  hardMaxSeconds: number,
): { script: string; truncated: boolean; expanded: boolean; targetSeconds: number; maxSeconds: number } {
  const seconds = Math.min(hardMaxSeconds, Math.max(10, targetSeconds));
  const maxWords = Math.floor(seconds * WORDS_PER_SECOND);
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return {
      script: DEFAULT_SCRIPT.split(/\s+/).slice(0, maxWords).join(" "),
      truncated: false,
      expanded: true,
      targetSeconds: seconds,
      maxSeconds: hardMaxSeconds,
    };
  }
  if (words.length > maxWords) {
    return {
      script: words.slice(0, maxWords).join(" "),
      truncated: true,
      expanded: false,
      targetSeconds: seconds,
      maxSeconds: hardMaxSeconds,
    };
  }
  if (words.length >= Math.floor(maxWords * 0.8)) {
    return {
      script: words.join(" "),
      truncated: false,
      expanded: false,
      targetSeconds: seconds,
      maxSeconds: hardMaxSeconds,
    };
  }
  const base = words.join(" ");
  const filler =
    " Here's why it matters: it saves you time, looks professional on camera, " +
    "and helps your audience understand the offer clearly. Stick with us for the " +
    "key details, then take the next step today. We'll keep it simple, useful, " +
    "and easy to act on — so you can share this message with confidence.";
  let expanded = `${base}${filler}`;
  const expandedWords = expanded.split(/\s+/).filter(Boolean);
  if (expandedWords.length > maxWords) {
    expanded = expandedWords.slice(0, maxWords).join(" ");
  }
  return {
    script: expanded,
    truncated: false,
    expanded: true,
    targetSeconds: seconds,
    maxSeconds: hardMaxSeconds,
  };
}

async function heygen(path: string, init: RequestInit, key: string) {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: { "X-Api-Key": key, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  const data = asRecord(await res.json().catch(() => ({})));
  return { res, data } as const;
}

export async function GET(req: Request) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "HEYGEN_API_KEY is not set in .env.local" }, { status: 500 });

  const videoId = new URL(req.url).searchParams.get("video_id");

  if (videoId) {
    const { res, data } = await heygen(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, { method: "GET" }, key);
    if (!res.ok) return NextResponse.json({ ok: false, error: (asString(data.message) || "Status lookup failed.") }, { status: 502 });
    const d = childRecord(data, "data");

    if (d.status === "failed") {
      const action = chargedActionByVideo.get(videoId) || "ai-avatar-studio";
      await refundLater(action, `heygen:${videoId}`, chargedAmountByVideo.get(videoId));
    }

    let videoUrl: string | null = asString(d.video_url) || null;
    let durable = false;
    const providerUrl: string | null = videoUrl;
    if (d.status === "completed" && videoUrl) {
      const ready = await durablePlaybackUrl(videoId, videoUrl);
      videoUrl = ready.url;
      durable = ready.durable;
    }

    return NextResponse.json({
      ok: true,
      videoId,
      status: d.status,
      videoUrl,
      providerUrl,
      durable,
      thumbnailUrl: d.thumbnail_url ?? null,
      duration: d.duration ?? null,
      error: d.error ?? null,
      // VQOS: provider completion ≠ publish authorization
      publishAuthorized: false,
      publishGate: "assertPublishable required before delivery, scheduling, or publication",
    });
  }

  const { res, data } = await heygen("/v2/user/remaining_quota", { method: "GET" }, key);
  return NextResponse.json({
    ok: res.ok,
    config: { dailyLimit: DAILY_LIMIT, maxSeconds: MAX_SECONDS },
    remainingQuota: childRecord(data, "data").remaining_quota ?? null,
  });
}

export async function POST(req: Request) {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return NextResponse.json({ error: "HEYGEN_API_KEY is not set in .env.local" }, { status: 500 });

  const id = clientId(req);
  const remainingToday = consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${DAILY_LIMIT} videos per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  let body: {
    script?: string;
    avatarId?: string;
    voiceId?: string;
    width?: number;
    height?: number;
    action?: string;
    seconds?: number;
    videoType?: string;
    engine?: string;
    estimatedCostUsd?: number;
    maximumAuthorizedCostUsd?: number;
    premiumUpgradeAllowed?: boolean;
    platform?: string;
  } = {};
  try {
    const raw: unknown = await req.json();
    const rec = asRecord(raw);
    body = {
      script: asString(rec.script) || undefined,
      avatarId: asString(rec.avatarId) || undefined,
      voiceId: asString(rec.voiceId) || undefined,
      width: typeof rec.width === "number" ? rec.width : undefined,
      height: typeof rec.height === "number" ? rec.height : undefined,
      action: asString(rec.action) || undefined,
      seconds: typeof rec.seconds === "number" ? rec.seconds : Number(rec.seconds) || undefined,
      videoType: asString(rec.videoType) || undefined,
      engine: asString(rec.engine) || undefined,
      estimatedCostUsd: typeof rec.estimatedCostUsd === "number" ? rec.estimatedCostUsd : undefined,
      maximumAuthorizedCostUsd:
        typeof rec.maximumAuthorizedCostUsd === "number" ? rec.maximumAuthorizedCostUsd : undefined,
      premiumUpgradeAllowed: rec.premiumUpgradeAllowed === true,
      platform: asString(rec.platform) || undefined,
    };
  } catch {
    /* empty body → use defaults */
  }

  const action = body.action === "website-commercial" ? "website-commercial" : "ai-avatar-studio";
  const seconds = clampDurationSeconds(action, body.seconds ?? (action === "website-commercial" ? 30 : 20));
  // Website commercials may run longer than the default avatar cap.
  const hardMax = action === "website-commercial" ? Math.max(MAX_SECONDS, 300) : Math.max(MAX_SECONDS, 900);
  const { script, truncated, expanded, targetSeconds, maxSeconds } = capScript(
    body.script?.trim() || DEFAULT_SCRIPT,
    seconds,
    hardMax,
  );

  const w = body.width ?? 1280;
  const h = body.height ?? 720;
  const aspectRatio = Math.abs(w / h - 9 / 16) < 0.08 ? "9:16" : Math.abs(w / h - 16 / 9) < 0.08 ? "16:9" : `${w}x${h}`;

  const planGate = validateHeygenProductionSubmission({
    videoType:
      body.videoType ||
      (action === "website-commercial" ? "tv_commercial" : "social_short"),
    avatarId: body.avatarId,
    engine: body.engine || "avatar_iii",
    estimatedCostUsd: body.estimatedCostUsd,
    maximumAuthorizedCostUsd: body.maximumAuthorizedCostUsd,
    premiumUpgradeAllowed: body.premiumUpgradeAllowed,
    aspectRatio,
    platform: body.platform || (action === "website-commercial" ? "web" : "tiktok"),
    script,
  });
  if (!planGate.ok) {
    refund(id);
    return NextResponse.json(
      {
        error: `PAID_RENDER_BLOCKED: ${planGate.failures.join(" | ")}`,
        failures: planGate.failures,
        videoType: planGate.videoType,
      },
      { status: 400 },
    );
  }
  const avatarId = planGate.avatarId!;
  const voiceId = body.voiceId?.trim() || planGate.voiceId || DEFAULT_VOICE_ID;

  const charged = await chargeFor(action, { seconds });
  if (!charged.ok) {
    refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

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
          dimension: { width: w, height: h },
        }),
      },
      key,
    );

    const videoId = childRecord(data, "data").video_id;
    if (!res.ok || !videoId) {
      refund(id);
      await refundCharge(charged.charge);
      const msg = errorMessage(data, "") || (asString(data.message) || `HeyGen generate failed (${res.status}).`);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    chargedActionByVideo.set(String(videoId), action);
    if (charged.charge.charged > 0) chargedAmountByVideo.set(String(videoId), charged.charge.charged);

    return NextResponse.json({
      ok: true,
      videoId,
      status: "processing",
      remainingToday,
      seconds,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      script,
      truncated,
      expanded,
      maxSeconds,
      targetSeconds,
      videoType: planGate.videoType,
      avatarId,
      publishAuthorized: false,
      poll: `/api/heygen-video?video_id=${videoId}`,
    });
  } catch (e) {
    refund(id);
    await refundCharge(charged.charge);
    return NextResponse.json({ error: e instanceof Error ? e.message : "HeyGen video generation failed." }, { status: 502 });
  }
}
