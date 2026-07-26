import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str } from "@/lib/workspace-api";
import { PROVIDER_META, SOCIAL_PROVIDERS, providerSecretsReady, type PublicSocialAccount, type SocialProvider } from "@/lib/social/providers";
import { canEncryptTokens } from "@/lib/social/tokens";
import { requireAmberAutonomous, logAmberAction } from "@/lib/amber-autonomous";

export const runtime = "nodejs";

function mapRow(r: Record<string, unknown>): PublicSocialAccount {
  return {
    id: String(r.id),
    provider: r.provider as SocialProvider,
    externalId: String(r.externalId ?? ""),
    handle: String(r.handle ?? ""),
    displayName: String(r.displayName ?? ""),
    status: String(r.status ?? "connected"),
    expiresAt: (r.expiresAt as string | null) ?? null,
    createdAt: String(r.createdAt ?? ""),
  };
}

export async function GET() {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  if (!dbConfigured()) {
    return Response.json({ ok: true, configured: false, accounts: [], providers: [] });
  }
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: true, configured: true, signedIn: false, accounts: [], providers: [] });
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, accounts: [], providers: [] });
  }

  const rows = (await q`
    SELECT id, provider, external_id AS "externalId", handle, display_name AS "displayName",
           status, expires_at AS "expiresAt", created_at AS "createdAt"
    FROM social_accounts
    WHERE user_id = ${user.id} AND status != 'revoked'
    ORDER BY provider, created_at ASC
  `) as Record<string, unknown>[];

  const providers = SOCIAL_PROVIDERS.map((id) => {
    const meta = PROVIDER_META[id];
    const secretsReady = providerSecretsReady(id);
    return {
      id,
      label: meta.label,
      future: Boolean(meta.future),
      secretsReady,
      canConnect: secretsReady && canEncryptTokens() && !meta.future,
      connectHint: meta.future
        ? "Coming later"
        : !secretsReady
          ? "Developer app keys needed on the server"
          : !canEncryptTokens()
            ? "SOCIAL_TOKEN_SECRET needed to store tokens safely"
            : "Connect an existing account you own",
    };
  });

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    adminOnly: true,
    note: "Admin testing: connect accounts you already own. Amber never creates new social accounts.",
    accounts: rows.map(mapRow),
    providers,
  });
}

export async function DELETE(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;
  const id = str(new URL(req.url).searchParams.get("id"), 80);
  if (!id) return Response.json({ ok: false, error: "Missing id." }, { status: 400 });

  await q`
    UPDATE social_accounts
    SET status = 'revoked', access_token_enc = NULL, refresh_token_enc = NULL, updated_at = ${new Date().toISOString()}
    WHERE id = ${id} AND user_id = ${user.id}`;

  await logAmberAction({
    actorUserId: user.id,
    actorEmail: user.email,
    kind: "disconnect",
    title: `Disconnected social account ${id}`,
    detail: { id },
  });

  return Response.json({ ok: true });
}
