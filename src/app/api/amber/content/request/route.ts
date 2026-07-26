import { randomUUID } from "node:crypto";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import {
  requireAmberAutonomous,
  logAmberAction,
  getAmberAutoGenerate,
  isSuperAdminSession,
} from "@/lib/amber-autonomous";
import { LIVE_TOOLS } from "@/lib/tools";
import { asRecord } from "@/lib/json";

export const runtime = "nodejs";

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
  const weekId = url.searchParams.get("weekId");

  const rows = weekId
    ? ((await q`
        SELECT id, user_id AS "userId", week_id AS "weekId", parent_id AS "parentId",
               title, script, platforms, tool_slug AS "toolSlug", status, creation_id AS "creationId",
               created_at AS "createdAt"
        FROM amber_content_requests
        WHERE user_id = ${targetUserId} AND week_id = ${weekId}
        ORDER BY created_at DESC
      `) as Record<string, unknown>[])
    : ((await q`
        SELECT id, user_id AS "userId", week_id AS "weekId", parent_id AS "parentId",
               title, script, platforms, tool_slug AS "toolSlug", status, creation_id AS "creationId",
               created_at AS "createdAt"
        FROM amber_content_requests
        WHERE user_id = ${targetUserId}
        ORDER BY created_at DESC
        LIMIT 100
      `) as Record<string, unknown>[]);

  return Response.json({
    ok: true,
    requests: rows.map((r) => ({
      ...r,
      platforms: (() => {
        try {
          return typeof r.platforms === "string" ? JSON.parse(r.platforms) : r.platforms;
        } catch {
          return [];
        }
      })(),
      toolHref: r.toolSlug ? `/tools/${r.toolSlug}` : null,
      liveTool: LIVE_TOOLS.has(String(r.toolSlug || "")),
    })),
    autoGenerate: await getAmberAutoGenerate(),
    note: "Requests deep-link to Reelo tools. Auto token spend is OFF unless amber_auto_generate is enabled.",
  });
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
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const action = str(body.action, 40) || "create";

  if (action === "create") {
    const title = str(body.title, 160) || "Content request";
    const script = str(body.script, 4000);
    const toolSlug = str(body.toolSlug, 80) || "shorts-20";
    const weekId = str(body.weekId, 80) || null;
    const platforms = Array.isArray(body.platforms)
      ? body.platforms.map((p) => str(p, 40)).filter(Boolean).slice(0, 6)
      : ["tiktok", "instagram", "youtube"];
    const spawnVariants = body.spawnVariants !== false;
    const now = new Date().toISOString();
    const parentId = randomUUID();

    if (!LIVE_TOOLS.has(toolSlug)) {
      return Response.json(
        {
          ok: false,
          error: `toolSlug “${toolSlug}” is not a live Reelo tool.`,
          liveTools: [...LIVE_TOOLS].slice(0, 30),
        },
        { status: 400 },
      );
    }

    await q`
      INSERT INTO amber_content_requests (
        id, user_id, week_id, parent_id, title, script, platforms, tool_slug, status, creation_id, created_at
      ) VALUES (
        ${parentId}, ${targetUserId}, ${weekId}, ${null}, ${title}, ${script},
        ${JSON.stringify(platforms)}, ${toolSlug}, ${"planned"}, ${null}, ${now}
      )`;

    const children: { id: string; title: string; platform: string }[] = [];
    if (spawnVariants) {
      const variants = [
        { platform: "tiktok", label: "TikTok" },
        { platform: "instagram", label: "Instagram Reels" },
        { platform: "youtube", label: "YouTube Shorts" },
      ];
      for (const v of variants) {
        if (platforms.length && !platforms.includes(v.platform)) continue;
        const childId = randomUUID();
        await q`
          INSERT INTO amber_content_requests (
            id, user_id, week_id, parent_id, title, script, platforms, tool_slug, status, creation_id, created_at
          ) VALUES (
            ${childId}, ${targetUserId}, ${weekId}, ${parentId},
            ${`${title} — ${v.label}`.slice(0, 160)}, ${script},
            ${JSON.stringify([v.platform])}, ${toolSlug}, ${"planned"}, ${null}, ${now}
          )`;
        children.push({ id: childId, title: `${title} — ${v.label}`, platform: v.platform });
      }
    }

    const autoGen = await getAmberAutoGenerate();
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "content_request",
      title: `Content request: ${title}`,
      detail: { parentId, toolSlug, children: children.length, autoGenerate: autoGen },
      href: `/tools/${toolSlug}`,
    });

    return Response.json({
      ok: true,
      request: {
        id: parentId,
        title,
        script,
        platforms,
        toolSlug,
        toolHref: `/tools/${toolSlug}`,
        status: "planned",
        children,
      },
      autoGenerate: autoGen,
      instructions: autoGen
        ? "amber_auto_generate is ON — owner may queue generation separately; this endpoint still does not charge tokens."
        : "Open the tool link to create with Reelo. Amber does not auto-spend tokens while amber_auto_generate is OFF.",
    });
  }

  if (action === "queue") {
    const id = str(body.id, 80);
    if (!id) return Response.json({ ok: false, error: "id required." }, { status: 400 });
    await q`
      UPDATE amber_content_requests SET status = ${"queued"}
      WHERE id = ${id} AND user_id = ${targetUserId}`;
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "content_request_queued",
      title: "Content request marked queued",
      detail: { id },
    });
    return Response.json({ ok: true, action, id, status: "queued" });
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
    if (!owns[0]) {
      return Response.json({ ok: false, error: "Creation not found." }, { status: 404 });
    }
    await q`
      UPDATE amber_content_requests
      SET creation_id = ${creationId}, status = ${"done"}
      WHERE id = ${id} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, action, id, creationId, status: "done" });
  }

  if (action === "bulk_from_week") {
    const weekId = str(body.weekId, 80);
    if (!weekId) return Response.json({ ok: false, error: "weekId required." }, { status: 400 });
    const week = (await q`
      SELECT strategy FROM amber_weeks WHERE id = ${weekId} AND user_id = ${targetUserId} LIMIT 1
    `) as { strategy: string }[];
    if (!week[0]) return Response.json({ ok: false, error: "Week not found." }, { status: 404 });
    let strategy: Record<string, unknown> = {};
    try {
      strategy = asRecord(JSON.parse(week[0].strategy || "{}"));
    } catch {
      strategy = {};
    }
    return Response.json({
      ok: true,
      action,
      note: "Week already created content_requests during week/run when strategy included them.",
      strategyContentRequests: strategy.contentRequests || [],
    });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
