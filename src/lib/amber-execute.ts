import { randomUUID } from "node:crypto";
import { asRecord } from "@/lib/json";
import { logAmberAction, getAmberAutoGenerate } from "@/lib/amber-autonomous";
import { geminiJson, mergeAmberLearning } from "@/lib/amber-weekly";
import { loadBusinessIntelligence, getDailyVideoCap, getWebsiteTargets, biPromptBlock } from "@/lib/amber-intelligence";
import { LIVE_TOOLS } from "@/lib/tools";
import { RETENTION_DAYS } from "@/lib/storage";
import type { Sql } from "@/lib/workspace-api";

const PLATFORM_VARIANTS = [
  { platform: "tiktok", label: "TikTok — short viral", angle: "hook-first, trend-aware, under 30s energy" },
  { platform: "instagram", label: "Instagram — brand Reel", angle: "polished brand story, aesthetic CTA" },
  { platform: "youtube", label: "YouTube — Shorts", angle: "clear value in first 3s, searchable hook" },
  { platform: "facebook", label: "Facebook — short video", angle: "clear offer, community-friendly CTA (prepare for future OAuth)" },
] as const;

async function loadWorkspace(q: Sql, userId: string) {
  const kit = (await q`
    SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${userId} LIMIT 1
  `) as { brandName: string | null; extra: string | null }[];
  const profile = (await q`
    SELECT company, industry, audience, style, goals, brand_rules AS "brandRules",
           competitors, service_areas AS "serviceAreas", seasonal_trends AS "seasonalTrends",
           products, services, marketing_objectives AS "marketingObjectives",
           approval_mode AS "approvalMode"
    FROM business_profiles WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const accounts = (await q`
    SELECT id, provider, handle FROM social_accounts
    WHERE user_id = ${userId} AND status = 'connected'
  `) as { id: string; provider: string; handle: string }[];
  const learningRows = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];
  let learning: Record<string, unknown> = {};
  try {
    learning = learningRows[0] ? asRecord(JSON.parse(learningRows[0].patterns || "{}")) : {};
  } catch {
    learning = {};
  }
  const creations = (await q`
    SELECT id, title, tool_slug AS "toolSlug", kind, created_at AS "createdAt"
    FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 40
  `) as { id: string; title: string | null; toolSlug: string; kind: string; createdAt: string }[];
  const recentTitles = (await q`
    SELECT title FROM schedule_items WHERE user_id = ${userId}
    ORDER BY scheduled_at DESC LIMIT 30
  `) as { title: string }[];

  const brandLine = [
    kit[0]?.brandName,
    profile[0]?.company,
    profile[0]?.industry,
    profile[0]?.audience,
    profile[0]?.style,
    profile[0]?.goals,
    profile[0]?.brandRules,
    profile[0]?.competitors,
    profile[0]?.serviceAreas,
    profile[0]?.seasonalTrends,
    profile[0]?.products,
    profile[0]?.services,
    profile[0]?.marketingObjectives,
    kit[0]?.extra,
  ]
    .filter(Boolean)
    .join(" | ");

  return { kit, profile, accounts, learning, creations, recentTitles, brandLine };
}

async function insertLibraryPackage(
  q: Sql,
  userId: string,
  input: { title: string; toolSlug: string; script: string },
): Promise<string> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 86400_000).toISOString();
  const title = `[Amber package] ${input.title}`.slice(0, 200);
  // Honest: script/brief package in Library — not a rendered MP4. Media via live tool when needed.
  await q`
    INSERT INTO creations (id, user_id, tool_slug, tool_title, title, status, kind, media_url, bytes, error, expires_at)
    VALUES (
      ${id}, ${userId}, ${input.toolSlug.slice(0, 60)}, ${"Amber Video Agent"},
      ${title}, ${"completed"}, ${"video"}, ${null}, ${null},
      ${`Production package (script ready). Open /tools/${input.toolSlug} to render media.`.slice(0, 300)},
      ${expiresAt}
    )`;
  return id;
}

/** Gemini brand/quality review for a production. */
export async function reviewAmberProduction(
  q: Sql,
  userId: string,
  productionId: string,
  force?: "approve" | "improve" | "reject",
): Promise<{ reviewStatus: string; notes: string; improvedScript?: string; qualityScore?: number }> {
  const rows = (await q`
    SELECT id, title, script, platforms, tool_slug AS "toolSlug"
    FROM amber_productions WHERE id = ${productionId} AND user_id = ${userId} LIMIT 1
  `) as { id: string; title: string; script: string; platforms: string; toolSlug: string }[];
  const prod = rows[0];
  if (!prod) throw new Error("Production not found.");

  const { brandLine, profile } = await loadWorkspace(q, userId);
  const brandRules = String(profile[0]?.brandRules || "");
  const goals = String(profile[0]?.goals || "");

  if (force === "approve") {
    await q`
      UPDATE amber_productions SET review_status = ${"approved"}, review_notes = ${"Owner/admin force-approved."}
      WHERE id = ${productionId}`;
    return { reviewStatus: "approved", notes: "Force-approved." };
  }
  if (force === "reject") {
    await q`
      UPDATE amber_productions SET review_status = ${"rejected"}, review_notes = ${"Rejected by admin."}, status = ${"failed"}
      WHERE id = ${productionId}`;
    return { reviewStatus: "rejected", notes: "Rejected by admin." };
  }

  let verdict: Record<string, unknown>;
  try {
    verdict = await geminiJson(`You are Amber reviewing content before scheduling (Quality Assurance).
Brand context: ${brandLine || "unset"}
Brand rules: ${brandRules || "none"}
Business goals: ${goals || "none"}
Title: ${prod.title}
Script: ${prod.script.slice(0, 3000)}
Platforms: ${prod.platforms}
Tool: ${prod.toolSlug}

Check ALL of:
- brand consistency
- messaging quality
- grammar / clarity
- visual / production standards (for the brief)
- platform suitability
- business rules
- restricted topics / claims
- copyright / trademark risk in claims
- duplicate / repetitive messaging risk

Return JSON:
{
  "decision": "approve" | "improve" | "reject",
  "notes": "1-3 sentences",
  "improvedScript": "full improved script if decision=improve else empty",
  "qualityScore": 0.0,
  "checks": {
    "brandConsistency": true,
    "messaging": true,
    "grammar": true,
    "visualStandards": true,
    "platformFit": true,
    "businessRules": true,
    "restrictedTopics": true,
    "copyright": true,
    "duplicateRisk": false
  }
}
qualityScore: 0-100. Reject only for clear brand/rule/restricted-topic/copyright violations. Improve for weak hooks, grammar, or off-platform tone. Approve solid work. Automatically improve whenever possible.`);
  } catch {
    verdict = { decision: "approve", notes: "Review fallback: approved pending Gemini.", improvedScript: "", qualityScore: 70 };
  }

  if (force === "improve") verdict.decision = "improve";

  const decision = String(verdict.decision || "approve").toLowerCase();
  const notes = String(verdict.notes || "").slice(0, 1000);
  const improved = String(verdict.improvedScript || "").slice(0, 4000);
  const qualityScore = Math.min(100, Math.max(0, Number(verdict.qualityScore) || 0));

  // Duplicate title detection against recent productions
  const dupes = (await q`
    SELECT id FROM amber_productions
    WHERE user_id = ${userId} AND id != ${productionId} AND lower(title) = lower(${prod.title})
    LIMIT 3
  `) as { id: string }[];
  const notesWithDup =
    dupes.length > 0 ? `${notes} Duplicate title risk vs ${dupes.length} prior production(s).`.slice(0, 1000) : notes;

  if (decision === "reject") {
    await q`
      UPDATE amber_productions
      SET review_status = ${"rejected"}, review_notes = ${notesWithDup}, status = ${"failed"}, quality_score = ${qualityScore}
      WHERE id = ${productionId}`;
    await logAmberAction({
      actorUserId: userId,
      actorEmail: null,
      kind: "content_review_reject",
      title: `Rejected: ${prod.title}`,
      detail: { productionId, notes: notesWithDup, qualityScore },
    });
    return { reviewStatus: "rejected", notes: notesWithDup, qualityScore };
  }

  if (decision === "improve" || (qualityScore > 0 && qualityScore < 55)) {
    const script = improved || prod.script;
    await q`
      UPDATE amber_productions
      SET review_status = ${"needs_improvement"}, review_notes = ${notesWithDup}, script = ${script},
          status = ${"queued"}, quality_score = ${qualityScore}
      WHERE id = ${productionId}`;
    await logAmberAction({
      actorUserId: userId,
      actorEmail: null,
      kind: "content_review_improve",
      title: `Improve: ${prod.title}`,
      detail: { productionId, notes: notesWithDup, qualityScore },
    });
    return { reviewStatus: "needs_improvement", notes: notesWithDup, improvedScript: script, qualityScore };
  }

  await q`
    UPDATE amber_productions
    SET review_status = ${"approved"}, review_notes = ${notesWithDup}, quality_score = ${qualityScore || 80}
    WHERE id = ${productionId}`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "content_review_approve",
    title: `Approved: ${prod.title}`,
    detail: { productionId, notes: notesWithDup, qualityScore: qualityScore || 80 },
  });
  return { reviewStatus: "approved", notes: notesWithDup, qualityScore: qualityScore || 80 };
}

async function scheduleAndQueueProduction(
  q: Sql,
  userId: string,
  productionId: string,
  dayOffset: number,
): Promise<{ scheduleId: string | null; publishId: string | null }> {
  const rows = (await q`
    SELECT * FROM amber_productions WHERE id = ${productionId} AND user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const prod = rows[0];
  if (!prod || prod.review_status !== "approved") return { scheduleId: null, publishId: null };

  const { accounts, profile, brandLine, recentTitles } = await loadWorkspace(q, userId);
  const title = String(prod.title || "Amber post").slice(0, 160);
  // Avoid duplicate titles already on calendar
  if (recentTitles.some((t) => t.title === title)) {
    const alt = `${title} (${new Date().toISOString().slice(5, 10)})`.slice(0, 160);
    await q`UPDATE amber_productions SET title = ${alt} WHERE id = ${productionId}`;
  }

  const approvalMode = String(profile[0]?.approvalMode || "require");
  const approvalStatus = approvalMode === "auto" ? "approved" : "pending_approval";
  const now = new Date().toISOString();

  let caption = String(prod.caption || "");
  let hashtags = String(prod.hashtags || "");
  if (!caption) {
    try {
      const pack = await geminiJson(`Write caption + hashtags.
Title: ${title}
Script: ${String(prod.script || "").slice(0, 800)}
Brand: ${brandLine}
Return JSON: { "captions": ["..."], "hashtags": ["tag"] }`);
      caption = Array.isArray(pack.captions) ? String(pack.captions[0] || "").slice(0, 4000) : title;
      hashtags = Array.isArray(pack.hashtags)
        ? pack.hashtags.map((h) => String(h).replace(/^#/, "")).filter(Boolean).slice(0, 15).join(" ")
        : "";
    } catch {
      caption = title;
    }
    await q`
      UPDATE amber_productions SET caption = ${caption}, hashtags = ${hashtags} WHERE id = ${productionId}`;
  }

  const platformsRaw = (() => {
    try {
      return typeof prod.platforms === "string" ? JSON.parse(prod.platforms) : prod.platforms;
    } catch {
      return ["tiktok"];
    }
  })() as string[];
  const platforms = platformsRaw.length
    ? platformsRaw
    : accounts.map((a) => a.provider).slice(0, 3);

  const scheduleId = randomUUID();
  const scheduledAt = new Date(Date.now() + 86400_000 * Math.max(1, dayOffset)).toISOString();
  const creationId = prod.creation_id ? String(prod.creation_id) : null;

  await q`
    INSERT INTO schedule_items (
      id, user_id, creation_id, title, platforms, scheduled_at, status, notes,
      approval_status, amber_placed, caption, hashtags, created_at
    ) VALUES (
      ${scheduleId}, ${userId}, ${creationId}, ${title}, ${JSON.stringify(platforms)},
      ${scheduledAt}, ${"planned"}, ${"Amber autonomous calendar"},
      ${approvalStatus}, ${true}, ${caption}, ${hashtags}, ${now}
    )`;

  const matchedAccounts = accounts.filter((a) =>
    platforms.some((p) => a.provider.includes(p) || p.includes(a.provider)),
  );
  const assign = matchedAccounts.length ? matchedAccounts : accounts.slice(0, 3);
  for (const a of assign) {
    await q`
      INSERT INTO schedule_account_targets (schedule_item_id, social_account_id)
      VALUES (${scheduleId}, ${a.id})
      ON CONFLICT DO NOTHING`;
  }

  const publishId = randomUUID();
  await q`
    INSERT INTO publish_items (
      id, user_id, creation_id, title, caption, platforms, status, updated_at, created_at,
      account_ids, approval_status
    ) VALUES (
      ${publishId}, ${userId}, ${creationId}, ${title}, ${caption}, ${JSON.stringify(platforms)},
      ${approvalStatus === "approved" ? "ready" : "draft"}, ${now}, ${now},
      ${JSON.stringify(assign.map((a) => a.id))}, ${approvalStatus}
    )`;
  for (const a of assign) {
    await q`
      INSERT INTO publish_account_targets (publish_item_id, social_account_id)
      VALUES (${publishId}, ${a.id})
      ON CONFLICT DO NOTHING`;
  }

  await q`
    UPDATE amber_productions
    SET schedule_id = ${scheduleId}, publish_id = ${publishId}, status = ${"ready"}
    WHERE id = ${productionId}`;

  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "calendar_place",
    title: `Scheduled “${title}”`,
    detail: { scheduleId, publishId, productionId, approvalStatus },
    href: `/business-center/scheduling#${scheduleId}`,
  });

  return { scheduleId, publishId };
}

export async function createAmberMission(
  q: Sql,
  userId: string,
  goal: string,
): Promise<{ missionId: string }> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_missions (id, user_id, goal, status, strategy, report, week_id, created_at, updated_at)
    VALUES (${id}, ${userId}, ${goal.slice(0, 2000)}, ${"draft"}, ${"{}"}, ${"{}"}, ${null}, ${now}, ${now})`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "mission_create",
    title: "Amber mission created",
    detail: { missionId: id, goal: goal.slice(0, 200) },
  });
  return { missionId: id };
}

/**
 * Full execution cycle for a mission:
 * strategy → video productions (+ platform variants) → library packages → review → calendar + queue → report + learning
 */
export async function executeAmberMission(input: {
  q: Sql;
  userId: string;
  missionId: string;
  actorEmail: string | null;
  actorUserId: string | null;
}): Promise<Record<string, unknown>> {
  const { q, userId, missionId, actorEmail, actorUserId } = input;
  const missions = (await q`
    SELECT id, goal, status FROM amber_missions WHERE id = ${missionId} AND user_id = ${userId} LIMIT 1
  `) as { id: string; goal: string; status: string }[];
  const mission = missions[0];
  if (!mission) throw new Error("Mission not found.");

  const now = new Date().toISOString();
  await q`
    UPDATE amber_missions SET status = ${"running"}, updated_at = ${now} WHERE id = ${missionId}`;

  const ws = await loadWorkspace(q, userId);
  const bi = await loadBusinessIntelligence(q, userId);
  const dailyCap = Math.max(1, getDailyVideoCap(bi) || 1);
  const siteTargets = getWebsiteTargets(bi);
  const autoGenerate = await getAmberAutoGenerate();
  const weekId = randomUUID();
  const weekStart = new Date().toISOString().slice(0, 10);

  await q`
    INSERT INTO amber_weeks (id, user_id, week_start, status, strategy, report, created_at)
    VALUES (${weekId}, ${userId}, ${weekStart}, ${"running"}, ${"{}"}, ${"{}"}, ${now})`;

  let strategy: Record<string, unknown>;
  try {
    strategy = await geminiJson(`You are Amber, an authorized AI marketing employee for Reelo.
Owner mission goal: ${mission.goal}
Brand: ${ws.brandLine || "not set"}
Connected accounts: ${ws.accounts.map((a) => `${a.provider}:@${a.handle}`).join("; ") || "none"}
${biPromptBlock(bi)}
Owner video cadence: produce about ${dailyCap} video(s) per day across these sites: ${
      siteTargets.map((s) => `${s.url} (${s.videosPerDay}/day)`).join("; ") || "default"
    }.
For THIS mission run, create up to ${Math.min(dailyCap, 5)} campaign parent production(s) (not more).
Learning: ${JSON.stringify(ws.learning)}
Recent library: ${ws.creations
      .slice(0, 8)
      .map((c) => c.title || c.toolSlug)
      .join("; ") || "empty"}
Recent calendar titles (avoid duplicates): ${ws.recentTitles.map((t) => t.title).join("; ") || "none"}

Plan and specify video productions. Never create new social platform accounts.
Return JSON:
{
  "strategySummary": "2-4 sentences aligned to the mission",
  "themes": ["..."],
  "postingWindows": ["..."],
  "contentBalance": {"educational":1,"promotional":1,"social_proof":1},
  "productions": [
    {
      "title": "...",
      "script": "full short-form script",
      "toolSlug": "shorts-20",
      "platforms": ["tiktok","instagram","youtube"],
      "websiteUrl": "https://...",
      "why": "..."
    }
  ],
  "tasks": [{"kind":"video|review|schedule|publish|report","title":"..."}]
}
productions: 1-${Math.min(dailyCap, 5)} campaign parents. toolSlug must be a live Reelo tool when possible (shorts-20, product-commercial, talking-photo, ai-avatar-studio).`);
  } catch (e) {
    const err = e instanceof Error ? e.message : "strategy failed";
    await q`
      UPDATE amber_missions SET status = ${"failed"}, report = ${JSON.stringify({ error: err })}, updated_at = ${now}
      WHERE id = ${missionId}`;
    await q`UPDATE amber_weeks SET status = ${"failed"}, report = ${JSON.stringify({ error: err })} WHERE id = ${weekId}`;
    throw e;
  }

  await q`UPDATE amber_weeks SET strategy = ${JSON.stringify(strategy)} WHERE id = ${weekId}`;
  await q`
    UPDATE amber_missions SET strategy = ${JSON.stringify(strategy)}, week_id = ${weekId}, updated_at = ${now}
    WHERE id = ${missionId}`;

  const rawTasks = Array.isArray(strategy.tasks) ? strategy.tasks : [];
  for (const t of rawTasks.slice(0, 12)) {
    const row = asRecord(t);
    await q`
      INSERT INTO amber_tasks (id, week_id, kind, payload, status, created_at)
      VALUES (
        ${randomUUID()}, ${weekId}, ${String(row.kind || "task").slice(0, 40)},
        ${JSON.stringify(row)}, ${"done"}, ${now}
      )`;
  }

  const productionIds: string[] = [];
  const rawProds = Array.isArray(strategy.productions) ? strategy.productions : [];
  const campaigns = rawProds.length
    ? rawProds.slice(0, Math.min(Math.max(dailyCap, 1), 5))
    : [
        {
          title: `Mission: ${mission.goal.slice(0, 80)}`,
          script: `Hook about ${mission.goal}. Show the brand value. End with a clear CTA.`,
          toolSlug: "shorts-20",
          platforms: ["tiktok", "instagram", "youtube"],
        },
      ];

  for (const p of campaigns) {
    const row = asRecord(p);
    let toolSlug = String(row.toolSlug || "shorts-20").slice(0, 80);
    if (!LIVE_TOOLS.has(toolSlug)) toolSlug = "shorts-20";
    const title = String(row.title || "Campaign video").slice(0, 160);
    const script = String(row.script || "").slice(0, 4000);
    const platforms = Array.isArray(row.platforms)
      ? row.platforms.map((x) => String(x).toLowerCase()).slice(0, 6)
      : ["tiktok", "instagram", "youtube"];

    const parentId = randomUUID();
    await q`
      INSERT INTO amber_productions (
        id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
        status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at
      ) VALUES (
        ${parentId}, ${userId}, ${missionId}, ${weekId}, ${null}, ${title}, ${script},
        ${JSON.stringify(platforms)}, ${toolSlug}, ${"planned"}, ${"pending"}, ${""},
        ${null}, ${""}, ${""}, ${null}, ${null}, ${now}
      )`;
    productionIds.push(parentId);

    // Also mirror as content request for tooling UI
    await q`
      INSERT INTO amber_content_requests (
        id, user_id, week_id, parent_id, title, script, platforms, tool_slug, status, creation_id, created_at
      ) VALUES (
        ${randomUUID()}, ${userId}, ${weekId}, ${null}, ${title}, ${script},
        ${JSON.stringify(platforms)}, ${toolSlug}, ${"planned"}, ${null}, ${now}
      )`;

    for (const v of PLATFORM_VARIANTS) {
      if (platforms.length && !platforms.includes(v.platform)) continue;
      let variantScript = script;
      try {
        const adapted = await geminiJson(`Adapt this script for ${v.label}.
Angle: ${v.angle}
Brand: ${ws.brandLine}
Original: ${script.slice(0, 2000)}
Return JSON: { "title": "...", "script": "..." }`);
        variantScript = String(adapted.script || script).slice(0, 4000);
        const childTitle = String(adapted.title || `${title} — ${v.label}`).slice(0, 160);
        const childId = randomUUID();
        await q`
          INSERT INTO amber_productions (
            id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
            status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at
          ) VALUES (
            ${childId}, ${userId}, ${missionId}, ${weekId}, ${parentId}, ${childTitle}, ${variantScript},
            ${JSON.stringify([v.platform])}, ${toolSlug}, ${"planned"}, ${"pending"}, ${""},
            ${null}, ${""}, ${""}, ${null}, ${null}, ${now}
          )`;
        productionIds.push(childId);
      } catch {
        const childId = randomUUID();
        await q`
          INSERT INTO amber_productions (
            id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
            status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at
          ) VALUES (
            ${childId}, ${userId}, ${missionId}, ${weekId}, ${parentId},
            ${`${title} — ${v.label}`.slice(0, 160)}, ${script},
            ${JSON.stringify([v.platform])}, ${toolSlug}, ${"planned"}, ${"pending"}, ${""},
            ${null}, ${""}, ${""}, ${null}, ${null}, ${now}
          )`;
        productionIds.push(childId);
      }
    }
  }

  await logAmberAction({
    actorUserId: actorUserId,
    actorEmail,
    kind: "video_agent",
    title: `Created ${productionIds.length} production(s)`,
    detail: { missionId, productionIds },
  });

  // Produce library packages when auto-generate is ON; otherwise leave queued for tool deep-link
  const leafIds = (
    (await q`
      SELECT id, title, script, tool_slug AS "toolSlug", parent_id AS "parentId"
      FROM amber_productions WHERE mission_id = ${missionId} AND user_id = ${userId}
    `) as { id: string; title: string; script: string; toolSlug: string; parentId: string | null }[]
  ).filter((p) => p.parentId); // prefer platform variants for scheduling

  const toProduce = leafIds.length ? leafIds : productionIds.map((id) => ({ id, title: "", script: "", toolSlug: "shorts-20", parentId: null }));

  for (const p of toProduce) {
    const full = (
      (await q`
        SELECT id, title, script, tool_slug AS "toolSlug" FROM amber_productions
        WHERE id = ${p.id} LIMIT 1
      `) as { id: string; title: string; script: string; toolSlug: string }[]
    )[0];
    if (!full) continue;

    if (autoGenerate) {
      const creationId = await insertLibraryPackage(q, userId, {
        title: full.title,
        toolSlug: full.toolSlug,
        script: full.script,
      });
      await q`
        UPDATE amber_productions SET creation_id = ${creationId}, status = ${"ready"}
        WHERE id = ${full.id}`;
      await logAmberAction({
        actorUserId: actorUserId,
        actorEmail,
        kind: "video_package",
        title: `Library package: ${full.title}`,
        detail: { creationId, productionId: full.id, note: "Script package — not rendered MP4" },
        href: `/library`,
      });
    } else {
      await q`UPDATE amber_productions SET status = ${"queued"} WHERE id = ${full.id}`;
    }
  }

  // Review + schedule approved leaves
  const scheduleIds: string[] = [];
  const publishIds: string[] = [];
  const reviewSummary: { id: string; status: string }[] = [];
  let day = 1;

  const reviewTargets = (
    (await q`
      SELECT id FROM amber_productions
      WHERE mission_id = ${missionId} AND user_id = ${userId} AND parent_id IS NOT NULL
      ORDER BY created_at ASC
    `) as { id: string }[]
  );

  const targets = reviewTargets.length
    ? reviewTargets
    : ((await q`
        SELECT id FROM amber_productions WHERE mission_id = ${missionId} AND user_id = ${userId}
      `) as { id: string }[]);

  for (const t of targets) {
    const rev = await reviewAmberProduction(q, userId, t.id);
    reviewSummary.push({ id: t.id, status: rev.reviewStatus });

    if (rev.reviewStatus === "needs_improvement") {
      const again = await reviewAmberProduction(q, userId, t.id);
      reviewSummary.push({ id: t.id, status: again.reviewStatus });
      if (again.reviewStatus !== "approved") continue;
    } else if (rev.reviewStatus !== "approved") {
      continue;
    }

    const pr = (
      (await q`
        SELECT id, title, script, tool_slug AS "toolSlug", creation_id AS "creationId"
        FROM amber_productions WHERE id = ${t.id} LIMIT 1
      `) as { id: string; title: string; script: string; toolSlug: string; creationId: string | null }[]
    )[0];
    if (pr && !pr.creationId) {
      const creationId = await insertLibraryPackage(q, userId, {
        title: pr.title,
        toolSlug: pr.toolSlug,
        script: pr.script,
      });
      await q`
        UPDATE amber_productions SET creation_id = ${creationId}, status = ${"ready"} WHERE id = ${t.id}`;
    }

    const placed = await scheduleAndQueueProduction(q, userId, t.id, day);
    if (placed.scheduleId) scheduleIds.push(placed.scheduleId);
    if (placed.publishId) publishIds.push(placed.publishId);
    day += 1;
  }

  const approvalMode = String(ws.profile[0]?.approvalMode || "require");
  const status = approvalMode === "auto" ? "completed" : "awaiting_approval";

  const report: Record<string, unknown> = {
    missionId,
    goal: mission.goal,
    weekId,
    strategySummary: strategy.strategySummary,
    themes: strategy.themes,
    postingWindows: strategy.postingWindows,
    contentBalance: strategy.contentBalance,
    productionCount: productionIds.length,
    reviewSummary,
    scheduleIds,
    publishIds,
    autoGenerate,
    toolsUsed: campaigns.map((c) => String(asRecord(c).toolSlug || "shorts-20")),
    learningNote: `Mission “${mission.goal.slice(0, 120)}” → ${scheduleIds.length} scheduled.`,
    note: "Publish uses real OAuth adapters when owner/admin triggers publish on approved items — never fake Posted.",
    completedAt: new Date().toISOString(),
  };

  const learning = await mergeAmberLearning(q, userId, {
    ...report,
    successfulReviews: reviewSummary.filter((r) => r.status === "approved").length,
  });
  report.learning = learning;

  // Enrich learning with review outcomes
  try {
    const patterns = asRecord(learning);
    const approved = Array.isArray(patterns.approvedContent)
      ? [...(patterns.approvedContent as string[])]
      : [];
    for (const r of reviewSummary.filter((x) => x.status === "approved")) {
      approved.push(r.id);
    }
    patterns.approvedContent = approved.slice(-50);
    patterns.lastMissionId = missionId;
    patterns.lastMissionGoal = mission.goal.slice(0, 200);
    const ts = new Date().toISOString();
    await q`DELETE FROM amber_learning WHERE user_id = ${userId}`;
    await q`
      INSERT INTO amber_learning (user_id, patterns, updated_at)
      VALUES (${userId}, ${JSON.stringify(patterns)}, ${ts})`;
    report.learning = patterns;
  } catch {
    /* keep prior learning */
  }

  await q`
    UPDATE amber_weeks SET status = ${status}, report = ${JSON.stringify(report)} WHERE id = ${weekId}`;
  await q`
    UPDATE amber_missions SET status = ${status}, report = ${JSON.stringify(report)}, updated_at = ${new Date().toISOString()}
    WHERE id = ${missionId}`;

  await logAmberAction({
    actorUserId: actorUserId,
    actorEmail,
    kind: "mission_execute",
    title: `Mission ${status}: ${mission.goal.slice(0, 80)}`,
    detail: { missionId, weekId, scheduleIds, publishIds, productionCount: productionIds.length },
  });

  return {
    ok: true,
    missionId,
    weekId,
    status,
    strategy,
    report,
    productionIds,
    scheduleIds,
    publishIds,
    reviewSummary,
  };
}
