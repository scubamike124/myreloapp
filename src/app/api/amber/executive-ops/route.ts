import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import {
  runExecutivePlanning,
  runExecutiveOpsPass,
  getExecutiveDashboard,
  coordinateExecTasks,
  refreshKpis,
  detectExecRisks,
  generateExecBriefing,
  generateOptimizations,
  resolveApproval,
  requestApprovalIfNeeded,
} from "@/lib/amber-exec-ops";

export const runtime = "nodejs";
export const maxDuration = 180;

async function targetUser(bodyUserId: string | undefined, sessionId: string) {
  if (!bodyUserId || bodyUserId === sessionId) return sessionId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = await targetUser(new URL(req.url).searchParams.get("userId") || undefined, auth.user.id);
  const dash = await getExecutiveDashboard(auth.q, userId);
  return Response.json({ ok: true, ...dash });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 32_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const userId = await targetUser(str(body.userId, 80) || undefined, auth.user.id);
  const action = str(body.action, 40) || "ops_pass";

  try {
    if (action === "plan") {
      const goal = str(body.goal, 2000);
      if (!goal) return Response.json({ ok: false, error: "goal required" }, { status: 400 });
      const result = await runExecutivePlanning(auth.q, userId, goal, auth.user.email);
      return Response.json({ ok: true, ...result });
    }
    if (action === "ops_pass") {
      const result = await runExecutiveOpsPass(auth.q, userId, str(body.goal, 2000) || null, auth.user.email);
      return Response.json(result);
    }
    if (action === "coordinate") {
      return Response.json({ ok: true, ...(await coordinateExecTasks(auth.q, userId)) });
    }
    if (action === "refresh_kpis") {
      return Response.json({ ok: true, kpis: await refreshKpis(auth.q, userId) });
    }
    if (action === "detect_risks") {
      return Response.json({ ok: true, risks: await detectExecRisks(auth.q, userId) });
    }
    if (action === "briefing") {
      const kind = (str(body.kind, 20) || "weekly") as "daily" | "weekly" | "monthly";
      return Response.json({
        ok: true,
        ...(await generateExecBriefing(auth.q, userId, kind, auth.user.email)),
      });
    }
    if (action === "optimize") {
      return Response.json({ ok: true, optimizations: await generateOptimizations(auth.q, userId) });
    }
    if (action === "request_approval") {
      const id = await requestApprovalIfNeeded(auth.q, userId, {
        kind: str(body.kind, 60) || "manual",
        title: str(body.title, 200) || "Approval required",
        detail: str(body.detail, 2000),
        impact: str(body.impact, 40) || "high",
      });
      return Response.json({ ok: true, approvalId: id });
    }
    if (action === "resolve_approval") {
      const approvalId = str(body.approvalId, 80);
      const decision = str(body.decision, 20) as "approved" | "rejected";
      if (!approvalId || !["approved", "rejected"].includes(decision)) {
        return Response.json({ ok: false, error: "approvalId and decision required" }, { status: 400 });
      }
      await resolveApproval(auth.q, userId, approvalId, decision, auth.user.email || "user");
      return Response.json({ ok: true, approvalId, decision });
    }
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Executive ops failed" },
      { status: 500 },
    );
  }
}
