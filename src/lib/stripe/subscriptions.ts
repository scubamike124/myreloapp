import { ensureSchema, sqlAsync } from "@/lib/db";

export type SubscriptionRow = {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  lookup_key: string | null;
  plan_name: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function upsertSubscription(row: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  lookupKey?: string | null;
  planName?: string | null;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return;

  await q`
    INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id, lookup_key, plan_name,
      status, current_period_start, current_period_end, cancel_at_period_end, updated_at
    ) VALUES (
      ${row.userId},
      ${row.stripeSubscriptionId},
      ${row.stripeCustomerId ?? null},
      ${row.lookupKey ?? null},
      ${row.planName ?? null},
      ${row.status},
      ${row.currentPeriodStart ?? null},
      ${row.currentPeriodEnd ?? null},
      ${row.cancelAtPeriodEnd ? 1 : 0},
      ${new Date().toISOString()}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
      lookup_key = COALESCE(EXCLUDED.lookup_key, subscriptions.lookup_key),
      plan_name = COALESCE(EXCLUDED.plan_name, subscriptions.plan_name),
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function markSubscriptionCanceled(stripeSubscriptionId: string): Promise<void> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return;
  await q`
    UPDATE subscriptions
    SET status = 'canceled', updated_at = ${new Date().toISOString()}
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
  `;
}

export async function latestCustomerIdForUser(userId: string): Promise<string | null> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return null;
  const rows = (await q`
    SELECT stripe_customer_id FROM subscriptions
    WHERE user_id = ${userId} AND stripe_customer_id IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 1
  `) as { stripe_customer_id: string }[];
  return rows[0]?.stripe_customer_id ?? null;
}

export async function activeSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return null;
  const rows = (await q`
    SELECT user_id, stripe_subscription_id, stripe_customer_id, lookup_key, plan_name,
           status, current_period_start, current_period_end, cancel_at_period_end
    FROM subscriptions
    WHERE user_id = ${userId}
      AND status IN ('active', 'trialing', 'past_due')
    ORDER BY updated_at DESC
    LIMIT 1
  `) as Array<{
    user_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string | null;
    lookup_key: string | null;
    plan_name: string | null;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: number | boolean;
  }>;
  const r = rows[0];
  if (!r) return null;
  return {
    user_id: r.user_id,
    stripe_subscription_id: r.stripe_subscription_id,
    stripe_customer_id: r.stripe_customer_id,
    lookup_key: r.lookup_key,
    plan_name: r.plan_name,
    status: r.status,
    current_period_start: r.current_period_start,
    current_period_end: r.current_period_end,
    cancel_at_period_end: Boolean(r.cancel_at_period_end),
  };
}

/** Record processed webhook event ids for idempotency beyond token_ledger refs. */
export async function claimWebhookEvent(eventId: string, type: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return "unavailable";
  try {
    await q`
      INSERT INTO stripe_webhook_events (id, type, received_at)
      VALUES (${eventId}, ${type}, ${new Date().toISOString()})
    `;
    return "claimed";
  } catch {
    return "duplicate";
  }
}
