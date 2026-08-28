// ---------------------------------------------------------------------------
// TikTok — OAuth (PKCE) + real publish via the Content Posting API.
//
// Same three-function shape as the other platform modules. One TikTok-
// specific constraint worth knowing up front: PULL_FROM_URL source videos
// must be hosted on a domain verified in the TikTok developer portal, and an
// unaudited app can only post to the connected account's own private/draft
// inbox rather than directly public — TikTok's own review process, not
// something this code can shortcut. publish() still makes the real call and
// reports TikTok's real response either way.
// ---------------------------------------------------------------------------

import { randomBytes, createHash } from "node:crypto";
import { absoluteUrl } from "@/lib/site";

const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const PUBLISH_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

function redirectUri(): string {
  return absoluteUrl("/api/admin/social/callback/tiktok");
}

export function configured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

/** PKCE verifier/challenge — TikTok requires PKCE on the web OAuth flow.
 *  The verifier travels in `state` (base64url, opaque to TikTok) so the
 *  callback can complete the exchange without a server-side session store. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function authorizeUrl(state: string, codeChallenge: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY is not set.");
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "video.publish",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export type ExchangeResult = { accessToken: string; refreshToken: string | null; openId: string };

export async function exchangeCode(code: string, codeVerifier: string): Promise<ExchangeResult> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error("TikTok OAuth is not configured.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error_description || data?.error || `TikTok token exchange failed (${res.status}).`);
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, openId: data.open_id };
}

export type PublishResult = { ok: true; postUrl: string; platformId: string; note?: string } | { ok: false; error: string };

/** Publish a video already reachable at a public https URL. See the module
 *  note above on PULL_FROM_URL's domain-verification and audit constraints. */
export async function publish(accessToken: string, opts: { mediaUrl: string; caption: string }): Promise<PublishResult> {
  if (opts.mediaUrl.startsWith("data:")) {
    return { ok: false, error: "TikTok's publish API needs a public https URL for the video, not inline data — host it first." };
  }

  const initRes = await fetch(PUBLISH_INIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      post_info: { title: opts.caption.slice(0, 2200), privacy_level: "SELF_ONLY", disable_duet: false, disable_comment: false, disable_stitch: false },
      source_info: { source: "PULL_FROM_URL", video_url: opts.mediaUrl },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const initData = await initRes.json();
  if (!initRes.ok || initData?.error?.code !== "ok") {
    return { ok: false, error: initData?.error?.message || `TikTok publish failed (${initRes.status}).` };
  }
  const publishId = initData?.data?.publish_id;
  if (!publishId) return { ok: false, error: "TikTok accepted the request but returned no publish id." };

  const deadline = Date.now() + 60_000;
  for (;;) {
    const statusRes = await fetch(PUBLISH_STATUS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ publish_id: publishId }),
      signal: AbortSignal.timeout(15_000),
    });
    const statusData = await statusRes.json().catch(() => ({}));
    const status = statusData?.data?.status;
    if (status === "PUBLISH_COMPLETE") {
      const publicId = statusData?.data?.publicaly_available_post_id?.[0];
      return {
        ok: true,
        postUrl: publicId ? `https://www.tiktok.com/@me/video/${publicId}` : "https://www.tiktok.com",
        platformId: publishId,
        note: "SELF_ONLY privacy was requested — this lands in the connected account's own inbox as a draft until an audited app allows direct public posting.",
      };
    }
    if (status === "FAILED") return { ok: false, error: statusData?.data?.fail_reason || "TikTok reported the publish failed." };
    if (Date.now() > deadline) return { ok: false, error: "TikTok is still processing — check the account's inbox shortly." };
    await new Promise((r) => setTimeout(r, 3000));
  }
}
