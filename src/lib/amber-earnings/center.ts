import { isSporeHostedSubmitGap, listApprovals, listJobs, listLedger, listPlatforms, seedPlatforms } from "./persist";
import { loadRecord } from "./store";
import type { ApprovalRow, EarningsCenter, JobRow, PlatformRow } from "./center-types";
import { platformProfiles } from "./execution-capability";
import { buildLiveOpportunities } from "./opportunities";
import { countReloApplied } from "./hq-nationwide";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400_000).toISOString();
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function enrichApprovals(rows: ApprovalRow[], rec: Awaited<ReturnType<typeof loadRecord>>): ApprovalRow[] {
  return rows.map((a) => {
    if (a.platformSlug === "taskbounty" && a.kind === "connect") {
      return {
        ...a,
        amberCompleted: "Scans TaskBounty public board; can start device-login flow.",
        mikeMustDo: "Approve the device code in your already-signed-in TaskBounty Google account.",
        whyRequired: "Mints a scoped tb_live_ API key so Amber can authenticate as your agent.",
        requiredOrOptional: "required",
        afterMikeCompletes: "Amber will verify the key and continue evaluating bounties. Claim/submit still waits on the execution engine.",
        unlocksUsableWorkflow: true,
      };
    }
    if (a.platformSlug === "taskbounty" && a.kind === "bank") {
      return {
        ...a,
        amberCompleted: "API connection can proceed without bank setup.",
        mikeMustDo: "Optional: finish payout onboarding on TaskBounty (bank or public crypto address only).",
        whyRequired: "Needed only when you want USD bank deposits after a win.",
        requiredOrOptional: "optional",
        afterMikeCompletes: "Payouts can settle on-platform; Amber still will not paste banking credentials.",
        unlocksUsableWorkflow: Boolean(rec.taskbountyApiKey),
      };
    }
    if (a.platformSlug === "moltjobs" && a.kind === "connect") {
      return {
        ...a,
        amberCompleted: "Reads open MoltJobs board. Bid code exists when an API key is present.",
        mikeMustDo:
          "Paste your mj_live_ API key via Amber Earnings → Enter MoltJobs API key, or Amber Vault → MOLTJOBS_API_KEY. Set a public USDC payout address on MoltJobs (not here).",
        whyRequired: "Bids require the API key; payout address is on-platform (never paste private keys here).",
        requiredOrOptional: "required",
        afterMikeCompletes: "Amber can bid, then perform, QA, submit, and track payment. USDC payout address stays on MoltJobs.",
        unlocksUsableWorkflow: true,
        actionUrl: a.actionUrl || "https://hq.amberoneai.com/dashboard/vault?focus=moltjobs",
      };
    }
    if (a.platformSlug === "workprotocol" && a.kind === "connect") {
      return {
        ...a,
        amberCompleted: "Reads open WorkProtocol board. Auto-register + claim/deliver engine is live.",
        mikeMustDo:
          "Nothing required — Amber auto-registers on the next scan. Optional: paste an existing wp_agent_ key + agent UUID to reuse identity.",
        whyRequired: "Agent id + API key (shown once at register) are required to claim and deliver.",
        requiredOrOptional: "optional",
        afterMikeCompletes: "Amber claims ≥$5 skill-fit jobs, publishes a public artifact URL, delivers, and books revenue only on completed.",
        unlocksUsableWorkflow: true,
        actionUrl: a.actionUrl || "https://workprotocol.ai/",
      };
    }
    if (a.platformSlug === "sporeagent") {
      return {
        ...a,
        amberCompleted: "Agent id on file. Amber performed and QAed in-flight Spore work. New Spore bids stay off until submit exists.",
        mikeMustDo: "Nothing required unless you want to reuse a different existing Spore agent id.",
        whyRequired: "Optional identity reuse only. Nothing required for queued Spore work.",
        requiredOrOptional: "optional",
        afterMikeCompletes: "Amber keeps performing in-flight work and attempting deliver. Payment is never booked without a real payout.",
        unlocksUsableWorkflow: true,
      };
    }
    return {
      ...a,
      amberCompleted: a.detail,
      mikeMustDo: a.title,
      whyRequired: a.detail,
      requiredOrOptional: "required",
      afterMikeCompletes: "Amber will re-check on the next scan.",
      unlocksUsableWorkflow: true,
    };
  });
}

