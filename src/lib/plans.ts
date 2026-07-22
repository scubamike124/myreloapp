// ---------------------------------------------------------------------------
// What every plan and pack costs, and how many tokens it includes.
//
// THE source of truth. Nothing else may hold its own copy of a price or a token
// allowance — this file exists because three places did, and they drifted:
// the pricing page sold Business Center Pro at 750 tokens while the admin
// dashboard reported 3,000. At 3,000 the plan works out to $0.10 per token
// against a $0.50–0.60 provider cost per video, so every video sold on it lost
// money. Nobody had bought one, and the only reason nobody noticed is that the
// two numbers lived in files that were never read side by side.
//
// Before changing any allowance here, run the margin check in src/lib/costs.ts.
// The ladder is deliberately monotonic — each larger plan is cheaper per token
// than the one below it, and none dips under roughly 55% margin on the worst
// generation.
// ---------------------------------------------------------------------------

export type PlanName =
  | "FREE"
  | "CORE"
  | "PLUS"
  | "PRO"
  | "ELITE"
  | "BUSINESS CENTER"
  | "BUSINESS CENTER PRO";

export type PlanSpec = {
  name: PlanName;
  /** USD per month. */
  price: number;
  /** Tokens included per month. */
  tokens: number;
};

export const PLAN_SPECS: PlanSpec[] = [
  { name: "FREE", price: 0, tokens: 5 },
  { name: "CORE", price: 14.99, tokens: 25 },
  { name: "PLUS", price: 29.99, tokens: 55 },
  { name: "PRO", price: 49.99, tokens: 100 },
  { name: "ELITE", price: 79.99, tokens: 175 },
  { name: "BUSINESS CENTER", price: 149.99, tokens: 340 },
  { name: "BUSINESS CENTER PRO", price: 299.99, tokens: 750 },
];

/** One-off token purchases, for people who do not want a subscription. */
export type PackSpec = { tokens: number; price: number };

export const PACK_SPECS: PackSpec[] = [
  { tokens: 10, price: 6.99 },
  { tokens: 25, price: 14.99 },
  { tokens: 60, price: 32.99 },
  { tokens: 150, price: 74.99 },
  { tokens: 400, price: 179.99 },
  { tokens: 1000, price: 399.99 },
];

const BY_NAME = new Map(PLAN_SPECS.map((p) => [p.name, p]));

export function planSpec(name: PlanName): PlanSpec {
  const found = BY_NAME.get(name);
  if (!found) throw new Error(`Unknown plan: ${name}`);
  return found;
}

/** "$299.99" — formatted once so no two pages disagree about the decimals. */
export function planPrice(name: PlanName): string {
  const { price } = planSpec(name);
  return price === 0 ? "$0" : `$${price.toFixed(2)}`;
}

/** "750" — the allowance as the pricing card prints it. */
export function planTokens(name: PlanName): string {
  return String(planSpec(name).tokens);
}

/**
 * What one token costs on a pack, used to work out the "SAVE x%" labels rather
 * than trusting hand-written percentages.
 */
export function packSaving(tokens: number): number {
  const pack = PACK_SPECS.find((p) => p.tokens === tokens);
  const base = PACK_SPECS[0];
  if (!pack || pack === base) return 0;
  return 1 - pack.price / pack.tokens / (base.price / base.tokens);
}
