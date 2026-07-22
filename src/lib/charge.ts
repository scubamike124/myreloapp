import { dbConfigured } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { spend, refund, costOf } from "@/lib/tokens";

// ---------------------------------------------------------------------------
// Charging a generation.
//
// One helper so every paid route bills the same way and none of them can forget
// the refund path.
//
// Behaviour without accounts: if there is no database, or nobody is signed in,
// generation proceeds and nothing is charged. That keeps the product working
// exactly as it does today while accounts are being rolled out — the per-IP
// daily caps are still in force underneath. Once DATABASE_URL is set and a user
// signs in, their balance is the limit.
// ---------------------------------------------------------------------------

export type Charge = {
  /** Present only when tokens were actually taken. */
  userId?: string;
  action: string;
  charged: number;
  balance: number | null;
};

export type ChargeResult = { ok: true; charge: Charge } | { ok: false; error: string; needed: number; balance: number };

export async function chargeFor(action: string): Promise<ChargeResult> {
  const cost = costOf(action);

  if (!dbConfigured()) {
    return { ok: true, charge: { action, charged: 0, balance: null } };
  }

  const user = await currentUser();
  if (!user) {
    // Anonymous use still works, still capped per IP. Requiring sign-in is a
    // product decision, not a technical one — flip it here when you want it.
    return { ok: true, charge: { action, charged: 0, balance: null } };
  }

  const balance = await spend(user.id, action);
  if (balance === null) {
    const { balanceOf } = await import("@/lib/tokens");
    return {
      ok: false,
      error: `Not enough tokens — this needs ${cost}.`,
      needed: cost,
      balance: await balanceOf(user.id),
    };
  }

  return { ok: true, charge: { userId: user.id, action, charged: cost, balance } };
}

/**
 * Give the tokens back when the generation failed. Every caller of chargeFor
 * must call this on its error path — being charged for a video that never
 * arrived is the one billing mistake customers do not forgive.
 */
export async function refundCharge(charge: Charge): Promise<void> {
  if (!charge.userId || charge.charged <= 0) return;
  await refund(charge.userId, charge.action);
}
