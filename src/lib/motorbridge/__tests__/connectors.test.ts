import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONNECTOR_CATALOG, testedConnectorCount, connectorBySlug } from "../connectors";

describe("the connector catalog never claims more than it has proven", () => {
  it("every entry that claims TEST_PASSED has a fixture file", () => {
    for (const c of CONNECTOR_CATALOG) {
      if (c.maturity === "TEST_PASSED" || c.maturity === "PRODUCTION_SUPPORTED") {
        assert.ok(c.fixtureFile, `${c.slug} claims ${c.maturity} but has no fixture`);
      }
    }
  });

  it("no entry claims PRODUCTION_SUPPORTED yet — that requires real paying customers, not a passing test", () => {
    assert.equal(
      CONNECTOR_CATALOG.filter((c) => c.maturity === "PRODUCTION_SUPPORTED").length,
      0,
      "PRODUCTION_SUPPORTED must never be set until real customers have actually used the connector successfully",
    );
  });

  it("testedConnectorCount matches the catalog, not an inflated marketing number", () => {
    const manualCount = CONNECTOR_CATALOG.filter(
      (c) => c.maturity === "TEST_PASSED" || c.maturity === "PRODUCTION_SUPPORTED",
    ).length;
    assert.equal(testedConnectorCount(), manualCount);
    assert.ok(testedConnectorCount() <= CONNECTOR_CATALOG.length, "cannot claim more tested connectors than exist");
  });

  it("looks up a connector by slug", () => {
    assert.equal(connectorBySlug("generic_obdii_csv")?.name, "Generic OBD-II diagnostic log (CSV)");
    assert.equal(connectorBySlug("does_not_exist"), undefined);
  });
});
