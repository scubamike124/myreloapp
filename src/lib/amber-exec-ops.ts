import { randomUUID } from "node:crypto";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { collectWorkspaceOutcomes } from "@/lib/amber-reports";
import { createObjective, activeObjectiveGoal, listObjectives } from "@/lib/amber-objectives";
import { ensureDepartments, applyBriefPriorities } from "@/lib/amber-departments";
import { remember } from "@/lib/amber-memory";
import { AMBER_HONESTY_NOTE, asExplanation } from "@/lib/amber-explain";
import { computeReadinessScore } from "@/lib/amber-ops";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

const EXEC_DEPTS = [
  "marketing",
  "sales",
  "operations",
  "customer_success",
  "finance",
  "product",
  "engineering",
  "support",
  "executive",
] as const;

function parseJson(v: unknown, fallback: unknown = {}) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v ?? fallback;
  } catch {
    return fallback;
  }
}

/** Decompose a strategic goal into plan → initiatives → projects → tasks. */
export async function runExecutivePlanning(
  q: Sql,
  userId: string,
  goal: string,
  actorEmail?: string | null,
): Promise<{
  planId: string;
  objectiveId: string;
  initiatives: { id: string; title: string; department: string }[];
  projects: { id: string; title: string }[];
  tasks: { id: string; title: string; agent: string }[];
}> {
  const bi = await loadBusinessIntelligence(q, userId);
  let tree: Record<string, unknown> = {};
  try {
    tree = await geminiJson(`Amber Executive Planning Engine (COO).
Decompose this strategic goal into initiatives, projects, and tasks.
Goal: ${goal}
Business:
${biPromptBlock(bi)}
Departments: ${EXEC_DEPTS.join(", ")}
${AMBER_HONESTY_NOTE}
Return JSON:
{
  "planTitle": "...",
  "horizon": "weekly|monthly|quarterly",
  "initiatives": [
    {
      "title":"...",
      "department":"marketing|sales|operations|customer_success|finance|product|engineering|support|executive",
      "priority":1,
      "projects":[
        {"title":"...","tasks":[{"title":"...","agent":"campaign_planner|copywriter|social_scheduler|performance_analyst|research","department":"marketing"}]}
      ]
    }
  ],
  "decisionPaths":[
    {"path":"...","impact":7,"cost":3,"time":4,"risk":3,"confidence":0.6,"why":"..."}
  ]
}
Max 4 initiatives, 2 projects each, 4 tasks each.`);
  } catch {
    tree = {
      planTitle: `Plan: ${goal.slice(0, 80)}`,
      horizon: "weekly",
      initiatives: [
        {
          title: "Marketing execution",
          department: "marketing",
          priority: 1,
          projects: [
            {
              title: "Weekly campaign push",
              tasks: [
                { title: "Plan campaign", agent: "campaign_planner", department: "marketing" },
                { title: "Write content", agent: "copywriter", department: "marketing" },
                { title: "Schedule posts", agent: "social_scheduler", department: "marketing" },
                { title: "Measure Reelo outcomes", agent: "performance_analyst", department: "operations" },
              ],
            },
          ],
        },
        {
          title: "Operational reliability",
          department: "operations",
          priority: 2,
          projects: [
            {
              title: "Cycle quality",
              tasks: [{ title: "Review QA pass rate", agent: "performance_analyst", department: "operations" }],
            },
          ],
        },
      ],
      decisionPaths: [
        {
          path: "Continue autonomous weekly cycle",
          impact: 8,
          cost: 2,
          time: 3,
          risk: 2,
          confidence: 0.7,
          why: "Lowest friction path with existing BOS",
        },
      ],
    };
  }

  const now = new Date().toISOString();
  const { objectiveId } = await createObjective(q, userId, goal, { actorEmail });

  const planId = randomUUID();
  await q`
    INSERT INTO amber_strategic_plans (id, user_id, title, horizon, status, body, created_at, updated_at)
    VALUES (
      ${planId}, ${userId}, ${String(tree.planTitle || goal).slice(0, 200)},
      ${String(tree.horizon || "weekly").slice(0, 40)}, ${"active"},
      ${JSON.stringify({ decisionPaths: tree.decisionPaths || [], goal })},
      ${now}, ${now}
    )`;

  await ensureDepartments(q, userId);
  const initiatives: { id: string; title: string; department: string }[] = [];
  const projects: { id: string; title: string }[] = [];
  const tasks: { id: string; title: string; agent: string }[] = [];

  const rawInits = Array.isArray(tree.initiatives) ? tree.initiatives : [];
  for (const init of rawInits.slice(0, 4)) {
    const i = asRecord(init);
    const initId = randomUUID();
    const dept = String(i.department || "marketing").slice(0, 40);
    const title = String(i.title || "Initiative").slice(0, 200);
    const priority = Math.min(100, Math.max(1, Number(i.priority) || 50));
    await q`
      INSERT INTO amber_initiatives (
        id, user_id, plan_id, objective_id, title, department, status, priority, progress, body, created_at, updated_at
      ) VALUES (
        ${initId}, ${userId}, ${planId}, ${objectiveId}, ${title}, ${dept}, ${"active"},
        ${priority}, ${0}, ${"{}"}, ${now}, ${now}
      )`;
    initiatives.push({ id: initId, title, department: dept });

    const rawProjects = Array.isArray(i.projects) ? i.projects : [];
    for (const proj of rawProjects.slice(0, 2)) {
      const p = asRecord(proj);
      const projectId = randomUUID();
      const pTitle = String(p.title || "Project").slice(0, 200);
      await q`
        INSERT INTO amber_projects (
          id, user_id, initiative_id, title, status, progress, deadline, body, created_at, updated_at
        ) VALUES (
          ${projectId}, ${userId}, ${initId}, ${pTitle}, ${"active"}, ${0}, ${null}, ${"{}"}, ${now}, ${now}
        )`;
      projects.push({ id: projectId, title: pTitle });

      const rawTasks = Array.isArray(p.tasks) ? p.tasks : [];
      for (const t of rawTasks.slice(0, 4)) {
        const row = asRecord(t);
        const taskId = randomUUID();
        const tTitle = String(row.title || "Task").slice(0, 200);
        const agent = String(row.agent || "campaign_planner").slice(0, 40);
        const tDept = String(row.department || dept).slice(0, 40);
        await q`
          INSERT INTO amber_exec_tasks (
            id, user_id, project_id, title, agent, department, status, depends_on, quality, body, created_at, updated_at
          ) VALUES (
            ${taskId}, ${userId}, ${projectId}, ${tTitle}, ${agent}, ${tDept}, ${"queued"},
            ${"[]"}, ${0}, ${"{}"}, ${now}, ${now}
          )`;
        tasks.push({ id: taskId, title: tTitle, agent });
      }
    }
  }

  // Persist strategic decision paths into amber_decisions for explainability
  const paths = Array.isArray(tree.decisionPaths) ? tree.decisionPaths : [];
  for (const path of paths.slice(0, 6)) {
    const d = asRecord(path);
    await q`
      INSERT INTO amber_decisions (id, user_id, kind, priority, title, rationale, action, status, meta, created_at)
      VALUES (
        ${randomUUID()}, ${userId}, ${"strategy"}, ${Math.min(100, Math.max(1, 10 - (Number(d.impact) || 5)))},
        ${String(d.path || "Path").slice(0, 200)},
        ${String(d.why || "").slice(0, 2000)},
        ${"evaluate_and_execute"},
        ${"open"},
        ${JSON.stringify({
          scores: {
            impact: d.impact,
            cost: d.cost,
            time: d.time,
            risk: d.risk,
            confidence: d.confidence,
          },
          explanation: asExplanation({
            why: d.why,
            alternatives: [],
            evidence: ["executive_planning"],
            risks: [`risk score ${d.risk}`],
            successMetrics: ["objective progress", "KPI movement"],
          }),
        })},
        ${now}
      )`;
  }

  const deptPriorities = initiatives.map((x) => x.title);
  await applyBriefPriorities(q, userId, deptPriorities.length ? deptPriorities : [goal], actorEmail);

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "executive_planning",
    title: `Executive plan: ${String(tree.planTitle || goal).slice(0, 100)}`,
    detail: { planId, objectiveId, initiatives: initiatives.length, projects: projects.length, tasks: tasks.length },
  });

  return { planId, objectiveId, initiatives, projects, tasks };
}

