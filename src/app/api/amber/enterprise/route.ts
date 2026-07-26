import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import {
  getEnterpriseDashboard,
  syncEnterpriseWorkspaces,
  provisionWorkspace,
  rebuildKnowledgeGraph,
  searchKnowledgeGraph,
  generatePredictiveInsights,
  runSelfOptimization,
  allocateResources,
  runBenchmarks,
  generateEnterpriseBusinessReview,
  runEnterpriseIntelligencePass,
} from "@/lib/amber-enterprise";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) {
    if (await isSuperAdminSession()) {
      return Response.json(
        { ok: false, error: "use_admin_aggregate", message: "Use /api/admin/amber for Super Admin enterprise console." },
        { status: 401 },
      );
    }
    return auth.response;
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    const userId = url.searchParams.get("userId");
    const result = await searchKnowledgeGraph(auth.q, q, userId || auth.user.id);
    return Response.json({ ok: true, ...result });
  }
  const dash = await getEnterpriseDashboard(auth.q);
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

  const action = str(body.action, 40) || "dashboard";
  const userId = str(body.userId, 80) || auth.user.id;

  try {
    if (action === "sync") return Response.json({ ok: true, ...(await syncEnterpriseWorkspaces(auth.q, auth.user.email)) });
    if (action === "provision") {
      return Response.json({
        ok: true,
        ...(await provisionWorkspace(auth.q, userId, str(body.label, 160), auth.user.email || "user")),
      });
    }
    if (action === "rebuild_graph") {
      return Response.json({ ok: true, ...(await rebuildKnowledgeGraph(auth.q, userId)) });
    }
    if (action === "search_graph") {
      return Response.json({
        ok: true,
        ...(await searchKnowledgeGraph(auth.q, str(body.q, 120) || "", userId)),
      });
    }
    if (action === "predict") {
      return Response.json({
        ok: true,
        forecasts: await generatePredictiveInsights(auth.q, body.all ? null : userId),
      });
    }
    if (action === "optimize") {
      return Response.json({ ok: true, ...(await runSelfOptimization(auth.q, userId, auth.user.email)) });
    }
    if (action === "allocate") {
      return Response.json({ ok: true, allocations: await allocateResources(auth.q, userId) });
    }
    if (action === "benchmark") {
      return Response.json({ ok: true, benchmarks: await runBenchmarks(auth.q) });
    }
    if (action === "review") {
      const kind = (str(body.kind, 20) || "weekly") as
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "annual";
      return Response.json({
        ok: true,
        ...(await generateEnterpriseBusinessReview(auth.q, kind, auth.user.email)),
      });
    }
    if (action === "intelligence_pass") {
      return Response.json({ ok: true, ...(await runEnterpriseIntelligencePass(auth.q, auth.user.email)) });
    }
    if (action === "dashboard") {
      return Response.json({ ok: true, ...(await getEnterpriseDashboard(auth.q)) });
    }
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Enterprise action failed" },
      { status: 500 },
    );
  }
}
