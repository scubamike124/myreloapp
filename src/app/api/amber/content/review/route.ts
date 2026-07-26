import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { reviewAmberProduction } from "@/lib/amber-execute";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const pending = (await q`
    SELECT id, title, tool_slug AS "toolSlug", review_status AS "reviewStatus", review_notes AS "reviewNotes",
           status, mission_id AS "missionId", parent_id AS "parentId", created_at AS "createdAt"
    FROM amber_productions
    WHERE user_id = ${targetUserId} AND review_status IN ('pending', 'needs_improvement')
    ORDER BY created_at DESC LIMIT 50
  `) as Record<string, unknown>[];

  const recent = (await q`
    SELECT id, title, review_status AS "reviewStatus", review_notes AS "reviewNotes", status, created_at AS "createdAt"
    FROM amber_productions WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];

  return Response.json({ ok: true, pending, recent });
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
  const productionId = str(body.productionId, 80) || str(body.id, 80);
  if (!productionId) return Response.json({ ok: false, error: "productionId required." }, { status: 400 });

  const action = str(body.action, 40) || "review";
  const force =
    action === "approve" ? "approve" : action === "reject" ? "reject" : action === "improve" ? "improve" : undefined;

  try {
    const result = await reviewAmberProduction(q, targetUserId, productionId, force);
    return Response.json({ ok: true, productionId, ...result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Review failed." },
      { status: 500 },
    );
  }
}
