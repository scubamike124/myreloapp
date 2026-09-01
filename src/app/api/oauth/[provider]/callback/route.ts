import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { SOCIAL_PROVIDERS, type SocialProvider, appBaseUrl } from "@/lib/social/providers";
import { exchangeOAuthCode, verifyOAuthState } from "@/lib/social/oauth";
import { encryptToken } from "@/lib/social/tokens";
import { completeGoogleLogin } from "@/lib/complete-google-login";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider: raw } = await ctx.params;
  const provider = raw as SocialProvider;
  const base = appBaseUrl();
  const socialUrl = `${base}/admin/amber`;

  if (!SOCIAL_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=unknown_provider`);
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=${encodeURIComponent(err)}`);
  }

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !state) {
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=missing_code`);
  }

  // Google Sign-In reuses this exact callback path (its authorize URL is
  // registered against the same Google OAuth client as YouTube publish) but
  // is a completely different flow -- signing someone into a Reelo account,
  // not connecting a social channel to an existing one. It's the only flow
  // whose state carries this literal prefix, so branch on that alone, before
  // this route's own verifyOAuthState (which expects a signed-in-user state
  // shape and would reject this one).
  if (state.startsWith("google_login.")) {
    return completeGoogleLogin(code, state);
  }

  const verified = verifyOAuthState(state, provider);
  if (!verified.ok) {
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=${encodeURIComponent(verified.error)}`);
  }

  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=storage`);
  }

  try {
    const tok = await exchangeOAuthCode(provider, code);
    const accessEnc = encryptToken(tok.accessToken);
    const refreshEnc = tok.refreshToken ? encryptToken(tok.refreshToken) : null;
    if (!accessEnc) {
      return NextResponse.redirect(`${socialUrl}?oauth=error&reason=encrypt`);
    }

    const now = new Date().toISOString();
    const existing = (await q`
      SELECT id FROM social_accounts
      WHERE user_id = ${verified.userId} AND provider = ${provider} AND external_id = ${tok.externalId}
      LIMIT 1
    `) as { id: string }[];

    if (existing[0]) {
      await q`
        UPDATE social_accounts
        SET handle = ${tok.handle}, display_name = ${tok.displayName},
            scopes = ${tok.scopes || ""}, access_token_enc = ${accessEnc},
            refresh_token_enc = ${refreshEnc}, expires_at = ${tok.expiresAt ?? null},
            status = 'connected', meta = ${JSON.stringify(tok.meta || {})}, updated_at = ${now}
        WHERE id = ${existing[0].id}`;
    } else {
      const id = randomUUID();
      await q`
        INSERT INTO social_accounts (
          id, user_id, provider, external_id, handle, display_name, scopes,
          access_token_enc, refresh_token_enc, expires_at, status, meta, created_at, updated_at
        ) VALUES (
          ${id}, ${verified.userId}, ${provider}, ${tok.externalId}, ${tok.handle}, ${tok.displayName},
          ${tok.scopes || ""}, ${accessEnc}, ${refreshEnc}, ${tok.expiresAt ?? null},
          ${"connected"}, ${JSON.stringify(tok.meta || {})}, ${now}, ${now}
        )`;
    }

    return NextResponse.redirect(`${socialUrl}?oauth=connected&provider=${provider}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange_failed";
    return NextResponse.redirect(`${socialUrl}?oauth=error&reason=${encodeURIComponent(msg.slice(0, 80))}`);
  }
}
