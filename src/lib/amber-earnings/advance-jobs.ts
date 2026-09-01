/**
 * Resume accepted jobs from where they stopped.
 * Never invents platform assignment, submission, or payment.
 */
import { executeSkillFitWork } from "./execute-work";
import { sporeCanComplete } from "./policy";
import { deliverSporeWork, getSporeTask } from "./sporeagent";
import {
  getMoltJob,
  getMoltWallet,
  getMoltWalletCredits,
  startMoltJob,
  submitMoltWork,
  verifyMoltJobsKey,
} from "./moltjobs";
import {
  artifactPublicUrl,
  deliverableTypeFor,
  encodeWpAcceptance,
  newArtifactToken,
  parseWpAcceptance,
} from "./artifacts";
import {
  deliverWorkProtocolJob,
  getWorkProtocolJob,
  verifyWorkProtocolKey,
} from "./workprotocol";
import { blocksNewAccepts, listJobs, recordConfirmedRevenue, updateJobProgress } from "./persist";
import type { JobRow } from "./center-types";
import type { EarningsRecord } from "./store";

export type PipelineAction =
  | "perform"
  | "wait_assignment"
  | "start"
  | "submit"
  | "await_review"
  | "verify_payment"
  | "failed"
  | "idle";

export function nextMoltAction(input: {
  platformStatus: string;
  hasDeliverable: boolean;
  qaPassed: boolean;
  alreadySubmitted: boolean;
}): PipelineAction {
  const st = String(input.platformStatus || "").toUpperCase();
  if (st === "CANCELLED" || st === "DISPUTED") return "failed";
  if (!input.hasDeliverable || !input.qaPassed) return "perform";
  if (st === "COMPLETED" || st === "APPROVED") return "verify_payment";
  if (st === "IN_REVIEW" || input.alreadySubmitted) return "await_review";
  if (st === "IN_PROGRESS") return "submit";
  if (st === "ASSIGNED") return "start";
  if (st === "OPEN" || !st) return "wait_assignment";
  return "wait_assignment";
}

/** WorkProtocol statuses are lowercase in OpenAPI. */
export function nextWorkProtocolAction(input: {
  platformStatus: string;
  hasDeliverable: boolean;
  qaPassed: boolean;
  alreadyDelivered: boolean;
  hasClaimId: boolean;
}): PipelineAction {
  const st = String(input.platformStatus || "").toLowerCase();
  if (["cancelled", "disputed", "expired"].includes(st)) return "failed";
  if (!input.hasClaimId) return "failed";
  if (!input.hasDeliverable || !input.qaPassed) return "perform";
  if (st === "completed") return "verify_payment";
  if (["delivered", "verifying"].includes(st) || input.alreadyDelivered) return "await_review";
  if (["claimed", "in_progress", "open"].includes(st) || !st) return "submit";
  return "await_review";
}

function qaPassed(job: JobRow): boolean {
  return /^PASS:/i.test(String(job.testsNotes || ""));
}

export async function advanceInFlightJobs(
  userId: string,
  rec: EarningsRecord,
): Promise<{ notes: string[]; submittedOk: number; paidOk: number; blockedNewAccepts: boolean }> {
  const notes: string[] = [];
  const jobs = await listJobs(userId);
  const inflight = jobs.filter((j) =>
    ["accepted", "working", "testing", "submitted", "payment_pending"].includes(j.status),
  );
  if (!inflight.length) {
    notes.push("No in-flight jobs to resume.");
    return { notes, submittedOk: 0, paidOk: 0, blockedNewAccepts: false };
  }

  let submittedOk = 0;
  let paidOk = 0;
  const moltKey = rec.moltjobsApiKey;
  const agent = moltKey ? await verifyMoltJobsKey(moltKey) : { ok: false, agentId: null as string | null, detail: "" };

  for (const job of inflight) {
    if (job.platformSlug === "moltjobs") {
      const r = await advanceMoltJob(userId, job, moltKey, agent.agentId);
      notes.push(...r.notes);
      if (r.submitted) submittedOk += 1;
      if (r.paid) paidOk += 1;
      continue;
    }
    if (job.platformSlug === "workprotocol") {
      const r = await advanceWorkProtocolJob(userId, job, rec.workprotocolApiKey, rec.workprotocolAgentId);
      notes.push(...r.notes);
      if (r.submitted) submittedOk += 1;
      if (r.paid) paidOk += 1;
      continue;
    }
    if (job.platformSlug === "sporeagent") {
      const r = await advanceSporeJob(userId, job, rec.sporeAgentId);
      notes.push(...r.notes);
      if (r.submitted) submittedOk += 1;
      continue;
    }
    notes.push(`${job.externalId}: ${job.platformSlug} has no perform/submit engine — left in ${job.status}.`);
  }

  // Re-read after progress so wait-for-assignment Molt rows no longer freeze capacity.
  const after = await listJobs(userId);
  const blockedNewAccepts = after.some((j) => blocksNewAccepts(j.status, j));
  return { notes, submittedOk, paidOk, blockedNewAccepts };
}

