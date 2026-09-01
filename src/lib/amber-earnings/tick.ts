import { moltCanComplete, sporeCanComplete, taskBountyCanComplete, workProtocolCanComplete } from "./policy";
import {
  evaluateProfit,
  MOLTJOBS_PLATFORM_FEE_RATE,
  TASKBOUNTY_PLATFORM_FEE_RATE,
  WORKPROTOCOL_PLATFORM_FEE_RATE,
} from "./profit";
import { buildSnapshot } from "./snapshot";
import { listOpenSporeTasks, sporeDeliverRouteLive, sporeHealth } from "./sporeagent";
import { ensureSporeAgent, runSkillFitPipelines } from "./pipeline";
import {
  activeCount,
  isMarketplaceRunnable,
  listEarningsUserIds,
  loadRecord,
  remainingDailySpend,
  rollDailySpend,
  saveRecord,
  upsertJob,
  type EarningsRecord,
} from "./store";
import { listOpenBounties, payoutUsdFromListing, pollDeviceLogin, verifyTaskBountyKey } from "./taskbounty";
import type { EarningsJob, OwnerStep } from "./types";
import {
  heartbeatMoltAgent,
  listOpenMoltJobs,
  moltJobReject,
  placeMoltBid,
  verifyMoltJobsKey,
} from "./moltjobs";
import {
  claimWorkProtocolJob,
  listOpenWorkProtocolJobs,
  registerWorkProtocolAgent,
  workProtocolJobReject,
} from "./workprotocol";
import { encodeWpAcceptance, newArtifactToken } from "./artifacts";
import { executeSkillFitWork } from "./execute-work";
import { advanceInFlightJobs } from "./advance-jobs";
import { blocksNewAccepts, listJobs, openApproval, seedPlatforms, updatePlatform, upsertJobRow } from "./persist";

function jobId(marketplace: string, externalId: string) {
  return `${marketplace}:${externalId}`;
}

function ownerStepsFor(rec: EarningsRecord): OwnerStep[] {
  const steps: OwnerStep[] = [];
  if (!rec.taskbountyApiKey) {
    steps.push({
      platform: "TaskBounty",
      whatINeedToDo:
        "Click Connect TaskBounty, then approve the code in your already-signed-in TaskBounty Google account. Do not paste your Google password here.",
      whereToClick: rec.state.deviceAuth?.verificationUriComplete
        ? rec.state.deviceAuth.verificationUriComplete
        : "https://www.task-bounty.com/link",
      whyRequired: "Mints a scoped tb_live_ key so Amber can claim and submit work.",
    });
  } else {
    steps.push({
      platform: "TaskBounty payout",
      whatINeedToDo:
        "If you want USD bank deposits, finish payout onboarding in the TaskBounty dashboard. Crypto payouts can use a public address only (USDC/ETH/BTC). Never paste banking login or private keys here.",
      whereToClick: "https://www.task-bounty.com/dashboard/settings",
      whyRequired: "Platforms hold funds until a payout method exists.",
    });
  }
  if (!rec.sporeAgentId) {
    steps.push({
      platform: "SporeAgent",
      whatINeedToDo: "Nothing required — Amber auto-registers a Spore agent on the next execution tick when missing.",
      whereToClick: "https://sporeagent.com/",
      whyRequired: "Agent id is needed to place bids; Amber creates one automatically.",
    });
  }
  if (!rec.moltjobsApiKey) {
    steps.push({
      platform: "MoltJobs",
      whatINeedToDo: "Paste your mj_live_ API key in Amber Earnings (MoltJobs platform) or Amber Vault → MOLTJOBS_API_KEY.",
      whereToClick: "https://hq.amberoneai.com/dashboard/vault?focus=moltjobs",
      whyRequired: "Bids use the mj_live_ key. Bank/card passwords and wallet private keys stay off this dashboard.",
    });
  }
  if (!rec.workprotocolApiKey || !rec.workprotocolAgentId) {
    steps.push({
      platform: "WorkProtocol",
      whatINeedToDo: "Nothing required — Amber auto-registers a WorkProtocol agent on the next scan (API key is shown once and stored).",
      whereToClick: "https://workprotocol.ai/",
      whyRequired: "Agent id + wp_agent_ key are required to claim and deliver.",
    });
  }
  return steps;
}

