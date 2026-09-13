import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { getIndependentSourceCount } from "@/lib/motorbridge/persist";
import { gateOnConfidence } from "@/lib/motorbridge/intelligence";

export const runtime = "nodejs";

/**
 * §29's /failure-trends, wired as the one representative Intelligence API
 * endpoint for this build — the other nine listed in the blueprint
 * (repair-success, component-reliability, parts-demand, climate-impact,
 * fuel-performance, regional-comparison, emerging-failures,
 * predictive-maintenance, racing-benchmarks) follow the identical
 * gateOnConfidence() pattern once there is real aggregate logic behind
 * them; building nine copies of the same "insufficient data" response
 * tonight would be volume, not progress (§50).
 *
 * Today this endpoint has no real customers to aggregate, so it always
 * refuses honestly rather than fabricating a trend. That refusal is the
 * correct behavior, not a bug to work around.
 *
 * Requires a signed-in account. Intelligence is a paid product for
 * "qualified customers" (§26) — a real per-plan entitlement check belongs
 * here once billing is wired (entitlements.ts has the plan shape already),
 * but "must be logged in" is the floor and shouldn't wait on that: this
 * caught its own gap in review — the endpoint was fully anonymous before.
 */
export async function GET(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const category = new URL(req.url).searchParams.get("category") ?? undefined;
  const independentSources = await getIndependentSourceCount(category);

  const result = gateOnConfidence(independentSources, () => ({
    // Real aggregation logic (grouping failures by component/model, computing
    // rates) belongs here once there is a real cohort to compute it from.
    data: { trends: [] as unknown[] },
    confidence: { sourceDiversity: independentSources, observationPeriodStart: null, observationPeriodEnd: null, geographicCoverage: [] as string[] },
  }));

  // A refused query (insufficient sample) is a normal, expected answer, not
  // a server error — it stays 200 with `ok: false` in the body.
  return NextResponse.json(result);
}
