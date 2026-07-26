import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { SocialProvider } from "@/lib/social/providers";
import { PROVIDER_META, oauthCallbackUrl, providerSecretsReady } from "@/lib/social/providers";

function stateSecret(): string {
  return process.env.SOCIAL_TOKEN_SECRET || process.env.VAULT_MASTER_KEY || process.env.DATABASE_URL || "dev-oauth-state";
}

export function signOAuthState(userId: string, provider: SocialProvider): string {
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${provider}.${userId}.${nonce}.${Date.now()}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyOAuthState(
  state: string,
  provider: SocialProvider,
): { ok: true; userId: string } | { ok: false; error: string } {
  const parts = state.split(".");
  if (parts.length !== 5) return { ok: false, error: "Invalid state." };
  const [p, userId, , ts, sig] = parts;
  if (p !== provider) return { ok: false, error: "Provider mismatch." };
  const payload = parts.slice(0, 4).join(".");
  const expect = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  if (expect !== sig) return { ok: false, error: "Bad state signature." };
  if (Date.now() - Number(ts) > 15 * 60_000) return { ok: false, error: "State expired." };
  return { ok: true, userId };
}

export function buildAuthorizeUrl(provider: SocialProvider, state: string): string | null {
  if (!providerSecretsReady(provider)) return null;
  const redirect = oauthCallbackUrl(provider);
  const meta = PROVIDER_META[provider];
  if (meta.future) return null;

  if (provider === "tiktok") {
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const scopes = encodeURIComponent("user.info.basic,video.upload,video.publish");
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientKey)}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}`;
  }

  if (provider === "instagram") {
    const appId = process.env.META_APP_ID!;
    const scopes = encodeURIComponent("instagram_basic,instagram_content_publish,pages_show_list");
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}&scope=${scopes}&response_type=code`;
  }

  if (provider === "youtube") {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
    const scopes = encodeURIComponent("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly");
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
  }

  return null;
}

export type TokenExchange = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string | null;
  externalId: string;
  handle: string;
  displayName: string;
  scopes?: string;
  meta?: Record<string, unknown>;
};

export async function exchangeOAuthCode(provider: SocialProvider, code: string): Promise<TokenExchange> {
  const redirect = oauthCallbackUrl(provider);

  if (provider === "tiktok") {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(data.error_description || data.message || "TikTok token exchange failed"));
    const access = String(data.access_token || "");
    const openId = String(data.open_id || randomUUID());
    let handle = openId.slice(0, 12);
    let displayName = "TikTok account";
    try {
      const u = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username", {
        headers: { Authorization: `Bearer ${access}` },
      });
      const uj = (await u.json()) as { data?: { user?: { display_name?: string; username?: string } } };
      handle = uj.data?.user?.username || handle;
      displayName = uj.data?.user?.display_name || displayName;
    } catch {
      /* profile optional */
    }
    const expiresIn = Number(data.expires_in || 0);
    return {
      accessToken: access,
      refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      externalId: openId,
      handle,
      displayName,
      scopes: String(data.scope || ""),
    };
  }

  if (provider === "instagram") {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(process.env.META_APP_ID!)}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${encodeURIComponent(process.env.META_APP_SECRET!)}&code=${encodeURIComponent(code)}`,
    );
    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    if (!tokenRes.ok) throw new Error(String(tokenData.error_message || tokenData.error || "Meta token exchange failed"));
    const access = String(tokenData.access_token || "");
    // Prefer IG business account if available; otherwise store user id as placeholder handle.
    let externalId = "ig-" + randomUUID().slice(0, 8);
    let handle = "instagram";
    let displayName = "Instagram account";
    try {
      const me = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(access)}`);
      const mj = (await me.json()) as { id?: string; name?: string };
      if (mj.id) externalId = mj.id;
      if (mj.name) displayName = mj.name;
      handle = mj.name?.replace(/\s+/g, "").toLowerCase() || handle;
    } catch {
      /* optional */
    }
    return {
      accessToken: access,
      expiresAt: null,
      externalId,
      handle,
      displayName,
      scopes: "instagram",
    };
  }

  if (provider === "youtube") {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: redirect,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    if (!tokenRes.ok) throw new Error(String(tokenData.error_description || tokenData.error || "Google token exchange failed"));
    const access = String(tokenData.access_token || "");
    let externalId = "yt-" + randomUUID().slice(0, 8);
    let handle = "youtube";
    let displayName = "YouTube channel";
    try {
      const ch = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${access}` },
      });
      const cj = (await ch.json()) as { items?: { id: string; snippet?: { title?: string; customUrl?: string } }[] };
      const item = cj.items?.[0];
      if (item?.id) externalId = item.id;
      if (item?.snippet?.title) displayName = item.snippet.title;
      if (item?.snippet?.customUrl) handle = item.snippet.customUrl.replace(/^@/, "");
      else handle = displayName.replace(/\s+/g, "").toLowerCase();
    } catch {
      /* optional */
    }
    const expiresIn = Number(tokenData.expires_in || 0);
    return {
      accessToken: access,
      refreshToken: tokenData.refresh_token ? String(tokenData.refresh_token) : undefined,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      externalId,
      handle,
      displayName,
      scopes: String(tokenData.scope || "youtube"),
    };
  }

  throw new Error("Unsupported provider.");
}