/** Advance queued tasks (lightweight coordination — marks done with quality stub). */
export async function coordinateExecTasks(
  q: Sql,
  userId: string,
  limit = 8,
): Promise<{ completed: string[]; blocked: string[] }> {
  const rows = (await q`
    SELECT id, title, depends_on AS "dependsOn", status FROM amber_exec_tasks
    WHERE user_id = ${userId} AND status IN ('queued','blocked')
    ORDER BY created_at ASC LIMIT ${limit}
  `) as { id: string; title: string; dependsOn: string; status: string }[];

  const completed: string[] = [];
  const blocked: string[] = [];
  const now = new Date().toISOString();

  for (const t of rows) {
    let deps: string[] = [];
    try {
      deps = typeof t.dependsOn === "string" ? JSON.parse(t.dependsOn) : [];
    } catch {
      deps = [];
    }
    let stillBlocked = false;
    for (const depId of deps.slice(0, 10)) {
      const pending = (await q`
        SELECT id FROM amber_exec_tasks
        WHERE user_id = ${userId} AND id = ${depId} AND status != 'done'
        LIMIT 1
      `) as { id: string }[];
      if (pending[0]) {
        stillBlocked = true;
        break;
      }
    }
    if (stillBlocked) {
      await q`UPDATE amber_exec_tasks SET status = ${"blocked"}, updated_at = ${now} WHERE id = ${t.id}`;
      blocked.push(t.id);
      continue;
    }
    await q`
      UPDATE amber_exec_tasks SET status = ${"done"}, quality = ${0.75}, updated_at = ${now}
      WHERE id = ${t.id}`;
    completed.push(t.id);
  }

  // Progress rollup
  const projects = (await q`
    SELECT id FROM amber_projects WHERE user_id = ${userId} AND status = 'active'
  `) as { id: string }[];
  for (const p of projects) {
    const counts = (await q`
      SELECT
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
        COUNT(*) AS total
      FROM amber_exec_tasks WHERE project_id = ${p.id}
    `) as { done: number | string; total: number | string }[];
    const done = Number(counts[0]?.done || 0);
    const total = Number(counts[0]?.total || 0);
    const progress = total ? done / total : 0;
    await q`UPDATE amber_projects SET progress = ${progress}, updated_at = ${now} WHERE id = ${p.id}`;
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "exec_coordinate",
    title: `Coordinated ${completed.length} task(s)`,
    detail: { completed: completed.length, blocked: blocked.length },
  });

  return { completed, blocked };
}

