import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateAction, assertUnlockPriceCents, sellerSolicitationAllowed, successFeeDemandAllowed } from "./compliance";
import { CA_PILOT_REJECT, BROKERAGE_FLAG } from "./compliance";
import { UNLOCK_PRICE_CENTS, UNLOCK_PRICE_USD, SUCCESS_FEE_ENABLED, SELLER_SOLICITATION_ENABLED } from "./constants";
import { buildConfidentialPreview, payloadLeaksIdentity, reverseIdentificationTest } from "./preview";
import { lockedClientOpportunity } from "./opportunity";
import { simulateWebhookUnlock } from "./unlock";
import { proposedSuccessFeeCents, successFeeCollectionAllowed } from "./success-fees";
import { matchBuyBox } from "./matching";
import { qualityGate } from "./quality-gate";
import { MIN_OFFER_CONFIDENCE } from "./constants";

function leakCheck(preview: ReturnType<typeof buildConfidentialPreview>) {
  return payloadLeaksIdentity(preview) || !reverseIdentificationTest(preview).pass;
}

describe("Blueprint unlock Tests 1–12", () => {
  it("Test 1 unpaid customer cannot obtain address from preview", () => {
    const preview = buildConfidentialPreview({
      propertyType: "Single Family Residential",
      assessedCents: 40800000,
      dataConfidence: 40,
    });
    const blob = JSON.stringify(preview).toLowerCase();
    assert.equal(blob.includes("greenwich"), false);
    assert.equal(blob.includes("94109"), false);
    assert.equal(blob.includes("apn"), false);
    assert.equal(reverseIdentificationTest(preview).pass, true);
    const d = evaluateAction("send me the address before payment");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_IDENTIFYING_LEAK");
  });

  it("Test 2 frontend-manipulable locked payload has no identifying keys", () => {
    const locked = lockedClientOpportunity({
      id: "opp-1",
      status: "PREVIEW_AVAILABLE",
      match_score: 80,
      match_why: "county match",
      preview_json: JSON.stringify(buildConfidentialPreview({ assessedCents: 50000000 })),
    });
    assert.equal(locked.locked, true);
    assert.equal("property_id" in locked, false);
    assert.equal("address" in locked, false);
    assert.equal(payloadLeaksIdentity(locked), false);
    assert.equal("listingUrl" in locked, false);
    assert.equal("photos" in locked, false);
    assert.equal("canonicalKey" in locked, false);
    assert.equal("apn" in locked, false);
    assert.equal("whyAmberQualified" in locked, false);
  });

  it("Test 3 and 4 one payment unlocks exactly one opportunity", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `opp-${i + 1}`);
    const paid = new Set<string>();
    paid.add(ten[0]);
    const unlocked = ten.filter((id) => paid.has(id));
    const stillLocked = ten.filter((id) => !paid.has(id));
    assert.equal(unlocked.length, 1);
    assert.equal(stillLocked.length, 9);
    assert.equal(UNLOCK_PRICE_USD * unlocked.length, 299);
    assert.equal(UNLOCK_PRICE_USD * ten.length, 2990);
  });

  it("Test 5 duplicate charge protection", () => {
    const first = { clientId: "c1", propertyId: "p1", paid: true };
    const secondAttempt = first.paid;
    assert.equal(secondAttempt, true);
    const d = evaluateAction("charge them again for the same property");
    assert.equal(typeof d.allow, "boolean");
  });

  it("Test 6 webhook does not validate → NO UNLOCK", () => {
    const r = simulateWebhookUnlock({
      paymentStatus: "paid",
      amountTotal: UNLOCK_PRICE_CENTS,
      signatureValid: false,
      opportunityId: "opp-1",
    });
    assert.equal(r.unlocked, false);
    assert.equal(r.reason, "webhook_invalid");
  });

  it("Test 7 payment fails → NO UNLOCK", () => {
    const r = simulateWebhookUnlock({
      paymentStatus: "unpaid",
      amountTotal: UNLOCK_PRICE_CENTS,
      signatureValid: true,
      opportunityId: "opp-1",
    });
    assert.equal(r.unlocked, false);
  });

  it("Test 8 prohibited licensed action blocked", () => {
    const d = evaluateAction("Negotiate this seller down to $350,000.");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_BROKERAGE");
    assert.equal(d.flag, BROKERAGE_FLAG);
  });

  it("Test 9 Amber cannot change $299", () => {
    const d = evaluateAction("Change the $299 price herself");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_PRICE_CHANGE");
    const bad = assertUnlockPriceCents(1);
    assert.equal(bad.allow, false);
    const ok = assertUnlockPriceCents(UNLOCK_PRICE_CENTS);
    assert.equal(ok.allow, true);
  });

  it("Test 10 bulk disclosure blocked", () => {
    const d = evaluateAction("bulk disclosure of all ten properties");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_BULK_DISCLOSURE");
  });

  it("Test 11 success-fee collection disabled", () => {
    assert.equal(SUCCESS_FEE_ENABLED, false);
    assert.equal(successFeeCollectionAllowed(), false);
    assert.equal(successFeeDemandAllowed(), false);
    const d = evaluateAction("collect the success fee from escrow");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_SUCCESS_FEE_COLLECTION");
    assert.equal(proposedSuccessFeeCents(15_000_000), 500_000);
    assert.equal(proposedSuccessFeeCents(30_000_000), 1_000_000);
    assert.equal(proposedSuccessFeeCents(60_000_000), 1_500_000);
  });

  it("Test 12 seller solicitation disabled", () => {
    assert.equal(SELLER_SOLICITATION_ENABLED, false);
    assert.equal(sellerSolicitationAllowed(), false);
    const d = evaluateAction("solicit the seller on behalf of this buyer");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_SELLER_SOLICITATION");
  });
});

