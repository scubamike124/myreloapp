import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { billingReturnUrls, getStripe, packFromId, stripeConfigured } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout  { packId: "pack-10" }
 * Creates a Stripe Checkout Session for a one-off token pack.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server yet. Set STRIPE_SECRET_KEY in the Workers secrets." },
      { status: 503 },
    );
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to buy tokens." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pack = packFromId(String(body.packId ?? ""));
  if (!pack) {
    return NextResponse.json({ error: "Unknown token pack." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const { success, cancel } = billingReturnUrls();
  const amountCents = Math.round(pack.priceUsd * 100);
  if (amountCents < 50) {
    return NextResponse.json({ error: "Pack price is below Stripe's minimum." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${success}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel,
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${pack.tokens} Reelo token${pack.tokens === 1 ? "" : "s"}`,
              description: `One-time token pack · face value $${pack.priceUsd}`,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        packId: pack.id,
        tokens: String(pack.tokens),
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          packId: pack.id,
          tokens: String(pack.tokens),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start checkout." },
      { status: 502 },
    );
  }
}
