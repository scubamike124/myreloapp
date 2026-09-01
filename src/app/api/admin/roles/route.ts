import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/accounts";
import { demoteToUser, promoteToAdmin, requireAdminAccess, userHasOwnerRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/roles — Owner promotes/demotes ADMIN (never grants second OWNER). */
export async function POST(req: Request) {
  const gate = await requireAdminAccess();
  if (!gate.ok) {
    return NextResponse.json({ error: "Not authorized." }, { status: gate.status });
  }

  const actor = gate.user || (await currentUser());
  if (!actor || !(await userHasOwnerRole(actor.id))) {
    // Break-glass password admin can open vault, but role changes require DB Owner.
    return NextResponse.json(
      { error: "Only the Owner account can change administrator roles." },
      { status: 403 },
    );
  }

  let body: { userId?: string; action?: string };
  try {
    body = (await req.json()) as { userId?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const userId = String(body.userId || "").trim();
  const action = String(body.action || "").trim();
  if (!userId) return NextResponse.json({ error: "userId required." }, { status: 400 });

  if (action === "promote") {
    const r = await promoteToAdmin(actor.id, userId);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, role: "ADMIN" });
  }
  if (action === "demote") {
    const r = await demoteToUser(actor.id, userId);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, role: "USER" });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

/** GET — confirm current admin access path (no secrets). */
export async function GET() {
  const gate = await requireAdminAccess();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: gate.status });
  }
  const store = await cookies();
  return NextResponse.json({
    ok: true,
    via: gate.via,
    user: gate.user
      ? { id: gate.user.id, email: gate.user.email, role: gate.user.role }
      : null,
    hasSession: Boolean(store.get("reelo_session")?.value),
  });
}
