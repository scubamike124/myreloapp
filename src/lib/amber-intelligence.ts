import { randomUUID } from "node:crypto";
import { asRecord } from "@/lib/json";
import { geminiJson, mergeAmberLearning } from "@/lib/amber-weekly";
import { logAmberAction } from "@/lib/amber-autonomous";
import type { Sql } from "@/lib/workspace-api";

export type BusinessIntelligence = {
  company: string;
  industry: string;
  location: string;
  audience: string;
  style: string;
  goals: string;
  brandRules: string;
  competitors: string;
  serviceAreas: string;
  seasonalTrends: string;
  products: string;
  services: string;
  marketingObjectives: string;
  brandName: string;
  colors: string;
  logoUrl: string;
  brandVoice: string;
  intelligence: Record<string, unknown>;
  approvalMode: "require" | "auto";
};

function parseJsonObj(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return asRecord(JSON.parse(raw || "{}"));
    } catch {
      return {};
    }
  }
  return {};
}

/** Load unified business intelligence for Amber. */
export async function loadBusinessIntelligence(q: Sql, userId: string): Promise<BusinessIntelligence> {
  const profile = (await q`
    SELECT company, industry, location, audience, style, goals, brand_rules AS "brandRules",
           competitors, service_areas AS "serviceAreas", seasonal_trends AS "seasonalTrends",
           products, services, marketing_objectives AS "marketingObjectives",
           intelligence, approval_mode AS "approvalMode"
    FROM business_profiles WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];
  const kit = (await q`
    SELECT brand_name AS "brandName", colors, logo_url AS "logoUrl", extra
    FROM brand_kits WHERE user_id = ${userId} LIMIT 1
  `) as Record<string, unknown>[];

  const p = profile[0] || {};
  const k = kit[0] || {};
  const extra = parseJsonObj(k.extra);
  const intel = parseJsonObj(p.intelligence);

  return {
    company: String(p.company || k.brandName || ""),
    industry: String(p.industry || ""),
    location: String(p.location || ""),
    audience: String(p.audience || ""),
    style: String(p.style || ""),
    goals: String(p.goals || ""),
    brandRules: String(p.brandRules || ""),
    competitors: String(p.competitors || ""),
    serviceAreas: String(p.serviceAreas || ""),
    seasonalTrends: String(p.seasonalTrends || ""),
    products: String(p.products || extra.products || ""),
    services: String(p.services || extra.services || ""),
    marketingObjectives: String(p.marketingObjectives || ""),
    brandName: String(k.brandName || p.company || ""),
    colors: String(k.colors || ""),
    logoUrl: String(k.logoUrl || ""),
    brandVoice: String(extra.voice || p.style || ""),
    intelligence: intel,
    approvalMode: p.approvalMode === "auto" ? "auto" : "require",
  };
}

export async function saveBusinessIntelligence(
  q: Sql,
  userId: string,
  patch: Partial<BusinessIntelligence>,
): Promise<BusinessIntelligence> {
  const current = await loadBusinessIntelligence(q, userId);
  const next: BusinessIntelligence = {
    ...current,
    ...patch,
    intelligence: { ...current.intelligence, ...(patch.intelligence || {}) },
    approvalMode: patch.approvalMode === "auto" ? "auto" : patch.approvalMode === "require" ? "require" : current.approvalMode,
  };
  const now = new Date().toISOString();
  await q`DELETE FROM business_profiles WHERE user_id = ${userId}`;
  await q`
    INSERT INTO business_profiles (
      user_id, company, industry, location, audience, style, goals, brand_rules,
      competitors, service_areas, seasonal_trends, products, services, marketing_objectives,
      intelligence, approval_mode, onboarding_complete, updated_at
    ) VALUES (
      ${userId},
      ${next.company.slice(0, 120)},
      ${next.industry.slice(0, 120)},
      ${next.location.slice(0, 120)},
      ${next.audience.slice(0, 500)},
      ${next.style.slice(0, 200)},
      ${next.goals.slice(0, 500)},
      ${next.brandRules.slice(0, 4000)},
      ${next.competitors.slice(0, 2000)},
      ${next.serviceAreas.slice(0, 1000)},
      ${next.seasonalTrends.slice(0, 2000)},
      ${typeof next.products === "string" ? next.products.slice(0, 2000) : JSON.stringify(next.products).slice(0, 2000)},
      ${typeof next.services === "string" ? next.services.slice(0, 2000) : JSON.stringify(next.services).slice(0, 2000)},
      ${next.marketingObjectives.slice(0, 2000)},
      ${JSON.stringify(next.intelligence)},
      ${next.approvalMode},
      ${true},
      ${now}
    )`;
  return next;
}

/**
 * Continuously refresh BI from workspace activity + Gemini synthesis.
 * Honest: uses Reelo library/schedule data only — not fake social reach.
 */
export async function refreshBusinessIntelligence(
  q: Sql,
  userId: string,
  actorEmail: string | null,
): Promise<{ intelligence: BusinessIntelligence; insights: Record<string, unknown> }> {
  const current = await loadBusinessIntelligence(q, userId);
  const creations = (await q`
    SELECT tool_slug AS "toolSlug", title, kind, created_at AS "createdAt"
    FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50
  `) as Record<string, unknown>[];
  const schedules = (await q`
    SELECT title, approval_status AS "approvalStatus", amber_placed AS "amberPlaced",
           publish_result AS "publishResult"
    FROM schedule_items WHERE user_id = ${userId} ORDER BY scheduled_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  const learning = (await q`
    SELECT patterns FROM amber_learning WHERE user_id = ${userId} LIMIT 1
  `) as { patterns: string }[];

  let insights: Record<string, unknown> = {};
  try {
    insights = await geminiJson(`You are Amber's business intelligence module.
Update understanding of this business from Reelo workspace data only (not social platform reach).
Current BI: ${JSON.stringify(current).slice(0, 3500)}
Recent creations: ${JSON.stringify(creations.slice(0, 15))}
Recent schedules: ${JSON.stringify(schedules.slice(0, 15))}
Learning: ${learning[0]?.patterns?.slice(0, 1500) || "{}"}

Return JSON:
{
  "summary": "2-3 sentences",
  "suggestedCompetitors": "...",
  "suggestedServiceAreas": "...",
  "suggestedSeasonalTrends": "...",
  "suggestedProducts": "...",
  "suggestedServices": "...",
  "suggestedMarketingObjectives": "...",
  "audienceNotes": "...",
  "priorityThemes": ["..."],
  "risks": ["..."]
}`);
  } catch {
    insights = {
      summary: "BI refresh used workspace counts only (Gemini unavailable).",
      priorityThemes: [],
      risks: [],
    };
  }

  const intelBlob = {
    ...current.intelligence,
    lastRefresh: new Date().toISOString(),
    summary: insights.summary,
    audienceNotes: insights.audienceNotes,
    priorityThemes: insights.priorityThemes,
    risks: insights.risks,
    creationCount: creations.length,
    scheduleCount: schedules.length,
    note: "Reelo workspace intelligence only — not platform analytics.",
  };

  const updated = await saveBusinessIntelligence(q, userId, {
    competitors: String(insights.suggestedCompetitors || current.competitors).slice(0, 2000),
    serviceAreas: String(insights.suggestedServiceAreas || current.serviceAreas).slice(0, 1000),
    seasonalTrends: String(insights.suggestedSeasonalTrends || current.seasonalTrends).slice(0, 2000),
    products: String(insights.suggestedProducts || current.products).slice(0, 2000),
    services: String(insights.suggestedServices || current.services).slice(0, 2000),
    marketingObjectives: String(insights.suggestedMarketingObjectives || current.marketingObjectives).slice(0, 2000),
    intelligence: intelBlob,
  });

  await mergeAmberLearning(q, userId, {
    themes: Array.isArray(insights.priorityThemes) ? insights.priorityThemes : [],
    learningNote: String(insights.summary || "").slice(0, 400),
  });

  await logAmberAction({
    actorUserId: userId,
    actorEmail,
    kind: "intelligence_refresh",
    title: "Business intelligence refreshed",
    detail: { summary: insights.summary },
  });

  return { intelligence: updated, insights };
}

export function biPromptBlock(bi: BusinessIntelligence): string {
  return [
    `Brand: ${bi.brandName || bi.company}`,
    `Industry: ${bi.industry}`,
    `Location/areas: ${bi.location} | ${bi.serviceAreas}`,
    `Audience: ${bi.audience}`,
    `Voice: ${bi.brandVoice || bi.style}`,
    `Products: ${bi.products}`,
    `Services: ${bi.services}`,
    `Competitors: ${bi.competitors}`,
    `Seasonal: ${bi.seasonalTrends}`,
    `Objectives: ${bi.marketingObjectives || bi.goals}`,
    `Brand rules: ${bi.brandRules}`,
    `Intel: ${JSON.stringify(bi.intelligence).slice(0, 800)}`,
  ].join("\n");
}

export async function recordPerformance(
  q: Sql,
  userId: string,
  kind: string,
  metrics: Record<string, unknown>,
  refId?: string | null,
  note?: string,
): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_performance (id, user_id, kind, ref_id, metrics, note, created_at)
    VALUES (
      ${id}, ${userId}, ${kind.slice(0, 60)}, ${refId ?? null},
      ${JSON.stringify(metrics)}, ${(note || "").slice(0, 500)}, ${now}
    )`;
  return id;
}
