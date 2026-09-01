/**
 * Hard-coded California Property Opportunity System rules.
 * Amber cannot change these via prompt, admin instruction, or workflow.
 * Changing this file is an explicit owner-authorized software change.
 */

/** ONE PROPERTY = ONE $299 UNLOCK. Not $299.99 (that is Business Center Pro). */
export const UNLOCK_PRICE_USD = 299;
export const UNLOCK_PRICE_CENTS = 29900;

export const STRIPE_UNLOCK_LOOKUP_KEY = "reelo_pi_research_unlock";
export const STRIPE_PUBLIC_DESCRIPTION = "Individual Property Research Package";

export const AGREEMENT_VERSION = "CA-PILOT-DRAFT-1.0";
export const PREVIEW_VERSION = "1.0";
export const REPORT_VERSION = "1.0";

/** Default FALSE until owner authorizes after legal validation. */
export const SUCCESS_FEE_ENABLED = false;

/** Default FALSE — Version 1 does not autonomously solicit sellers. */
export const SELLER_SOLICITATION_ENABLED = false;

export const SUCCESS_FEE_TIERS = [
  { maxCentsExclusive: 20_000_000, feeCents: 500_000, label: "below $200,000 → $5,000" },
  { maxCentsExclusive: 50_000_001, feeCents: 1_000_000, label: "$200,000–$500,000 → $10,000" },
  { maxCentsExclusive: Number.POSITIVE_INFINITY, feeCents: 1_500_000, label: "above $500,000 → $15,000" },
] as const;

export const COMPANY_LEGAL_NAME_DEFAULT = "Reelo (California Property Research Pilot)";

export const PRODUCT_NAME = "Property Research & Opportunity Discovery";

/** Pre-purchase quality gate (Phase 3.17 / §29). Weak public-record stubs stay internal. */
export const MIN_OFFER_CONFIDENCE = 70;
export const MIN_OFFER_MATCH_SCORE = 70;
export const MIN_FACT_FIELDS_FOR_SALE = 6;
export const ASSESSOR_FRESHNESS_MONTHS = 48;
