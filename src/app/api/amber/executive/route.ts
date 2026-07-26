import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { buildExecutiveBrief, latestExecutiveBrief } from "@/lib/amber-executive";
import { computeBusinessHealth } from "@/lib/amber-health";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  const brief = await latestExecutiveBrief(auth.q, userId);
  return Response.json({ ok: true, brief });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }
  const userId = await targetUser(str(body.userId, 80) || undefined, auth.user.id);
  const health = await computeBusinessHealth(auth.q, userId);
  const brief = await buildExecutiveBrief(auth.q, userId, {
    health,
    goal: str(body.goal, 2000) || null,
    actorEmail: auth.user.email,
  });
  return Response.json({ ok: true, ...brief, health });
}
