import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { createAmberMission, executeAmberMission } from "@/lib/amber-execute";

export const runtime = "nodejs";
export const maxDuration = 180;

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

  if (missionId) {
    const rows = (await q`
      SELECT id, goal, status, strategy, report, week_id AS "weekId", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM amber_missions WHERE id = ${missionId} AND user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    if (!rows[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    const m = rows[0];
    const productions = (await q`
      SELECT id, title, tool_slug AS "toolSlug", status, review_status AS "reviewStatus",
             parent_id AS "parentId", creation_id AS "creationId", schedule_id AS "scheduleId"
      FROM amber_productions WHERE mission_id = ${missionId} ORDER BY created_at ASC
    `) as Record<string, unknown>[];
    return Response.json({
      ok: true,
      mission: {
        ...m,
        strategy: safeJson(m.strategy),
        report: safeJson(m.report),
      },
      productions,
    });
  }

  const missions = (await q`
    SELECT id, goal, status, week_id AS "weekId", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM amber_missions WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];

  return Response.json({ ok: true, missions });
}

function safeJson(v: unknown) {
  if (typeof v !== "string") return v ?? {};
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const action = str(body.action, 40) || "create";
  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);

  if (action === "create") {
    const goal = str(body.goal, 2000);
    if (!goal) return Response.json({ ok: false, error: "goal required." }, { status: 400 });
    const { missionId } = await createAmberMission(q, targetUserId, goal);
    return Response.json({ ok: true, missionId, goal });
  }

  if (action === "execute") {
    const missionId = str(body.missionId, 80);
    if (!missionId) return Response.json({ ok: false, error: "missionId required." }, { status: 400 });
    try {
      const result = await executeAmberMission({
        q,
        userId: targetUserId,
        missionId,
        actorEmail: user.email,
        actorUserId: user.id,
      });
      return Response.json(result);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Mission execute failed." },
        { status: 500 },
      );
    }
  }

  if (action === "create_and_execute") {
    const goal = str(body.goal, 2000);
    if (!goal) return Response.json({ ok: false, error: "goal required." }, { status: 400 });
    const { missionId } = await createAmberMission(q, targetUserId, goal);
    try {
      const result = await executeAmberMission({
        q,
        userId: targetUserId,
        missionId,
        actorEmail: user.email,
        actorUserId: user.id,
      });
      return Response.json(result);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Mission execute failed.", missionId },
        { status: 500 },
      );
    }
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
