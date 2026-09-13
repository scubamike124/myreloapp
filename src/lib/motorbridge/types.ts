/**
 * MotorBridge Universal Vehicle/Powertrain Schema — v1.
 *
 * "Supported vehicles and diagnostic systems. One data language."
 *
 * Every object below is versioned (see SCHEMA_VERSION) because the day this
 * needs a breaking change, old records must still say honestly which shape
 * they were written in. Nothing in here is invented: a field MotorBridge
 * cannot establish from real ingested data is `null`, never a guess.
 *
 * Every value that matters carries three things alongside it, deliberately
 * kept separate from the value itself rather than folded into a single
 * "confidence" number:
 *   - Provenance  — where the value came from (measured, customer-supplied,
 *     manufacturer spec, calculated, inferred). See provenance.ts.
 *   - Confidence  — how much to trust it, and on what sample. See confidence.ts.
 *   - Measurement — the original unit/value alongside the normalized one, so
 *     converting for display never destroys what was actually recorded.
 *
 * This file defines shapes only. Normalization logic lives in normalize.ts,
 * unit math in units.ts, fuel math in fuel.ts, privacy handling in privacy.ts.
 */

import type { PressureUnit } from "./units.ts";

export const SCHEMA_VERSION = "1.0.0" as const;

// ---------------------------------------------------------------------------
// Provenance, confidence, measurement, rights — attached to values, not
// hidden inside them.
// ---------------------------------------------------------------------------

/** Where a value actually came from. Never blank when the value is present. */
export type ProvenanceKind =
  | "scanner_measured"
  | "ecu_measured"
  | "telemetry_measured"
  | "repair_order"
  | "customer_supplied"
  | "manufacturer_spec"
  | "official_api"
  | "weather_source"
  | "calculated"
  | "inferred";

export type Provenance = {
  kind: ProvenanceKind;
  /** Free-text origin detail, e.g. "AiM Solo 2 CSV export", "Snap-on ADS report". */
  detail: string;
  /** ISO 8601. When the source actually captured/reported this, not when MotorBridge ingested it. */
  observedAt: string | null;
};

/**
 * Sample size and quality context. A pattern from 7 cars must never be
 * presentable as if it represents 700,000 (§14 of the blueprint this
 * implements). Every aggregate output carries one of these; individual
 * measured values do not need it (their provenance is enough).
 */
export type Confidence = {
  sampleSize: number;
  /** Independent contributors behind the sample, when known — a duplicate signal is not diversity. */
  sourceDiversity: number | null;
  observationPeriodStart: string | null;
  observationPeriodEnd: string | null;
  geographicCoverage: string[];
  /** 0-1. Left null rather than fabricated when there is no principled way to compute it yet. */
  qualityScore: number | null;
};

/** A quantity that keeps its original unit next to its normalized SI-family value. Never destroy the original. */
export type Measurement<Unit extends string = string> = {
  value: number;
  unit: Unit;
  /** Canonical unit this quantity normalizes to (see units.ts CANONICAL_UNIT). */
  normalizedUnit: Unit;
  normalizedValue: number;
  provenance: Provenance;
};

/** Data-use rights attached to a record, independent of who currently holds it. */
export type DataRightsCategory =
  | "customer_exported"
  | "official_api_license"
  | "data_partner_ongoing"
  | "data_partner_historical"
  | "internal_test_fixture";

export type DataRights = {
  category: DataRightsCategory;
  /** Does this record's owner permit inclusion in aggregate MotorBridge Intelligence? Never assumed true. */
  aggregateAnalyticsPermitted: boolean;
  /** Explicit opt-in only — installing a connector is not blanket permission (§22). */
  historicalImportAuthorized: boolean;
  /** Fields the rights-holder excluded from any aggregate use, by schema field path. */
  excludedFields: string[];
  geographicRestrictions: string[];
  grantedAt: string | null;
  revokedAt: string | null;
};

// ---------------------------------------------------------------------------
// Source — where ingested data entered the system.
// ---------------------------------------------------------------------------

export type LegalAccessStatus =
  | "OPEN_STANDARD"
  | "OFFICIAL_API"
  | "OFFICIAL_SDK"
  | "LICENSED"
  | "CUSTOMER_EXPORTED_DATA"
  | "PERMISSION_REQUIRED"
  | "LEGAL_REVIEW_REQUIRED"
  | "DO_NOT_SUPPORT";

/** Never skip a rung. A connector earns the next status only by passing the previous one. */
export type ConnectorMaturity =
  | "DISCOVERED"
  | "DOCUMENTATION_VERIFIED"
  | "PARSER_BUILT"
  | "TEST_FIXTURE_AVAILABLE"
  | "TEST_PASSED"
  | "PRODUCTION_SUPPORTED";

