import { NextResponse } from "next/server";
import { suppressEmail } from "@/lib/property-intelligence/persist";
import { ensureSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public CAN-SPAM unsubscribe. Honors opt-out permanently. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") || "").trim();
  const userId = String(url.searchParams.get("u") || "").trim();
  if (!email || !userId) {
    return NextResponse.json({ ok: false, error: "email and u required" }, { status: 400 });
  }
  await ensureSchema();
  await suppressEmail(userId, email);
  return NextResponse.json({ ok: true, message: "You are unsubscribed. This opt-out is permanent." });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; u?: string };
  if (!body.email || !body.u) return NextResponse.json({ ok: false }, { status: 400 });
  await ensureSchema();
  await suppressEmail(body.u, body.email);
  return NextResponse.json({ ok: true });
}
