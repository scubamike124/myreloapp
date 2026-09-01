import { REELO_BUSINESS, STRIPE_API_VERSION } from "@/lib/stripe/catalog";

/**
 * Direct Stripe REST client (no Node SDK).
 * Shared portfolio Stripe account — Reelo objects always carry metadata.business=reelo.
 */

export type StripeForm = Record<string, string | number | boolean | undefined | null>;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

export function stripeSecretMode(): "test" | "live" | "missing" {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return "missing";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "missing";
}

export function isStripeTestMode(): boolean {
  return stripeSecretMode() === "test";
}

function encodeForm(params: StripeForm): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === false) continue;
    if (v === true) body.set(k, "true");
    else body.set(k, String(v));
  }
  return body.toString();
}

export class StripeHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public type?: string,
  ) {
    super(message);
    this.name = "StripeHttpError";
  }
}

export async function stripeRequest<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params?: StripeForm,
): Promise<T> {
  const key = stripeSecretKey();
  const url =
    method === "GET" && params
      ? `https://api.stripe.com/v1${path}?${encodeForm(params)}`
      : `https://api.stripe.com/v1${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...(method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body: method === "POST" ? encodeForm(params ?? {}) : undefined,
  });

  const data = (await res.json()) as T & {
    error?: { message?: string; code?: string; type?: string };
  };

  if (!res.ok) {
    throw new StripeHttpError(
      data.error?.message || `Stripe HTTP ${res.status}`,
      res.status,
      data.error?.code,
      data.error?.type,
    );
  }
  return data;
}

export function publicAppOrigin(req?: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_ORIGIN?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export type StripeCustomer = { id: string; email?: string | null; metadata?: Record<string, string> };
export type StripePrice = {
  id: string;
  lookup_key?: string | null;
  type?: string;
  unit_amount?: number | null;
  product?: string | { id: string };
};
export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  mode?: string;
  metadata?: Record<string, string>;
  customer?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
  payment_status?: string;
  amount_total?: number | null;
  payment_intent?: string | { id: string } | null;
};
export type StripeSubscription = {
  id: string;
  status: string;
  customer: string | { id: string };
  cancel_at_period_end?: boolean;
  current_period_start?: number;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ price?: StripePrice; current_period_start?: number; current_period_end?: number }> };
};
export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export async function findOrCreateCustomer(opts: {
  userId: string;
  email: string;
}): Promise<string> {
  // Isolation rule: never reuse a Stripe Customer from another business
  // (same email may already exist for Rest Pilot). Always scope by business=reelo.
  try {
    const found = await stripeRequest<{ data: StripeCustomer[] }>("GET", "/customers/search", {
      query: `metadata['business']:'${REELO_BUSINESS}' AND metadata['userId']:'${opts.userId}'`,
      limit: 1,
    });
    if (found.data?.[0]?.id) return found.data[0].id;
  } catch {
    /* search may be unavailable; fall through */
  }

  // Second pass: Reelo customers by email + business (not bare email list).
  try {
    const byEmail = await stripeRequest<{ data: StripeCustomer[] }>("GET", "/customers/search", {
      query: `email:'${opts.email.replace(/'/g, "\\'")}' AND metadata['business']:'${REELO_BUSINESS}'`,
      limit: 1,
    });
    if (byEmail.data?.[0]?.id) {
      const c = byEmail.data[0];
      if (c.metadata?.userId !== opts.userId) {
        await stripeRequest("POST", `/customers/${c.id}`, {
          "metadata[userId]": opts.userId,
          "metadata[business]": REELO_BUSINESS,
        });
      }
      return c.id;
    }
  } catch {
    /* fall through to create */
  }

  const created = await stripeRequest<StripeCustomer>("POST", "/customers", {
    email: opts.email,
    "metadata[userId]": opts.userId,
    "metadata[business]": REELO_BUSINESS,
    "metadata[app]": "myreelo",
  });
  return created.id;
}

export async function priceByLookupKey(lookupKey: string): Promise<StripePrice | null> {
  const res = await stripeRequest<{ data: StripePrice[] }>("GET", "/prices", {
    "lookup_keys[]": lookupKey,
    active: true,
    limit: 1,
  });
  return res.data?.[0] ?? null;
}
