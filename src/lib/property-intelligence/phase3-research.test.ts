import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDeepResearch } from "./deep-research";
import { qualityGate } from "./quality-gate";
import { matchBuyBox, summarizeBuyBox, hasSpecificCriteria } from "./matching";
import { buildConfidentialPreview, reverseIdentificationTest } from "./preview";
import { MIN_OFFER_CONFIDENCE, MIN_OFFER_MATCH_SCORE } from "./constants";
import { evaluateOpportunityThesis } from "./opportunity-thesis";
import { CA_COUNTIES } from "./california";
import { allCaliforniaCounties, countiesWithPublicLayers, planStatewideScan, COUNTY_PARCEL_LAYERS } from "./ca-county-layers";

const SF_PAYLOAD = {
  closed_roll_year: "2023",
  property_location: "0000 1380 GREENWICH           ST0207",
  parcel_number: "0501052",
  use_definition: "Single Family Residential",
  year_property_built: "1990",
  number_of_bathrooms: "2.0",
  number_of_bedrooms: "2.0",
  property_area: "874.0",
  zoning_code: "RM2",
  number_of_units: "1.0",
  current_sales_date: "1996-02-26T00:00:00.000",
  assessed_improvement_value: "168445.0",
  assessed_land_value: "239502.0",
  data_as_of: "2024-06-26T00:00:00.000",
};

