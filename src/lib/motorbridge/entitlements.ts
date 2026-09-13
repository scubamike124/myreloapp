/**
 * Provisional customer pricing (§31-32). Explicitly not proven prices —
 * kept in one place, as plain data, so they can change without touching
 * any of the logic that enforces them. Values are USD/month.
 */
export type PlanId =
  | "trial"
  | "racer"
  | "enthusiast"
  | "tuner_pro"
  | "shop"
  | "shop_pro"
  | "business_api"
  | "enterprise";

export type Plan = {
  id: PlanId;
  label: string;
  priceUsd: number | null; // null = negotiated (enterprise)
  vehicleLimit: number | null; // null = negotiated
  commercialUse: boolean;
  /** Fraction off priceUsd for an opted-in Data Partner on this plan (§32) — a hypothesis, not a locked rate. */
  dataPartnerDiscountFraction: number | null;
};

export const PLANS: Record<PlanId, Plan> = {
  trial: { id: "trial", label: "24-Hour Trial", priceUsd: 0, vehicleLimit: 2, commercialUse: false, dataPartnerDiscountFraction: null },
  racer: { id: "racer", label: "Racer", priceUsd: 19, vehicleLimit: 1, commercialUse: false, dataPartnerDiscountFraction: null },
  enthusiast: { id: "enthusiast", label: "Enthusiast", priceUsd: 49, vehicleLimit: 3, commercialUse: false, dataPartnerDiscountFraction: null },
  tuner_pro: { id: "tuner_pro", label: "Tuner Pro", priceUsd: 99, vehicleLimit: 10, commercialUse: true, dataPartnerDiscountFraction: 0.2 },
  shop: { id: "shop", label: "Shop", priceUsd: 199, vehicleLimit: 30, commercialUse: true, dataPartnerDiscountFraction: 0.2 },
  shop_pro: { id: "shop_pro", label: "Shop Pro", priceUsd: 399, vehicleLimit: 100, commercialUse: true, dataPartnerDiscountFraction: 0.2 },
  business_api: { id: "business_api", label: "Business API", priceUsd: 799, vehicleLimit: 500, commercialUse: true, dataPartnerDiscountFraction: 0.15 },
  enterprise: { id: "enterprise", label: "Enterprise", priceUsd: null, vehicleLimit: null, commercialUse: true, dataPartnerDiscountFraction: null },
};

export const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

/** priceUsd after an active Data Partner discount, or the plain price when not a partner or the plan has no discount defined. Never silently grants a discount rights were not clearly given for (§32's "a discount must never buy rights that were not clearly granted" — this only touches price). */
export function effectivePriceUsd(planId: PlanId, isDataPartner: boolean): number | null {
  const plan = PLANS[planId];
  if (plan.priceUsd === null) return null;
  if (!isDataPartner || plan.dataPartnerDiscountFraction === null) return plan.priceUsd;
  return Math.round(plan.priceUsd * (1 - plan.dataPartnerDiscountFraction) * 100) / 100;
}

export type EntitlementCheck = { allowed: boolean; reason: string };

/** Whether a vehicle count is still within a plan's limit — no plan is trusted to enforce its own math. */
export function checkVehicleLimit(planId: PlanId, currentVehicleCount: number): EntitlementCheck {
  const plan = PLANS[planId];
  if (plan.vehicleLimit === null) return { allowed: true, reason: "negotiated/enterprise — no fixed limit" };
  if (currentVehicleCount < plan.vehicleLimit) return { allowed: true, reason: `${currentVehicleCount}/${plan.vehicleLimit} vehicles used` };
  return { allowed: false, reason: `plan limit reached (${plan.vehicleLimit} vehicles) — upgrade or remove a vehicle` };
}

/**
 * Trials must not be evadable by deleting and re-adding vehicles, or by a
 * commercial operation posing as personal use (§31's explicit requirement).
 * This only flags the pattern; the caller (an owner-reviewed queue, not an
 * autonomous ban) decides what to do about it.
 */
export function detectLikelyLimitEvasion(recentVehicleAddRemoveCount: number, windowDays: number): EntitlementCheck {
  const rate = recentVehicleAddRemoveCount / Math.max(windowDays, 1);
  if (rate >= 2) {
    return {
      allowed: false,
      reason: `${recentVehicleAddRemoveCount} vehicle add/remove events in ${windowDays} day(s) — looks like limit evasion, not ordinary fleet turnover; flag for owner review rather than auto-blocking a legitimate customer`,
    };
  }
  return { allowed: true, reason: "vehicle turnover looks ordinary" };
}

export function trialIsActive(trialStartedAt: string | null, now: Date = new Date()): boolean {
  if (!trialStartedAt) return false;
  return now.getTime() - new Date(trialStartedAt).getTime() < TRIAL_DURATION_MS;
}

export function trialTimeRemainingMs(trialStartedAt: string | null, now: Date = new Date()): number {
  if (!trialStartedAt) return 0;
  const elapsed = now.getTime() - new Date(trialStartedAt).getTime();
  return Math.max(0, TRIAL_DURATION_MS - elapsed);
}
