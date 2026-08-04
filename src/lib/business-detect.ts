/**
 * MyReelo Business Intelligence — mirrors Amber video-qos/business-detect.
 */
import { directReeloAvatar } from "@/lib/avatar-director";

export function recommendedTemplatesForBusiness(businessType: string): string[] {
  const t = businessType.toLowerCase();
  if (/real.?estate|realtor/.test(t)) return ["real-estate", "social-media-ad", "testimonial"];
  if (/restaurant|food|cafe/.test(t)) return ["restaurant", "promotional-sale", "social-media-ad"];
  if (/medical|dental|clinic|health/.test(t)) return ["medical", "testimonial", "explainer"];
  if (/auto|car|dealership/.test(t)) return ["automotive", "promotional-sale", "social-media-ad"];
  if (/e-?commerce|shop|store|retail/.test(t)) return ["ecommerce", "product-showcase", "promotional-sale"];
  if (/saas|software|app/.test(t)) return ["product-demo", "app-demo", "explainer", "website-promo"];
  if (/local|plumber|salon|gym/.test(t)) return ["local-business", "promotional-sale", "testimonial"];
  if (/corporate|b2b|enterprise|luxury/.test(t)) return ["corporate-presentation", "brand-introduction", "explainer"];
  return ["social-media-ad", "talking-avatar", "website-promo", "product-demo"];
}

export type BusinessSignals = {
  businessName?: string;
  productOrService?: string;
  website?: string | null;
  industryHint?: string | null;
  audienceHint?: string | null;
  ctaHint?: string | null;
  toneHint?: string | null;
};

export type BusinessProfile = {
  businessType: string;
  industry: string;
  products: string[];
  services: string[];
  audience: string;
  tone: string;
  objectives: string[];
  confidence: number;
  reasons: string[];
};

const INDUSTRY_RULES: Array<{
  re: RegExp;
  industry: string;
  type: string;
  audience: string;
  tone: string;
  objectives: string[];
  music: string;
  style: string;
  cta: string;
}> = [
  { re: /real.?estate|realtor|listing|property|homes?/i, industry: "real-estate", type: "real-estate", audience: "home buyers and sellers", tone: "premium", objectives: ["leads", "book showing"], music: "cinematic", style: "premium", cta: "Book a private showing" },
  { re: /restaurant|cafe|bistro|food|dining|menu|chef/i, industry: "restaurant", type: "restaurant", audience: "local diners", tone: "warm", objectives: ["visits", "reservations"], music: "upbeat-bed", style: "warm", cta: "Reserve a table" },
  { re: /medical|dental|clinic|health|therapy|wellness|doctor/i, industry: "medical", type: "medical", audience: "patients seeking care", tone: "calm", objectives: ["trust", "book appointment"], music: "soft-ambient", style: "calm", cta: "Schedule a consultation" },
  { re: /auto|car|dealership|vehicle|motors/i, industry: "automotive", type: "automotive", audience: "car shoppers", tone: "confident", objectives: ["inquiries", "test drive"], music: "upbeat-bed", style: "bold", cta: "Inquire today" },
  { re: /shop|store|ecommerce|e-?commerce|retail|sku|cart/i, industry: "ecommerce", type: "ecommerce", audience: "online shoppers", tone: "punchy", objectives: ["sales", "traffic"], music: "upbeat-bed", style: "product-led", cta: "Shop now" },
  { re: /saas|software|app|platform|api|dashboard|cloud/i, industry: "saas", type: "saas", audience: "busy professionals", tone: "clear", objectives: ["demo", "signup"], music: "low-bed", style: "clean", cta: "Start free" },
  { re: /plumb|salon|gym|hvac|local|dentist|barber|landscap/i, industry: "local-business", type: "local-business", audience: "neighbors nearby", tone: "friendly", objectives: ["calls", "bookings"], music: "upbeat-bed", style: "friendly", cta: "Call today" },
  { re: /corporate|b2b|enterprise|consult|agency|finance|law/i, industry: "corporate", type: "corporate", audience: "decision makers", tone: "professional", objectives: ["authority", "leads"], music: "low-bed", style: "executive", cta: "Book a meeting" },
  { re: /luxury|hotel|spa|jewelry|couture/i, industry: "luxury", type: "luxury", audience: "discerning clients", tone: "premium", objectives: ["brand", "inquiries"], music: "cinematic", style: "cinematic", cta: "Request access" },
];

function haystack(s: BusinessSignals): string {
  return [s.businessName, s.productOrService, s.website, s.industryHint, s.audienceHint, s.ctaHint, s.toneHint]
    .filter(Boolean)
    .join(" ");
}

export function analyzeBusiness(signals: BusinessSignals): BusinessProfile {
  const hay = haystack(signals);
  const reasons: string[] = [];
  let match = INDUSTRY_RULES.find((r) => r.re.test(hay));
  if (signals.industryHint) {
    const hinted = INDUSTRY_RULES.find(
      (r) => r.re.test(signals.industryHint!) || r.industry === signals.industryHint!.toLowerCase(),
    );
    if (hinted) {
      match = hinted;
      reasons.push(`Industry hint: ${signals.industryHint}`);
    }
  }
  if (!match) {
    match = {
      re: /.*/,
      industry: "general",
      type: "general",
      audience: signals.audienceHint || "customers",
      tone: signals.toneHint || "clear",
      objectives: ["awareness", "convert"],
      music: "low-bed",
      style: "clean",
      cta: "Learn more",
    };
    reasons.push("No strong industry match — using general profile");
  } else if (!reasons.length) {
    reasons.push(`Matched industry: ${match.industry}`);
  }

  const product = (signals.productOrService || "").trim();
  const products: string[] = [];
  const services: string[] = [];
  if (product) {
    if (/service|consult|care|support|session|appointment/i.test(product)) services.push(product);
    else products.push(product);
  }

  let confidence = match.industry === "general" ? 0.45 : 0.72;
  if (signals.website) confidence += 0.08;
  if (signals.industryHint) confidence += 0.1;
  if (product) confidence += 0.05;

  return {
    businessType: match.type,
    industry: match.industry,
    products,
    services,
    audience: signals.audienceHint?.trim() || match.audience,
    tone: signals.toneHint?.trim() || match.tone,
    objectives: match.objectives,
    confidence: Math.min(0.95, Math.round(confidence * 100) / 100),
    reasons,
  };
}

export function recommendForBusiness(signals: BusinessSignals) {
  const profile = analyzeBusiness(signals);
  const templateIds = recommendedTemplatesForBusiness(profile.businessType);
  const primaryTemplateId = templateIds[0] || "social-media-ad";
  const avatarPick = directReeloAvatar({
    videoType: "social_short",
    industry: profile.industry,
    tone: profile.tone,
    audience: profile.audience,
  });
  const row = INDUSTRY_RULES.find((r) => r.industry === profile.industry);
  return {
    profile,
    templateIds,
    primaryTemplateId,
    suggestedCta: signals.ctaHint?.trim() || row?.cta || "Learn more today",
    suggestedMusicMood: row?.music || "low-bed",
    suggestedStyle: row?.style || "clean",
    suggestedTone: profile.tone,
    avatar: {
      avatarId: avatarPick.avatarId,
      voiceId: avatarPick.voiceId,
      tier: avatarPick.tier,
      name: avatarPick.name,
      reason: avatarPick.reason,
    },
  };
}
