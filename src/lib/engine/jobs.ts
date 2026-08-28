// ---------------------------------------------------------------------------
// Production jobs — the record that outlives the browser.
//
// A commercial takes ten minutes to make: a couple of minutes of cutaways, up
// to eight for the presenter, then assembly. The old shape asked the customer's
// tab to stay open for all of it and to be the only place the finished film
// ever existed. Close the laptop at minute seven and the tokens were spent, the
// render was done, and there was nothing to show for it.
//
// So the work is written down before it starts. Everything the producer needs
// is in the row: the board to shoot, the account to charge and file it under,
// and how far it has got. A worker picks the row up and finishes it. Nobody has
// to be watching.
// ---------------------------------------------------------------------------

import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import type { Storyboard } from "@/lib/director/types";

export type JobStatus = "queued" | "shooting" | "filming" | "assembling" | "completed" | "failed";

export type Job = {
  id: string;
  userId: string;
  featureSlug: string;
  title: string;
  status: JobStatus;
  phase: string;
  board: Storyboard;
  shoot: Record<string, unknown> | null;
  narrationUrl: string | null;
  mediaId: string | null;
  mediaUrl: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  finishedAt: string | null;
};

/**
 * A job claimed longer ago than this is assumed abandoned — the worker was
 * killed mid-production — and may be picked up again. Generous, because the
 * presenter render alone can legitimately take eight minutes of silence.
 */
const STALE_MINUTES = 25;

/** How many times a job may be retried before it is left failed. */
const MAX_ATTEMPTS = 3;

async function q() {
  if (!dbConfigured()) return null;
  const query = await sqlAsync();
  if (!query || !(await ensureSchema())) return null;
  return query;
}

type Row = {
  id: string;
  user_id: string;
  feature_slug: string;
  title: string;
  status: string;
  phase: string;
  board: string;
  shoot: string | null;
  narration_url: string | null;
  media_id: string | null;
  media_url: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  finished_at: string | null;
};

function hydrate(row: Row): Job {
  const parse = <T,>(v: string | null, fallback: T): T => {
    if (!v) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id,
    userId: row.user_id,
    featureSlug: row.feature_slug,
    title: row.title,
    status: row.status as JobStatus,
    phase: row.phase,
    board: parse(row.board, {} as Storyboard),
    shoot: parse<Record<string, unknown> | null>(row.shoot, null),
    narrationUrl: row.narration_url,
    mediaId: row.media_id,
    mediaUrl: row.media_url,
    error: row.error,
    attempts: Number(row.attempts ?? 0),
    createdAt: row.created_at,
    finishedAt: row.finished_at,
  };
}

export async function enqueue(opts: {
  userId: string;
  board: Storyboard;
  featureSlug?: string;
}): Promise<Job | null> {
  const query = await q();
  if (!query) return null;
  const id = randomUUID();
  await query`
    INSERT INTO engine_jobs (id, user_id, feature_slug, title, status, phase, board)
    VALUES (${id}, ${opts.userId}, ${opts.featureSlug ?? ""},
            ${String(opts.board?.title ?? "Commercial").slice(0, 200)},
            'queued', 'Queued', ${JSON.stringify(opts.board)})`;
  return getJob(id);
}

export async function getJob(id: string): Promise<Job | null> {
  const query = await q();
  if (!query) return null;
  const rows = (await query`SELECT * FROM engine_jobs WHERE id = ${id}`) as unknown as Row[];
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function jobsFor(userId: string, limit = 20): Promise<Job[]> {
  const query = await q();
  if (!query) return [];
  const rows = (await query`
    SELECT * FROM engine_jobs WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}`) as unknown as Row[];
  return rows.map(hydrate);
}

/**
 * Take the next job that needs work.
 *
 * Claiming is a conditional UPDATE rather than a SELECT followed by an UPDATE,
 * so two workers racing for the same row cannot both win: the second one's
 * WHERE clause no longer matches. Jobs whose claim has gone stale are eligible
 * again, which is what makes a killed worker recoverable rather than terminal.
 */
export async function claimNext(): Promise<Job | null> {
  const query = await q();
  if (!query) return null;

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_MINUTES * 60_000).toISOString();

  // A single conditional UPDATE, not a SELECT then an UPDATE. Two workers
  // racing for the same row cannot both win: once the first has stamped
  // claimed_at, the second's subquery no longer selects it.
  const nowIso = now.toISOString();
  const claimed = (await query`
    UPDATE engine_jobs
       SET status = 'shooting',
           phase = 'Starting the shoot',
           claimed_at = ${nowIso},
           attempts = attempts + 1,
           updated_at = ${nowIso}
     WHERE id = (
       SELECT id FROM engine_jobs
        WHERE attempts < ${MAX_ATTEMPTS}
          AND (
            status = 'queued'
            OR (status IN ('shooting','filming','assembling')
                AND (claimed_at IS NULL OR claimed_at < ${staleBefore}))
          )
        ORDER BY created_at
        LIMIT 1
     )
     RETURNING *`) as unknown as Row[];

  return claimed[0] ? hydrate(claimed[0]) : null;
}

export async function advance(
  id: string,
  patch: {
    status?: JobStatus;
    phase?: string;
    shoot?: unknown;
    narrationUrl?: string | null;
    mediaId?: string | null;
    mediaUrl?: string | null;
    error?: string | null;
  },
): Promise<void> {
  const query = await q();
  if (!query) return;
  const now = new Date().toISOString();
  const finished = patch.status === "completed" || patch.status === "failed" ? now : null;

  await query`
    UPDATE engine_jobs
       SET status        = COALESCE(${patch.status ?? null}, status),
           phase         = COALESCE(${patch.phase ?? null}, phase),
           shoot         = COALESCE(${patch.shoot === undefined ? null : JSON.stringify(patch.shoot)}, shoot),
           narration_url = COALESCE(${patch.narrationUrl ?? null}, narration_url),
           media_id      = COALESCE(${patch.mediaId ?? null}, media_id),
           media_url     = COALESCE(${patch.mediaUrl ?? null}, media_url),
           error         = ${patch.error === undefined ? null : patch.error},
           claimed_at    = ${now},
           updated_at    = ${now},
           finished_at   = COALESCE(${finished}, finished_at)
     WHERE id = ${id}`;
}
