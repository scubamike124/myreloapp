import { randomUUID } from "node:crypto";
import {
  getAmberContinuousCycle,
  getAmberEmergencyStop,
  getAmberLearningMode,
  getAmberLearningWorkspaces,
  logAmberAction,
} from "@/lib/amber-autonomous";
import { runAmberAutonomousCycle } from "@/lib/amber-cycle";
import { mergeAmberLearning } from "@/lib/amber-weekly";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

/**
 * Admin-only real-world learning launch helpers.
 * Workspace isolation is enforced by user_id on every Amber / BI / calendar table.
 */

export async function recordOpsMetric(
  q: Sql,
  input: {
    kind: string;
    workspaceUserId?: string | null;
    cycleId?: string | null;
    metrics: Record<string, unknown>;
    note?: string;
  },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_ops_metrics (id, kind, workspace_user_id, cycle_id, metrics, note, created_at)
    VALUES (
      ${id},
      ${input.kind.slice(0, 80)},
      ${input.workspaceUserId ?? null},
      ${input.cycleId ?? null},
      ${JSON.stringify(input.metrics)},
      ${(input.note || "").slice(0, 500)},
      ${new Date().toISOString()}
    )`;
  return id;
}

export async function startCycleRun(
  q: Sql,
  userId: string,
  goal: string,
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_cycle_runs (
      id, user_id, status, goal, steps, decisions, learning_delta,
      report_id, mission_id, campaign_id, owner_asks, duration_ms, error, created_at, completed_at
    ) VALUES (
      ${id}, ${userId}, ${"running"}, ${goal.slice(0, 2000)}, ${"[]"}, ${"[]"}, ${"{}"},
      ${null}, ${null}, ${null}, ${"[]"}, ${0}, ${null}, ${new Date().toISOString()}, ${null}
    )`;
  return id;
}

export async function completeCycleRun(
  q: Sql,
  cycleRunId: string,
  input: {
    status: "completed" | "failed";
    steps: unknown[];
    decisions: unknown[];
    learningDelta: Record<string, unknown>;
    reportId?: string | null;
    missionId?: string | null;
    campaignId?: string | null;
    ownerAsks: unknown[];
    durationMs: number;
    error?: string | null;
  },
): Promise<void> {
  await q`
    UPDATE amber_cycle_runs SET
      status = ${input.status},
      steps = ${JSON.stringify(input.steps)},
      decisions = ${JSON.stringify(input.decisions)},
      learning_delta = ${JSON.stringify(input.learningDelta)},
      report_id = ${input.reportId ?? null},
      mission_id = ${input.missionId ?? null},
      campaign_id = ${input.campaignId ?? null},
      owner_asks = ${JSON.stringify(input.ownerAsks)},
      duration_ms = ${Math.max(0, Math.floor(input.durationMs))},
      error = ${input.error ?? null},
      completed_at = ${new Date().toISOString()}
    WHERE id = ${cycleRunId}`;
}

export type AmberOpsDashboard = {
  learningMode: boolean;
  continuousCycle: boolean;
  emergencyStop: boolean;
  workspaces: string[];
  cyclesCompleted: number;
  cyclesFailed: number;
  avgDurationMs: number;
  ownerInterventions: number;
  learningUpdates: number;
  recentRuns: Record<string, unknown>[];
  recentMetrics: Record<string, unknown>[];
};

export async function getAmberOpsDashboard(q: Sql): Promise<AmberOpsDashboard> {
  const learningMode = await getAmberLearningMode();
  const continuousCycle = await getAmberContinuousCycle();
  const emergencyStop = await getAmberEmergencyStop();
  const workspaces = await getAmberLearningWorkspaces();

  const runs = (await q`
    SELECT id, user_id AS "userId", status, goal, duration_ms AS "durationMs",
           report_id AS "reportId", mission_id AS "missionId", campaign_id AS "campaignId",
           owner_asks AS "ownerAsks", error, created_at AS "createdAt", completed_at AS "completedAt",
           learning_delta AS "learningDelta", steps
    FROM amber_cycle_runs
    ORDER BY created_at DESC
    LIMIT 40
  `) as Record<string, unknown>[];

  const metrics = (await q`
    SELECT id, kind, workspace_user_id AS "workspaceUserId", cycle_id AS "cycleId",
           metrics, note, created_at AS "createdAt"
    FROM amber_ops_metrics
    ORDER BY created_at DESC
    LIMIT 40
  `) as Record<string, unknown>[];

  const completed = runs.filter((r) => r.status === "completed");
  const failed = runs.filter((r) => r.status === "failed");
  const durations = completed.map((r) => Number(r.durationMs) || 0).filter((n) => n > 0);
  const avgDurationMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  let ownerInterventions = 0;
  for (const r of runs) {
    try {
      const asks = typeof r.ownerAsks === "string" ? JSON.parse(r.ownerAsks) : r.ownerAsks;
      if (Array.isArray(asks)) ownerInterventions += asks.length;
    } catch {
      /* ignore */
    }
  }

  const learningUpdates = metrics.filter((m) => String(m.kind) === "learning_update").length;

  return {
    learningMode,
    continuousCycle,
    emergencyStop,
    workspaces,
    cyclesCompleted: completed.length,
    cyclesFailed: failed.length,
    avgDurationMs,
    ownerInterventions,
    learningUpdates,
    recentRuns: runs.map((r) => ({
      ...r,
      ownerAsks: (() => {
        try {
          return typeof r.ownerAsks === "string" ? JSON.parse(String(r.ownerAsks)) : r.ownerAsks;
        } catch {
          return [];
        }
      })(),
      learningDelta: (() => {
        try {
          return typeof r.learningDelta === "string"
            ? asRecord(JSON.parse(String(r.learningDelta)))
            : r.learningDelta;
        } catch {
          return {};
        }
      })(),
      steps: (() => {
        try {
          return typeof r.steps === "string" ? JSON.parse(String(r.steps)) : r.steps;
        } catch {
          return [];
        }
      })(),
    })),
    recentMetrics: metrics.map((m) => ({
      ...m,
      metrics: (() => {
        try {
          return typeof m.metrics === "string" ? asRecord(JSON.parse(String(m.metrics))) : m.metrics;
        } catch {
          return {};
        }
      })(),
    })),
  };
}

