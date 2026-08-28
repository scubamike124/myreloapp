// ---------------------------------------------------------------------------
// X (Twitter) — OAuth 2.0 (PKCE) + real publish via API v2 + the v1.1 chunked
// media upload endpoint (X has not moved media upload to v2; v2 tweets still
// reference media ids minted there — this is X's own current documented
// path, not a mixing of old and new by choice).
// ---------------------------------------------------------------------------

import { randomBytes, createHash } from "node:crypto";
import { absoluteUrl } from "@/lib/site";

const AUTH_BASE = "https://x.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const TWEETS_URL = "https://api.x.com/2/tweets";

function redirectUri(): string {
  return absoluteUrl("/api/admin/social/callback/x");
}

export function configured(): boolean {
  return Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET);
}

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) throw new Error("X_CLIENT_ID is not set.");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "tweet.read tweet.write users.read offline.access media.write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export type ExchangeResult = { accessToken: string; refreshToken: string | null; handle: string | null };

export async function exchangeCode(code: string, codeVerifier: string): Promise<ExchangeResult> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("X OAuth is not configured.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // X's confidential-client token endpoint expects HTTP Basic auth of client_id:client_secret.
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: redirectUri(), code_verifier: codeVerifier, client_id: clientId }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || `X token exchange failed (${res.status}).`);

  const handle = await fetch("https://api.x.com/2/users/me", { headers: { Authorization: `Bearer ${data.access_token}` }, signal: AbortSignal.timeout(15_000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.data?.username ?? null)
    .catch(() => null);

  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, handle };
}

export type PublishResult = { ok: true; postUrl: string; platformId: string } | { ok: false; error: string };

async function uploadMedia(accessToken: string, bytes: Buffer, mimeType: string): Promise<string> {
  const category = mimeType.startsWith("video/") ? "tweet_video" : "tweet_image";

  const initRes = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ command: "INIT", total_bytes: String(bytes.length), media_type: mimeType, media_category: category }),
    signal: AbortSignal.timeout(20_000),
  });
  const initData = await initRes.json();
  if (!initRes.ok) throw new Error(initData?.errors?.[0]?.message || `X media init failed (${initRes.status}).`);
  const mediaId = initData.media_id_string;

  // Chunked APPEND — 4MB segments, X's own documented ceiling per chunk.
  const CHUNK = 4 * 1024 * 1024;
  for (let offset = 0, index = 0; offset < bytes.length; offset += CHUNK, index++) {
    const form = new FormData();
    form.append("command", "APPEND");
    form.append("media_id", mediaId);
    form.append("segment_index", String(index));
    form.append("media", new Blob([new Uint8Array(bytes.subarray(offset, offset + CHUNK))]));
    const appendRes = await fetch(MEDIA_UPLOAD_URL, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form, signal: AbortSignal.timeout(60_000) });
    if (!appendRes.ok) throw new Error(`X media upload chunk ${index} failed (${appendRes.status}).`);
  }

  const finalizeRes = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ command: "FINALIZE", media_id: mediaId }),
    signal: AbortSignal.timeout(30_000),
  });
  const finalizeData = await finalizeRes.json();
  if (!finalizeRes.ok) throw new Error(finalizeData?.errors?.[0]?.message || "X media finalize failed.");

  // Video processing is async — poll STATUS until X says it's ready to attach.
  let checkAfterSecs = finalizeData?.processing_info?.check_after_secs ?? 0;
  const deadline = Date.now() + 120_000;
  while (finalizeData?.processing_info && checkAfterSecs > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, checkAfterSecs * 1000));
    const statusRes = await fetch(`${MEDIA_UPLOAD_URL}?${new URLSearchParams({ command: "STATUS", media_id: mediaId })}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
    });
    const statusData = await statusRes.json().catch(() => ({}));
    const state = statusData?.processing_info?.state;
    if (state === "succeeded") break;
    if (state === "failed") throw new Error(statusData?.processing_info?.error?.message || "X failed to process the media.");
    checkAfterSecs = statusData?.processing_info?.check_after_secs ?? 0;
  }

  return mediaId;
}

export async function publish(accessToken: string, opts: { mediaUrl: string; caption: string }): Promise<PublishResult> {
  let mediaId: string | undefined;
  try {
    let bytes: Buffer;
    let mimeType = "video/mp4";
    if (opts.mediaUrl.startsWith("data:")) {
      const [header, b64] = opts.mediaUrl.split(",");
      mimeType = header.match(/data:([^;]+)/)?.[1] || mimeType;
      bytes = Buffer.from(b64, "base64");
    } else {
      const res = await fetch(opts.mediaUrl, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) return { ok: false, error: `Could not fetch the media to upload (${res.status}).` };
      mimeType = res.headers.get("content-type") || mimeType;
      bytes = Buffer.from(await res.arrayBuffer());
    }
    mediaId = await uploadMedia(accessToken, bytes, mimeType);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "X media upload failed." };
  }

  const res = await fetch(TWEETS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: opts.caption.slice(0, 280), media: { media_ids: [mediaId] } }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.detail || data?.title || `X post failed (${res.status}).` };
  const id = data?.data?.id;
  if (!id) return { ok: false, error: "X accepted the request but returned no post id." };
  return { ok: true, postUrl: `https://x.com/i/status/${id}`, platformId: id };
}
