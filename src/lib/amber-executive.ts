import { randomUUID } from "node:crypto";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { memoryPromptBlock, recall } from "@/lib/amber-memory";
import { asExplanation, AMBER_HONESTY_NOTE, type AmberRecommendation, type AmberHealthScores } from "@/lib/amber-explain";
import { asRecord } from "@/lib/json";
import type { Sql } from "@/lib/workspace-api";

export async function buildExecutiveBrief(
  q: Sql,
  userId: string,
  input?: {
    health?: AmberHealthScores | null;
    goal?: string | null;
    cycleId?: string | null;
    actorEmail?: string | null;
  },
): Promise<{
  briefId: string;
  narrative: string;
  confidence: number;
  recommendations: AmberRecommendation[];
  body: Record<string, unknown>;
}> {
  const bi = await loadBusinessIntelligence(q, userId);
  const memory = await recall(q, userId, { limit: 20 });
  const health = input?.health || null;
  const goal = (input?.goal || bi.marketingObjectives || bi.goals || "").slice(0, 2000);

  let raw: Record<string, unknown> = {};
  try {
    raw = await geminiJson(`Amber Executive Brain (COO). Build this week's executive brief.
Business:
${biPromptBlock(bi)}
Company memory:
${memoryPromptBlock(memory)}
Health: ${JSON.stringify(health).slice(0, 1500)}
Owner goal: ${goal || "(none)"}
Honesty: ${AMBER_HONESTY_NOTE}
Return JSON:
{
  "narrative": "I analyzed… I prioritized… I assigned… I will report…",
  "confidence": 0.0,
  "priorities": ["..."],
  "investments": ["..."],
  "risks": ["..."],
  "opportunities": ["..."],
  "recommendations": [
    {
      "title":"...",
      "why":"...",
      "expectedOutcome":"...",
      "confidence":0.0,
      "evidence":["..."],
      "risks":["..."],
      "explanation":{"why":"...","alternatives":[],"evidence":[],"risks":[],"successMetrics":[]}
    }
  ]
}`);
  } catch {
    raw = {
      narrative: `I reviewed the workspace and will pursue: ${goal || "steady brand awareness"}. I will assign marketing and content workers, verify quality, and report honest Reelo outcomes only.`,
      confidence: 0.45,
      priorities: [goal || "Grow awareness"],
      investments: ["Content production"],
      risks: health && health.verificationRisk > 40 ? ["Open verification holds"] : [],
      opportunities: ["Improve posting consistency"],
      recommendations: [
        {
          title: "Run weekly marketing cycle",
          why: "Maintain autonomous learning loop",
          expectedOutcome: "Updated calendar, learning, and report",
          confidence: 0.5,
          evidence: ["Learning Mode cycle"],
          risks: ["Owner verification may pause social"],
          explanation: {
            why: "Continuous operation improves Amber weekly",
            alternatives: ["Manual one-off mission"],
            evidence: ["Prior Launch cycles"],
            risks: ["Infra holds"],
            successMetrics: ["Cycle completed", "Report generated"],
          },
        },
      ],
    };
  }

  const recommendations: AmberRecommendation[] = [];
  const list = Array.isArray(raw.recommendations) ? raw.recommendations : [];
  for (const item of list.slice(0, 8)) {
    const r = asRecord(item);
    recommendations.push({
      title: String(r.title || "Recommendation").slice(0, 200),
      why: String(r.why || "").slice(0, 800),
      expectedOutcome: String(r.expectedOutcome || "").slice(0, 800),
      confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0.4)),
      evidence: Array.isArray(r.evidence) ? r.evidence.map(String).slice(0, 10) : [],
      risks: Array.isArray(r.risks) ? r.risks.map(String).slice(0, 8) : [],
      explanation: asExplanation(r.explanation),
    });
  }

  const narrative = String(raw.narrative || "").slice(0, 4000);
  const confidence = Math.max(0, Math.min(1, Number(raw.confidence) || 0.4));
  const body = {
    priorities: raw.priorities || [],
    investments: raw.investments || [],
    risks: raw.risks || [],
    opportunities: raw.opportunities || [],
    recommendations,
    honestyNote: AMBER_HONESTY_NOTE,
  };

  const briefId = randomUUID();
  await q`
    INSERT INTO amber_executive_briefs (
      id, user_id, period, goals_snapshot, health_snapshot, recommendations, narrative, confidence, cycle_id, created_at
    ) VALUES (
      ${briefId}, ${userId}, ${new Date().toISOString().slice(0, 10)},
      ${JSON.stringify({ goal })}, ${JSON.stringify(health || {})},
      ${JSON.stringify(recommendations)}, ${narrative}, ${confidence},
      ${input?.cycleId ?? null}, ${new Date().toISOString()}
    )`;

  await logAmberAction({
    actorUserId: userId,
    actorEmail: input?.actorEmail ?? null,
    kind: "executive_brief",
    title: "Executive brief built",
    detail: { briefId, confidence, recommendations: recommendations.length },
  });

  return { briefId, narrative, confidence, recommendations, body };
}

export async function latestExecutiveBrief(q: Sql, userId: string): Promise<Record<string, unknown> | null> {
  const rows = (await q`
    SELECT id, period, goals_snapshot AS "goalsSnapshot", health_snapshot AS "healthSnapshot",
           recommendations, narrative, confidence, cycle_id AS "cycleId", created_at AS "createdAt"
    FROM amber_executive_briefs WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 1
  `) as Record<string, unknown>[];
  if (!rows[0]) return null;
  const parse = (v: unknown) => {
    try {
      return typeof v === "string" ? JSON.parse(v) : v;
    } catch {
      return v;
    }
  };
  return {
    ...rows[0],
    goalsSnapshot: parse(rows[0].goalsSnapshot),
    healthSnapshot: parse(rows[0].healthSnapshot),
    recommendations: parse(rows[0].recommendations),
  };
}
