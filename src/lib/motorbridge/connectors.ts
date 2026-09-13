/**
 * MotorBridge connector catalog (§10, §11).
 *
 * Every integration MotorBridge can read from is listed here with two
 * independent statuses that must never be collapsed into one:
 *
 *   legalAccessStatus — is MotorBridge allowed to read this data this way.
 *   maturity          — has MotorBridge actually built and proven a parser
 *                        for it (DISCOVERED -> ... -> PRODUCTION_SUPPORTED,
 *                        never skipping a rung, §10).
 *
 * "Discovered" is not "supported." A row only reaches TEST_PASSED once a
 * real fixture exists and a real test in __tests__/parsers.test.ts passes
 * against it. Nothing here reaches PRODUCTION_SUPPORTED until real paying
 * customers have actually used it successfully — that is a fact about the
 * world, not something this file can assert into being.
 *
 * Adding a vendor-specific connector (e.g. "AiM RaceStudio export") requires
 * DOCUMENTATION_VERIFIED against that vendor's actual published format
 * before a parser is written — research, not assumption. Until that
 * research happens, vendors are listed in VENDOR_RESEARCH_QUEUE below as
 * named research targets, not as connectors.
 */

import type { LegalAccessStatus, ConnectorMaturity, VehicleCategory } from "./types";

export type ConnectorCatalogEntry = {
  slug: string;
  name: string;
  categories: VehicleCategory[];
  /** The real, checkable standard or convention this connector reads, e.g. "SAE J1979 (OBD-II Mode 01 PIDs)". */
  formatBasis: string;
  legalAccessStatus: LegalAccessStatus;
  maturity: ConnectorMaturity;
  ingestionMethod: "customer_exported_file" | "official_api" | "official_sdk" | "standards_interface";
  /** Documentation label only — the real content lives in fixtures/content.ts, keyed by connector slug (FIXTURE_CONTENT_BY_CONNECTOR), so the sample served to a browser and the sample a test runs against can never drift apart. */
  fixtureFile: string | null;
  notes: string;
};

const REVIEWED = "2026-09-13";

export const CONNECTOR_CATALOG: ConnectorCatalogEntry[] = [
  {
    slug: "generic_obdii_csv",
    name: "Generic OBD-II diagnostic log (CSV)",
    categories: ["passenger", "diesel_pickup", "hybrid"],
    formatBasis: "SAE J1979 (OBD-II Mode 01 PIDs) — an open, published standard, not vendor-specific.",
    legalAccessStatus: "OPEN_STANDARD",
    maturity: "TEST_PASSED",
    ingestionMethod: "customer_exported_file",
    fixtureFile: "obd2-sample.csv",
    notes:
      "Reads the common CSV shape most consumer OBD-II scan tools and apps can export: a timestamp column plus one column per named PID. Column-name matching is intentionally generic rather than tied to one app's export, because the PIDs themselves are the open standard, not any one tool's file format.",
  },
  {
    slug: "generic_telemetry_csv",
    name: "Generic motorsport telemetry log (CSV)",
    categories: ["racing_motorsport", "passenger"],
    formatBasis:
      "A named-channel CSV export (time column + labeled channels such as RPM, TPS, Lambda, Boost) — the common export shape across most datalogger/ECU software, not a specific vendor's proprietary binary format.",
    legalAccessStatus: "CUSTOMER_EXPORTED_DATA",
    maturity: "TEST_PASSED",
    ingestionMethod: "customer_exported_file",
    fixtureFile: "telemetry-sample.csv",
    notes:
      "Deliberately NOT claimed as 'AiM supported' / 'MoTeC supported' / etc. — this reads a generic named-channel CSV shape a customer exports from their own tool. Naming a specific vendor as supported requires DOCUMENTATION_VERIFIED against that vendor's actual published export spec first (see VENDOR_RESEARCH_QUEUE); skipping that step is exactly the unsupported-compatibility-claim risk the blueprint calls out.",
  },
  {
    slug: "generic_j1939_log",
    name: "Generic heavy-duty/commercial diagnostic log (J1939 SPNs)",
    categories: ["diesel_pickup", "commercial_truck_fleet"],
    formatBasis: "SAE J1939 (PGN/SPN parameter definitions) — an open, published standard for commercial/heavy-duty vehicle CAN data.",
    legalAccessStatus: "OPEN_STANDARD",
    maturity: "TEST_PASSED",
    ingestionMethod: "customer_exported_file",
    fixtureFile: "j1939-sample.csv",
    notes:
      "Reads SPN-labeled parameter exports (engine speed, coolant temp, boost, DPF/regen status, DEF level) common to heavy-duty diagnostic tools. Same discipline as the OBD-II connector: the SPN definitions are the open standard being read, not any one tool's proprietary format.",
  },
];

