import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession, getAmberAutoGenerate, logAmberAction } from "@/lib/amber-autonomous";
import { geminiJson } from "@/lib/amber-weekly";
import { LIVE_TOOLS } from "@/lib/tools";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 90;

async function resolveTargetUserId(bodyUserId: string | undefined, sessionUserId: string): Promise<string> {
  if (!bodyUserId || bodyUserId === sessionUserId) return sessionUserId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionUserId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;
  const url = new URL(req.url);
  const targetUserId = await resolveTargetUserId(url.searchParams.get("userId") || undefined, user.id);
  const missionId = url.searchParams.get("missionId");

  const rows = missionId
    ? ((await q`
        SELECT id, mission_id AS "missionId", week_id AS "weekId", parent_id AS "parentId",
               title, script, platforms, tool_slug AS "toolSlug", status,
               review_status AS "reviewStatus", review_notes AS "reviewNotes",
               creation_id AS "creationId", schedule_id AS "scheduleId", publish_id AS "publishId",
               created_at AS "createdAt"
        FROM amber_productions WHERE user_id = ${targetUserId} AND mission_id = ${missionId}
        ORDER BY created_at ASC
      `) as Record<string, unknown>[])
    : ((await q`
        SELECT id, mission_id AS "missionId", week_id AS "weekId", parent_id AS "parentId",
               title, script, platforms, tool_slug AS "toolSlug", status,
               review_status AS "reviewStatus", review_notes AS "reviewNotes",
               creation_id AS "creationId", schedule_id AS "scheduleId", publish_id AS "publishId",
               created_at AS "createdAt"
        FROM amber_productions WHERE user_id = ${targetUserId}
        ORDER BY created_at DESC LIMIT 80
      `) as Record<string, unknown>[]);

  return Response.json({
    ok: true,
    productions: rows.map((r) => ({
      ...r,
      platforms: safeArr(r.platforms),
      toolHref: `/tools/${r.toolSlug}`,
      liveTool: LIVE_TOOLS.has(String(r.toolSlug || "")),
    })),
    autoGenerate: await getAmberAutoGenerate(),
    note: "Video agent creates scripts + platform variants. Library packages are honest script briefs until rendered via live tools.",
  });
}

function safeArr(v: unknown) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  }
  return [];
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const action = str(body.action, 40) || "ideas";
  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);

  if (action === "ideas" || action === "scripts") {
    const topic = str(body.topic, 400) || str(body.goal, 400) || "brand awareness";
    const profile = (await q`
      SELECT company, industry, audience, goals, brand_rules AS "brandRules"
      FROM business_profiles WHERE user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    const data = await geminiJson(`You are Amber's video creation agent.
Topic/goal: ${topic}
Brand: ${profile[0]?.company || ""} | ${profile[0]?.industry || ""}
Audience: ${profile[0]?.audience || ""}
Rules: ${profile[0]?.brandRules || ""}
Return JSON:
{
  "ideas": [{"title":"...","format":"short|avatar|product","why":"...","toolSlug":"shorts-20"}],
  "scripts": [{"title":"...","script":"...","platforms":["tiktok","instagram","youtube"],"toolSlug":"shorts-20"}]
}
ideas: 5. scripts: 2-3. Live tool slugs only.`);
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "video_ideas",
      title: "Video ideas generated",
      detail: { topic },
    });
    return Response.json({ ok: true, action, ...data });
  }

  if (action === "create_production") {
    const title = str(body.title, 160) || "Production";
    const script = str(body.script, 4000);
    let toolSlug = str(body.toolSlug, 80) || "shorts-20";
    if (!LIVE_TOOLS.has(toolSlug)) toolSlug = "shorts-20";
    const missionId = str(body.missionId, 80) || null;
    const platforms = Array.isArray(body.platforms)
      ? body.platforms.map((p) => str(p, 40)).filter(Boolean)
      : ["tiktok", "instagram", "youtube"];
    const now = new Date().toISOString();
    const parentId = randomUUID();
    await q`
      INSERT INTO amber_productions (
        id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
        status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at
      ) VALUES (
        ${parentId}, ${targetUserId}, ${missionId}, ${null}, ${null}, ${title}, ${script},
        ${JSON.stringify(platforms)}, ${toolSlug}, ${"planned"}, ${"pending"}, ${""},
        ${null}, ${""}, ${""}, ${null}, ${null}, ${now}
      )`;

    const children: { id: string; platform: string; title: string }[] = [];
    const variants = [
      { platform: "tiktok", label: "TikTok" },
      { platform: "instagram", label: "Instagram Reels" },
      { platform: "youtube", label: "YouTube Shorts" },
    ];
    for (const v of variants) {
      if (platforms.length && !platforms.includes(v.platform)) continue;
      const childId = randomUUID();
      const childTitle = `${title} — ${v.label}`.slice(0, 160);
      await q`
        INSERT INTO amber_productions (
          id, user_id, mission_id, week_id, parent_id, title, script, platforms, tool_slug,
          status, review_status, review_notes, creation_id, caption, hashtags, schedule_id, publish_id, created_at
        ) VALUES (
          ${childId}, ${targetUserId}, ${missionId}, ${null}, ${parentId}, ${childTitle}, ${script},
          ${JSON.stringify([v.platform])}, ${toolSlug}, ${"queued"}, ${"pending"}, ${""},
          ${null}, ${""}, ${""}, ${null}, ${null}, ${now}
        )`;
      children.push({ id: childId, platform: v.platform, title: childTitle });
    }

    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "video_production",
      title: `Production: ${title}`,
      detail: { parentId, children: children.length, toolSlug },
      href: `/tools/${toolSlug}`,
    });

    return Response.json({
      ok: true,
      production: { id: parentId, title, script, toolSlug, toolHref: `/tools/${toolSlug}`, children },
      autoGenerate: await getAmberAutoGenerate(),
      instructions: "Open toolHref to render. Amber does not auto-spend tokens unless amber_auto_generate is ON (creates Library script packages only).",
    });
  }

  if (action === "link_creation") {
    const id = str(body.id, 80);
    const creationId = str(body.creationId, 80);
    if (!id || !creationId) {
      return Response.json({ ok: false, error: "id and creationId required." }, { status: 400 });
    }
    const owns = (await q`
      SELECT id FROM creations WHERE id = ${creationId} AND user_id = ${targetUserId} LIMIT 1
    `) as { id: string }[];
    if (!owns[0]) return Response.json({ ok: false, error: "Creation not found." }, { status: 404 });
    await q`
      UPDATE amber_productions SET creation_id = ${creationId}, status = ${"ready"}
      WHERE id = ${id} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, id, creationId, status: "ready" });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
