/**
 * Honest execution capability — discovery is never treated as Ready to Work.
 * Skill fit (can perform) is separate from marketplace pipeline (can accept/submit).
 */
import { moltCanComplete, sporeCanComplete, taskBountyCanComplete, workProtocolCanComplete } from "./policy";

export type IntegrationMode =
  | "DISCOVERY_ONLY"
  | "SETUP_REQUIRED"
  | "CONNECTED"
  | "READY_TO_WORK"
  | "WORKING"
  | "SUBMITTED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "BLOCKED";

export type CapabilityCheck = {
  canAccess: boolean;
  canAcceptOrApply: boolean;
  /** Skill/infra fit — Amber can produce this class of work. */
  canPerformAllWork: boolean;
  canProduceDeliverable: boolean;
  canSubmit: boolean;
  canVerifySubmission: boolean;
  canTrackPayment: boolean;
  missing: string[];
  missingCapabilities: string[];
  missingInputs: string[];
  pipelineBlockers: string[];
  whyCanPerform: string;
  whyCannot: string;
  primaryBlocker: string;
  workCategory: string;
  /** True only when every required execution step is implemented AND gated OK. */
  readyToWork: boolean;
};

export type PlatformCapabilityProfile = {
  slug: string;
  name: string;
  integrationMode: IntegrationMode;
  hasCredentials: boolean;
  boardReadable: boolean;
  canDiscover: boolean;
  canAccept: boolean;
  canPerform: boolean;
  canSubmit: boolean;
  canTrackPayment: boolean;
  summary: string;
  blockers: string[];
};

function primaryFrom(parts: { missingCapabilities: string[]; pipelineBlockers: string[]; missingInputs: string[]; missing: string[] }): string {
  if (parts.missingCapabilities[0]) return `Missing capability: ${parts.missingCapabilities[0]}`;
  const impl = parts.pipelineBlockers.find((p) => /not implemented/i.test(p));
  if (impl) return impl;
  if (parts.pipelineBlockers[0]) return parts.pipelineBlockers[0];
  const blockingInput = parts.missingInputs.find((m) => !m.startsWith("Preferred"));
  if (blockingInput) return `Missing input: ${blockingInput}`;
  if (parts.missing[0]) return parts.missing[0];
  return "No blocker — skill fit OK (pipeline may still be incomplete).";
}

export function assessTaskBountyCapability(input: {
  hasApiKey: boolean;
  boardOk: boolean;
  language?: string;
  title: string;
  complexity?: string;
  paused?: boolean;
}): CapabilityCheck {
  const cap = taskBountyCanComplete({
    language: input.language,
    title: input.title,
    complexity: input.complexity,
  });
  const missingCapabilities = [...(cap.missingCapabilities || [])];
  const missingInputs = [...(cap.missingInputs || [])];
  const pipelineBlockers: string[] = [];
  const missing: string[] = [];

  if (!input.boardOk) {
    missing.push("Cannot reach TaskBounty open board right now.");
    pipelineBlockers.push("TaskBounty board unreachable");
  }
  if (!input.hasApiKey) {
    missing.push("TaskBounty API key not connected (device login).");
    pipelineBlockers.push("Connect TaskBounty (device login) before any claim");
  }
  if (input.paused) {
    missing.push("Marketplace or Pause All is on — no claims.");
    pipelineBlockers.push("Pause All is on");
  }
  if (!cap.ok) missing.push(...cap.reasons);
  pipelineBlockers.push(
    "Claim -> patch -> sandbox regression -> submit is not implemented yet (Amber evaluates only)",
  );

  const canPerform = cap.ok;
  return {
    canAccess: input.boardOk,
    canAcceptOrApply: false,
    canPerformAllWork: canPerform,
    canProduceDeliverable: canPerform,
    canSubmit: false,
    canVerifySubmission: false,
    canTrackPayment: false,
    missing: [...new Set([...missing, ...pipelineBlockers])],
    missingCapabilities,
    missingInputs,
    pipelineBlockers,
    whyCanPerform: canPerform
      ? cap.reasons.join(" ") || "Within Amber's TaskBounty solver set."
      : "Skill/language gate failed.",
    whyCannot: canPerform
      ? pipelineBlockers.join(" · ")
      : [...missingCapabilities.map((m) => `Missing capability: ${m}`), ...cap.reasons].join(" · "),
    primaryBlocker: primaryFrom({ missingCapabilities, pipelineBlockers, missingInputs, missing }),
    workCategory: canPerform ? "taskbounty_solver" : "out_of_scope",
    readyToWork: false,
  };
}

