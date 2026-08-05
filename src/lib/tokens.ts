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

/**
 * Give tokens back for work that failed.
 *
 * ## A refund can never exceed what was actually paid
 *
 * This used to be an unconditional INSERT of a positive row. Nothing checked
 * that the caller had ever been charged, and the de-duplication key was `ref` —
 * which, on the render pollers, is derived from an operation id the caller
 * passes in. So a signed-in user could call a poll endpoint with a made-up but
 * well-formed operation id, get "failed" back (any non-OK provider response is
 * reported as failed), and be credited. A different fake id each time meant a
 * different ref each time, so ON CONFLICT never fired and the loop minted
 * tokens indefinitely. Minted tokens are indistinguishable from bought ones and
 * spend on real provider calls, so it drained the provider budget and destroyed
 * the revenue unit at the same time.
 *
 * The guard is an invariant rather than a patch on the callers: for any one
 * action, a user's total refunds may never exceed their total charges. It holds
 * however the refund is reached — a new poller, a retry, an endpoint written
 * next year — so it cannot be reopened by someone adding a caller who forgets.
 *
 * One statement, so the read and the write cannot interleave: two concurrent
 * refunds cannot both observe the old total and both succeed.
 */
export async function refund(userId: string, action: string, ref?: string, amount?: number): Promise<void> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return;
  const cost = roundTokens(amount ?? costOf(action));
  if (cost <= 0) return;
  const refundReason = `refund:${action}`;
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    SELECT ${userId}, ${cost}, ${refundReason}, ${ref ? `refund:${ref}` : null}
    WHERE (
      SELECT COALESCE(-SUM(delta), 0) FROM token_ledger
       WHERE user_id = ${userId} AND reason = ${action} AND delta < 0
    ) >= (
      SELECT COALESCE(SUM(delta), 0) FROM token_ledger
       WHERE user_id = ${userId} AND reason = ${refundReason} AND delta > 0
    ) + ${cost}
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
