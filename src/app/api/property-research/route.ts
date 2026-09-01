import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { evaluateAction } from "@/lib/property-intelligence/compliance";
import { masterAgreementText, unlockAcknowledgmentText } from "@/lib/property-intelligence/agreement";
import { payloadLeaksIdentity } from "@/lib/property-intelligence/preview";
import {
  clientPortalPayload,
  deleteClientBuyBox,
  hasMasterAgreement,
  pauseClientBuyBox,
  recordMasterAgreement,
  recordUnlockAck,
  runOpportunityPipeline,
  saveClientBuyBox,
} from "@/lib/property-intelligence/opportunity";
import { AGREEMENT_VERSION, UNLOCK_PRICE_USD } from "@/lib/property-intelligence/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function userOr401() {
  const user = await currentUser();
  if (!user) return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user, res: null };
}

function assertNoLeak(payload: unknown) {
  if (payloadLeaksIdentity(payload)) {
    throw new Error("LOCKED_PAYLOAD_LEAK");
  }
}

export async function GET() {
  const { user, res } = await userOr401();
  if (!user) return res;
  const portal = await clientPortalPayload(user.id);
  try {
    assertNoLeak({ opportunities: portal.opportunities, alerts: portal.alerts });
  } catch {
    return NextResponse.json({ error: "Preview blocked — reverse-identification risk." }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    unlockPriceUsd: UNLOCK_PRICE_USD,
    agreementVersion: AGREEMENT_VERSION,
    agreementDraft: masterAgreementText({ clientName: user.name || user.email }),
    hasAgreement: await hasMasterAgreement(user.id),
    attorneyApproved: false,
    productName: "Property Research & Opportunity Discovery",
    portal,
  });
}

export async function POST(req: Request) {
  const { user, res } = await userOr401();
  if (!user) return res;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "evaluate") {
    return NextResponse.json({ ok: true, decision: evaluateAction(String(body.text || "")) });
  }
  if (action === "save-buy-box") {
    const r = await saveClientBuyBox(user.id, (body.box || {}) as never, body.boxId ? String(body.boxId) : undefined);
    const pipe = await runOpportunityPipeline(user.id);
    const portal = await clientPortalPayload(user.id);
    try {
      assertNoLeak({ opportunities: portal.opportunities, alerts: portal.alerts });
    } catch {
      return NextResponse.json({ error: "Preview blocked — reverse-identification risk." }, { status: 500 });
    }
    return NextResponse.json({
      ok: r.ok,
      id: r.ok ? r.id : undefined,
      created: pipe.created,
      rejected: pipe.rejected,
      qualified: pipe.qualified,
      rejectReasons: pipe.rejectReasons || [],
      portal,
    });
  }
  if (action === "pause-box") {
    await pauseClientBuyBox(user.id, String(body.boxId || ""), true);
  } else if (action === "resume-box") {
    await pauseClientBuyBox(user.id, String(body.boxId || ""), false);
  } else if (action === "delete-box") {
    await deleteClientBuyBox(user.id, String(body.boxId || ""));
  } else if (action === "accept-agreement") {
    const name = String(body.signerName || user.name || user.email);
    const sig = String(body.signature || "").trim();
    if (sig.length < 2) return NextResponse.json({ error: "Electronic signature required." }, { status: 400 });
    await recordMasterAgreement(user.id, name, sig);
  } else if (action === "ack-unlock") {
    const oppId = String(body.opportunityId || "");
    if (!oppId) return NextResponse.json({ error: "Opportunity ID required." }, { status: 400 });
    if (!(await hasMasterAgreement(user.id))) {
      return NextResponse.json({ error: "Accept the master agreement first." }, { status: 403 });
    }
    await recordUnlockAck(user.id, oppId);
    return NextResponse.json({
      ok: true,
      acknowledgment: unlockAcknowledgmentText(oppId, user.name || user.email),
      portal: await clientPortalPayload(user.id),
    });
  } else if (action === "refresh-matches") {
    await runOpportunityPipeline(user.id);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const portal = await clientPortalPayload(user.id);
  try {
    assertNoLeak({ opportunities: portal.opportunities });
  } catch {
    return NextResponse.json({ error: "Preview blocked — reverse-identification risk." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, portal, hasAgreement: await hasMasterAgreement(user.id) });
}
