/**
 * GLOBAL TOKEN PRICING — single source of truth for the entire Reelo platform.
 *
 * Change TOKEN_USD_VALUE here and every plan, pack, feature label, charge,
 * refund, and USD display that imports this module stays in sync.
 *
 *   1 Token = TOKEN_USD_VALUE USD
 *
 * Standard AI video: 1 token per 30 seconds (simple tier buckets).
 * Website Commercial + Product Commercial use separate premium ladders.
 */

/** Face value of one Reelo token in US dollars. */
export const TOKEN_USD_VALUE = 10;

export type PriceTier = { maxSeconds: number; tokens: number; label: string };

/**
 * Standard AI video — Talking Photo, Dancing Photo, AI Avatar Studio,
 * and any future standard video feature.
 * Rule: 1 token for every 30 seconds of generated video.
 */
export const STANDARD_VIDEO_TIERS: readonly PriceTier[] = [
  { maxSeconds: 30, tokens: 1, label: "Up to 30 seconds" },
  { maxSeconds: 60, tokens: 2, label: "Up to 60 seconds" },
  { maxSeconds: 120, tokens: 4, label: "Up to 2 minutes" },
  { maxSeconds: 180, tokens: 6, label: "Up to 3 minutes" },
  { maxSeconds: 300, tokens: 10, label: "Up to 5 minutes" },
  { maxSeconds: 600, tokens: 20, label: "Up to 10 minutes" },
  { maxSeconds: 900, tokens: 30, label: "Up to 15 minutes" },
] as const;

/**
 * Website Commercial — premium (analysis, research, copy, script, spokesperson).
 */
export const WEBSITE_COMMERCIAL_TIERS: readonly PriceTier[] = [
  { maxSeconds: 30, tokens: 6, label: "Up to 30 seconds" },
  { maxSeconds: 60, tokens: 12, label: "Up to 60 seconds" },
  { maxSeconds: 120, tokens: 24, label: "Up to 2 minutes" },
  { maxSeconds: 180, tokens: 36, label: "Up to 3 minutes" },
  { maxSeconds: 300, tokens: 60, label: "Up to 5 minutes" },
] as const;

/**
 * Product Commercial — premium (product photo → cinematic ad).
 */
export const PRODUCT_COMMERCIAL_TIERS: readonly PriceTier[] = [
  { maxSeconds: 30, tokens: 2, label: "Up to 30 seconds" },
  { maxSeconds: 60, tokens: 4, label: "Up to 60 seconds" },
  { maxSeconds: 120, tokens: 8, label: "Up to 2 minutes" },
  { maxSeconds: 180, tokens: 12, label: "Up to 3 minutes" },
  { maxSeconds: 300, tokens: 20, label: "Up to 5 minutes" },
] as const;

