/**
 * Accept/bid → execute → verify → submit → status for skill-fit opportunities.
 */
import { sporeCanComplete } from "./policy";
import { executeSkillFitWork, buyerCommsPolicy } from "./execute-work";
import {
  acceptSporeBid,
  deliverSporeWork,
  getSporeTask,
  listOpenSporeTasks,
  placeSporeBid,
  registerSporeAgent,
  type SporeTask,
} from "./sporeagent";
import {
  heartbeatMoltAgent,
  listOpenMoltJobs,
  moltJobReject,
  placeMoltBid,
  startMoltJob,
  submitMoltWork,
  verifyMoltJobsKey,
  type MoltJob,
} from "./moltjobs";
import { upsertJobRow } from "./persist";
import type { EarningsRecord } from "./store";
import { evaluateProfit, MOLTJOBS_PLATFORM_FEE_RATE, SPORE_UNKNOWN_FEE_RATE } from "./profit";

export type PipelineProofStep = {
  at: string;
  step: string;
  ok: boolean;
  detail: string;
};

function now() {
  return new Date().toISOString();
}

function step(name: string, ok: boolean, detail: string): PipelineProofStep {
  return { at: now(), step: name, ok, detail };
}

export async function ensureSporeAgent(rec: EarningsRecord): Promise<{
  rec: EarningsRecord;
  agentId: string | null;
  notes: string[];
}> {
  const notes: string[] = [];
  if (rec.sporeAgentId) return { rec, agentId: rec.sporeAgentId, notes };
  const reg = await registerSporeAgent();
  notes.push(reg.detail);
  if (reg.ok && reg.agentId) {
    rec.sporeAgentId = reg.agentId;
    rec.state.connections.sporeagent = { ok: true, detail: reg.detail, agentId: reg.agentId };
  }
  return { rec, agentId: reg.agentId, notes };
}

export async function runSporeJobPipeline(input: {
  userId: string;
  rec: EarningsRecord;
  task: SporeTask;
  /** When true, also attempt accept-bid if we posted the task (usually false). */
  tryAccept?: boolean;
}): Promise<{ proof: PipelineProofStep[]; status: string; notes: string[] }> {
  const proof: PipelineProofStep[] = [];
  const notes: string[] = [];
  const { userId, task } = input;
  let rec = input.rec;

  proof.push(step("discovered", true, `Spore task ${task.id}: ${task.title}`));

  const cap = sporeCanComplete({
    title: task.title,
    description: task.description || "",
    requirements: task.requirements || [],
  });
  if (!cap.ok) {
    proof.push(step("qualified", false, cap.reasons.join(" · ")));
    await upsertJobRow({
      userId,
      platformSlug: "sporeagent",
      externalId: task.id,
      title: task.title,
      description: task.description || "",
      payoutUsd: Number(task.budget_usd || 0),
      status: "rejected",
      rejectCategory: "capability_mismatch",
      rejectReason: cap.missingCapabilities.join("; ") || cap.reasons.join(" "),
      logLine: `Rejected — ${cap.missingCapabilities[0] || cap.reasons[0]}`,
    });
    return { proof, status: "rejected", notes };
  }
  proof.push(step("qualified", true, `Skill family ${cap.category}`));

  const ensured = await ensureSporeAgent(rec);
  rec = ensured.rec;
  notes.push(...ensured.notes);
  const agentId = ensured.agentId;
  if (!agentId) {
    proof.push(step("accepted_bid", false, "No Spore agent id after register attempt"));
    return { proof, status: "evaluating", notes };
  }

  const amount = Math.max(5, Math.round(Number(task.budget_usd || 10) * 0.9));
  const workPreview = executeSkillFitWork({
    title: task.title,
    description: task.description || "",
    requirements: task.requirements,
    category: cap.category,
  });
  const bid = await placeSporeBid({
    taskId: task.id,
    agentId,
    amountUsd: amount,
    approach: workPreview.approach,
  });
  proof.push(step("accepted_bid", bid.ok, bid.detail));
  notes.push(bid.detail);
  if (!bid.ok) {
    await upsertJobRow({
      userId,
      platformSlug: "sporeagent",
      externalId: task.id,
      title: task.title,
      description: task.description || "",
      payoutUsd: Number(task.budget_usd || 0),
      status: "rejected",
      rejectReason: bid.detail,
      rejectCategory: "platform_error",
      logLine: bid.detail,
    });
    return { proof, status: "rejected", notes };
  }

  if (input.tryAccept && bid.bidId) {
    const acc = await acceptSporeBid(task.id, bid.bidId);
    proof.push(step("poster_assign", acc.ok, acc.detail));
    notes.push(acc.detail);
  }

  const work = workPreview.ok
    ? workPreview
    : executeSkillFitWork({
        title: task.title,
        description: task.description || "",
        requirements: task.requirements,
        category: cap.category,
      });
  proof.push(step("executed", work.ok, work.testsNotes));
  if (!work.ok) {
    await upsertJobRow({
      userId,
      platformSlug: "sporeagent",
      externalId: task.id,
      title: task.title,
      description: task.description || "",
      payoutUsd: Number(task.budget_usd || 0),
      status: "failed",
      workNotes: work.reasons.join(" "),
      testsNotes: work.testsNotes,
      logLine: `Execute failed — ${work.testsNotes}`,
    });
    return { proof, status: "failed", notes };
  }
  proof.push(step("tested", true, work.testsNotes));

  const detail = await getSporeTask(task.id);
  const assigned = detail.task?.assigned_agent_id === agentId || detail.task?.status === "assigned";
  const deliver = await deliverSporeWork({
    taskId: task.id,
    agentId,
    result: work.deliverable,
  });
  proof.push(step("submitted", deliver.ok, deliver.detail));
  notes.push(deliver.detail);

  const status = deliver.ok ? "submitted" : assigned ? "working" : "accepted";
  const profit = evaluateProfit({
    payoutUsd: Number(task.budget_usd || 0),
    feeRate: SPORE_UNKNOWN_FEE_RATE,
    estimatedComputeUsd: cap.computeUsd,
    successProbability: cap.successProbability,
    limits: rec.state.limits,
    remainingDailySpendUsd: 999,
  });

  await upsertJobRow({
    userId,
    platformSlug: "sporeagent",
    externalId: task.id,
    title: task.title,
    description: task.description || "",
    payoutUsd: profit.payoutUsd,
    estimatedCostUsd: profit.estimatedComputeUsd,
    expectedProfitUsd: profit.expectedNetUsd,
    status,
    workNotes: `${work.approach} | bid=${bid.bidId || "n/a"}`,
    testsNotes: work.testsNotes,
    submission: work.deliverable.slice(0, 8000),
    paymentStatus: deliver.ok ? "pending_review" : "none",
    logLine: proof.map((p) => `${p.step}:${p.ok ? "ok" : "no"}`).join(" → "),
  });

  const refreshed = await getSporeTask(task.id);
  proof.push(
    step(
      "platform_status",
      refreshed.ok,
      `Spore status=${refreshed.task?.status || "?"} assigned=${refreshed.task?.assigned_agent_id || "none"} deliveries=${refreshed.task?.deliveries?.length ?? 0}`,
    ),
  );

  return { proof, status, notes };
}

