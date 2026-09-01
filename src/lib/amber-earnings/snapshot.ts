import type { EarningsJob, EarningsSnapshot, EarningsState } from "./types";

function sum(jobs: EarningsJob[], pick: (j: EarningsJob) => number) {
  return Math.round(jobs.reduce((n, j) => n + pick(j), 0) * 100) / 100;
}

export function buildSnapshot(state: EarningsState): EarningsSnapshot {
  const jobs = state.jobs;
  const completed = jobs.filter((j) => j.status === "completed" || j.status === "paid" || j.status === "won");
  const rejected = jobs.filter((j) => j.status === "rejected");
  const evaluated = jobs.filter((j) => j.status !== "available");
  const decided = completed.length + rejected.length;
  const revenue = sum(completed, (j) => j.payoutUsd);

  return {
    at: new Date().toISOString(),
    pausedAll: state.pausedAll,
    worker: {
      cloud: true,
      lastTickAt: state.lastTickAt,
      ticks: state.ticks,
      notes: state.lastTickNotes.slice(0, 12),
    },
    connections: state.connections,
    ownerSteps: state.ownerSteps,
    deviceAuth: state.deviceAuth
      ? {
          userCode: state.deviceAuth.userCode,
          verificationUri: state.deviceAuth.verificationUri,
          verificationUriComplete: state.deviceAuth.verificationUriComplete,
          expiresAt: state.deviceAuth.expiresAt,
        }
      : null,
    metrics: {
      totalRevenue: revenue,
      netProfit: revenue,
      expenses: 0,
      jobsAvailable: jobs.filter((j) => j.status === "available" || j.status === "evaluated").length,
      jobsEvaluated: evaluated.length,
      activeJobs: jobs.filter((j) => j.status === "active" || j.status === "claimed" || j.status === "queued").length,
      bidsClaims: jobs.filter((j) => j.status === "claimed").length,
      jobsWon: jobs.filter((j) => j.status === "won" || j.status === "paid").length,
      jobsCompleted: completed.length,
      jobsRejected: rejected.length,
      successRate: decided ? Math.round((completed.length / decided) * 1000) / 10 : 0,
      pendingPayouts: 0,
      paidPayouts: 0,
    },
    marketplaces: state.marketplaces,
    limits: state.limits,
    jobs,
  };
}
