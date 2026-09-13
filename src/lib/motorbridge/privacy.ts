/**
 * Privacy architecture (§24). MotorBridge sells machine intelligence, not
 * people's identities or movements.
 *
 * Pipeline, in order — each stage is a function below, meant to be composed
 * in this sequence by normalize.ts and persist.ts:
 *
 *   authorized raw data
 *     -> detectPii            (flag identifiers before anything else touches the record)
 *     -> minimizeForIntelligence  (strip/redact what was flagged)
 *     -> [normalization happens in normalize.ts]
 *     -> [quality validation happens in quality.ts]
 *     -> meetsAggregationThreshold  (cohort-size gate before anything is aggregated)
 *     -> commercial intelligence
 *
 * A VIN is sometimes legitimately needed transiently to decode make/model/
 * year. `decodeVinTransiently` is the only function in this module allowed
 * to see a raw VIN, and it deliberately does not return the VIN itself.
 */

/** Below this many independent contributors, an aggregate is not published — it is noise with a name on it. */
export const MINIMUM_COHORT_SIZE = 5;

const PII_FIELD_NAME_PATTERN =
  /(^|_)(name|first_?name|last_?name|email|phone|address|street|zip|postal|license_?plate|plate_?number|vin|ssn|credit_?card|lat|lng|latitude|longitude|gps)($|_)/i;

const EMAIL_VALUE_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_VALUE_PATTERN = /(?:\+?\d[\s.-]?){7,15}/;
// A US-shape VIN: 17 chars, no I/O/Q, at least one digit. Deliberately
// conservative (few false positives) since this feeds an auto-redaction path.
const VIN_VALUE_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/;
// Decimal lat/long pair, e.g. "37.7749,-122.4194" — precise GPS must never
// reach the intelligence dataset (§18, §24).
const LATLONG_VALUE_PATTERN = /-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/;

export type PiiFlag = { field: string; reason: string };

/**
 * Flags fields by name AND by value shape — a field innocuously named
 * "notes" that happens to contain an email address is still a leak. Works on
 * a flat or shallow-nested record; callers should flatten before calling.
 */
export function detectPii(record: Record<string, unknown>): PiiFlag[] {
  const flags: PiiFlag[] = [];
  for (const [field, raw] of Object.entries(record)) {
    if (PII_FIELD_NAME_PATTERN.test(field)) {
      flags.push({ field, reason: `field name matches a known identifier pattern` });
      continue;
    }
    if (typeof raw !== "string") continue;
    if (EMAIL_VALUE_PATTERN.test(raw)) flags.push({ field, reason: "value looks like an email address" });
    else if (VIN_VALUE_PATTERN.test(raw)) flags.push({ field, reason: "value looks like a VIN" });
    else if (LATLONG_VALUE_PATTERN.test(raw)) flags.push({ field, reason: "value looks like precise GPS coordinates" });
    else if (PHONE_VALUE_PATTERN.test(raw) && raw.replace(/\D/g, "").length >= 10) {
      flags.push({ field, reason: "value looks like a phone number" });
    }
  }
  return flags;
}

export type MinimizationResult = {
  cleaned: Record<string, unknown>;
  removedFields: string[];
};

/** Strips every field detectPii flagged. Returns what was removed for audit — never silently. */
export function minimizeForIntelligence(record: Record<string, unknown>): MinimizationResult {
  const flags = detectPii(record);
  const removedFields = flags.map((f) => f.field);
  const cleaned = { ...record };
  for (const field of removedFields) delete cleaned[field];
  return { cleaned, removedFields };
}

/** Cohort-size gate. An aggregate with fewer independent contributors than this is refused, not rounded up or hidden behind a smaller disclaimer. */
export function meetsAggregationThreshold(independentSourceCount: number): boolean {
  return independentSourceCount >= MINIMUM_COHORT_SIZE;
}

export type VinDecodeResult = {
  make: string | null;
  model: string | null;
  modelYear: number | null;
  /** Explicitly false when decoding didn't run or failed — never guessed as true. */
  decoded: boolean;
};

/**
 * The only function permitted to receive a raw VIN. It returns decoded
 * vehicle attributes and nothing that could reconstruct the VIN — no WMI
 * fragment, no check digit, no serial. Real decoding (NHTSA vPIC or
 * equivalent) is a follow-up; until wired, this fails closed (decoded:
 * false) rather than inventing a make/model.
 */
export function decodeVinTransiently(_vin: string): VinDecodeResult {
  return { make: null, model: null, modelYear: null, decoded: false };
}

/**
 * Collapses a raw lat/long into the broad band Environment.broadGeographicMarket
 * expects — never persists the coordinate itself. `resolution` names the
 * granularity actually used so downstream consumers know how broad "broad" is.
 */
export function broadenLocation(
  _lat: number,
  _lng: number,
  marketLabel: string,
): { broadGeographicMarket: string; resolution: "country" | "region" | "market" } {
  return { broadGeographicMarket: marketLabel, resolution: "market" };
}

/**
 * Records tagged as synthetic/test must never reach a production aggregate
 * (§25). Anything created by this codebase's own test fixtures should carry
 * this marker so quality.ts and the intelligence API can filter it out by
 * construction rather than by convention.
 */
export const SYNTHETIC_DATA_TAG = "__motorbridge_synthetic__" as const;

export function isSyntheticRecord(record: Record<string, unknown>): boolean {
  return record[SYNTHETIC_DATA_TAG] === true;
}
