import Stripe from "stripe";
import { SITE_URL } from "@/lib/site";

export { packIdFromTokens, packFromId, listTokenPacks } from "@/lib/token-packs";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  // Cloudflare Workers have no Node http/https sockets. Without the Fetch
  // client, checkout.sessions.create hangs until the Worker request times out.
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function billingReturnUrls() {
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    success: `${base}/account?checkout=success`,
    cancel: `${base}/account?checkout=cancel`,
  };
}
