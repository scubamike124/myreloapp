import { randomUUID } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { PLATFORM_CATALOG } from "./catalog";
import type { ApprovalRow, CenterJobStatus, JobRow, LedgerRow, PlatformRow } from "./center-types";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

function cents(n: number) {
  return Math.round(n * 100);
}

function usd(centsVal: unknown) {
  return Math.round(Number(centsVal || 0)) / 100;
}

export async function seedPlatforms(userId: string): Promise<void> {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  for (const p of PLATFORM_CATALOG) {
    const id = randomUUID();
    await q`
      INSERT INTO amber_earnings_platforms (
        id, user_id, slug, name, website, status, connected, automation_allowed, access_methods,
        available_jobs, research_json, score_json, reject_reason, reject_category, last_scan_at
      ) VALUES (
        ${id}, ${userId}, ${p.slug}, ${p.name}, ${p.website}, ${p.defaultStatus},
        ${p.defaultStatus === "connected" ? 1 : 0}, ${p.automationAllowed}, ${p.accessMethods},
        ${0}, ${JSON.stringify(p.research)}, ${JSON.stringify(p.score)},
        ${p.rejectReason || ""}, ${p.rejectCategory || ""}, ${now}
      )
      ON CONFLICT (user_id, slug) DO UPDATE SET
        name = EXCLUDED.name,
        website = EXCLUDED.website,
        automation_allowed = EXCLUDED.automation_allowed,
        access_methods = EXCLUDED.access_methods,
        research_json = EXCLUDED.research_json,
        score_json = EXCLUDED.score_json
    `;
  }
}

export async function updatePlatform(
  userId: string,
  slug: string,
  patch: {
    status?: string;
    connected?: boolean;
    availableJobs?: number;
    activeJobs?: number;
    completedJobs?: number;
    attention?: string;
    lastScanAt?: string;
    lastJobAt?: string;
    paused?: boolean;
    revenueCents?: number;
    expensesCents?: number;
    pendingPayoutCents?: number;
  },
): Promise<void> {
  const q = await db();
  if (!q) return;
  const rows = (await q`SELECT * FROM amber_earnings_platforms WHERE user_id = ${userId} AND slug = ${slug}`) as Record<
    string,
    unknown
  >[];
  const cur = rows[0];
  if (!cur) return;
  const connected = patch.connected === undefined ? Number(cur.connected) : patch.connected ? 1 : 0;
  let status = patch.status ?? String(cur.status);
  if (patch.paused === false && status === "paused") {
    status = connected ? "connected" : "needs_mike";
  }
  const available = patch.availableJobs ?? Number(cur.available_jobs);
  const active = patch.activeJobs ?? Number(cur.active_jobs);
  const completed = patch.completedJobs ?? Number(cur.completed_jobs);
  const attention = patch.attention ?? String(cur.attention || "");
  const lastScan = patch.lastScanAt ?? (cur.last_scan_at as string | null);
  const lastJob = patch.lastJobAt ?? (cur.last_job_at as string | null);
  const paused = patch.paused === undefined ? Number(cur.paused) : patch.paused ? 1 : 0;
  const revenue = patch.revenueCents ?? Number(cur.revenue_cents);
  const expenses = patch.expensesCents ?? Number(cur.expenses_cents);
  const pending = patch.pendingPayoutCents ?? Number(cur.pending_payout_cents);
  await q`
    UPDATE amber_earnings_platforms SET
      status = ${status},
      connected = ${connected},
      available_jobs = ${available},
      active_jobs = ${active},
      completed_jobs = ${completed},
      attention = ${attention},
      last_scan_at = ${lastScan},
      last_job_at = ${lastJob},
      paused = ${paused},
      revenue_cents = ${revenue},
      expenses_cents = ${expenses},
      pending_payout_cents = ${pending}
    WHERE user_id = ${userId} AND slug = ${slug}
  `;
}

