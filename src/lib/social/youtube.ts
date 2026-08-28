// ---------------------------------------------------------------------------
// YouTube — OAuth (Google) + real publish via the YouTube Data API v3.
//
// One of four platform modules with the same three-function shape
// (authorizeUrl / exchangeCode / publish), called by the generic connect/
// callback routes (src/app/api/admin/social/[connect|callback]/[platform])
// and by the publish_post Command Center tool. Every HTTP call here is a
// real request to Google's real API — nothing simulated.
// ---------------------------------------------------------------------------

import { absoluteUrl } from "@/lib/site";

const AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3/videos";

function redirectUri(): string {
  return absoluteUrl("/api/admin/social/callback/youtube");
}

export function configured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Where to send the browser to ask Michael to approve YouTube upload access. */
export function authorizeUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set.");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    // youtube.upload is enough to publish; no read/manage scope requested.
    scope: "https://www.googleapis.com/auth/youtube.upload",
    access_type: "offline", // refresh token, so the connection outlives one hour
    prompt: "consent",
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export type ExchangeResult = { accessToken: string; refreshToken: string | null; expiresAt: string; channelHandle: string | null };

/** Trade the authorization code Google just redirected back with for a real token. */
export async function exchangeCode(code: string): Promise<ExchangeResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || `Google token exchange failed (${res.status}).`);

  const channel = await fetchOwnChannelHandle(data.access_token).catch(() => null);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + Number(data.expires_in ?? 3600) * 1000).toISOString(),
    channelHandle: channel,
  };
}

async function fetchOwnChannelHandle(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.items?.[0]?.snippet?.title ?? null;
}

/** New access token from a stored refresh token — Google access tokens expire hourly. */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || "Could not refresh the YouTube connection.");
  return data.access_token;
}

export type PublishResult = { ok: true; postUrl: string; platformId: string } | { ok: false; error: string };

/**
 * Upload a finished video to YouTube. mediaUrl may be an http(s) URL or a
 * data: URL (the shape every Command Center generation tool already
 * returns) — either way the bytes are fetched/decoded and sent as a single
 * non-resumable upload, which YouTube accepts for files under ~2GB (every
 * short-form clip this app produces is far smaller than that ceiling).
 */
export async function publish(accessToken: string, opts: { mediaUrl: string; caption: string; title?: string }): Promise<PublishResult> {
  let bytes: Buffer;
  let mimeType = "video/mp4";
  try {
    if (opts.mediaUrl.startsWith("data:")) {
      const [header, b64] = opts.mediaUrl.split(",");
      mimeType = header.match(/data:([^;]+)/)?.[1] || mimeType;
      bytes = Buffer.from(b64, "base64");
    } else {
      const res = await fetch(opts.mediaUrl, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) return { ok: false, error: `Could not fetch the video to upload (${res.status}).` };
      mimeType = res.headers.get("content-type") || mimeType;
      bytes = Buffer.from(await res.arrayBuffer());
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `Could not read the video: ${e.message}` : "Could not read the video." };
  }

  const snippet = {
    snippet: {
      title: (opts.title || opts.caption || "Reelo video").slice(0, 100),
      description: opts.caption.slice(0, 5000),
    },
    status: { privacyStatus: "public" },
  };

  // Multipart upload: metadata JSON part + the raw video bytes, in one request.
  const boundary = `reelo-${Date.now()}`;
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(snippet)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const bodyBuffer = Buffer.concat([Buffer.from(body, "utf8"), bytes, Buffer.from(`\r\n--${boundary}--`, "utf8")]);

  const res = await fetch(`${UPLOAD_BASE}?uploadType=multipart&part=snippet,status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body: bodyBuffer,
    signal: AbortSignal.timeout(280_000), // a real upload, not a metadata call — needs room
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error?.message || `YouTube upload failed (${res.status}).` };

  const videoId = data?.id;
  if (!videoId) return { ok: false, error: "YouTube accepted the request but returned no video id." };
  return { ok: true, postUrl: `https://youtube.com/watch?v=${videoId}`, platformId: videoId };
}
