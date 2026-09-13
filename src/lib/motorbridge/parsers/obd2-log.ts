/**
 * Generic OBD-II diagnostic log parser.
 *
 * Reads the common CSV shape most consumer OBD-II scan tools/apps export: a
 * timestamp column plus one column per SAE J1979 Mode 01 PID, under
 * human-readable names (column-name matching is deliberately loose — see
 * findColumn in csv.ts — since the PIDs are the open standard, not any one
 * app's exact header text).
 *
 * Connector: generic_obdii_csv (connectors.ts). Legal/access status:
 * OPEN_STANDARD, CUSTOMER_EXPORTED_DATA ingestion.
 */
import { parseCsvWithHeader, findColumn, toNumberOrNull } from "../csv.ts";
import { pressureMeasurement } from "../units.ts";
import type { ParseResult, Powertrain, TelemetrySession, Provenance } from "../types.ts";
import { randomUUID } from "node:crypto";

const PROVENANCE: Provenance = { kind: "scanner_measured", detail: "generic OBD-II CSV export", observedAt: null };

export function parseObd2Log(csvText: string, vehicleId: string, sourceId: string): ParseResult {
  const { headers, rows } = parseCsvWithHeader(csvText);
  const warnings: string[] = [];
  const unresolvedFields: string[] = [];

  if (headers.length === 0 || rows.length === 0) {
    return { ok: false, vehicle: {}, diagnosticEvents: [], telemetrySessions: [], warnings: ["empty or unparseable CSV"], unresolvedFields: [] };
  }

  const col = {
    timestamp: findColumn(headers, ["timestamp", "time"]),
    rpm: findColumn(headers, ["rpm", "engine speed"]),
    speed: findColumn(headers, ["vehicle speed", "speed"]),
    coolant: findColumn(headers, ["coolant temp", "coolant temperature", "ect"]),
    intakeTemp: findColumn(headers, ["intake air temp", "iat"]),
    throttle: findColumn(headers, ["throttle position", "tps"]),
    map: findColumn(headers, ["intake manifold pressure", "map"]),
    load: findColumn(headers, ["engine load", "calculated load"]),
  };

  for (const [field, value] of Object.entries(col)) {
    if (value === null && field !== "load") unresolvedFields.push(`obd2.${field}`);
  }
  if (col.rpm === null) warnings.push("no RPM column found — engine-speed samples will be absent, not zero");

  const powertrainSamples: Powertrain[] = rows.map((row) => {
    const rpmValue = col.rpm ? toNumberOrNull(row[col.rpm]) : null;
    const mapValue = col.map ? toNumberOrNull(row[col.map]) : null; // already kPa per this format
    return {
      type: "gasoline",
      displacementLiters: null,
      cylinderCount: null,
      rpm: rpmValue !== null ? { value: rpmValue, unit: "rpm", normalizedUnit: "rpm", normalizedValue: rpmValue, provenance: PROVENANCE } : null,
      gasoline: {
        throttlePercent: col.throttle ? toNumberOrNull(row[col.throttle]) : null,
        boostOrMap: mapValue !== null ? pressureMeasurement(mapValue, "kpa", PROVENANCE) : null,
        ignitionTimingDeg: null,
        knockRetardDeg: null,
        lambdaOrAfr: null,
        injectorDutyPercent: null,
        fuelPressure: null,
        intakeTempC: col.intakeTemp ? toNumberOrNull(row[col.intakeTemp]) : null,
        coolantTempC: col.coolant ? toNumberOrNull(row[col.coolant]) : null,
        oilTemp: null,
        oilPressure: null,
      },
      diesel: null,
      ev: null,
      fuel: null,
    };
  });

  const startedAt = col.timestamp ? rows[0][col.timestamp] || null : null;
  const endedAt = col.timestamp ? rows[rows.length - 1][col.timestamp] || null : null;

  const session: TelemetrySession = {
    id: randomUUID(),
    vehicleId,
    sourceId,
    sessionType: "street",
    startedAt,
    endedAt,
    powertrainSamples,
    environment: null,
    performanceResult: null,
    reliabilityOutcome: null,
    rights: {
      category: "customer_exported",
      aggregateAnalyticsPermitted: false,
      historicalImportAuthorized: false,
      excludedFields: [],
      geographicRestrictions: [],
      grantedAt: null,
      revokedAt: null,
    },
  };

  return { ok: true, vehicle: { category: "passenger" }, diagnosticEvents: [], telemetrySessions: [session], warnings, unresolvedFields };
}