function buildActiveWork(jobs: JobRow[]): EarningsCenter["activeWork"] {
  const active = jobs.filter((j) => ["accepted", "working", "testing", "submitted", "payment_pending"].includes(j.status));
  if (!active.length) {
    return { idle: true, jobs: [] };
  }
  return {
    idle: false,
    jobs: active.map((j) => {
      const completed: string[] = ["Discovered", "Qualified"];
      const remaining = ["Perform work", "Produce deliverable", "Quality check", "Submit", "Confirm submission", "Track payment"];
      if (j.status === "accepted") {
        completed.push("Accepted / bid placed");
        if (j.submission) {
          completed.push("Perform work", "Produce deliverable");
        }
        if (/^PASS:/i.test(j.testsNotes || "")) completed.push("Quality check");
      }
      if (j.status === "working" || j.status === "testing") {
        completed.push("Accepted / bid placed", "Started", "Perform work");
        if (j.submission) completed.push("Produce deliverable");
        if (/^PASS:/i.test(j.testsNotes || "")) completed.push("Quality check");
      }
      if (j.status === "submitted") {
        completed.push("Accepted / bid placed", "Started", "Perform work", "Produce deliverable", "Quality check", "Submit");
      }
      const remainingSteps = remaining.filter((s) => !completed.includes(s));
      if (j.status === "submitted") {
        remainingSteps.splice(0, remainingSteps.length, "Confirm platform acceptance", "Track payment");
      }
      const waitAssign = /waiting for poster to assign/i.test(j.acceptance || "") || /waiting for poster/i.test(j.workNotes || "");
      const gap = isSporeHostedSubmitGap(j);
      const blockers = gap
        ? []
        : j.error
          ? [j.error]
          : waitAssign
            ? ["Waiting for the job poster to assign Amber's bid (OPEN → ASSIGNED). Work and QA are ready. Not faked."]
            : [];
      return {
        id: j.id,
        title: j.title,
        platformName: j.platformName,
        startedAt: j.startedAt,
        stage: j.status,
        progressLabel: gap
          ? "Work and QA complete — queued for Spore submit"
          : j.status === "accepted" && j.submission
            ? "Deliverable ready — waiting to start/submit on marketplace"
            : j.status === "accepted"
              ? "Accepted — performing work this tick"
              : j.status,
        currentAction: gap
          ? "Holding verified deliverable. Spore does not offer marketplace submit yet."
          : j.workNotes || j.acceptance || "Advancing perform → QA → submit",
        completedSteps: completed,
        remainingSteps,
        blockers,
        deliverableStatus: j.submission ? "Present" : "None",
        qualityStatus: j.testsNotes || "Not run",
        submissionStatus: j.submission || "Not submitted",
      };
    }),
  };
}

