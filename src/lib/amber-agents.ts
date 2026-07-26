import { randomUUID } from "node:crypto";
import { logAmberAction } from "@/lib/amber-autonomous";
import { geminiJson } from "@/lib/amber-weekly";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

/** Amber 32 — specialized workers mapped to BOS departments. */
export const AMBER_AGENTS = [
  { id: "video", label: "Video Agent", capability: "scripts, production briefs, Reelo tool requests", department: "content" },
  { id: "research", label: "Research Agent", capability: "competitors, seasonal trends, ICPs", department: "research" },
  { id: "seo", label: "SEO Agent", capability: "titles, descriptions, searchable hooks", department: "marketing" },
  { id: "design", label: "Design Agent", capability: "thumbnails, visual direction notes", department: "brand" },
  { id: "customer_service", label: "Customer Service Agent", capability: "FAQ / reply drafts", department: "customer_comms" },
  { id: "sales", label: "Sales Agent", capability: "offer framing, CTAs", department: "marketing" },
  { id: "advertising", label: "Advertising Agent", capability: "paid boost recommendations", department: "marketing" },
  { id: "analytics", label: "Analytics Agent", capability: "Reelo workspace performance summaries", department: "analytics" },
  { id: "campaign_planner", label: "Campaign Planner", capability: "campaign packages and themes", department: "marketing" },
  { id: "copywriter", label: "Copywriter", capability: "captions, hooks, scripts", department: "content" },
  { id: "social_scheduler", label: "Social Scheduler", capability: "calendar windows and queue prep", department: "social" },
  { id: "performance_analyst", label: "Performance Analyst", capability: "honest Reelo outcome analysis", department: "analytics" },
  { id: "trend_researcher", label: "Trend Researcher", capability: "seasonal / topic research from BI", department: "research" },
  { id: "brand_reviewer", label: "Brand Reviewer", capability: "brand rules compliance notes", department: "brand" },
] as const;

export type AmberAgentId = (typeof AMBER_AGENTS)[number]["id"];

function departmentFor(agent: string): string {
  const found = AMBER_AGENTS.find((a) => a.id === agent);
  return found?.department || "marketing";
}

export async function assignAgentJobs(input: {
  q: Sql;
  userId: string;
  goal: string;
  campaignId?: string | null;
  actorEmail?: string | null;
}): Promise<{ jobs: { id: string; agent: string; title: string; department: string }[] }> {
  const { q, userId, goal, campaignId, actorEmail } = input;

  let plan: Record<string, unknown> = {};
  try {
    plan = await geminiJson(`Amber (COO) assigns work to specialized AI workers by department.
Goal: ${goal}
Available agents: ${JSON.stringify(AMBER_AGENTS)}
Return JSON:
{
  "assignments": [
    {"agent":"campaign_planner|copywriter|social_scheduler|performance_analyst|trend_researcher|brand_reviewer|video|research|seo|design|sales|analytics","title":"...","brief":"..."}
  ]
}
Assign 4-7 jobs. Only use listed agent ids.`);
  } catch {
    plan = {
      assignments: [
        { agent: "campaign_planner", title: "Plan weekly campaign", brief: goal },
        { agent: "copywriter", title: "Draft hooks and captions", brief: goal },
        { agent: "social_scheduler", title: "Propose posting windows", brief: goal },
        { agent: "performance_analyst", title: "Summarize Reelo outcomes", brief: "Reelo-only metrics" },
        { agent: "brand_reviewer", title: "Check brand rules", brief: goal },
      ],
    };
  }

  const jobs: { id: string; agent: string; title: string; department: string }[] = [];
  const now = new Date().toISOString();
  const raw = Array.isArray(plan.assignments) ? plan.assignments : [];
  const valid = new Set(AMBER_AGENTS.map((a) => a.id));

  for (const a of raw.slice(0, 8)) {
    const row = asRecord(a);
    const agent = String(row.agent || "").slice(0, 40);
    if (!valid.has(agent as AmberAgentId)) continue;
    const id = randomUUID();
    const title = String(row.title || `${agent} job`).slice(0, 160);
    const brief = String(row.brief || goal).slice(0, 4000);
    const department = departmentFor(agent);

    let result: Record<string, unknown> = { status: "queued" };
    try {
      result = await geminiJson(`You are Amber's ${agent} agent (${department} department).
Brief: ${brief}
Return JSON useful for the marketing pipeline. No fabricated social reach.
{"summary":"...","deliverables":["..."],"notes":"..."}`);
    } catch {
      result = { summary: "Agent stub completed with brief only.", deliverables: [], notes: brief.slice(0, 200) };
    }

    await q`
      INSERT INTO amber_agent_jobs (
        id, user_id, agent, title, brief, status, result, campaign_id, department, created_at, updated_at
      ) VALUES (
        ${id}, ${userId}, ${agent}, ${title}, ${brief}, ${"done"},
        ${JSON.stringify(result)}, ${campaignId ?? null}, ${department}, ${now}, ${now}
      )`;
    jobs.push({ id, agent, title, department });
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "agent_assign",
    title: `Assigned ${jobs.length} department worker job(s)`,
    detail: { jobs, goal: goal.slice(0, 200) },
  });

  return { jobs };
}

export async function recommendInfrastructure(
  q: Sql,
  userId: string,
): Promise<{ recommendations: { area: string; severity: string; detail: string }[] }> {
  const profile = (await q`
    SELECT company, brand_rules AS "brandRules", competitors, services, products
    FROM business_profiles WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const kit = (await q`
    SELECT brand_name AS "brandName", logo_url AS "logoUrl", colors FROM brand_kits WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const accounts = (await q`
    SELECT provider, status FROM social_accounts WHERE user_id = ${userId}
  `) as { provider: string; status: string }[];
  const emails = (await q`
    SELECT role FROM amber_infra_emails WHERE user_id = ${userId}
  `) as { role: string }[];
  const holds = (await q`
    SELECT provider, step FROM amber_verification_holds WHERE user_id = ${userId} AND status = 'paused'
  `) as { provider: string; step: string }[];

  const recommendations: { area: string; severity: string; detail: string }[] = [];
  if (!kit[0]?.brandName) {
    recommendations.push({ area: "brand", severity: "medium", detail: "Brand kit name missing — Amber will use business profile." });
  }
  if (!accounts.some((a) => a.status === "connected")) {
    recommendations.push({ area: "social", severity: "high", detail: "No connected social accounts — scheduling can proceed; publish will wait for OAuth." });
  }
  if (holds.length) {
    recommendations.push({
      area: "verification",
      severity: "high",
      detail: `Owner action required: ${holds.map((h) => `${h.provider}/${h.step}`).join(", ")}`,
    });
  }
  if (!emails.length) {
    recommendations.push({
      area: "infra",
      severity: "low",
      detail: "No infra emails planned — Amber will not create mailboxes; owner provisions providers.",
    });
  }
  if (!profile[0]?.brandRules) {
    recommendations.push({ area: "brand", severity: "low", detail: "Add brand rules so QA can enforce claims/CTAs." });
  }
  return { recommendations };
}
