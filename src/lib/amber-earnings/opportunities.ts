/**
 * Live opportunity cards — built from real board APIs + persisted job rows.
 * Never fabricates titles, payouts, deadlines, or skills when the source omits them.
 */
import { listOpenMoltJobs, moltJobReject } from "./moltjobs";
import { listOpenWorkProtocolJobs, workProtocolJobReject } from "./workprotocol";
import { listOpenSporeTasks, sporeDeliverRouteLive } from "./sporeagent";
import { listOpenBounties, payoutUsdFromListing } from "./taskbounty";
import { listJobs } from "./persist";
import { loadRecord } from "./store";
import { moltCanComplete, workProtocolCanComplete } from "./policy";
import {
  assessMoltCapability,
  assessSporeCapability,
  assessTaskBountyCapability,
  assessWorkProtocolCapability,
  opportunityStatusFrom,
  type CapabilityCheck,
  type IntegrationMode,
} from "./execution-capability";
import {
  evaluateProfit,
  MOLTJOBS_PLATFORM_FEE_RATE,
  SPORE_UNKNOWN_FEE_RATE,
  TASKBOUNTY_PLATFORM_FEE_RATE,
  WORKPROTOCOL_PLATFORM_FEE_RATE,
} from "./profit";

export type OpportunityDetail = {
  id: string;
  platformSlug: string;
  platformName: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceLabel: string;
  compensationUsd: number | null;
  estimatedExpensesUsd: number | null;
  estimatedNetUsd: number | null;
  deadline: string | null;
  requirements: string[];
  skillsRequired: string[];
  amberMeetsRequirements: boolean | null;
  accountRequired: boolean;
  connectionStatus: IntegrationMode;
  canAcceptAutonomously: boolean;
  canPerform: boolean;
  canSubmit: boolean;
  canTrackPayment: boolean;
  whyCanPerform: string;
  whyCannot: string;
  primaryBlocker: string;
  workCategory: string;
  missingCapabilities: string[];
  missingInputs: string[];
  pipelineBlockers: string[];
  discoveredAt: string;
  lastVerifiedAt: string;
  expiredOrGone: boolean;
  capability: CapabilityCheck;
  jobStatus: string | null;
};

function sourceFor(slug: string, externalId: string, extra?: string): { url: string; label: string } {
  if (slug === "taskbounty") {
    return {
      url: extra || `https://www.task-bounty.com/`,
      label: extra ? "TaskBounty listing / GitHub issue" : "TaskBounty public board API",
    };
  }
  if (slug === "sporeagent") {
    return { url: `https://sporeagent.com/tasks/${encodeURIComponent(externalId)}`, label: "SporeAgent open tasks API" };
  }
  if (slug === "moltjobs") {
    return { url: `https://app.moltjobs.io/jobs/${encodeURIComponent(externalId)}`, label: "MoltJobs open jobs API" };
  }
  if (slug === "workprotocol") {
    return { url: `https://workprotocol.ai/jobs/${encodeURIComponent(externalId)}`, label: "WorkProtocol open jobs API" };
  }
  return { url: "", label: "unknown" };
}

