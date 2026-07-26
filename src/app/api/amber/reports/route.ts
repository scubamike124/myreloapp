import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { generateExecutiveReport } from "@/lib/amber-reports";
import { asRecord } from "@/lib/json";

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
  const reportId = url.searchParams.get("reportId");

  if (reportId) {
    const rows = (await q`
      SELECT id, week_id AS "weekId", mission_id AS "missionId", period, summary, body, created_at AS "createdAt"
      FROM amber_reports WHERE id = ${reportId} AND user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    if (!rows[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    const r = rows[0];
    return Response.json({
      ok: true,
      report: { ...r, body: safeJson(r.body) },
    });
  }

  const reports = (await q`
    SELECT id, period, summary, created_at AS "createdAt", week_id AS "weekId", mission_id AS "missionId"
    FROM amber_reports WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 20
  `) as Record<string, unknown>[];

  return Response.json({ ok: true, reports });
}

function safeJson(v: unknown) {
  if (typeof v !== "string") return v ?? {};
  try {
    return asRecord(JSON.parse(v));
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

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const result = await generateExecutiveReport({
    q,
    userId: targetUserId,
    weekId: str(body.weekId, 80) || null,
    missionId: str(body.missionId, 80) || null,
    actorEmail: user.email,
  });
  return Response.json({ ok: true, ...result });
}
