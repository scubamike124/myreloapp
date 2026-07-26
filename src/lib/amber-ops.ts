import { randomUUID } from "node:crypto";
import {
  getAmberAutonomousFlag,
  getAmberContinuousCycle,
  getAmberEmergencyStop,
  getAmberLearningMode,
  getAmberLearningWorkspaces,
  logAmberAction,
  setAmberEmergencyStop,
  setAmberLearningMode,
  setAmberContinuousCycle,
} from "@/lib/amber-autonomous";
import { getAmberOpsDashboard, recordOpsMetric } from "@/lib/amber-launch";
import { retryFailedProductions } from "@/lib/amber-campaigns";
import { runAmberAutonomousCycle } from "@/lib/amber-cycle";
import { pauseDepartment, ensureDepartments, listDepartments } from "@/lib/amber-departments";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

export const OPS_HONESTY =
  "Amber operational signals from Reelo workspace + Amber tables only. Cloudflare Workers do not expose host CPU/RAM — those are not shown.";

export async function writeCheckpoint(
  q: Sql,
  input: { cycleId: string; userId: string; step: string; status?: string; detail?: Record<string, unknown> },
): Promise<void> {
  await q`
    INSERT INTO amber_ops_checkpoints (id, cycle_id, user_id, step, status, detail, created_at)
    VALUES (
      ${randomUUID()}, ${input.cycleId}, ${input.userId}, ${input.step.slice(0, 120)},
      ${(input.status || "ok").slice(0, 40)}, ${JSON.stringify(input.detail || {})},
      ${new Date().toISOString()}
    )`;
}

export async function raiseAlert(
  q: Sql,
  input: {
    severity: "info" | "warning" | "critical";
    kind: string;
    title: string;
    detail?: string;
    workspaceUserId?: string | null;
    recommended?: string;
    meta?: Record<string, unknown>;
  },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_ops_alerts (
      id, severity, kind, title, detail, workspace_user_id, status, recommended, meta, created_at, resolved_at
    ) VALUES (
      ${id}, ${input.severity}, ${input.kind.slice(0, 80)}, ${input.title.slice(0, 200)},
      ${(input.detail || "").slice(0, 2000)}, ${input.workspaceUserId ?? null}, ${"open"},
      ${(input.recommended || "").slice(0, 1000)}, ${JSON.stringify(input.meta || {})},
      ${new Date().toISOString()}, ${null}
    )`;
  await logAmberAction({
    actorUserId: input.workspaceUserId ?? null,
    actorEmail: null,
    kind: "ops_alert",
    title: `[${input.severity}] ${input.title}`,
    detail: { id, kind: input.kind },
  });
  return id;
}

export async function resolveAlert(q: Sql, alertId: string, actorEmail: string): Promise<void> {
  await q`
    UPDATE amber_ops_alerts SET status = ${"resolved"}, resolved_at = ${new Date().toISOString()}
    WHERE id = ${alertId}`;
  await logAmberAction({
    actorUserId: null,
    actorEmail,
    kind: "ops_alert_resolve",
    title: `Resolved alert ${alertId.slice(0, 8)}`,
    detail: { alertId },
  });
}

export async function startRecovery(
  q: Sql,
  input: { action: string; workspaceUserId?: string | null; actorEmail?: string | null; detail?: Record<string, unknown> },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_recovery_events (id, workspace_user_id, action, status, detail, actor_email, created_at, completed_at)
    VALUES (
      ${id}, ${input.workspaceUserId ?? null}, ${input.action.slice(0, 80)}, ${"started"},
      ${JSON.stringify(input.detail || {})}, ${input.actorEmail ?? null},
      ${new Date().toISOString()}, ${null}
    )`;
  return id;
}

export async function completeRecovery(
  q: Sql,
  recoveryId: string,
  status: "completed" | "failed",
  detail?: Record<string, unknown>,
): Promise<void> {
  await q`
    UPDATE amber_recovery_events SET
      status = ${status},
      detail = ${JSON.stringify(detail || {})},
      completed_at = ${new Date().toISOString()}
    WHERE id = ${recoveryId}`;
}

