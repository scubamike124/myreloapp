import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { decryptToken } from "@/lib/social/tokens";

// ---------------------------------------------------------------------------
// Command Center's read path into the REAL social_accounts table — the same
// one src/app/api/social/accounts/route.ts and the OAuth callback use. This
// file does not define or alter that table's schema; it only queries it and
// decrypts tokens with the same decryptToken() the callback encrypted them
// with (src/lib/social/tokens.ts), so a token connected through the normal
// Business Center → Social flow is usable here without any parallel storage.
// ---------------------------------------------------------------------------

export type ConnectedAccount = {
  provider: string;
  handle: string | null;
  externalId: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
};

export async function getSocialAccount(userId: string, platform: string): Promise<ConnectedAccount | null> {
  if (!dbConfigured()) return null;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return null;

  const rows = (await q`
    SELECT provider, handle, external_id AS "externalId",
           access_token_enc AS "accessTokenEnc", refresh_token_enc AS "refreshTokenEnc",
           expires_at AS "expiresAt"
    FROM social_accounts
    WHERE user_id = ${userId} AND provider = ${platform} AND status != 'revoked'
    ORDER BY created_at DESC
    LIMIT 1
  `) as {
    provider: string;
    handle: string | null;
    externalId: string | null;
    accessTokenEnc: string | null;
    refreshTokenEnc: string | null;
    expiresAt: string | null;
  }[];

  const row = rows[0];
  if (!row) return null;
  const accessToken = decryptToken(row.accessTokenEnc);
  if (!accessToken) return null;

  return {
    provider: row.provider,
    handle: row.handle,
    externalId: row.externalId,
    accessToken,
    refreshToken: decryptToken(row.refreshTokenEnc),
    expiresAt: row.expiresAt,
  };
}

export async function listConnectedAccountsFor(
  userId: string,
): Promise<{ platform: string; handle: string | null; connectedAt: string }[]> {
  if (!dbConfigured()) return [];
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return [];

  const rows = (await q`
    SELECT provider, handle, created_at AS "createdAt"
    FROM social_accounts
    WHERE user_id = ${userId} AND status != 'revoked'
    ORDER BY provider, created_at ASC
  `) as { provider: string; handle: string | null; createdAt: string }[];

  return rows.map((r) => ({ platform: r.provider, handle: r.handle, connectedAt: r.createdAt }));
}
