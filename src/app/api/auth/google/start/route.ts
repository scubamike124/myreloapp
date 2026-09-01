import { NextResponse } from "next/server";
import { googleLoginConfigured, signGoogleLoginState, buildGoogleLoginAuthorizeUrl } from "@/lib/google-login";

export const runtime = "nodejs";

/**
 * GET /api/auth/google/start?next=/account — begin Google Sign-In.
 *
 * Deliberately unauthenticated: unlike /api/oauth/[provider]/start (which
 * connects a social channel to an *already signed-in* account), this is how
 * someone signs in in the first place. The rest of the flow -- token
 * exchange, account upsert, owner-claim, session cookie -- already existed
 * (google-login.ts / complete-google-login.ts) with nothing that actually
 * sent a browser to Google; this route was the missing first step.
 */
export async function GET(req: Request) {
  if (!googleLoginConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured on this server." }, { status: 503 });
  }

  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/account";

  const state = signGoogleLoginState(next);
  const authorizeUrl = buildGoogleLoginAuthorizeUrl(state);
  if (!authorizeUrl) {
    return NextResponse.json({ error: "Google sign-in is not configured on this server." }, { status: 503 });
  }

  return NextResponse.redirect(authorizeUrl);
}
