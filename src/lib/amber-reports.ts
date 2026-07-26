import { randomUUID } from "node:crypto";
import { asRecord } from "@/lib/json";
import { geminiJson, mergeAmberLearning } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, recordPerformance, biPromptBlock } from "@/lib/amber-intelligence";
import type { Sql } from "@/lib/workspace-api";

function mondayUtc(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

/** Snapshot Reelo workspace outcomes for reporting (honest — not social reach). */
export async function collectWorkspaceOutcomes(q: Sql, userId: string) {
  const creations = (await q`
    SELECT id, title, tool_slug AS "toolSlug", kind, status, created_at AS "createdAt"
    FROM creations WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 100
  `) as Record<string, unknown>[];
  const schedules = (await q`
    SELECT id, title, status, approval_status AS "approvalStatus", amber_placed AS "amberPlaced",
           publish_result AS "publishResult", scheduled_at AS "scheduledAt"
    FROM schedule_items WHERE user_id = ${userId}
    ORDER BY scheduled_at DESC LIMIT 80
  `) as Record<string, unknown>[];
  const publish = (await q`
    SELECT id, title, status, approval_status AS "approvalStatus", publish_result AS "publishResult"
    FROM publish_items WHERE user_id = ${userId}
    ORDER BY updated_at DESC LIMIT 80
  `) as Record<string, unknown>[];
  const productions = (await q`
    SELECT id, title, status, review_status AS "reviewStatus", tool_slug AS "toolSlug"
    FROM amber_productions WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 60
  `) as Record<string, unknown>[];
  const missions = (await q`
    SELECT id, goal, status FROM amber_missions WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 10
  `) as Record<string, unknown>[];
  const holds = (await q`
    SELECT id, provider, step, status, explanation FROM amber_verification_holds
    WHERE user_id = ${userId} AND status = 'paused'
  `) as Record<string, unknown>[];

  const published = schedules.filter(
    (s) => s.approvalStatus === "published" || String(s.publishResult || "").includes("ok"),
  );
  const failed = schedules.filter(
    (s) => s.approvalStatus === "failed" || String(s.publishResult || "").toLowerCase().includes("fail"),
  );
  const approved = productions.filter((p) => p.reviewStatus === "approved");
  const rejected = productions.filter((p) => p.reviewStatus === "rejected");

  return {
    videosCreated: creations.filter((c) => c.kind === "video").length,
    totalCreations: creations.length,
    campaignsCompleted: missions.filter((m) => m.status === "completed").length,
    productionsTotal: productions.length,
    productionsApproved: approved.length,
    productionsRejected: rejected.length,
    postsScheduled: schedules.filter((s) => s.amberPlaced).length,
    postsPublishedAttempted: published.length,
    publishFailures: failed.length,
    queueReady: publish.filter((p) => p.status === "ready").length,
    verificationHolds: holds,
    topLibrary: creations.slice(0, 5).map((c) => ({ title: c.title, tool: c.toolSlug })),
    recentSchedules: schedules.slice(0, 8).map((s) => ({
      title: s.title,
      approvalStatus: s.approvalStatus,
      hasPublishResult: Boolean(s.publishResult),
    })),
    note: "Metrics from Reelo workspace + publish adapter results only. No fabricated reach/engagement.",
  };
}

export async function generateExecutiveReport(input: {
  q: Sql;
  userId: string;
  weekId?: string | null;
  missionId?: string | null;
  actorEmail: string | null;
  ownerNarrative?: string | null;
}): Promise<{ reportId: string; summary: string; body: Record<string, unknown> }> {
  const { q, userId, weekId, missionId, actorEmail, ownerNarrative } = input;
  const bi = await loadBusinessIntelligence(q, userId);
  const outcomes = await collectWorkspaceOutcomes(q, userId);
  const learning = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];
  const priorReport = (await q`
    SELECT summary, body FROM amber_reports WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 1
  `) as { summary: string; body: string }[];
  const decisions = (await q`
    SELECT kind, priority, title, rationale, action FROM amber_decisions
    WHERE user_id = ${userId} AND status = 'open'
    ORDER BY priority ASC LIMIT 12
  `) as Record<string, unknown>[];
  const campaigns = (await q`
    SELECT title, status, objective FROM amber_campaigns
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 8
  `) as Record<string, unknown>[];

  let narrative: Record<string, unknown> = {};
  try {
    narrative = await geminiJson(`Write a weekly executive report for the business owner.
Amber is their autonomous marketing employee / department manager.
Business:
${biPromptBlock(bi)}
Outcomes (Reelo-only, honest): ${JSON.stringify(outcomes)}
Open decisions Amber made: ${JSON.stringify(decisions)}
Campaigns: ${JSON.stringify(campaigns)}
Learning: ${learning[0]?.patterns?.slice(0, 1200) || "{}"}
Prior summary: ${priorReport[0]?.summary || "none"}

Return JSON:
{
  "summary": "3-5 sentence executive summary",
  "videosCreated": number,
  "campaignsCompleted": number,
  "postsPublished": number,
  "topPerformers": [{"title":"...","why":"..."}],
  "engagementTrends": "honest note — Reelo activity trends only, not social reach",
  "strategyAdjustments": ["..."],
  "decisionJustifications": [{"decision":"...","why":"..."}],
  "businessOpportunities": ["..."],
  "riskAlerts": ["..."],
  "upcomingWork": ["..."],
  "problems": ["..."],
  "recommendedActions": ["..."],
  "ownerDecisionsRequired": ["..."]
}`);
  } catch {
    narrative = {
      summary: `Amber completed workspace activity: ${outcomes.videosCreated} video packages, ${outcomes.postsScheduled} scheduled, ${outcomes.campaignsCompleted} campaigns marked complete.`,
      videosCreated: outcomes.videosCreated,
      campaignsCompleted: outcomes.campaignsCompleted,
      postsPublished: outcomes.postsPublishedAttempted,
      topPerformers: outcomes.topLibrary.map((t) => ({ title: t.title, why: "Recent Library work" })),
      engagementTrends: "Social reach not available — report uses Reelo library/schedule/publish outcomes only.",
      strategyAdjustments: [],
      decisionJustifications: decisions.map((d) => ({
        decision: d.title,
        why: d.rationale,
      })),
      businessOpportunities: [],
      riskAlerts: outcomes.verificationHolds.map((h) => String(h.explanation || h.step)),
      upcomingWork: ["Continue mission cycle", "Clear verification holds if any"],
      problems: outcomes.verificationHolds.map((h) => String(h.explanation || h.step)),
      recommendedActions: ["Review calendar approvals", "Connect OAuth accounts if publish failed"],
      ownerDecisionsRequired: outcomes.verificationHolds.length
        ? ["Complete provider verification holds"]
        : [],
    };
  }

  const body = {
    ...narrative,
    ownerNarrative: (ownerNarrative || String(narrative.ownerNarrative || narrative.summary || "")).slice(0, 4000),
    outcomes,
    decisions,
    campaigns,
    business: {
      company: bi.company || bi.brandName,
      objectives: bi.marketingObjectives || bi.goals,
    },
    honestyNote:
      "Reelo workspace metrics only — not social platform reach, views, or engagement unless a real adapter returns them.",
    generatedAt: new Date().toISOString(),
  };

  const reportId = randomUUID();
  const period = mondayUtc();
  const summary = String(narrative.summary || "").slice(0, 2000);
  await q`
    INSERT INTO amber_reports (id, user_id, week_id, mission_id, period, summary, body, created_at)
    VALUES (
      ${reportId}, ${userId}, ${weekId ?? null}, ${missionId ?? null},
      ${period}, ${summary}, ${JSON.stringify(body)}, ${new Date().toISOString()}
    )`;

  await recordPerformance(
    q,
    userId,
    "weekly_report",
    {
      videosCreated: outcomes.videosCreated,
      scheduled: outcomes.postsScheduled,
      publishedAttempted: outcomes.postsPublishedAttempted,
      publishFailures: outcomes.publishFailures,
    },
    reportId,
    "Executive weekly report snapshot",
  );

  await mergeAmberLearning(q, userId, {
    themes: Array.isArray(narrative.strategyAdjustments) ? narrative.strategyAdjustments.map(String) : [],
    postingWindows: [],
    toolsUsed: outcomes.topLibrary.map((t) => String(t.tool || "")),
    learningNote: summary.slice(0, 400),
    weekId,
  });

  await logAmberAction({
    actorUserId: userId,
    actorEmail,
    kind: "executive_report",
    title: "Weekly executive report generated",
    detail: { reportId, period },
  });

  return { reportId, summary, body };
}
