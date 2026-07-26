import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import {
  loadBusinessIntelligence,
  saveBusinessIntelligence,
  refreshBusinessIntelligence,
} from "@/lib/amber-intelligence";

export const runtime = "nodejs";
export const maxDuration = 90;

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
  const bi = await loadBusinessIntelligence(q, targetUserId);
  return Response.json({ ok: true, intelligence: bi });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  const targetUserId = await resolveTargetUserId(str(body.userId, 80) || undefined, user.id);
  const action = str(body.action, 40) || "save";

  if (action === "refresh") {
    const result = await refreshBusinessIntelligence(q, targetUserId, user.email);
    return Response.json({ ok: true, ...result });
  }

  if (action === "save") {
    const patch = {
      company: body.company != null ? str(body.company, 120) : undefined,
      industry: body.industry != null ? str(body.industry, 120) : undefined,
      location: body.location != null ? str(body.location, 120) : undefined,
      audience: body.audience != null ? str(body.audience, 500) : undefined,
      style: body.style != null ? str(body.style, 200) : undefined,
      goals: body.goals != null ? str(body.goals, 500) : undefined,
      brandRules: body.brandRules != null ? str(body.brandRules, 4000) : undefined,
      competitors: body.competitors != null ? str(body.competitors, 2000) : undefined,
      serviceAreas: body.serviceAreas != null ? str(body.serviceAreas, 1000) : undefined,
      seasonalTrends: body.seasonalTrends != null ? str(body.seasonalTrends, 2000) : undefined,
      products: body.products != null ? str(body.products, 2000) : undefined,
      services: body.services != null ? str(body.services, 2000) : undefined,
      marketingObjectives: body.marketingObjectives != null ? str(body.marketingObjectives, 2000) : undefined,
      approvalMode: body.approvalMode === "auto" ? ("auto" as const) : body.approvalMode === "require" ? ("require" as const) : undefined,
    };
    const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const intelligence = await saveBusinessIntelligence(q, targetUserId, cleaned);
    return Response.json({ ok: true, intelligence });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
