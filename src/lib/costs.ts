import { TOKEN_COST } from "@/lib/tokens";

// ---------------------------------------------------------------------------
// Unit economics.
//
// What each generation costs Reelo in provider fees, what it earns in token
// revenue, and therefore the margin. Kept in code rather than a spreadsheet so
// it cannot drift from the token costs the product actually charges.
//
// PROVIDER PRICES — verified July 2026:
//   Google (ai.google.dev/gemini-api/docs/pricing)
//     Veo 3.1 Fast      $0.10/sec at 720p, $0.12/sec at 1080p
//     Veo 3.1 standard  $0.40/sec at 720p and 1080p
//     Gemini 2.5 Flash Image  $0.039 per image
//     Gemini 2.5 Flash text   $0.30 per 1M input, $2.50 per 1M output
//   HeyGen (pay-as-you-go since Feb 2026)
//     ~$0.50–$0.99 per credit; roughly $1.00 per minute for Avatar III 1080p.
//     The conservative figure is used here.
//
// Re-check these when a provider changes pricing; they are the only inputs.
// ---------------------------------------------------------------------------

/** Clip length actually requested by /api/generate-avatar. */
export const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 6);

export const PROVIDER = {
  veoFastPerSecond720: 0.1,
  veoFastPerSecond1080: 0.12,
  veoStandardPerSecond: 0.4,
  geminiImage: 0.039,
  geminiTextPerMInput: 0.3,
  geminiTextPerMOutput: 2.5,
  heygenPerMinute: 1.0,
} as const;

/** A rough text call: a prompt in, a page or two out. */
function textCall(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PROVIDER.geminiTextPerMInput + (outputTokens / 1_000_000) * PROVIDER.geminiTextPerMOutput;
}

export type CostLine = { action: string; label: string; cost: number; detail: string };

/**
 * Cost per generation, using what the code actually requests: Veo 3.1 Fast at
 * 8 seconds, HeyGen capped at 30 seconds, storybooks at 6 pages.
 */
export const COST_LINES: CostLine[] = [
  {
    action: "talking-photo",
    label: "Talking Photo",
    cost: PROVIDER.veoFastPerSecond720 * VIDEO_SECONDS,
    detail: `Veo 3.1 Fast, ${VIDEO_SECONDS}s at 720p`,
  },
  {
    action: "dancing-photo",
    label: "Dancing Photo",
    cost: PROVIDER.veoFastPerSecond720 * VIDEO_SECONDS,
    detail: `Veo 3.1 Fast, ${VIDEO_SECONDS}s at 720p`,
  },
  {
    action: "ai-avatar-studio",
    label: "AI Avatar Studio",
    cost: PROVIDER.heygenPerMinute * 0.5,
    detail: "HeyGen, 30s cap",
  },
  {
    action: "website-commercial",
    label: "Website Commercial",
    cost: PROVIDER.heygenPerMinute * 0.5 + textCall(8000, 1500),
    detail: "HeyGen 30s + site analysis",
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
    detail: "6 illustrations + story",
  },
  {
    action: "analyze",
    label: "Website scan",
    cost: textCall(8000, 1500),
    detail: "text only",
  },
];

/** What a customer pays per token, by how they bought it. */
export type Tier = { name: string; kind: "plan" | "pack"; price: number; tokens: number };

export const TIERS: Tier[] = [
  { name: "Core", kind: "plan", price: 14.99, tokens: 25 },
  { name: "Plus", kind: "plan", price: 29.99, tokens: 55 },
  { name: "Pro", kind: "plan", price: 49.99, tokens: 100 },
  { name: "Elite", kind: "plan", price: 79.99, tokens: 175 },
  { name: "Business Center", kind: "plan", price: 149.99, tokens: 340 },
  { name: "Business Center Pro", kind: "plan", price: 299.99, tokens: 750 },
  { name: "10 tokens", kind: "pack", price: 6.99, tokens: 10 },
  { name: "25 tokens", kind: "pack", price: 14.99, tokens: 25 },
  { name: "60 tokens", kind: "pack", price: 32.99, tokens: 60 },
  { name: "150 tokens", kind: "pack", price: 74.99, tokens: 150 },
  { name: "400 tokens", kind: "pack", price: 179.99, tokens: 400 },
  { name: "1,000 tokens", kind: "pack", price: 399.99, tokens: 1000 },
];

export function revenuePerToken(tier: Tier): number {
  return tier.price / tier.tokens;
}

/** Margin on one generation at one tier. Negative means it is sold at a loss. */
export function marginFor(line: CostLine, tier: Tier): { revenue: number; profit: number; margin: number } {
  const revenue = revenuePerToken(tier) * (TOKEN_COST[line.action] ?? 1);
  const profit = revenue - line.cost;
  return { revenue, profit, margin: revenue > 0 ? profit / revenue : -Infinity };
}

/**
 * Tokens that a generation must cost to hit a target margin at a given tier.
 * This is the number to change when something is underpriced.
 */
export function tokensNeeded(line: CostLine, tier: Tier, targetMargin = 0.7): number {
  const perToken = revenuePerToken(tier);
  if (perToken <= 0) return Infinity;
  const requiredRevenue = line.cost / (1 - targetMargin);
  return Math.ceil(requiredRevenue / perToken);
}

/** The worst case across all tiers — where the business actually gets hurt. */
export function worstTier(line: CostLine): { tier: Tier; margin: number; profit: number } {
  let worst = { tier: TIERS[0], margin: Infinity, profit: Infinity };
  for (const tier of TIERS) {
    const m = marginFor(line, tier);
    if (m.margin < worst.margin) worst = { tier, margin: m.margin, profit: m.profit };
  }
  return worst;
}