export type VehicleCategory =
  | "passenger"
  | "motorcycle"
  | "diesel_pickup"
  | "commercial_truck_fleet"
  | "marine"
  | "racing_motorsport"
  | "hybrid"
  | "ev_battery";

export type Source = {
  id: string;
  /** Connector slug from the CONNECTOR_CATALOG, e.g. "generic_obdii_csv". */
  connectorSlug: string;
  legalAccessStatus: LegalAccessStatus;
  maturity: ConnectorMaturity;
  ingestedAt: string;
  /** Original filename or endpoint, kept for audit — never used as an identity signal. */
  originLabel: string;
};

// ---------------------------------------------------------------------------
// Fuel — worldwide normalization is mandatory (§6). 91 AKI != 91 RON.
// ---------------------------------------------------------------------------

export type FuelType = "gasoline" | "diesel" | "ethanol" | "race_fuel" | "hybrid" | "electric" | "other";

export type OctaneRatingMethod = "RON" | "MON" | "AKI" | "unknown";

export type Fuel = {
  fuelType: FuelType;
  /** The number as reported, with which method it was reported under. Never assumed. */
  octaneRating: { value: number; method: OctaneRatingMethod } | null;
  /** Derived only when both RON and MON are actually known: AKI = (RON+MON)/2. Never inferred from AKI alone. */
  derivedRon: number | null;
  derivedMon: number | null;
  derivedAki: number | null;
  ethanolPercent: number | null;
  /** How the ethanol percentage was obtained — a flex-fuel sensor reading differs from a label claim. */
  ethanolSource: "flex_fuel_sensor" | "reported" | "inferred" | null;
  cetaneNumber: number | null;
  raceFuelSpec: string | null;
  brandProduct: string | null;
  countryOfMeasurement: string | null;
  valueOrigin: "measured" | "reported" | "inferred";
  observedAt: string | null;
};

// ---------------------------------------------------------------------------
// Environment — non-identifying context (§18). Broad bands, not GPS trails.
// ---------------------------------------------------------------------------

export type ClimateClass =
  | "cold_continental"
  | "temperate"
  | "hot_arid"
  | "hot_humid"
  | "tropical"
  | "high_altitude"
  | "unknown";

export type Environment = {
  temperatureBandC: [number, number] | null;
  humidityBandPercent: [number, number] | null;
  atmosphericPressureKpa: number | null;
  altitudeBandM: [number, number] | null;
  precipitation: "none" | "rain" | "snow" | "unknown" | null;
  season: "winter" | "spring" | "summer" | "fall" | null;
  climateClass: ClimateClass;
  /** Broad market, e.g. "US-West", "Southeast Asia" — never a precise coordinate. */
  broadGeographicMarket: string | null;
};

// ---------------------------------------------------------------------------
// Duty cycle (§19) — mileage alone is insufficient.
// ---------------------------------------------------------------------------

export type DutyCycleKind =
  | "street"
  | "track"
  | "drag"
  | "endurance"
  | "towing"
  | "delivery"
  | "fleet"
  | "heavy_duty"
  | "high_idle"
  | "marine"
  | "motorcycle"
  | "commercial";

export type OperatingProfile = {
  dutyCycle: DutyCycleKind[];
  mileage: Measurement<"mi" | "km"> | null;
  engineHours: number | null;
  cycles: number | null;
  timeInServiceDays: number | null;
  /** Free-form load indicators specific to category (tow weight, payload, passenger count, etc.). */
  loadIndicators: Record<string, number | string> | null;
};

// ---------------------------------------------------------------------------
// Vehicle configuration (§17) — stock vs modified matters most for racing.
// ---------------------------------------------------------------------------

export type ForcedInduction = "none" | "turbo" | "supercharger" | "twin_turbo" | "electric_supercharger" | "unknown";

export type VehicleConfiguration = {
  isStock: boolean | null;
  engineFamily: string | null;
  transmission: string | null;
  forcedInduction: ForcedInduction;
  turboSuperchargerSpec: string | null;
  fuelSystemConfig: string | null;
  ecuCalibrationClass: string | null;
  exhaust: string | null;
  intake: string | null;
  cooling: string | null;
  tireWheel: string | null;
  drivetrainChanges: string[];
  /** Category-specific modifications that don't fit the named fields above. */
  otherModifications: Record<string, string> | null;
};

// ---------------------------------------------------------------------------
// Powertrain — universal core + category-specific extensions, never forced
// into one identical shape (§5).
// ---------------------------------------------------------------------------

export type PowertrainType = "gasoline" | "diesel" | "hybrid" | "ev" | "flex_fuel" | "alternative_racing";

export type GasolinePerformanceFields = {
  throttlePercent: number | null;
  boostOrMap: Measurement<PressureUnit> | null;
  ignitionTimingDeg: number | null;
  knockRetardDeg: number | null;
  lambdaOrAfr: { lambda: number | null; afr: number | null } | null;
  injectorDutyPercent: number | null;
  fuelPressure: Measurement<PressureUnit> | null;
  intakeTempC: number | null;
  coolantTempC: number | null;
  oilTemp: Measurement<"C" | "F"> | null;
  oilPressure: Measurement<PressureUnit> | null;
};

