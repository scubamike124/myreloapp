import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession, logAmberAction } from "@/lib/amber-autonomous";
import { runAmberWeeklyCycle } from "@/lib/amber-weekly";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  if (weekId) {
    const weeks = (await q`
      SELECT id, user_id AS "userId", week_start AS "weekStart", status, strategy, report, created_at AS "createdAt"
      FROM amber_weeks WHERE id = ${weekId} AND user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    if (!weeks[0]) return Response.json({ ok: false, error: "Week not found." }, { status: 404 });
    const tasks = (await q`
      SELECT id, kind, payload, status, created_at AS "createdAt"
      FROM amber_tasks WHERE week_id = ${weekId} ORDER BY created_at ASC
    `) as Record<string, unknown>[];
    const w = weeks[0];
    return Response.json({
      ok: true,
      week: {
        ...w,
        strategy: safeJson(w.strategy),
        report: safeJson(w.report),
      },
      tasks: tasks.map((t) => ({ ...t, payload: safeJson(t.payload) })),
    });
  }

  const weeks = (await q`
    SELECT id, week_start AS "weekStart", status, created_at AS "createdAt"
    FROM amber_weeks WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];

  const learning = (await q`
    SELECT patterns, updated_at AS "updatedAt" FROM amber_learning WHERE user_id = ${targetUserId} LIMIT 1
  `) as { patterns: string; updatedAt: string }[];

  return Response.json({
    ok: true,
    weeks,
    learning: learning[0]
      ? { patterns: safeJson(learning[0].patterns), updatedAt: learning[0].updatedAt }
      : null,
  });
}

function safeJson(v: unknown): unknown {
  if (v == null) return {};
  if (typeof v !== "string") return v;
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
    body = ((await readJsonLimited(req, 8_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const action = str(body.action, 40) || "run";
  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);

  if (action === "run") {
    try {
      const result = await runAmberWeeklyCycle({
        q,
        userId: targetUserId,
        actorEmail: user.email,
        actorUserId: user.id,
      });
      return Response.json({ ok: true, ...result });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Weekly cycle failed." },
        { status: 500 },
      );
    }
  }

  if (action === "complete") {
    const weekId = str(body.weekId, 80);
    if (!weekId) return Response.json({ ok: false, error: "weekId required." }, { status: 400 });
    await q`
      UPDATE amber_weeks SET status = ${"completed"}
      WHERE id = ${weekId} AND user_id = ${targetUserId}`;
    await logAmberAction({
      actorUserId: user.id,
      actorEmail: user.email,
      kind: "week_complete",
      title: "Amber week marked completed",
      detail: { weekId },
    });
    return Response.json({ ok: true, weekId, status: "completed" });
  }

  if (action === "stop") {
    const weekId = str(body.weekId, 80);
    if (!weekId) return Response.json({ ok: false, error: "weekId required." }, { status: 400 });
    await q`
      UPDATE amber_weeks SET status = ${"stopped"}
      WHERE id = ${weekId} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, weekId, status: "stopped" });
  }

  return Response.json({ ok: false, error: "Unknown action. Use run|complete|stop." }, { status: 400 });
}