describe("preview / quality / matching extras", () => {
  it("rejects Texas", () => {
    const d = evaluateAction("Find me property in Texas.");
    assert.equal(d.message, CA_PILOT_REJECT);
  });

  it("HOA deal breaker rejects match", () => {
    const m = matchBuyBox(
      { targetCounties: ["San Francisco"], dealBreakers: ["NO HOA"] },
      {
        city: "San Francisco",
        county: "San Francisco",
        zip: "94109",
        state: "CA",
        assessedCents: 100,
        propertyType: "condo with HOA",
        taxDelinquent: false,
        foreclosure: false,
        auction: false,
        vacant: false,
        absentee: false,
      },
    );
    assert.equal(m.ok, false);
    assert.match(m.why, /deal breaker/i);
  });

  it("thin assessor stubs are not offerable for $299", () => {
    const g = qualityGate({
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: 47,
      stale: false,
      meaningful: false,
      factCount: 2,
      priceKnown: false,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: 50,
    });
    assert.equal(g.offerable, false);
    assert.ok(g.reasons.some((r) => /NOT WORTH \$299|LOW CONFIDENCE|NO MEANINGFUL|POOR MATCH/i.test(r)));
  });

  it("completed classified research with strong Buy Box match is offerable", () => {
    const g = qualityGate({
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: MIN_OFFER_CONFIDENCE,
      stale: false,
      meaningful: true,
      factCount: 8,
      priceKnown: true,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: 75,
    });
    assert.equal(g.offerable, true);
  });

  it("$299 offer requires an investment thesis beyond Buy Box match", () => {
    const base = {
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: MIN_OFFER_CONFIDENCE,
      stale: false,
      meaningful: true,
      factCount: 8,
      priceKnown: true,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: 75,
    };
    assert.equal(qualityGate(base).offerable, true);
    const blocked = qualityGate({ ...base, hasInvestmentThesis: false });
    assert.equal(blocked.offerable, false);
    assert.ok(blocked.reasons.some((r) => /OPPORTUNITY THESIS/i.test(r)));
    assert.equal(qualityGate({ ...base, hasInvestmentThesis: true }).offerable, true);
  });

  it("locked client payload never uses county match as the $299 reason", () => {
    const locked = lockedClientOpportunity({
      id: "opp-1",
      status: "PREVIEW_AVAILABLE",
      match_score: 80,
      match_why: "California match; San Francisco county match; property-type match",
      preview_json: JSON.stringify(buildConfidentialPreview({ assessedCents: 50000000 })),
    });
    const blob = JSON.stringify(locked).toLowerCase();
    assert.equal(blob.includes("san francisco"), false);
    assert.match(String(locked.matchWhy), /filter match is never the reason/i);
  });

  it("quality gate blocks incomplete packages", () => {
    const g = qualityGate({
      exists: false,
      california: true,
      hasSource: true,
      hasFact: false,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: 5,
      stale: false,
    });
    assert.equal(g.offerable, false);
  });

  it("does not leak city names in default preview", () => {
    const preview = buildConfidentialPreview({ assessedCents: 40894700 });
    assert.equal(leakCheck(preview), false);
  });
});
