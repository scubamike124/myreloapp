import { sqlAsync, ensureSchema } from "@/lib/db";
import { costOf } from "@/lib/token-costs";
import { roundTokens } from "@/lib/token-pricing";

// ---------------------------------------------------------------------------
// Token balances.
//
// Ledger SUM(delta) is the balance. Deltas are decimal tokens (2 d.p.) so
// fractional video lengths bill correctly under the global $10/token system.
// ---------------------------------------------------------------------------

export { TOKEN_COST, costOf } from "@/lib/token-costs";

async function dbSql() {
  return sqlAsync();
}

export async function balanceOf(userId: string): Promise<number> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return 0;
  const rows = (await q`
    SELECT COALESCE(SUM(delta), 0) AS balance FROM token_ledger WHERE user_id = ${userId}
  `) as { balance: number }[];
  return roundTokens(Number(rows[0]?.balance ?? 0));
}

export type LedgerEntry = { delta: number; reason: string; created_at: string };

export async function historyOf(userId: string, limit = 50): Promise<LedgerEntry[]> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return [];
  const rows = (await q`
    SELECT delta, reason, created_at
    FROM token_ledger
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as LedgerEntry[];
  return rows.map((r) => ({ ...r, delta: roundTokens(Number(r.delta)) }));
}

export async function spend(
  userId: string,
  action: string,
  ref?: string,
  tokensOverride?: number,
): Promise<number | null> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return null;

  const cost = roundTokens(tokensOverride ?? costOf(action));
  if (cost <= 0) return balanceOf(userId);

  const inserted = (await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    SELECT ${userId}, ${-cost}, ${action}, ${ref ?? null}
    WHERE (SELECT COALESCE(SUM(delta), 0) FROM token_ledger WHERE user_id = ${userId}) >= ${cost}
    RETURNING id
  `) as { id: string }[];

  if (inserted.length === 0) return null;
  return balanceOf(userId);
}

export async function refund(userId: string, action: string, ref?: string, amount?: number): Promise<void> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return;
  const cost = roundTokens(amount ?? costOf(action));
  if (cost <= 0) return;
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    VALUES (${userId}, ${cost}, ${`refund:${action}`}, ${ref ? `refund:${ref}` : null})
    ON CONFLICT (ref) WHERE ref IS NOT NULL DO NOTHING`;
}

export async function credit(userId: string, amount: number, reason: string, ref: string): Promise<void> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return;
  const tokens = roundTokens(amount);
  if (!(tokens > 0)) return;
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    VALUES (${userId}, ${tokens}, ${reason}, ${ref})
    ON CONFLICT (ref) WHERE ref IS NOT NULL DO NOTHING`;
}
