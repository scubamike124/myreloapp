import { randomUUID } from "node:crypto";
import { asRecord } from "@/lib/json";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, biPromptBlock } from "@/lib/amber-intelligence";
import { LIVE_TOOLS } from "@/lib/tools";
import type { Sql } from "@/lib/workspace-api";

/** Module 3 — reusable campaign project package. */
export async function buildAmberCampaign(input: {
  q: Sql;
  userId: string;
  objective: string;
  missionId?: string | null;
  actorEmail?: string | null;
}): Promise<{ campaignId: string; package: Record<string, unknown> }> {
  const { q, userId, objective, missionId, actorEmail } = input;
  const bi = await loadBusinessIntelligence(q, userId);

  let pack: Record<string, unknown>;
  try {
    pack = await geminiJson(`You are Amber's campaign builder (marketing director + creative lead).
Create ONE complete reusable campaign package.
Objective: ${objective}
Business:
${biPromptBlock(bi)}

Return JSON:
{
  "title": "...",
  "objective": "...",
  "targetAudience": "...",
  "contentStrategy": "...",
  "videoConcepts": [{"title":"...","hook":"...","format":"short|avatar|product"}],
  "scripts": [{"title":"...","script":"...","toolSlug":"shorts-20"}],
  "captions": ["..."],
  "descriptions": ["..."],
  "hashtags": ["tag"],
  "cta": "...",
  "postingSchedule": [{"dayOffset":1,"platform":"tiktok","window":"..."}],
  "platformVariations": {
    "tiktok": "...",
    "instagram": "...",
    "youtube": "...",
    "facebook": "future-ready brief"
  },
  "rationale": "why this campaign now"
}
scripts: 1-3. toolSlug must be a live Reelo tool when possible.`);
  } catch {
    pack = {
      title: `Campaign: ${objective.slice(0, 80)}`,
      objective,
      targetAudience: bi.audience || "ideal customers",
      contentStrategy: "Short-form awareness + clear CTA",
      videoConcepts: [{ title: objective.slice(0, 60), hook: "Problem → solution → CTA", format: "short" }],
      scripts: [
        {
          title: objective.slice(0, 60),
          script: `Hook about ${objective}. Show the service. End with CTA.`,
          toolSlug: "shorts-20",
        },
      ],
      captions: [objective.slice(0, 120)],
      descriptions: [objective],
      hashtags: ["business", "local"],
      cta: "Book / inquire today",
      postingSchedule: [
        { dayOffset: 1, platform: "tiktok", window: "weekday morning" },
        { dayOffset: 2, platform: "instagram", window: "weekday evening" },
        { dayOffset: 3, platform: "youtube", window: "weekend afternoon" },
      ],
      platformVariations: {
        tiktok: "Short viral cut",
        instagram: "Brand Reel",
        youtube: "Shorts",
        facebook: "Future OAuth",
      },
      rationale: "Aligned to owner objective and current Brand Kit.",
    };
  }

  const title = String(pack.title || objective).slice(0, 160);
  const audience = String(pack.targetAudience || bi.audience || "").slice(0, 1000);
  const id = randomUUID();
  const now = new Date().toISOString();
  const decisionLog = [
    {
      at: now,
      kind: "campaign_created",
      rationale: String(pack.rationale || ""),
    },
  ];

  await q`
    INSERT INTO amber_campaigns (
      id, user_id, mission_id, title, objective, audience, strategy, package, status, decision_log, created_at, updated_at
    ) VALUES (
      ${id}, ${userId}, ${missionId ?? null}, ${title}, ${objective.slice(0, 2000)}, ${audience},
      ${JSON.stringify({ contentStrategy: pack.contentStrategy, cta: pack.cta })},
      ${JSON.stringify(pack)}, ${"active"}, ${JSON.stringify(decisionLog)}, ${now}, ${now}
    )`;

  // Seed productions from scripts for the production department
  const scripts = Array.isArray(pack.scripts) ? pack.scripts : [];
  for (const s of scripts.slice(0, 5)) {
    const row = asRecord(s);
    let toolSlug = String(row.toolSlug || "shorts-20").slice(0, 80);
    if (!LIVE_TOOLS.has(toolSlug)) toolSlug = "shorts-20";
    const prodId = randomUUID();
    const prodTitle = String(row.title || title).slice(0, 160);
    const script = String(row.script || "").slice(0, 4000);
    await q`
      INSERT INTO amber_productions (
        id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
        status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at,
        campaign_id, quality_score, retry_count
      ) VALUES (
        ${prodId}, ${userId}, ${missionId ?? null}, ${null}, ${null}, ${prodTitle}, ${script},
        ${JSON.stringify(["tiktok", "instagram", "youtube"])}, ${toolSlug},
        ${"planned"}, ${"pending"}, ${""}, ${null},
        ${Array.isArray(pack.captions) ? String(pack.captions[0] || "").slice(0, 4000) : ""},
        ${Array.isArray(pack.hashtags) ? pack.hashtags.map(String).slice(0, 15).join(" ") : ""},
        ${null}, ${null}, ${now}, ${id}, ${0}, ${0}
      )`;
  }

  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "campaign_build",
    title: `Campaign built: ${title}`,
    detail: { campaignId: id, objective: objective.slice(0, 200) },
  });

  return { campaignId: id, package: pack };
}

/** Retry failed / low-quality productions (production department). */
export async function retryFailedProductions(
  q: Sql,
  userId: string,
  maxRetries = 2,
): Promise<{ retried: string[]; skipped: string[] }> {
  const failed = (await q`
    SELECT id, title, script, tool_slug AS "toolSlug", retry_count AS "retryCount", status, review_status AS "reviewStatus"
    FROM amber_productions
    WHERE user_id = ${userId}
      AND (status = 'failed' OR review_status = 'needs_improvement' OR review_status = 'rejected')
    ORDER BY created_at DESC LIMIT 20
  `) as {
    id: string;
    title: string;
    script: string;
    toolSlug: string;
    retryCount: number;
    status: string;
    reviewStatus: string;
  }[];

  const retried: string[] = [];
  const skipped: string[] = [];

  for (const p of failed) {
    const retries = Number(p.retryCount || 0);
    if (retries >= maxRetries) {
      skipped.push(p.id);
      continue;
    }
    let improved = p.script;
    try {
      const fix = await geminiJson(`Rewrite this production script for a retry.
Title: ${p.title}
Script: ${p.script.slice(0, 2500)}
Return JSON: { "script": "...", "notes": "..." }`);
      improved = String(fix.script || p.script).slice(0, 4000);
    } catch {
      /* keep script */
    }
    await q`
      UPDATE amber_productions
      SET script = ${improved}, status = ${"queued"}, review_status = ${"pending"},
          retry_count = ${retries + 1}, review_notes = ${`Auto-retry #${retries + 1}`}
      WHERE id = ${p.id} AND user_id = ${userId}`;
    retried.push(p.id);
    await logAmberAction({
      actorUserId: userId,
      actorEmail: null,
      kind: "production_retry",
      title: `Retry production: ${p.title}`,
      detail: { productionId: p.id, retry: retries + 1 },
    });
  }

  return { retried, skipped };
}