export function assessSporeCapability(input: {
  hasAgentId: boolean;
  boardOk: boolean;
  title: string;
  description: string;
  requirements: string[];
  /** Hosted Spore /deliver must be live before Amber claims she can accept. */
  submitLive?: boolean;
}): CapabilityCheck {
  const cap = sporeCanComplete({
    title: input.title,
    description: input.description,
    requirements: input.requirements,
  });
  const missingCapabilities = [...(cap.missingCapabilities || [])];
  const missingInputs = [...(cap.missingInputs || [])];
  const pipelineBlockers: string[] = [];
  const missing: string[] = [];

  if (!input.boardOk) {
    missing.push("Cannot reach SporeAgent open tasks API.");
    pipelineBlockers.push("SporeAgent board unreachable");
  }
  if (!input.hasAgentId) {
    missing.push("SporeAgent agent id not saved — Amber will auto-register on the next execution tick.");
    pipelineBlockers.push("Spore agent id missing (auto-register on tick)");
  }
  const submitLive = input.submitLive === true;
  if (!submitLive) {
    missing.push("Spore hosted marketplace submit (/deliver) is not available — Amber will not bid until Spore ships it.");
    pipelineBlockers.push("Spore hosted /deliver not available (cannot complete accept → submit)");
  }

  const canPerform = cap.ok;
  if (!canPerform) missing.push(...cap.reasons);
  // CAN BID only when Amber can finish the pipeline Spore offers today (bid + submit).
  const canBid = Boolean(input.boardOk && input.hasAgentId && canPerform && submitLive);
  const canSubmit = Boolean(canBid && submitLive);

  return {
    canAccess: input.boardOk,
    canAcceptOrApply: canBid,
    canPerformAllWork: canPerform,
    canProduceDeliverable: canPerform,
    canSubmit,
    canVerifySubmission: canPerform,
    canTrackPayment: false,
    missing: [...new Set([...missing, ...missingInputs])],
    missingCapabilities,
    missingInputs,
    pipelineBlockers,
    whyCanPerform: canPerform
      ? cap.reasons.join(" ")
      : "Amber does not have a verified capability match for this listing.",
    whyCannot: canPerform
      ? pipelineBlockers.concat(missingInputs.filter((m) => !m.startsWith("Preferred"))).join(" · ") || "Skill fit OK."
      : [...missingCapabilities.map((m) => `Missing capability: ${m}`), ...cap.reasons].join(" · "),
    primaryBlocker: canPerform
      ? primaryFrom({ missingCapabilities: [], pipelineBlockers, missingInputs, missing })
      : primaryFrom({ missingCapabilities, pipelineBlockers, missingInputs, missing }),
    workCategory: cap.category || "unknown",
    readyToWork: Boolean(canBid && canSubmit),
  };
}

