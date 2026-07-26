import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { AMBER_AGENTS, assignAgentJobs, recommendInfrastructure } from "@/lib/amber-agents";
import { rebalanceAmberCalendar } from "@/lib/amber-schedule";

export const runtime = "nodejs";
export const maxDuration = 120;

async function resolveTargetUserId(bodyUserId: string | undefined, sessionUserId: string): Promise<string> {
  if (!bodyUserId || bodyUserId === sessionUserId) return sessionUserId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionUserId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;
  const url = new URL(req.url);
  const targetUserId = await resolveTargetUserId(url.searchParams.get("userId") || undefined, user.id);

  const jobs = (await q`
    SELECT id, agent, title, brief, status, result, campaign_id AS "campaignId", created_at AS "createdAt"
    FROM amber_agent_jobs WHERE user_id = ${targetUserId}
    ORDER BY created_at DESC LIMIT 40
  `) as Record<string, unknown>[];

  const infra = await recommendInfrastructure(q, targetUserId);

  return Response.json({
    ok: true,
    agents: AMBER_AGENTS,
    jobs: jobs.map((j) => ({
      ...j,
      result: (() => {
        try {
          return typeof j.result === "string" ? JSON.parse(j.result) : j.result;
        } catch {
          return {};
        }
      })(),
    })),
    infrastructure: infra.recommendations,
  });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const action = str(body.action, 40) || "assign";

  if (action === "assign") {
    const goal = str(body.goal, 2000);
    if (!goal) return Response.json({ ok: false, error: "goal required." }, { status: 400 });
    const result = await assignAgentJobs({
      q,
      userId: targetUserId,
      goal,
      campaignId: str(body.campaignId, 80) || null,
      actorEmail: user.email,
    });
    return Response.json({ ok: true, ...result });
  }

  if (action === "rebalance_calendar") {
    const result = await rebalanceAmberCalendar(q, targetUserId, user.email);
    return Response.json({ ok: true, ...result });
  }

  if (action === "infra") {
    const result = await recommendInfrastructure(q, targetUserId);
    return Response.json({ ok: true, ...result });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
