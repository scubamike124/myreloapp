import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { fetchAmberOperations } from "@/lib/amber/operations-telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live production telemetry for the Amber Operations dashboard.
 *
 * Read-only by construction: it calls only the bridge's reporting actions and
 * exposes no control action, so this route cannot pause, resume, stop or
 * re-budget anything even if its response is replayed.
 *
 * The bridge secret is read server-side inside organization-bridge.ts and is
 * never included in the response, so the browser holds Amber's production
 * credential at no point.
 *
 * proxy.ts matches "/admin/:path*", which does NOT cover /api/admin/*, so the
 * owner session is verified here explicitly -- same convention as
 * /api/admin/vault and /api/admin/amber-organization.
 */
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

  /**
   * An unreachable Amber HQ is reported as data, not as an HTTP error.
   *
   * The dashboard's job is to say what is true right now, and "production
   * cannot be reached" is one of the most important things it can say. A 502
   * here would render an empty page that looks identical to a quiet night.
   */
  const operations = await fetchAmberOperations();
  return NextResponse.json({ ok: true, operations }, { headers: { "Cache-Control": "no-store" } });
}
