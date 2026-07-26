import { randomUUID } from "node:crypto";
import { AMBER_HONESTY_NOTE, clampScore, type AmberHealthScores } from "@/lib/amber-explain";
import { collectWorkspaceOutcomes } from "@/lib/amber-reports";
import { logAmberAction } from "@/lib/amber-autonomous";
import type { Sql } from "@/lib/workspace-api";

export async function computeBusinessHealth(
  q: Sql,
  userId: string,
): Promise<AmberHealthScores> {
  const outcomes = await collectWorkspaceOutcomes(q, userId);
  const campaigns = (await q`
    SELECT id, status FROM amber_campaigns WHERE user_id = ${userId}
  `) as { id: string; status: string }[];
  const holds = (await q`
    SELECT id FROM amber_verification_holds WHERE user_id = ${userId} AND status = 'paused'
  `) as { id: string }[];
  const accounts = (await q`
    SELECT status FROM social_accounts WHERE user_id = ${userId}
  `) as { status: string }[];
  const productions = (await q`
    SELECT review_status AS "reviewStatus", status FROM amber_productions
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 40
  `) as { reviewStatus: string; status: string }[];

  const connected = accounts.filter((a) => a.status === "connected").length;
  const approved = productions.filter((p) => p.reviewStatus === "approved").length;
  const rejected = productions.filter(
    (p) => p.reviewStatus === "rejected" || p.reviewStatus === "needs_improvement",
  ).length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const qaTotal = approved + rejected;

  const contentProduction = clampScore(
    productions.length === 0 ? 35 : 40 + Math.min(50, productions.length * 5) + (qaTotal ? (approved / qaTotal) * 20 : 0),
  );
  const publishingConsistency = clampScore(
    30 + Math.min(40, outcomes.postsScheduled * 8) + Math.min(20, outcomes.postsPublishedAttempted * 5) - Math.min(25, outcomes.publishFailures * 8),
  );
  const campaignThroughput = clampScore(25 + activeCampaigns * 15 + Math.min(30, campaigns.length * 5));
  const infraReadiness = clampScore(
    40 + connected * 12 - holds.length * 15 + (accounts.length ? 10 : 0),
  );
  const verificationRisk = clampScore(holds.length * 25 + accounts.filter((a) => a.status === "error" || a.status === "keys_needed").length * 20);
  const marketingHealth = clampScore(
    (contentProduction + publishingConsistency + campaignThroughput) / 3,
  );
  const overall = clampScore(
    marketingHealth * 0.35 +
      contentProduction * 0.2 +
      publishingConsistency * 0.2 +
      campaignThroughput * 0.1 +
      infraReadiness * 0.15 -
      verificationRisk * 0.15,
  );

  const explanations: Record<string, string> = {
    overall: `Composite of Reelo workspace production, scheduling, campaigns, and infra readiness (risk subtracted).`,
    marketingHealth: `Blend of content, publishing consistency, and campaign throughput.`,
    contentProduction: `${productions.length} recent productions; ${approved} approved / ${rejected} needs work.`,
    publishingConsistency: `${outcomes.postsScheduled} scheduled, ${outcomes.postsPublishedAttempted} publish attempts, ${outcomes.publishFailures} failures.`,
    campaignThroughput: `${activeCampaigns} active / ${campaigns.length} total campaigns.`,
    infraReadiness: `${connected} connected social accounts; ${holds.length} open verification holds.`,
    verificationRisk: holds.length
      ? `${holds.length} paused verification hold(s) require owner action.`
      : "No open verification holds.",
  };

  return {
    overall,
    marketingHealth,
    contentProduction,
    publishingConsistency,
    campaignThroughput,
    infraReadiness,
    verificationRisk,
    explanations,
    honestyNote: AMBER_HONESTY_NOTE,
  };
}

export async function saveHealthSnapshot(
  q: Sql,
  userId: string,
  scores: AmberHealthScores,
  cycleId?: string | null,
  actorEmail?: string | null,
): Promise<{ id: string; scores: AmberHealthScores }> {
  const id = randomUUID();
  const notes = Object.entries(scores.explanations)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ")
    .slice(0, 2000);
  await q`
    INSERT INTO amber_health_snapshots (id, user_id, scores, notes, cycle_id, created_at)
    VALUES (
      ${id}, ${userId}, ${JSON.stringify(scores)}, ${notes},
      ${cycleId ?? null}, ${new Date().toISOString()}
    )`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "health_snapshot",
    title: `Business health ${scores.overall}/100`,
    detail: { id, overall: scores.overall, cycleId },
  });
  return { id, scores };
}

export async function latestHealthSnapshot(
  q: Sql,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const rows = (await q`
    SELECT id, scores, notes, cycle_id AS "cycleId", created_at AS "createdAt"
    FROM amber_health_snapshots WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 1
  `) as Record<string, unknown>[];
  if (!rows[0]) return null;
  let scores = {};
  try {
    scores = typeof rows[0].scores === "string" ? JSON.parse(String(rows[0].scores)) : rows[0].scores;
  } catch {
    scores = {};
  }
  return { ...rows[0], scores };
}
