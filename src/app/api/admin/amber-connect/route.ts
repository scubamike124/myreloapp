import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { connectAmber } from "@/lib/amber/connect-amber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Press-button endpoint for Connect Amber.
 *
 * POST only: it causes a production configuration change, and a GET that
 * writes can be fired by a link preview or a browser prefetch.
 *
 * proxy.ts matches "/admin/:path*", which does NOT cover /api/admin/*, so the
 * owner session is verified here explicitly — same convention as
 * /api/admin/vault and /api/admin/amber-operations.
 *
 * No secret is accepted from the browser and none is returned to it. Relo
 * authenticates to HQ server-side with a credential it already holds, and
 * Amber uses her own credentials to do the actual work.
 */
export async function POST() {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const result = await connectAmber();
  return NextResponse.json({ ok: result.outcome === "CONNECTED", result }, { headers: { "Cache-Control": "no-store" } });
}
