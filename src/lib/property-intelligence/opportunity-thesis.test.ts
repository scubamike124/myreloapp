import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateOpportunityThesis } from "./opportunity-thesis";
import { reverseIdentificationTest } from "./preview";

const BOX = { desiredState: "CA" as const, targetCounties: ["San Francisco"], propertyType: "Residential" };

describe("Opportunity thesis — $299 hard gate", () => {
  it("SF assessor identity with no distress is not a $299 opportunity", () => {
    const thesis = evaluateOpportunityThesis({
      box: BOX,
      taxDelinquent: false,
      foreclosure: false,
      auction: false,
      vacant: false,
      absentee: false,
      assessedCents: 100671400,
      payload: { assessed_land_value: "704703", assessed_improvement_value: "302011", use_definition: "Single Family Residential" },
      sourceSlugs: ["sfgov_assessor"],
      matchWhy: "California match; San Francisco county match; property-type match",
    });
    assert.equal(thesis.offerable, false);
    assert.match(thesis.rejectReason, /NO WORTHWHILE OPPORTUNITY THESIS/i);
    assert.equal(thesis.signals.filter((s) => s.kind === "FACT").length, 0);
    const clientBlob = JSON.stringify(thesis.client).toLowerCase();
    assert.equal(clientBlob.includes("san francisco"), false);
    assert.equal(clientBlob.includes("sfgov"), false);
    assert.equal(reverseIdentificationTest(thesis.client).pass, true);
  });

  it("asking below assessed value is ESTIMATE only and cannot qualify alone", () => {
    const thesis = evaluateOpportunityThesis({
      box: BOX,
      askingCents: 80_000_000,
      assessedCents: 120_000_000,
      taxDelinquent: false,
      foreclosure: false,
      auction: false,
      vacant: false,
      absentee: false,
      sourceSlugs: ["listing"],
    });
    assert.equal(thesis.offerable, false);
    assert.equal(thesis.signals.some((s) => s.id === "ask_vs_assessed" && s.kind === "ESTIMATE"), true);
  });

  it("tax-default FACT with a real client Buy Box is offerable and explains why", () => {
    const thesis = evaluateOpportunityThesis({
      box: BOX,
      taxDelinquent: true,
      foreclosure: false,
      auction: false,
      vacant: false,
      absentee: false,
      assessedCents: 100671400,
      payload: { tax_delinquent: true },
      sourceSlugs: ["sbcounty_tax_default"],
      matchWhy: "California match; tax-delinquent interest",
    });
    assert.equal(thesis.offerable, true);
    assert.equal(thesis.rejectReason, "");
    assert.ok(thesis.signals.some((s) => s.id === "tax_default" && s.kind === "FACT"));
    assert.match(thesis.client.plainEnglish, /tax/i);
    assert.match(thesis.client.whyFound, /Buy Box/i);
    assert.match(thesis.client.numbers, /Assessor tax-roll/i);
    assert.match(thesis.client.confidence, /FACT/i);
    const clientBlob = JSON.stringify(thesis.client).toLowerCase();
    assert.equal(clientBlob.includes("san francisco"), false);
    assert.equal(reverseIdentificationTest({ whyThisMayBeAGoodDeal: thesis.client }).pass, true);
  });

  it("does not invent asking, comps, liens, or returns", () => {
    const thesis = evaluateOpportunityThesis({
      box: BOX,
      taxDelinquent: true,
      sourceSlugs: ["county_tax"],
    });
    assert.match(thesis.client.numbers, /Asking\/list price: Not available/i);
    assert.match(thesis.client.numbers, /Comparable sales: Not available/i);
    assert.match(thesis.client.numbers, /will not invent comps/i);
    assert.match(thesis.client.numbers, /Unpaid tax\/lien amount: Not collected/i);
  });
});
