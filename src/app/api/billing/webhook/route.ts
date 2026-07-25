import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/billing";
import { credit } from "@/lib/tokens";
import { ensureSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook
 * Credits the token ledger on checkout.session.completed (idempotent via session id).
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId?.trim();
    const tokens = Number(session.metadata?.tokens ?? 0);
    const packId = session.metadata?.packId ?? "pack";
    if (!userId || !(tokens > 0)) {
      return NextResponse.json({ ok: true, skipped: "missing metadata" });
    }
    if (!(await ensureSchema())) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }
    // ref = session id → unique ledger row; retries are no-ops.
    await credit(userId, tokens, `purchase:${packId}`, `stripe:${session.id}`);
  }

  return NextResponse.json({ ok: true, received: event.type });
}
