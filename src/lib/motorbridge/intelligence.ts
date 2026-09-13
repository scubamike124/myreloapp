/**
 * MotorBridge Intelligence (§26-30) — kept as a separate module and a
 * separate API surface from ingestion/normalization on purpose (§29):
 * customers query aggregate answers here, never raw underlying records
 * (§30 — the normalized dataset itself is a core company asset, not a
 * product).
 *
 * Every query in this file runs through the same gate: `confidenceFor()`
 * below, which refuses to answer below MINIMUM_COHORT_SIZE independent
 * sources. Today that gate always fires, honestly, because there are no
 * real customers yet — a query here should return "insufficient data,"
 * never a fabricated pattern (§14: "do not present a pattern from 7 cars
 * as though it represents 700,000").
 */
import { MINIMUM_COHORT_SIZE, meetsAggregationThreshold } from "./privacy";
import type { Confidence } from "./types";

export type IntelligenceCategory =
  | "automotive_repair"
  | "racing_performance"
  | "diesel"
  | "motorcycle"
  | "marine"
  | "fleet"
  | "ev_battery"
  | "climate"
  | "parts"
  | "predictive_early_warning";

export type IntelligenceQueryResult<T> =
  | { ok: true; data: T; confidence: Confidence }
  | { ok: false; reason: string; sampleSize: number; required: number };

/** Builds the Confidence block every aggregate output must carry (§14) — sample size, source diversity, observation window, geographic coverage, and a quality score left null rather than invented when there's no principled way to compute one yet. */
export function buildConfidence(input: {
  sampleSize: number;
  sourceDiversity: number | null;
  observationPeriodStart: string | null;
  observationPeriodEnd: string | null;
  geographicCoverage: string[];
}): Confidence {
  return { ...input, qualityScore: null };
}

/**
 * The single gate every intelligence query in this codebase must pass
 * through before returning a real answer. `independentSourceCount` is
 * deliberately a required argument, not something this function looks up
 * itself — the caller must have already excluded synthetic records and
 * counted DISTINCT contributors, not raw rows (ten uploads from one shop is
 * one source, not ten).
 */
export function gateOnConfidence<T>(
  independentSourceCount: number,
  produce: () => { data: T; confidence: Omit<Confidence, "sampleSize" | "qualityScore"> },
): IntelligenceQueryResult<T> {
  if (!meetsAggregationThreshold(independentSourceCount)) {
    return {
      ok: false,
      reason: `Fewer than ${MINIMUM_COHORT_SIZE} independent sources — an aggregate here would be a handful of vehicles presented as a market pattern. Refused, not estimated.`,
      sampleSize: independentSourceCount,
      required: MINIMUM_COHORT_SIZE,
    };
  }
  const { data, confidence } = produce();
  // qualityScore is never fabricated (types.ts: "left null rather than
  // fabricated"), so it's set here once rather than repeated at every call
  // site that produces a confidence block.
  return { ok: true, data, confidence: { ...confidence, sampleSize: independentSourceCount, qualityScore: null } };
}

/**
 * §27's early-warning engine, in its honest starting shape: it must refuse
 * to fire below both a real sample AND a real baseline, never translate
 * "we don't have a baseline yet" into "nothing changed" or "something
 * changed" — those are different unknowns from a real negative finding.
 */
export type EarlyWarningSignal = {
  componentOrCode: string;
  modelOrEngine: string;
  currentIncidenceRate: number;
  baselineIncidenceRate: number;
  sampleSize: number;
  baselineSampleSize: number;
  affectedMarkets: string[];
};

export function evaluateEarlyWarning(input: EarlyWarningSignal): IntelligenceQueryResult<{ material: boolean; ratio: number }> {
  return gateOnConfidence(Math.min(input.sampleSize, input.baselineSampleSize), () => {
    const ratio = input.baselineIncidenceRate > 0 ? input.currentIncidenceRate / input.baselineIncidenceRate : NaN;
    return {
      data: { material: Number.isFinite(ratio) && ratio >= 1.5, ratio },
      confidence: {
        sourceDiversity: null,
        observationPeriodStart: null,
        observationPeriodEnd: null,
        geographicCoverage: input.affectedMarkets,
      },
    };
  });
}