async function advanceMoltJob(
  userId: string,
  job: JobRow,
  apiKey: string | null,
  agentId: string | null,
): Promise<{ notes: string[]; submitted: boolean; paid: boolean }> {
  const notes: string[] = [];
  const label = `Molt ${job.externalId}`;

  if (!apiKey) {
    notes.push(`${label}: mj_live_ key missing — cannot start/submit. Owner signup + USDC stay on MoltJobs.`);
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      error: "MoltJobs API key missing",
      logLine: "Blocked — MoltJobs key / owner USDC setup not faked.",
    });
    return { notes, submitted: false, paid: false };
  }

  let hasDeliverable = Boolean(job.submission && job.submission.length > 20);
  let passed = qaPassed(job);
  if (!hasDeliverable || !passed) {
    const work = executeSkillFitWork({ title: job.title, description: job.description });
    notes.push(`${label}: performed ${work.category} — ${work.testsNotes}`);
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: work.ok ? "testing" : "failed",
      workNotes: work.approach,
      testsNotes: work.testsNotes,
      submission: work.ok ? work.deliverable.slice(0, 12000) : job.submission,
      startedAt: job.startedAt || new Date().toISOString(),
      error: work.ok ? "" : work.testsNotes,
      logLine: work.ok ? `Deliverable + QA: ${work.testsNotes}` : `QA failed: ${work.testsNotes}`,
    });
    hasDeliverable = work.ok;
    passed = work.ok;
    if (work.ok) {
      job = { ...job, submission: work.deliverable, testsNotes: work.testsNotes, workNotes: work.approach, status: "testing" };
    } else {
      return { notes, submitted: false, paid: false };
    }
  }

  const live = await getMoltJob(apiKey, job.externalId);
  notes.push(`${label}: ${live.detail}`);
  const action = nextMoltAction({
    platformStatus: live.status,
    hasDeliverable,
    qaPassed: passed,
    alreadySubmitted: job.status === "submitted" || job.status === "payment_pending" || job.paymentStatus === "pending_review",
  });

  if (action === "wait_assignment") {
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: "working",
      acceptance: `platform=${live.status || "OPEN"} waiting for poster to assign bid`,
      error: "",
      logLine: "Work + QA ready. Waiting for poster to assign the bid (OPEN → ASSIGNED). Not inventing assignment.",
    });
    notes.push(`${label}: waiting for poster assignment (no fake start).`);
    return { notes, submitted: false, paid: false };
  }

  if (action === "failed") {
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: "failed",
      error: live.detail,
      logLine: `Platform ${live.status} — not counting as paid.`,
    });
    notes.push(`${label}: platform ${live.status} — stopped.`);
    return { notes, submitted: false, paid: false };
  }

  if (action === "start") {
    const started = await startMoltJob(apiKey, job.externalId);
    notes.push(`${label} start: ${started.detail}`);
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: started.ok ? "working" : "working",
      acceptance: started.ok ? "ASSIGNED → IN_PROGRESS" : `start deferred: ${started.detail}`,
      error: started.ok ? "" : started.detail,
      logLine: started.detail,
      startedAt: job.startedAt || new Date().toISOString(),
    });
    if (!started.ok) return { notes, submitted: false, paid: false };
  }

  if (action === "start" || action === "submit") {
    const submitted = await submitMoltWork(apiKey, job.externalId, {
      summary: job.workNotes || "Completed deliverable with local QA.",
      output: job.submission,
      testsNotes: job.testsNotes,
    });
    notes.push(`${label} submit: ${submitted.detail}`);
    if (submitted.ok) {
      await updateJobProgress({
        userId,
        platformSlug: "moltjobs",
        externalId: job.externalId,
        status: "submitted",
        paymentStatus: "pending_review",
        acceptance: "IN_REVIEW — submitted via MoltJobs API",
        error: "",
        logLine: submitted.detail,
      });
      return { notes, submitted: true, paid: false };
    }
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: "working",
      error: submitted.detail,
      logLine: submitted.detail,
    });
    return { notes, submitted: false, paid: false };
  }

  if (action === "await_review") {
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: "submitted",
      paymentStatus: "pending_review",
      acceptance: `platform=${live.status} awaiting poster approve / escrow release`,
      logLine: "Submission confirmed on platform. Payment not counted until COMPLETED + verified credit.",
    });
    notes.push(`${label}: in review — payment not booked.`);
    return { notes, submitted: true, paid: false };
  }

  if (action === "verify_payment") {
    let verified = Boolean(live.escrowTxHash);
    let source = live.escrowTxHash ? `moltjobs escrow ${live.escrowTxHash}` : "";
    if (agentId) {
      const wallet = await getMoltWallet(apiKey, agentId);
      notes.push(`${label} wallet: ${wallet.detail}`);
      const tx = await getMoltWalletCredits(apiKey, agentId);
      const hit = tx.credits.find((c) => /credit/i.test(c.type) && c.note.includes(job.externalId));
      if (hit) {
        verified = true;
        source = `moltjobs wallet CREDIT ${hit.amount} ${hit.note || job.externalId}`;
      }
      if (!verified && wallet.ok && (wallet.usdcBalance || 0) > 0 && live.status === "COMPLETED") {
        // Balance alone is not job-specific — do not book revenue from it.
        notes.push(`${label}: wallet has USDC but no job-specific CREDIT txn — not booking revenue.`);
      }
    }
    if (!verified) {
      await updateJobProgress({
        userId,
        platformSlug: "moltjobs",
        externalId: job.externalId,
        status: "payment_pending",
        paymentStatus: "pending",
        acceptance: `platform=${live.status} escrow=${live.escrowTxHash || "none"} — waiting verified credit`,
        logLine: "COMPLETED on board but payment not independently verified (no escrow hash / CREDIT txn). Not booked.",
      });
      notes.push(`${label}: COMPLETED reported but payment not verified — not booked.`);
      return { notes, submitted: true, paid: false };
    }
    const booked = await recordConfirmedRevenue({
      userId,
      platformSlug: "moltjobs",
      jobId: job.id,
      amountUsd: job.payoutUsd,
      source,
      note: `Verified MoltJobs payout for ${job.externalId}`,
    });
    await updateJobProgress({
      userId,
      platformSlug: "moltjobs",
      externalId: job.externalId,
      status: "paid",
      paymentStatus: "paid",
      acceptance: source,
      logLine: booked ? `Verified revenue recorded (${source})` : "Revenue already on ledger.",
    });
    notes.push(`${label}: paid and verified (${source}).`);
    return { notes, submitted: true, paid: true };
  }

  return { notes, submitted: false, paid: false };
}

