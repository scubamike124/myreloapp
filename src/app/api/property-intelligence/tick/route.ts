import { NextResponse } from "next/server";
import { runAllPropertyIntelligenceTicks } from "@/lib/property-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * `CRON_SECRET`/`ADMIN_SESSION_SECRET` authorize this route, but nothing
 * external was ever actually calling it: the myreloapp Worker is built by
 * `@opennextjs/cloudflare`, whose generated worker.js exports no `scheduled`
 * handler at all — confirmed by its absence anywhere in the built adapter's
 * dist output. The Cloudflare Cron Trigger configured on this Worker (every
 * 10 minutes, dashboard-side, not in wrangler.jsonc) fires on schedule into
 * a script that has nothing listening for it, so it has always been a
 * no-op. That is the real reason property counts froze: nothing was ever
 * driving this endpoint on a schedule, not a bug in the scanner itself.
 *
 * `PI_CRON_SECRET` is the credential the new GitHub Actions schedule
 * (.github/workflows/property-intelligence-tick.yml) actually uses — a
 * distinct secret so wiring up the real external trigger cannot depend on,
 * or accidentally invalidate, whatever `CRON_SECRET`/`ADMIN_SESSION_SECRET`
 * are already relied on for elsewhere.
 */
function cronAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const allowed = [process.env.CRON_SECRET, process.env.ADMIN_SESSION_SECRET, process.env.PI_CRON_SECRET].filter(
    (v): v is string => Boolean(v && v.length >= 8),
  );
  return allowed.includes(token);
}

export async function POST(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runAllPropertyIntelligenceTicks();
  return NextResponse.json({ ok: true, ...result });
}
