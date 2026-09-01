import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { isAdminSession } from "@/lib/admin-session";
import { dbConfigured } from "@/lib/db";
import { asRecord } from "@/lib/json";
import { publicRun } from "@/lib/amber/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HQ = (process.env.AMBER_HQ_URL || "https://hq.amberoneai.com").replace(/\/$/, "");

function cronSecret(): string {
  return (
    process.env.AMBER_BUILDER_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SOCIAL_TOKEN_SECRET ||
    ""
  ).trim();
}

function shapeBuilderPayload(raw: unknown) {
  const data = asRecord(raw);
  const list = Array.isArray(data.runs) ? data.runs : Array.isArray(data.recent) ? data.recent : [];
  const runs = list.filter((r) => r && typeof r === "object").map((r) => publicRun(r as Record<string, unknown>));
  return { ...data, runs };
}

/** Owner DB role OR break-glass Headquarters admin cookie. */
async function requireOwner() {
  if (await isAdminSession()) return { user: null };
  if (!dbConfigured()) return { error: "Accounts aren't available.", status: 503 as const };
  const user = await currentUser();
  if (!user) return { error: "Sign in to use Amber Builder.", status: 401 as const };
  if (user.role !== "OWNER") {
    return { error: "Amber Builder is limited to the Owner account.", status: 403 as const };
  }
  return { user };
}

export async function GET() {
  const gate = await requireOwner();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "AMBER_BUILDER_SECRET / CRON_SECRET is not configured on Reelo." },
      { status: 503 },
    );
  }

  const res = await fetch(`${HQ}/api/amber-builder`, {
    headers: { "x-cron-secret": secret },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(shapeBuilderPayload(data), { status: res.status });
}

export async function POST(req: Request) {
  const gate = await requireOwner();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "AMBER_BUILDER_SECRET / CRON_SECRET is not configured on Reelo." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await fetch(`${HQ}/api/amber-builder`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cron-secret": secret,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(shapeBuilderPayload(data), { status: res.status });
}