async function advanceWorkProtocolJob(
  userId: string,
  job: JobRow,
  apiKey: string | null,
  agentId: string | null,
): Promise<{ notes: string[]; submitted: boolean; paid: boolean }> {
  const notes: string[] = [];
  const label = `WP ${job.externalId}`;
  if (!apiKey || !agentId) {
    notes.push(`${label}: WorkProtocol agent/key missing — cannot deliver.`);
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      error: "WorkProtocol credentials missing",
      logLine: "Blocked — WorkProtocol agent/key not on file.",
    });
    return { notes, submitted: false, paid: false };
  }

  void verifyWorkProtocolKey(apiKey, agentId);

  let meta = parseWpAcceptance(job.acceptance || "");
  let hasDeliverable = Boolean(job.submission && job.submission.length > 20);
  let passed = qaPassed(job);
  if (!hasDeliverable || !passed) {
    const work = executeSkillFitWork({ title: job.title, description: job.description });
    notes.push(`${label}: performed ${work.category} — ${work.testsNotes}`);
    const token = meta.artifactToken || newArtifactToken();
    const acceptance = meta.claimId
      ? encodeWpAcceptance(meta.claimId, token)
      : job.acceptance || "";
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      status: work.ok ? "testing" : "failed",
      workNotes: work.approach,
      testsNotes: work.testsNotes,
      submission: work.ok ? work.deliverable.slice(0, 12000) : job.submission,
      acceptance: work.ok ? acceptance : job.acceptance,
      startedAt: job.startedAt || new Date().toISOString(),
      error: work.ok ? "" : work.testsNotes,
      logLine: work.ok ? `Deliverable + QA: ${work.testsNotes}` : `QA failed: ${work.testsNotes}`,
    });
    hasDeliverable = work.ok;
    passed = work.ok;
    if (work.ok) {
      job = {
        ...job,
        submission: work.deliverable,
        testsNotes: work.testsNotes,
        workNotes: work.approach,
        acceptance,
        status: "testing",
      };
      meta = parseWpAcceptance(acceptance);
    } else {
      return { notes, submitted: false, paid: false };
    }
  }

  if (!meta.claimId) {
    notes.push(`${label}: missing claim id in acceptance — cannot deliver.`);
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      error: "Missing WorkProtocol claim id",
      logLine: "Blocked — claim id not stored after claim.",
    });
    return { notes, submitted: false, paid: false };
  }

  const live = await getWorkProtocolJob(job.externalId);
  notes.push(`${label}: ${live.detail}`);
  const alreadyDelivered =
    job.status === "submitted" ||
    job.status === "payment_pending" ||
    /delivered|verifying/i.test(job.acceptance || "");
  const action = nextWorkProtocolAction({
    platformStatus: live.status,
    hasDeliverable,
    qaPassed: passed,
    alreadyDelivered,
    hasClaimId: Boolean(meta.claimId),
  });

  if (action === "failed") {
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      status: "failed",
      error: live.detail,
      logLine: `Platform ${live.status} — not counting as paid.`,
    });
    notes.push(`${label}: platform ${live.status} — stopped.`);
    return { notes, submitted: false, paid: false };
  }

  if (action === "submit") {
    const token = meta.artifactToken || newArtifactToken();
    const url = artifactPublicUrl(token);
    const type = deliverableTypeFor("", job.submission);
    // Ensure artifact is findable before telling WorkProtocol the URL.
    const acceptance = encodeWpAcceptance(meta.claimId, token);
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      submission: job.submission,
      acceptance,
      logLine: `Publishing artifact ${url}`,
    });
    const delivered = await deliverWorkProtocolJob(apiKey, job.externalId, meta.claimId, { type, url });
    notes.push(`${label} deliver: ${delivered.detail}`);
    if (delivered.ok) {
      await updateJobProgress({
        userId,
        platformSlug: "workprotocol",
        externalId: job.externalId,
        status: "submitted",
        paymentStatus: "pending_review",
        acceptance: `${acceptance};delivered`,
        error: "",
        logLine: `${delivered.detail} url=${url}`,
      });
      return { notes, submitted: true, paid: false };
    }
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      status: "working",
      acceptance,
      error: delivered.detail,
      logLine: delivered.detail,
    });
    return { notes, submitted: false, paid: false };
  }

  if (action === "await_review") {
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      status: "submitted",
      paymentStatus: "pending_review",
      acceptance: job.acceptance || `platform=${live.status} awaiting verification`,
      logLine: "Delivery on platform. Payment not counted until status=completed.",
    });
    notes.push(`${label}: awaiting verification — payment not booked.`);
    return { notes, submitted: true, paid: false };
  }

  if (action === "verify_payment") {
    // Book only when WorkProtocol reports completed — do not invent escrow release.
    const source = `workprotocol completed ${job.externalId}`;
    const booked = await recordConfirmedRevenue({
      userId,
      platformSlug: "workprotocol",
      jobId: job.id,
      amountUsd: job.payoutUsd,
      source,
      note: `Verified WorkProtocol completion for ${job.externalId}`,
    });
    await updateJobProgress({
      userId,
      platformSlug: "workprotocol",
      externalId: job.externalId,
      status: "paid",
      paymentStatus: "paid",
      acceptance: source,
      logLine: booked ? `Verified revenue recorded (${source})` : "Revenue already on ledger.",
    });
    notes.push(`${label}: paid and verified (${source}).`);
    return { notes, submitted: true, paid: true };
  }

  return { notes, submitted: false, paid: false };
}

