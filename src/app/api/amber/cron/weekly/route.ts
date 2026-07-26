import { getAmberContinuousCycle, getAmberLearningMode, getAmberEmergencyStop, logAmberAction } from "@/lib/amber-autonomous";
import { ensureSchema, sqlAsync, dbConfigured } from "@/lib/db";
import { runLearningCyclesForWorkspaces } from "@/lib/amber-launch";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Continuous Learning Mode weekly runner.
 * Auth: Authorization: Bearer <AMBER_CRON_SECRET> or x-amber-cron-secret header.
 * Only runs when Learning Mode + Continuous Cycle are ON and emergency stop is OFF.
 * Customers never call this — admin/cron only.
 */
export async function POST(req: Request) {
  const secret = (process.env.AMBER_CRON_SECRET || "").trim();
  const auth = req.headers.get("authorization") || "";
  const headerSecret = req.headers.get("x-amber-cron-secret") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || (bearer !== secret && headerSecret !== secret)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  if (await getAmberEmergencyStop()) {
    return Response.json({ ok: false, skipped: "emergency_stop" });
  }
  if (!(await getAmberLearningMode())) {
    return Response.json({ ok: false, skipped: "learning_mode_off" });
  }
  if (!(await getAmberContinuousCycle())) {
    return Response.json({ ok: false, skipped: "continuous_off" });
  }

  if (!dbConfigured()) {
    return Response.json({ ok: false, error: "Database not configured." }, { status: 503 });
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  await logAmberAction({
    actorUserId: null,
    actorEmail: "cron",
    kind: "learning_cron",
    title: "Continuous Learning Mode cron started",
    detail: {},
  });

  const batch = await runLearningCyclesForWorkspaces({
    q,
    actorEmail: "cron",
    actorUserId: null,
  });

  return Response.json({
    ok: batch.ok,
    skipped: batch.skipped,
    results: batch.results,
    note: "Each workspace ran in isolation (per user_id). Not customer-facing.",
  });
}
