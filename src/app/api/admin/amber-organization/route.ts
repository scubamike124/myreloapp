import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import {
  amberOrgBridgeConfigured,
  fetchOrganizationOverview,
  pauseDivision,
  resumeDivision,
  setDivisionBudget,
  pauseAgent,
  resumeAgent,
  emergencyStopAll,
  resumeFromEmergencyStop,
} from "@/lib/amber/organization-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IMPORTANT: proxy.ts matches "/admin/:path*", which does NOT cover this route
// (it lives under /api). The session must be verified here, explicitly --
// same convention as /api/admin/vault.
async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!amberOrgBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "REELO_ORG_BRIDGE_SECRET is not set on this host -- Amber's organization bridge is unavailable." },
      { status: 503 },
    );
  }

  try {
    const overview = await fetchOrganizationOverview();
    return NextResponse.json({ ok: true, ...overview }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed to reach Amber HQ." }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!amberOrgBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "REELO_ORG_BRIDGE_SECRET is not set on this host -- Amber's organization bridge is unavailable." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    divisionId?: string;
    agentId?: string;
    reason?: string;
    dailyBudgetUsd?: number | null;
    maxSingleSpendUsd?: number | null;
    maxCumulativeSpendUsd?: number | null;
  };

  try {
    switch (body.action) {
      case "pause_division":
        if (!body.divisionId) break;
        return NextResponse.json({ ok: true, ...(await pauseDivision(body.divisionId, body.reason || "Paused by owner")) });
      case "resume_division":
        if (!body.divisionId) break;
        return NextResponse.json({ ok: true, ...(await resumeDivision(body.divisionId)) });
      case "set_division_budget":
        if (!body.divisionId) break;
        return NextResponse.json({
          ok: true,
          ...(await setDivisionBudget(body.divisionId, {
            dailyBudgetUsd: body.dailyBudgetUsd,
            maxSingleSpendUsd: body.maxSingleSpendUsd,
            maxCumulativeSpendUsd: body.maxCumulativeSpendUsd,
          })),
        });
      case "pause_agent":
        if (!body.agentId) break;
        return NextResponse.json({ ok: true, ...(await pauseAgent(body.agentId, body.reason || "Paused by owner")) });
      case "resume_agent":
        if (!body.agentId) break;
        return NextResponse.json({ ok: true, ...(await resumeAgent(body.agentId)) });
      case "emergency_stop":
        return NextResponse.json({ ok: true, ...(await emergencyStopAll()) });
      case "resume_from_emergency_stop":
        return NextResponse.json({ ok: true, ...(await resumeFromEmergencyStop()) });
      default:
        break;
    }
    return NextResponse.json({ ok: false, error: "Unknown or incomplete action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed to reach Amber HQ." }, { status: 502 });
  }
}
