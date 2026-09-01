import { createHmac, timingSafeEqual } from "node:crypto";
import {
  belongsToReelo,
  catalogByLookupKey,
  isReeloLookupKey,
  REELO_BUSINESS,
} from "@/lib/stripe/catalog";
import {
  stripeRequest,
  type StripeCheckoutSession,
  type StripeEvent,
  type StripeSubscription,
} from "@/lib/stripe/client";
import {
  claimWebhookEvent,
  markSubscriptionCanceled,
  upsertSubscription,
} from "@/lib/stripe/subscriptions";
import { credit } from "@/lib/tokens";
import { STRIPE_UNLOCK_LOOKUP_KEY } from "@/lib/property-intelligence/constants";
import { fulfillUnlockFromStripe } from "@/lib/property-intelligence/unlock";

export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!signatureHeader) return { ok: false, message: "Missing Stripe-Signature header" };

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1" && value) v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) {
    return { ok: false, message: "Invalid signature format" };
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSec) {
    return { ok: false, message: "Webhook timestamp outside tolerance" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  const match = v1Signatures.some((sig) => {
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(sig, "utf8");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });

  if (!match) return { ok: false, message: "Stripe signature mismatch" };
  return { ok: true };
}

function customerIdOf(obj: { customer?: string | { id: string } | null }): string | null {
  if (!obj.customer) return null;
  return typeof obj.customer === "string" ? obj.customer : obj.customer.id;
}

function isoFromUnix(sec?: number | null): string | null {
  if (!sec) return null;
  return new Date(sec * 1000).toISOString();
}

function metaOf(obj: Record<string, unknown> | { metadata?: Record<string, string> }): Record<string, string> {
  const m = (obj as { metadata?: Record<string, string> }).metadata;
  return m && typeof m === "object" ? m : {};
}

/**
 * Shared-account isolation gate.
 * Returns false for Rest Pilot / other businesses — acknowledge but do not mutate Reelo DB.
 */
export function eventBelongsToReelo(event: StripeEvent): boolean {
  const obj = event.data.object as Record<string, unknown>;
  const meta = metaOf(obj);

  if (belongsToReelo({ metadata: meta })) return true;

  if (event.type.startsWith("customer.subscription.")) {
    const sub = obj as unknown as StripeSubscription;
    const lk = sub.items?.data?.[0]?.price?.lookup_key || meta.lookupKey;
    return belongsToReelo({ metadata: meta, lookupKey: lk });
  }

  if (event.type === "checkout.session.completed") {
    return belongsToReelo({ metadata: meta, lookupKey: meta.lookupKey });
  }

  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_succeeded" ||
    event.type === "invoice.payment_failed"
  ) {
    const subMeta = (obj.subscription_details as { metadata?: Record<string, string> } | undefined)
      ?.metadata;
    const lines = obj.lines as { data?: Array<{ price?: { lookup_key?: string } }> } | undefined;
    const lk = lines?.data?.[0]?.price?.lookup_key || subMeta?.lookupKey || meta.lookupKey;
    return belongsToReelo({ metadata: subMeta || meta, lookupKey: lk });
  }

  return belongsToReelo({ metadata: meta });
}

async function creditFromLookup(
  userId: string,
  lookupKey: string,
  ref: string,
  reason: string,
): Promise<void> {
  if (!isReeloLookupKey(lookupKey)) {
    console.warn("[stripe.webhook] refusing non-Reelo lookup_key", lookupKey);
    return;
  }
  const item = catalogByLookupKey(lookupKey);
  if (!item) {
    console.error("[stripe.webhook] unknown Reelo lookup_key", lookupKey);
    return;
  }
  const ledgerRef = ref.startsWith("reelo:") ? ref : `reelo:${ref}`;
  await credit(userId, item.tokens, reason, ledgerRef);
}

async function handleSubscription(sub: StripeSubscription): Promise<void> {
  if (!belongsToReelo({ metadata: sub.metadata, lookupKey: sub.items?.data?.[0]?.price?.lookup_key })) {
    return;
  }
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("[stripe.webhook] Reelo subscription missing userId metadata", sub.id);
    return;
  }
  const price = sub.items?.data?.[0]?.price;
  const lookupKey = price?.lookup_key || "";
  const item = catalogByLookupKey(lookupKey);
  const periodStart =
    sub.items?.data?.[0]?.current_period_start ?? sub.current_period_start;
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;

  await upsertSubscription({
    userId,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerIdOf(sub),
    lookupKey: lookupKey || null,
    planName: item?.planName ?? null,
    status: sub.status,
    currentPeriodStart: isoFromUnix(periodStart),
    currentPeriodEnd: isoFromUnix(periodEnd),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  });
}

