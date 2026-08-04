import { randomUUID } from "node:crypto";
import { asRecord, errorMessage, geminiParts } from "@/lib/json";
import { logAmberAction } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, getDailyVideoCap, getWebsiteTargets, biPromptBlock } from "@/lib/amber-intelligence";
import type { Sql } from "@/lib/workspace-api";

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function geminiJson(prompt: string): Promise<Record<string, unknown>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
    }),
  });
  const data = asRecord(await res.json());
  if (!res.ok) throw new Error(errorMessage(data, "Gemini error"));
  const text = geminiParts(data)
    .map((p) => (typeof p === "object" && p && "text" in p ? String((p as { text?: string }).text || "") : ""))
    .join("\n")
    .trim();
  return asRecord(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")));
}

function mondayUtc(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

async function snapshotAnalytics(q: Sql, userId: string) {
  const creations = (await q`
    SELECT tool_slug AS "toolSlug", tool_title AS "toolTitle", kind, created_at AS "createdAt"
    FROM creations WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 200
  `) as { toolSlug: string; toolTitle: string; kind: string; createdAt: string }[];

  const schedules = (await q`
    SELECT id, title, status, approval_status AS "approvalStatus",
           amber_placed AS "amberPlaced", publish_result AS "publishResult", scheduled_at AS "scheduledAt"
    FROM schedule_items WHERE user_id = ${userId}
    ORDER BY scheduled_at DESC LIMIT 50
  `) as Record<string, unknown>[];

  const byTool: Record<string, number> = {};
  for (const c of creations) {
    const t = c.toolTitle || c.toolSlug;
    byTool[t] = (byTool[t] ?? 0) + 1;
  }

  return {
    creationCount: creations.length,
    videos: creations.filter((c) => c.kind === "video").length,
    images: creations.filter((c) => c.kind === "image").length,
    topTools: Object.entries(byTool)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count })),
    recentSchedules: schedules.slice(0, 12).map((s) => ({
      title: s.title,
      status: s.status,
      approvalStatus: s.approvalStatus,
      amberPlaced: s.amberPlaced,
      publishResult: s.publishResult ? "present" : null,
    })),
    note: "Reelo workspace data only — not social reach.",
  };
}

export async function mergeAmberLearning(
  q: Sql,
  userId: string,
  report: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existing = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];
  let patterns: Record<string, unknown> = {};
  try {
    patterns = existing[0] ? asRecord(JSON.parse(existing[0].patterns || "{}")) : {};
  } catch {
    patterns = {};
  }

  const pushUnique = (arr: string[], items: unknown[], maxLen: number, itemCap: number) => {
    for (const t of items) {
      const s = String(t).slice(0, itemCap);
      if (s && !arr.includes(s)) arr.push(s);
    }
    return arr.slice(-maxLen);
  };

  const themes = Array.isArray(patterns.successfulThemes) ? [...(patterns.successfulThemes as string[])] : [];
  const failedStrategies = Array.isArray(patterns.failedStrategies)
    ? [...(patterns.failedStrategies as string[])]
    : [];
  const tools = Array.isArray(patterns.preferredTools) ? [...(patterns.preferredTools as string[])] : [];
  const windows = Array.isArray(patterns.postingWindows) ? [...(patterns.postingWindows as string[])] : [];
  const topics = Array.isArray(patterns.bestTopics) ? [...(patterns.bestTopics as string[])] : [];
  const campaignOutcomes = Array.isArray(patterns.campaignOutcomes)
    ? [...(patterns.campaignOutcomes as string[])]
    : [];
  const seasonal = Array.isArray(patterns.seasonalObservations)
    ? [...(patterns.seasonalObservations as string[])]
    : [];
  const preferences = Array.isArray(patterns.businessPreferences)
    ? [...(patterns.businessPreferences as string[])]
    : [];
  const competitors = Array.isArray(patterns.competitorObservations)
    ? [...(patterns.competitorObservations as string[])]
    : [];
  const corrections = Array.isArray(patterns.ownerCorrections)
    ? [...(patterns.ownerCorrections as string[])]
    : [];
  const performanceHistory = Array.isArray(patterns.performanceHistory)
    ? [...(patterns.performanceHistory as Record<string, unknown>[])]
    : [];

  const next = {
    successfulThemes: pushUnique(themes, Array.isArray(report.themes) ? report.themes : [], 40, 120),
    failedStrategies: pushUnique(
      failedStrategies,
      Array.isArray(report.failedStrategies) ? report.failedStrategies : [],
      40,
      200,
    ),
    preferredTools: pushUnique(tools, Array.isArray(report.toolsUsed) ? report.toolsUsed : [], 20, 80),
    postingWindows: pushUnique(
      windows,
      Array.isArray(report.postingWindows) ? report.postingWindows : [],
      20,
      120,
    ),
    bestTopics: pushUnique(topics, Array.isArray(report.bestTopics) ? report.bestTopics : [], 40, 120),
    campaignOutcomes: pushUnique(
      campaignOutcomes,
      Array.isArray(report.campaignOutcomes) ? report.campaignOutcomes : [],
      40,
      200,
    ),
    seasonalObservations: pushUnique(
      seasonal,
      Array.isArray(report.seasonalObservations) ? report.seasonalObservations : [],
      20,
      200,
    ),
    businessPreferences: pushUnique(
      preferences,
      Array.isArray(report.businessPreferences) ? report.businessPreferences : [],
      20,
      200,
    ),
    competitorObservations: pushUnique(
      competitors,
      Array.isArray(report.competitorObservations) ? report.competitorObservations : [],
      20,
      200,
    ),
    ownerCorrections: pushUnique(
      corrections,
      Array.isArray(report.ownerCorrections) ? report.ownerCorrections : [],
      30,
      300,
    ),
    performanceHistory: [
      ...performanceHistory,
      ...(report.performanceSnapshot && typeof report.performanceSnapshot === "object"
        ? [{ at: new Date().toISOString(), ...(report.performanceSnapshot as Record<string, unknown>) }]
        : []),
    ].slice(-52),
    successfulStrategies: pushUnique(
      Array.isArray(patterns.successfulStrategies) ? [...(patterns.successfulStrategies as string[])] : [],
      Array.isArray(report.successfulStrategies) ? report.successfulStrategies : [],
      40,
      200,
    ),
    lastWeekId: report.weekId ?? patterns.lastWeekId ?? null,
    lastCycleId: report.cycleId ?? patterns.lastCycleId ?? null,
    cyclesCompleted: Number(patterns.cyclesCompleted || 0) + (report.cycleCompleted ? 1 : 0),
    notes: String(report.learningNote || patterns.notes || "").slice(0, 1000),
  };

  const now = new Date().toISOString();
  await q`DELETE FROM amber_learning WHERE user_id = ${userId}`;
  await q`
    INSERT INTO amber_learning (user_id, patterns, updated_at)
    VALUES (${userId}, ${JSON.stringify(next)}, ${now})`;
  return next;
}