/** Scan Amber/Reelo state and raise alerts (idempotent soft — may create duplicates; owner resolves). */
export async function scanAndRaiseAlerts(q: Sql): Promise<{ created: string[] }> {
  const created: string[] = [];
  const failedCycles = (await q`
    SELECT id, user_id AS "userId", error, created_at AS "createdAt"
    FROM amber_cycle_runs WHERE status = 'failed'
    ORDER BY created_at DESC LIMIT 10
  `) as { id: string; userId: string; error: string | null }[];

  for (const c of failedCycles.slice(0, 5)) {
    created.push(
      await raiseAlert(q, {
        severity: "critical",
        kind: "failed_cycle",
        title: "Failed weekly/BOS cycle",
        detail: c.error || "Cycle marked failed",
        workspaceUserId: c.userId,
        recommended: "Open Recovery Center → Retry cycle for this workspace. Check Logs for step failures.",
        meta: { cycleId: c.id },
      }),
    );
  }

  const holds = (await q`
    SELECT user_id AS "userId", COUNT(*) AS n FROM amber_verification_holds
    WHERE status = 'paused' GROUP BY user_id LIMIT 20
  `) as { userId: string; n: number }[];
  for (const h of holds) {
    if (Number(h.n) <= 0) continue;
    created.push(
      await raiseAlert(q, {
        severity: "warning",
        kind: "verification_holds",
        title: `${h.n} open verification hold(s)`,
        detail: "Owner must complete OAuth/provider verification — Amber will not bypass.",
        workspaceUserId: h.userId,
        recommended: "Resolve holds in Setup after reconnecting accounts.",
      }),
    );
  }

  const publishBacklog = (await q`
    SELECT COUNT(*) AS n FROM publish_items WHERE status IN ('queued','pending','draft')
  `) as { n: number | string }[];
  const backlog = Number(publishBacklog[0]?.n || 0);
  if (backlog >= 25) {
    created.push(
      await raiseAlert(q, {
        severity: "warning",
        kind: "queue_backlog",
        title: `Publish queue backlog (${backlog})`,
        detail: "Many publish items waiting — check approvals and OAuth.",
        recommended: "Review Publish queue and social account status.",
      }),
    );
  }

  if (await getAmberEmergencyStop()) {
    created.push(
      await raiseAlert(q, {
        severity: "critical",
        kind: "emergency_stop",
        title: "Emergency stop is ENGAGED",
        detail: "All Amber autonomous ops are blocked.",
        recommended: "Clear stop in Command Center only when safe.",
      }),
    );
  }

  return { created };
}