/**
 * Run Learning Mode cycles for each selected workspace — one user_id at a time, never mixed.
 */
export async function runLearningCyclesForWorkspaces(input: {
  q: Sql;
  actorEmail: string | null;
  actorUserId: string | null;
  userIds?: string[] | null;
  goal?: string | null;
}): Promise<{
  ok: boolean;
  skipped?: string;
  results: { userId: string; ok: boolean; cycleId?: string; error?: string }[];
}> {
  const { q, actorEmail, actorUserId } = input;

  if (await getAmberEmergencyStop()) {
    return { ok: true, skipped: "emergency_stop", results: [] };
  }
  if (!(await getAmberLearningMode())) {
    return { ok: true, skipped: "learning_mode_off", results: [] };
  }

  const selected = input.userIds?.length
    ? [...new Set(input.userIds.map(String).filter(Boolean))]
    : await getAmberLearningWorkspaces();

  if (!selected.length) {
    return { ok: true, skipped: "no_workspaces", results: [] };
  }

  const results: { userId: string; ok: boolean; cycleId?: string; error?: string }[] = [];

  for (const userId of selected) {
    try {
      const cycle = await runAmberAutonomousCycle({
        q,
        userId,
        goal: input.goal,
        actorEmail,
        actorUserId,
        learningMode: true,
      });
      results.push({
        userId,
        ok: true,
        cycleId: typeof cycle.cycleId === "string" ? cycle.cycleId : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "cycle failed";
      results.push({ userId, ok: false, error: msg });
      await logAmberAction({
        actorUserId,
        actorEmail,
        kind: "learning_cycle_error",
        title: `Learning cycle failed for workspace ${userId.slice(0, 8)}…`,
        detail: { userId, error: msg },
      });
    }
  }

  await recordOpsMetric(q, {
    kind: "learning_batch",
    metrics: {
      workspaces: selected.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
    note: "Admin Learning Mode batch",
  });

  return { ok: true, results };
}

/** Enrich learning store after a completed cycle (per workspace only). */
export async function applyCycleLearning(
  q: Sql,
  userId: string,
  input: {
    cycleId: string;
    goal: string;
    steps: { step: string; ok: boolean }[];
    nextWeek: Record<string, unknown>;
    reportSummary: string;
    campaignId?: string | null;
    outcomes?: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const failedSteps = input.steps.filter((s) => !s.ok).map((s) => s.step);
  const okSteps = input.steps.filter((s) => s.ok).map((s) => s.step);
  const ownerAsks = Array.isArray(input.nextWeek.ownerAsks)
    ? (input.nextWeek.ownerAsks as unknown[]).map(String)
    : [];

  const learning = await mergeAmberLearning(q, userId, {
    themes: [input.goal].filter(Boolean),
    successfulStrategies: failedSteps.length === 0 ? [input.goal] : [],
    failedStrategies: failedSteps.map((s) => `step:${s}`),
    campaignOutcomes: input.campaignId
      ? [`campaign:${input.campaignId}:${failedSteps.length ? "partial" : "ok"}`]
      : [],
    bestTopics: Array.isArray(input.nextWeek.campaignIdeas)
      ? (input.nextWeek.campaignIdeas as unknown[]).map(String)
      : [],
    ownerCorrections: ownerAsks,
    learningNote: input.reportSummary.slice(0, 400),
    cycleId: input.cycleId,
    cycleCompleted: true,
    performanceSnapshot: input.outcomes || {},
  });

  await recordOpsMetric(q, {
    kind: "learning_update",
    workspaceUserId: userId,
    cycleId: input.cycleId,
    metrics: {
      failedSteps: failedSteps.length,
      okSteps: okSteps.length,
      ownerAsks: ownerAsks.length,
    },
    note: "Per-workspace learning merge",
  });

  return learning;
}
