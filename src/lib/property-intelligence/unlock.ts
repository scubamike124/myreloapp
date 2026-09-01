import { randomUUID } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { audit, openNeedsMike } from "./persist";
import {
  STRIPE_PUBLIC_DESCRIPTION,
  STRIPE_UNLOCK_LOOKUP_KEY,
  UNLOCK_PRICE_CENTS,
  UNLOCK_PRICE_USD,
} from "./constants";
import { assertUnlockPriceCents } from "./compliance";
import { findPaidUnlock, getOpportunityForUser, hasMasterAgreement } from "./opportunity";
import { REELO_BUSINESS } from "@/lib/stripe/catalog";
import {
  findOrCreateCustomer,
  publicAppOrigin,
  stripeConfigured,
  stripeRequest,
  type StripeCheckoutSession,
} from "@/lib/stripe/client";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export async function startUnlockCheckout(opts: {
  userId: string;
  email: string;
  opportunityId: string;
  req: Request;
}): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string; status: number; alreadyUnlocked?: boolean }> {
  if (!stripeConfigured()) {
    return { ok: false, error: "Stripe is not configured.", status: 503 };
  }
  const priceGate = assertUnlockPriceCents(UNLOCK_PRICE_CENTS);
  if (!priceGate.allow) return { ok: false, error: priceGate.message, status: 400 };

  const opp = await getOpportunityForUser(opts.userId, opts.opportunityId);
  if (!opp) return { ok: false, error: "Opportunity not found.", status: 404 };
  if (Number(opp.quality_ok) !== 1 || String(opp.status) === "INTERNAL_NOT_OFFERABLE") {
    return { ok: false, error: "This package is not offered for $299 until it passes the research quality gate.", status: 403 };
  }
  const propertyId = String(opp.property_id);
  const prior = await findPaidUnlock(opts.userId, propertyId);
  if (prior) {
    return { ok: false, error: "Already purchased. Access remains available — no second charge.", status: 409, alreadyUnlocked: true };
  }
  if (!(await hasMasterAgreement(opts.userId))) {
    return { ok: false, error: "Master agreement must be accepted before checkout.", status: 403 };
  }
  const q = await db();
  if (!q) return { ok: false, error: "Database unavailable.", status: 503 };

  const acks = (await q`
    SELECT id FROM pi_unlock_acks WHERE user_id = ${opts.userId} AND opportunity_id = ${opts.opportunityId} LIMIT 1
  `) as { id: string }[];
  if (!acks[0]) {
    return { ok: false, error: "Individual property unlock acknowledgment is required before checkout.", status: 403 };
  }
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = (await q`
    SELECT COUNT(*) AS n FROM pi_payments WHERE user_id = ${opts.userId} AND created_at >= ${hourAgo}
  `) as { n: number }[];
  if (Number(recent[0]?.n || 0) >= 20) {
    return { ok: false, error: "Checkout rate limit. Try again later.", status: 429 };
  }

  const customerId = await findOrCreateCustomer({ userId: opts.userId, email: opts.email });
  const origin = publicAppOrigin(opts.req);
  const session = await stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", {
    mode: "payment",
    customer: customerId,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": UNLOCK_PRICE_CENTS,
    "line_items[0][price_data][product_data][name]": STRIPE_PUBLIC_DESCRIPTION,
    "line_items[0][quantity]": 1,
    success_url: `${origin}/property-research?checkout=success&opportunity=${opts.opportunityId}`,
    cancel_url: `${origin}/property-research?checkout=canceled`,
    client_reference_id: opts.userId,
    "metadata[business]": REELO_BUSINESS,
    "metadata[userId]": opts.userId,
    "metadata[lookupKey]": STRIPE_UNLOCK_LOOKUP_KEY,
    "metadata[opportunityId]": opts.opportunityId,
    "metadata[product]": "pi_research_unlock",
    "payment_intent_data[metadata][business]": REELO_BUSINESS,
    "payment_intent_data[metadata][userId]": opts.userId,
    "payment_intent_data[metadata][lookupKey]": STRIPE_UNLOCK_LOOKUP_KEY,
    "payment_intent_data[metadata][opportunityId]": opts.opportunityId,
    "payment_intent_data[description]": STRIPE_PUBLIC_DESCRIPTION,
  });
  if (!session.url) return { ok: false, error: "Stripe did not return a checkout URL.", status: 502 };

  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_payments (
      id, user_id, opportunity_id, property_id, stripe_session_id, amount_cents, status, agreement_version, created_at
    ) VALUES (
      ${randomUUID()}, ${opts.userId}, ${opts.opportunityId}, ${propertyId}, ${session.id}, ${UNLOCK_PRICE_CENTS}, ${"checkout_created"},
      ${(opp.agreement_version as string) || "CA-PILOT-DRAFT-1.0"}, ${now}
    )
  `;
  await audit(opts.userId, "unlock_checkout_created", {
    reason: `Opportunity ${opts.opportunityId} checkout $${UNLOCK_PRICE_USD}`,
    source: STRIPE_UNLOCK_LOOKUP_KEY,
  });
  return { ok: true, url: session.url, sessionId: session.id };
}

export async function fulfillUnlockFromStripe(session: {
  id: string;
  payment_status?: string;
  amount_total?: number | null;
  metadata?: Record<string, string>;
  payment_intent?: string | { id: string } | null;
}): Promise<{ unlocked: boolean; reason: string }> {
  const meta = session.metadata || {};
  if (meta.lookupKey !== STRIPE_UNLOCK_LOOKUP_KEY && meta.product !== "pi_research_unlock") {
    return { unlocked: false, reason: "not_pi_unlock" };
  }
  if (session.payment_status !== "paid") {
    return { unlocked: false, reason: "payment_not_paid" };
  }
  let amount = Number(session.amount_total ?? 0);
  if (!amount) {
    try {
      const full = await stripeRequest<StripeCheckoutSession>("GET", `/checkout/sessions/${session.id}`);
      amount = Number(full.amount_total ?? 0);
      if (!session.payment_intent) session.payment_intent = full.payment_intent;
    } catch {
      return { unlocked: false, reason: "amount_unknown" };
    }
  }
  if (amount !== UNLOCK_PRICE_CENTS) {
    return { unlocked: false, reason: "amount_mismatch" };
  }
  const userId = meta.userId;
  const opportunityId = meta.opportunityId;
  if (!userId || !opportunityId) return { unlocked: false, reason: "missing_ids" };

  const q = await db();
  if (!q) return { unlocked: false, reason: "no_db" };
  const opp = await getOpportunityForUser(userId, opportunityId);
  if (!opp) return { unlocked: false, reason: "opportunity_not_found" };
  const propertyId = String(opp.property_id);
  const prior = await findPaidUnlock(userId, propertyId);
  if (prior) {
    return { unlocked: true, reason: "already_unlocked_no_duplicate_charge" };
  }

  const now = new Date().toISOString();
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

  await q`
    UPDATE pi_payments SET status = 'paid', stripe_payment_intent = ${pi}, paid_at = ${now}
    WHERE stripe_session_id = ${session.id}
  `;
  await q`
    UPDATE pi_opportunities SET
      status = 'DISCLOSED',
      unlocked_at = ${now},
      disclosed_at = ${now},
      stripe_session_id = ${session.id},
      stripe_payment_intent = ${pi},
      updated_at = ${now}
    WHERE id = ${opportunityId} AND client_user_id = ${userId}
  `;
  await q`
    INSERT INTO pi_disclosures (
      id, user_id, opportunity_id, property_id, stripe_session_id, disclosed_at, report_version, created_at
    ) VALUES (
      ${randomUUID()}, ${userId}, ${opportunityId}, ${propertyId}, ${session.id}, ${now}, ${"1.0"}, ${now}
    )
  `;
  await q`
    INSERT INTO pi_match_history (id, client_user_id, opportunity_id, property_id, event, match_score, created_at)
    VALUES (${randomUUID()}, ${userId}, ${opportunityId}, ${propertyId}, ${"unlocked"}, ${Number(opp.match_score || 0)}, ${now})
  `;
  await audit(userId, "property_unlocked", {
    reason: "Stripe webhook paid + amount verified",
    result: opportunityId,
    compliance: "ONE PROPERTY = ONE $299 UNLOCK",
  });
  const delivered = (await q`SELECT id FROM pi_properties WHERE id = ${propertyId} LIMIT 1`) as { id: string }[];
  if (!delivered[0]) {
    await openNeedsMike(
      userId,
      "REFUND / FAILED DELIVERY — $299 research package",
      `Stripe charged $299 for Opportunity ${opportunityId} but the property research row is missing. Do not substitute a different property. Follow published refund policy.`,
      "billing",
    );
  }
  return { unlocked: true, reason: "unlocked" };
}

export function simulateWebhookUnlock(input: {
  paymentStatus: string;
  amountTotal: number;
  signatureValid: boolean;
  opportunityId: string;
}): { unlocked: boolean; reason: string } {
  if (!input.signatureValid) return { unlocked: false, reason: "webhook_invalid" };
  if (input.paymentStatus !== "paid") return { unlocked: false, reason: "payment_not_paid" };
  if (input.amountTotal !== UNLOCK_PRICE_CENTS) return { unlocked: false, reason: "amount_mismatch" };
  if (!input.opportunityId) return { unlocked: false, reason: "missing_ids" };
  return { unlocked: true, reason: "unlocked" };
}
