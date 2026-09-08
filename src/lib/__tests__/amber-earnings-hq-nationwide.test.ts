import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countReloApplied, summarizeHqEarningsJson } from "../amber-earnings/hq-nationwide.ts";

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

  it("surfaces a real HQ marketplace payout as hqMoney, not just a raw job row", () => {
    // A won MoltJobs job pays out via snapshot.metrics — before this test, that
    // number reached `snapshot` intact but nothing read it back out, so it never
    // appeared anywhere on the Relo page even though the fetch itself worked.
    const v = summarizeHqEarningsJson(
      {
        ok: true,
        snapshot: {
          jobs: [{ title: "Benchmark agent delivery-verification approaches", status: "won", payoutUsd: 250 }],
          metrics: {
            pendingPaymentUsd: 250,
            verifiedPaidRevenueUsd: 0,
            netProfitUsd: 0,
            jobsWon: 1,
            activeJobs: 0,
          },
        },
      },
      "https://hq.amberoneai.com",
    );
    assert.equal(v.hqMoney.pendingPaymentUsd, 250);
    assert.equal(v.hqMoney.jobsWon, 1);
    assert.equal(v.hqMoney.verifiedPaidRevenueUsd, 0);
  });

  it("defaults hqMoney to zero when snapshot metrics are missing", () => {
    const v = summarizeHqEarningsJson({ ok: true, snapshot: { jobs: [] } }, "https://hq.amberoneai.com");
    assert.deepEqual(v.hqMoney, {
      pendingPaymentUsd: 0,
      verifiedPaidRevenueUsd: 0,
      netProfitUsd: 0,
      jobsWon: 0,
      activeJobs: 0,
    });
  });

  it("surfaces general owner-action steps (e.g. a Dealwork claim link) — not just the government/grants lane", () => {
    // Before this, snapshot.ownerSteps arrived from HQ intact but nothing
    // read it back out, so a real actionable step like "claim your Dealwork
    // payout method" never appeared on the Relo page even though the fetch
    // itself worked and the government-only emp.ownerActions did show up.
    const v = summarizeHqEarningsJson(
      {
        ok: true,
        snapshot: {
          jobs: [],
          ownerSteps: [
            {
              platform: "Dealwork",
              whatINeedToDo: "Visit the claim link to attach a real payout method.",
              whereToClick: "https://dealwork.ai/dashboard/agents/claim/abc123",
              whyRequired: "Dealwork requires owner identity/payout verification before releasing funds.",
            },
          ],
        },
      },
      "https://hq.amberoneai.com",
    );
    assert.equal(v.hqOwnerSteps.length, 1);
    assert.equal(v.hqOwnerSteps[0].platform, "Dealwork");
    assert.equal(v.hqOwnerSteps[0].whereToClick, "https://dealwork.ai/dashboard/agents/claim/abc123");
  });

  it("defaults hqOwnerSteps to an empty array when the snapshot has none", () => {
    const v = summarizeHqEarningsJson({ ok: true, snapshot: { jobs: [] } }, "https://hq.amberoneai.com");
    assert.deepEqual(v.hqOwnerSteps, []);
  });

  it("surfaces the combined economic state -- Amber's earned capital, distinct from HQ's marketplace-only hqMoney", () => {
    // A real ebook sale (Standard Earning Source Interface) plus a real
    // marketplace payout, combined by HQ's own snapshot.ts -- this page just
    // has to read the numbers through, not recompute them.
    const v = summarizeHqEarningsJson(
      {
        ok: true,
        snapshot: {
          jobs: [],
          metrics: {
            pendingPaymentUsd: 0,
            verifiedPaidRevenueUsd: 0,
            netProfitUsd: 0,
            jobsWon: 0,
            activeJobs: 0,
            grossRevenueUsd: 14.99,
            costBreakdown: { ai_model: 0.5, api: 0, marketplace_fee: 0, infra: 0, payment_processing: 0.44, other: 0 },
            earnedCapitalUsd: 14.05,
            reservedCapitalUsd: 0,
            growthCapitalUsd: 0,
            lifetimeRevenueUsd: 14.99,
            lifetimeNetProfitUsd: 14.05,
            firstRealDollarAt: "2026-09-08T00:00:00.000Z",
            economicState: "SURVIVING",
          },
        },
      },
      "https://hq.amberoneai.com",
    );
    assert.equal(v.hqEconomics.earnedCapitalUsd, 14.05);
    assert.equal(v.hqEconomics.grossRevenueUsd, 14.99);
    assert.equal(v.hqEconomics.firstRealDollarAt, "2026-09-08T00:00:00.000Z");
    assert.equal(v.hqEconomics.economicState, "SURVIVING");
    assert.equal(v.hqEconomics.costBreakdown.ai_model, 0.5);
  });

  it("defaults hqEconomics to $0/STARTING when snapshot metrics are missing -- never fabricates a number", () => {
    const v = summarizeHqEarningsJson({ ok: true, snapshot: { jobs: [] } }, "https://hq.amberoneai.com");
    assert.equal(v.hqEconomics.earnedCapitalUsd, 0);
    assert.equal(v.hqEconomics.firstRealDollarAt, null);
    assert.equal(v.hqEconomics.economicState, "STARTING");
    assert.deepEqual(v.hqEconomics.costBreakdown, {});
  });

  it("falls back to STARTING for an economicState value it doesn't recognize, rather than passing it through blindly", () => {
    const v = summarizeHqEarningsJson(
      { ok: true, snapshot: { jobs: [], metrics: { economicState: "NOT_A_REAL_STATE" } } },
      "https://hq.amberoneai.com",
    );
    assert.equal(v.hqEconomics.economicState, "STARTING");
  });
});
