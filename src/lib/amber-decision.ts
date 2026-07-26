import { randomUUID } from "node:crypto";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { collectWorkspaceOutcomes } from "@/lib/amber-reports";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

/** Module 12 — prioritize work like a department manager. */
export async function runDecisionEngine(
  q: Sql,
  userId: string,
  actorEmail?: string | null,
): Promise<{ decisions: Record<string, unknown>[] }> {
  const bi = await loadBusinessIntelligence(q, userId);
  const outcomes = await collectWorkspaceOutcomes(q, userId);
  const campaigns = (await q`
    SELECT id, title, status, objective FROM amber_campaigns
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 15
  `) as Record<string, unknown>[];
  const holds = (await q`
    SELECT id, provider, step, status FROM amber_verification_holds
    WHERE user_id = ${userId} AND status = 'paused' LIMIT 10
  `) as Record<string, unknown>[];

  let plan: Record<string, unknown> = {};
  try {
    plan = await geminiJson(`You are Amber's autonomous decision engine (department manager).
Decide priorities for this workspace. Be honest — only Reelo data, no fake social reach.
Business:
${biPromptBlock(bi)}
Outcomes: ${JSON.stringify(outcomes).slice(0, 2000)}
Campaigns: ${JSON.stringify(campaigns).slice(0, 1000)}
Open verification holds: ${JSON.stringify(holds)}

Return JSON:
{
  "decisions": [
    {
      "kind": "promote|pause|improve|invest|wait|infra|publish",
      "priority": 1,
      "title": "...",
      "rationale": "why",
      "action": "concrete next step",
      "impact": 5,
      "urgency": 5,
      "cost": 3,
      "timeRequired": 4,
      "risk": 3,
      "goalAlignment": 7,
      "explanation": {"why":"...","alternatives":[],"evidence":[],"risks":[],"successMetrics":[]}
    }
  ],
  "stopCampaigns": ["campaign title if any"],
  "continueCampaigns": ["..."],
  "experiments": ["..."]
}
priority: 1 = most urgent. Include 4-8 decisions.`);
  } catch {
    plan = {
      decisions: [
        {
          kind: holds.length ? "infra" : "promote",
          priority: 1,
          title: holds.length ? "Resolve verification holds" : "Continue active campaigns",
          rationale: holds.length
            ? "Owner verification blocks progress on connected services."
            : "No blocking holds; continue marketing pipeline.",
          action: holds.length ? "Owner completes provider verification" : "Run weekly cycle",
        },
      ],
      stopCampaigns: [],
      continueCampaigns: campaigns.filter((c) => c.status === "active").map((c) => String(c.title)),
      experiments: [],
    };
  }

  // Clear prior open decisions for a fresh weekly slate
  await q`UPDATE amber_decisions SET status = ${"superseded"} WHERE user_id = ${userId} AND status = ${"open"}`;

  const decisions: Record<string, unknown>[] = [];
  const raw = Array.isArray(plan.decisions) ? plan.decisions : [];
  const now = new Date().toISOString();
  for (const d of raw.slice(0, 12)) {
    const row = asRecord(d);
    const id = randomUUID();
    const priority = Math.min(100, Math.max(1, Number(row.priority) || 50));
    const title = String(row.title || "Decision").slice(0, 200);
    const rationale = String(row.rationale || "").slice(0, 2000);
    const action = String(row.action || "").slice(0, 1000);
    const kind = String(row.kind || "promote").slice(0, 40);
    const meta = {
      stop: plan.stopCampaigns,
      continue: plan.continueCampaigns,
      experiments: plan.experiments,
      scores: {
        impact: Number(row.impact) || null,
        urgency: Number(row.urgency) || null,
        cost: Number(row.cost) || null,
        timeRequired: Number(row.timeRequired) || null,
        risk: Number(row.risk) || null,
        goalAlignment: Number(row.goalAlignment) || null,
      },
      explanation: row.explanation || { why: rationale, alternatives: [], evidence: [], risks: [], successMetrics: [] },
    };
    await q`
      INSERT INTO amber_decisions (id, user_id, kind, priority, title, rationale, action, status, meta, created_at)
      VALUES (
        ${id}, ${userId}, ${kind}, ${priority}, ${title}, ${rationale}, ${action},
        ${"open"}, ${JSON.stringify(meta)},
        ${now}
      )`;
    decisions.push({ id, kind, priority, title, rationale, action, status: "open", meta });
  }

  // Apply stop/continue to campaigns by title match when possible
  const stop = Array.isArray(plan.stopCampaigns) ? plan.stopCampaigns.map(String) : [];
  for (const title of stop) {
    await q`
      UPDATE amber_campaigns SET status = ${"paused"}, updated_at = ${now}
      WHERE user_id = ${userId} AND title = ${title.slice(0, 160)}`;
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "decision_engine",
    title: `Amber prioritized ${decisions.length} decision(s)`,
    detail: { count: decisions.length, top: decisions[0]?.title },
  });

  return { decisions };
}
