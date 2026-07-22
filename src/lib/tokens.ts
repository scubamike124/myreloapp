import { sql, ensureSchema } from "@/lib/db";
import { costOf } from "@/lib/token-costs";

// ---------------------------------------------------------------------------
// Token balances.
//
// The ledger is the source of truth; the balance is SUM(delta). There is no
// stored balance column to drift out of step with the transactions behind it,
// and every credit and debit is permanently attributable.
//
// Spending is a single conditional INSERT: the row is only written if the
// balance still covers the cost at that moment. Two requests racing cannot both
// succeed on the same last token — the check and the write are one statement.
// ---------------------------------------------------------------------------

// Costs live in token-costs.ts so the browser can show the real price without
// importing this module (and with it the database driver).
export { TOKEN_COST, costOf } from "@/lib/token-costs";

export async function balanceOf(userId: string): Promise<number> {
  const q = sql();
  if (!q || !(await ensureSchema())) return 0;
  const rows = (await q`
    SELECT COALESCE(SUM(delta), 0) AS balance FROM token_ledger WHERE user_id = ${userId}
  `) as { balance: number }[];
  // SQLite returns this as a number already; Postgres as a string without the
  // cast. Normalising here keeps both drivers honest.
  return Number(rows[0]?.balance ?? 0);
}

export type LedgerEntry = { delta: number; reason: string; created_at: string };

export async function historyOf(userId: string, limit = 50): Promise<LedgerEntry[]> {
  const q = sql();
  if (!q || !(await ensureSchema())) return [];
  return (await q`
    SELECT delta, reason, created_at
    FROM token_ledger
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as LedgerEntry[];
}

/**
 * Spend tokens. Returns the new balance, or null if there were not enough.
 *
 * The INSERT ... SELECT only produces a row when the current balance covers the
 * cost, so the check and the deduction happen atomically inside Postgres rather
 * than as a read followed by a write that another request could interleave with.
 */
export async function spend(userId: string, action: string, ref?: string): Promise<number | null> {
  const q = sql();
  if (!q || !(await ensureSchema())) return null;

  const cost = costOf(action);
  if (cost <= 0) return balanceOf(userId);

  const inserted = (await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    SELECT ${userId}, ${-cost}, ${action}, ${ref ?? null}
    WHERE (SELECT COALESCE(SUM(delta), 0) FROM token_ledger WHERE user_id = ${userId}) >= ${cost}
    RETURNING id
  `) as { id: string }[];

  if (inserted.length === 0) return null; // insufficient balance
  return balanceOf(userId);
}

/**
 * Give tokens back when the work did not happen — a provider error, a timeout.
 * Charging for a video that never arrived is the one billing bug users never
 * forgive.
 */
export async function refund(userId: string, action: string, ref?: string): Promise<void> {
  const q = sql();
  if (!q || !(await ensureSchema())) return;
  const cost = costOf(action);
  if (cost <= 0) return;
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    VALUES (${userId}, ${cost}, ${`refund:${action}`}, ${ref ? `refund:${ref}` : null})
    ON CONFLICT (ref) WHERE ref IS NOT NULL DO NOTHING`;
}

/**
 * Credit a purchase. `ref` is the payment identifier, and the unique index on
 * it means a webhook delivered twice — which Stripe does by design — credits
 * the tokens exactly once.
 */
export async function credit(userId: string, amount: number, reason: string, ref: string): Promise<void> {
  const q = sql();
  if (!q || !(await ensureSchema())) return;
  if (!Number.isInteger(amount) || amount <= 0) return;
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    VALUES (${userId}, ${amount}, ${reason}, ${ref})
    ON CONFLICT (ref) WHERE ref IS NOT NULL DO NOTHING`;
}