export async function runMoltJobPipeline(input: {
  userId: string;
  rec: EarningsRecord;
  job: MoltJob;
}): Promise<{ proof: PipelineProofStep[]; status: string; notes: string[] }> {
  const proof: PipelineProofStep[] = [];
  const notes: string[] = [];
  const { userId, rec, job } = input;
  proof.push(step("discovered", true, `Molt job ${job.id}: ${job.title}`));

  const hard = moltJobReject(job);
  if (hard) {
    proof.push(step("qualified", false, hard.reason));
    return { proof, status: "rejected", notes: [hard.reason] };
  }

  const work = executeSkillFitWork({ title: job.title, description: job.description });
  // Buyer-comms jobs still blocked by hard reject above; remaining are skill work.
  const comms = buyerCommsPolicy(job.description);
  if (!comms.autonomous && /contact|outreach|email/i.test(job.description)) {
    proof.push(step("qualified", false, comms.reason));
    return { proof, status: "rejected", notes: [comms.reason] };
  }

  if (!work.ok) {
    proof.push(step("qualified", false, work.testsNotes));
    return { proof, status: "rejected", notes: [work.testsNotes] };
  }
  proof.push(step("qualified", true, work.category));

  if (!rec.moltjobsApiKey) {
    proof.push(step("accepted_bid", false, "MoltJobs API key missing"));
    return { proof, status: "evaluating", notes: ["Missing mj_live_ key"] };
  }

  const verified = await verifyMoltJobsKey(rec.moltjobsApiKey);
  if (verified.agentId) await heartbeatMoltAgent(rec.moltjobsApiKey, verified.agentId);

  const bid = await placeMoltBid(rec.moltjobsApiKey, job, verified.agentId);
  proof.push(step("accepted_bid", bid.ok, bid.detail));
  notes.push(bid.detail);
  if (!bid.ok) {
    await upsertJobRow({
      userId,
      platformSlug: "moltjobs",
      externalId: job.id,
      title: job.title,
      description: job.description,
      payoutUsd: job.budgetUsd,
      status: "rejected",
      rejectReason: bid.detail,
      rejectCategory: bid.needsCert ? "certification_required" : "platform_error",
      logLine: bid.detail,
    });
    return { proof, status: "rejected", notes };
  }

  proof.push(step("executed", true, work.testsNotes));
  proof.push(step("tested", true, work.testsNotes));

  const started = await startMoltJob(rec.moltjobsApiKey, job.id);
  proof.push(step("start", started.ok, started.detail));
  notes.push(started.detail);

        const submitted = await submitMoltWork(rec.moltjobsApiKey, job.id, {
          summary: work.approach,
          output: work.deliverable.slice(0, 12000),
          testsNotes: work.testsNotes,
        });
  proof.push(step("submitted", submitted.ok, submitted.detail));
  notes.push(submitted.detail);

  const status = submitted.ok ? "submitted" : started.ok ? "working" : "accepted";
  const profit = evaluateProfit({
    payoutUsd: job.budgetUsd,
    feeRate: MOLTJOBS_PLATFORM_FEE_RATE,
    estimatedComputeUsd: 1.5,
    successProbability: 0.45,
    limits: rec.state.limits,
    remainingDailySpendUsd: 999,
  });

  await upsertJobRow({
    userId,
    platformSlug: "moltjobs",
    externalId: job.id,
    title: job.title,
    description: job.description,
    payoutUsd: profit.payoutUsd,
    estimatedCostUsd: profit.estimatedComputeUsd,
    expectedProfitUsd: profit.expectedNetUsd,
    status,
    workNotes: work.approach,
    testsNotes: work.testsNotes,
    submission: work.deliverable.slice(0, 8000),
    paymentStatus: submitted.ok ? "pending_review" : "none",
    logLine: proof.map((p) => `${p.step}:${p.ok ? "ok" : "no"}`).join(" → "),
  });

  return { proof, status, notes };
}

