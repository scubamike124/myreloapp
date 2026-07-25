import Stripe from "stripe";
import { SITE_URL } from "@/lib/site";

export { packIdFromTokens, packFromId, listTokenPacks } from "@/lib/token-packs";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function billingReturnUrls() {
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    success: `${base}/account?checkout=success`,
    cancel: `${base}/account?checkout=cancel`,
  };
}