export type VendorResearchTarget = {
  vendor: string;
  domain: "mechanic_diagnostic" | "racing_tuning";
  status: "not_started" | "documentation_in_progress" | "documentation_verified";
  /** What was actually found, with a real citation — populated only from genuine research, never filled in to look complete. */
  note?: string;
};

/**
 * Named vendors from the blueprint's research list (§10), tracked as
 * research targets — not connectors — until each one's actual published
 * format/SDK is verified. Populate `status` only when real documentation
 * has actually been read; this list existing is not evidence anything was
 * researched.
 */
export const VENDOR_RESEARCH_QUEUE: VendorResearchTarget[] = [
  { vendor: "Snap-on", domain: "mechanic_diagnostic", status: "not_started" },
  { vendor: "Autel", domain: "mechanic_diagnostic", status: "not_started" },
  { vendor: "TOPDON", domain: "mechanic_diagnostic", status: "not_started" },
  { vendor: "LAUNCH X-431", domain: "mechanic_diagnostic", status: "not_started" },
  { vendor: "Bosch ADS", domain: "mechanic_diagnostic", status: "not_started" },
  {
    vendor: "OBDLink",
    domain: "mechanic_diagnostic",
    status: "documentation_in_progress",
    note:
      "Real official developer resources exist: obdlink.com/developers/ (technical articles, monitored dev forum) and ScanTool.net's STN11xx/STN21xx Family Reference and Programming Manual for the chip powering their adapters, plus an open-source 'OBD Driver Module' reference design. This is a live serial/BLE AT-command interface, not a file export — a real connector here means a live-connection integration, a different shape of work than the file-based parsers built so far. Not yet PARSER_BUILT.",
  },
  {
    vendor: "AiM",
    domain: "racing_tuning",
    status: "documentation_in_progress",
    note:
      "AiM Race Studio 3 exports 'RaceStudio 3 CSV' (and a legacy 'RaceStudio 2 CSV' format kept for compatibility) with a real, documented shape: a header block, then a units row, THEN the data rows — not a plain single-header CSV. Our generic_telemetry_csv connector assumes row 1 is the header and row 2 is data, so it would misread AiM's units row as a data sample. A real aim_race_studio_csv connector needs its own header-detection logic before it can honestly claim TEST_PASSED; the generic connector must not be presented as AiM-compatible.",
  },
  { vendor: "MoTeC", domain: "racing_tuning", status: "not_started" },
  { vendor: "Haltech", domain: "racing_tuning", status: "not_started" },
  { vendor: "HP Tuners", domain: "racing_tuning", status: "not_started" },
  { vendor: "EcuTek", domain: "racing_tuning", status: "not_started" },
  { vendor: "Link", domain: "racing_tuning", status: "not_started" },
  { vendor: "FuelTech", domain: "racing_tuning", status: "not_started" },
  { vendor: "Holley EFI", domain: "racing_tuning", status: "not_started" },
  {
    vendor: "MegaSquirt/TunerStudio",
    domain: "racing_tuning",
    status: "documentation_in_progress",
    note:
      "EFI Analytics/TunerStudio publish an official binary log spec: efianalytics.com/TunerStudio/docs/MLG_Binary_LogFormat_1.0.pdf (the .mlg format used by MegaLogViewer). That's a binary format, not CSV — a real connector would need to implement this spec directly (or shell out to a converter) rather than reuse generic_telemetry_csv. MegaLogViewer can also export to CSV by hand, which our generic connector likely reads, but that path has not been verified against a real exported file yet.",
  },
  { vendor: "VBOX", domain: "racing_tuning", status: "not_started" },
  { vendor: "Cosworth", domain: "racing_tuning", status: "not_started" },
];

export function connectorBySlug(slug: string): ConnectorCatalogEntry | undefined {
  return CONNECTOR_CATALOG.find((c) => c.slug === slug);
}

/** The only honest "supported formats" count for marketing copy: TEST_PASSED or better. Never the catalog's total length. */
export function testedConnectorCount(): number {
  return CONNECTOR_CATALOG.filter((c) => c.maturity === "TEST_PASSED" || c.maturity === "PRODUCTION_SUPPORTED").length;
}

export const CATALOG_REVIEWED_AT = REVIEWED;
