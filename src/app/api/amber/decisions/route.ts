import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { runDecisionEngine } from "@/lib/amber-decision";

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

  const decisions = (await q`
    SELECT id, kind, priority, title, rationale, action, status, created_at AS "createdAt"
    FROM amber_decisions WHERE user_id = ${targetUserId}
    ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, priority ASC, created_at DESC
    LIMIT 50
  `) as Record<string, unknown>[];

  return Response.json({ ok: true, decisions });
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
  const action = str(body.action, 40) || "run";

  if (action === "run") {
    const result = await runDecisionEngine(q, targetUserId, user.email);
    return Response.json({ ok: true, ...result });
  }

  if (action === "resolve") {
    const id = str(body.decisionId, 80);
    if (!id) return Response.json({ ok: false, error: "decisionId required." }, { status: 400 });
    await q`UPDATE amber_decisions SET status = ${"done"} WHERE id = ${id} AND user_id = ${targetUserId}`;
    return Response.json({ ok: true, decisionId: id, status: "done" });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