export async function upsertJobRow(input: {
  userId: string;
  platformSlug: string;
  externalId: string;
  title: string;
  customer?: string;
  description?: string;
  payoutUsd: number;
  estimatedCostUsd?: number;
  expectedProfitUsd?: number;
  status: CenterJobStatus;
  worker?: string;
  workNotes?: string;
  testsNotes?: string;
  rejectReason?: string;
  rejectCategory?: string;
  paymentStatus?: string;
  submission?: string;
  acceptance?: string;
  error?: string;
  logLine?: string;
}): Promise<void> {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  const existing = (await q`
    SELECT id, log_json, discovered_at FROM amber_earnings_jobs
    WHERE user_id = ${input.userId} AND platform_slug = ${input.platformSlug} AND external_id = ${input.externalId}
  `) as { id: string; log_json: string; discovered_at: string }[];
  let log: string[] = [];
  try {
    log = existing[0]?.log_json ? (JSON.parse(existing[0].log_json) as string[]) : [];
  } catch {
    log = [];
  }
  if (input.logLine) log = [...log.slice(-40), `${now} ${input.logLine}`];
  const id = existing[0]?.id || randomUUID();
  const discovered = existing[0]?.discovered_at || now;
  await q`
    INSERT INTO amber_earnings_jobs (
      id, user_id, platform_slug, external_id, title, customer, description,
      payout_cents, estimated_cost_cents, expected_profit_cents, actual_cost_cents, actual_profit_cents,
      status, worker, discovered_at, work_notes, tests_notes, submission, acceptance,
      payment_status, error, reject_reason, reject_category, log_json, updated_at
    ) VALUES (
      ${id}, ${input.userId}, ${input.platformSlug}, ${input.externalId}, ${input.title},
      ${input.customer || ""}, ${input.description || ""}, ${cents(input.payoutUsd)},
      ${cents(input.estimatedCostUsd || 0)}, ${cents(input.expectedProfitUsd || 0)}, ${0}, ${0},
      ${input.status}, ${input.worker || "cloud"}, ${discovered}, ${input.workNotes || ""},
      ${input.testsNotes || ""}, ${input.submission || ""}, ${input.acceptance || ""}, ${input.paymentStatus || "none"}, ${input.error || ""},
      ${input.rejectReason || ""}, ${input.rejectCategory || ""}, ${JSON.stringify(log)}, ${now}
    )
    ON CONFLICT (user_id, platform_slug, external_id) DO UPDATE SET
      title = EXCLUDED.title,
      customer = EXCLUDED.customer,
      description = EXCLUDED.description,
      payout_cents = EXCLUDED.payout_cents,
      estimated_cost_cents = EXCLUDED.estimated_cost_cents,
      expected_profit_cents = EXCLUDED.expected_profit_cents,
      status = EXCLUDED.status,
      work_notes = EXCLUDED.work_notes,
      tests_notes = EXCLUDED.tests_notes,
      submission = EXCLUDED.submission,
      acceptance = EXCLUDED.acceptance,
      payment_status = EXCLUDED.payment_status,
      error = EXCLUDED.error,
      reject_reason = EXCLUDED.reject_reason,
      reject_category = EXCLUDED.reject_category,
      log_json = EXCLUDED.log_json,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function setJobStatus(
  userId: string,
  jobId: string,
  status: CenterJobStatus,
  extra?: { error?: string; logLine?: string },
): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const rows = (await q`SELECT id, log_json FROM amber_earnings_jobs WHERE id = ${jobId} AND user_id = ${userId}`) as {
    id: string;
    log_json: string;
  }[];
  if (!rows[0]) return false;
  let log: string[] = [];
  try {
    log = JSON.parse(rows[0].log_json || "[]") as string[];
  } catch {
    log = [];
  }
  const now = new Date().toISOString();
  if (extra?.logLine) log.push(`${now} ${extra.logLine}`);
  await q`
    UPDATE amber_earnings_jobs SET
      status = ${status},
      error = ${extra?.error || ""},
      log_json = ${JSON.stringify(log)},
      updated_at = ${now}
    WHERE id = ${jobId} AND user_id = ${userId}
  `;
  return true;
}

export async function acquireLock(userId: string, lockKey: string, ttlMs = 120_000): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const now = Date.now();
  await q`DELETE FROM amber_earnings_locks WHERE expires_at < ${new Date(now).toISOString()}`;
  try {
    await q`
      INSERT INTO amber_earnings_locks (lock_key, user_id, expires_at)
      VALUES (${lockKey}, ${userId}, ${new Date(now + ttlMs).toISOString()})
    `;
    return true;
  } catch {
    return false;
  }
}

export async function openApproval(input: {
  userId: string;
  platformSlug: string;
  title: string;
  detail: string;
  actionUrl: string;
  kind: string;
}): Promise<void> {
  const q = await db();
  if (!q) return;
  const open = (await q`
    SELECT id FROM amber_earnings_approvals
    WHERE user_id = ${input.userId} AND platform_slug = ${input.platformSlug} AND kind = ${input.kind} AND status = 'open'
  `) as { id: string }[];
  if (open[0]) return;
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_earnings_approvals (id, user_id, platform_slug, title, detail, action_url, kind, status, created_at)
    VALUES (${randomUUID()}, ${input.userId}, ${input.platformSlug}, ${input.title}, ${input.detail}, ${input.actionUrl}, ${input.kind}, 'open', ${now})
  `;
}

