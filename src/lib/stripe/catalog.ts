import { PACK_SPECS, PLAN_SPECS, type PlanName } from "@/lib/plans";

/**
 * Stripe catalog for Reelo inside the SHARED portfolio Stripe account.
 *
 * Architecture:
 *   One Stripe account → multiple businesses (Rest Pilot, …, Reelo).
 *   Isolation = lookup_key prefix + metadata.business + dedicated webhook URL.
 *   Never mutate restpilot_* (or other) products/prices/customers.
 *
 * Prices/tokens source of truth: `src/lib/plans.ts`.
 */

/** Stable business id stamped on every Reelo Stripe object. */
export const REELO_BUSINESS = "reelo" as const;

/** All Reelo Price.lookup_key values start with this prefix. */
export const REELO_LOOKUP_PREFIX = "reelo_" as const;

export const STRIPE_API_VERSION = "2026-03-25.dahlia";

export type CatalogKind = "plan" | "pack";

export type CatalogItem = {
  kind: CatalogKind;
  /** Stable Stripe Price.lookup_key — always starts with reelo_ */
  lookupKey: string;
  /** Human product name in Stripe Dashboard */
  productName: string;
  /** USD */
  priceUsd: number;
  tokens: number;
  /** Recurring monthly vs one-time pack */
  mode: "subscription" | "payment";
  /** Plan name when kind=plan */
  planName?: PlanName;
};

function slugPlan(name: PlanName): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Paid subscription plans only (FREE is not sold via Stripe). */
export function planCatalog(): CatalogItem[] {
  return PLAN_SPECS.filter((p) => p.price > 0).map((p) => ({
    kind: "plan" as const,
    lookupKey: `reelo_plan_${slugPlan(p.name)}`,
    productName: `Reelo ${p.name}`,
    priceUsd: p.price,
    tokens: p.tokens,
    mode: "subscription" as const,
    planName: p.name,
  }));
}

export function packCatalog(): CatalogItem[] {
  return PACK_SPECS.map((p) => ({
    kind: "pack" as const,
    lookupKey: `reelo_pack_${p.tokens}`,
    productName: `Reelo Token Pack (${p.tokens})`,
    priceUsd: p.price,
    tokens: p.tokens,
    mode: "payment" as const,
  }));
}

export function fullCatalog(): CatalogItem[] {
  return [...planCatalog(), ...packCatalog()];
}

const BY_LOOKUP = new Map(fullCatalog().map((c) => [c.lookupKey, c]));

export function catalogByLookupKey(lookupKey: string): CatalogItem | undefined {
  return BY_LOOKUP.get(lookupKey);
}

export function isKnownLookupKey(lookupKey: string): boolean {
  return BY_LOOKUP.has(lookupKey);
}

export function isReeloLookupKey(lookupKey: string | null | undefined): boolean {
  return Boolean(lookupKey && lookupKey.startsWith(REELO_LOOKUP_PREFIX));
}

/** True when metadata explicitly marks this object as Reelo. */
export function isReeloBusinessMeta(meta?: Record<string, string> | null): boolean {
  return meta?.business === REELO_BUSINESS;
}

/**
 * Whether a webhook payload belongs to Reelo.
 * Prefer metadata.business; fall back to reelo_ lookup_key / product name hints.
 */
export function belongsToReelo(opts: {
  metadata?: Record<string, string> | null;
  lookupKey?: string | null;
}): boolean {
  if (isReeloBusinessMeta(opts.metadata)) return true;
  if (isReeloLookupKey(opts.lookupKey)) return true;
  return false;
}

/** Dollars → Stripe unit_amount (cents). */
export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}
