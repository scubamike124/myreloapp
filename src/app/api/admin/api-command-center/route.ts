/**
 * GET /api/admin/api-command-center — the International API Command Center feed.
 *
 * A thin proxy onto Amber HQ's inventory. It exists so the browser never sees
 * the bridge secret, and so Reelo keeps no second copy of the API catalogue:
 * one system of record per function.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { amberOrgBridgeConfigured, fetchApiCommandCenter, fetchCountryApis } from "@/lib/amber/organization-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IMPORTANT: proxy.ts matches "/admin/:path*", which does NOT cover this route
// (it lives under /api). The session must be verified here, explicitly --
// same convention as /api/admin/amber-organization and /api/admin/vault.
async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!amberOrgBridgeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Amber's organization bridge is not configured (REELO_ORG_BRIDGE_SECRET unset)." },
      { status: 503 },
    );
  }

  const country = new URL(req.url).searchParams.get("country");

  try {
    if (country) {
      const detail = await fetchCountryApis(country);
      return NextResponse.json({ ok: true, ...detail });
    }
    return NextResponse.json({ ok: true, snapshot: await fetchApiCommandCenter() });
  } catch (e) {
    // The bridge being down is a fact worth showing, not a blank screen.
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Amber HQ did not answer." },
      { status: 502 },
    );
  }
}
