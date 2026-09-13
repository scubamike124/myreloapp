/**
 * Worldwide unit normalization (§7 of the MotorBridge blueprint).
 *
 * Every conversion here is pure math against a fixed physical constant —
 * nothing regional or vendor-specific belongs in this file (fuel/octane
 * normalization, which genuinely varies by market and measurement method,
 * lives in fuel.ts instead). The rule that matters: normalizing a value
 * never destroys the original. Callers build a Measurement<Unit> (types.ts)
 * that keeps both.
 */
import type { Measurement, Provenance } from "./types.ts";

export type TemperatureUnit = "C" | "F";
export type PressureUnit = "psi" | "bar" | "kpa" | "mpa";
export type DistanceUnit = "mi" | "km";
export type VolumeUnit = "gal" | "L";
export type PowerUnit = "hp" | "kW";
export type TorqueUnit = "lb-ft" | "Nm";
export type FuelEconomyUnit = "mpg" | "L/100km" | "km/L";

/** The unit every quantity of a given family normalizes to, chosen for the largest worldwide user base (metric/SI), except temperature which stays Celsius per scientific/engineering convention. */
export const CANONICAL_UNIT = {
  temperature: "C",
  pressure: "kpa",
  distance: "km",
  volume: "L",
  power: "kW",
  torque: "Nm",
  fuelEconomy: "L/100km",
} as const;

export function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}
export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function psiToKpa(psi: number): number {
  return psi * 6.894757293168;
}
export function barToKpa(bar: number): number {
  return bar * 100;
}
export function mpaToKpa(mpa: number): number {
  return mpa * 1000;
}
export function kpaToPsi(kpa: number): number {
  return kpa / 6.894757293168;
}
export function kpaToBar(kpa: number): number {
  return kpa / 100;
}

export function miToKm(mi: number): number {
  return mi * 1.609344;
}
export function kmToMi(km: number): number {
  return km / 1.609344;
}

export function galToL(gal: number): number {
  // US gallon, the dominant "gal" usage in vehicle contexts. Imperial gallon
  // is never silently assumed — a source claiming Imperial must say so and
  // that must be handled by the caller as a distinct declared unit.
  return gal * 3.785411784;
}
export function lToGal(l: number): number {
  return l / 3.785411784;
}

export function hpToKw(hp: number): number {
  // Mechanical (SAE/imperial) horsepower, the automotive-standard definition.
  return hp * 0.745699872;
}
export function kwToHp(kw: number): number {
  return kw / 0.745699872;
}

export function lbFtToNm(lbFt: number): number {
  return lbFt * 1.3558179483;
}
export function nmToLbFt(nm: number): number {
  return nm / 1.3558179483;
}

/** mpg (US gallons, miles) to L/100km — not a linear scale, so no reverse multiplier exists; compute both directions explicitly. */
export function mpgToL100km(mpg: number): number {
  if (mpg <= 0) return NaN;
  return 235.214583 / mpg;
}
export function l100kmToMpg(l100km: number): number {
  if (l100km <= 0) return NaN;
  return 235.214583 / l100km;
}
export function kmPerLToL100km(kmPerL: number): number {
  if (kmPerL <= 0) return NaN;
  return 100 / kmPerL;
}

function pressureToKpa(value: number, unit: PressureUnit): number {
  if (unit === "kpa") return value;
  if (unit === "psi") return psiToKpa(value);
  if (unit === "bar") return barToKpa(value);
  return mpaToKpa(value);
}

const UNKNOWN_PROVENANCE: Provenance = { kind: "calculated", detail: "unit normalization", observedAt: null };

/** Builds a Measurement that keeps the original value/unit and adds the canonical-unit conversion, never discarding either. */
export function measurement<Unit extends string>(
  value: number,
  unit: Unit,
  normalizedUnit: Unit,
  normalizedValue: number,
  provenance: Provenance = UNKNOWN_PROVENANCE,
): Measurement<Unit> {
  return { value, unit, normalizedUnit, normalizedValue, provenance };
}

export function temperatureMeasurement(value: number, unit: TemperatureUnit, provenance?: Provenance): Measurement<TemperatureUnit> {
  const normalizedValue = unit === "C" ? value : fToC(value);
  return measurement(value, unit, "C", normalizedValue, provenance);
}

export function pressureMeasurement(value: number, unit: PressureUnit, provenance?: Provenance): Measurement<PressureUnit> {
  return measurement(value, unit, "kpa", pressureToKpa(value, unit), provenance);
}

export function distanceMeasurement(value: number, unit: DistanceUnit, provenance?: Provenance): Measurement<DistanceUnit> {
  const normalizedValue = unit === "km" ? value : miToKm(value);
  return measurement(value, unit, "km", normalizedValue, provenance);
}

export function volumeMeasurement(value: number, unit: VolumeUnit, provenance?: Provenance): Measurement<VolumeUnit> {
  const normalizedValue = unit === "L" ? value : galToL(value);
  return measurement(value, unit, "L", normalizedValue, provenance);
}

export function powerMeasurement(value: number, unit: PowerUnit, provenance?: Provenance): Measurement<PowerUnit> {
  const normalizedValue = unit === "kW" ? value : hpToKw(value);
  return measurement(value, unit, "kW", normalizedValue, provenance);
}

export function torqueMeasurement(value: number, unit: TorqueUnit, provenance?: Provenance): Measurement<TorqueUnit> {
  const normalizedValue = unit === "Nm" ? value : lbFtToNm(value);
  return measurement(value, unit, "Nm", normalizedValue, provenance);
}

export function fuelEconomyMeasurement(value: number, unit: FuelEconomyUnit, provenance?: Provenance): Measurement<FuelEconomyUnit> {
  const normalizedValue = unit === "L/100km" ? value : unit === "mpg" ? mpgToL100km(value) : kmPerLToL100km(value);
  return measurement(value, unit, "L/100km", normalizedValue, provenance);
}