export function assessMoltCapability(input: {
  hasApiKey: boolean;
  boardOk: boolean;
  title: string;
  description: string;
  paused?: boolean;
  certBlocked?: boolean;
}): CapabilityCheck {
  const cap = moltCanComplete({ title: input.title, description: input.description });
  const missingCapabilities = [...(cap.missingCapabilities || [])];
  const missingInputs = [...(cap.missingInputs || [])];
  const pipelineBlockers: string[] = [];
  const missing: string[] = [];

  if (!input.boardOk) {
    missing.push("Cannot reach MoltJobs open jobs API.");
    pipelineBlockers.push("MoltJobs board unreachable");
  }
  if (!input.hasApiKey) {
    missing.push("MoltJobs API key (mj_live_) not connected.");
    pipelineBlockers.push("Connect MoltJobs mj_live_ API key");
  }
  if (input.paused) {
    missing.push("Pause All is on — no bids.");
    pipelineBlockers.push("Pause All is on");
  }
  if (input.certBlocked) {
    missing.push("MoltJobs General Fundamentals certification required on-platform before bids are accepted.");
    pipelineBlockers.push("Complete MoltJobs General Fundamentals certification on-platform");
  }
  if (!cap.ok) missing.push(...cap.reasons);

  const canPerform = cap.ok;
  const canBid = Boolean(
    input.hasApiKey && input.boardOk && !input.paused && !input.certBlocked && canPerform,
  );
  const canSubmit = Boolean(input.hasApiKey && canPerform && !input.paused);

  return {
    canAccess: input.boardOk,
    canAcceptOrApply: canBid,
    canPerformAllWork: canPerform,
    canProduceDeliverable: canPerform,
    canSubmit,
    canVerifySubmission: canSubmit,
    canTrackPayment: Boolean(input.hasApiKey),
    missing: [...new Set([...missing, ...pipelineBlockers])],
    missingCapabilities,
    missingInputs,
    pipelineBlockers,
    whyCanPerform: canPerform
      ? cap.reasons.join(" ")
      : "Amber does not have a verified capability match for this listing.",
    whyCannot: canPerform
      ? pipelineBlockers.join(" · ")
      : [...missingCapabilities.map((m) => `Missing capability: ${m}`), ...cap.reasons].join(" · "),
    primaryBlocker: primaryFrom({
      missingCapabilities,
      pipelineBlockers: canBid ? pipelineBlockers.filter((p) => /wallet|certification|Pause/i.test(p)) : pipelineBlockers,
      missingInputs,
      missing,
    }),
    workCategory: cap.category || "unknown",
    readyToWork: Boolean(canBid && canSubmit),
  };
}

export function assessWorkProtocolCapability(input: {
  hasApiKey: boolean;
  hasAgentId: boolean;
  boardOk: boolean;
  title: string;
  description: string;
  paused?: boolean;
}): CapabilityCheck {
  const cap = workProtocolCanComplete({ title: input.title, description: input.description });
  const missingCapabilities = [...(cap.missingCapabilities || [])];
  const missingInputs = [...(cap.missingInputs || [])];
  const pipelineBlockers: string[] = [];
  const missing: string[] = [];

  if (!input.boardOk) {
    missing.push("Cannot reach WorkProtocol open jobs API.");
    pipelineBlockers.push("WorkProtocol board unreachable");
  }
  if (!input.hasApiKey || !input.hasAgentId) {
    missing.push("WorkProtocol agent not registered — Amber auto-registers on the next tick.");
    pipelineBlockers.push("WorkProtocol agent/key missing (auto-register on tick)");
  }
  if (input.paused) {
    missing.push("Pause All is on — no claims.");
    pipelineBlockers.push("Pause All is on");
  }
  if (!cap.ok) missing.push(...cap.reasons);

  const canPerform = cap.ok;
  const connected = Boolean(input.hasApiKey && input.hasAgentId);
  const canClaim = Boolean(connected && input.boardOk && !input.paused && canPerform);
  const canSubmit = Boolean(connected && canPerform && !input.paused);

  return {
    canAccess: input.boardOk,
    canAcceptOrApply: canClaim,
    canPerformAllWork: canPerform,
    canProduceDeliverable: canPerform,
    canSubmit,
    canVerifySubmission: canSubmit,
    canTrackPayment: connected,
    missing: [...new Set([...missing, ...pipelineBlockers])],
    missingCapabilities,
    missingInputs,
    pipelineBlockers,
    whyCanPerform: canPerform
      ? cap.reasons.join(" ")
      : "Amber does not have a verified capability match for this listing.",
    whyCannot: canPerform
      ? pipelineBlockers.join(" · ")
      : [...missingCapabilities.map((m) => `Missing capability: ${m}`), ...cap.reasons].join(" · "),
    primaryBlocker: primaryFrom({
      missingCapabilities,
      pipelineBlockers,
      missingInputs,
      missing,
    }),
    workCategory: cap.category || "unknown",
    readyToWork: Boolean(canClaim && canSubmit),
  };
}

