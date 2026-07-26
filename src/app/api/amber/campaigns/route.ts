import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { buildAmberCampaign, retryFailedProductions } from "@/lib/amber-campaigns";

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
  const campaignId = url.searchParams.get("campaignId");

  if (campaignId) {
    const rows = (await q`
      SELECT id, mission_id AS "missionId", title, objective, audience, strategy, package,
             status, decision_log AS "decisionLog", created_at AS "createdAt"
      FROM amber_campaigns WHERE id = ${campaignId} AND user_id = ${targetUserId} LIMIT 1
    `) as Record<string, unknown>[];
    if (!rows[0]) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    const c = rows[0];
    return Response.json({
      ok: true,
      campaign: {
        ...c,
        strategy: parse(c.strategy),
        package: parse(c.package),
        decisionLog: parse(c.decisionLog),
      },
    });
  }

  const campaigns = (await q`
    SELECT id, title, objective, status, mission_id AS "missionId", created_at AS "createdAt"
    FROM amber_campaigns WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  return Response.json({ ok: true, campaigns });
}

function parse(v: unknown) {
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

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const action = str(body.action, 40) || "build";

  if (action === "build") {
    const objective = str(body.objective, 2000) || str(body.goal, 2000);
    if (!objective) return Response.json({ ok: false, error: "objective required." }, { status: 400 });
    const result = await buildAmberCampaign({
      q,
      userId: targetUserId,
      objective,
      missionId: str(body.missionId, 80) || null,
      actorEmail: user.email,
    });
    return Response.json({ ok: true, ...result });
  }

  if (action === "retry_failed") {
    const result = await retryFailedProductions(q, targetUserId, 2);
    return Response.json({ ok: true, ...result });
  }

  if (action === "set_status") {
    const id = str(body.campaignId, 80);
    const status = str(body.status, 40);
    if (!id || !status) return Response.json({ ok: false, error: "campaignId and status required." }, { status: 400 });
    await q`
      UPDATE amber_campaigns SET status = ${status}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, campaignId: id, status });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
