import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeUpload, convergenceCheck } from "../normalize";
import { SCHEMA_VERSION } from "../types";
import { OBD2_SAMPLE_CSV, TELEMETRY_SAMPLE_CSV, J1939_SAMPLE_CSV } from "../fixtures/content";

describe("normalizeUpload — the single door every connector goes through", () => {
  it("refuses an unknown connector rather than guessing a parser", () => {
    const outcome = normalizeUpload({ connectorSlug: "not_a_real_connector", fileText: "x", originLabel: "test" });
    assert.equal(outcome.ok, false);
  });

  it("stamps the schema version and a legal/access status on every record", () => {
    const outcome = normalizeUpload({
      connectorSlug: "generic_obdii_csv",
      fileText: OBD2_SAMPLE_CSV,
      originLabel: "unit test upload",
    });
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.record.schemaVersion, SCHEMA_VERSION);
    assert.equal(outcome.record.source.legalAccessStatus, "OPEN_STANDARD");
    assert.equal(outcome.record.source.connectorSlug, "generic_obdii_csv");
  });
});

describe("§45 — the minimum cross-ecosystem proof", () => {
  it("one mechanic source + one racing source + one diesel/commercial source all converge on the same schema version", () => {
    const { allConverged, results } = convergenceCheck([
      { connectorSlug: "generic_obdii_csv", fileText: OBD2_SAMPLE_CSV, originLabel: "mechanic" },
      { connectorSlug: "generic_telemetry_csv", fileText: TELEMETRY_SAMPLE_CSV, originLabel: "racing" },
      { connectorSlug: "generic_j1939_log", fileText: J1939_SAMPLE_CSV, originLabel: "diesel/commercial" },
    ]);
    assert.equal(allConverged, true, JSON.stringify(results));
    assert.equal(results.length, 3);
    for (const r of results) assert.equal(r.schemaVersion, SCHEMA_VERSION);
  });
});