export async function computeReadinessScore(q: Sql): Promise<{
  score: number;
  breakdown: Record<string, number>;
  explanations: Record<string, string>;
  snapshotId: string;
}> {
  const flag = await getAmberAutonomousFlag();
  const stop = await getAmberEmergencyStop();
  const learning = await getAmberLearningMode();
  const continuous = await getAmberContinuousCycle();
  const workspaces = await getAmberLearningWorkspaces();
  const launch = await getAmberOpsDashboard(q);

  const cycles = launch.cyclesCompleted + launch.cyclesFailed;
  const cycleSuccess = cycles === 0 ? 50 : Math.round((launch.cyclesCompleted / cycles) * 100);
  const recoveryRate =
    launch.cyclesFailed === 0
      ? 90
      : Math.max(20, 100 - launch.cyclesFailed * 15);

  const openAlerts = (await q`
    SELECT COUNT(*) AS n FROM amber_ops_alerts WHERE status = 'open'
  `) as { n: number | string }[];
  const alertPenalty = Math.min(40, Number(openAlerts[0]?.n || 0) * 8);

  const holds = (await q`
    SELECT COUNT(*) AS n FROM amber_verification_holds WHERE status = 'paused'
  `) as { n: number | string }[];
  const holdPenalty = Math.min(25, Number(holds[0]?.n || 0) * 5);

  const security = stop ? 20 : flag ? 85 : 60;
  const learningQuality = learning ? Math.min(95, 55 + workspaces.length * 8 + (launch.learningUpdates > 0 ? 15 : 0)) : 40;
  const automation = Math.max(0, cycleSuccess - (stop ? 40 : 0));
  const queueHealth = Math.max(30, 90 - alertPenalty);
  const apiAvailability = flag && !stop ? 90 : stop ? 40 : 70;

  const breakdown = {
    automationSuccess: automation,
    workflowCompletion: cycleSuccess,
    agentStability: Math.min(90, 50 + launch.cyclesCompleted * 5),
    learningQuality,
    errorRateHealth: Math.max(10, 100 - launch.cyclesFailed * 12 - alertPenalty),
    recoverySuccess: recoveryRate,
    apiAvailability,
    queueHealth,
    securityStatus: security,
    deploymentStability: 80,
  };

  const weights: Record<keyof typeof breakdown, number> = {
    automationSuccess: 0.15,
    workflowCompletion: 0.12,
    agentStability: 0.1,
    learningQuality: 0.12,
    errorRateHealth: 0.12,
    recoverySuccess: 0.1,
    apiAvailability: 0.08,
    queueHealth: 0.08,
    securityStatus: 0.08,
    deploymentStability: 0.05,
  };

  let score = 0;
  for (const [k, w] of Object.entries(weights)) {
    score += (breakdown[k as keyof typeof breakdown] || 0) * w;
  }
  score = Math.max(0, Math.min(100, Math.round(score - holdPenalty * 0.3)));

  const explanations: Record<string, string> = {
    overall: `Weighted Amber ops readiness. ${OPS_HONESTY}`,
    automationSuccess: `Derived from cycle success and emergency stop state.`,
    workflowCompletion: `${launch.cyclesCompleted} completed / ${launch.cyclesFailed} failed recent cycles.`,
    learningQuality: learning
      ? `Learning Mode ON with ${workspaces.length} workspace(s); ${launch.learningUpdates} learning updates.`
      : "Learning Mode OFF — enable for production learning proof.",
    securityStatus: stop ? "Emergency stop engaged." : flag ? "Flag ON, stop clear." : "Flag OFF (safe default).",
    queueHealth: `Open alerts penalty applied (${openAlerts[0]?.n || 0} open).`,
    continuous: continuous ? "Continuous Mode ON (cron-ready)." : "Continuous Mode OFF.",
  };

  const snapshotId = randomUUID();
  await q`
    INSERT INTO amber_readiness_snapshots (id, score, breakdown, explanations, created_at)
    VALUES (
      ${snapshotId}, ${score}, ${JSON.stringify(breakdown)}, ${JSON.stringify(explanations)},
      ${new Date().toISOString()}
    )`;

  await recordOpsMetric(q, {
    kind: "readiness_score",
    metrics: { score, ...breakdown },
    note: "Amber 33 production readiness",
  });

  return { score, breakdown, explanations, snapshotId };
}

