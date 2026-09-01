import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countReloApplied, summarizeHqEarningsJson } from "./hq-nationwide";

describe("Relo admin nationwide HQ snapshot", () => {
  it("counts Relo applied vs rejected without treating discovery as applied", () => {
    const c = countReloApplied([
      { status: "discovered" },
      { status: "evaluating" },
      { status: "rejected" },
      { status: "rejected" },
      { status: "submitted" },
      { status: "working" },
    ]);
    assert.equal(c.applied, 2);
    assert.equal(c.rejected, 2);
    assert.equal(c.submitted, 1);
  });

  it("summarizes HQ marketplace + EMP applied from GET payload", () => {
    const v = summarizeHqEarningsJson(
      {
        ok: true,
        snapshot: {
          jobs: [
            { title: "A", status: "rejected" },
            { title: "B", status: "rejected" },
            { title: "C", status: "submitted" },
          ],
        },
        emp: {
          departments: { contracts: 3, funding: 1, claims: 0, recovery: 2 },
          money: { potentialUsd: 10, inProcess: 1, awarded: 0, receivedUsd: 0 },
          sources: { total: 180, healthy: 10, degraded: 0, blocked: 1 },
          worker: { ticks: 8, lastTickAt: "2026-08-31T00:00:00.000Z", notes: [], paused: false },
          opportunities: [
            { id: "1", title: "Grant", status: "Found", type: "FUNDING" },
            { id: "2", title: "SAM", status: "Submitted", type: "CONTRACTS" },
          ],
          ownerActions: [],
          blockers: [],
          activity: [],
        },
      },
      "https://hq.amberoneai.com",
    );
    assert.equal(v.ok, true);
    assert.equal(v.hqApplied, 1);
    assert.equal(v.hqRejected, 2);
    assert.equal(v.empApplied, 1);
    assert.equal(v.emp?.departments.contracts, 3);
  });
});