export function platformProfiles(input: {
  taskbountyApiKey: boolean;
  sporeAgentId: boolean;
  moltjobsApiKey: boolean;
  workprotocolConnected: boolean;
  tbBoardOk: boolean;
  sporeBoardOk: boolean;
  moltBoardOk: boolean;
  workprotocolBoardOk: boolean;
  pausedAll: boolean;
}): PlatformCapabilityProfile[] {
  return [
    {
      slug: "taskbounty",
      name: "TaskBounty",
      integrationMode: !input.tbBoardOk && !input.taskbountyApiKey
        ? "BLOCKED"
        : input.taskbountyApiKey
          ? "CONNECTED"
          : "SETUP_REQUIRED",
      hasCredentials: input.taskbountyApiKey,
      boardReadable: input.tbBoardOk,
      canDiscover: input.tbBoardOk,
      canAccept: false,
      canPerform: true,
      canSubmit: false,
      canTrackPayment: false,
      summary: input.taskbountyApiKey
        ? "API key connected. Skill evaluation is live; claim/submit engine is not implemented."
        : "Board is readable without a key, but claiming requires device-login Connect TaskBounty.",
      blockers: input.taskbountyApiKey
        ? ["No automated claim/patch/submit path"]
        : ["Owner must Connect TaskBounty (device code)"],
    },
    {
      slug: "sporeagent",
      name: "SporeAgent",
      integrationMode: !input.sporeBoardOk
        ? "BLOCKED"
        : input.sporeAgentId
          ? "DISCOVERY_ONLY"
          : "SETUP_REQUIRED",
      hasCredentials: input.sporeAgentId,
      boardReadable: input.sporeBoardOk,
      canDiscover: input.sporeBoardOk,
      canAccept: input.sporeBoardOk && input.sporeAgentId,
      canPerform: true,
      canSubmit: false,
      canTrackPayment: false,
      summary: input.sporeAgentId
        ? "Agent id on file. Amber keeps queued work; new Spore bids stay off until marketplace submit exists."
        : "Open tasks readable; Amber auto-registers a Spore agent on the execution tick when missing.",
      blockers: input.sporeAgentId ? [] : ["Spore agent id will be auto-registered on tick"],
    },
    {
      slug: "moltjobs",
      name: "MoltJobs",
      integrationMode: !input.moltBoardOk && !input.moltjobsApiKey
        ? "BLOCKED"
        : input.moltjobsApiKey
          ? "CONNECTED"
          : "SETUP_REQUIRED",
      hasCredentials: input.moltjobsApiKey,
      boardReadable: input.moltBoardOk,
      canDiscover: input.moltBoardOk,
      canAccept: input.moltjobsApiKey && !input.pausedAll,
      canPerform: true,
      canSubmit: Boolean(input.moltjobsApiKey),
      canTrackPayment: Boolean(input.moltjobsApiKey),
      summary: input.moltjobsApiKey
        ? "API key connected. Amber bids, performs, QAs, submits outputData after ASSIGNED, and books revenue only when MoltJobs verifies payment. Owner USDC wallet is not faked."
        : "Open jobs are readable; owner must finish MoltJobs signup, mj_live_ key, and USDC payout setup on MoltJobs.",
      blockers: input.moltjobsApiKey
        ? [...(input.pausedAll ? ["Pause All is on"] : []), "Poster must assign the bid before start/submit"]
        : ["Missing MoltJobs API key", "Owner signup / USDC wallet may be required on MoltJobs"],
    },
    {
      slug: "workprotocol",
      name: "WorkProtocol",
      integrationMode: !input.workprotocolBoardOk && !input.workprotocolConnected
        ? "BLOCKED"
        : input.workprotocolConnected
          ? "CONNECTED"
          : "SETUP_REQUIRED",
      hasCredentials: input.workprotocolConnected,
      boardReadable: input.workprotocolBoardOk,
      canDiscover: input.workprotocolBoardOk,
      canAccept: input.workprotocolConnected && !input.pausedAll,
      canPerform: true,
      canSubmit: input.workprotocolConnected,
      canTrackPayment: input.workprotocolConnected,
      summary: input.workprotocolConnected
        ? "Agent connected. Amber claims open ≥$5 skill-fit jobs, publishes a public artifact URL, delivers, and books revenue only when WorkProtocol marks the job completed."
        : "Open jobs are readable; Amber auto-registers a WorkProtocol agent on the next tick (API key shown once and stored).",
      blockers: input.workprotocolConnected
        ? [...(input.pausedAll ? ["Pause All is on"] : [])]
        : ["WorkProtocol agent will auto-register on tick"],
    },
    {
      slug: "reelo_services",
      name: "Reelo Services",
      integrationMode: "CONNECTED",
      hasCredentials: true,
      boardReadable: true,
      canDiscover: true,
      canAccept: false,
      canPerform: true,
      canSubmit: false,
      canTrackPayment: false,
      summary: "First-party Reelo paid work channel — currently 0 inbound paid orders.",
      blockers: ["No inbound paid audit/lead-gen orders"],
    },
  ];
}

