/**
 * MyReelo mirror of Amber video template catalog + planner.
 * Canonical source: Amber `src/data/video-templates/reelo-templates.json`
 */
import catalog from "@/data/reelo-templates.json";
import { DEFAULT_REELO_AVATAR_ID, DEFAULT_REELO_VOICE_ID } from "@/lib/reelo-avatar-eligibility";

export type TemplateSceneBlueprint = {
  id: string;
  startSec: number;
  endSec: number;
  role: string;
};

export type ReeloVideoTemplate = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  industries: string[];
  goals: string[];
  platforms: string[];
  styles: string[];
  lengthsSec: number[];
  defaultAspect: "9:16" | "16:9" | "1:1";
  allowedAspects: Array<"9:16" | "16:9" | "1:1">;
  videoType: string;
  defaultEngine: string;
  studioHandoff: "ai-avatar-studio" | "website-commercial" | "product-commercial";
  avatarPreference: string;
  hookPattern: string;
  ctaPattern: string;
  captionStyle: string;
  musicMood: string;
  requiresProductProof: boolean;
  previewKind: "annie-rank1" | "storyboard";
  previewAsset?: string | null;
  sceneBlueprint: TemplateSceneBlueprint[];
};

type Catalog = {
  version: number;
  defaultAvatarId: string;
  defaultVoiceId: string;
  costTargetUsd: number;
  hardCostCeilingUsd: number;
  templates: ReeloVideoTemplate[];
};

const data = catalog as Catalog;

export type BusinessBrief = {
  businessName: string;
  productOrService: string;
  website?: string | null;
  logoUrl?: string | null;
  brandColors?: string[];
  cta: string;
  audience: string;
  language?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  lengthSec?: number;
};

function fill(pattern: string, vars: Record<string, string>): string {
  return pattern.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

export function listTemplates(filters?: {
  industry?: string;
  goal?: string;
  platform?: string;
  style?: string;
  lengthSec?: number;
  q?: string;
}): ReeloVideoTemplate[] {
  let list = [...data.templates];
  const industry = filters?.industry?.toLowerCase().trim();
  const goal = filters?.goal?.toLowerCase().trim();
  const platform = filters?.platform?.toLowerCase().trim();
  const style = filters?.style?.toLowerCase().trim();
  const q = filters?.q?.toLowerCase().trim();
  if (industry) list = list.filter((t) => t.industries.some((i) => i.toLowerCase() === industry));
  if (goal) list = list.filter((t) => t.goals.some((g) => g.toLowerCase() === goal));
  if (platform) list = list.filter((t) => t.platforms.some((p) => p.toLowerCase() === platform));
  if (style) list = list.filter((t) => t.styles.some((s) => s.toLowerCase() === style));
  if (filters?.lengthSec) {
    const len = filters.lengthSec;
    list = list.filter((t) => t.lengthsSec.includes(len) || t.lengthsSec.some((l) => Math.abs(l - len) <= 5));
  }
  if (q) {
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.id.includes(q) ||
        t.industries.some((i) => i.includes(q)),
    );
  }
  return list;
}

export function getTemplate(id: string): ReeloVideoTemplate | null {
  return data.templates.find((t) => t.id === id) || null;
}

export function generateTemplateScript(template: ReeloVideoTemplate, brief: BusinessBrief): string {
  const business = brief.businessName.trim() || "our brand";
  const product = brief.productOrService.trim() || "this offer";
  const cta = brief.cta.trim() || "Learn more today";
  const audience = brief.audience.trim() || "customers";
  const vars = { business, product, cta, audience };
  const hook = fill(template.hookPattern, vars);
  const endCta = fill(template.ctaPattern, vars);

  const map: Record<string, string> = {
    "product-demo": `${hook} See ${product} open, run, and finish a real result for ${audience}. No fluff — just the product working. ${endCta}.`,
    "app-demo": `${hook} See ${product} open, run, and finish a real result for ${audience}. No fluff — just the product working. ${endCta}.`,
    "cinematic-commercial": `${hook} ${business} built ${product} for people who want a better outcome — not another tutorial. Feel the shift. Then take the next step. ${endCta}.`,
    storytelling: `${hook} ${business} built ${product} for people who want a better outcome — not another tutorial. Feel the shift. Then take the next step. ${endCta}.`,
    "social-media-ad": `${hook} ${product} from ${business} is built for ${audience}. Clear offer. Clear next step. ${endCta}.`,
    "promotional-sale": `${hook} ${product} from ${business} is built for ${audience}. Clear offer. Clear next step. ${endCta}.`,
    "talking-avatar": `${hook} ${business} helps ${audience} with ${product}. Here’s what matters, in plain language. ${endCta}.`,
    "brand-introduction": `${hook} ${business} helps ${audience} with ${product}. Here’s what matters, in plain language. ${endCta}.`,
    "product-showcase": `${hook} Look closer at ${product} from ${business}. Designed for ${audience} who want quality they can see. ${endCta}.`,
    ecommerce: `${hook} Look closer at ${product} from ${business}. Designed for ${audience} who want quality they can see. ${endCta}.`,
    "before-after": `Before ${product}, the problem slowed ${audience} down. After ${product} from ${business}, the result is clear. ${endCta}.`,
    testimonial: `${hook} ${audience} needed a real fix. ${product} from ${business} delivered the outcome they wanted. ${endCta}.`,
    explainer: `${hook} Step one: start. Step two: let ${product} do the work. Step three: get the finished result. ${endCta}.`,
    "website-promo": `${hook} ${business} turns visitors into customers with ${product}. See the site story, then act. ${endCta}.`,
    "real-estate": `${hook} ${product} from ${business} — light, space, and location that fit ${audience}. Book a showing. ${endCta}.`,
    restaurant: `${hook} ${product} at ${business} is made for ${audience} who care about taste and atmosphere. Come hungry. ${endCta}.`,
    medical: `${hook} ${business} offers ${product} with clear guidance for ${audience}. Care without confusion. ${endCta}.`,
    automotive: `${hook} ${product} from ${business} — confidence on the road for ${audience}. Inquire today. ${endCta}.`,
    "local-business": `${hook} ${business} serves ${audience} with ${product}. Nearby, reliable, ready when you are. ${endCta}.`,
    "corporate-presentation": `${hook} ${business}: how ${product} moves the needle for ${audience}. Three clear points. One next step. ${endCta}.`,
  };
  return map[template.id] || `${hook} ${business} — ${product} for ${audience}. ${endCta}.`;
}

