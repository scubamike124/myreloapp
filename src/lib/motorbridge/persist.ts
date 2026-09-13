/**
 * MotorBridge persistence — the boundary between normalize.ts's pure
 * in-memory NormalizedRecord and the database. Follows the same shape as
 * property-intelligence/persist.ts: `ensureSchema()` gate, `sqlAsync()`
 * driver, soft-fail-nothing writes.
 */
import { randomUUID } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import type { NormalizedRecord } from "./types";
import { isSyntheticRecord } from "./privacy";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export type SaveUploadOptions = {
  userId?: string | null;
  isTrial: boolean;
};

/** Persists one normalized ingest. Returns the row id, or null if the database is unavailable (never throws — an upload's in-memory result is still returned to the caller for the "Test My Log" preview even if persistence is down). */
export async function saveUpload(record: NormalizedRecord, opts: SaveUploadOptions): Promise<string | null> {
  const q = await db();
  if (!q) return null;

  if (await isPausedAll()) return null;

  const id = randomUUID();
  const allTelemetryRights = record.telemetrySessions.map((s) => s.rights);
  const allDiagnosticRights = record.diagnosticEvents.map((e) => e.rights);
  const firstRights = allTelemetryRights[0] ?? allDiagnosticRights[0] ?? null;
  const warnings = record.telemetrySessions.length === 0 && record.diagnosticEvents.length === 0 ? ["no sessions or events produced"] : [];

  await q`
    INSERT INTO motorbridge_uploads (
      id, user_id, connector_slug, legal_access_status, maturity, vehicle_category,
      origin_label, is_trial, is_synthetic, warnings_json, unresolved_field_count,
      record_json, rights_category, aggregate_analytics_permitted, created_at
    ) VALUES (
      ${id}, ${opts.userId ?? null}, ${record.source.connectorSlug}, ${record.source.legalAccessStatus},
      ${record.source.maturity}, ${record.vehicle.category}, ${record.source.originLabel},
      ${opts.isTrial ? 1 : 0}, ${isSyntheticRecord(record as unknown as Record<string, unknown>) ? 1 : 0},
      ${JSON.stringify(warnings)}, ${record.unresolvedFields.length},
      ${JSON.stringify(record)}, ${firstRights?.category ?? "customer_exported"},
      ${firstRights?.aggregateAnalyticsPermitted ? 1 : 0}, ${new Date().toISOString()}
    )
  `;
  return id;
}

export type UploadCounts = {
  totalUploads: number;
  byConnector: { connectorSlug: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byMaturity: { maturity: string; count: number }[];
  trialUploads: number;
  eligibleForIntelligence: number;
};

/** The real (possibly zero) counts the MotorBridge Command Center reads — never a placeholder number (§40, §50). */
export async function getUploadCounts(): Promise<UploadCounts> {
  const empty: UploadCounts = {
    totalUploads: 0,
    byConnector: [],
    byCategory: [],
    byMaturity: [],
    trialUploads: 0,
    eligibleForIntelligence: 0,
  };
  const q = await db();
  if (!q) return empty;

  const totalRows = (await q`SELECT COUNT(*) AS c FROM motorbridge_uploads`) as { c: number }[];
  const byConnectorRows = (await q`
    SELECT connector_slug AS slug, COUNT(*) AS c FROM motorbridge_uploads GROUP BY connector_slug
  `) as { slug: string; c: number }[];
  const byCategoryRows = (await q`
    SELECT vehicle_category AS category, COUNT(*) AS c FROM motorbridge_uploads GROUP BY vehicle_category
  `) as { category: string; c: number }[];
  const byMaturityRows = (await q`
    SELECT maturity, COUNT(*) AS c FROM motorbridge_uploads GROUP BY maturity
  `) as { maturity: string; c: number }[];
  const trialRows = (await q`SELECT COUNT(*) AS c FROM motorbridge_uploads WHERE is_trial = 1`) as { c: number }[];
  const eligibleRows = (await q`
    SELECT COUNT(*) AS c FROM motorbridge_uploads WHERE aggregate_analytics_permitted = 1 AND is_synthetic = 0
  `) as { c: number }[];

  return {
    totalUploads: totalRows[0]?.c ?? 0,
    byConnector: byConnectorRows.map((r) => ({ connectorSlug: r.slug, count: r.c })),
    byCategory: byCategoryRows.map((r) => ({ category: r.category, count: r.c })),
    byMaturity: byMaturityRows.map((r) => ({ maturity: r.maturity, count: r.c })),
    trialUploads: trialRows[0]?.c ?? 0,
    eligibleForIntelligence: eligibleRows[0]?.c ?? 0,
  };
}

export type MotorBridgeCustomer = {
  userId: string;
  plan: string;
  vehicleCount: number;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  isDataPartner: boolean;
};

export async function getCustomer(userId: string): Promise<MotorBridgeCustomer | null> {
  const q = await db();
  if (!q) return null;
  const rows = (await q`
    SELECT user_id, plan, vehicle_count, trial_started_at, trial_ends_at, is_data_partner
    FROM motorbridge_customers WHERE user_id = ${userId}
  `) as { user_id: string; plan: string; vehicle_count: number; trial_started_at: string | null; trial_ends_at: string | null; is_data_partner: number }[];
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    plan: row.plan,
    vehicleCount: row.vehicle_count,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    isDataPartner: Boolean(row.is_data_partner),
  };
}

/** Starts the 24-hour trial at first meaningful use, not at account creation (§31) — idempotent, never resets an already-started trial. */
export async function startTrialIfNeeded(userId: string): Promise<MotorBridgeCustomer | null> {
  const q = await db();
  if (!q) return null;
  const existing = await getCustomer(userId);
  if (existing?.trialStartedAt) return existing;

  const now = new Date();
  const ends = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await q`
    INSERT INTO motorbridge_customers (user_id, plan, trial_started_at, trial_ends_at)
    VALUES (${userId}, 'trial', ${now.toISOString()}, ${ends.toISOString()})
    ON CONFLICT (user_id) DO UPDATE SET
      trial_started_at = COALESCE(motorbridge_customers.trial_started_at, EXCLUDED.trial_started_at),
      trial_ends_at = COALESCE(motorbridge_customers.trial_ends_at, EXCLUDED.trial_ends_at)
  `;
  return getCustomer(userId);
}

export async function isPausedAll(): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const rows = (await q`SELECT pause_all FROM motorbridge_config WHERE id = 'singleton'`) as { pause_all: number }[];
  return Boolean(rows[0]?.pause_all);
}
