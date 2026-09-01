import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { moltJobReject, type MoltJob } from "./moltjobs";
import { moltCanComplete } from "./policy";
import { evaluateProfit, MOLTJOBS_PLATFORM_FEE_RATE } from "./profit";
import { DEFAULT_LIMITS } from "./types";

function job(partial: Partial<MoltJob>): MoltJob {
  return {
    id: "job_1",
    title: "Extract structured fields from a CSV spec",
    budgetUsd: 12,
    description: "Parse the attached CSV layout and return JSON fields with validation notes.",
    customer: "Acme",
    status: "OPEN",
    vertical: "CODE_DEV",
    requiredCertification: "",
    ...partial,
  };
}

describe("moltjobs gates", () => {
  it("rejects social posting and sub-$5 payouts, not every listing", () => {
    assert.equal(moltJobReject(job({})) , null);
    assert.equal(moltJobReject(job({ budgetUsd: 2 }))?.category, "poor_profitability");
    assert.equal(
      moltJobReject(job({ title: "Public post with tracked link", description: "Need 50 followers" }))
        ?.category,
      "capability_mismatch",
    );
  });

  it("allows bounded software/research briefs", () => {
    const cap = moltCanComplete({
      title: "Write a Python script to normalize dates",
      description: "Input ISO timestamps, output UTC. Include tests.",
    });
    assert.equal(cap.ok, true);
  });

  it("applies the 5% MoltJobs fee in profit", () => {
    const profit = evaluateProfit({
      payoutUsd: 12,
      feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
      estimatedComputeUsd: 1.5,
      successProbability: 0.45,
      limits: DEFAULT_LIMITS,
      remainingDailySpendUsd: 15,
    });
    assert.equal(profit.marketplaceFeeUsd, 0.6);
    assert.equal(profit.accept, true);
  });

  it("accepts $5 floor payouts when net after fee+compute stays positive", () => {
    const profit = evaluateProfit({
      payoutUsd: 5,
      feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
      estimatedComputeUsd: 3.5,
      successProbability: 0.55,
      limits: DEFAULT_LIMITS,
      remainingDailySpendUsd: 15,
    });
    assert.equal(profit.expectedNetUsd, 1.25);
    assert.equal(profit.accept, true);
  });

  it("still rejects sub-$5 payouts via profit floor", () => {
    const profit = evaluateProfit({
      payoutUsd: 4,
      feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
      estimatedComputeUsd: 1,
      successProbability: 0.55,
      limits: DEFAULT_LIMITS,
      remainingDailySpendUsd: 15,
    });
    assert.equal(profit.accept, false);
    assert.match(profit.reasons.join(" "), /Payout \$4 is below minimum \$5/);
  });
});
