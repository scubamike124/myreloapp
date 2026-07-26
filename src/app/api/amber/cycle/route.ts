import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import {
  runAmberAutonomousCycle,
  detectInfraVerificationNeeds,
  resolveVerificationHold,
} from "@/lib/amber-cycle";

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

  const holds = (await q`
    SELECT id, provider, step, status, explanation, resume_hint AS "resumeHint",
           created_at AS "createdAt", resolved_at AS "resolvedAt"
    FROM amber_verification_holds WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];

  const logs = (await q`
    SELECT id, kind, title, created_at AS "createdAt"
    FROM amber_action_logs
    WHERE kind IN ('autonomous_cycle', 'executive_report', 'verification_hold', 'verification_resume')
    ORDER BY created_at DESC LIMIT 30
  `) as Record<string, unknown>[];

  return Response.json({ ok: true, holds, recentCycleLogs: logs });
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
  const action = str(body.action, 40) || "run";

  if (action === "run") {
    try {
      const result = await runAmberAutonomousCycle({
        q,
        userId: targetUserId,
        goal: str(body.goal, 2000) || null,
        actorEmail: user.email,
        actorUserId: user.id,
      });
      return Response.json(result);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Cycle failed." },
        { status: 500 },
      );
    }
  }

  if (action === "detect_holds") {
    const result = await detectInfraVerificationNeeds(q, targetUserId);
    return Response.json({ ok: true, ...result });
  }

  if (action === "resolve_hold") {
    const holdId = str(body.holdId, 80);
    if (!holdId) return Response.json({ ok: false, error: "holdId required." }, { status: 400 });
    await resolveVerificationHold(q, targetUserId, holdId);
    return Response.json({ ok: true, holdId, status: "resolved" });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
