/**
 * MyReelo mirror of Amber video template catalog + planner.
 * Canonical source: Amber `src/data/video-templates/reelo-templates.json`
 */
import catalog from "@/data/reelo-templates.json";
import { DEFAULT_REELO_AVATAR_ID, DEFAULT_REELO_VOICE_ID } from "@/lib/reelo-avatar-eligibility";
import { directReeloAvatar } from "@/lib/avatar-director";
import { directVideo } from "@/lib/video-director";
import { analyzeBusiness } from "@/lib/business-detect";
import { recommendedTemplatesForBusiness as biRecommended } from "@/lib/business-detect";

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
  industry?: string;
  tone?: string;
  avatarIdOverride?: string | null;
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
  const hook = fill(template.hookPattern, vars).replace(/\.*$/, "");
  const endCta = fill(template.ctaPattern, vars).replace(/\.*$/, "");

  const beat = (lines: string[]) =>
    lines
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  switch (template.id) {
    case "product-demo":
    case "app-demo":
      return beat([
        `${hook}.`,
        `Watch ${product} open on screen — real interface, real clicks, real finish.`,
        `No stock montage. No fake UI.`,
        `In under thirty seconds, ${audience} see the result they came for.`,
        `${endCta}.`,
      ]);
    case "cinematic-commercial":
    case "storytelling":
      return beat([
        `${hook}.`,
        `The old way wasted time. ${business} built ${product} for a cleaner finish.`,
        `Desire first. Proof second. Brand last.`,
        `Then the move: ${endCta}.`,
      ]);
    case "social-media-ad":
      return beat([
        `${hook}.`,
        `${product} from ${business} is built for ${audience} who want speed without looking cheap.`,
        `One clear payoff. One clear next step.`,
        `${endCta} — now.`,
      ]);
    case "promotional-sale":
      return beat([
        `${hook}.`,
        `Limited window. Clear offer. No fine-print fog.`,
        `${product} from ${business} — for ${audience} ready to act.`,
        `${endCta}.`,
      ]);
    case "talking-avatar":
    case "brand-introduction":
      return beat([
        `${hook}.`,
        `${business} helps ${audience} get ${product} without the usual chaos.`,
        `Here’s what matters, in plain language — then what to do next.`,
        `${endCta}.`,
      ]);
    case "product-showcase":
    case "ecommerce":
      return beat([
        `${hook}.`,
        `Hold on the hero: ${product} from ${business}.`,
        `Texture, finish, and the moment it becomes undeniable for ${audience}.`,
        `${endCta}.`,
      ]);
    case "before-after":
      return beat([
        `Before ${product}, ${audience} were stuck in the slow version.`,
        `After ${product} from ${business}, the result is obvious on screen.`,
        `Same problem. New ending.`,
        `${endCta}.`,
      ]);
    case "testimonial":
      return beat([
        `${hook}.`,
        `${audience} didn’t need another pitch — they needed a real outcome.`,
        `${product} from ${business} delivered it.`,
        `${endCta}.`,
      ]);
    case "explainer":
      return beat([
        `${hook}.`,
        `Step one: start. Step two: let ${product} work. Step three: ship the finished result.`,
        `Simple enough for ${audience}. Strong enough for ${business}.`,
        `${endCta}.`,
      ]);
    case "website-promo":
      return beat([
        `${hook}.`,
        `${business} turns visitors into customers with ${product} — story, proof, then action.`,
        `Scroll stops here.`,
        `${endCta}.`,
      ]);
    case "real-estate":
      return beat([
        `${hook}.`,
        `${product} from ${business}: light, space, and a location that fits ${audience}.`,
        `Feel the walkthrough energy — then book.`,
        `${endCta}.`,
      ]);
    case "restaurant":
      return beat([
        `${hook}.`,
        `${product} at ${business} is plated for ${audience} who care about taste and atmosphere.`,
        `Come hungry. Leave decided.`,
        `${endCta}.`,
      ]);
    case "medical":
      return beat([
        `${hook}.`,
        `${business} offers ${product} with clear guidance for ${audience}.`,
        `Calm. Credible. Human.`,
        `${endCta}.`,
      ]);
    case "automotive":
      return beat([
        `${hook}.`,
        `${product} from ${business} — confidence on the road for ${audience}.`,
        `Motion. Presence. Next step.`,
        `${endCta}.`,
      ]);
    case "local-business":
      return beat([
        `${hook}.`,
        `${business} serves ${audience} with ${product} — nearby, reliable, ready when you are.`,
        `${endCta}.`,
      ]);
    case "corporate-presentation":
      return beat([
        `${hook}.`,
        `${business}: how ${product} moves the needle for ${audience}.`,
        `Three clear points. One decisive next step.`,
        `${endCta}.`,
      ]);
    default:
      return beat([`${hook}.`, `${business} — ${product} for ${audience}.`, `${endCta}.`]);
  }
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

  const lengthRaw =
    brief.lengthSec && template.lengthsSec.includes(brief.lengthSec)
      ? brief.lengthSec
      : template.lengthsSec[0]!;
  // Clamp to VQOS rubric-friendly ranges (product_demo ~28–34s, social ~12–30s)
  const length =
    template.videoType === "product_demo"
      ? Math.max(28, Math.min(34, lengthRaw < 28 ? 30 : lengthRaw))
      : template.videoType === "tv_commercial"
        ? Math.max(25, Math.min(45, lengthRaw < 25 ? 30 : lengthRaw))
        : Math.max(12, Math.min(30, lengthRaw));
  const aspect =
    brief.aspectRatio && template.allowedAspects.includes(brief.aspectRatio)
      ? brief.aspectRatio
      : template.defaultAspect === "16:9" && template.videoType === "social_short"
        ? "9:16"
        : template.defaultAspect;

  const script = generateTemplateScript(template, brief);
  const lastEnd = template.sceneBlueprint[template.sceneBlueprint.length - 1]?.endSec || length;
  const scale = length / lastEnd;

  const businessProfile = analyzeBusiness({
    businessName: business,
    productOrService: product,
    website: brief.website,
    industryHint: brief.industry || template.industries[0],
    audienceHint: audience,
    ctaHint: cta,
    toneHint: brief.tone,
  });

  const direction = directVideo({
    template,
    durationSec: length,
    product,
    audience,
    tone: brief.tone || businessProfile.tone || template.styles[0],
    industry: businessProfile.industry || brief.industry,
    brandColors: brief.brandColors,
  });

  const scenes = direction.scenes.map((s) => ({
    id: s.id,
    startSec: s.startSec,
    endSec: s.endSec,
    role: s.role,
    description: s.description,
    camera: s.camera,
  }));

  // Keep scale fallback roles if director somehow empty
  if (!scenes.length) {
    template.sceneBlueprint.forEach((s) => {
      scenes.push({
        id: s.id,
        startSec: Math.round(s.startSec * scale * 10) / 10,
        endSec: Math.round(s.endSec * scale * 10) / 10,
        role: s.role,
        description: `${s.role}: ${product}`,
        camera: "",
      });
    });
  }

  const directed = directReeloAvatar({
    videoType: template.videoType,
    industry: businessProfile.industry || brief.industry || template.industries[0],
    tone: brief.tone || businessProfile.tone || template.styles[0],
    audience,
    overrideAvatarId: brief.avatarIdOverride,
  });
  const avatarId = directed.avatarId || template.avatarPreference || data.defaultAvatarId || DEFAULT_REELO_AVATAR_ID;
  const voiceId = directed.voiceId || data.defaultVoiceId || DEFAULT_REELO_VOICE_ID;
  const estimatedCostUsd = Math.min(data.costTargetUsd ?? 0.35, 0.4);

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
    pacing: direction.pacing,
    music: direction.music.mood,
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
    avatarTier: directed.tier,
    avatarName: directed.name,
    avatarReason: directed.reason,
    aspectRatio: aspect,
    durationSec: length,
    estimatedCostUsd,
    hardCostCeilingUsd: Math.min(data.hardCostCeilingUsd ?? 0.5, 0.5),
    studioHandoff: template.studioHandoff,
    handoffUrl: `${handoffPath}?${params.toString()}`,
    musicMood: direction.music.mood,
    captionStyle: direction.captions.style,
    direction,
    businessProfile,
    brandColors: brief.brandColors || [],
    logoUrl: brief.logoUrl || null,
    website: brief.website || null,
    publishAuthorized: false as const,
    note: `Directed · ${direction.pacing} · est. $${estimatedCostUsd.toFixed(2)} · ${directed.reason}. VQOS required before delivery.`,
  };
}

export function recommendedTemplatesForBusiness(businessType: string): string[] {
  return biRecommended(businessType);
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
