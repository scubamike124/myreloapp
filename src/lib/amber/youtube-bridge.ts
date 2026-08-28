// ---------------------------------------------------------------------------
// Amber's shared YouTube channel — GET /api/internal/reelo-youtube-bridge on
// Amber HQ (Launch Ready). Used only as a fallback in publishToPlatform
// (src/lib/ai/admin-publish.ts) when no org has connected its own channel via
// the real OAuth flow in src/lib/social/youtube.ts. Credentials are fetched
// fresh for a single publish call and never written to social_accounts or any
// other Reelo storage — same contract the bridge's own doc comment promises.
//
// Same optional/never-throws shape as src/lib/amber/briefs.ts: unset secret
// means this fallback is simply unavailable, not an error.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://hq.amberoneai.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function config(): { baseUrl: string; secret: string } | null {
  const baseUrl = (process.env.AMBER_YT_BRIDGE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const secret = process.env.REELO_YT_BRIDGE_SECRET ?? "";
  if (!secret) return null;
  return { baseUrl, secret };
}

export function amberYoutubeBridgeConfigured(): boolean {
  return config() !== null;
}

type BridgeCredentials = { clientId: string; clientSecret: string; refreshToken: string; channelId: string | null };

async function fetchBridgeCredentials(): Promise<BridgeCredentials> {
  const cfg = config();
  if (!cfg) throw new Error("Amber's shared YouTube channel is not configured (REELO_YT_BRIDGE_SECRET unset).");

  const res = await fetch(`${cfg.baseUrl}/api/internal/reelo-youtube-bridge`, {
    headers: { "x-bridge-secret": cfg.secret },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Amber's shared YouTube channel is unavailable (${res.status}).`);
  }
  return { clientId: data.clientId, clientSecret: data.clientSecret, refreshToken: data.refreshToken, channelId: data.channelId ?? null };
}

/**
 * Exchange the bridged refresh token for a fresh access token using Amber's
 * own Google OAuth app credentials — never GOOGLE_CLIENT_ID/SECRET from
 * src/lib/social/youtube.ts, which belong to Reelo's own app and would
 * reject a refresh token minted by a different OAuth client.
 */
async function exchangeForAccessToken(creds: BridgeCredentials): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: creds.refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error_description || "Could not refresh Amber's shared YouTube connection.");
  return data.access_token;
}

/**
 * A ready-to-use access token for Amber's shared channel, good for one
 * publish call. Nothing here is cached or persisted — every call re-fetches
 * from Amber's vault and re-exchanges, by design.
 */
export async function getBridgedYoutubeAccessToken(): Promise<{ accessToken: string; channelId: string | null }> {
  const creds = await fetchBridgeCredentials();
  const accessToken = await exchangeForAccessToken(creds);
  return { accessToken, channelId: creds.channelId };
}