export async function runEarningsTick(userId: string): Promise<EarningsRecord> {
  await seedPlatforms(userId);
  let rec = await loadRecord(userId);
  rec.state = rollDailySpend(rec.state);
  const notes: string[] = [];
  const remaining = remainingDailySpend(rec.state);
  const sporePaused = rec.state.pausedAll || rec.state.marketplaces.sporeagent.paused;

  if (rec.deviceCode) {
    const poll = await pollDeviceLogin(rec.deviceCode);
    if (poll.accessToken) {
      rec.taskbountyApiKey = poll.accessToken;
      rec.deviceCode = null;
      rec.state.deviceAuth = null;
      notes.push("TaskBounty browser approval captured.");
    } else if (!poll.pending) {
      notes.push(`TaskBounty device poll: ${poll.detail}`);
    } else {
      notes.push("TaskBounty device login still waiting for browser approval.");
    }
  }

  if (rec.taskbountyApiKey) {
    const verified = await verifyTaskBountyKey(rec.taskbountyApiKey);
    rec.state.connections.taskbounty = {
      ok: verified.ok,
      detail: verified.detail,
      hasApiKey: true,
    };
    notes.push(verified.detail);
  }

  const tbBoard = await listOpenBounties();
  if (!rec.taskbountyApiKey) {
    rec.state.connections.taskbounty = {
      ok: tbBoard.ok,
      detail: `${tbBoard.detail} Not connected — use Connect TaskBounty.`,
      hasApiKey: false,
    };
  } else {
    rec.state.connections.taskbounty.detail = `${rec.state.connections.taskbounty.detail} ${tbBoard.detail}`;
  }
  notes.push(`TaskBounty board: ${tbBoard.detail}`);

  const health = await sporeHealth();
  const sporeBoard = await listOpenSporeTasks();
  if (!sporePaused && !rec.sporeAgentId && health.ok) {
    const ensured = await ensureSporeAgent(rec);
    rec = ensured.rec;
    notes.push(...ensured.notes);
  }
  rec.state.connections.sporeagent = {
    ok: health.ok,
    detail: rec.sporeAgentId
      ? `${health.detail}. ${sporeBoard.detail} Agent id on file.`
      : `${health.detail}. ${sporeBoard.detail} Amber will auto-register a Spore agent on the next runnable tick.`,
    agentId: rec.sporeAgentId,
  };
  notes.push(`SporeAgent: ${rec.state.connections.sporeagent.detail}`);

  if (rec.state.pausedAll) {
    notes.push("Pause All is on — discovery continues, no bids/claims.");
  }

  for (const item of tbBoard.items) {
    const externalId = String(item.id || item.task_id || item.title || "").slice(0, 80);
    if (!externalId) continue;
    const capability = taskBountyCanComplete({
      language: item.language,
      title: item.title || "",
      complexity: item.complexity_tag,
    });
    const profit = evaluateProfit({
      payoutUsd: payoutUsdFromListing(item),
      feeRate: TASKBOUNTY_PLATFORM_FEE_RATE,
      estimatedComputeUsd: capability.computeUsd,
      successProbability: capability.successProbability,
      limits: rec.state.limits,
      remainingDailySpendUsd: remaining,
      extraReasons: capability.ok ? [] : capability.reasons,
    });
    const paused = rec.state.pausedAll || !isMarketplaceRunnable(rec.state, "taskbounty");
    let status: EarningsJob["status"] = "evaluated";
    let notesJob =
      "Evaluated. TaskBounty pays only after sandbox-verified tests plus a regression test. No fabricated PR.";
    if (!profit.accept) {
      status = "rejected";
      notesJob = profit.reasons.join(" ");
    } else if (paused || !rec.taskbountyApiKey) {
      status = "evaluated";
      notesJob = paused
        ? "Profit gate passed; marketplace paused — no claim."
        : "Profit gate passed; waiting for TaskBounty connection.";
    } else if (activeCount(rec.state) >= rec.state.limits.maxConcurrentJobs) {
      status = "evaluated";
      notesJob = "Profit gate passed; at max concurrent jobs.";
    } else {
      status = "evaluated";
      notesJob =
        "Profit gate passed. Amber will claim/submit only after a real patch with a passing regression test exists.";
    }
    rec.state = upsertJob(rec.state, {
      id: jobId("taskbounty", externalId),
      marketplace: "taskbounty",
      externalId,
      title: item.title || "Untitled bounty",
      description: item.description || item.github_issue_url || "",
      payoutUsd: profit.payoutUsd,
      status,
      profit,
      rejectionReasons: profit.accept ? undefined : profit.reasons,
      notes: notesJob,
      updatedAt: new Date().toISOString(),
    });
    await upsertJobRow({
      userId,
      platformSlug: "taskbounty",
      externalId,
      title: item.title || "Untitled bounty",
      description: item.description || item.github_issue_url || "",
      payoutUsd: profit.payoutUsd,
      estimatedCostUsd: profit.estimatedComputeUsd,
      expectedProfitUsd: profit.expectedNetUsd,
      status: status === "rejected" ? "rejected" : "evaluating",
      workNotes: notesJob,
      rejectReason: status === "rejected" ? notesJob : "",
      rejectCategory: status === "rejected" ? "poor_profitability" : "",
      logLine: notesJob,
    });
  }

  const sporeSubmit = await sporeDeliverRouteLive();
  notes.push(`Spore submit probe: ${sporeSubmit.live ? "marketplace submit available" : "marketplace submit not offered yet"}`);

  // Spore new accepts stay off while hosted /deliver is missing. MoltJobs is only
  // frozen by real in-flight Molt (or other) work — not by Spore's platform gap.
  const preAdvance = await advanceInFlightJobs(userId, rec);
  notes.push(...preAdvance.notes);
  rec = await loadRecord(userId);

  const allowNewSporeBids = !sporePaused && sporeSubmit.live && !preAdvance.blockedNewAccepts;
  if (allowNewSporeBids) {
    const pipe = await runSkillFitPipelines(userId, rec, { spore: true, molt: false });
    rec = pipe.rec;
    notes.push(...pipe.notes);
    for (const p of pipe.proofs) {
      notes.push(
        `Pipeline ${p.platform}:${p.id} → ${p.status} (${p.proof.map((s) => s.step + (s.ok ? "+" : "-")).join(",")})`,
      );
    }
  } else {
    if (!sporeSubmit.live) {
      notes.push("New Spore bids paused until marketplace submit exists. In-flight work stays queued. Not paid.");
    }
    for (const task of sporeBoard.tasks) {
      const capability = sporeCanComplete({
        title: task.title,
        description: task.description || "",
        requirements: task.requirements || [],
      });
      notes.push(
        `Spore evaluated (no new bid) ${task.title}: ${capability.ok ? capability.category : capability.reasons[0] || "blocked"}`,
      );
    }
  }

  if (!tbBoard.items.length) {
    notes.push("TaskBounty open board is empty — worker is live and will retry next tick.");
  }

  const molt = await listOpenMoltJobs();
  notes.push(`MoltJobs: ${molt.detail}`);
  let moltAttention = rec.moltjobsApiKey
    ? "Agent @amber connected. Wallet is on-platform USDC (public address only)."
    : "API key + USDC payout address require Mike";
  const moltPaused = rec.state.pausedAll;
  let moltBids = 0;
  // Capacity = true in-flight work only (ASSIGNED/IN_PROGRESS/QA). Jobs waiting for
  // poster assignment do not consume the concurrent slot and must not freeze bidding.
  const existingJobs = await listJobs(userId);
  const blockingInFlight = existingJobs.filter((j) => blocksNewAccepts(j.status, j)).length;
  const moltBidRoom = Math.max(0, rec.state.limits.maxConcurrentJobs - blockingInFlight);
  if (blockingInFlight > 0) {
    notes.push(
      `MoltJobs capacity: ${blockingInFlight} active job(s) count toward max ${rec.state.limits.maxConcurrentJobs}; room for ${moltBidRoom} new bid(s). Waiting-for-assignment does not freeze bidding.`,
    );
  }
  let moltAgentId: string | null = null;
  if (rec.moltjobsApiKey) {
    const verified = await verifyMoltJobsKey(rec.moltjobsApiKey);
    notes.push(verified.detail);
    moltAgentId = verified.agentId;
    if (verified.agentId) await heartbeatMoltAgent(rec.moltjobsApiKey, verified.agentId);
  }
  for (const job of molt.jobs) {
    const hard = moltJobReject(job);
    if (hard) {
      await upsertJobRow({
        userId,
        platformSlug: "moltjobs",
        externalId: job.id,
        title: job.title,
        customer: job.customer,
        description: job.description,
        payoutUsd: job.budgetUsd,
        status: "rejected",
        rejectReason: hard.reason,
        rejectCategory: hard.category,
        logLine: hard.reason,
        paymentStatus: "unverified",
      });
      continue;
    }
    const capability = moltCanComplete({ title: job.title, description: job.description });
    const profit = evaluateProfit({
      payoutUsd: job.budgetUsd,
      feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
      estimatedComputeUsd: capability.computeUsd,
      successProbability: capability.successProbability,
      limits: rec.state.limits,
      remainingDailySpendUsd: remaining,
      extraReasons: capability.ok ? [] : capability.reasons,
    });
    if (!capability.ok || !profit.accept || moltPaused || moltBids >= moltBidRoom) {
      const reason = moltPaused
        ? "Pause All is on — discovery continues, no bids."
        : moltBids >= moltBidRoom
          ? moltBidRoom <= 0
            ? `At max concurrent active jobs (${rec.state.limits.maxConcurrentJobs}).`
            : "At max concurrent jobs for this tick."
          : (profit.reasons || capability.reasons).join(" ") || "Did not pass profit/capability gates.";
      // Soft skips stay "evaluating" — never "rejected"/BLOCKED — so open eligible
      // listings keep showing CAN BID when capability still passes.
      const softSkip = capability.ok && (moltPaused || moltBids >= moltBidRoom || !profit.accept);
      await upsertJobRow({
        userId,
        platformSlug: "moltjobs",
        externalId: job.id,
        title: job.title,
        customer: job.customer,
        description: job.description,
        payoutUsd: job.budgetUsd,
        estimatedCostUsd: profit.estimatedComputeUsd,
        expectedProfitUsd: profit.expectedNetUsd,
        status: softSkip ? "evaluating" : "rejected",
        rejectReason: softSkip ? "" : reason,
        rejectCategory: softSkip ? "" : capability.ok ? "poor_profitability" : "capability_mismatch",
        logLine: reason,
        paymentStatus: "unverified",
      });
      continue;
    }
    if (!rec.moltjobsApiKey) continue;
    const bid = await placeMoltBid(rec.moltjobsApiKey, job, moltAgentId);
    notes.push(`MoltJobs ${job.id}: ${bid.detail}`);
    if (bid.needsCert) {
      moltAttention =
        "Bids are gated until General Fundamentals certification on MoltJobs (on-platform $5). Amber will not charge a card.";
      await upsertJobRow({
        userId,
        platformSlug: "moltjobs",
        externalId: job.id,
        title: job.title,
        customer: job.customer,
        description: job.description,
        payoutUsd: job.budgetUsd,
        status: "rejected",
        rejectReason: bid.detail,
        rejectCategory: "owner_approval_needed",
        logLine: bid.detail,
        paymentStatus: "unverified",
      });
      break;
    }
    if (!bid.ok) {
      await upsertJobRow({
        userId,
        platformSlug: "moltjobs",
        externalId: job.id,
        title: job.title,
        customer: job.customer,
        description: job.description,
        payoutUsd: job.budgetUsd,
        status: "evaluating",
        rejectReason: "",
        rejectCategory: "",
        logLine: bid.detail,
        paymentStatus: "unverified",
      });
      continue;
    }
    moltBids += 1;
    const work = executeSkillFitWork({ title: job.title, description: job.description });
    await upsertJobRow({
      userId,
      platformSlug: "moltjobs",
      externalId: job.id,
      title: job.title,
      customer: job.customer,
      description: job.description,
      payoutUsd: job.budgetUsd,
      estimatedCostUsd: profit.estimatedComputeUsd,
      expectedProfitUsd: profit.expectedNetUsd,
      status: work.ok ? "accepted" : "failed",
      worker: "amber",
      workNotes: work.ok ? `${bid.detail} | ${work.approach}` : `${bid.detail} | execute blocked: ${work.testsNotes}`,
      testsNotes: work.testsNotes,
      submission: work.ok ? work.deliverable.slice(0, 12000) : "",
      acceptance: work.ok
        ? "platform=OPEN waiting for poster to assign bid"
        : "",
      logLine: work.ok ? `${bid.detail} — deliverable ready; start/submit waits for ASSIGNED.` : work.testsNotes,
      paymentStatus: "unverified",
    });
  }

  // WorkProtocol — auto-register if needed, then claim → perform (deliver in advance).
  if (!rec.state.pausedAll && (!rec.workprotocolApiKey || !rec.workprotocolAgentId)) {
    const reg = await registerWorkProtocolAgent({ name: "Amber" });
    notes.push(`WorkProtocol register: ${reg.detail}`);
    if (reg.ok && reg.apiKey && reg.agentId) {
      rec.workprotocolApiKey = reg.apiKey;
      rec.workprotocolAgentId = reg.agentId;
      // Persist immediately — API key is shown only once.
      await saveRecord(userId, rec);
    }
  }

  const wp = await listOpenWorkProtocolJobs();
  notes.push(`WorkProtocol: ${wp.detail}`);
  let wpAttention = rec.workprotocolApiKey && rec.workprotocolAgentId
    ? "Agent registered. Claims ≥$5 skill-fit open jobs; deliver uses a public artifact URL."
    : "Amber will auto-register a WorkProtocol agent on the next runnable tick.";
  const wpPaused = rec.state.pausedAll;
  let wpClaims = 0;
  const wpJobsAfterMolt = await listJobs(userId);
  const wpBlocking = wpJobsAfterMolt.filter((j) => blocksNewAccepts(j.status, j)).length;
  const wpClaimRoom = Math.max(0, rec.state.limits.maxConcurrentJobs - wpBlocking);

  for (const job of wp.jobs) {
    const hard = workProtocolJobReject(job);
    if (hard) {
      await upsertJobRow({
        userId,
        platformSlug: "workprotocol",
        externalId: job.id,
        title: job.title,
        description: job.description,
        payoutUsd: job.paymentUsd,
        status: "rejected",
        rejectReason: hard.reason,
        rejectCategory: hard.category,
        logLine: hard.reason,
        paymentStatus: "unverified",
      });
      continue;
    }
    const capability = workProtocolCanComplete({ title: job.title, description: job.description });
    const profit = evaluateProfit({
      payoutUsd: job.paymentUsd,
      feeRate: WORKPROTOCOL_PLATFORM_FEE_RATE,
      estimatedComputeUsd: capability.computeUsd,
      successProbability: capability.successProbability,
      limits: rec.state.limits,
      remainingDailySpendUsd: remaining,
      extraReasons: capability.ok ? [] : capability.reasons,
    });
    if (!capability.ok || !profit.accept || wpPaused || wpClaims >= wpClaimRoom) {
      const reason = wpPaused
        ? "Pause All is on — discovery continues, no claims."
        : wpClaims >= wpClaimRoom
          ? wpClaimRoom <= 0
            ? `At max concurrent active jobs (${rec.state.limits.maxConcurrentJobs}).`
            : "At max concurrent jobs for this tick."
          : (profit.reasons || capability.reasons).join(" ") || "Did not pass profit/capability gates.";
      const softSkip = capability.ok && (wpPaused || wpClaims >= wpClaimRoom || !profit.accept);
      await upsertJobRow({
        userId,
        platformSlug: "workprotocol",
        externalId: job.id,
        title: job.title,
        description: job.description,
        payoutUsd: job.paymentUsd,
        estimatedCostUsd: profit.estimatedComputeUsd,
        expectedProfitUsd: profit.expectedNetUsd,
        status: softSkip ? "evaluating" : "rejected",
        rejectReason: softSkip ? "" : reason,
        rejectCategory: softSkip ? "" : capability.ok ? "poor_profitability" : "capability_mismatch",
        logLine: reason,
        paymentStatus: "unverified",
      });
      continue;
    }
    if (!rec.workprotocolApiKey || !rec.workprotocolAgentId) continue;
    const claim = await claimWorkProtocolJob(rec.workprotocolApiKey, rec.workprotocolAgentId, job.id);
    notes.push(`WorkProtocol ${job.id}: ${claim.detail}`);
    if (!claim.ok || !claim.claimId) {
      await upsertJobRow({
        userId,
        platformSlug: "workprotocol",
        externalId: job.id,
        title: job.title,
        description: job.description,
        payoutUsd: job.paymentUsd,
        status: "evaluating",
        rejectReason: "",
        rejectCategory: "",
        logLine: claim.detail,
        paymentStatus: "unverified",
      });
      continue;
    }
    wpClaims += 1;
    const work = executeSkillFitWork({ title: job.title, description: job.description });
    const token = newArtifactToken();
    const acceptance = encodeWpAcceptance(claim.claimId, token);
    await upsertJobRow({
      userId,
      platformSlug: "workprotocol",
      externalId: job.id,
      title: job.title,
      description: job.description,
      payoutUsd: job.paymentUsd,
      estimatedCostUsd: profit.estimatedComputeUsd,
      expectedProfitUsd: profit.expectedNetUsd,
      status: work.ok ? "accepted" : "failed",
      worker: "amber",
      workNotes: work.ok ? `${claim.detail} | ${work.approach}` : `${claim.detail} | execute blocked: ${work.testsNotes}`,
      testsNotes: work.testsNotes,
      submission: work.ok ? work.deliverable.slice(0, 12000) : "",
      acceptance,
      logLine: work.ok
        ? `${claim.detail} — deliverable ready; advance will POST /deliver with public artifact URL.`
        : work.testsNotes,
      paymentStatus: "unverified",
    });
  }

  const postAdvance = await advanceInFlightJobs(userId, rec);
  notes.push(...postAdvance.notes);

  const now = new Date().toISOString();
  const tbPaused = rec.state.pausedAll || rec.state.marketplaces.taskbounty.paused;

  // Platform "error" is reserved for broken marketplace/API health — never for
  // "Mike hasn't pasted credentials yet" (that is needs_mike). The command
  // center treats any error row as AMBER STATUS = ERROR.
  const sporeApiDown = !health.ok || !sporeBoard.ok;
  let sporeStatus: "connected" | "paused" | "needs_mike" | "error" = "needs_mike";
  if (sporeApiDown) sporeStatus = "error";
  else if (rec.sporeAgentId) sporeStatus = sporePaused ? "paused" : "connected";
  else if (!sporePaused) sporeStatus = "needs_mike";

  const tbBoardDown = !tbBoard.ok;
  let tbStatus: "connected" | "paused" | "needs_mike" | "error" = "needs_mike";
  if (tbBoardDown && !rec.taskbountyApiKey) tbStatus = "error";
  else if (rec.taskbountyApiKey) tbStatus = tbPaused ? "paused" : "connected";

  const moltBoardDown = !molt.ok;
  let moltStatus: "connected" | "paused" | "needs_mike" | "error" = "needs_mike";
  if (moltBoardDown && !rec.moltjobsApiKey) moltStatus = "error";
  else if (rec.moltjobsApiKey) moltStatus = moltPaused ? "paused" : "connected";

  const wpConnected = Boolean(rec.workprotocolApiKey && rec.workprotocolAgentId);
  const wpBoardDown = !wp.ok;
  let wpStatus: "connected" | "paused" | "needs_mike" | "error" = "needs_mike";
  if (wpBoardDown && !wpConnected) wpStatus = "error";
  else if (wpConnected) wpStatus = wpPaused ? "paused" : "connected";

  await updatePlatform(userId, "taskbounty", {
    status: tbStatus,
    connected: Boolean(rec.taskbountyApiKey),
    availableJobs: tbBoard.items.length,
    attention: rec.taskbountyApiKey
      ? tbBoardDown
        ? `Connected, but board scan failed: ${tbBoard.detail}`
        : ""
      : tbBoardDown
        ? `TaskBounty board unreachable: ${tbBoard.detail}`
        : "Connect TaskBounty in Amber Earnings",
    lastScanAt: now,
    paused: tbPaused,
  });
  await updatePlatform(userId, "sporeagent", {
    status: sporeStatus,
    connected: Boolean(rec.sporeAgentId),
    availableJobs: sporeBoard.tasks.length,
    attention: sporeApiDown
      ? `SporeAgent API issue: ${health.detail}. ${sporeBoard.detail}`
      : rec.sporeAgentId
        ? sporeSubmit.live
          ? "Bids live; Amber submits when hosted submit exists."
          : "Queued work held. New Spore bids off until marketplace submit exists."
        : "Amber auto-registers a Spore agent on the next runnable tick.",
    lastScanAt: now,
    paused: sporePaused,
  });
  await updatePlatform(userId, "moltjobs", {
    status: moltStatus,
    connected: Boolean(rec.moltjobsApiKey),
    availableJobs: molt.jobs.length,
    attention: moltBoardDown && !rec.moltjobsApiKey
      ? `MoltJobs board unreachable: ${molt.detail}`
      : moltAttention,
    lastScanAt: now,
    paused: moltPaused,
  });
  await updatePlatform(userId, "workprotocol", {
    status: wpStatus,
    connected: wpConnected,
    availableJobs: wp.jobs.length,
    attention: wpBoardDown && !wpConnected
      ? `WorkProtocol board unreachable: ${wp.detail}`
      : wpAttention,
    lastScanAt: now,
    paused: wpPaused,
  });
  await updatePlatform(userId, "reelo_services", {
    status: "connected",
    connected: true,
    availableJobs: 0,
    attention: "0 inbound paid audit/lead-gen orders",
    lastScanAt: now,
  });

  if (!rec.taskbountyApiKey) {
    await openApproval({
      userId,
      platformSlug: "taskbounty",
      title: "TaskBounty — connect existing account",
      detail: "Approve the device code in your already-signed-in TaskBounty Google account. Do not paste your Google password.",
      actionUrl: rec.state.deviceAuth?.verificationUriComplete || "https://www.task-bounty.com/link",
      kind: "connect",
    });
  } else {
    await openApproval({
      userId,
      platformSlug: "taskbounty",
      title: "TaskBounty — payout method (optional until first win)",
      detail: "Bank payouts stay on the TaskBounty dashboard. Crypto can use a public address only. Never paste bank login or private keys.",
      actionUrl: "https://www.task-bounty.com/dashboard/settings",
      kind: "bank",
    });
  }
  if (!rec.moltjobsApiKey) {
    await openApproval({
      userId,
      platformSlug: "moltjobs",
      title: "MoltJobs — paste mj_live_ API key",
      detail: "Store the key in Amber Earnings (Enter MoltJobs API key) or Amber Vault → MOLTJOBS_API_KEY. Never paste wallet private keys. USDC payout address stays on MoltJobs.",
      actionUrl: "https://hq.amberoneai.com/dashboard/vault?focus=moltjobs",
      kind: "connect",
    });
  }
  if (!rec.workprotocolApiKey || !rec.workprotocolAgentId) {
    await openApproval({
      userId,
      platformSlug: "workprotocol",
      title: "WorkProtocol — auto-register enabled",
      detail: "Amber will register a WorkProtocol agent automatically on the next scan (API key is shown once and stored). Optional: paste an existing wp_agent_ key + agent id.",
      actionUrl: "https://workprotocol.ai/",
      kind: "connect",
    });
  }
  if (!rec.sporeAgentId) {
    await openApproval({
      userId,
      platformSlug: "sporeagent",
      title: "SporeAgent — auto-register enabled",
      detail: "Amber will register a Spore agent automatically when executing skill-fit jobs. Optional: paste an existing agent id to reuse identity.",
      actionUrl: "https://sporeagent.com/",
      kind: "connect",
    });
  }

  rec.state.ownerSteps = ownerStepsFor(rec);
  rec.state.ticks += 1;
  rec.state.lastTickAt = new Date().toISOString();
  rec.state.lastTickNotes = (() => {
    const inflight = notes.filter((n) =>
      /Spore |deliver:|performed |frozen until|MoltJobs [a-z0-9-]+:|WorkProtocol [a-z0-9-]+:/i.test(n),
    );
    const rest = notes.filter((n) => !inflight.includes(n));
    return [...inflight, ...rest].slice(0, 20);
  })();
  rec.state.connections.taskbounty.hasApiKey = Boolean(rec.taskbountyApiKey);
  rec.state.connections.sporeagent.agentId = rec.sporeAgentId;
  await saveRecord(userId, rec);
  return rec;
}

export async function refreshConnections(userId: string): Promise<EarningsRecord> {
  return runEarningsTick(userId);
}

export async function runAllEarningsTicks(): Promise<{ users: number }> {
  const ids = await listEarningsUserIds();
  for (const id of ids) {
    await runEarningsTick(id);
  }
  return { users: ids.length };
}

export async function currentSnapshot(userId: string) {
  const rec = await loadRecord(userId);
  rec.state.ownerSteps = ownerStepsFor(rec);
  rec.state.connections.taskbounty.hasApiKey = Boolean(rec.taskbountyApiKey);
  rec.state.connections.sporeagent.agentId = rec.sporeAgentId;
  return buildSnapshot(rec.state);
}
