import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { SOCIAL_PROVIDERS, type SocialProvider, PROVIDER_META, providerSecretsReady } from "@/lib/social/providers";
import { buildAuthorizeUrl, signOAuthState } from "@/lib/social/oauth";
import { canEncryptTokens } from "@/lib/social/tokens";
import { requireAmberAutonomous, logAmberAction } from "@/lib/amber-autonomous";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) {
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      return NextResponse.redirect(new URL("/admin/amber?denied=1", req.url));
    }
    return gate.response;
  }

  const { provider: raw } = await ctx.params;
  const provider = raw as SocialProvider;
  if (!SOCIAL_PROVIDERS.includes(provider)) {
    return Response.json({ ok: false, error: "Unknown provider." }, { status: 404 });
  }

  const user = await currentUser();
  if (!user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", `/admin/amber`);
    return NextResponse.redirect(login);
  }

  if (PROVIDER_META[provider].future) {
    return Response.json({
      ok: false,
      error: "keys_needed",
      message: `${PROVIDER_META[provider].label} connect is reserved for a future release.`,
      provider,
    }, { status: 501 });
  }

  if (!providerSecretsReady(provider)) {
    return Response.json({
      ok: false,
      error: "keys_needed",
      message: `${PROVIDER_META[provider].label} developer credentials are not configured.`,
      provider,
      required: PROVIDER_META[provider].requiredEnv,
    }, { status: 503 });
  }

  if (!canEncryptTokens()) {
    return Response.json({
      ok: false,
      error: "keys_needed",
      message: "SOCIAL_TOKEN_SECRET is required before OAuth tokens can be stored.",
      provider,
    }, { status: 503 });
  }

  const state = signOAuthState(user.id, provider);
  const url = buildAuthorizeUrl(provider, state);
  if (!url) {
    return Response.json({ ok: false, error: "keys_needed", provider }, { status: 503 });
  }

  await logAmberAction({
    actorUserId: user.id,
    actorEmail: user.email,
    kind: "oauth_start",
    title: `OAuth start ${provider}`,
    detail: { provider },
  });

  return NextResponse.redirect(url);
}
