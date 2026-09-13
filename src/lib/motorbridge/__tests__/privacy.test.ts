import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectPii,
  minimizeForIntelligence,
  meetsAggregationThreshold,
  MINIMUM_COHORT_SIZE,
  decodeVinTransiently,
  isSyntheticRecord,
  SYNTHETIC_DATA_TAG,
} from "../privacy.ts";

describe("detectPii", () => {
  it("flags identifier field names", () => {
    const flags = detectPii({ customer_email: "x", customer_name: "y", coolant_temp: 90 });
    const fields = flags.map((f) => f.field);
    assert.ok(fields.includes("customer_email"));
    assert.ok(fields.includes("customer_name"));
    assert.ok(!fields.includes("coolant_temp"), "a real diagnostic field must not be flagged");
  });

  it("flags an email address hiding in an innocuously-named field", () => {
    const flags = detectPii({ notes: "contact me at driver@example.com about this" });
    assert.equal(flags.length, 1);
    assert.equal(flags[0].field, "notes");
  });

  it("flags a VIN-shaped value even under a generic field name", () => {
    const flags = detectPii({ misc: "1HGCM82633A004352" });
    assert.ok(flags.some((f) => f.reason.includes("VIN")));
  });

  it("flags precise lat/long pairs", () => {
    const flags = detectPii({ location: "37.7749,-122.4194" });
    assert.ok(flags.some((f) => f.reason.includes("GPS")));
  });

  it("does not flag ordinary diagnostic numbers", () => {
    const flags = detectPii({ rpm: 3200, coolant_temp_c: 91, boost_psi: 12.4 });
    assert.equal(flags.length, 0);
  });
});

describe("minimizeForIntelligence", () => {
  it("strips every flagged field and reports what was removed", () => {
    const { cleaned, removedFields } = minimizeForIntelligence({
      customer_email: "driver@example.com",
      rpm: 3200,
    });
    assert.equal(cleaned.rpm, 3200);
    assert.ok(!("customer_email" in cleaned));
    assert.deepEqual(removedFields, ["customer_email"]);
  });
});

describe("aggregation threshold — a pattern from 7 cars is not 700,000 (§14)", () => {
  it("refuses below the minimum cohort size", () => {
    assert.equal(meetsAggregationThreshold(MINIMUM_COHORT_SIZE - 1), false);
  });
  it("allows at or above the minimum cohort size", () => {
    assert.equal(meetsAggregationThreshold(MINIMUM_COHORT_SIZE), true);
  });
});

describe("VIN handling — transient decode only, VIN itself never returned", () => {
  it("fails closed rather than inventing a make/model", () => {
    const result = decodeVinTransiently("1HGCM82633A004352");
    assert.equal(result.decoded, false);
    assert.equal(result.make, null);
  });
  it("the result object carries no field that could reconstruct the VIN", () => {
    const result = decodeVinTransiently("1HGCM82633A004352") as Record<string, unknown>;
    assert.ok(!Object.values(result).some((v) => typeof v === "string" && v.includes("1HGCM82633A004352")));
  });
});

describe("synthetic/test data never contaminates production intelligence (§25)", () => {
  it("recognizes the synthetic tag", () => {
    assert.equal(isSyntheticRecord({ [SYNTHETIC_DATA_TAG]: true, rpm: 1000 }), true);
    assert.equal(isSyntheticRecord({ rpm: 1000 }), false);
  });
});
