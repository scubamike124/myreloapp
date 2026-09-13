/**
 * Worldwide fuel normalization (§6 of the MotorBridge blueprint). Mandatory:
 * a tune cannot be meaningfully compared internationally without knowing the
 * fuel context, and 91 AKI is not 91 RON.
 *
 * The one rule this file exists to enforce: never assume octane-rating
 * equivalence across methods. AKI (US "Anti-Knock Index", the number on
 * North American pumps) is defined as the average of RON and MON — it can
 * only be computed when BOTH are actually known. There is no reliable
 * general formula from AKI alone back to RON; regional rules of thumb exist
 * (roughly RON ≈ AKI + 4 to 5) but vary by fuel blend and are NOT a
 * measurement. This file refuses to manufacture one.
 */
import type { Fuel, FuelType, OctaneRatingMethod } from "./types.ts";

export function buildFuel(input: {
  fuelType: FuelType;
  octaneValue?: number | null;
  octaneMethod?: OctaneRatingMethod;
  ronValue?: number | null;
  monValue?: number | null;
  ethanolPercent?: number | null;
  ethanolSource?: "flex_fuel_sensor" | "reported" | "inferred" | null;
  cetaneNumber?: number | null;
  raceFuelSpec?: string | null;
  brandProduct?: string | null;
  countryOfMeasurement?: string | null;
  valueOrigin?: "measured" | "reported" | "inferred";
  observedAt?: string | null;
}): Fuel {
  const ron = input.ronValue ?? null;
  const mon = input.monValue ?? null;
  // AKI is only ever derived from a genuine RON+MON pair — never guessed
  // from a single reported octane number.
  const derivedAki = ron !== null && mon !== null ? (ron + mon) / 2 : null;

  return {
    fuelType: input.fuelType,
    octaneRating:
      input.octaneValue != null
        ? { value: input.octaneValue, method: input.octaneMethod ?? "unknown" }
        : null,
    derivedRon: ron,
    derivedMon: mon,
    derivedAki,
    ethanolPercent: input.ethanolPercent ?? null,
    ethanolSource: input.ethanolSource ?? null,
    cetaneNumber: input.cetaneNumber ?? null,
    raceFuelSpec: input.raceFuelSpec ?? null,
    brandProduct: input.brandProduct ?? null,
    countryOfMeasurement: input.countryOfMeasurement ?? null,
    valueOrigin: input.valueOrigin ?? "reported",
    observedAt: input.observedAt ?? null,
  };
}

/**
 * Whether two Fuel records can be honestly compared on octane. Returns a
 * warning string when they cannot — callers must surface this to the
 * customer rather than silently rendering a side-by-side comparison (§6:
 * "If MotorBridge cannot establish fuel equivalency, explicitly warn the
 * customer").
 */
export function octaneEquivalencyWarning(a: Fuel, b: Fuel): string | null {
  const am = a.octaneRating?.method ?? "unknown";
  const bm = b.octaneRating?.method ?? "unknown";
  if (!a.octaneRating || !b.octaneRating) return null; // nothing to compare, nothing to warn about
  if (am === "unknown" || bm === "unknown") {
    return "Octane rating method is unknown for at least one value — RON, MON, and AKI are not the same scale and cannot be assumed equal.";
  }
  if (am !== bm) {
    return `These octane numbers were reported under different methods (${am} vs ${bm}) and are not directly comparable. AKI = (RON+MON)/2; a single-method number cannot be converted to another method without both RON and MON measured.`;
  }
  return null;
}

/** A widely-used regional rule of thumb, explicitly separated from any measured value and never merged into Fuel.derivedRon/derivedMon. Callers that want this must ask for it by name and must label it as an estimate, never as fact. */
export function roughRonEstimateFromAki(aki: number): { estimate: number; caveat: string } {
  return {
    estimate: aki + 4.5,
    caveat:
      "Rough regional approximation only (RON ≈ AKI + 4 to 5, blend-dependent). Not a measurement, not stored as derivedRon, and must never be presented as equivalent to a measured RON value.",
  };
}
