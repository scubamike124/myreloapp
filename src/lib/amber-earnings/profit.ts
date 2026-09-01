import type { EarningsLimits, ProfitDecision } from "./types";

/** Official TaskBounty split: contributor 80%, platform 20%. */
export const TASKBOUNTY_PLATFORM_FEE_RATE = 0.2;

/**
 * SporeAgent docs do not publish a USD marketplace cut. Use a conservative
 * estimate so we never treat the listed budget as guaranteed net.
 */
export const SPORE_UNKNOWN_FEE_RATE = 0.1;

/** Official MoltJobs cut: 5% escrow fee, agent keeps 95%. */
export const MOLTJOBS_PLATFORM_FEE_RATE = 0.05;

/** WorkProtocol docs / marketing: ~5% platform fee, agent keeps ~95%. */
export const WORKPROTOCOL_PLATFORM_FEE_RATE = 0.05;

export function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

export function evaluateProfit(input: {
  payoutUsd: number;
  feeRate: number;
  estimatedComputeUsd: number;
  successProbability: number;
  limits: EarningsLimits;
  remainingDailySpendUsd: number;
  extraReasons?: string[];
}): ProfitDecision {
  const reasons = [...(input.extraReasons ?? [])];
  const marketplaceFeeUsd = roundUsd(Math.max(0, input.payoutUsd) * input.feeRate);
  const estimatedComputeUsd = roundUsd(Math.max(0, input.estimatedComputeUsd));
  const expectedNetUsd = roundUsd(input.payoutUsd - marketplaceFeeUsd - estimatedComputeUsd);
  const p = Math.min(1, Math.max(0, input.successProbability));
  const expectedValueUsd = roundUsd(expectedNetUsd * p);

  if (!(input.payoutUsd > 0)) reasons.push("Payout is zero or unknown.");
  if (input.payoutUsd < input.limits.minExpectedNetUsd) {
    reasons.push(
      `Payout $${roundUsd(input.payoutUsd)} is below minimum $${input.limits.minExpectedNetUsd}.`,
    );
  }
  if (estimatedComputeUsd > input.limits.perJobSpendUsd) {
    reasons.push(
      `Estimated compute $${estimatedComputeUsd} exceeds per-job cap $${input.limits.perJobSpendUsd}.`,
    );
  }
  if (estimatedComputeUsd > input.remainingDailySpendUsd) {
    reasons.push("Would exceed today's AI/compute spending limit.");
  }
  // minExpectedNetUsd is a listing payout floor (same dollars as MoltJobs hard reject),
  // not a second floor on net-after-compute — otherwise every $5 OPEN job fails (fee + compute).
  if (expectedNetUsd <= 0) {
    reasons.push(`Expected net $${expectedNetUsd} after fees and compute is not positive.`);
  }
  if (p < input.limits.minSuccessProbability) {
    reasons.push(
      `Success probability ${(p * 100).toFixed(0)}% is below ${(input.limits.minSuccessProbability * 100).toFixed(0)}%.`,
    );
  }
  if (expectedValueUsd <= 0) reasons.push("Expected value is not positive after fees and risk.");

  return {
    payoutUsd: roundUsd(input.payoutUsd),
    marketplaceFeeUsd,
    estimatedComputeUsd,
    expectedNetUsd,
    successProbability: p,
    expectedValueUsd,
    accept: reasons.length === 0 && expectedValueUsd > 0,
    reasons,
  };
}