export function sporeDeliverableStale(job: JobRow, category: string): boolean {
  const blob = `${job.testsNotes} ${job.submission}`.slice(0, 4000);
  const title = String(job.title || "");
  if ((category === "technical_translation" || /translat/i.test(title)) && /endpoint sections|FastAPI app module/i.test(blob)) {
    return true;
  }
  if ((category === "api_test_generation" || /pytest/i.test(title)) && /endpoint sections|Sales dashboard/i.test(blob) && !/pytest/i.test(blob)) {
    return true;
  }
  return false;
}

async function advanceSporeJob(
  userId: string,
  job: JobRow,
  agentId: string | null,
): Promise<{ notes: string[]; submitted: boolean; paid: boolean }> {
  const notes: string[] = [];
  const label = `Spore ${job.externalId}`;
  const cap = sporeCanComplete({
    title: job.title,
    description: job.description,
    requirements: [],
  });
  const stale = sporeDeliverableStale(job, cap.category);
  let submission = job.submission;
  let testsNotes = job.testsNotes;
  let workNotes = job.workNotes;

  if (!qaPassed(job) || !job.submission || stale) {
    const work = executeSkillFitWork({
      title: job.title,
      description: job.description,
      category: cap.ok ? cap.category : undefined,
    });
    notes.push(`${label}: performed ${work.category} — ${work.testsNotes}${stale ? " (replaced mismatched artifact)" : ""}`);
    await updateJobProgress({
      userId,
      platformSlug: "sporeagent",
      externalId: job.externalId,
      status: work.ok ? "testing" : "failed",
      workNotes: work.approach,
      testsNotes: work.testsNotes,
      submission: work.ok ? work.deliverable.slice(0, 12000) : job.submission,
      startedAt: job.startedAt || new Date().toISOString(),
      error: work.ok ? "" : work.testsNotes,
      logLine: work.ok ? `Deliverable + QA: ${work.testsNotes}` : `QA failed: ${work.testsNotes}`,
    });
    if (!work.ok) return { notes, submitted: false, paid: false };
    submission = work.deliverable;
    testsNotes = work.testsNotes;
    workNotes = work.approach;
  }

  if (!agentId) {
    notes.push(`${label}: no Spore agent id — cannot deliver. Not inventing one here.`);
    await updateJobProgress({
      userId,
      platformSlug: "sporeagent",
      externalId: job.externalId,
      status: "working",
      error: "Spore agent id missing",
      logLine: "Work ready. Agent id required to deliver.",
    });
    return { notes, submitted: false, paid: false };
  }

  const live = await getSporeTask(job.externalId);
  notes.push(`${label}: ${live.detail} status=${live.task?.status || "?"} assigned=${live.task?.assigned_agent_id || "none"}`);
  const mine = live.task?.assigned_agent_id === agentId;
  const already = (live.task?.deliveries || []).some((d) => d.agent_id === agentId);

  if (already || /completed|delivered|submitted/i.test(String(live.task?.status || ""))) {
    await updateJobProgress({
      userId,
      platformSlug: "sporeagent",
      externalId: job.externalId,
      status: "submitted",
      paymentStatus: "pending_review",
      acceptance: `Spore status=${live.task?.status} deliveries=${live.task?.deliveries?.length ?? 0}`,
      logLine: "Submission present on Spore. Payment not booked (no verified payout).",
    });
    notes.push(`${label}: submission recorded on Spore — payment not verified.`);
    return { notes, submitted: true, paid: false };
  }

  const delivered = await deliverSporeWork({
    taskId: job.externalId,
    agentId,
    result: submission.slice(0, 20000),
  });
  if (delivered.ok) {
    notes.push(`${label} deliver: ${delivered.detail}`);
    await updateJobProgress({
      userId,
      platformSlug: "sporeagent",
      externalId: job.externalId,
      status: "submitted",
      paymentStatus: "pending_review",
      acceptance: delivered.detail,
      error: "",
      workNotes,
      testsNotes,
      submission: submission.slice(0, 12000),
      logLine: delivered.detail,
    });
    return { notes, submitted: true, paid: false };
  }

  const platformGap = Boolean(delivered.platformMissing);
  await updateJobProgress({
    userId,
    platformSlug: "sporeagent",
    externalId: job.externalId,
    status: "working",
    paymentStatus: platformGap ? "marketplace_unavailable" : "none",
    acceptance: platformGap
      ? "Work and QA ready. Queued until Spore marketplace submit is available."
      : mine
        ? delivered.detail
        : `platform=${live.task?.status || "open"} waiting for poster to assign bid`,
    error: platformGap ? "" : delivered.detail,
    workNotes,
    testsNotes,
    submission: submission.slice(0, 12000),
    logLine: platformGap ? "Queued — Spore marketplace submit not offered yet." : delivered.detail,
  });
  notes.push(
    platformGap
      ? `${label}: work+QA ready; Spore submit not offered on hosted API. Queued, not paid.`
      : mine
        ? `${label}: assigned but deliver failed (not marked paid).`
        : `${label}: work+QA ready; marketplace deliver not confirmed (${delivered.detail.slice(0, 120)}).`,
  );
  return { notes, submitted: false, paid: false };
}