export function buildTemplatePlan(templateId: string, brief: BusinessBrief) {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`TEMPLATE_NOT_FOUND: ${templateId}`);

  const business = brief.businessName.trim();
  const product = brief.productOrService.trim();
  const cta = brief.cta.trim();
  const audience = brief.audience.trim();
  if (!business || !product || !cta || !audience) {
    throw new Error("BRIEF_INCOMPLETE: businessName, productOrService, cta, and audience are required");
  }

  const length =
    brief.lengthSec && template.lengthsSec.includes(brief.lengthSec)
      ? brief.lengthSec
      : template.lengthsSec[0]!;
  const aspect =
    brief.aspectRatio && template.allowedAspects.includes(brief.aspectRatio)
      ? brief.aspectRatio
      : template.defaultAspect;

  const script = generateTemplateScript(template, brief);
  const lastEnd = template.sceneBlueprint[template.sceneBlueprint.length - 1]?.endSec || length;
  const scale = length / lastEnd;
  const scenes = template.sceneBlueprint.map((s) => ({
    id: s.id,
    startSec: Math.round(s.startSec * scale * 10) / 10,
    endSec: Math.round(s.endSec * scale * 10) / 10,
    role: s.role,
    description: `${s.role}: ${product}`,
  }));

  const avatarId = template.avatarPreference || data.defaultAvatarId || DEFAULT_REELO_AVATAR_ID;
  const voiceId = data.defaultVoiceId || DEFAULT_REELO_VOICE_ID;

  const handoffPath =
    template.studioHandoff === "website-commercial"
      ? "/create/website-commercial"
      : template.studioHandoff === "product-commercial"
        ? "/create/product-commercial"
        : "/create/ai-avatar-studio";

  const params = new URLSearchParams({
    template: template.id,
    script,
    avatar: avatarId,
    business,
    product,
  });
  if (brief.website) params.set("url", brief.website);

  return {
    template,
    script,
    scenes,
    videoType: template.videoType,
    engine: template.defaultEngine,
    avatarId,
    voiceId,
    aspectRatio: aspect,
    durationSec: length,
    estimatedCostUsd: data.costTargetUsd,
    hardCostCeilingUsd: data.hardCostCeilingUsd,
    studioHandoff: template.studioHandoff,
    handoffUrl: `${handoffPath}?${params.toString()}`,
    musicMood: template.musicMood,
    captionStyle: template.captionStyle,
    brandColors: brief.brandColors || [],
    logoUrl: brief.logoUrl || null,
    website: brief.website || null,
    publishAuthorized: false as const,
    note: "VQOS required before delivery. Provider completed ≠ publishAuthorized.",
  };
}

export function recommendedTemplatesForBusiness(businessType: string): string[] {
  const t = businessType.toLowerCase();
  if (/real.?estate|realtor/.test(t)) return ["real-estate", "social-media-ad", "testimonial"];
  if (/restaurant|food|cafe/.test(t)) return ["restaurant", "promotional-sale", "social-media-ad"];
  if (/medical|dental|clinic|health/.test(t)) return ["medical", "testimonial", "explainer"];
  if (/auto|car|dealership/.test(t)) return ["automotive", "promotional-sale", "social-media-ad"];
  if (/e-?commerce|shop|store|retail/.test(t)) return ["ecommerce", "product-showcase", "promotional-sale"];
  if (/saas|software|app/.test(t)) return ["product-demo", "app-demo", "explainer", "website-promo"];
  if (/local|plumber|salon|gym/.test(t)) return ["local-business", "promotional-sale", "testimonial"];
  if (/corporate|b2b|enterprise/.test(t)) return ["corporate-presentation", "brand-introduction", "explainer"];
  return ["social-media-ad", "talking-avatar", "website-promo", "product-demo"];
}

export function templateFilterOptions() {
  const industries = new Set<string>();
  const goals = new Set<string>();
  const platforms = new Set<string>();
  const styles = new Set<string>();
  for (const t of data.templates) {
    t.industries.forEach((x) => industries.add(x));
    t.goals.forEach((x) => goals.add(x));
    t.platforms.forEach((x) => platforms.add(x));
    t.styles.forEach((x) => styles.add(x));
  }
  return {
    industries: [...industries].sort(),
    goals: [...goals].sort(),
    platforms: [...platforms].sort(),
    styles: [...styles].sort(),
    lengths: [15, 20, 30],
    languages: ["en"],
  };
}
