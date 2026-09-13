/**
 * Normalization orchestrator — the single place that takes a connector slug
 * + raw file text and produces a NormalizedRecord in the MotorBridge
 * Universal Schema (§12). This is the "MotorBridge ingestion -> Universal
 * Vehicle/Powertrain Schema" arrow from the blueprint's product diagram.
 *
 * Every parser converges here. Adding a fourth parser means adding one
 * `case` below and nothing else changes downstream.
 */
import { randomUUID } from "node:crypto";
import { connectorBySlug } from "./connectors";
import { parseObd2Log } from "./parsers/obd2-log";
import { parseTelemetryCsv } from "./parsers/telemetry-csv";
import { parseJ1939Log } from "./parsers/j1939-log";
import type { NormalizedRecord, ParseResult, Vehicle, VehicleCategory } from "./types";
import { SCHEMA_VERSION } from "./types";

export type NormalizeInput = {
  connectorSlug: string;
  fileText: string;
  originLabel: string;
  vehicleId?: string;
};

export type NormalizeOutcome =
  | { ok: true; record: NormalizedRecord }
  | { ok: false; error: string };

function runParser(connectorSlug: string, fileText: string, vehicleId: string, sourceId: string): ParseResult | null {
  switch (connectorSlug) {
    case "generic_obdii_csv":
      return parseObd2Log(fileText, vehicleId, sourceId);
    case "generic_telemetry_csv":
      return parseTelemetryCsv(fileText, vehicleId, sourceId);
    case "generic_j1939_log":
      return parseJ1939Log(fileText, vehicleId, sourceId);
    default:
      return null;
  }
}

function defaultVehicle(id: string, category: VehicleCategory, partial: Partial<Vehicle>): Vehicle {
  return {
    id,
    category: partial.category ?? category,
    vinDecodedMake: null,
    vinDecodedModel: null,
    vinDecodedYear: null,
    make: null,
    model: null,
    year: null,
    trim: null,
    countryOfSale: null,
    configuration: null,
    operatingProfile: null,
    ...partial,
  };
}

export function normalizeUpload(input: NormalizeInput): NormalizeOutcome {
  const connector = connectorBySlug(input.connectorSlug);
  if (!connector) {
    return { ok: false, error: `Unknown connector "${input.connectorSlug}" — nothing in CONNECTOR_CATALOG matches it.` };
  }
  if (connector.legalAccessStatus === "DO_NOT_SUPPORT" || connector.legalAccessStatus === "LEGAL_REVIEW_REQUIRED") {
    return { ok: false, error: `Connector "${input.connectorSlug}" is not available for ingestion (${connector.legalAccessStatus}).` };
  }

  const vehicleId = input.vehicleId ?? randomUUID();
  const sourceId = randomUUID();

  const parsed = runParser(input.connectorSlug, input.fileText, vehicleId, sourceId);
  if (!parsed) {
    return { ok: false, error: `Connector "${input.connectorSlug}" is cataloged but has no wired parser yet.` };
  }
  if (!parsed.ok) {
    return { ok: false, error: parsed.warnings[0] ?? "The file could not be parsed." };
  }

  const record: NormalizedRecord = {
    schemaVersion: SCHEMA_VERSION,
    vehicle: defaultVehicle(vehicleId, connector.categories[0], parsed.vehicle),
    source: {
      id: sourceId,
      connectorSlug: connector.slug,
      legalAccessStatus: connector.legalAccessStatus,
      maturity: connector.maturity,
      ingestedAt: new Date().toISOString(),
      originLabel: input.originLabel,
    },
    diagnosticEvents: parsed.diagnosticEvents,
    telemetrySessions: parsed.telemetrySessions,
    unresolvedFields: parsed.unresolvedFields,
  };

  return { ok: true, record };
}

/**
 * A single-file cross-ecosystem convergence check: run all three founding
 * parsers and confirm every result is a NormalizedRecord of the same schema
 * version, regardless of source category — the "minimum cross-ecosystem
 * proof" the blueprint requires before any sales conversation (§45).
 */
export function convergenceCheck(fixtures: { connectorSlug: string; fileText: string; originLabel: string }[]): {
  allConverged: boolean;
  results: { connectorSlug: string; ok: boolean; schemaVersion?: string; error?: string }[];
} {
  const results = fixtures.map((f) => {
    const outcome = normalizeUpload(f);
    return outcome.ok
      ? { connectorSlug: f.connectorSlug, ok: true, schemaVersion: outcome.record.schemaVersion }
      : { connectorSlug: f.connectorSlug, ok: false, error: outcome.error };
  });
  return { allConverged: results.every((r) => r.ok && r.schemaVersion === SCHEMA_VERSION), results };
}
