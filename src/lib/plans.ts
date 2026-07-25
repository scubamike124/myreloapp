import {
  PACK_TOKEN_AMOUNTS,
  PLAN_DEFINITIONS,
  TOKEN_USD_VALUE,
  formatTokens,
  planFaceValueUsd,
  planSavingsVsStore,
  usdFromTokens,
  type PlanId,
} from "@/lib/token-pricing";

// ---------------------------------------------------------------------------
// Plans and packs.
//
// Token store = face value (tokens × TOKEN_USD_VALUE).
// Subscriptions = discounted monthlyPrice for a token allotment + benefits.
// Feature deductions are identical either way.
// ---------------------------------------------------------------------------

export type PlanName = PlanId;

export type PlanSpec = {
  name: PlanName;
  label: string;
  /** USD per month (subscription discount — not face value). */
  price: number;
  /** Tokens included per month. */
  tokens: number;
  /** Face value of those tokens at TOKEN_USD_VALUE. */
  faceValue: number;
  /** 0–1 savings vs buying the same tokens in the store. */
  savingsVsStore: number;
};

export const PLAN_SPECS: PlanSpec[] = PLAN_DEFINITIONS.map((p) => ({
  name: p.id,
  label: p.label,
  price: p.monthlyPrice,
  tokens: p.tokens,
  faceValue: planFaceValueUsd(p.tokens),
  savingsVsStore: planSavingsVsStore(p.monthlyPrice, p.tokens),
}));

/** One-off token purchases — always face value. */
export type PackSpec = { tokens: number; price: number };

export const PACK_SPECS: PackSpec[] = PACK_TOKEN_AMOUNTS.map((tokens) => ({
  tokens,
  price: usdFromTokens(tokens),
}));

const BY_NAME = new Map(PLAN_SPECS.map((p) => [p.name, p]));

export function planSpec(name: PlanName): PlanSpec {
  const found = BY_NAME.get(name);
  if (!found) throw new Error(`Unknown plan: ${name}`);
  return found;
}

export function planPrice(name: PlanName): string {
  const { price } = planSpec(name);
  if (price === 0) return "$0";
  return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
}

export function planTokens(name: PlanName): string {
  return formatTokens(planSpec(name).tokens);
}

export function planLabel(name: PlanName): string {
  return planSpec(name).label;
}

/** Packs are face value — no volume discount. */
export function packSaving(_tokens: number): number {
  return 0;
}

export function tokenFaceValueLabel(): string {
  return `1 token = $${TOKEN_USD_VALUE.toFixed(0)}`;
}

/** e.g. "$80 value" for marketing on plan cards. */
export function planFaceValueLabel(name: PlanName): string {
  const { faceValue } = planSpec(name);
  return faceValue >= 1000
    ? `$${faceValue.toLocaleString("en-US")} value`
    : `$${faceValue} value`;
}
