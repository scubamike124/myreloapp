import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fToC,
  cToF,
  psiToKpa,
  kpaToPsi,
  miToKm,
  kmToMi,
  galToL,
  hpToKw,
  lbFtToNm,
  mpgToL100km,
  temperatureMeasurement,
  pressureMeasurement,
} from "../units";

describe("temperature", () => {
  it("converts F to C and back within rounding", () => {
    assert.ok(Math.abs(fToC(212) - 100) < 1e-9);
    assert.ok(Math.abs(cToF(0) - 32) < 1e-9);
  });
});

describe("pressure", () => {
  it("converts psi to kPa using the real physical constant", () => {
    assert.ok(Math.abs(psiToKpa(1) - 6.894757293168) < 1e-9);
  });
  it("round-trips psi -> kPa -> psi", () => {
    const original = 32.5;
    assert.ok(Math.abs(kpaToPsi(psiToKpa(original)) - original) < 1e-9);
  });
});

describe("distance", () => {
  it("converts miles to km", () => {
    assert.ok(Math.abs(miToKm(1) - 1.609344) < 1e-9);
    assert.ok(Math.abs(kmToMi(1.609344) - 1) < 1e-9);
  });
});

describe("volume, power, torque", () => {
  it("converts US gallons to liters", () => {
    assert.ok(Math.abs(galToL(1) - 3.785411784) < 1e-9);
  });
  it("converts hp to kW", () => {
    assert.ok(Math.abs(hpToKw(1) - 0.745699872) < 1e-9);
  });
  it("converts lb-ft to Nm", () => {
    assert.ok(Math.abs(lbFtToNm(1) - 1.3558179483) < 1e-9);
  });
});

describe("fuel economy — not a linear scale", () => {
  it("30 mpg is roughly 7.84 L/100km", () => {
    assert.ok(Math.abs(mpgToL100km(30) - 7.8405) < 0.001);
  });
});

describe("Measurement never destroys the original value", () => {
  it("temperatureMeasurement keeps the reported unit alongside the canonical one", () => {
    const m = temperatureMeasurement(212, "F");
    assert.equal(m.value, 212);
    assert.equal(m.unit, "F");
    assert.equal(m.normalizedUnit, "C");
    assert.ok(Math.abs(m.normalizedValue - 100) < 1e-9);
  });

  it("pressureMeasurement normalizes every unit to kPa", () => {
    assert.equal(pressureMeasurement(14.5, "psi").normalizedUnit, "kpa");
    assert.equal(pressureMeasurement(1, "bar").normalizedValue, 100);
    assert.equal(pressureMeasurement(50, "kpa").normalizedValue, 50);
  });
});