export async function resolveApproval(userId: string, id: string): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const now = new Date().toISOString();
  await q`
    UPDATE amber_earnings_approvals SET status = 'done', resolved_at = ${now}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  return true;
}

export async function listPlatforms(userId: string): Promise<PlatformRow[]> {
  const q = await db();
  if (!q) return [];
  const rows = (await q`
    SELECT * FROM amber_earnings_platforms WHERE user_id = ${userId} ORDER BY name
  `) as Record<string, unknown>[];
  return rows.map(mapPlatform);
}

export async function listJobs(userId: string): Promise<JobRow[]> {
  const q = await db();
  if (!q) return [];
  const rows = (await q`
    SELECT j.*, p.name AS platform_name
    FROM amber_earnings_jobs j
    LEFT JOIN amber_earnings_platforms p ON p.user_id = j.user_id AND p.slug = j.platform_slug
    WHERE j.user_id = ${userId}
    ORDER BY j.updated_at DESC
    LIMIT 300
  `) as Record<string, unknown>[];
  return rows.map(mapJob);
}

export async function listApprovals(userId: string): Promise<ApprovalRow[]> {
  const q = await db();
  if (!q) return [];
  const rows = (await q`
    SELECT * FROM amber_earnings_approvals WHERE user_id = ${userId} AND status = 'open' ORDER BY created_at DESC
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    platformSlug: String(r.platform_slug),
    title: String(r.title),
    detail: String(r.detail),
    actionUrl: String(r.action_url || ""),
    kind: String(r.kind),
    status: String(r.status),
    createdAt: String(r.created_at),
  }));
}