export async function runAmberWeeklyCycle(input: {
  q: Sql;
  userId: string;
  actorEmail: string | null;
  actorUserId: string | null;
}): Promise<{
  weekId: string;
  status: string;
  strategy: Record<string, unknown>;
  report: Record<string, unknown>;
  tasks: { id: string; kind: string; status: string }[];
  contentRequests: { id: string; title: string; status: string }[];
  scheduleIds: string[];
}> {
  const { q, userId, actorEmail, actorUserId } = input;
  const weekStart = mondayUtc();
  const weekId = randomUUID();
  const now = new Date().toISOString();

  const analytics = await snapshotAnalytics(q, userId);
  const prior = (await q`
    SELECT id, report, strategy FROM amber_weeks
    WHERE user_id = ${userId} AND status = 'completed'
    ORDER BY created_at DESC LIMIT 1
  `) as { id: string; report: string; strategy: string }[];
  const learningRows = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];
  let learning: Record<string, unknown> = {};
  try {
    learning = learningRows[0] ? asRecord(JSON.parse(learningRows[0].patterns || "{}")) : {};
  } catch {
    learning = {};
  }

  const kit = (await q`
    SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${userId} LIMIT 1
  `) as { brandName: string | null; extra: string | null }[];
  const profile = (await q`
    SELECT company, industry, audience, style, goals, brand_rules AS "brandRules",
           approval_mode AS "approvalMode"
    FROM business_profiles WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const bi = await loadBusinessIntelligence(q, userId);
  const dailyCap = Math.max(1, Math.min(7, getDailyVideoCap(bi) || 1));
  const siteTargets = getWebsiteTargets(bi);
  const accounts = (await q`
    SELECT id, provider, handle FROM social_accounts
    WHERE user_id = ${userId} AND status = 'connected'
  `) as { id: string; provider: string; handle: string }[];
  const library = (await q`
    SELECT id, title, tool_slug AS "toolSlug", kind FROM creations
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 8
  `) as { id: string; title: string | null; toolSlug: string; kind: string }[];

  const brandLine = [
    kit[0]?.brandName,
    profile[0]?.company,
    profile[0]?.industry,
    profile[0]?.audience,
    profile[0]?.style,
    profile[0]?.goals,
    profile[0]?.brandRules,
  ]
    .filter(Boolean)
    .join(" | ");

  await q`
    INSERT INTO amber_weeks (id, user_id, week_start, status, strategy, report, created_at)
    VALUES (${weekId}, ${userId}, ${weekStart}, ${"running"}, ${"{}"}, ${"{}"}, ${now})`;

  let strategy: Record<string, unknown>;
  try {
    strategy = await geminiJson(`You are Amber, Reelo's autonomous marketing employee.
Plan ONE week of marketing for an existing business. Never create new social platform accounts.
Brand: ${brandLine || "not set"}
Connected accounts: ${accounts.map((a) => `${a.provider}:@${a.handle}`).join("; ") || "none"}
${biPromptBlock(bi)}
Owner cadence: ~${dailyCap} video(s) per day across sites: ${
      siteTargets.map((s) => `${s.url} (${s.videosPerDay}/day)`).join("; ") || "default 1/day"
    }.
For this weekly plan, create about ${Math.min(dailyCap * 5, 15)} contentRequests total for the week (≈ ${dailyCap}/day × 5 weekdays), max 15.
Workspace analytics (Reelo only): ${JSON.stringify(analytics)}
Prior week report: ${prior[0]?.report?.slice(0, 1500) || "none"}
Learning patterns: ${JSON.stringify(learning)}
Library samples: ${library.map((l) => `${l.title || l.toolSlug} (${l.id})`).join("; ") || "empty"}

Return JSON:
{
  "strategySummary": "...",
  "themes": ["..."],
  "tasks": [{"kind":"review|content|caption|schedule|report","title":"...","detail":"..."}],
  "contentRequests": [{"title":"...","script":"...","platforms":["tiktok","instagram","youtube"],"toolSlug":"shorts-20","websiteUrl":"https://..."}],
  "postingWindows": ["weekday mornings", "..."],
  "useLibraryIds": ["creation-id-if-useful"]
}
tasks: 4-8. contentRequests: ${Math.min(Math.max(dailyCap, 1), 7)}-${Math.min(dailyCap * 5, 15)}. toolSlug must be a Reelo live tool slug when possible.`);
  } catch (e) {
    const failReport = { error: e instanceof Error ? e.message : "strategy failed", analytics };
    await q`
      UPDATE amber_weeks SET status = ${"failed"}, report = ${JSON.stringify(failReport)}
      WHERE id = ${weekId}`;
    await logAmberAction({
      actorUserId: actorUserId,
      actorEmail,
      kind: "week_run_failed",
      title: "Amber weekly cycle failed (strategy)",
      detail: { weekId, error: failReport.error },
    });
    throw e;
  }

  await q`UPDATE amber_weeks SET strategy = ${JSON.stringify(strategy)} WHERE id = ${weekId}`;

  const taskRows: { id: string; kind: string; status: string }[] = [];
  const rawTasks = Array.isArray(strategy.tasks) ? strategy.tasks : [];
  for (const t of rawTasks.slice(0, 12)) {
    const row = asRecord(t);
    const id = randomUUID();
    const kind = String(row.kind || "task").slice(0, 40);
    await q`
      INSERT INTO amber_tasks (id, week_id, kind, payload, status, created_at)
      VALUES (${id}, ${weekId}, ${kind}, ${JSON.stringify(row)}, ${"planned"}, ${now})`;
    taskRows.push({ id, kind, status: "planned" });
  }

  const contentRequests: { id: string; title: string; status: string }[] = [];
  const rawReqs = Array.isArray(strategy.contentRequests) ? strategy.contentRequests : [];
  const weekCap = Math.min(Math.max(dailyCap * 5, dailyCap), 15);
  for (const r of rawReqs.slice(0, weekCap)) {
    const row = asRecord(r);
    const parentId = randomUUID();
    const title = String(row.title || "Content request").slice(0, 160);
    const script = String(row.script || "").slice(0, 4000);
    const platforms = Array.isArray(row.platforms)
      ? row.platforms.map((p) => String(p).toLowerCase()).slice(0, 6)
      : ["tiktok", "instagram", "youtube"];
    const toolSlug = String(row.toolSlug || "shorts-20").slice(0, 80);
    await q`
      INSERT INTO amber_content_requests (
        id, user_id, week_id, parent_id, title, script, platforms, tool_slug, status, creation_id, created_at
      ) VALUES (
        ${parentId}, ${userId}, ${weekId}, ${null}, ${title}, ${script},
        ${JSON.stringify(platforms)}, ${toolSlug}, ${"planned"}, ${null}, ${now}
      )`;
    contentRequests.push({ id: parentId, title, status: "planned" });

    const variants = [
      { platform: "tiktok", label: "TikTok" },
      { platform: "instagram", label: "Instagram Reels" },
      { platform: "youtube", label: "YouTube Shorts" },
    ];
    for (const v of variants) {
      if (!platforms.includes(v.platform) && platforms.length > 0) continue;
      const childId = randomUUID();
      await q`
        INSERT INTO amber_content_requests (
          id, user_id, week_id, parent_id, title, script, platforms, tool_slug, status, creation_id, created_at
        ) VALUES (
          ${childId}, ${userId}, ${weekId}, ${parentId},
          ${`${title} — ${v.label}`.slice(0, 160)}, ${script},
          ${JSON.stringify([v.platform])}, ${toolSlug}, ${"planned"}, ${null}, ${now}
        )`;
      contentRequests.push({ id: childId, title: `${title} — ${v.label}`, status: "planned" });
    }
  }

  const approvalMode = String(profile[0]?.approvalMode || "require");
  const approvalStatus = approvalMode === "auto" ? "approved" : "pending_approval";
  const scheduleIds: string[] = [];

  const useIds = Array.isArray(strategy.useLibraryIds)
    ? strategy.useLibraryIds.map((x) => String(x)).filter(Boolean)
    : [];
  const placeFrom =
    useIds.length > 0
      ? library.filter((l) => useIds.includes(l.id)).slice(0, 3)
      : library.slice(0, 1);

  for (const item of placeFrom) {
    const title = (item.title || item.toolSlug || "Library item").slice(0, 160);
    let caption = "";
    let hashtags: string[] = [];
    try {
      const pack = await geminiJson(`Write one caption and hashtags for social.
Title: ${title}
Brand: ${brandLine || "general"}
Brand rules: ${String(profile[0]?.brandRules || "")}
Return JSON: { "captions": ["..."], "hashtags": ["tag"] }`);
      caption = Array.isArray(pack.captions) ? String(pack.captions[0] || "").slice(0, 4000) : "";
      hashtags = Array.isArray(pack.hashtags)
        ? pack.hashtags.map((h) => String(h).replace(/^#/, "").slice(0, 40)).filter(Boolean).slice(0, 15)
        : [];
    } catch {
      caption = title;
    }

    const schedId = randomUUID();
    const scheduledAt = new Date(Date.now() + 86400_000 * (scheduleIds.length + 1)).toISOString();
    const platforms = accounts.map((a) => a.provider).slice(0, 4);
    await q`
      INSERT INTO schedule_items (
        id, user_id, creation_id, title, platforms, scheduled_at, status, notes,
        approval_status, amber_placed, caption, hashtags, created_at
      ) VALUES (
        ${schedId}, ${userId}, ${item.id}, ${title}, ${JSON.stringify(platforms.length ? platforms : ["tiktok"])},
        ${scheduledAt}, ${"planned"}, ${"Amber weekly cycle"},
        ${approvalStatus}, ${true}, ${caption}, ${hashtags.join(" ")}, ${now}
      )`;
    for (const a of accounts.slice(0, 6)) {
      await q`
        INSERT INTO schedule_account_targets (schedule_item_id, social_account_id)
        VALUES (${schedId}, ${a.id})
        ON CONFLICT DO NOTHING`;
    }
    scheduleIds.push(schedId);
    const taskId = randomUUID();
    await q`
      INSERT INTO amber_tasks (id, week_id, kind, payload, status, created_at)
      VALUES (
        ${taskId}, ${weekId}, ${"schedule"},
        ${JSON.stringify({ scheduleId: schedId, creationId: item.id, title })},
        ${"done"}, ${now}
      )`;
    taskRows.push({ id: taskId, kind: "schedule", status: "done" });
  }

  for (const t of taskRows.filter((x) => x.status === "planned")) {
    await q`UPDATE amber_tasks SET status = ${"done"} WHERE id = ${t.id}`;
    t.status = "done";
  }

  const report: Record<string, unknown> = {
    weekId,
    weekStart,
    strategySummary: strategy.strategySummary,
    themes: strategy.themes,
    toolsUsed: placeFrom.map((p) => p.toolSlug),
    postingWindows: strategy.postingWindows,
    analytics,
    contentRequestCount: contentRequests.length,
    scheduleIds,
    approvalStatus,
    learningNote: String(strategy.strategySummary || "").slice(0, 400),
    completedAt: new Date().toISOString(),
  };

  const patterns = await mergeAmberLearning(q, userId, report);
  report.learning = patterns;

  const status = approvalMode === "auto" ? "completed" : "awaiting_approval";
  await q`
    UPDATE amber_weeks SET status = ${status}, report = ${JSON.stringify(report)}
    WHERE id = ${weekId}`;

  await logAmberAction({
    actorUserId: actorUserId,
    actorEmail,
    kind: "week_run",
    title: `Amber weekly cycle ${status}`,
    detail: { weekId, weekStart, scheduleIds, contentRequests: contentRequests.length },
  });

  return { weekId, status, strategy, report, tasks: taskRows, contentRequests, scheduleIds };
}
