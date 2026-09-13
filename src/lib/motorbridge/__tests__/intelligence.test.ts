import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gateOnConfidence, evaluateEarlyWarning, buildConfidence } from "../intelligence.ts";
import { MINIMUM_COHORT_SIZE } from "../privacy.ts";

describe("gateOnConfidence — a pattern from 7 cars is not 700,000 (§14)", () => {
  it("refuses below the minimum cohort, with the real numbers in the refusal", () => {
    const result = gateOnConfidence(2, () => ({ data: "should never be seen", confidence: { sourceDiversity: 2, observationPeriodStart: null, observationPeriodEnd: null, geographicCoverage: [] } }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.sampleSize, 2);
    assert.equal(result.required, MINIMUM_COHORT_SIZE);
  });

  it("answers once the cohort threshold is met, and stamps the real sample size", () => {
    const result = gateOnConfidence(MINIMUM_COHORT_SIZE, () => ({
      data: { value: 42 },
      confidence: { sourceDiversity: MINIMUM_COHORT_SIZE, observationPeriodStart: null, observationPeriodEnd: null, geographicCoverage: ["US"] },
    }));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.value, 42);
    assert.equal(result.confidence.sampleSize, MINIMUM_COHORT_SIZE);
  });

  it("never calls produce() when the gate refuses — no wasted work, no accidental leak", () => {
    let called = false;
    gateOnConfidence(0, () => {
      called = true;
      return { data: null, confidence: { sourceDiversity: null, observationPeriodStart: null, observationPeriodEnd: null, geographicCoverage: [] } };
    });
    assert.equal(called, false);
  });
});

describe("early-warning engine refuses dramatic claims without real sample+baseline (§27)", () => {
  it("refuses when either the current or baseline sample is too thin", () => {
    const result = evaluateEarlyWarning({
      componentOrCode: "P0300",
      modelOrEngine: "Test Engine",
      currentIncidenceRate: 0.4,
      baselineIncidenceRate: 0.1,
      sampleSize: MINIMUM_COHORT_SIZE,
      baselineSampleSize: 1, // thin baseline should still refuse
      affectedMarkets: ["US"],
    });
    assert.equal(result.ok, false);
  });

  it("flags material only at 1.5x baseline or more, once both samples are real", () => {
    const material = evaluateEarlyWarning({
      componentOrCode: "P0300",
      modelOrEngine: "Test Engine",
      currentIncidenceRate: 0.3,
      baselineIncidenceRate: 0.1,
      sampleSize: MINIMUM_COHORT_SIZE,
      baselineSampleSize: MINIMUM_COHORT_SIZE,
      affectedMarkets: ["US"],
    });
    assert.equal(material.ok, true);
    if (material.ok) assert.equal(material.data.material, true);

    const notMaterial = evaluateEarlyWarning({
      componentOrCode: "P0300",
      modelOrEngine: "Test Engine",
      currentIncidenceRate: 0.11,
      baselineIncidenceRate: 0.1,
      sampleSize: MINIMUM_COHORT_SIZE,
      baselineSampleSize: MINIMUM_COHORT_SIZE,
      affectedMarkets: ["US"],
    });
    assert.equal(notMaterial.ok, true);
    if (notMaterial.ok) assert.equal(notMaterial.data.material, false);
  });
});

describe("buildConfidence never invents a quality score", () => {
  it("leaves qualityScore null rather than guessing", () => {
    const c = buildConfidence({ sampleSize: 10, sourceDiversity: 10, observationPeriodStart: null, observationPeriodEnd: null, geographicCoverage: [] });
    assert.equal(c.qualityScore, null);
  });
});