describe("Phase 3 deep research and $299 quality gate", () => {
  it("does not offer a tax-default APN stub", () => {
    const deep = runDeepResearch(
      {
        apn: "123456789",
        address_raw: "APN 123456789",
        city: "UNKNOWN",
        county: "San Bernardino",
        zip: "",
        property_type: "UNKNOWN",
        tax_delinquent: 1,
      },
      [{ source_slug: "sbcounty_tax_default", payload_json: JSON.stringify({ accountNumber: "123456789" }) }],
    );
    assert.equal(deep.meaningful, false);
    assert.ok(deep.dataConfidence < MIN_OFFER_CONFIDENCE);
    const g = qualityGate({
      exists: false,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: deep.dataConfidence,
      stale: !deep.freshnessOk,
      meaningful: deep.meaningful,
      factCount: deep.factCount,
      priceKnown: deep.hydrated.assessedCents != null,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: 50,
    });
    assert.equal(g.offerable, false);
  });

  it("SF assessor payload becomes a classified package worth considering", () => {
    const deep = runDeepResearch(
      { apn: "0501052", address_raw: "1380 GREENWICH ST", city: "San Francisco", county: "San Francisco", state: "CA" },
      [{ source_slug: "sfgov_assessor", payload_json: JSON.stringify(SF_PAYLOAD) }],
    );
    assert.equal(deep.hydrated.beds, 2);
    assert.equal(deep.hydrated.baths, 2);
    assert.ok(deep.hydrated.assessedCents && deep.hydrated.assessedCents > 0);
    assert.equal(deep.meaningful, true);
    assert.ok(deep.dataConfidence >= MIN_OFFER_CONFIDENCE);
    assert.equal(deep.fields.find((f) => f.key === "market")?.kind, "UNKNOWN");
    const preview = buildConfidentialPreview({
      propertyType: deep.hydrated.propertyType,
      assessedCents: deep.hydrated.assessedCents,
      dataConfidence: deep.dataConfidence,
      beds: deep.hydrated.beds,
      baths: deep.hydrated.baths,
    });
    assert.equal(reverseIdentificationTest(preview).pass, true);
    assert.equal(JSON.stringify(preview).toLowerCase().includes("greenwich"), false);
    assert.equal(JSON.stringify(preview).toLowerCase().includes("russian"), false);
    assert.notEqual(preview.approximatePriceBand, "UNKNOWN");
    assert.match(preview.bedroomBathCategory, /2-bedroom/i);
    const m = matchBuyBox(
      { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential" },
      {
        city: "San Francisco",
        county: "San Francisco",
        zip: "",
        state: "CA",
        assessedCents: deep.hydrated.assessedCents,
        propertyType: deep.hydrated.propertyType,
        beds: deep.hydrated.beds,
        taxDelinquent: false,
        foreclosure: false,
        auction: false,
        vacant: false,
        absentee: false,
      },
    );
    assert.ok(m.score >= MIN_OFFER_MATCH_SCORE);
    const g = qualityGate({
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: deep.dataConfidence,
      stale: !deep.freshnessOk,
      meaningful: deep.meaningful,
      factCount: deep.factCount,
      priceKnown: true,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: m.score,
    });
    assert.equal(g.offerable, true);
    const thesis = evaluateOpportunityThesis({
      box: { desiredState: "CA", targetCounties: ["San Francisco"], propertyType: "Residential" },
      taxDelinquent: false,
      foreclosure: false,
      auction: false,
      vacant: false,
      absentee: false,
      assessedCents: deep.hydrated.assessedCents,
      payload: SF_PAYLOAD,
      sourceSlugs: ["sfgov_assessor"],
      matchWhy: m.why,
    });
    assert.equal(thesis.offerable, false);
    assert.match(thesis.rejectReason, /NO WORTHWHILE OPPORTUNITY THESIS/i);
    const offer = qualityGate({
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: deep.dataConfidence,
      stale: !deep.freshnessOk,
      meaningful: deep.meaningful,
      factCount: deep.factCount,
      priceKnown: true,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: m.score,
      hasInvestmentThesis: thesis.offerable,
    });
    assert.equal(offer.offerable, false);
    const clientBlob = JSON.stringify(thesis.client).toLowerCase();
    assert.equal(clientBlob.includes("san francisco"), false);
    assert.equal(clientBlob.includes("sfgov"), false);
  });

  it("statewide Buy Box with no filters cannot be sold a $299 property", () => {
    const m = matchBuyBox(
      { desiredState: "CA", targetCounties: [] },
      {
        city: "San Francisco",
        county: "San Francisco",
        zip: "",
        state: "CA",
        assessedCents: 40000000,
        propertyType: "Single Family Residential",
        taxDelinquent: false,
        foreclosure: false,
        auction: false,
        vacant: false,
        absentee: false,
      },
    );
    assert.equal(m.ok, false);
    assert.match(m.why, /too broad/i);
  });

  it("Client Buy Box Library summary is client-owned and rejects UNKNOWN beds vs minBeds", () => {
    const box = { desiredState: "CA", targetCounties: ["Los Angeles"], propertyType: "Residential", minBeds: 3 };
    assert.equal(hasSpecificCriteria(box), true);
    assert.match(summarizeBuyBox(box), /Los Angeles/);
    const m = matchBuyBox(box, {
      city: "Los Angeles",
      county: "Los Angeles",
      zip: "90001",
      state: "CA",
      assessedCents: 50_000_000,
      propertyType: "Residential",
      beds: null,
      taxDelinquent: false,
      foreclosure: false,
      auction: false,
      vacant: false,
      absentee: false,
    });
    assert.equal(m.ok, false);
    assert.match(m.why, /Bedroom/i);
  });

  it("LA County assessed-only roll is not a $299 package (beds/baths/sqft UNKNOWN)", () => {
    const deep = runDeepResearch(
      {
        apn: "2004001003",
        address_raw: "8321 FAUST AVE",
        city: "Los Angeles",
        county: "Los Angeles",
        zip: "91304",
        property_type: "Residential",
        assessed_cents: 105378200,
      },
      [
        {
          source_slug: "lacounty_assessor",
          payload_json: JSON.stringify({
            AIN: "2004001003",
            SitusFullAddress: "8321 FAUST AVE LOS ANGELES CA 91304",
            SitusCity: "LOS ANGELES CA",
            SitusZIP: "91304-3327",
            UseType: "Residential",
            Roll_Year: "2026",
            Roll_LandValue: 740440,
            Roll_ImpValue: 313342,
            UseCode: "0101",
          }),
        },
      ],
    );
    assert.ok(deep.hydrated.assessedCents && deep.hydrated.assessedCents > 0);
    assert.equal(deep.hydrated.beds, null);
    assert.equal(deep.meaningful, false);
    const g = qualityGate({
      exists: true,
      california: true,
      hasSource: true,
      hasFact: true,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: deep.dataConfidence,
      stale: !deep.freshnessOk,
      meaningful: deep.meaningful,
      factCount: deep.factCount,
      priceKnown: true,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
      matchScore: 80,
    });
    assert.equal(g.offerable, false);
  });
});

describe("Statewide California discovery (all 58 counties)", () => {
  it("registry covers all 58 counties and San Bernardino is not the territory", () => {
    assert.equal(allCaliforniaCounties().length, 58);
    assert.equal(CA_COUNTIES.length, 58);
    const layers = countiesWithPublicLayers();
    assert.equal(layers.length, 58);
    assert.ok(layers.includes("Los Angeles"));
    assert.ok(layers.includes("Orange"));
    assert.ok(layers.includes("San Diego"));
    assert.ok(layers.includes("San Bernardino"));
    assert.ok(layers.includes("Alameda"));
    assert.ok(layers.includes("Kern"));
    assert.ok(layers.includes("Alpine"));
    assert.ok(layers.includes("Riverside"));
    assert.ok(!layers.every((c) => c === "San Bernardino"));
    for (const layer of COUNTY_PARCEL_LAYERS) {
      const joined = layer.outFields.join(" ").toLowerCase();
      assert.equal(joined.includes("owner"), false);
      assert.equal(joined.includes("mailing"), false);
      assert.equal(joined.includes("own_name"), false);
    }
  });

  it("Buy Box counties are prioritized but rotation continues statewide", () => {
    const a = planStatewideScan({ buyBoxCounties: ["San Bernardino"], rotationIndex: 0, maxLayers: 4 });
    assert.equal(a.scan[0].county, "San Bernardino");
    assert.ok(a.scan.length >= 2);
    assert.ok(a.scan.some((s) => s.county !== "San Bernardino"));
    const b = planStatewideScan({ buyBoxCounties: ["Kern"], rotationIndex: 0, maxLayers: 4 });
    assert.equal(b.scan[0].county, "Kern");
    assert.match(b.scan[0].layerUrl, /water\.ca\.gov/);
    assert.ok(b.scan.some((s) => s.county !== "Kern"));
  });

  it("a missing county layer does not empty the scan list", () => {
    const r = planStatewideScan({ buyBoxCounties: [], rotationIndex: 17, maxLayers: 4 });
    assert.equal(r.scan.length, 4);
    const next = planStatewideScan({ buyBoxCounties: [], rotationIndex: r.nextRotation, maxLayers: 4 });
    const same = r.scan.map((s) => s.county).join() === next.scan.map((s) => s.county).join();
    assert.equal(same, false);
  });

  it("Alpine and other small counties are in the rotation via the statewide DWR layer", () => {
    const r = planStatewideScan({ buyBoxCounties: [], rotationIndex: 1, maxLayers: 1 });
    assert.equal(r.scan[0].county, "Alpine");
    assert.match(r.scan[0].layerUrl, /water\.ca\.gov/);
    const eight = planStatewideScan({ buyBoxCounties: [], rotationIndex: 0, maxLayers: 8 });
    assert.equal(eight.scan.length, 8);
  });
});