export async function buildOpsConsole(q: Sql): Promise<Record<string, unknown>> {
  const launch = await getAmberOpsDashboard(q);
  const readiness = await computeReadinessScore(q);
  const alerts = (await q`
    SELECT id, severity, kind, title, detail, workspace_user_id AS "workspaceUserId",
           status, recommended, created_at AS "createdAt", resolved_at AS "resolvedAt"
    FROM amber_ops_alerts ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  const recoveries = (await q`
    SELECT id, workspace_user_id AS "workspaceUserId", action, status, detail,
           actor_email AS "actorEmail", created_at AS "createdAt", completed_at AS "completedAt"
    FROM amber_recovery_events ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];
  const recentCheckpoints = (await q`
    SELECT id, cycle_id AS "cycleId", user_id AS "userId", step, status, created_at AS "createdAt"
    FROM amber_ops_checkpoints ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  const agentJobs = (await q`
    SELECT id, user_id AS "userId", agent, department, title, status, created_at AS "createdAt"
    FROM amber_agent_jobs ORDER BY created_at DESC LIMIT 25
  `) as Record<string, unknown>[];
  const publishQueued = (await q`
    SELECT COUNT(*) AS n FROM publish_items WHERE status IN ('queued','pending','draft')
  `) as { n: number | string }[];
  const schedulePending = (await q`
    SELECT COUNT(*) AS n FROM schedule_items WHERE approval_status = 'pending' OR status = 'scheduled'
  `) as { n: number | string }[];

  return {
    honestyNote: OPS_HONESTY,
    flags: {
      autonomous: await getAmberAutonomousFlag(),
      emergencyStop: await getAmberEmergencyStop(),
      learningMode: await getAmberLearningMode(),
      continuous: await getAmberContinuousCycle(),
      learningWorkspaces: await getAmberLearningWorkspaces(),
    },
    readiness,
    launchOps: launch,
    queues: {
      publishBacklog: Number(publishQueued[0]?.n || 0),
      schedulePending: Number(schedulePending[0]?.n || 0),
      agentJobsRecent: agentJobs.length,
    },
    alerts: alerts.map((a) => ({
      ...a,
      meta: undefined,
    })),
    recoveries: recoveries.map((r) => {
      let detail = {};
      try {
        detail = typeof r.detail === "string" ? asRecord(JSON.parse(String(r.detail))) : r.detail || {};
      } catch {
        detail = {};
      }
      return { ...r, detail };
    }),
    recentCheckpoints,
    activeAgents: agentJobs,
  };
}

export async function runOwnerCommand(
  q: Sql,
  input: {
    command: string;
    userId?: string | null;
    actorEmail: string;
    meta?: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const { command, actorEmail } = input;
  const userId = input.userId || null;
  const recoveryId = await startRecovery(q, {
    action: command,
    workspaceUserId: userId,
    actorEmail,
    detail: input.meta || {},
  });

  try {
    let result: Record<string, unknown> = { ok: true };

    switch (command) {
      case "emergency_stop_on":
        await setAmberEmergencyStop(true, actorEmail);
        result = { ok: true, emergencyStop: true };
        break;
      case "emergency_stop_off":
        await setAmberEmergencyStop(false, actorEmail);
        result = { ok: true, emergencyStop: false };
        break;
      case "pause_automation":
        await setAmberLearningMode(false, actorEmail);
        await setAmberContinuousCycle(false, actorEmail);
        result = { ok: true, learningMode: false, continuous: false };
        break;
      case "resume_automation":
        await setAmberLearningMode(true, actorEmail);
        result = { ok: true, learningMode: true };
        break;
      case "retry_productions": {
        if (!userId) throw new Error("userId required");
        result = { ok: true, ...(await retryFailedProductions(q, userId, 3)) };
        break;
      }
      case "retry_cycle": {
        if (!userId) throw new Error("userId required");
        if (await getAmberEmergencyStop()) throw new Error("emergency_stop");
        const cycle = await runAmberAutonomousCycle({
          q,
          userId,
          actorEmail,
          actorUserId: null,
          learningMode: true,
        });
        result = { ok: true, cycleId: cycle.cycleId };
        break;
      }
      case "trigger_learning_cycle": {
        if (!userId) throw new Error("userId required");
        if (await getAmberEmergencyStop()) throw new Error("emergency_stop");
        const cycle = await runAmberAutonomousCycle({
          q,
          userId,
          actorEmail,
          actorUserId: null,
          learningMode: true,
        });
        result = { ok: true, cycleId: cycle.cycleId };
        break;
      }
      case "scan_alerts":
        result = { ok: true, ...(await scanAndRaiseAlerts(q)) };
        break;
      case "compute_readiness":
        result = { ok: true, ...(await computeReadinessScore(q)) };
        break;
      case "pause_department": {
        if (!userId) throw new Error("userId required");
        const slug = String(input.meta?.slug || "");
        if (!slug) throw new Error("slug required");
        await ensureDepartments(q, userId);
        await pauseDepartment(q, userId, slug, true);
        result = { ok: true, departments: await listDepartments(q, userId) };
        break;
      }
      case "resume_department": {
        if (!userId) throw new Error("userId required");
        const slug = String(input.meta?.slug || "");
        if (!slug) throw new Error("slug required");
        await pauseDepartment(q, userId, slug, false);
        result = { ok: true, departments: await listDepartments(q, userId) };
        break;
      }
      case "maintenance_mode":
        await setAmberEmergencyStop(true, actorEmail);
        await setAmberContinuousCycle(false, actorEmail);
        result = { ok: true, maintenance: true, note: "Emergency stop ON + continuous OFF (read-safe maintenance)." };
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    await completeRecovery(q, recoveryId, "completed", result);
    await logAmberAction({
      actorUserId: userId,
      actorEmail,
      kind: "owner_command",
      title: `Owner command: ${command}`,
      detail: { recoveryId, command, result },
    });
    return { ...result, recoveryId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "command failed";
    await completeRecovery(q, recoveryId, "failed", { error: msg });
    await logAmberAction({
      actorUserId: userId,
      actorEmail,
      kind: "owner_command_error",
      title: `Owner command failed: ${command}`,
      detail: { recoveryId, error: msg },
    });
    throw e;
  }
}
