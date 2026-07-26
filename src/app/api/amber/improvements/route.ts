import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { listImprovements, setImprovementStatus, generateImprovements } from "@/lib/amber-improvements";
import { computeBusinessHealth } from "@/lib/amber-health";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  return Response.json({ ok: true, improvements: await listImprovements(auth.q, userId) });
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
  const action = str(body.action, 40) || "list";
  if (action === "generate") {
    const health = await computeBusinessHealth(auth.q, userId);
    const created = await generateImprovements(auth.q, userId, {
      goal: str(body.goal, 2000) || "Improve marketing operations",
      health,
      actorEmail: auth.user.email,
    });
    return Response.json({ ok: true, created, improvements: await listImprovements(auth.q, userId) });
  }
  if (action === "set_status") {
    const id = str(body.improvementId, 80);
    const status = str(body.status, 20) as "open" | "accepted" | "dismissed" | "done";
    if (!id || !["open", "accepted", "dismissed", "done"].includes(status)) {
      return Response.json({ ok: false, error: "improvementId and status required" }, { status: 400 });
    }
    await setImprovementStatus(auth.q, userId, id, status);
    return Response.json({ ok: true, improvements: await listImprovements(auth.q, userId) });
  }
  return Response.json({ ok: true, improvements: await listImprovements(auth.q, userId) });
}
