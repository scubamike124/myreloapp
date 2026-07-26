import { requireUser, str } from "@/lib/workspace-api";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { computeBusinessHealth, latestHealthSnapshot, saveHealthSnapshot } from "@/lib/amber-health";

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
  const latest = await latestHealthSnapshot(auth.q, userId);
  return Response.json({ ok: true, latest });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const userId = await targetUser(str(body.userId, 80) || undefined, auth.user.id);
  const scores = await computeBusinessHealth(auth.q, userId);
  const saved = await saveHealthSnapshot(auth.q, userId, scores, null, auth.user.email);
  return Response.json({ ok: true, ...saved });
}
