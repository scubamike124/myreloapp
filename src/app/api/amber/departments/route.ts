import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { ensureDepartments, listDepartments, pauseDepartment, setDepartmentPriority } from "@/lib/amber-departments";

export const runtime = "nodejs";

async function targetUser(bodyUserId: string | undefined, sessionId: string) {
  if (!bodyUserId || bodyUserId === sessionId) return sessionId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = await targetUser(new URL(req.url).searchParams.get("userId") || undefined, auth.user.id);
  const departments = await ensureDepartments(auth.q, userId);
  return Response.json({ ok: true, departments });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 8_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }
  const userId = await targetUser(str(body.userId, 80) || undefined, auth.user.id);
  const action = str(body.action, 40) || "ensure";
  if (action === "ensure") {
    return Response.json({ ok: true, departments: await ensureDepartments(auth.q, userId) });
  }
  if (action === "pause") {
    const slug = str(body.slug, 40);
    if (!slug) return Response.json({ ok: false, error: "slug required" }, { status: 400 });
    await pauseDepartment(auth.q, userId, slug, body.paused !== false);
    return Response.json({ ok: true, departments: await listDepartments(auth.q, userId) });
  }
  if (action === "priorities") {
    const slug = str(body.slug, 40);
    if (!slug) return Response.json({ ok: false, error: "slug required" }, { status: 400 });
    const priorities = Array.isArray(body.priorities) ? body.priorities.map(String) : [];
    await setDepartmentPriority(auth.q, userId, slug, priorities);
    return Response.json({ ok: true, departments: await listDepartments(auth.q, userId) });
  }
  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