async function handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
  if (!belongsToReelo({ metadata: session.metadata, lookupKey: session.metadata?.lookupKey })) {
    return;
  }
  const userId = session.metadata?.userId;
  const lookupKey = session.metadata?.lookupKey;
  if (!userId || !lookupKey) return;

  const ref = `checkout:${session.id}`;
  const item = catalogByLookupKey(lookupKey);

  if (lookupKey === STRIPE_UNLOCK_LOOKUP_KEY || session.metadata?.product === "pi_research_unlock") {
    await fulfillUnlockFromStripe({
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      metadata: session.metadata,
      payment_intent: session.payment_intent,
    });
    return;
  }

  if (!item) return;

  if (session.mode === "payment") {
    await creditFromLookup(userId, lookupKey, ref, `pack:${lookupKey}`);
    await upsertSubscription({
      userId,
      stripeSubscriptionId: `pack_${session.id}`,
      stripeCustomerId: customerIdOf(session),
      lookupKey,
      planName: null,
      status: "one_time",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    return;
  }

  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    await creditFromLookup(userId, lookupKey, ref, `plan:${lookupKey}`);
  }

  if (session.subscription) {
    const subId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    await upsertSubscription({
      userId,
      stripeSubscriptionId: subId,
      stripeCustomerId: customerIdOf(session),
      lookupKey,
      planName: item.planName ?? null,
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      cancelAtPeriodEnd: false,
    });
  }
}

async function handleInvoicePaid(invoice: Record<string, unknown>): Promise<void> {
  const billingReason = String(invoice.billing_reason ?? "");
  if (billingReason === "subscription_create") return;

  const lines = invoice.lines as
    | { data?: Array<{ price?: { lookup_key?: string }; metadata?: Record<string, string> }> }
    | undefined;
  let lookupKey =
    lines?.data?.[0]?.price?.lookup_key ||
    (invoice.subscription_details as { metadata?: Record<string, string> } | undefined)?.metadata
      ?.lookupKey ||
    "";

  let userId =
    (invoice.subscription_details as { metadata?: Record<string, string> } | undefined)?.metadata
      ?.userId ||
    (invoice.metadata as Record<string, string> | undefined)?.userId ||
    "";

  const subMeta = (invoice.subscription_details as { metadata?: Record<string, string> } | undefined)
    ?.metadata;

  const subRef = invoice.subscription;
  if ((!userId || !lookupKey || !belongsToReelo({ metadata: subMeta, lookupKey })) && subRef) {
    const subId = typeof subRef === "string" ? subRef : (subRef as { id: string }).id;
    try {
      const sub = await stripeRequest<StripeSubscription>("GET", `/subscriptions/${subId}`);
      if (!belongsToReelo({ metadata: sub.metadata, lookupKey: sub.items?.data?.[0]?.price?.lookup_key })) {
        return;
      }
      userId = userId || sub.metadata?.userId || "";
      const lk = lookupKey || sub.items?.data?.[0]?.price?.lookup_key || "";
      if (userId && lk) {
        await creditFromLookup(userId, lk, `invoice:${String(invoice.id)}`, `renewal:${lk}`);
        await handleSubscription(sub);
      }
      return;
    } catch (e) {
      console.error("[stripe.webhook] invoice.paid subscription fetch failed", e);
      return;
    }
  }

  if (!belongsToReelo({ metadata: subMeta || metaOf(invoice), lookupKey })) return;
  if (!userId || !lookupKey) return;
  await creditFromLookup(userId, lookupKey, `invoice:${String(invoice.id)}`, `renewal:${lookupKey}`);
}

export type HandleResult = { processed: boolean; ignored?: string };

export async function handleStripeEvent(event: StripeEvent): Promise<HandleResult> {
  // Isolation first — do not claim event ids for foreign businesses.
  if (!eventBelongsToReelo(event)) {
    return { processed: false, ignored: "non_reelo_business" };
  }

  const claim = await claimWebhookEvent(event.id, event.type);
  if (claim === "duplicate") return { processed: false, ignored: "duplicate" };
  if (claim === "unavailable") {
    throw new Error("Database unavailable for webhook idempotency");
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as unknown as StripeCheckoutSession);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscription(event.data.object as unknown as StripeSubscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as StripeSubscription;
      if (belongsToReelo({ metadata: sub.metadata, lookupKey: sub.items?.data?.[0]?.price?.lookup_key })) {
        await markSubscriptionCanceled(sub.id);
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      console.warn(
        `[stripe.webhook] ${REELO_BUSINESS} invoice.payment_failed`,
        (event.data.object as { id?: string }).id,
      );
      break;
    default:
      break;
  }

  return { processed: true };
}
