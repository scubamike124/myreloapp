import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateAction, evaluatePropertyLocation, CA_PILOT_REJECT, BROKERAGE_FLAG } from "./compliance";
import { analyzeProperty } from "./analysis";
import { matchBuyBox } from "./matching";

describe("Amber Property Intelligence compliance", () => {
  it("rejects brokerage negotiation", () => {
    const d = evaluateAction("Negotiate this seller down to $350,000.");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_BROKERAGE");
    assert.equal(d.flag, BROKERAGE_FLAG);
  });

  it("rejects sending an offer", () => {
    const d = evaluateAction("Send a $400,000 offer for me.");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_BROKERAGE");
  });

  it("rejects settlement-service kickbacks", () => {
    const d = evaluateAction("Recommend your mortgage company and collect a referral payment.");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_SETTLEMENT_KICKBACK");
  });

  it("rejects prohibited Zillow scraping", () => {
    const d = evaluateAction("Scrape Zillow even if its rules prohibit bots.");
    assert.equal(d.allow, false);
    assert.equal(d.code, "REJECT_PROHIBITED_SCRAPE");
  });

  it("allows permitted CA tax-default research", () => {
    const d = evaluateAction("Find public/permitted California tax-default information and analyze it.");
    assert.equal(d.allow, true);
    assert.equal(d.code, "ALLOW");
  });

  it("allows rental economics with estimate disclosure", () => {
    const d = evaluateAction("Calculate estimated rental economics from permitted data.");
    assert.equal(d.allow, true);
    assert.equal(d.code, "ALLOW_ESTIMATE");
    assert.match(d.message, /appraisal|verification/i);
  });

  it("rejects Texas / non-California", () => {
    const d = evaluateAction("Find me property in Texas.");
    assert.equal(d.allow, false);
    assert.equal(d.message, CA_PILOT_REJECT);
    const loc = evaluatePropertyLocation({ state: "TX", zip: "78701" });
    assert.equal(loc.allow, false);
    assert.equal(loc.message, CA_PILOT_REJECT);
  });

  it("accepts California zips", () => {
    const loc = evaluatePropertyLocation({ state: "CA", zip: "94109" });
    assert.equal(loc.allow, true);
  });
});

describe("scoring", () => {
  it("explains Deal Score and separates Data Confidence", () => {
    const r = analyzeProperty({
      askingCents: null,
      assessedCents: 40000000,
      estMarketCents: 70000000,
      estRentCents: null,
      ownershipYears: 20,
      absentee: true,
      vacant: false,
      taxDelinquent: true,
      foreclosure: false,
      auction: false,
      fsbo: false,
      sourceReliability: 82,
      fieldsPresent: 6,
      fieldsTotal: 12,
    });
    assert.ok(r.dealScore >= 1 && r.dealScore <= 99);
    assert.ok(r.dataConfidence >= 1 && r.dataConfidence <= 99);
    assert.match(r.why, /WHY AMBER FLAGGED THIS PROPERTY/);
    assert.ok(r.fields.some((f) => f.kind === "ESTIMATE"));
  });

  it("scores tax-default as a distress signal without claiming title is clear", () => {
    const r = analyzeProperty({
      askingCents: null,
      assessedCents: null,
      estMarketCents: null,
      estRentCents: null,
      ownershipYears: null,
      absentee: false,
      vacant: false,
      taxDelinquent: true,
      foreclosure: false,
      auction: false,
      fsbo: false,
      sourceReliability: 86,
      fieldsPresent: 4,
      fieldsTotal: 12,
    });
    assert.ok(r.distress.includes("tax delinquency indicator"));
    assert.match(r.why, /WHY AMBER FLAGGED THIS PROPERTY/);
    assert.equal(r.fields.find((f) => f.label === "Estimated equity")?.kind, "UNKNOWN");
  });

  it("does not invent Buy Box matches outside geography", () => {
    const m = matchBuyBox(
      { targetCounties: ["San Francisco"] },
      {
        city: "Austin",
        county: "Travis",
        zip: "78701",
        state: "TX",
        assessedCents: 100,
        propertyType: "sfr",
        taxDelinquent: false,
        foreclosure: false,
        auction: false,
        vacant: false,
        absentee: false,
      },
    );
    assert.equal(m.ok, false);
    assert.equal(m.why, CA_PILOT_REJECT);
  });
});
