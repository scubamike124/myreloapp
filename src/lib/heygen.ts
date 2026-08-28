// ---------------------------------------------------------------------------
// HeyGen, on the v3 API.
//
// The v2 endpoint this app was built on returns a deprecation warning on every
// call: it is removed on 2026-10-31, and when it goes every avatar video in the
// product stops working. This is the migration, in one place, so there is a
// single thing to keep current instead of three routes each with their own copy.
//
// Two things about v3 are not obvious and cost an afternoon to find:
//
//   1. `type: "avatar"` defaults to the Avatar IV engine, which most of the
//      1,264 stock avatars do not support — it fails with "This video avatar
//      does not support Avatar IV video generation". The classic engine has to
//      be asked for explicitly, and `engine` is an OBJECT, not a string:
//      { type: "avatar_iii" }. A string returns "Input should be a valid
//      dictionary", which does not point at the answer.
//
//   2. Polling is GET /v3/videos/{id}. GET /v3/videos?video_id=... also returns
//      200, but it returns the whole account's video list with the one you
//      asked about first, which would work by accident and break silently.
//
// Measured as a bonus: the same render that took eight minutes on v2 completed
// in about forty-five seconds on v3.
// ---------------------------------------------------------------------------

const BASE = "https://api.heygen.com";

/** The engine the stock catalogue actually renders on. */
const CLASSIC_ENGINE = { type: "avatar_iii" } as const;

export class HeyGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeyGenError";
  }
}

function key(): string {
  const value = process.env.HEYGEN_API_KEY;
  if (!value) throw new HeyGenError("HEYGEN_API_KEY is not set");
  return value;
}

export type RenderRequest = {
  avatarId: string;
  script: string;
  voiceId: string;
  /** "9:16" | "1:1" | "16:9" | "4:5" | "5:4". */
  aspectRatio?: string;
  resolution?: "720p" | "1080p" | "4k";
  /** An asset id from uploadAsset. Omitted leaves the avatar's own background. */
  backgroundAssetId?: string | null;
};

/** Queue a render. Returns the video id to poll. */
export async function startRender(req: RenderRequest): Promise<string> {
  const body = {
    type: "avatar",
    avatar_id: req.avatarId,
    script: req.script,
    voice_id: req.voiceId,
    engine: CLASSIC_ENGINE,
    resolution: req.resolution ?? "720p",
    aspect_ratio: req.aspectRatio ?? "9:16",
    // `fit: "cover"` is not optional in practice. Without it the background is
    // placed at its own size behind the avatar and the rest of the frame is
    // left white — the render comes back as a person cut out and floating on a
    // white card, which is the single look the presenter brief rules out.
    ...(req.backgroundAssetId
      ? { background: { type: "image", asset_id: req.backgroundAssetId, fit: "cover" } }
      : {}),
  };

  let res: Response;
  let data: Record<string, unknown>;
  try {
    res = await fetch(`${BASE}/v3/videos`, {
      method: "POST",
      headers: { "X-Api-Key": key(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (e) {
    if (e instanceof HeyGenError) throw e;
    throw new HeyGenError("HeyGen did not answer");
  }

  const videoId = (data as { data?: { video_id?: string; id?: string } })?.data?.video_id;
  if (!res.ok || !videoId) {
    const message =
      (data as { error?: { message?: string }; message?: string })?.error?.message ??
      (data as { message?: string })?.message ??
      `HeyGen refused the render (${res.status})`;
    throw new HeyGenError(String(message).slice(0, 200));
  }
  return videoId;
}

export type RenderStatus =
  | { status: "processing" }
  | { status: "completed"; videoUrl: string; seconds: number | null }
  | { status: "failed"; error: string };

/** Check a render once. */
export async function checkRender(videoId: string): Promise<RenderStatus> {
  const res = await fetch(`${BASE}/v3/videos/${encodeURIComponent(videoId)}`, {
    headers: { "X-Api-Key": key() },
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { status?: string; video_url?: string; duration?: number; error?: { message?: string; detail?: string } };
  };
  if (!res.ok) return { status: "failed", error: `HeyGen status check failed (${res.status}).` };

  const state = data?.data?.status;
  if (state === "completed" && data.data?.video_url) {
    return { status: "completed", videoUrl: data.data.video_url, seconds: data.data.duration ?? null };
  }
  if (state === "failed") {
    return { status: "failed", error: data.data?.error?.detail ?? data.data?.error?.message ?? "The render failed." };
  }
  return { status: "processing" };
}

/**
 * Put an image in HeyGen's asset library and return its id.
 *
 * Uploading rather than linking matters: HeyGen has to fetch a background, and
 * generated frames live behind /api/media, which is localhost in development.
 * Handing over the bytes works the same on a laptop and in production.
 */
export async function uploadAsset(bytes: Uint8Array, mimeType: string): Promise<string | null> {
  try {
    const res = await fetch("https://upload.heygen.com/v1/asset", {
      method: "POST",
      headers: { "X-Api-Key": key(), "Content-Type": mimeType },
      body: bytes as BodyInit,
      signal: AbortSignal.timeout(60_000),
    });
    const data = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
    return res.ok ? (data?.data?.id ?? null) : null;
  } catch {
    return null;
  }
}

/** Video ids come back from the browser, so they are checked before use. */
export function isVideoId(value: string): boolean {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);
}