export function opportunityStatusFrom(check: CapabilityCheck, jobStatus?: string): IntegrationMode {
  if (jobStatus === "paid") return "PAID";
  if (jobStatus === "payment_pending") return "PAYMENT_PENDING";
  if (jobStatus === "submitted" || jobStatus === "accepted_by_customer") return "SUBMITTED";
  if (jobStatus === "working" || jobStatus === "testing" || jobStatus === "accepted") return "WORKING";
  // Stale Amber "rejected"/"failed" rows must not paint BLOCKED when the open-board
  // listing is still eligible (CAN BID + CAN PERFORM).
  if (jobStatus === "rejected" || jobStatus === "failed" || jobStatus === "stopped") {
    if (check.canAcceptOrApply && check.canPerformAllWork) return "READY_TO_WORK";
    if (!check.canAccess) return "BLOCKED";
    if (!check.canPerformAllWork && check.missingCapabilities.length) return "BLOCKED";
    if (!check.canAcceptOrApply && check.missing.some((m) => /not connected|API key|agent id|device login|mj_live_/i.test(m))) {
      return "SETUP_REQUIRED";
    }
    if (!check.canAcceptOrApply && check.pipelineBlockers.some((p) => /deliver|submit not available/i.test(p))) {
      return "DISCOVERY_ONLY";
    }
    return "DISCOVERY_ONLY";
  }
  // Never show DISCOVERY_ONLY when Amber can bid and perform — that contradiction left jobs idle.
  if (check.canAcceptOrApply && check.canPerformAllWork) return "READY_TO_WORK";
  if (check.readyToWork) return "READY_TO_WORK";
  if (!check.canAccess) return "BLOCKED";
  if (!check.canPerformAllWork && check.missingCapabilities.length) return "BLOCKED";
  if (!check.canAcceptOrApply && check.missing.some((m) => /not connected|API key|agent id|device login|mj_live_/i.test(m))) {
    return "SETUP_REQUIRED";
  }
  return "DISCOVERY_ONLY";
}
