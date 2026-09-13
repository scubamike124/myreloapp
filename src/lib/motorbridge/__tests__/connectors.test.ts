import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONNECTOR_CATALOG, VENDOR_RESEARCH_QUEUE, testedConnectorCount, connectorBySlug } from "../connectors";

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

describe("the vendor research queue records real findings, not filled-in-to-look-complete ones", () => {
  it("nothing beyond not_started lacks a citation/finding", () => {
    for (const v of VENDOR_RESEARCH_QUEUE) {
      if (v.status !== "not_started") {
        assert.ok(v.note && v.note.length > 20, `${v.vendor} claims ${v.status} but has no real finding attached`);
      }
    }
  });

  it("no vendor jumps straight to documentation_verified without a connector actually built against it", () => {
    // A vendor only reaches "verified" once a parser exists and passes a real
    // fixture from that vendor's own export — none of the founding three
    // connectors are vendor-specific, so nothing here should be verified yet.
    assert.equal(VENDOR_RESEARCH_QUEUE.filter((v) => v.status === "documentation_verified").length, 0);
  });
});