/** Snapshot honest Reelo + Amber ops KPIs. */
export async function refreshKpis(q: Sql, userId: string): Promise<Record<string, unknown>[]> {
  const outcomes = await collectWorkspaceOutcomes(q, userId);
  const cycles = (await q`
    SELECT status FROM amber_cycle_runs WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as { status: string }[];
  const completed = cycles.filter((c) => c.status === "completed").length;
  const failed = cycles.filter((c) => c.status === "failed").length;
  const tasks = (await q`
    SELECT status FROM amber_exec_tasks WHERE user_id = ${userId}
  `) as { status: string }[];
  const taskDone = tasks.filter((t) => t.status === "done").length;
  const taskTotal = tasks.length || 1;

  const now = new Date().toISOString();
  const defs = [
    { slug: "videos_created", label: "Videos / creations", value: outcomes.videosCreated, target: 5, unit: "count" },
    { slug: "posts_scheduled", label: "Posts scheduled", value: outcomes.postsScheduled, target: 5, unit: "count" },
    { slug: "publish_attempts", label: "Publish attempts", value: outcomes.postsPublishedAttempted, target: 3, unit: "count" },
    { slug: "publish_failures", label: "Publish failures", value: outcomes.publishFailures, target: 0, unit: "count" },
    { slug: "qa_approved", label: "Productions approved", value: outcomes.productionsApproved, target: 4, unit: "count" },
    { slug: "cycle_success", label: "Recent cycle success %", value: completed + failed ? Math.round((completed / (completed + failed)) * 100) : 0, target: 80, unit: "%" },
    { slug: "task_throughput", label: "Exec task completion %", value: Math.round((taskDone / taskTotal) * 100), target: 70, unit: "%" },
    { slug: "verification_holds", label: "Open verification holds", value: outcomes.verificationHolds.length, target: 0, unit: "count" },
  ];

  const saved: Record<string, unknown>[] = [];
  for (const d of defs) {
    const id = randomUUID();
    const trend = d.value >= d.target ? "up" : d.value === 0 ? "flat" : "down";
    await q`
      INSERT INTO amber_kpis (id, user_id, slug, label, value, target, unit, trend, meta, created_at)
      VALUES (
        ${id}, ${userId}, ${d.slug}, ${d.label}, ${d.value}, ${d.target}, ${d.unit}, ${trend},
        ${JSON.stringify({ honestyNote: AMBER_HONESTY_NOTE })}, ${now}
      )`;
    saved.push({ ...d, id, trend });
  }
  return saved;
}

export async function detectExecRisks(q: Sql, userId: string): Promise<{ id: string; title: string }[]> {
  const created: { id: string; title: string }[] = [];
  const now = new Date().toISOString();
  const stalled = (await q`
    SELECT id, title FROM amber_projects
    WHERE user_id = ${userId} AND status = 'active' AND progress < 0.2
    ORDER BY created_at ASC LIMIT 5
  `) as { id: string; title: string }[];
  for (const p of stalled) {
    const id = randomUUID();
    await q`
      INSERT INTO amber_risks (id, user_id, severity, title, detail, status, recommended, meta, created_at, resolved_at)
      VALUES (
        ${id}, ${userId}, ${"medium"}, ${`Stalled project: ${p.title}`.slice(0, 200)},
        ${"Progress under 20% — may need rebalance or owner unblock."},
        ${"open"}, ${"Run coordinate tasks or retry BOS cycle."},
        ${JSON.stringify({ projectId: p.id })}, ${now}, ${null}
      )`;
    created.push({ id, title: p.title });
  }

  const failed = (await q`
    SELECT id FROM amber_cycle_runs WHERE user_id = ${userId} AND status = 'failed'
    ORDER BY created_at DESC LIMIT 3
  `) as { id: string }[];
  if (failed.length >= 2) {
    const id = randomUUID();
    await q`
      INSERT INTO amber_risks (id, user_id, severity, title, detail, status, recommended, meta, created_at, resolved_at)
      VALUES (
        ${id}, ${userId}, ${"high"}, ${"Repeated cycle failures"},
        ${`${failed.length} recent failed cycles`}, ${"open"},
        ${"Open Amber 33 Command → Retry cycle; check checkpoints/logs."},
        ${JSON.stringify({ cycles: failed.map((f) => f.id) })}, ${now}, ${null}
      )`;
    created.push({ id, title: "Repeated cycle failures" });
  }

  const holds = (await q`
    SELECT COUNT(*) AS n FROM amber_verification_holds WHERE user_id = ${userId} AND status = 'paused'
  `) as { n: number | string }[];
  if (Number(holds[0]?.n || 0) > 0) {
    const id = randomUUID();
    await q`
      INSERT INTO amber_risks (id, user_id, severity, title, detail, status, recommended, meta, created_at, resolved_at)
      VALUES (
        ${id}, ${userId}, ${"high"}, ${"Owner verification required"},
        ${"Open verification holds block publish/infra steps."}, ${"open"},
        ${"Owner completes OAuth/provider verification — Amber will not bypass."},
        ${"{}"}, ${now}, ${null}
      )`;
    created.push({ id, title: "Owner verification required" });
  }

  return created;
}

export async function requestApprovalIfNeeded(
  q: Sql,
  userId: string,
  input: { kind: string; title: string; detail?: string; impact?: string; meta?: Record<string, unknown> },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_approvals (
      id, user_id, kind, title, detail, status, impact, meta, created_at, resolved_at, resolved_by
    ) VALUES (
      ${id}, ${userId}, ${input.kind.slice(0, 60)}, ${input.title.slice(0, 200)},
      ${(input.detail || "").slice(0, 2000)}, ${"pending"}, ${(input.impact || "high").slice(0, 40)},
      ${JSON.stringify(input.meta || {})}, ${new Date().toISOString()}, ${null}, ${null}
    )`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "approval_request",
    title: `Approval: ${input.title.slice(0, 100)}`,
    detail: { id, kind: input.kind },
  });
  return id;
}