export async function listLedger(userId: string): Promise<LedgerRow[]> {
  const q = await db();
  if (!q) return [];
  const rows = (await q`
    SELECT * FROM amber_earnings_ledger WHERE user_id = ${userId} ORDER BY occurred_at DESC LIMIT 200
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    platformSlug: String(r.platform_slug || ""),
    jobId: r.job_id ? String(r.job_id) : null,
    kind: String(r.kind),
    amountUsd: usd(r.amount_cents),
    currency: String(r.currency || "USD"),
    confirmed: Number(r.confirmed) === 1,
    source: String(r.source || ""),
    occurredAt: String(r.occurred_at),
    note: String(r.note || ""),
  }));
}

function mapPlatform(r: Record<string, unknown>): PlatformRow {
  let research: Record<string, unknown> = {};
  let score: Record<string, number> = {};
  try {
    research = JSON.parse(String(r.research_json || "{}")) as Record<string, unknown>;
  } catch {
    research = {};
  }
  try {
    score = JSON.parse(String(r.score_json || "{}")) as Record<string, number>;
  } catch {
    score = {};
  }
  const revenue = usd(r.revenue_cents);
  const expenses = usd(r.expenses_cents);
  const connected = Number(r.connected) === 1;
  const status = String(r.status) as PlatformRow["status"];
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    website: String(r.website || ""),
    status,
    connected,
    integrationMode:
      status === "error" || status === "rejected"
        ? "BLOCKED"
        : status === "needs_mike"
          ? "SETUP_REQUIRED"
          : connected
            ? "CONNECTED"
            : "DISCOVERY_ONLY",
    automationAllowed: String(r.automation_allowed || "unknown"),
    accessMethods: String(r.access_methods || ""),
    availableJobs: Number(r.available_jobs || 0),
    activeJobs: Number(r.active_jobs || 0),
    completedJobs: Number(r.completed_jobs || 0),
    revenueUsd: revenue,
    expensesUsd: expenses,
    netProfitUsd: Math.round((revenue - expenses) * 100) / 100,
    pendingPayoutUsd: usd(r.pending_payout_cents),
    lastScanAt: r.last_scan_at ? String(r.last_scan_at) : null,
    lastJobAt: r.last_job_at ? String(r.last_job_at) : null,
    reputation: String(r.reputation || ""),
    attention: String(r.attention || ""),
    research,
    score,
    rejectReason: String(r.reject_reason || ""),
    rejectCategory: String(r.reject_category || ""),
    paused: Number(r.paused) === 1,
    capabilitySummary: "",
    capabilityBlockers: [],
    canDiscover: true,
    canAccept: false,
    canPerform: false,
    canSubmit: false,
    canTrackPayment: false,
  };
}

function mapJob(r: Record<string, unknown>): JobRow {
  let log: string[] = [];
  try {
    log = JSON.parse(String(r.log_json || "[]")) as string[];
  } catch {
    log = [];
  }
  return {
    id: String(r.id),
    platformSlug: String(r.platform_slug),
    platformName: String(r.platform_name || r.platform_slug),
    externalId: String(r.external_id),
    title: String(r.title),
    customer: String(r.customer || ""),
    description: String(r.description || ""),
    payoutUsd: usd(r.payout_cents),
    estimatedCostUsd: usd(r.estimated_cost_cents),
    expectedProfitUsd: usd(r.expected_profit_cents),
    actualCostUsd: usd(r.actual_cost_cents),
    actualProfitUsd: usd(r.actual_profit_cents),
    status: String(r.status) as CenterJobStatus,
    worker: String(r.worker || "cloud"),
    discoveredAt: String(r.discovered_at),
    startedAt: r.started_at ? String(r.started_at) : null,
    workNotes: String(r.work_notes || ""),
    testsNotes: String(r.tests_notes || ""),
    submission: String(r.submission || ""),
    acceptance: String(r.acceptance || ""),
    paymentStatus: (() => {
      const raw = String(r.payment_status || "none");
      const gap = isSporeHostedSubmitGap({
        platformSlug: String(r.platform_slug),
        error: String(r.error || ""),
        paymentStatus: raw,
        acceptance: String(r.acceptance || ""),
      });
      return gap && (raw === "none" || !raw) ? "marketplace_unavailable" : raw;
    })(),
    error: isSporeHostedSubmitGap({
      platformSlug: String(r.platform_slug),
      error: String(r.error || ""),
      paymentStatus: String(r.payment_status || ""),
      acceptance: String(r.acceptance || ""),
    })
      ? ""
      : String(r.error || ""),
    rejectReason: String(r.reject_reason || ""),
    rejectCategory: String(r.reject_category || ""),
    log: log.filter(
      (line) =>
        !/catch-all 404|hosted Next.js API has no POST|local MCP only|deliver endpoint not available/i.test(line),
    ),
    updatedAt: String(r.updated_at),
  };
}

export async function updateJobProgress(input: {
  userId: string;
  platformSlug: string;
  externalId: string;
  status?: CenterJobStatus;
  workNotes?: string;
  testsNotes?: string;
  submission?: string;
  acceptance?: string;
  paymentStatus?: string;
  error?: string;
  logLine?: string;
  startedAt?: string | null;
}): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const rows = (await q`
    SELECT * FROM amber_earnings_jobs
    WHERE user_id = ${input.userId} AND platform_slug = ${input.platformSlug} AND external_id = ${input.externalId}
    LIMIT 1
  `) as Record<string, unknown>[];
  const cur = rows[0];
  if (!cur) return false;
  let log: string[] = [];
  try {
    log = JSON.parse(String(cur.log_json || "[]")) as string[];
  } catch {
    log = [];
  }
  const now = new Date().toISOString();
  if (input.logLine) log = [...log.slice(-40), `${now} ${input.logLine}`];
  const status = input.status ?? String(cur.status);
  const started =
    input.startedAt !== undefined
      ? input.startedAt
      : cur.started_at || (status === "working" || status === "testing" ? now : null);
  await q`
    UPDATE amber_earnings_jobs SET
      status = ${status},
      work_notes = ${input.workNotes ?? String(cur.work_notes || "")},
      tests_notes = ${input.testsNotes ?? String(cur.tests_notes || "")},
      submission = ${input.submission ?? String(cur.submission || "")},
      acceptance = ${input.acceptance ?? String(cur.acceptance || "")},
      payment_status = ${input.paymentStatus ?? String(cur.payment_status || "none")},
      error = ${input.error !== undefined ? input.error : String(cur.error || "")},
      started_at = ${started},
      log_json = ${JSON.stringify(log)},
      updated_at = ${now}
    WHERE id = ${String(cur.id)}
  `;
  return true;
}

export async function recordConfirmedRevenue(input: {
  userId: string;
  platformSlug: string;
  jobId: string;
  amountUsd: number;
  source: string;
  note: string;
}): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  if (!(input.amountUsd > 0)) return false;
  const existing = (await q`
    SELECT id FROM amber_earnings_ledger
    WHERE user_id = ${input.userId} AND job_id = ${input.jobId} AND kind = 'revenue' AND confirmed = 1
    LIMIT 1
  `) as { id: string }[];
  if (existing[0]) return false;
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_earnings_ledger (
      id, user_id, platform_slug, job_id, kind, amount_cents, currency, confirmed, source, occurred_at, note
    ) VALUES (
      ${randomUUID()}, ${input.userId}, ${input.platformSlug}, ${input.jobId}, ${"revenue"},
      ${cents(input.amountUsd)}, ${"USD"}, ${1}, ${input.source}, ${now}, ${input.note}
    )
  `;
  return true;
}

export function inFlightJobStatuses(): CenterJobStatus[] {
  return ["accepted", "working", "testing", "submitted", "payment_pending"];
}

/** Spore work Amber finished but cannot submit because hosted marketplace submit is missing. */
export function isSporeHostedSubmitGap(job: {
  platformSlug?: string;
  error?: string;
  paymentStatus?: string;
  acceptance?: string;
}): boolean {
  if (job.platformSlug && job.platformSlug !== "sporeagent") return false;
  if (job.paymentStatus === "marketplace_unavailable") return true;
  return /deliver endpoint not available|hosted Next.js API has no POST|catch-all 404|local MCP only/i.test(
    `${job.error || ""} ${job.acceptance || ""}`,
  );
}

/**
 * Bid placed / deliverable ready, but poster has not assigned yet (platform still OPEN).
 * Must not freeze bids on other eligible OPEN jobs — that caused CAN BID + BLOCKED.
 */
export function isMoltWaitingAssignment(job?: {
  platformSlug?: string;
  error?: string;
  paymentStatus?: string;
  acceptance?: string;
  workNotes?: string;
}): boolean {
  if (job?.platformSlug && job.platformSlug !== "moltjobs") return false;
  const blob = `${job?.acceptance || ""} ${job?.workNotes || ""} ${job?.error || ""}`;
  return /waiting for poster to assign|waits for ASSIGNED|start\/submit waits for ASSIGNED|platform=OPEN waiting|waiting for ASSIGNED/i.test(
    blob,
  );
}

export function blocksNewAccepts(
  status: string,
  job?: {
    platformSlug?: string;
    error?: string;
    paymentStatus?: string;
    acceptance?: string;
    workNotes?: string;
  },
): boolean {
  if (!["accepted", "working", "testing"].includes(status)) return false;
  if (job && isSporeHostedSubmitGap(job)) return false;
  // Waiting on poster assignment is not Amber capacity — keep discovering/bidding.
  if (job && isMoltWaitingAssignment(job)) return false;
  return true;
}

export async function confirmedRevenueInRange(userId: string, fromIso: string): Promise<number> {
  const q = await db();
  if (!q) return 0;
  const rows = (await q`
    SELECT COALESCE(SUM(amount_cents), 0) AS t FROM amber_earnings_ledger
    WHERE user_id = ${userId} AND kind = 'revenue' AND confirmed = 1 AND occurred_at >= ${fromIso}
  `) as { t: number }[];
  return usd(rows[0]?.t);
}
