import { randomUUID } from "node:crypto";
import {
  getAmberLearningWorkspaces,
  setAmberLearningWorkspaces,
  logAmberAction,
  getAmberEmergencyStop,
  getAmberLearningMode,
  getAmberContinuousCycle,
} from "@/lib/amber-autonomous";
import { computeBusinessHealth } from "@/lib/amber-health";
import { computeReadinessScore } from "@/lib/amber-ops";
import { generateOptimizations, generateExecBriefing } from "@/lib/amber-exec-ops";
import type { Sql } from "@/lib/workspace-api";

export const ENTERPRISE_HONESTY =
  "Enterprise metrics aggregate Reelo workspace + Amber ops signals only. No fabricated revenue, pipeline, or social reach. Predictions are trend heuristics with confidence — not black-box ML claims.";

async function ensureDefaultOrg(q: Sql): Promise<string> {
  const rows = (await q`
    SELECT id FROM amber_organizations WHERE status = 'active' ORDER BY created_at ASC LIMIT 1
  `) as { id: string }[];
  if (rows[0]?.id) return rows[0].id;
  const id = randomUUID();
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_organizations (id, name, status, meta, created_at, updated_at)
    VALUES (${id}, ${"Amber Enterprise"}, ${"active"}, ${"{}"}, ${now}, ${now})`;
  return id;
}

export async function ensureGovernancePolicies(q: Sql, orgId: string): Promise<void> {
  const existing = (await q`SELECT slug FROM amber_governance_policies LIMIT 20`) as { slug: string }[];
  const have = new Set(existing.map((e) => e.slug));
  const defaults = [
    {
      slug: "workspace_isolation",
      title: "Workspace data isolation",
      rule: "Never mix BI/learning/campaigns across user_id workspaces",
      threshold: 1,
    },
    {
      slug: "owner_approval_high_impact",
      title: "High-impact actions require approval",
      rule: "Permanent destructive changes and org-wide policy changes need owner approval",
      threshold: 1,
    },
    {
      slug: "emergency_stop_blocks_ops",
      title: "Emergency stop blocks automation",
      rule: "When emergency stop is ON, autonomous cycles and publishes are blocked",
      threshold: 1,
    },
    {
      slug: "honest_metrics_only",
      title: "Honest metrics policy",
      rule: "Only Reelo/Amber operational metrics — no fabricated social or revenue claims",
      threshold: 1,
    },
    {
      slug: "auto_optimize_cap",
      title: "Auto-optimization risk threshold",
      rule: "Auto-apply only low-risk optimizations; medium/high require approval",
      threshold: 0.4,
    },
  ];
  const now = new Date().toISOString();
  for (const d of defaults) {
    if (have.has(d.slug)) continue;
    await q`
      INSERT INTO amber_governance_policies (id, org_id, slug, title, rule, threshold, enforced, meta, created_at)
      VALUES (
        ${randomUUID()}, ${orgId}, ${d.slug}, ${d.title}, ${d.rule}, ${d.threshold}, ${true}, ${"{}"}, ${now}
      )`;
  }
}

/** Sync Learning Mode workspace list into enterprise workspace registry. */
export async function syncEnterpriseWorkspaces(
  q: Sql,
  actorEmail?: string | null,
): Promise<{ orgId: string; workspaces: Record<string, unknown>[] }> {
  const orgId = await ensureDefaultOrg(q);
  await ensureGovernancePolicies(q, orgId);
  const userIds = await getAmberLearningWorkspaces();
  const now = new Date().toISOString();

  for (const userId of userIds) {
    const users = (await q`
      SELECT email, name FROM users WHERE id = ${userId} LIMIT 1
    `) as { email: string; name: string | null }[];
    const label = users[0]?.email || users[0]?.name || userId.slice(0, 8);
    let healthScore = 0;
    let readinessScore = 0;
    try {
      const h = await computeBusinessHealth(q, userId);
      healthScore = h.overall;
    } catch {
      healthScore = 0;
    }
    try {
      // readiness is org-wide; use health as proxy per workspace + cycle success
      const cycles = (await q`
        SELECT status FROM amber_cycle_runs WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10
      `) as { status: string }[];
      const ok = cycles.filter((c) => c.status === "completed").length;
      const fail = cycles.filter((c) => c.status === "failed").length;
      readinessScore = Math.round(
        healthScore * 0.6 + (ok + fail ? (ok / (ok + fail)) * 40 : 30),
      );
    } catch {
      readinessScore = healthScore;
    }

    const existing = (await q`
      SELECT id FROM amber_enterprise_workspaces WHERE user_id = ${userId} LIMIT 1
    `) as { id: string }[];
    if (existing[0]) {
      await q`
        UPDATE amber_enterprise_workspaces SET
          org_id = ${orgId},
          label = ${label.slice(0, 160)},
          readiness_score = ${readinessScore},
          health_score = ${healthScore},
          status = ${"active"},
          updated_at = ${now}
        WHERE user_id = ${userId}`;
    } else {
      await q`
        INSERT INTO amber_enterprise_workspaces (
          id, org_id, user_id, label, status, readiness_score, health_score, meta, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${userId}, ${label.slice(0, 160)}, ${"active"},
          ${readinessScore}, ${healthScore}, ${"{}"}, ${now}, ${now}
        )`;
    }
  }

  const workspaces = (await q`
    SELECT id, org_id AS "orgId", user_id AS "userId", label, status,
           readiness_score AS "readinessScore", health_score AS "healthScore", updated_at AS "updatedAt"
    FROM amber_enterprise_workspaces ORDER BY updated_at DESC LIMIT 50
  `) as Record<string, unknown>[];

  await logAmberAction({
    actorUserId: null,
    actorEmail: actorEmail ?? null,
    kind: "enterprise_sync_workspaces",
    title: `Synced ${workspaces.length} enterprise workspace(s)`,
    detail: { orgId, count: workspaces.length },
  });

  return { orgId, workspaces };
}

export async function provisionWorkspace(
  q: Sql,
  userId: string,
  label: string,
  actorEmail: string,
): Promise<{ userId: string; learningWorkspaces: string[] }> {
  const orgId = await ensureDefaultOrg(q);
  const current = await getAmberLearningWorkspaces();
  const next = await setAmberLearningWorkspaces([...current, userId], actorEmail);
  const now = new Date().toISOString();
  const existing = (await q`
    SELECT id FROM amber_enterprise_workspaces WHERE user_id = ${userId} LIMIT 1
  `) as { id: string }[];
  if (!existing[0]) {
    await q`
      INSERT INTO amber_enterprise_workspaces (
        id, org_id, user_id, label, status, readiness_score, health_score, meta, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${orgId}, ${userId}, ${label.slice(0, 160) || userId.slice(0, 8)},
        ${"active"}, ${0}, ${0}, ${"{}"}, ${now}, ${now}
      )`;
  }
  await syncEnterpriseWorkspaces(q, actorEmail);
  return { userId, learningWorkspaces: next };
}

async function upsertKgNode(
  q: Sql,
  input: {
    orgId: string;
    userId: string | null;
    kind: string;
    refId?: string | null;
    title: string;
    body?: string;
  },
): Promise<string> {
  if (input.refId && input.userId) {
    const found = (await q`
      SELECT id FROM amber_kg_nodes
      WHERE kind = ${input.kind} AND ref_id = ${input.refId} AND user_id = ${input.userId}
      LIMIT 1
    `) as { id: string }[];
    if (found[0]) return found[0].id;
  }
  const id = randomUUID();
  await q`
    INSERT INTO amber_kg_nodes (id, org_id, user_id, kind, ref_id, title, body, meta, created_at)
    VALUES (
      ${id}, ${input.orgId}, ${input.userId}, ${input.kind.slice(0, 40)}, ${input.refId ?? null},
      ${input.title.slice(0, 200)}, ${(input.body || "").slice(0, 2000)}, ${"{}"}, ${new Date().toISOString()}
    )`;
  return id;
}

async function linkKg(
  q: Sql,
  orgId: string,
  fromNode: string,
  toNode: string,
  relation: string,
  weight = 1,
): Promise<void> {
  await q`
    INSERT INTO amber_kg_edges (id, org_id, from_node, to_node, relation, weight, meta, created_at)
    VALUES (
      ${randomUUID()}, ${orgId}, ${fromNode}, ${toNode}, ${relation.slice(0, 60)}, ${weight},
      ${"{}"}, ${new Date().toISOString()}
    )`;
}

/** Rebuild knowledge graph for a workspace from existing Amber entities. */
export async function rebuildKnowledgeGraph(
  q: Sql,
  userId: string,
): Promise<{ nodes: number; edges: number }> {
  const orgId = await ensureDefaultOrg(q);
  const bizNode = await upsertKgNode(q, {
    orgId,
    userId,
    kind: "business",
    refId: userId,
    title: `Workspace ${userId.slice(0, 8)}`,
  });

  let nodes = 1;
  let edges = 0;

  const objectives = (await q`
    SELECT id, goal FROM amber_objectives WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as { id: string; goal: string }[];
  for (const o of objectives) {
    const n = await upsertKgNode(q, {
      orgId,
      userId,
      kind: "objective",
      refId: o.id,
      title: o.goal.slice(0, 160),
    });
    await linkKg(q, orgId, bizNode, n, "has_objective");
    nodes++;
    edges++;
  }

  const initiatives = (await q`
    SELECT id, title, objective_id AS "objectiveId" FROM amber_initiatives
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as { id: string; title: string; objectiveId: string | null }[];
  for (const i of initiatives) {
    const n = await upsertKgNode(q, {
      orgId,
      userId,
      kind: "initiative",
      refId: i.id,
      title: i.title,
    });
    await linkKg(q, orgId, bizNode, n, "has_initiative");
    nodes++;
    edges++;
    if (i.objectiveId) {
      const objNodes = (await q`
        SELECT id FROM amber_kg_nodes WHERE ref_id = ${i.objectiveId} AND kind = 'objective' LIMIT 1
      `) as { id: string }[];
      if (objNodes[0]) {
        await linkKg(q, orgId, objNodes[0].id, n, "supports");
        edges++;
      }
    }
  }

  const campaigns = (await q`
    SELECT id, title FROM amber_campaigns WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 15
  `) as { id: string; title: string }[];
  for (const c of campaigns) {
    const n = await upsertKgNode(q, {
      orgId,
      userId,
      kind: "campaign",
      refId: c.id,
      title: c.title,
    });
    await linkKg(q, orgId, bizNode, n, "runs_campaign");
    nodes++;
    edges++;
  }

  const risks = (await q`
    SELECT id, title FROM amber_risks WHERE user_id = ${userId} AND status = 'open' LIMIT 15
  `) as { id: string; title: string }[];
  for (const r of risks) {
    const n = await upsertKgNode(q, {
      orgId,
      userId,
      kind: "risk",
      refId: r.id,
      title: r.title,
    });
    await linkKg(q, orgId, bizNode, n, "has_risk");
    nodes++;
    edges++;
  }

  const decisions = (await q`
    SELECT id, title FROM amber_decisions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 15
  `) as { id: string; title: string }[];
  for (const d of decisions) {
    const n = await upsertKgNode(q, {
      orgId,
      userId,
      kind: "decision",
      refId: d.id,
      title: d.title,
    });
    await linkKg(q, orgId, bizNode, n, "made_decision");
    nodes++;
    edges++;
  }

  return { nodes, edges };
}

export async function searchKnowledgeGraph(
  q: Sql,
  query: string,
  userId?: string | null,
): Promise<{ nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] }> {
  const qLower = `%${query.toLowerCase().slice(0, 80)}%`;
  const nodes = userId
    ? ((await q`
        SELECT id, kind, ref_id AS "refId", title, body, user_id AS "userId", created_at AS "createdAt"
        FROM amber_kg_nodes
        WHERE user_id = ${userId} AND (LOWER(title) LIKE ${qLower} OR LOWER(body) LIKE ${qLower} OR LOWER(kind) LIKE ${qLower})
        ORDER BY created_at DESC LIMIT 40
      `) as Record<string, unknown>[])
    : ((await q`
        SELECT id, kind, ref_id AS "refId", title, body, user_id AS "userId", created_at AS "createdAt"
        FROM amber_kg_nodes
        WHERE LOWER(title) LIKE ${qLower} OR LOWER(body) LIKE ${qLower} OR LOWER(kind) LIKE ${qLower}
        ORDER BY created_at DESC LIMIT 40
      `) as Record<string, unknown>[]);

  const nodeIds = nodes.map((n) => String(n.id));
  const edges: Record<string, unknown>[] = [];
  for (const id of nodeIds.slice(0, 20)) {
    const e = (await q`
      SELECT id, from_node AS "fromNode", to_node AS "toNode", relation, weight
      FROM amber_kg_edges WHERE from_node = ${id} OR to_node = ${id} LIMIT 10
    `) as Record<string, unknown>[];
    edges.push(...e);
  }
  return { nodes, edges };
}

/** Trend-heuristic predictive insights with confidence scores. */
export async function generatePredictiveInsights(
  q: Sql,
  userId?: string | null,
): Promise<Record<string, unknown>[]> {
  const workspaces = userId
    ? [{ userId }]
    : ((await q`
        SELECT user_id AS "userId" FROM amber_enterprise_workspaces WHERE status = 'active' LIMIT 20
      `) as { userId: string }[]);

  const created: Record<string, unknown>[] = [];
  const now = new Date().toISOString();

  for (const w of workspaces) {
    const uid = w.userId;
    const cycles = (await q`
      SELECT status, duration_ms AS "durationMs" FROM amber_cycle_runs
      WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 12
    `) as { status: string; durationMs: number }[];
    const fail = cycles.filter((c) => c.status === "failed").length;
    const ok = cycles.filter((c) => c.status === "completed").length;
    const avgDur =
      cycles.filter((c) => c.durationMs > 0).reduce((a, c) => a + Number(c.durationMs), 0) /
        Math.max(1, cycles.filter((c) => c.durationMs > 0).length) || 0;

    const publish = (await q`
      SELECT COUNT(*) AS n FROM publish_items
      WHERE user_id = ${uid} AND status IN ('queued','pending','draft')
    `) as { n: number | string }[];
    const backlog = Number(publish[0]?.n || 0);

    const holds = (await q`
      SELECT COUNT(*) AS n FROM amber_verification_holds WHERE user_id = ${uid} AND status = 'paused'
    `) as { n: number | string }[];
    const holdN = Number(holds[0]?.n || 0);

    const forecasts: {
      kind: string;
      title: string;
      confidence: number;
      prediction: string;
      mitigation: string;
    }[] = [];

    if (fail >= 2) {
      forecasts.push({
        kind: "workflow_failure",
        title: "Elevated cycle failure risk",
        confidence: Math.min(0.92, 0.55 + fail * 0.1),
        prediction: `${fail} of last ${cycles.length} cycles failed — recurrence likely without intervention.`,
        mitigation: "Run Amber 33 Command → Retry cycle; review checkpoints and emergency stop state.",
      });
    }
    if (backlog >= 15) {
      forecasts.push({
        kind: "queue_congestion",
        title: "Publish queue congestion risk",
        confidence: Math.min(0.9, 0.5 + backlog / 50),
        prediction: `Backlog ${backlog} items may stall publishing and approval throughput.`,
        mitigation: "Clear approvals, reconnect OAuth, or pause new productions.",
      });
    }
    if (holdN > 0) {
      forecasts.push({
        kind: "integration_instability",
        title: "Verification holds blocking autonomy",
        confidence: 0.85,
        prediction: `${holdN} open hold(s) will continue blocking publish/infra steps.`,
        mitigation: "Owner completes provider verification — Amber will not bypass security.",
      });
    }
    if (avgDur > 120_000 && ok > 0) {
      forecasts.push({
        kind: "capacity",
        title: "Cycle duration capacity pressure",
        confidence: 0.6,
        prediction: `Average cycle ~${Math.round(avgDur / 1000)}s — risk of timeout under load.`,
        mitigation: "Reduce concurrent workspaces; enable Continuous only after soak tests.",
      });
    }
    if (!forecasts.length && ok > 0) {
      forecasts.push({
        kind: "stability",
        title: "Stable operational trajectory",
        confidence: 0.65,
        prediction: "No elevated failure/backlog signals in recent window.",
        mitigation: "Continue Learning Mode weekly cycles; monitor readiness score.",
      });
    }

    for (const f of forecasts) {
      const id = randomUUID();
      await q`
        INSERT INTO amber_forecasts (id, user_id, kind, title, confidence, prediction, mitigation, meta, created_at)
        VALUES (
          ${id}, ${uid}, ${f.kind}, ${f.title}, ${f.confidence}, ${f.prediction}, ${f.mitigation},
          ${JSON.stringify({ honestyNote: ENTERPRISE_HONESTY })}, ${now}
        )`;
      created.push({ id, userId: uid, ...f });
    }
  }

  return created;
}

export async function runSelfOptimization(
  q: Sql,
  userId: string,
  actorEmail?: string | null,
): Promise<{ optimizations: { id: string; recommendation: string }[]; autoApplied: string[]; approvals: string[] }> {
  const opts = await generateOptimizations(q, userId);
  const autoApplied: string[] = [];
  const approvals: string[] = [];
  const stop = await getAmberEmergencyStop();

  // Governance: only auto-apply low-risk stability tips when stop is OFF
  for (const o of opts) {
    const row = (await q`
      SELECT area, recommendation FROM amber_optimizations WHERE id = ${o.id} LIMIT 1
    `) as { area: string; recommendation: string }[];
    const area = row[0]?.area || "";
    if (!stop && (area === "stability" || area === "task_throughput")) {
      await q`UPDATE amber_optimizations SET status = ${"applied"} WHERE id = ${o.id}`;
      autoApplied.push(o.id);
      await logAmberAction({
        actorUserId: userId,
        actorEmail: actorEmail ?? null,
        kind: "self_optimize_apply",
        title: `Auto-applied optimization`,
        detail: { id: o.id, area },
      });
    }
  }

  // Record decision intelligence
  const id = randomUUID();
  await q`
    INSERT INTO amber_decision_intel (
      id, user_id, title, evidence, confidence, expected_impact, alternatives, decision, outcome, created_at
    ) VALUES (
      ${id}, ${userId}, ${"Self-optimization pass"},
      ${JSON.stringify(opts.map((o) => o.recommendation).slice(0, 8))},
      ${0.62}, ${"Improve Amber operational efficiency"},
      ${JSON.stringify(["manual only", "defer all"])},
      ${autoApplied.length ? "auto_apply_low_risk" : "recommend_only"},
      ${JSON.stringify({ autoApplied, count: opts.length })},
      ${new Date().toISOString()}
    )`;

  return { optimizations: opts, autoApplied, approvals };
}

export async function allocateResources(
  q: Sql,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const tasks = (await q`
    SELECT department, COUNT(*) AS n FROM amber_exec_tasks
    WHERE user_id = ${userId} AND status IN ('queued','blocked')
    GROUP BY department
  `) as { department: string; n: number | string }[];
  const now = new Date().toISOString();
  const allocations: Record<string, unknown>[] = [];

  // Clear prior active
  await q`UPDATE amber_resource_allocations SET status = ${"superseded"} WHERE user_id = ${userId} AND status = ${"active"}`;

  if (!tasks.length) {
    const id = randomUUID();
    await q`
      INSERT INTO amber_resource_allocations (id, user_id, resource, assigned_to, weight, reason, status, created_at)
      VALUES (
        ${id}, ${userId}, ${"agent_capacity"}, ${"marketing"}, ${1},
        ${"Default allocation — no queued exec tasks"}, ${"active"}, ${now}
      )`;
    allocations.push({ id, resource: "agent_capacity", assignedTo: "marketing", weight: 1 });
    return allocations;
  }

  const total = tasks.reduce((a, t) => a + Number(t.n), 0) || 1;
  for (const t of tasks) {
    const weight = Number(t.n) / total;
    const id = randomUUID();
    await q`
      INSERT INTO amber_resource_allocations (id, user_id, resource, assigned_to, weight, reason, status, created_at)
      VALUES (
        ${id}, ${userId}, ${"agent_capacity"}, ${t.department}, ${weight},
        ${`${t.n} queued/blocked tasks in ${t.department}`}, ${"active"}, ${now}
      )`;
    allocations.push({ id, resource: "agent_capacity", assignedTo: t.department, weight, reason: `${t.n} tasks` });
  }
  return allocations;
}

export async function runBenchmarks(q: Sql): Promise<Record<string, unknown>[]> {
  const spaces = (await q`
    SELECT user_id AS "userId", label, health_score AS "healthScore", readiness_score AS "readinessScore"
    FROM amber_enterprise_workspaces WHERE status = 'active'
    ORDER BY readiness_score DESC LIMIT 10
  `) as { userId: string; label: string; healthScore: number; readinessScore: number }[];

  const created: Record<string, unknown>[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < spaces.length - 1; i++) {
    const a = spaces[i];
    const b = spaces[i + 1];
    const id = randomUUID();
    const winner = a.readinessScore >= b.readinessScore ? a.label : b.label;
    await q`
      INSERT INTO amber_benchmarks (
        id, scope, metric, subject_a, subject_b, value_a, value_b, winner, note, created_at
      ) VALUES (
        ${id}, ${"workspace"}, ${"readiness_score"}, ${a.label}, ${b.label},
        ${a.readinessScore}, ${b.readinessScore}, ${winner},
        ${"Compare Learning Mode workspaces — Reelo/Amber ops readiness only"}, ${now}
      )`;
    created.push({ id, subjectA: a.label, subjectB: b.label, winner, metric: "readiness_score" });
  }
  return created;
}

export async function generateEnterpriseBusinessReview(
  q: Sql,
  kind: "daily" | "weekly" | "monthly" | "quarterly" | "annual" = "weekly",
  actorEmail?: string | null,
): Promise<{ reviewId: string; summary: string }> {
  const { orgId, workspaces } = await syncEnterpriseWorkspaces(q, actorEmail);
  const forecasts = await generatePredictiveInsights(q);
  const benchmarks = await runBenchmarks(q);
  let readiness: Record<string, unknown> = {};
  try {
    readiness = await computeReadinessScore(q);
  } catch {
    readiness = {};
  }

  // Per-workspace briefings for first few
  const workspaceBriefs: Record<string, unknown>[] = [];
  for (const w of workspaces.slice(0, 3)) {
    const uid = String(w.userId);
    try {
      const b = await generateExecBriefing(q, uid, kind === "daily" ? "daily" : "weekly", actorEmail);
      workspaceBriefs.push({ userId: uid, label: w.label, ...b });
    } catch {
      workspaceBriefs.push({ userId: uid, label: w.label, error: "briefing_failed" });
    }
  }

  const summary = `${kind} enterprise review: ${workspaces.length} workspace(s), ${forecasts.length} forecast(s), readiness ${readiness.score ?? "n/a"}.`;
  const body = {
    summary,
    workspaces,
    forecasts: forecasts.slice(0, 20),
    benchmarks,
    readiness,
    workspaceBriefs,
    honestyNote: ENTERPRISE_HONESTY,
    flags: {
      learningMode: await getAmberLearningMode(),
      continuous: await getAmberContinuousCycle(),
      emergencyStop: await getAmberEmergencyStop(),
    },
    generatedAt: new Date().toISOString(),
  };

  const reviewId = randomUUID();
  await q`
    INSERT INTO amber_business_reviews (id, org_id, user_id, kind, period, summary, body, created_at)
    VALUES (
      ${reviewId}, ${orgId}, ${null}, ${kind}, ${new Date().toISOString().slice(0, 10)},
      ${summary.slice(0, 2000)}, ${JSON.stringify(body)}, ${new Date().toISOString()}
    )`;

  await logAmberAction({
    actorUserId: null,
    actorEmail: actorEmail ?? null,
    kind: "enterprise_business_review",
    title: `${kind} enterprise business review`,
    detail: { reviewId, workspaces: workspaces.length },
  });

  return { reviewId, summary };
}

export async function getEnterpriseDashboard(q: Sql): Promise<Record<string, unknown>> {
  const synced = await syncEnterpriseWorkspaces(q);
  const forecasts = (await q`
    SELECT id, user_id AS "userId", kind, title, confidence, prediction, mitigation, created_at AS "createdAt"
    FROM amber_forecasts ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];
  const benchmarks = (await q`
    SELECT id, scope, metric, subject_a AS "subjectA", subject_b AS "subjectB",
           value_a AS "valueA", value_b AS "valueB", winner, note, created_at AS "createdAt"
    FROM amber_benchmarks ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];
  const policies = (await q`
    SELECT id, slug, title, rule, threshold, enforced, created_at AS "createdAt"
    FROM amber_governance_policies ORDER BY created_at ASC LIMIT 30
  `) as Record<string, unknown>[];
  const reviews = (await q`
    SELECT id, kind, period, summary, created_at AS "createdAt"
    FROM amber_business_reviews ORDER BY created_at DESC LIMIT 10
  `) as Record<string, unknown>[];
  const allocations = (await q`
    SELECT id, user_id AS "userId", resource, assigned_to AS "assignedTo", weight, reason, status, created_at AS "createdAt"
    FROM amber_resource_allocations WHERE status = 'active' ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];
  const decisions = (await q`
    SELECT id, user_id AS "userId", title, confidence, decision, expected_impact AS "expectedImpact", created_at AS "createdAt"
    FROM amber_decision_intel ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];
  const kgCount = (await q`SELECT COUNT(*) AS n FROM amber_kg_nodes`) as { n: number | string }[];
  const strategies = (await q`
    SELECT id, user_id AS "userId", title, status, horizon, created_at AS "createdAt"
    FROM amber_strategic_plans ORDER BY created_at DESC LIMIT 15
  `) as Record<string, unknown>[];
  let readiness: Record<string, unknown> = {};
  try {
    readiness = await computeReadinessScore(q);
  } catch {
    readiness = {};
  }

  // Aggregate KPIs across workspaces (latest per workspace slug sampling)
  const kpiAgg: Record<string, { sum: number; count: number }> = {};
  for (const w of synced.workspaces.slice(0, 10)) {
    const kpis = (await q`
      SELECT slug, value FROM amber_kpis WHERE user_id = ${String(w.userId)}
      ORDER BY created_at DESC LIMIT 12
    `) as { slug: string; value: number }[];
    for (const k of kpis) {
      if (!kpiAgg[k.slug]) kpiAgg[k.slug] = { sum: 0, count: 0 };
      kpiAgg[k.slug].sum += Number(k.value) || 0;
      kpiAgg[k.slug].count += 1;
    }
  }
  const enterpriseKpis = Object.entries(kpiAgg).map(([slug, v]) => ({
    slug,
    avg: v.count ? Math.round((v.sum / v.count) * 100) / 100 : 0,
    samples: v.count,
  }));

  return {
    honestyNote: ENTERPRISE_HONESTY,
    orgId: synced.orgId,
    workspaces: synced.workspaces,
    readiness,
    forecasts,
    benchmarks,
    policies,
    reviews,
    allocations,
    decisions,
    enterpriseKpis,
    knowledgeGraph: { nodeCount: Number(kgCount[0]?.n || 0) },
    strategies,
    flags: {
      learningMode: await getAmberLearningMode(),
      continuous: await getAmberContinuousCycle(),
      emergencyStop: await getAmberEmergencyStop(),
      learningWorkspaces: await getAmberLearningWorkspaces(),
    },
  };
}

/** Full enterprise intelligence pass (additive). */
export async function runEnterpriseIntelligencePass(
  q: Sql,
  actorEmail?: string | null,
): Promise<Record<string, unknown>> {
  const synced = await syncEnterpriseWorkspaces(q, actorEmail);
  const forecasts = await generatePredictiveInsights(q);
  const benchmarks = await runBenchmarks(q);
  const graphResults: Record<string, unknown>[] = [];
  const optimizations: Record<string, unknown>[] = [];
  const allocations: Record<string, unknown>[] = [];

  for (const w of synced.workspaces.slice(0, 5)) {
    const uid = String(w.userId);
    graphResults.push({ userId: uid, ...(await rebuildKnowledgeGraph(q, uid)) });
    optimizations.push({ userId: uid, ...(await runSelfOptimization(q, uid, actorEmail)) });
    allocations.push({ userId: uid, allocations: await allocateResources(q, uid) });
  }

  const review = await generateEnterpriseBusinessReview(q, "weekly", actorEmail);

  return {
    ok: true,
    synced,
    forecasts: forecasts.length,
    benchmarks: benchmarks.length,
    graphResults,
    optimizations,
    allocations,
    review,
    honestyNote: ENTERPRISE_HONESTY,
  };
}
