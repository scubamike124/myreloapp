/**
 * What each generation costs in tokens.
 *
 * Browser-safe. All amounts come from token-pricing.ts — never hard-code
 * feature prices here beyond wiring actions to that config.
 */

import {
  FLAT_TOKEN_COST,
  PRODUCT_COMMERCIAL_TIERS,
  STANDARD_VIDEO_TIERS,
  TOKEN_USD_VALUE,
  VEO_RENDER_SECONDS,
  WEBSITE_COMMERCIAL_TIERS,
  formatTokens,
  formatUsdFromTokens,
  productCommercialTokens,
  roundTokens,
  standardVideoTokens,
  usdFromTokens,
  websiteCommercialTokens,
} from "@/lib/token-pricing";

export {
  TOKEN_USD_VALUE,
  formatTokens,
  formatUsdFromTokens,
  usdFromTokens,
  standardVideoTokens,
  websiteCommercialTokens,
  productCommercialTokens,
  roundTokens,
} from "@/lib/token-pricing";

/** Floor / "From …" cost when no duration is chosen yet. */
export const TOKEN_COST: Record<string, number> = {
  "talking-photo": standardVideoTokens(30),
  "dancing-photo": standardVideoTokens(30),
  "product-commercial": productCommercialTokens(30),
  "ai-avatar-studio": standardVideoTokens(30),
  "website-commercial": websiteCommercialTokens(30),
  "bedtime-storybook": FLAT_TOKEN_COST["bedtime-storybook"],
  "shorts-20": FLAT_TOKEN_COST["shorts-20"],
  "story-memory-generator": FLAT_TOKEN_COST["story-memory-generator"],
  "custom-avatar-creator": FLAT_TOKEN_COST["custom-avatar-creator"],
  transcribe: FLAT_TOKEN_COST.transcribe,
  captions: FLAT_TOKEN_COST.captions,
  analyze: FLAT_TOKEN_COST.analyze,
};

export type DurationOption = {
  seconds: number;
  tokens: number;
  label: string;
  priceNote?: string;
};

function standardOption(maxSeconds: number, tokens: number, label: string, floor: number): DurationOption {
  return {
    seconds: maxSeconds,
    tokens,
    label,
    priceNote: tokens > floor ? "Longer video — higher token price" : undefined,
  };
}

/** Veo: pick render length 4/6/8; all bill as the up-to-30s standard (or product) tier. */
export const VEO_DURATION_OPTIONS: DurationOption[] = VEO_RENDER_SECONDS.map((seconds) => {
  const tokens = standardVideoTokens(seconds);
  return {
    seconds,
    tokens,
    label: `${seconds}-second clip`,
    priceNote: "Billed as up to 30 seconds",
  };
});

/** Product Commercial Veo clips — same 4/6/8 render lengths, product premium floor. */
export const PRODUCT_VEO_DURATION_OPTIONS: DurationOption[] = VEO_RENDER_SECONDS.map((seconds) => {
  const tokens = productCommercialTokens(seconds);
  return {
    seconds,
    tokens,
    label: `${seconds}-second clip`,
    priceNote: "Billed as up to 30 seconds",
  };
});

/** Avatar / standard long-form tiers (HeyGen path). */
export const HEYGEN_DURATION_OPTIONS: DurationOption[] = STANDARD_VIDEO_TIERS.map((t) =>
  standardOption(t.maxSeconds, t.tokens, t.label, STANDARD_VIDEO_TIERS[0]!.tokens),
);

/** Website Commercial premium tiers. */
export const WEBSITE_COMMERCIAL_DURATION_OPTIONS: DurationOption[] = WEBSITE_COMMERCIAL_TIERS.map((t) =>
  standardOption(t.maxSeconds, t.tokens, t.label, WEBSITE_COMMERCIAL_TIERS[0]!.tokens),
);

/** Product Commercial premium tiers (for any non-Veo length UI). */
export const PRODUCT_COMMERCIAL_DURATION_OPTIONS: DurationOption[] = PRODUCT_COMMERCIAL_TIERS.map((t) =>
  standardOption(t.maxSeconds, t.tokens, t.label, PRODUCT_COMMERCIAL_TIERS[0]!.tokens),
);