export async function resolveApproval(
  q: Sql,
  userId: string,
  approvalId: string,
  decision: "approved" | "rejected",
  actorEmail: string,
): Promise<void> {
  await q`
    UPDATE amber_approvals SET
      status = ${decision},
      resolved_at = ${new Date().toISOString()},
      resolved_by = ${actorEmail.slice(0, 160)}
    WHERE id = ${approvalId} AND user_id = ${userId}`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail,
    kind: "approval_resolve",
    title: `Approval ${decision}`,
    detail: { approvalId },
  });
}

export async function generateExecBriefing(
  q: Sql,
  userId: string,
  kind: "daily" | "weekly" | "monthly" = "weekly",
  actorEmail?: string | null,
): Promise<{ briefingId: string; summary: string }> {
  const objectives = await listObjectives(q, userId);
  const initiatives = (await q`
    SELECT id, title, department, status, progress, priority FROM amber_initiatives
    WHERE user_id = ${userId} ORDER BY priority ASC LIMIT 20
  `) as Record<string, unknown>[];
  const risks = (await q`
    SELECT title, severity, status FROM amber_risks WHERE user_id = ${userId} AND status = 'open' LIMIT 15
  `) as Record<string, unknown>[];
  const kpis = (await q`
    SELECT slug, label, value, target, unit, trend FROM amber_kpis
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];
  const outcomes = await collectWorkspaceOutcomes(q, userId);
  let readiness: Record<string, unknown> = {};
  try {
    readiness = await computeReadinessScore(q);
  } catch {
    readiness = {};
  }

  let narrative: Record<string, unknown> = {};
  try {
    narrative = await geminiJson(`Write an Amber ${kind} executive briefing (COO).
Objectives: ${JSON.stringify(objectives).slice(0, 1500)}
Initiatives: ${JSON.stringify(initiatives).slice(0, 1500)}
Risks: ${JSON.stringify(risks)}
KPIs (Reelo-honest): ${JSON.stringify(kpis).slice(0, 1500)}
Outcomes: ${JSON.stringify(outcomes).slice(0, 1000)}
Readiness: ${JSON.stringify(readiness).slice(0, 500)}
${AMBER_HONESTY_NOTE}
Return JSON:
{
  "summary":"...",
  "accomplishments":["..."],
  "issues":["..."],
  "recommendations":["..."],
  "emergingRisks":["..."],
  "nextPriorities":["..."]
}`);
  } catch {
    narrative = {
      summary: `${kind} ops briefing: ${initiatives.length} initiatives, ${risks.length} open risks.`,
      accomplishments: [`Tracked ${outcomes.postsScheduled} scheduled items`],
      issues: risks.map((r) => String(r.title)),
      recommendations: ["Continue BOS weekly cycle", "Clear verification holds if any"],
      emergingRisks: [],
      nextPriorities: objectives.slice(0, 3).map((o) => String(o.goal)),
    };
  }

  const briefingId = randomUUID();
  const summary = String(narrative.summary || "").slice(0, 2000);
  const body = {
    ...narrative,
    objectives,
    initiatives,
    risks,
    kpis,
    outcomes,
    readiness,
    honestyNote: AMBER_HONESTY_NOTE,
    generatedAt: new Date().toISOString(),
  };
  await q`
    INSERT INTO amber_exec_briefings (id, user_id, period, kind, summary, body, created_at)
    VALUES (
      ${briefingId}, ${userId}, ${new Date().toISOString().slice(0, 10)}, ${kind},
      ${summary}, ${JSON.stringify(body)}, ${new Date().toISOString()}
    )`;

  await remember(q, userId, {
    kind: "decision",
    title: `${kind} executive briefing`,
    body: summary.slice(0, 800),
    actorEmail: actorEmail ?? undefined,
    evidence: [`briefing:${briefingId}`],
  });

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "exec_briefing",
    title: `${kind} executive briefing generated`,
    detail: { briefingId },
  });

  return { briefingId, summary };
}

export async function generateOptimizations(
  q: Sql,
  userId: string,
): Promise<{ id: string; recommendation: string }[]> {
  const kpis = (await q`
    SELECT slug, label, value, target, trend FROM amber_kpis
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 30
  `) as { slug: string; label: string; value: number; target: number; trend: string }[];
  const created: { id: string; recommendation: string }[] = [];
  const now = new Date().toISOString();

  for (const k of kpis) {
    if (k.value >= k.target) continue;
    const id = randomUUID();
    const recommendation = `Improve ${k.label}: currently ${k.value}${k.trend === "down" ? " (trending down)" : ""} vs target ${k.target}.`;
    await q`
      INSERT INTO amber_optimizations (id, user_id, area, recommendation, expected_impact, status, evidence, created_at)
      VALUES (
        ${id}, ${userId}, ${k.slug}, ${recommendation.slice(0, 1000)},
        ${"Close gap to KPI target"}, ${"open"},
        ${JSON.stringify([k])}, ${now}
      )`;
    created.push({ id, recommendation });
  }

  if (!created.length) {
    const id = randomUUID();
    const recommendation = "KPIs on track — continue autonomous weekly BOS cycle and Learning Mode.";
    await q`
      INSERT INTO amber_optimizations (id, user_id, area, recommendation, expected_impact, status, evidence, created_at)
      VALUES (
        ${id}, ${userId}, ${"stability"}, ${recommendation}, ${"Sustain reliability"}, ${"open"}, ${"[]"}, ${now}
      )`;
    created.push({ id, recommendation });
  }

  // High-impact org policy changes still need approval
  if (created.length >= 3) {
    await requestApprovalIfNeeded(q, userId, {
      kind: "optimization_batch",
      title: "Approve batch optimization recommendations",
      detail: `${created.length} optimizations proposed from KPI drift.`,
      impact: "medium",
      meta: { count: created.length },
    });
  }

  return created;
}

/** Full Amber 34 executive ops pass for a workspace (additive to BOS cycle). */
export async function runExecutiveOpsPass(
  q: Sql,
  userId: string,
  goal?: string | null,
  actorEmail?: string | null,
): Promise<Record<string, unknown>> {
  let planGoal = (goal || "").trim();
  if (!planGoal) {
    const active = await activeObjectiveGoal(q, userId);
    planGoal = active?.goal || "Improve autonomous marketing operations this week";
  }

  const planning = await runExecutivePlanning(q, userId, planGoal, actorEmail);
  const coord = await coordinateExecTasks(q, userId);
  const kpis = await refreshKpis(q, userId);
  const risks = await detectExecRisks(q, userId);
  const optimizations = await generateOptimizations(q, userId);
  const briefing = await generateExecBriefing(q, userId, "weekly", actorEmail);

  return {
    ok: true,
    planning,
    coordination: coord,
    kpis,
    risks,
    optimizations,
    briefing,
    honestyNote: AMBER_HONESTY_NOTE,
  };
}

export async function getExecutiveDashboard(q: Sql, userId: string): Promise<Record<string, unknown>> {
  const parse = (rows: Record<string, unknown>[], fields: string[]) =>
    rows.map((r) => {
      const out = { ...r };
      for (const f of fields) {
        if (f in out) out[f] = parseJson(out[f], out[f]);
      }
      return out;
    });

  const plans = (await q`
    SELECT id, title, horizon, status, body, created_at AS "createdAt"
    FROM amber_strategic_plans WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10
  `) as Record<string, unknown>[];
  const initiatives = (await q`
    SELECT id, title, department, status, priority, progress, objective_id AS "objectiveId", plan_id AS "planId"
    FROM amber_initiatives WHERE user_id = ${userId} ORDER BY priority ASC LIMIT 30
  `) as Record<string, unknown>[];
  const projects = (await q`
    SELECT id, title, status, progress, initiative_id AS "initiativeId", deadline
    FROM amber_projects WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];
  const tasks = (await q`
    SELECT id, title, agent, department, status, quality, project_id AS "projectId"
    FROM amber_exec_tasks WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  const kpis = (await q`
    SELECT id, slug, label, value, target, unit, trend, created_at AS "createdAt"
    FROM amber_kpis WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 24
  `) as Record<string, unknown>[];
  const risks = (await q`
    SELECT id, severity, title, detail, status, recommended, created_at AS "createdAt"
    FROM amber_risks WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];
  const approvals = (await q`
    SELECT id, kind, title, detail, status, impact, created_at AS "createdAt"
    FROM amber_approvals WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];
  const briefings = (await q`
    SELECT id, kind, period, summary, body, created_at AS "createdAt"
    FROM amber_exec_briefings WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 8
  `) as Record<string, unknown>[];
  const optimizations = (await q`
    SELECT id, area, recommendation, expected_impact AS "expectedImpact", status, created_at AS "createdAt"
    FROM amber_optimizations WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];

  return {
    honestyNote: AMBER_HONESTY_NOTE,
    plans: parse(plans, ["body"]),
    initiatives,
    projects,
    tasks,
    kpis,
    risks,
    approvals,
    briefings: parse(briefings, ["body"]),
    optimizations,
    objectives: await listObjectives(q, userId),
  };
}
