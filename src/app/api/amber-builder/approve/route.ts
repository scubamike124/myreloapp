import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { isAdminSession } from "@/lib/admin-session";
import { dbConfigured } from "@/lib/db";
import { approveDevTask } from "@/lib/amber/dev-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner DB role OR break-glass Headquarters admin cookie — same gate the
 *  rest of Amber Fixes uses; this is a real, irreversible merge+deploy
 *  action and must never be reachable by anyone else. */
async function requireOwner() {
  if (await isAdminSession()) return { ok: true as const };
  if (!dbConfigured()) return { ok: false as const, error: "Accounts aren't available.", status: 503 as const };
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "Sign in required.", status: 401 as const };
  if (user.role !== "OWNER") return { ok: false as const, error: "Owner only.", status: 403 as const };
  return { ok: true as const };
}

export async function POST(req: Request) {
  const gate = await requireOwner();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as { taskId?: string };
  const taskId = String(body.taskId || "");
  if (!taskId) return NextResponse.json({ error: "taskId is required." }, { status: 400 });

  try {
    const result = await approveDevTask(taskId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Approve failed." }, { status: 502 });
  }
}
