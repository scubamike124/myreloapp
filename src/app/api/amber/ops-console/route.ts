import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { buildOpsConsole, runOwnerCommand, resolveAlert, scanAndRaiseAlerts, computeReadinessScore } from "@/lib/amber-ops";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  // Super Admin may load ops without app user for cockpit; requireUser for consistency
  const auth = await requireUser();
  if (!auth.ok) {
    if (await isSuperAdminSession()) {
      // allow via admin aggregate instead
      return Response.json({ ok: false, error: "use_admin_aggregate", message: "Use /api/admin/amber for Super Admin ops console." }, { status: 401 });
    }
    return auth.response;
  }
  const consoleData = await buildOpsConsole(auth.q);
  return Response.json({ ok: true, ...consoleData });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const action = str(body.action, 40) || "command";
  if (action === "scan_alerts") {
    return Response.json({ ok: true, ...(await scanAndRaiseAlerts(auth.q)) });
  }
  if (action === "compute_readiness") {
    return Response.json({ ok: true, ...(await computeReadinessScore(auth.q)) });
  }
  if (action === "resolve_alert") {
    const alertId = str(body.alertId, 80);
    if (!alertId) return Response.json({ ok: false, error: "alertId required" }, { status: 400 });
    await resolveAlert(auth.q, alertId, auth.user.email || "user");
    return Response.json({ ok: true, alertId });
  }
  if (action === "command") {
    const command = str(body.command, 80);
    if (!command) return Response.json({ ok: false, error: "command required" }, { status: 400 });
    try {
      const result = await runOwnerCommand(auth.q, {
        command,
        userId: str(body.userId, 80) || auth.user.id,
        actorEmail: auth.user.email || "user",
        meta: (body.meta as Record<string, unknown>) || {},
      });
      return Response.json(result);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Command failed" },
        { status: 500 },
      );
    }
  }
  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