export async function runSkillFitPipelines(
  userId: string,
  rec: EarningsRecord,
  opts?: { spore?: boolean; molt?: boolean },
): Promise<{
  notes: string[];
  proofs: Array<{ platform: string; id: string; proof: PipelineProofStep[]; status: string }>;
  rec: EarningsRecord;
}> {
  const notes: string[] = [];
  const proofs: Array<{ platform: string; id: string; proof: PipelineProofStep[]; status: string }> = [];
  const doSpore = opts?.spore !== false;
  const doMolt = opts?.molt === true;

  const ensured = await ensureSporeAgent(rec);
  rec = ensured.rec;
  notes.push(...ensured.notes);

  if (doSpore) {
    const spore = await listOpenSporeTasks();
    notes.push(spore.detail);
    let sporeRuns = 0;
    for (const task of spore.tasks) {
      if (sporeRuns >= 2) break;
      const cap = sporeCanComplete({
        title: task.title,
        description: task.description || "",
        requirements: task.requirements || [],
      });
      if (!cap.ok) continue;
      const safe =
        /documentation|dashboard|pytest|translate|csv|microservice|pipeline|react|normalize|iso date/i.test(
          task.title,
        ) && !/solidity|resnet|fine-?tune|scrape & structure 500/i.test(task.title);
      if (!safe) continue;
      const result = await runSporeJobPipeline({ userId, rec, task });
      proofs.push({ platform: "sporeagent", id: task.id, proof: result.proof, status: result.status });
      notes.push(...result.notes);
      sporeRuns += 1;
    }
    if (sporeRuns === 0) {
      // Fallback: first skill-fit non-out-of-scope job
      for (const task of spore.tasks) {
        const cap = sporeCanComplete({
          title: task.title,
          description: task.description || "",
          requirements: task.requirements || [],
        });
        if (!cap.ok) continue;
        if (/solidity|resnet|fine-?tune/i.test(task.title)) continue;
        const result = await runSporeJobPipeline({ userId, rec, task });
        proofs.push({ platform: "sporeagent", id: task.id, proof: result.proof, status: result.status });
        notes.push(...result.notes);
        break;
      }
    }
  }

  if (doMolt && rec.moltjobsApiKey) {
    const molt = await listOpenMoltJobs();
    notes.push(molt.detail);
    for (const job of molt.jobs.slice(0, 1)) {
      const result = await runMoltJobPipeline({ userId, rec, job });
      proofs.push({ platform: "moltjobs", id: job.id, proof: result.proof, status: result.status });
      notes.push(...result.notes);
    }
  } else if (doMolt) {
    notes.push("MoltJobs pipeline skipped — no API key.");
  }

  return { notes, proofs, rec };
}
