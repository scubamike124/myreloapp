import { SUCCESS_FEE_ENABLED, SUCCESS_FEE_TIERS } from "./constants";

export function proposedSuccessFeeCents(purchasePriceCents: number | null | undefined): number {
  if (purchasePriceCents == null || !Number.isFinite(purchasePriceCents) || purchasePriceCents < 0) return 0;
  if (purchasePriceCents < 20_000_000) return 500_000;
  if (purchasePriceCents <= 50_000_000) return 1_000_000;
  return 1_500_000;
}

export function successFeeCollectionAllowed(): boolean {
  return SUCCESS_FEE_ENABLED;
}

export function successFeeTierLabel(purchasePriceCents: number | null | undefined): string {
  const cents = proposedSuccessFeeCents(purchasePriceCents);
  const row = SUCCESS_FEE_TIERS.find((t) => t.feeCents === cents);
  return row?.label || "UNKNOWN";
}