export async function buildCenter(userId: string): Promise<EarningsCenter> {
  await seedPlatforms(userId);
  const rec = await loadRecord(userId);
  const [platformsRaw, jobs, approvalsRaw, ledger, live] = await Promise.all([
    listPlatforms(userId),
    listJobs(userId),
    listApprovals(userId),
    listLedger(userId),
    buildLiveOpportunities(userId),
  ]);

  const profiles = platformProfiles({
    taskbountyApiKey: Boolean(rec.taskbountyApiKey),
    sporeAgentId: Boolean(rec.sporeAgentId),
    moltjobsApiKey: Boolean(rec.moltjobsApiKey),
    workprotocolConnected: Boolean(rec.workprotocolApiKey && rec.workprotocolAgentId),
    tbBoardOk: live.tbBoardOk,
    sporeBoardOk: live.sporeBoardOk,
    moltBoardOk: live.moltBoardOk,
    workprotocolBoardOk: live.workprotocolBoardOk,
    pausedAll: rec.state.pausedAll,
  });
  const profileBySlug = new Map(profiles.map((p) => [p.slug, p]));

  const platforms: PlatformRow[] = platformsRaw.map((p) => {
    const prof = profileBySlug.get(p.slug);
    if (!prof) {
      return {
        ...p,
        integrationMode: p.status === "rejected" ? "BLOCKED" : p.connected ? "CONNECTED" : "DISCOVERY_ONLY",
        capabilitySummary: p.attention || p.rejectReason || "Catalog / inactive platform",
        capabilityBlockers: p.rejectReason ? [p.rejectReason] : ["Not an active execution marketplace"],
        canDiscover: false,
        canAccept: false,
        canPerform: false,
        canSubmit: false,
        canTrackPayment: false,
        // KPI available count must match unique live opportunities, not stale board sums.
        availableJobs: 0,
      };
    }
    const openForPlatform = live.opportunities.filter((o) => o.platformSlug === p.slug && !o.expiredOrGone).length;
    return {
      ...p,
      integrationMode: prof.integrationMode,
      availableJobs: openForPlatform,
      capabilitySummary: prof.summary,
      capabilityBlockers: prof.blockers,
      canDiscover: prof.canDiscover,
      canAccept: prof.canAccept,
      canPerform: prof.canPerform,
      canSubmit: prof.canSubmit,
      canTrackPayment: prof.canTrackPayment,
      // Do not call credential presence alone "Connected" in attention — surface mode.
      attention: p.attention || prof.blockers[0] || "",
    };
  });

  const confirmed = (from: string) =>
    ledger
      .filter((l) => l.kind === "revenue" && l.confirmed && l.occurredAt >= from)
      .reduce((n, l) => n + l.amountUsd, 0);
  const expensesAll = ledger.filter((l) => l.kind === "expense" && l.confirmed).reduce((n, l) => n + l.amountUsd, 0);
  const lifetime = ledger.filter((l) => l.kind === "revenue" && l.confirmed).reduce((n, l) => n + l.amountUsd, 0);

  const available = live.uniqueOpenCount;
  const active = jobs.filter((j) => ["accepted", "working", "testing", "submitted", "payment_pending"].includes(j.status)).length;
  const completed = jobs.filter((j) => ["paid", "accepted_by_customer"].includes(j.status)).length;
  const pipeline = countReloApplied(jobs);
  const pending = jobs
    .filter((j) => j.status === "payment_pending" || j.paymentStatus === "pending")
    .reduce((n, j) => n + j.payoutUsd, 0);

  const potential = live.opportunities
    .filter((o) => !o.expiredOrGone)
    .reduce((n, o) => n + (o.compensationUsd || 0), 0);
  const acceptedValue = jobs
    .filter((j) => ["accepted", "working", "testing"].includes(j.status))
    .reduce((n, j) => n + j.payoutUsd, 0);
  const submittedValue = jobs
    .filter((j) => ["submitted", "accepted_by_customer"].includes(j.status))
    .reduce((n, j) => n + j.payoutUsd, 0);

  let amberStatus: EarningsCenter["amberStatus"] = "RUNNING";
  if (rec.state.pausedAll) amberStatus = "PAUSED";
  else if (platforms.some((p) => p.status === "error")) amberStatus = "ERROR";

  const genuinelyConnected = platforms.filter(
    (p) => p.integrationMode === "CONNECTED" || p.integrationMode === "READY_TO_WORK" || p.integrationMode === "WORKING",
  ).length;

  const whyActiveJobsZero =
    active > 0
      ? `Active jobs = ${active}.`
      : [
          "Active Jobs counts only statuses: accepted, working, testing, submitted.",
          "TaskBounty: evaluate only — never claims (claim/submit engine not implemented).",
          "SporeAgent: work on accepted jobs is queued; new Spore bids are off. MoltJobs is not frozen by Spore.",
          "MoltJobs: bids on OPEN jobs that Amber CAN BID + CAN PERFORM (up to max concurrent active jobs). Waiting for poster assignment does not freeze other bids. Owner signup + USDC wallet stay on MoltJobs (not faked).",
          "WorkProtocol: claims open ≥$5 skill-fit jobs when agent is registered; delivers via public artifact URL; revenue only when platform marks completed.",
          rec.state.pausedAll ? "Pause All is ON — discovery continues, no bids/claims." : "",
          !rec.moltjobsApiKey ? "MoltJobs API key missing — cannot bid." : "",
          !(rec.workprotocolApiKey && rec.workprotocolAgentId)
            ? "WorkProtocol agent not registered yet — Amber auto-registers on the next tick."
            : "",
          !rec.taskbountyApiKey ? "TaskBounty not connected — cannot claim even when engine exists." : "",
        ]
          .filter(Boolean)
          .join(" ");

  const executionEngineStatus = [
    "Scanner: LIVE (TaskBounty + SporeAgent + MoltJobs + WorkProtocol open boards).",
    "Qualification/profit gates: LIVE.",
    "Capability check before Ready to Work: LIVE (never marks Ready to Work without full pipeline).",
    "Accept/apply: MoltJobs auto-bids when key + capability + profit pass; WorkProtocol auto-claims when agent + capability + profit pass; TaskBounty claim NOT implemented; Spore bid only when marketplace submit exists.",
    "Perform → QA → submit → payment verification: LIVE for MoltJobs and WorkProtocol (WP deliver needs a public artifact URL). Spore jobs with finished work stay queued. Owner USDC wallet is not faked.",
  ].join(" ");

  return {
    at: new Date().toISOString(),
    amberStatus,
    lastSuccessfulScan: rec.state.lastTickAt || platforms.find((p) => p.lastScanAt)?.lastScanAt || null,
    worker: {
      cloud: true,
      ticks: rec.state.ticks,
      notes: [...(rec.state.lastTickNotes || []), ...live.boardNotes]
        .filter((n) => !/catch-all 404|hosted Next.js API has no POST|local MCP only|deliver endpoint not available|Hosted \/deliver is a catch-all/i.test(n))
        .slice(0, 20),
    },
    kpis: {
      todayEarnings: confirmed(startOfToday()),
      thisWeek: confirmed(daysAgo(7)),
      thisMonth: confirmed(startOfMonth()),
      lifetimeRevenue: lifetime,
      expenses: expensesAll,
      netProfit: Math.round((lifetime - expensesAll) * 100) / 100,
      activeJobs: active,
      completedJobs: completed,
      pendingPayments: Math.round(pending * 100) / 100,
      availableOpportunities: available,
      connectedPlatforms: genuinelyConnected,
      jobsApplied: pipeline.applied,
      jobsRejected: pipeline.rejected,
      jobsSubmitted: pipeline.submitted,
    },
    accounting: {
      verifiedPaidRevenue: lifetime,
      potentialOpportunityValue: Math.round(potential * 100) / 100,
      acceptedJobValue: Math.round(acceptedValue * 100) / 100,
      submittedReceivable: Math.round(submittedValue * 100) / 100,
      pendingPayment: Math.round(pending * 100) / 100,
      expenses: expensesAll,
      verifiedNetProfit: Math.round((lifetime - expensesAll) * 100) / 100,
      definition:
        "Main earnings / lifetime figures are VERIFIED PAID REVENUE only (confirmed ledger revenue). Opportunities, bids, and expected payouts are never counted as paid.",
    },
    platforms,
    platformProfiles: profiles,
    opportunities: live.opportunities,
    opportunityAudit: {
      uniqueOpen: live.uniqueOpenCount,
      stillAvailable: live.stillAvailableCount,
      capableOfCompleting: live.capableOfCompletingCount,
      canAcceptWithCurrentAccess: live.canAcceptCount,
      expiredOrGone: live.opportunities.filter((o) => o.expiredOrGone).length,
    },
    activeWork: buildActiveWork(jobs),
    whyActiveJobsZero,
    executionEngineStatus,
    jobs: jobs.filter((j) => j.status !== "rejected"),
    rejected: jobs.filter((j) => j.status === "rejected"),
    history: jobs,
    approvals: enrichApprovals(approvalsRaw, rec),
    ledger,
    limits: rec.state.limits,
    pausedAll: rec.state.pausedAll,
    deviceAuth: rec.state.deviceAuth
      ? {
          userCode: rec.state.deviceAuth.userCode,
          verificationUri: rec.state.deviceAuth.verificationUri,
          verificationUriComplete: rec.state.deviceAuth.verificationUriComplete,
          expiresAt: rec.state.deviceAuth.expiresAt,
        }
      : null,
    taskbountyConnected: Boolean(rec.taskbountyApiKey),
    sporeConnected: Boolean(rec.sporeAgentId),
    moltConnected: Boolean(rec.moltjobsApiKey),
    workprotocolConnected: Boolean(rec.workprotocolApiKey && rec.workprotocolAgentId),
  };
}