/** Round token amounts (supports whole tokens; keeps 2 d.p. for legacy ledger). */
export function roundTokens(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function usdFromTokens(tokens: number): number {
  return roundTokens(tokens) * TOKEN_USD_VALUE;
}

export function tokensFromUsd(usd: number): number {
  return roundTokens(usd / TOKEN_USD_VALUE);
}

export function formatTokens(n: number): string {
  const t = roundTokens(n);
  if (Number.isInteger(t)) return String(t);
  return t.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatUsdFromTokens(tokens: number): string {
  const usd = usdFromTokens(tokens);
  if (usd >= 1000) {
    return `$${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return usd % 1 === 0 ? `$${usd.toFixed(0)}` : `$${usd.toFixed(2)}`;
}

function tokensForTier(tiers: readonly PriceTier[], seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return tiers[0]!.tokens;
  for (const tier of tiers) {
    if (seconds <= tier.maxSeconds) return tier.tokens;
  }
  return tiers[tiers.length - 1]!.tokens;
}

function nearestTierSeconds(tiers: readonly PriceTier[], seconds: number): number {
  let best = tiers[0]!.maxSeconds;
  for (const t of tiers) {
    if (Math.abs(t.maxSeconds - seconds) < Math.abs(best - seconds)) best = t.maxSeconds;
  }
  return best;
}

/** Tokens for a standard AI video of the given length (1 token / 30s). */
export function standardVideoTokens(seconds: number): number {
  return tokensForTier(STANDARD_VIDEO_TIERS, seconds);
}

/** Tokens for a Website Commercial of the given length (premium). */
export function websiteCommercialTokens(seconds: number): number {
  return tokensForTier(WEBSITE_COMMERCIAL_TIERS, seconds);
}

/** Tokens for a Product Commercial of the given length (premium). */
export function productCommercialTokens(seconds: number): number {
  return tokensForTier(PRODUCT_COMMERCIAL_TIERS, seconds);
}

export function clampToStandardTier(seconds: number): number {
  return nearestTierSeconds(STANDARD_VIDEO_TIERS, seconds);
}

export function clampToWebsiteTiers(seconds: number): number {
  return nearestTierSeconds(WEBSITE_COMMERCIAL_TIERS, seconds);
}

export function clampToProductTiers(seconds: number): number {
  return nearestTierSeconds(PRODUCT_COMMERCIAL_TIERS, seconds);
}

/** Lengths offered in duration pickers for standard video. */
export const STANDARD_VIDEO_PICKER_SECONDS = STANDARD_VIDEO_TIERS.map((t) => t.maxSeconds);

/** Lengths offered for Website Commercial. */
export const WEBSITE_COMMERCIAL_LENGTHS_SEC = WEBSITE_COMMERCIAL_TIERS.map((t) => t.maxSeconds);

/** Lengths offered for Product Commercial. */
export const PRODUCT_COMMERCIAL_LENGTHS_SEC = PRODUCT_COMMERCIAL_TIERS.map((t) => t.maxSeconds);

/**
 * Veo provider only renders 4 / 6 / 8 seconds — all bill as the "up to 30s" tier.
 * Picker still lets users choose clip length within that tier.
 */
export const VEO_RENDER_SECONDS = [4, 6, 8] as const;

/** Flat non-duration features (only defined here — never hard-coded in UI). */
export const FLAT_TOKEN_COST = {
  "bedtime-storybook": 1, // 10-page personalized bedtime story
  "shorts-20": 2,
  "story-memory-generator": 2,
  "custom-avatar-creator": 2,
  transcribe: 0,
  captions: 0,
  analyze: 0,
} as const;

/**
 * Subscription plans — discounted vs face value.
 * Token store (PACK_TOKEN_AMOUNTS) always sells at TOKEN_USD_VALUE per token.
 * Feature charges always deduct the same tokens regardless of source.
 */
export type PlanId =
  | "FREE"
  | "CORE"
  | "PRO"
  | "BUSINESS"
  | "BUSINESS PLUS"
  | "BC PRO";

export type PlanDefinition = {
  id: PlanId;
  /** Display name on pricing cards. */
  label: string;
  /** Monthly USD charged (subscribers get more token value than face). */
  monthlyPrice: number;
  /** Tokens credited each month. */
  tokens: number;
};

export const PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  { id: "FREE", label: "Free", monthlyPrice: 0, tokens: 4 },
  { id: "CORE", label: "Core", monthlyPrice: 49, tokens: 8 },
  { id: "PRO", label: "Pro", monthlyPrice: 99, tokens: 20 },
  { id: "BUSINESS", label: "Business", monthlyPrice: 199, tokens: 50 },
  { id: "BUSINESS PLUS", label: "Business Plus", monthlyPrice: 399, tokens: 120 },
  { id: "BC PRO", label: "BC Pro", monthlyPrice: 999, tokens: 400 },
] as const;

/** @deprecated Use PLAN_DEFINITIONS — kept for callers expecting allotment map. */
export const PLAN_TOKEN_ALLOTMENTS = Object.fromEntries(
  PLAN_DEFINITIONS.map((p) => [p.id, p.tokens]),
) as Record<PlanId, number>;

/** Token store packages — always face value (tokens × TOKEN_USD_VALUE). */
export const PACK_TOKEN_AMOUNTS = [1, 5, 10, 25, 50, 100] as const;

/** New-account welcome credit. */
export const WELCOME_TOKENS = PLAN_DEFINITIONS.find((p) => p.id === "FREE")!.tokens;

/** Face value of a plan's monthly tokens (for "you get $X value" labels). */
export function planFaceValueUsd(tokens: number): number {
  return usdFromTokens(tokens);
}

/** How much cheaper a subscription is vs buying the same tokens in the store. */
export function planSavingsVsStore(monthlyPrice: number, tokens: number): number {
  const face = planFaceValueUsd(tokens);
  if (face <= 0 || monthlyPrice <= 0) return 0;
  return Math.max(0, 1 - monthlyPrice / face);
}

/** @deprecated Prefer STANDARD_VIDEO_TIERS — kept for older imports. */
export const STANDARD_VIDEO_SECONDS_PER_TOKEN = 30;
