// ---------------------------------------------------------------------------
// Command Center production jobs — a thin, additive layer over the existing
// engine_jobs queue (src/lib/engine/jobs.ts), which this file only calls, and
// never edits: engine_jobs is real, pre-existing, customer-facing
// infrastructure with its own worker (scripts/engine-worker.mjs) and is
// explicitly out of scope to alter.
//
// engine_jobs.user_id is a real FK into `users` — there is no customer
// account behind the admin session (ADMIN_PASSWORD is a separate, single-
// session auth system, see src/lib/admin-auth.ts), so Command Center
// productions run under one fixed system user, created on first use.
// ---------------------------------------------------------------------------

import { enqueue, getJob, jobsFor, advance, type Job } from "@/lib/engine/jobs";
import type { Storyboard } from "@/lib/director/types";
import { ensureAdminSystemUser } from "@/lib/ai/admin-account";

export type ProduceResult = { ok: true; jobId: string; status: string } | { ok: false; error: string };

/** Hand an approved Commercial Director board to the real production queue —
 *  same enqueue() a signed-in customer's "Produce" button calls. */
export async function produceCommercial(board: Storyboard, featureSlug = "commercial-director"): Promise<ProduceResult> {
  if (!Array.isArray(board?.scenes) || board.scenes.length === 0) {
    return { ok: false, error: "There is no board to produce — generate a direction first." };
  }
  const userId = await ensureAdminSystemUser();
  if (!userId) {
    return { ok: false, error: "Productions need a database. Set DATABASE_URL, or run where the disk is writable." };
  }
  const job = await enqueue({ userId, board, featureSlug });
  if (!job) return { ok: false, error: "Could not queue the production." };
  return { ok: true, jobId: job.id, status: job.status };
}

function summarize(job: Job) {
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    phase: job.phase,
    mediaUrl: job.mediaUrl,
    error: job.error,
    attempts: job.attempts,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
  };
}

/** Look up one job, or list the Command Center's recent productions. */
export async function checkJobStatus(jobId?: string): Promise<{ ok: true; job?: ReturnType<typeof summarize>; jobs?: ReturnType<typeof summarize>[] } | { ok: false; error: string }> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };

  if (jobId) {
    const job = await getJob(jobId);
    if (!job || job.userId !== userId) return { ok: false, error: "No such job." };
    return { ok: true, job: summarize(job) };
  }
  const jobs = await jobsFor(userId, 10);
  return { ok: true, jobs: jobs.map(summarize) };
}

/** Requeue a failed job. Does not bypass the worker's own attempt cap — it
 *  only resets status/error so claimNext() (engine/jobs.ts) picks it up
 *  again on its normal terms; the worker still enforces MAX_ATTEMPTS. */
export async function retryJob(jobId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };

  const job = await getJob(jobId);
  if (!job || job.userId !== userId) return { ok: false, error: "No such job." };
  if (job.status !== "failed") return { ok: false, error: `Job is ${job.status}, not failed — nothing to retry.` };

  await advance(job.id, { status: "queued", phase: "Queued (retried from Command Center)", error: null });
  return { ok: true };
}
