import { randomUUID } from "node:crypto";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { asExplanation, AMBER_HONESTY_NOTE, type AmberExplanation } from "@/lib/amber-explain";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";
import type { AmberHealthScores } from "@/lib/amber-explain";

export async function generateImprovements(
  q: Sql,
  userId: string,
  input: {
    goal: string;
    health?: AmberHealthScores | null;
    reportSummary?: string;
    actorEmail?: string | null;
  },
): Promise<{ id: string; area: string; recommendation: string }[]> {
  let raw: Record<string, unknown> = {};
  try {
    raw = await geminiJson(`Amber autonomous improvement engine.
Goal: ${input.goal}
Health: ${JSON.stringify(input.health || {}).slice(0, 1200)}
Report: ${(input.reportSummary || "").slice(0, 800)}
${AMBER_HONESTY_NOTE}
Return JSON:
{
  "improvements": [
    {
      "area":"content|social|brand|infra|strategy|analytics",
      "recommendation":"...",
      "expectedImpact":"...",
      "effort":"low|medium|high",
      "evidence":["..."],
      "explanation":{"why":"...","alternatives":[],"evidence":[],"risks":[],"successMetrics":[]}
    }
  ]
}
Max 6 items. No fabricated social metrics.`);
  } catch {
    raw = {
      improvements: [
        {
          area: "content",
          recommendation: "Increase approved production throughput before expanding platforms",
          expectedImpact: "More schedule-ready assets",
          effort: "medium",
          evidence: ["workspace productions"],
          explanation: {
            why: "Content bottleneck limits calendar fill",
            alternatives: ["Reuse library assets"],
            evidence: ["Recent production counts"],
            risks: ["Quality drop if rushing"],
            successMetrics: ["Higher QA pass rate"],
          },
        },
      ],
    };
  }

  const created: { id: string; area: string; recommendation: string }[] = [];
  const now = new Date().toISOString();
  const list = Array.isArray(raw.improvements) ? raw.improvements : [];
  for (const item of list.slice(0, 6)) {
    const r = asRecord(item);
    const id = randomUUID();
    const explanation: AmberExplanation = asExplanation(r.explanation);
    const area = String(r.area || "strategy").slice(0, 40);
    const recommendation = String(r.recommendation || "").slice(0, 1000);
    if (!recommendation) continue;
    await q`
      INSERT INTO amber_improvements (
        id, user_id, area, recommendation, expected_impact, effort, status, evidence, explanation, created_at, updated_at
      ) VALUES (
        ${id}, ${userId}, ${area}, ${recommendation},
        ${String(r.expectedImpact || "").slice(0, 500)},
        ${["low", "medium", "high"].includes(String(r.effort)) ? String(r.effort) : "medium"},
        ${"open"}, ${JSON.stringify(Array.isArray(r.evidence) ? r.evidence : [])},
        ${JSON.stringify(explanation)}, ${now}, ${now}
      )`;
    created.push({ id, area, recommendation });
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: input.actorEmail ?? null,
    kind: "improvements_generate",
    title: `Generated ${created.length} improvement(s)`,
    detail: { count: created.length },
  });

  return created;
}

export async function listImprovements(q: Sql, userId: string): Promise<Record<string, unknown>[]> {
  const rows = (await q`
    SELECT id, area, recommendation, expected_impact AS "expectedImpact", effort, status,
           evidence, explanation, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM amber_improvements WHERE user_id = ${userId}
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
    return { ...r, evidence: parse(r.evidence), explanation: parse(r.explanation) };
  });
}

export async function setImprovementStatus(
  q: Sql,
  userId: string,
  improvementId: string,
  status: "open" | "accepted" | "dismissed" | "done",
): Promise<void> {
  await q`
    UPDATE amber_improvements SET status = ${status}, updated_at = ${new Date().toISOString()}
    WHERE id = ${improvementId} AND user_id = ${userId}`;
}
