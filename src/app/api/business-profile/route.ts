import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";

export const runtime = "nodejs";

const DEFAULTS = {
  company: "",
  industry: "",
  location: "",
  audience: "",
  style: "",
  goals: "",
  brandRules: "",
  competitors: "",
  serviceAreas: "",
  seasonalTrends: "",
  products: "",
  services: "",
  marketingObjectives: "",
  intelligence: {} as Record<string, unknown>,
  approvalMode: "require" as "require" | "auto",
  onboardingComplete: false,
};

function parseIntel(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw || "{}") as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, profile: DEFAULTS });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, profile: DEFAULTS });
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, profile: DEFAULTS });
  }

  const rows = (await q`
    SELECT company, industry, location, audience, style, goals, brand_rules AS "brandRules",
           competitors, service_areas AS "serviceAreas", seasonal_trends AS "seasonalTrends",
           products, services, marketing_objectives AS "marketingObjectives", intelligence,
           approval_mode AS "approvalMode", onboarding_complete AS "onboardingComplete"
    FROM business_profiles WHERE user_id = ${user.id} LIMIT 1
  `) as Record<string, unknown>[];

  const r = rows[0];
  if (!r) return Response.json({ ok: true, configured: true, signedIn: true, profile: DEFAULTS });

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    profile: {
      company: String(r.company ?? ""),
      industry: String(r.industry ?? ""),
      location: String(r.location ?? ""),
      audience: String(r.audience ?? ""),
      style: String(r.style ?? ""),
      goals: String(r.goals ?? ""),
      brandRules: String(r.brandRules ?? ""),
      competitors: String(r.competitors ?? ""),
      serviceAreas: String(r.serviceAreas ?? ""),
      seasonalTrends: String(r.seasonalTrends ?? ""),
      products: String(r.products ?? ""),
      services: String(r.services ?? ""),
      marketingObjectives: String(r.marketingObjectives ?? ""),
      intelligence: parseIntel(r.intelligence),
      approvalMode: r.approvalMode === "auto" ? "auto" : "require",
      onboardingComplete: Boolean(r.onboardingComplete),
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, q } = auth;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Payload too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const profile = {
    company: str(body.company, 120),
    industry: str(body.industry, 120),
    location: str(body.location, 120),
    audience: str(body.audience, 500),
    style: str(body.style, 200),
    goals: str(body.goals, 500),
    brandRules: str(body.brandRules, 4000),
    competitors: str(body.competitors, 2000),
    serviceAreas: str(body.serviceAreas, 1000),
    seasonalTrends: str(body.seasonalTrends, 2000),
    products: str(body.products, 2000),
    services: str(body.services, 2000),
    marketingObjectives: str(body.marketingObjectives, 2000),
    intelligence: body.intelligence && typeof body.intelligence === "object" ? body.intelligence : {},
    approvalMode: body.approvalMode === "auto" ? "auto" : "require",
    onboardingComplete: Boolean(body.onboardingComplete ?? true),
  };
  const now = new Date().toISOString();

  await q`DELETE FROM business_profiles WHERE user_id = ${user.id}`;
  await q`
    INSERT INTO business_profiles (
      user_id, company, industry, location, audience, style, goals, brand_rules,
      competitors, service_areas, seasonal_trends, products, services, marketing_objectives,
      intelligence, approval_mode, onboarding_complete, updated_at
    ) VALUES (
      ${user.id}, ${profile.company}, ${profile.industry}, ${profile.location},
      ${profile.audience}, ${profile.style}, ${profile.goals}, ${profile.brandRules},
      ${profile.competitors}, ${profile.serviceAreas}, ${profile.seasonalTrends},
      ${profile.products}, ${profile.services}, ${profile.marketingObjectives},
      ${JSON.stringify(profile.intelligence)},
      ${profile.approvalMode}, ${profile.onboardingComplete}, ${now}
    )`;

  return Response.json({ ok: true, profile, savedAt: now });
}
