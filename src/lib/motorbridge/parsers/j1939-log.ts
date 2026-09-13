/**
 * Generic heavy-duty/commercial diagnostic log parser.
 *
 * Reads SPN-labeled parameter exports common to heavy-duty diagnostic tools,
 * under SAE J1939's open, published PGN/SPN parameter definitions (SPN 190 =
 * Engine Speed, SPN 110 = Engine Coolant Temperature, SPN 102 = Boost
 * Pressure, SPN 1761 = DEF Tank Level, SPN 3251 = DPF status/regen
 * indicators are among the most common). Column-name matching looks for the
 * SPN number specifically so the parser is not tied to any one tool's exact
 * label text.
 *
 * Connector: generic_j1939_log (connectors.ts). Legal/access status:
 * OPEN_STANDARD, CUSTOMER_EXPORTED_DATA ingestion.
 */
import { parseCsvWithHeader, findColumn, toNumberOrNull } from "../csv";
import { pressureMeasurement } from "../units";
import type { ParseResult, Powertrain, TelemetrySession, Provenance, DieselFields } from "../types";
import { randomUUID } from "node:crypto";

const PROVENANCE: Provenance = { kind: "ecu_measured", detail: "generic J1939 diagnostic CSV export", observedAt: null };

function findSpnColumn(headers: string[], spn: number, fallbackNames: string[]): string | null {
  const bySpn = headers.find((h) => new RegExp(`\\bspn\\s*${spn}\\b`, "i").test(h));
  if (bySpn) return bySpn;
  return findColumn(headers, fallbackNames);
}

function parseDpfStatus(raw: string | undefined): DieselFields["dpfStatus"] {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("regen")) return "regenerating";
  if (v.includes("service") || v.includes("fault")) return "requires_service";
  if (v.includes("normal")) return "normal";
  return v ? "unknown" : null;
}

export function parseJ1939Log(csvText: string, vehicleId: string, sourceId: string): ParseResult {
  const { headers, rows } = parseCsvWithHeader(csvText);
  const warnings: string[] = [];
  const unresolvedFields: string[] = [];

  if (headers.length === 0 || rows.length === 0) {
    return { ok: false, vehicle: {}, diagnosticEvents: [], telemetrySessions: [], warnings: ["empty or unparseable CSV"], unresolvedFields: [] };
  }

  const col = {
    timestamp: findColumn(headers, ["timestamp", "time"]),
    engineSpeed: findSpnColumn(headers, 190, ["engine speed", "rpm"]),
    coolantTemp: findSpnColumn(headers, 110, ["coolant temp", "engine coolant temperature"]),
    boost: findSpnColumn(headers, 102, ["boost pressure"]),
    defLevel: findSpnColumn(headers, 1761, ["def level", "def tank level"]),
    dpfStatus: findSpnColumn(headers, 3251, ["dpf status"]),
    engineHours: findSpnColumn(headers, 247, ["engine hours"]),
  };

  for (const [field, value] of Object.entries(col)) {
    if (value === null) unresolvedFields.push(`j1939.${field}`);
  }
  if (col.engineSpeed === null) warnings.push("no SPN 190 (Engine Speed) column found");

  const powertrainSamples: Powertrain[] = rows.map((row) => {
    const rpmValue = col.engineSpeed ? toNumberOrNull(row[col.engineSpeed]) : null;
    const boostValue = col.boost ? toNumberOrNull(row[col.boost]) : null; // fixture reports kPa
    return {
      type: "diesel",
      displacementLiters: null,
      cylinderCount: null,
      rpm: rpmValue !== null ? { value: rpmValue, unit: "rpm", normalizedUnit: "rpm", normalizedValue: rpmValue, provenance: PROVENANCE } : null,
      gasoline: null,
      diesel: {
        railPressure: null,
        injectionTimingDeg: null,
        injectionQuantityMg: null,
        boost: boostValue !== null ? pressureMeasurement(boostValue, "kpa", PROVENANCE) : null,
        coolantTempC: col.coolantTemp ? toNumberOrNull(row[col.coolantTemp]) : null,
        exhaustGasTempC: null,
        dpfStatus: col.dpfStatus ? parseDpfStatus(row[col.dpfStatus]) : null,
        lastRegenAt: null,
        defLevelPercent: col.defLevel ? toNumberOrNull(row[col.defLevel]) : null,
        scrEfficiencyPercent: null,
        turboData: null,
        engineHours: col.engineHours ? toNumberOrNull(row[col.engineHours]) : null,
      },
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
    sessionType: "commercial",
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
    vehicle: { category: "commercial_truck_fleet" },
    diagnosticEvents: [],
    telemetrySessions: [session],
    warnings,
    unresolvedFields,
  };
}