export type DieselFields = {
  railPressure: Measurement<PressureUnit> | null;
  injectionTimingDeg: number | null;
  injectionQuantityMg: number | null;
  boost: Measurement<PressureUnit> | null;
  coolantTempC: number | null;
  exhaustGasTempC: number | null;
  dpfStatus: "normal" | "regenerating" | "requires_service" | "unknown" | null;
  lastRegenAt: string | null;
  defLevelPercent: number | null;
  scrEfficiencyPercent: number | null;
  turboData: Record<string, number> | null;
  engineHours: number | null;
};

export type EvFields = {
  stateOfChargePercent: number | null;
  stateOfHealthPercent: number | null;
  packVoltage: Measurement<"V"> | null;
  packCurrent: Measurement<"A"> | null;
  packTempC: number | null;
  chargeRateKw: number | null;
  chargeSessionType: "AC" | "DC_fast" | "unknown" | null;
  regenBrakingActive: boolean | null;
  diagnosticFaultCodes: string[];
};

export type Powertrain = {
  type: PowertrainType;
  displacementLiters: number | null;
  cylinderCount: number | null;
  /** RPM is universal to any powertrain with a crankshaft (gasoline, diesel, hybrid) — kept here rather than duplicated per category extension. Null for pure EV. */
  rpm: Measurement<"rpm"> | null;
  gasoline: GasolinePerformanceFields | null;
  diesel: DieselFields | null;
  ev: EvFields | null;
  fuel: Fuel | null;
};

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

export type Vehicle = {
  id: string;
  category: VehicleCategory;
  /** VIN is processed transiently for decode only; never retained in the intelligence dataset (§24). */
  vinDecodedMake: string | null;
  vinDecodedModel: string | null;
  vinDecodedYear: number | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  countryOfSale: string | null;
  configuration: VehicleConfiguration | null;
  operatingProfile: OperatingProfile | null;
};

// ---------------------------------------------------------------------------
// Component / Fault / Repair / RepairOutcome (§15, §16)
// ---------------------------------------------------------------------------

export type Component = {
  id: string;
  oemPartNumber: string | null;
  aftermarketPartNumbers: string[];
  supersededNumbers: string[];
  componentFamily: string | null;
  manufacturerBrand: string | null;
};

export type Fault = {
  id: string;
  dtcCode: string | null;
  description: string | null;
  componentId: string | null;
  detectedAt: string | null;
  provenance: Provenance;
};

export type RepairOutcome = {
  dtcReturned: boolean | null;
  repeatVisit: boolean | null;
  mileageOrTimeUntilRecurrence: Measurement<"mi" | "km" | "days"> | null;
  resultLabel: "resolved" | "not_resolved" | "partially_resolved" | "unknown";
};

export type Repair = {
  id: string;
  faultId: string | null;
  diagnosis: string | null;
  repairAttempted: string | null;
  partsReplaced: Component[];
  alternativeAttempts: string[];
  outcome: RepairOutcome | null;
  provenance: Provenance;
};

// ---------------------------------------------------------------------------
// DiagnosticEvent / TelemetrySession — the two shapes ingested data resolves into.
// ---------------------------------------------------------------------------

export type DiagnosticEvent = {
  id: string;
  vehicleId: string;
  sourceId: string;
  occurredAt: string | null;
  faults: Fault[];
  repairs: Repair[];
  environment: Environment | null;
  rights: DataRights;
};

export type TelemetrySession = {
  id: string;
  vehicleId: string;
  sourceId: string;
  sessionType: DutyCycleKind | null;
  startedAt: string | null;
  endedAt: string | null;
  powertrainSamples: Powertrain[];
  environment: Environment | null;
  performanceResult: string | null;
  reliabilityOutcome: string | null;
  rights: DataRights;
};

// ---------------------------------------------------------------------------
// Normalized ingest result — what every parser must converge to.
// ---------------------------------------------------------------------------

export type NormalizedRecord = {
  schemaVersion: typeof SCHEMA_VERSION;
  vehicle: Vehicle;
  source: Source;
  diagnosticEvents: DiagnosticEvent[];
  telemetrySessions: TelemetrySession[];
  /** Fields the parser could not populate stay absent from this list — never guessed (§12). */
  unresolvedFields: string[];
};

/** A parser's raw finding before rights/environment context is attached — kept minimal so parsers stay dumb. */
export type ParseResult = {
  ok: boolean;
  vehicle: Partial<Vehicle>;
  diagnosticEvents: DiagnosticEvent[];
  telemetrySessions: TelemetrySession[];
  warnings: string[];
  unresolvedFields: string[];
};