export async function buildLiveOpportunities(userId: string): Promise<{
  opportunities: OpportunityDetail[];
  uniqueOpenCount: number;
  stillAvailableCount: number;
  capableOfCompletingCount: number;
  canAcceptCount: number;
  boardNotes: string[];
  tbBoardOk: boolean;
  sporeBoardOk: boolean;
  moltBoardOk: boolean;
  workprotocolBoardOk: boolean;
}> {
  const rec = await loadRecord(userId);
  const jobs = await listJobs(userId);
  const jobByKey = new Map(jobs.map((j) => [`${j.platformSlug}:${j.externalId}`, j]));
  const notes: string[] = [];
  const now = new Date().toISOString();
  const out = new Map<string, OpportunityDetail>();

  const tb = await listOpenBounties();
  notes.push(`TaskBounty: ${tb.detail}`);
  for (const item of tb.items) {
    const externalId = String(item.id || item.task_id || item.title || "").slice(0, 80);
    if (!externalId) continue;
    const key = `taskbounty:${externalId}`;
    const existing = jobByKey.get(key);
    const check = assessTaskBountyCapability({
      hasApiKey: Boolean(rec.taskbountyApiKey),
      boardOk: tb.ok,
      language: item.language,
      title: item.title || "",
      complexity: item.complexity_tag,
      paused: rec.state.pausedAll,
    });
    const payout = payoutUsdFromListing(item);
    const profit = evaluateProfit({
      payoutUsd: payout,
      feeRate: TASKBOUNTY_PLATFORM_FEE_RATE,
      estimatedComputeUsd: check.missing.length ? 2 : 1.25,
      successProbability: 0.3,
      limits: rec.state.limits,
      remainingDailySpendUsd: 999,
      extraReasons: [],
    });
    const src = sourceFor("taskbounty", externalId, item.github_issue_url || item.github_repo_url);
    const skills = item.language ? [item.language] : [];
    out.set(key, {
      id: key,
      platformSlug: "taskbounty",
      platformName: "TaskBounty",
      title: item.title || existing?.title || "Untitled bounty",
      description: item.description || item.github_issue_url || existing?.description || "",
      sourceUrl: src.url,
      sourceLabel: src.label,
      compensationUsd: Number.isFinite(payout) ? payout : null,
      estimatedExpensesUsd: profit.estimatedComputeUsd,
      estimatedNetUsd: profit.expectedNetUsd,
      deadline: null,
      requirements: item.complexity_tag ? [`complexity:${item.complexity_tag}`] : [],
      skillsRequired: skills,
      amberMeetsRequirements: check.canPerformAllWork,
      accountRequired: true,
      connectionStatus: opportunityStatusFrom(check, existing?.status),
      canAcceptAutonomously: check.canAcceptOrApply,
      canPerform: check.canPerformAllWork,
      canSubmit: check.canSubmit,
      canTrackPayment: check.canTrackPayment,
      whyCanPerform: check.whyCanPerform,
      whyCannot: check.whyCannot,
      primaryBlocker: check.primaryBlocker,
      workCategory: check.workCategory,
      missingCapabilities: check.missingCapabilities,
      missingInputs: check.missingInputs,
      pipelineBlockers: check.pipelineBlockers,
      discoveredAt: existing?.discoveredAt || now,
      lastVerifiedAt: now,
      expiredOrGone: false,
      capability: check,
      jobStatus: existing?.status || null,
    });
  }

  const spore = await listOpenSporeTasks();
  notes.push(`SporeAgent: ${spore.detail}`);
  const sporeSubmit = await sporeDeliverRouteLive();
  notes.push(`Spore submit: ${sporeSubmit.detail}`);
  for (const task of spore.tasks) {
    const key = `sporeagent:${task.id}`;
    const existing = jobByKey.get(key);
    const check = assessSporeCapability({
      hasAgentId: Boolean(rec.sporeAgentId),
      boardOk: spore.ok,
      title: task.title,
      description: task.description || "",
      requirements: task.requirements || [],
      submitLive: sporeSubmit.live,
    });
    const profit = evaluateProfit({
      payoutUsd: Number(task.budget_usd || 0),
      feeRate: SPORE_UNKNOWN_FEE_RATE,
      estimatedComputeUsd: 2.5,
      successProbability: 0.12,
      limits: rec.state.limits,
      remainingDailySpendUsd: 999,
      extraReasons: [],
    });
    const src = sourceFor("sporeagent", task.id);
    out.set(key, {
      id: key,
      platformSlug: "sporeagent",
      platformName: "SporeAgent",
      title: task.title,
      description: task.description || "",
      sourceUrl: src.url,
      sourceLabel: src.label,
      compensationUsd: Number(task.budget_usd || 0) || null,
      estimatedExpensesUsd: profit.estimatedComputeUsd,
      estimatedNetUsd: profit.expectedNetUsd,
      deadline: null,
      requirements: task.requirements || [],
      skillsRequired: task.requirements || [],
      amberMeetsRequirements: check.canPerformAllWork,
      accountRequired: true,
      connectionStatus: opportunityStatusFrom(check, existing?.status),
      canAcceptAutonomously: check.canAcceptOrApply,
      canPerform: check.canPerformAllWork,
      canSubmit: check.canSubmit,
      canTrackPayment: check.canTrackPayment,
      whyCanPerform: check.whyCanPerform,
      whyCannot: check.whyCannot,
      primaryBlocker: check.primaryBlocker,
      workCategory: check.workCategory,
      missingCapabilities: check.missingCapabilities,
      missingInputs: check.missingInputs,
      pipelineBlockers: check.pipelineBlockers,
      discoveredAt: existing?.discoveredAt || now,
      lastVerifiedAt: now,
      expiredOrGone: false,
      capability: check,
      jobStatus: existing?.status || null,
    });
  }

  const molt = await listOpenMoltJobs();
  notes.push(`MoltJobs: ${molt.detail}`);
  for (const job of molt.jobs) {
    const key = `moltjobs:${job.id}`;
    const existing = jobByKey.get(key);
    const hard = moltJobReject(job);
    let check = assessMoltCapability({
      hasApiKey: Boolean(rec.moltjobsApiKey),
      boardOk: molt.ok,
      title: job.title,
      description: job.description,
      paused: rec.state.pausedAll,
    });
    if (hard) {
      const missingCapabilities =
        hard.category === "capability_mismatch"
          ? [...check.missingCapabilities, hard.reason]
          : check.missingCapabilities;
      check = {
        ...check,
        canAcceptOrApply: false,
        canPerformAllWork: hard.category === "capability_mismatch" ? false : check.canPerformAllWork,
        canProduceDeliverable: hard.category === "capability_mismatch" ? false : check.canProduceDeliverable,
        readyToWork: false,
        missing: [...check.missing, hard.reason],
        missingCapabilities,
        whyCannot: `${check.whyCannot} ${hard.reason}`.trim(),
        primaryBlocker: hard.reason,
      };
    }
    const cap = moltCanComplete({ title: job.title, description: job.description });
    const profit = evaluateProfit({
      payoutUsd: job.budgetUsd,
      feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
      estimatedComputeUsd: cap.computeUsd,
      successProbability: cap.successProbability,
      limits: rec.state.limits,
      remainingDailySpendUsd: 999,
      extraReasons: [],
    });
    if (!hard && check.canAcceptOrApply && !profit.accept) {
      const reason = profit.reasons[0] || "Did not pass profit gates.";
      check = {
        ...check,
        canAcceptOrApply: false,
        readyToWork: false,
        missing: [...check.missing, reason],
        pipelineBlockers: [...check.pipelineBlockers, reason],
        whyCannot: reason,
        primaryBlocker: reason,
      };
    }
    const src = sourceFor("moltjobs", job.id);
    out.set(key, {
      id: key,
      platformSlug: "moltjobs",
      platformName: "MoltJobs",
      title: job.title,
      description: job.description,
      sourceUrl: src.url,
      sourceLabel: src.label,
      compensationUsd: job.budgetUsd,
      estimatedExpensesUsd: profit.estimatedComputeUsd,
      estimatedNetUsd: profit.expectedNetUsd,
      deadline: null,
      requirements: [],
      skillsRequired: [],
      amberMeetsRequirements: check.canPerformAllWork,
      accountRequired: true,
      connectionStatus: opportunityStatusFrom(check, existing?.status),
      canAcceptAutonomously: check.canAcceptOrApply,
      canPerform: check.canPerformAllWork,
      canSubmit: check.canSubmit,
      canTrackPayment: check.canTrackPayment,
      whyCanPerform: check.whyCanPerform,
      whyCannot: check.whyCannot,
      primaryBlocker: check.primaryBlocker,
      workCategory: check.workCategory,
      missingCapabilities: check.missingCapabilities,
      missingInputs: check.missingInputs,
      pipelineBlockers: check.pipelineBlockers,
      discoveredAt: existing?.discoveredAt || now,
      lastVerifiedAt: now,
      expiredOrGone: false,
      capability: check,
      jobStatus: existing?.status || null,
    });
  }

  const wp = await listOpenWorkProtocolJobs();
  notes.push(`WorkProtocol: ${wp.detail}`);
  for (const job of wp.jobs) {
    const key = `workprotocol:${job.id}`;
    const existing = jobByKey.get(key);
    const hard = workProtocolJobReject(job);
    let check = assessWorkProtocolCapability({
      hasApiKey: Boolean(rec.workprotocolApiKey),
      hasAgentId: Boolean(rec.workprotocolAgentId),
      boardOk: wp.ok,
      title: job.title,
      description: job.description,
      paused: rec.state.pausedAll,
    });
    if (hard) {
      const missingCapabilities =
        hard.category === "capability_mismatch"
          ? [...check.missingCapabilities, hard.reason]
          : check.missingCapabilities;
      check = {
        ...check,
        canAcceptOrApply: false,
        canPerformAllWork: hard.category === "capability_mismatch" ? false : check.canPerformAllWork,
        canProduceDeliverable: hard.category === "capability_mismatch" ? false : check.canProduceDeliverable,
        readyToWork: false,
        missing: [...check.missing, hard.reason],
        missingCapabilities,
        whyCannot: `${check.whyCannot} ${hard.reason}`.trim(),
        primaryBlocker: hard.reason,
      };
    }
    const cap = workProtocolCanComplete({ title: job.title, description: job.description });
    const profit = evaluateProfit({
      payoutUsd: job.paymentUsd,
      feeRate: WORKPROTOCOL_PLATFORM_FEE_RATE,
      estimatedComputeUsd: cap.computeUsd,
      successProbability: cap.successProbability,
      limits: rec.state.limits,
      remainingDailySpendUsd: 999,
      extraReasons: [],
    });
    if (!hard && check.canAcceptOrApply && !profit.accept) {
      const reason = profit.reasons[0] || "Did not pass profit gates.";
      check = {
        ...check,
        canAcceptOrApply: false,
        readyToWork: false,
        missing: [...check.missing, reason],
        pipelineBlockers: [...check.pipelineBlockers, reason],
        whyCannot: reason,
        primaryBlocker: reason,
      };
    }
    const src = sourceFor("workprotocol", job.id);
    out.set(key, {
      id: key,
      platformSlug: "workprotocol",
      platformName: "WorkProtocol",
      title: job.title,
      description: job.description,
      sourceUrl: src.url,
      sourceLabel: src.label,
      compensationUsd: job.paymentUsd,
      estimatedExpensesUsd: profit.estimatedComputeUsd,
      estimatedNetUsd: profit.expectedNetUsd,
      deadline: job.deadline,
      requirements: [],
      skillsRequired: job.category ? [job.category] : [],
      amberMeetsRequirements: check.canPerformAllWork,
      accountRequired: true,
      connectionStatus: opportunityStatusFrom(check, existing?.status),
      canAcceptAutonomously: check.canAcceptOrApply,
      canPerform: check.canPerformAllWork,
      canSubmit: check.canSubmit,
      canTrackPayment: check.canTrackPayment,
      whyCanPerform: check.whyCanPerform,
      whyCannot: check.whyCannot,
      primaryBlocker: check.primaryBlocker,
      workCategory: check.workCategory,
      missingCapabilities: check.missingCapabilities,
      missingInputs: check.missingInputs,
      pipelineBlockers: check.pipelineBlockers,
      discoveredAt: existing?.discoveredAt || now,
      lastVerifiedAt: now,
      expiredOrGone: false,
      capability: check,
      jobStatus: existing?.status || null,
    });
  }

  // Mark persisted jobs that no longer appear on open boards as expired/gone (do not invent replacements).
  const liveKeys = new Set(out.keys());
  for (const j of jobs) {
    if (!["taskbounty", "sporeagent", "moltjobs", "workprotocol"].includes(j.platformSlug)) continue;
    const key = `${j.platformSlug}:${j.externalId}`;
    if (liveKeys.has(key)) continue;
    if (["paid", "rejected", "failed", "stopped"].includes(j.status)) continue;
    const stubCheck: CapabilityCheck = {
      canAccess: false,
      canAcceptOrApply: false,
      canPerformAllWork: false,
      canProduceDeliverable: false,
      canSubmit: false,
      canVerifySubmission: false,
      canTrackPayment: false,
      missing: ["No longer present on the live open board at last verification."],
      missingCapabilities: [],
      missingInputs: [],
      pipelineBlockers: ["Listing disappeared or expired from the open board"],
      whyCanPerform: "",
      whyCannot: "Listing disappeared or expired from the open board.",
      primaryBlocker: "Listing disappeared or expired from the open board",
      workCategory: "expired",
      readyToWork: false,
    };
    const src = sourceFor(j.platformSlug, j.externalId);
    out.set(key, {
      id: key,
      platformSlug: j.platformSlug,
      platformName: j.platformName || j.platformSlug,
      title: j.title,
      description: j.description,
      sourceUrl: src.url,
      sourceLabel: src.label,
      compensationUsd: j.payoutUsd,
      estimatedExpensesUsd: j.estimatedCostUsd,
      estimatedNetUsd: j.expectedProfitUsd,
      deadline: null,
      requirements: [],
      skillsRequired: [],
      amberMeetsRequirements: null,
      accountRequired: true,
      connectionStatus: "BLOCKED",
      canAcceptAutonomously: false,
      canPerform: false,
      canSubmit: false,
      canTrackPayment: false,
      whyCanPerform: "",
      whyCannot: stubCheck.whyCannot,
      primaryBlocker: stubCheck.primaryBlocker,
      workCategory: stubCheck.workCategory,
      missingCapabilities: [],
      missingInputs: [],
      pipelineBlockers: stubCheck.pipelineBlockers,
      discoveredAt: j.discoveredAt,
      lastVerifiedAt: now,
      expiredOrGone: true,
      capability: stubCheck,
      jobStatus: j.status,
    });
  }

  const opportunities = [...out.values()].sort((a, b) => b.lastVerifiedAt.localeCompare(a.lastVerifiedAt));
  const openLive = opportunities.filter((o) => !o.expiredOrGone);
  return {
    opportunities,
    uniqueOpenCount: openLive.length,
    stillAvailableCount: openLive.length,
    capableOfCompletingCount: openLive.filter((o) => o.canPerform).length,
    canAcceptCount: openLive.filter((o) => o.canAcceptAutonomously).length,
    boardNotes: notes,
    tbBoardOk: tb.ok,
    sporeBoardOk: spore.ok,
    moltBoardOk: molt.ok,
    workprotocolBoardOk: wp.ok,
  };
}
