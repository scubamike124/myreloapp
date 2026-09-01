import { createHmac, randomBytes } from "node:crypto";
import {
  youtubeClientId,
  youtubeClientSecret,
  appBaseUrl,
  providerSecretsReady,
} from "@/lib/social/providers";

/**
 * Google Sign-In for Reelo accounts (separate redirect from YouTube publish OAuth).
 */

export function googleLoginConfigured(): boolean {
  return providerSecretsReady("youtube") || Boolean(youtubeClientId() && youtubeClientSecret());
}

export function googleLoginCallbackUrl(): string {
  // Must match a redirect URI already registered on the Google OAuth client.
  // YouTube publish OAuth uses this path; Google Sign-In reuses it and branches
  // on state prefix `google_login.` so we do not require a console URI change.
  return `${appBaseUrl()}/api/oauth/youtube/callback`;
}

function stateSecret(): string {
  return (
    process.env.SOCIAL_TOKEN_SECRET ||
    process.env.VAULT_MASTER_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "dev-google-login-state"
  );
}

/** Signed CSRF state: google_login.{nonce}.{exp}.{nextB64}.{sig} */
export function signGoogleLoginState(nextPath: string): string {
  const nonce = randomBytes(12).toString("base64url");
  const exp = String(Date.now() + 15 * 60_000);
  const nextSafe =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath.slice(0, 200) : "/account";
  const nextB64 = Buffer.from(nextSafe, "utf8").toString("base64url");
  const payload = `google_login.${nonce}.${exp}.${nextB64}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyGoogleLoginState(
  state: string,
): { ok: true; next: string } | { ok: false; error: string } {
  const parts = state.split(".");
  if (parts.length !== 5) return { ok: false, error: "Invalid state." };
  const [kind, , expRaw, nextB64, sig] = parts;
  if (kind !== "google_login") return { ok: false, error: "Invalid state kind." };
  const payload = parts.slice(0, 4).join(".");
  const expect = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  if (expect !== sig) return { ok: false, error: "Bad state signature." };
  if (Date.now() > Number(expRaw)) return { ok: false, error: "State expired." };
  let next = "/account";
  try {
    next = Buffer.from(nextB64, "base64url").toString("utf8");
  } catch {
    next = "/account";
  }
  if (!next.startsWith("/") || next.startsWith("//")) next = "/account";
  return { ok: true, next };
}

export function buildGoogleLoginAuthorizeUrl(state: string): string | null {
  const clientId = youtubeClientId();
  if (!clientId) return null;
  const redirect = googleLoginCallbackUrl();
  const scopes = encodeURIComponent("openid email profile");
  return (
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&response_type=code` +
    `&scope=${scopes}` +
    `&access_type=online` +
    `&prompt=select_account` +
    `&state=${encodeURIComponent(state)}`
  );
}

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

export async function exchangeGoogleLoginCode(code: string): Promise<GoogleProfile> {
  const clientId = youtubeClientId();
  const clientSecret = youtubeClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleLoginCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || "Google token exchange failed.");
  }

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!infoRes.ok || !info.sub || !info.email) {
    throw new Error("Could not load Google profile.");
  }

  return {
    sub: info.sub,
    email: info.email.trim().toLowerCase(),
    emailVerified: Boolean(info.email_verified),
    name: info.name?.trim().slice(0, 80) || null,
    picture: info.picture || null,
  };
}