const VEO_STANDARD_ACTIONS = new Set(["talking-photo", "dancing-photo"]);
const VEO_PRODUCT_ACTIONS = new Set(["product-commercial"]);
const HEYGEN_ACTIONS = new Set(["ai-avatar-studio"]);
const WEBSITE_ACTIONS = new Set(["website-commercial"]);
const STANDARD_VIDEO_ACTIONS = new Set([...VEO_STANDARD_ACTIONS, ...HEYGEN_ACTIONS]);

export function durationOptionsFor(action: string): DurationOption[] | null {
  if (VEO_STANDARD_ACTIONS.has(action)) return VEO_DURATION_OPTIONS;
  if (VEO_PRODUCT_ACTIONS.has(action)) return PRODUCT_VEO_DURATION_OPTIONS;
  if (HEYGEN_ACTIONS.has(action)) return HEYGEN_DURATION_OPTIONS;
  if (WEBSITE_ACTIONS.has(action)) return WEBSITE_COMMERCIAL_DURATION_OPTIONS;
  return null;
}

export function defaultDurationSeconds(action: string): number {
  if (VEO_STANDARD_ACTIONS.has(action) || VEO_PRODUCT_ACTIONS.has(action)) return 8;
  if (HEYGEN_ACTIONS.has(action)) return 30;
  if (WEBSITE_ACTIONS.has(action)) return 30;
  return 0;
}

export function clampDurationSeconds(action: string, seconds: number): number {
  const opts = durationOptionsFor(action);
  if (!opts?.length) return seconds;
  const match = opts.find((o) => o.seconds === seconds);
  return match ? match.seconds : defaultDurationSeconds(action);
}

export function costOf(action: string, opts?: { seconds?: number }): number {
  if (WEBSITE_ACTIONS.has(action)) {
    const seconds =
      opts?.seconds != null ? clampDurationSeconds(action, opts.seconds) : defaultDurationSeconds(action);
    return websiteCommercialTokens(seconds);
  }

  if (VEO_PRODUCT_ACTIONS.has(action)) {
    const seconds =
      opts?.seconds != null ? clampDurationSeconds(action, opts.seconds) : defaultDurationSeconds(action);
    return productCommercialTokens(seconds);
  }

  if (STANDARD_VIDEO_ACTIONS.has(action)) {
    const seconds =
      opts?.seconds != null ? clampDurationSeconds(action, opts.seconds) : defaultDurationSeconds(action);
    return standardVideoTokens(seconds);
  }

  const base = TOKEN_COST[action];
  if (base === undefined) return 1;
  return roundTokens(base);
}

export const TOKEN_UNIT: Record<string, string> = {
  "talking-photo": "video",
  "dancing-photo": "video",
  "ai-avatar-studio": "video",
  "website-commercial": "commercial",
  "product-commercial": "commercial",
  "bedtime-storybook": "book",
  "custom-avatar-creator": "avatar",
  "story-memory-generator": "film",
  "shorts-20": "batch",
  analyze: "scan",
};

function tokenWord(n: number): string {
  return Math.abs(n) === 1 ? "token" : "tokens";
}

export function creditLabel(slug: string, suffix?: string): string {
  const n = TOKEN_COST[slug];
  if (n === undefined) return suffix ? `Pricing to be confirmed · ${suffix}` : "Pricing to be confirmed";

  const unit = TOKEN_UNIT[slug] ?? "generation";
  if (n === 0) {
    const base = `Free per ${unit}`;
    return suffix ? `${base} · ${suffix}` : base;
  }
  const base = `From ${formatTokens(n)} ${tokenWord(n)} (${formatUsdFromTokens(n)}) per ${unit}`;
  return suffix ? `${base} · ${suffix}` : base;
}

export function creditLabelForSeconds(slug: string, seconds: number): string {
  const n = costOf(slug, { seconds });
  if (n <= 0) return `Free`;
  return `${formatTokens(n)} ${tokenWord(n)} · ${formatUsdFromTokens(n)}`;
}
