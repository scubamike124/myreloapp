/**
 * Generic motorsport telemetry log parser.
 *
 * Reads a named-channel CSV export (time column + labeled channels such as
 * RPM, TPS, Lambda, Boost, Knock) — the common shape across most
 * datalogger/ECU software's "export to CSV" feature. Deliberately NOT tied
 * to any one vendor's proprietary binary format or exact header convention;
 * see connectors.ts for why this stays CUSTOMER_EXPORTED_DATA rather than
 * naming AiM/MoTeC/Haltech/etc. as supported.
 *
 * Connector: generic_telemetry_csv (connectors.ts).
 */
import { parseCsvWithHeader, findColumn, toNumberOrNull } from "../csv.ts";
import { pressureMeasurement } from "../units.ts";
import type { ParseResult, Powertrain, TelemetrySession, Provenance } from "../types.ts";
import { randomUUID } from "node:crypto";

const PROVENANCE: Provenance = { kind: "telemetry_measured", detail: "generic motorsport telemetry CSV export", observedAt: null };

export function parseTelemetryCsv(csvText: string, vehicleId: string, sourceId: string): ParseResult {
  const { headers, rows } = parseCsvWithHeader(csvText);
  const warnings: string[] = [];
  const unresolvedFields: string[] = [];

  if (headers.length === 0 || rows.length === 0) {
    return { ok: false, vehicle: {}, diagnosticEvents: [], telemetrySessions: [], warnings: ["empty or unparseable CSV"], unresolvedFields: [] };
  }

  const col = {
    time: findColumn(headers, ["time", "timestamp"]),
    rpm: findColumn(headers, ["rpm", "engine speed"]),
    tps: findColumn(headers, ["tps", "throttle"]),
    map: findColumn(headers, ["map", "manifold pressure"]),
    lambda: findColumn(headers, ["lambda"]),
    ignition: findColumn(headers, ["ignition timing", "timing"]),
    boost: findColumn(headers, ["boost"]),
    coolant: findColumn(headers, ["coolant temp"]),
    oilPressure: findColumn(headers, ["oil pressure"]),
    knock: findColumn(headers, ["knock retard", "knock"]),
  };

  for (const [field, value] of Object.entries(col)) {
    if (value === null) unresolvedFields.push(`telemetry.${field}`);
  }
  if (col.rpm === null && col.time === null) {
    warnings.push("neither a time column nor an RPM channel was found — this file may not be a telemetry log");
  }

  const powertrainSamples: Powertrain[] = rows.map((row) => {
    const rpmValue = col.rpm ? toNumberOrNull(row[col.rpm]) : null;
    const mapValue = col.map ? toNumberOrNull(row[col.map]) : null; // fixture reports kPa
    const boostValue = col.boost ? toNumberOrNull(row[col.boost]) : null; // fixture reports psi
    const lambdaValue = col.lambda ? toNumberOrNull(row[col.lambda]) : null;
    const oilPressureValue = col.oilPressure ? toNumberOrNull(row[col.oilPressure]) : null;
    return {
      type: "gasoline",
      displacementLiters: null,
      cylinderCount: null,
      rpm: rpmValue !== null ? { value: rpmValue, unit: "rpm", normalizedUnit: "rpm", normalizedValue: rpmValue, provenance: PROVENANCE } : null,
      gasoline: {
        throttlePercent: col.tps ? toNumberOrNull(row[col.tps]) : null,
        boostOrMap:
          boostValue !== null
            ? pressureMeasurement(boostValue, "psi", PROVENANCE)
            : mapValue !== null
              ? pressureMeasurement(mapValue, "kpa", PROVENANCE)
              : null,
        ignitionTimingDeg: col.ignition ? toNumberOrNull(row[col.ignition]) : null,
        knockRetardDeg: col.knock ? toNumberOrNull(row[col.knock]) : null,
        lambdaOrAfr: lambdaValue !== null ? { lambda: lambdaValue, afr: null } : null,
        injectorDutyPercent: null,
        fuelPressure: null,
        intakeTempC: null,
        coolantTempC: col.coolant ? toNumberOrNull(row[col.coolant]) : null,
        oilTemp: null,
        oilPressure: oilPressureValue !== null ? pressureMeasurement(oilPressureValue, "psi", PROVENANCE) : null,
      },
      diesel: null,
      ev: null,
      fuel: null,
    };
  });

  const startedAt = col.time ? rows[0][col.time] || null : null;
  const endedAt = col.time ? rows[rows.length - 1][col.time] || null : null;

  const session: TelemetrySession = {
    id: randomUUID(),
    vehicleId,
    sourceId,
    sessionType: "track",
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

  return {
    ok: true,
    vehicle: { category: "racing_motorsport" },
    diagnosticEvents: [],
    telemetrySessions: [session],
    warnings,
    unresolvedFields,
  };
}
