// ---------------------------------------------------------------------------
// Instagram + Facebook — one Meta app, one Graph API, real publish for both.
//
// Same three-function shape as the other platform modules, with one wrinkle
// Meta itself requires: publishing needs a PAGE access token (not the user's
// own token), and Instagram publishing needs the Business/Creator account
// linked to that Page. exchangeCode() resolves both in one pass so the
// callback route can store a real, ready-to-publish row for each platform
// that's actually available — Facebook always (once a Page exists),
// Instagram only if that Page has a linked IG Business/Creator account.
// ---------------------------------------------------------------------------

import { absoluteUrl } from "@/lib/site";

const AUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";
const GRAPH_BASE = "https://graph.facebook.com/v21.0";

function redirectUri(): string {
  return absoluteUrl("/api/admin/social/callback/meta");
}

export function configured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function authorizeUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID is not set.");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri(),
    response_type: "code",
    // Minimum scopes to publish to a Page and its linked IG Business account.
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export type MetaConnection = {
  facebook: { pageAccessToken: string; pageId: string; pageName: string } | null;
  instagram: { pageAccessToken: string; igUserId: string; igUsername: string | null } | null;
};

/**
 * Trades the code for a short-lived user token, upgrades it to a long-lived
 * one (~60 days), then walks the account's Pages to find a usable Page token
 * and, if one exists, the IG Business account linked to it. Real Graph API
 * calls at every step — this is the same discovery a human clicking through
 * Meta's own developer console would do.
 */
export async function exchangeCode(code: string): Promise<MetaConnection> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Meta OAuth is not configured.");

  const tokenRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri(), code })}`,
    { signal: AbortSignal.timeout(20_000) },
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData?.error?.message || `Meta token exchange failed (${tokenRes.status}).`);

  const longLivedRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: tokenData.access_token,
    })}`,
    { signal: AbortSignal.timeout(20_000) },
  );
  const longLivedData = await longLivedRes.json();
  const userToken = longLivedRes.ok ? longLivedData.access_token : tokenData.access_token;

  const pagesRes = await fetch(`${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`, {
    signal: AbortSignal.timeout(20_000),
  });
  const pagesData = await pagesRes.json();
  if (!pagesRes.ok) throw new Error(pagesData?.error?.message || "Could not list Facebook Pages.");

  const page = pagesData?.data?.[0];
  if (!page) return { facebook: null, instagram: null };

  const facebook = { pageAccessToken: page.access_token, pageId: page.id, pageName: page.name };

  let instagram: MetaConnection["instagram"] = null;
  if (page.instagram_business_account?.id) {
    const igId = page.instagram_business_account.id;
    const igRes = await fetch(`${GRAPH_BASE}/${igId}?fields=username&access_token=${encodeURIComponent(page.access_token)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const igData = await igRes.json().catch(() => ({}));
    instagram = { pageAccessToken: page.access_token, igUserId: igId, igUsername: igData?.username ?? null };
  }

  return { facebook, instagram };
}

export type PublishResult = { ok: true; postUrl: string; platformId: string } | { ok: false; error: string };

/** Publish a video to a Facebook Page's feed. accessToken is the PAGE token
 *  (facebook.pageAccessToken from exchangeCode), not a user token. */
export async function publishFacebook(pageAccessToken: string, pageId: string, opts: { mediaUrl: string; caption: string }): Promise<PublishResult> {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: opts.mediaUrl, description: opts.caption, access_token: pageAccessToken }),
    signal: AbortSignal.timeout(120_000),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.error?.message || `Facebook publish failed (${res.status}).` };
  const id = data?.id;
  if (!id) return { ok: false, error: "Facebook accepted the request but returned no post id." };
  return { ok: true, postUrl: `https://facebook.com/${id}`, platformId: id };
}

/** Publish to Instagram — the platform's own two-step flow: create a media
 *  container from the video URL, poll until it's finished processing, then
 *  publish that container. accessToken is the Page token; igUserId is the
 *  linked IG Business account (both from exchangeCode). */
export async function publishInstagram(pageAccessToken: string, igUserId: string, opts: { mediaUrl: string; caption: string }): Promise<PublishResult> {
  const createRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "REELS", video_url: opts.mediaUrl, caption: opts.caption, access_token: pageAccessToken }),
    signal: AbortSignal.timeout(60_000),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData?.id) return { ok: false, error: createData?.error?.message || "Instagram rejected the media." };
  const creationId = createData.id;

  // Video containers process asynchronously on Instagram's side before they
  // can be published — poll status_code rather than publishing blind.
  const deadline = Date.now() + 120_000;
  for (;;) {
    const statusRes = await fetch(`${GRAPH_BASE}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const statusData = await statusRes.json().catch(() => ({}));
    if (statusData?.status_code === "FINISHED") break;
    if (statusData?.status_code === "ERROR") return { ok: false, error: "Instagram failed to process the video." };
    if (Date.now() > deadline) return { ok: false, error: "Instagram is still processing the video — try publishing again shortly." };
    await new Promise((r) => setTimeout(r, 4000));
  }

  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: pageAccessToken }),
    signal: AbortSignal.timeout(30_000),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData?.id) return { ok: false, error: publishData?.error?.message || "Instagram publish step failed." };
  return { ok: true, postUrl: `https://www.instagram.com/reel/${publishData.id}`, platformId: publishData.id };
}
