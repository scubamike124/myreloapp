import { NextResponse } from "next/server";
import { runAllPropertyIntelligenceTicks } from "@/lib/property-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const allowed = [process.env.CRON_SECRET, process.env.ADMIN_SESSION_SECRET].filter(
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
