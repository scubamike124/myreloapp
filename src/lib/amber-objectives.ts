import { randomUUID } from "node:crypto";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { AMBER_HONESTY_NOTE } from "@/lib/amber-explain";
import type { Sql } from "@/lib/workspace-api";

export async function createObjective(
  q: Sql,
  userId: string,
  goal: string,
  opts?: { deadline?: string | null; actorEmail?: string | null },
): Promise<{ objectiveId: string; plan: Record<string, unknown> }> {
  const bi = await loadBusinessIntelligence(q, userId);
  let plan: Record<string, unknown> = {};
  try {
    plan = await geminiJson(`Break this business objective into an Amber BOS plan.
Goal: ${goal}
Business:
${biPromptBlock(bi)}
${AMBER_HONESTY_NOTE}
Return JSON:
{
  "successMetrics": ["Reelo-honest metrics only"],
  "projects": [{"title":"...","tasks":["..."]}],
  "campaigns": ["..."],
  "workers": ["campaign_planner","copywriter","social_scheduler"],
  "deadlineHint": "..."
}`);
  } catch {
    plan = {
      successMetrics: ["Cycle completed", "Productions approved", "Items scheduled"],
      projects: [{ title: "Weekly marketing push", tasks: ["Brief", "Produce", "QA", "Schedule"] }],
      campaigns: [goal.slice(0, 80)],
      workers: ["campaign_planner", "copywriter", "social_scheduler", "performance_analyst"],
      deadlineHint: opts?.deadline || null,
    };
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const metrics = Array.isArray(plan.successMetrics) ? plan.successMetrics : [];
  await q`
    INSERT INTO amber_objectives (
      id, user_id, goal, status, success_metrics, plan, deadline, mission_id, campaign_id, created_at, updated_at
    ) VALUES (
      ${id}, ${userId}, ${goal.slice(0, 2000)}, ${"active"},
      ${JSON.stringify(metrics)}, ${JSON.stringify(plan)},
      ${opts?.deadline ?? null}, ${null}, ${null}, ${now}, ${now}
    )`;

  await logAmberAction({
    actorUserId: userId,
    actorEmail: opts?.actorEmail ?? null,
    kind: "objective_create",
    title: `Objective: ${goal.slice(0, 100)}`,
    detail: { objectiveId: id },
  });

  return { objectiveId: id, plan };
}

export async function listObjectives(q: Sql, userId: string): Promise<Record<string, unknown>[]> {
  const rows = (await q`
    SELECT id, goal, status, success_metrics AS "successMetrics", plan, deadline,
           mission_id AS "missionId", campaign_id AS "campaignId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM amber_objectives WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  return rows.map((r) => {
    const parse = (v: unknown) => {
      try {
        return typeof v === "string" ? JSON.parse(String(v)) : v;
      } catch {
        return v;
      }
    };
    return { ...r, successMetrics: parse(r.successMetrics), plan: parse(r.plan) };
  });
}

export async function linkObjectiveArtifacts(
  q: Sql,
  objectiveId: string,
  userId: string,
  links: { missionId?: string | null; campaignId?: string | null },
): Promise<void> {
  await q`
    UPDATE amber_objectives SET
      mission_id = ${links.missionId ?? null},
      campaign_id = ${links.campaignId ?? null},
      updated_at = ${new Date().toISOString()}
    WHERE id = ${objectiveId} AND user_id = ${userId}`;
}

export async function activeObjectiveGoal(q: Sql, userId: string): Promise<{ id: string; goal: string } | null> {
  const rows = (await q`
    SELECT id, goal FROM amber_objectives
    WHERE user_id = ${userId} AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `) as { id: string; goal: string }[];
  return rows[0] || null;
}

/** Expand or refresh plan for existing objective. */
export async function expandObjectivePlan(
  q: Sql,
  userId: string,
  objectiveId: string,
  actorEmail?: string | null,
): Promise<Record<string, unknown>> {
  const rows = (await q`
    SELECT goal FROM amber_objectives WHERE id = ${objectiveId} AND user_id = ${userId} LIMIT 1
  `) as { goal: string }[];
  if (!rows[0]) throw new Error("Objective not found.");
  const goal = rows[0].goal;
  const bi = await loadBusinessIntelligence(q, userId);
  let plan: Record<string, unknown> = {};
  try {
    plan = await geminiJson(`Refresh Amber BOS plan for objective.
Goal: ${goal}
Business:
${biPromptBlock(bi)}
${AMBER_HONESTY_NOTE}
Return JSON:
{
  "successMetrics": ["..."],
  "projects": [{"title":"...","tasks":["..."]}],
  "campaigns": ["..."],
  "workers": ["campaign_planner","copywriter","social_scheduler"]
}`);
  } catch {
    plan = {
      successMetrics: ["Cycle completed", "Productions approved"],
      projects: [{ title: "Weekly push", tasks: ["Produce", "QA", "Schedule"] }],
      campaigns: [goal.slice(0, 80)],
      workers: ["campaign_planner", "copywriter", "social_scheduler"],
    };
  }
  const metrics = Array.isArray(plan.successMetrics) ? plan.successMetrics : [];
  await q`
    UPDATE amber_objectives SET
      plan = ${JSON.stringify(plan)},
      success_metrics = ${JSON.stringify(metrics)},
      updated_at = ${new Date().toISOString()}
    WHERE id = ${objectiveId} AND user_id = ${userId}`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "objective_expand",
    title: `Expanded objective plan`,
    detail: { objectiveId },
  });
  return plan;
}
