import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFuel, octaneEquivalencyWarning, roughRonEstimateFromAki } from "../fuel";

describe("octane rating — never assume equivalence across methods (§6)", () => {
  it("never derives AKI from a single reported octane number", () => {
    const fuel = buildFuel({ fuelType: "gasoline", octaneValue: 91, octaneMethod: "AKI" });
    assert.equal(fuel.derivedAki, null, "AKI must come from a real RON+MON pair, not be invented from itself");
    assert.equal(fuel.derivedRon, null);
    assert.equal(fuel.derivedMon, null);
  });

  it("derives AKI only when both RON and MON are genuinely known", () => {
    const fuel = buildFuel({ fuelType: "gasoline", ronValue: 95, monValue: 85 });
    assert.equal(fuel.derivedAki, 90);
  });

  it("warns when comparing two fuels reported under different octane methods", () => {
    const a = buildFuel({ fuelType: "gasoline", octaneValue: 91, octaneMethod: "AKI" });
    const b = buildFuel({ fuelType: "gasoline", octaneValue: 95, octaneMethod: "RON" });
    const warning = octaneEquivalencyWarning(a, b);
    assert.ok(warning, "must not silently compare AKI to RON");
    assert.match(warning!, /AKI vs RON|RON vs AKI/);
  });

  it("warns when either side's octane method is unknown", () => {
    const a = buildFuel({ fuelType: "gasoline", octaneValue: 91 });
    const b = buildFuel({ fuelType: "gasoline", octaneValue: 91, octaneMethod: "AKI" });
    assert.ok(octaneEquivalencyWarning(a, b));
  });

  it("does not warn when nothing to compare exists", () => {
    const a = buildFuel({ fuelType: "diesel" });
    const b = buildFuel({ fuelType: "diesel" });
    assert.equal(octaneEquivalencyWarning(a, b), null);
  });

  it("does not warn when both sides genuinely agree on method", () => {
    const a = buildFuel({ fuelType: "gasoline", octaneValue: 91, octaneMethod: "AKI" });
    const b = buildFuel({ fuelType: "gasoline", octaneValue: 93, octaneMethod: "AKI" });
    assert.equal(octaneEquivalencyWarning(a, b), null);
  });

  it("keeps the rough AKI->RON estimate clearly labeled as an estimate, never as a measurement", () => {
    const { estimate, caveat } = roughRonEstimateFromAki(91);
    assert.equal(estimate, 95.5);
    assert.match(caveat, /[Aa]pproximation/);
  });
});

describe("ethanol and cetane pass through with their own provenance", () => {
  it("keeps ethanol source distinct from a bare percentage", () => {
    const fuel = buildFuel({ fuelType: "ethanol", ethanolPercent: 15, ethanolSource: "flex_fuel_sensor" });
    assert.equal(fuel.ethanolPercent, 15);
    assert.equal(fuel.ethanolSource, "flex_fuel_sensor");
  });

  it("carries diesel cetane separately from octane", () => {
    const fuel = buildFuel({ fuelType: "diesel", cetaneNumber: 48 });
    assert.equal(fuel.cetaneNumber, 48);
    assert.equal(fuel.octaneRating, null);
  });
});
