import { TOKEN_COST, costOf } from "@/lib/token-costs";
import { PLAN_SPECS, PACK_SPECS } from "@/lib/plans";
import { TOKEN_USD_VALUE, standardVideoTokens, websiteCommercialTokens } from "@/lib/token-pricing";

// ---------------------------------------------------------------------------
// Unit economics vs the global face value (1 token = TOKEN_USD_VALUE).
//
// Provider rates — verified Jul 2026:
//   Google Veo 3.1 Standard  $0.40/sec (app default model)
//   Google Veo 3.1 Fast 720p $0.10/sec
//   HeyGen Avatar III Studio $0.0167/sec
//   Gemini 2.5 Flash text    $0.30/M in, $2.50/M out
// ---------------------------------------------------------------------------

export const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 8);

/**
 * The storybook movie renders one scene per page.
 *
 * Fixed here rather than read from `VIDEO_SECONDS`: that variable steers the
 * talking and dancing tools, and a film whose length changed with an unrelated
 * setting would also silently change what it costs to make — on a product
 * priced per unit, that is the number that must not move on its own.
 */
export const STORYBOOK_SCENES = 12;
export const STORYBOOK_SCENE_SECONDS = 6;

export const PROVIDER = {
  veoStandardPerSecond: 0.4,
  veoFastPerSecond720: 0.1,
  veoFastPerSecond1080: 0.12,
  geminiImage: 0.039,
  geminiTextPerMInput: 0.3,
  geminiTextPerMOutput: 2.5,
  heygenPerSecond: 0.0167,
} as const;

function textCall(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PROVIDER.geminiTextPerMInput + (outputTokens / 1_000_000) * PROVIDER.geminiTextPerMOutput;
}

export type CostLine = { action: string; label: string; cost: number; detail: string };

/** Provider COGS for a typical generation (not retail). */
export const COST_LINES: CostLine[] = [
  {
    action: "talking-photo",
    label: "Talking Photo",
    cost: PROVIDER.veoStandardPerSecond * VIDEO_SECONDS,
    detail: `Veo 3.1 Standard, ${VIDEO_SECONDS}s`,
  },
  {
    action: "dancing-photo",
    label: "Dancing Photo",
    cost: PROVIDER.veoStandardPerSecond * VIDEO_SECONDS,
    detail: `Veo 3.1 Standard, ${VIDEO_SECONDS}s`,
  },
  {
    action: "ai-avatar-studio",
    label: "AI Avatar Studio",
    cost: PROVIDER.heygenPerSecond * 20,
    detail: "HeyGen Avatar III, ~20s",
  },
  {
    action: "website-commercial",
    label: "Website Commercial",
    cost: PROVIDER.heygenPerSecond * 30 + textCall(8000, 1500),
    detail: "HeyGen 30s + site analysis",
  },
  {
    action: "product-commercial",
    label: "Product Commercial",
    cost: PROVIDER.veoStandardPerSecond * VIDEO_SECONDS + textCall(3000, 800),
    detail: `Veo Standard ${VIDEO_SECONDS}s + concept`,
  },
  {
    action: "shorts-20",
    label: "Shorts Generator",
    cost: textCall(8000, 12000),
    detail: "reads a site, writes scripts",
  },
  {
    action: "story-memory-generator",
    label: "Story & Memory Generator",
    cost: textCall(12 * 300 + 1500, 1500),
    detail: "reads photos, writes narration",
  },
  {
    action: "custom-avatar-creator",
    label: "Custom Avatar Creator",
    cost: PROVIDER.geminiImage,
    detail: "1 image",
  },
  {
    action: "bedtime-storybook",
    label: "Bedtime Storybook",
    cost: PROVIDER.geminiImage * 6 + textCall(1200, 2500),
    detail: "6–10 illustrations + story",
  },
  {
    /*
     * The storybook movie renders on Veo Fast 720p, not the app default.
     *
     * It supplies its own narration and score, so it is buying pictures rather
     * than Veo's audio — which is the reason the app default is the full model.
     * Across twelve scenes the tier decides between $7.20 and $28.80 a film,
     * and at 4 tokens of face value the Standard tier would not clear its own
     * cost once the Director AI regenerates a rejected cut.
     */
    action: "storybook-movie",
    label: "Storybook Movie",
    cost:
      PROVIDER.veoFastPerSecond720 * STORYBOOK_SCENE_SECONDS * STORYBOOK_SCENES + textCall(4000, 3000),
    detail: `Veo 3.1 Fast 720p, ${STORYBOOK_SCENES}x${STORYBOOK_SCENE_SECONDS}s + screenplay`,
  },
  {
    /*
     * The bundle adds the book's layout to a movie that already exists. The
     * story, character bible and illustrations are reused rather than
     * regenerated, which is the whole reason it is priced at movie-plus-one.
     */
    action: "storybook-bundle",
    label: "Storybook Book + Movie",
    cost:
      PROVIDER.veoFastPerSecond720 * STORYBOOK_SCENE_SECONDS * STORYBOOK_SCENES +
      textCall(4000, 3000) +
      PROVIDER.geminiImage * STORYBOOK_SCENES +
      textCall(1200, 2500),
    detail: "One story, both deliveries",
  },
  {
    action: "analyze",
    label: "Website scan",
    cost: textCall(8000, 1500),
    detail: "text only",
  },
];

export type Tier = { name: string; kind: "plan" | "pack"; price: number; tokens: number };

function titled(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export const TIERS: Tier[] = [
  ...PLAN_SPECS.filter((p) => p.price > 0).map(
    (p): Tier => ({ name: titled(p.name), kind: "plan", price: p.price, tokens: p.tokens }),
  ),
  ...PACK_SPECS.map(
    (p): Tier => ({ name: `${p.tokens.toLocaleString()} tokens`, kind: "pack", price: p.price, tokens: p.tokens }),
  ),
];

/** Face value is the global standard; plans/packs sell at that rate. */
export function revenuePerToken(_tier?: Tier): number {
  return TOKEN_USD_VALUE;
}

export function marginFor(line: CostLine, tier: Tier): { revenue: number; profit: number; margin: number } {
  const tokens = TOKEN_COST[line.action] ?? costOf(line.action);
  const revenue = revenuePerToken(tier) * tokens;
  const profit = revenue - line.cost;
  return { revenue, profit, margin: revenue > 0 ? profit / revenue : -Infinity };
}

export function tokensNeeded(line: CostLine, _tier: Tier, targetMargin = 0.7): number {
  const perToken = TOKEN_USD_VALUE;
  if (perToken <= 0) return Infinity;
  const requiredRevenue = line.cost / (1 - targetMargin);
  return Math.ceil((requiredRevenue / perToken) * 100) / 100;
}

export function worstTier(line: CostLine): { tier: Tier; margin: number; profit: number } {
  let worst = { tier: TIERS[0], margin: Infinity, profit: Infinity };
  for (const tier of TIERS) {
    const m = marginFor(line, tier);
    if (m.margin < worst.margin) worst = { tier, margin: m.margin, profit: m.profit };
  }
  return worst;
}

/** Quick retail check helpers used by admin/docs. */
export function retailForStandardVideo(seconds: number): { tokens: number; usd: number } {
  const tokens = standardVideoTokens(seconds);
  return { tokens, usd: tokens * TOKEN_USD_VALUE };
}

export function retailForWebsiteCommercial(seconds: number): { tokens: number; usd: number } {
  const tokens = websiteCommercialTokens(seconds);
  return { tokens, usd: tokens * TOKEN_USD_VALUE };
}
