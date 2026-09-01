import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateBuyBoxRequirements, requirementMatchPercent, criteriaFingerprint, matchBuyBox, type BuyBox, type MatchProperty } from "./matching";
import { extractDealEvidence } from "./deal-evidence";
import { readableSitusAddress } from "./california";
import { detectDuplicateProperties } from "./identity";

const property: MatchProperty = {
  city: "San Francisco",
  county: "San Francisco",
  zip: "94109",
  state: "CA",
  assessedCents: 50_000_000,
  askingCents: 48_000_000,
  propertyType: "Single Family Residential",
  beds: 2,
  baths: 2,
  sqft: 874,
  taxDelinquent: false,
  foreclosure: false,
  auction: false,
  vacant: false,
  absentee: false,
};

describe("Buy Box requirement matrix", () => {
  it("marks each set requirement pass/fail/unknown without inventing facts", () => {
    const box: BuyBox = {
      targetCounties: ["San Francisco"],
      propertyType: "residential",
      maxBudgetCents: 80_000_000,
      minBeds: 2,
      minBaths: 1,
      taxDefaultInterest: true,
    };
    const rows = evaluateBuyBoxRequirements(box, property);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    assert.equal(byId.county.status, "pass");
    assert.equal(byId.type.status, "pass");
    assert.equal(byId.budget.status, "pass");
    assert.equal(byId.beds.status, "pass");
    assert.equal(byId.baths.status, "pass");
    assert.equal(byId.tax.status, "unknown");
    assert.equal(byId.tax.actual.includes("not indicated") || byId.tax.actual === "No / not indicated", true);
    assert.ok(requirementMatchPercent(rows) < 100);
  });

  it("fails a county miss and does not treat missing beds as a pass", () => {
    const box: BuyBox = {
      targetCounties: ["Riverside"],
      minBeds: 3,
    };
    const rows = evaluateBuyBoxRequirements(box, { ...property, beds: null });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    assert.equal(byId.county.status, "fail");
    assert.equal(byId.beds.status, "unknown");
    assert.equal(byId.beds.actual, "Not available");
  });
});

describe("duplicate property identity", () => {
  it("counts one property when two sources share a canonical key or APN", () => {
    const dup = detectDuplicateProperties([
      { propertyId: "a", canonicalKey: "ca:sf:0501052", apn: "0501052", county: "San Francisco" },
      { propertyId: "a", canonicalKey: "ca:sf:0501052", apn: "0501052", county: "San Francisco" },
    ]);
    assert.equal(dup.uniquePropertyIds, 1);
    assert.equal(dup.apnCollisions.length, 0);

    const split = detectDuplicateProperties([
      { propertyId: "a", canonicalKey: "ca:sf:0501052", apn: "0501052", county: "San Francisco" },
      { propertyId: "b", canonicalKey: "ca:sf:addr:1380GREENWICH", apn: "0501052", county: "San Francisco" },
    ]);
    assert.equal(split.uniquePropertyIds, 2);
    assert.equal(split.apnCollisions.length, 1);
  });
});

describe("unknown property type vs Residential Buy Box", () => {
  it("does not hard-reject when type is missing; score still clears the $299 match floor", () => {
    const r = matchBuyBox(
      { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential" },
      { ...property, propertyType: "", taxDelinquent: true, auction: true },
    );
    assert.equal(r.ok, true);
    assert.ok(r.score >= 70, r.why);
  });

  it("still rejects a confirmed commercial parcel for a residential box", () => {
    const r = matchBuyBox(
      { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential" },
      { ...property, propertyType: "Commercial Office" },
    );
    assert.equal(r.ok, false);
  });
});

describe("Buy Box requirement fingerprint", () => {
  it("treats identical SF residential boxes as the same requirements even if labels differ", () => {
    const a: BuyBox = { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential", label: "A" };
    const b: BuyBox = { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential", label: "B", notes: "copy" };
    const c: BuyBox = { desiredState: "CA", targetCounties: [], propertyType: undefined };
    assert.equal(criteriaFingerprint(a), criteriaFingerprint(b));
    assert.notEqual(criteriaFingerprint(a), criteriaFingerprint(c));
  });
});

describe("deal evidence from real source fields", () => {
  it("does not invent a tax lien amount when the assessor payload has none", () => {
    const deal = extractDealEvidence(
      { tax_delinquent: 0, assessed_cents: 100671400, asking_cents: null, units: 2, year_built: 1906 },
      {
        assessed_land_value: "704703.0",
        assessed_improvement_value: "302011.0",
        current_sales_date: "2012-01-11T00:00:00.000",
        assessor_neighborhood: "Russian Hill",
        tax_rate_area_code: "1000",
      },
    );
    assert.match(deal.taxLienOnRecord, /No/i);
    assert.equal(deal.taxLienAmount, "Not collected");
    assert.equal(deal.assessedLand, "$704,703");
    assert.equal(deal.assessedImprovement, "$302,011");
    assert.equal(deal.askingPrice, "Not available");
    assert.match(deal.verdict, /NOT a proven good buy/i);
    assert.match(deal.problemFound, /None found/i);
    assert.ok(deal.foundFacts.some((f) => f.label === "Neighborhood" && f.value === "Russian Hill"));
  });

  it("reports a source lien dollar amount when the payload actually has one", () => {
    const deal = extractDealEvidence({ tax_delinquent: 1 }, { unpaid_tax_amount: 12500 });
    assert.match(deal.taxLienOnRecord, /Yes/i);
    assert.equal(deal.taxLienAmount, "$12,500");
  });
});

describe("readable SF assessor situs", () => {
  it("turns padded county strings into a street a person can read", () => {
    assert.equal(readableSitusAddress("0000 0704 NORTH POINT ST0000"), "704 NORTH POINT ST");
    assert.equal(readableSitusAddress("0000 1380 GREENWICH           ST0207"), "1380 GREENWICH ST Unit 207");
    assert.equal(readableSitusAddress("2704 2700 HYDE ST0000"), "2704 2700 HYDE ST");
  });
});
