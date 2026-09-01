import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { startUnlockCheckout } from "@/lib/property-intelligence/unlock";
import { UNLOCK_PRICE_CENTS, UNLOCK_PRICE_USD } from "@/lib/property-intelligence/constants";
import { assertUnlockPriceCents } from "@/lib/property-intelligence/compliance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { opportunityId?: string; amountCents?: number };
  const requested = body.amountCents == null ? UNLOCK_PRICE_CENTS : Number(body.amountCents);
  const price = assertUnlockPriceCents(requested);
  if (!price.allow) return NextResponse.json({ error: price.message }, { status: 400 });
  const opportunityId = String(body.opportunityId || "");
  if (!opportunityId) return NextResponse.json({ error: "Opportunity ID required." }, { status: 400 });
  const result = await startUnlockCheckout({
    userId: user.id,
    email: user.email,
    opportunityId,
    req,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, alreadyUnlocked: result.alreadyUnlocked === true, unlockPriceUsd: UNLOCK_PRICE_USD },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, url: result.url, sessionId: result.sessionId, unlockPriceUsd: UNLOCK_PRICE_USD });
}
