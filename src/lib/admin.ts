// ---------------------------------------------------------------------------
// Mock admin data. Deterministic (no Date.now / Math.random) so server and
// client render identically. This is demo data — not wired to a real backend.
// ---------------------------------------------------------------------------

export type PlanName =
  | "FREE"
  | "CORE"
  | "PLUS"
  | "PRO"
  | "ELITE"
  | "BUSINESS CENTER"
  | "BUSINESS CENTER PRO";

export type Plan = { name: PlanName; price: number; tokens: number; active: boolean };

export const PLANS: Plan[] = [
  { name: "FREE", price: 0, tokens: 5, active: true },
  { name: "CORE", price: 14.99, tokens: 25, active: true },
  { name: "PLUS", price: 29.99, tokens: 75, active: true },
  { name: "PRO", price: 49.99, tokens: 175, active: true },
  { name: "ELITE", price: 79.99, tokens: 350, active: true },
  { name: "BUSINESS CENTER", price: 149.99, tokens: 1000, active: true },
  { name: "BUSINESS CENTER PRO", price: 299.99, tokens: 3000, active: true },
];

export const PLAN_PRICE: Record<PlanName, number> = Object.fromEntries(
  PLANS.map((p) => [p.name, p.price]),
) as Record<PlanName, number>;

export type UserStatus = "active" | "suspended";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: PlanName;
  tokens: number;
  status: UserStatus;
  joined: string; // YYYY-MM-DD
  lastActive: string; // YYYY-MM-DD
  spend: number; // lifetime $
  country: string;
};

export type TxStatus = "paid" | "refunded" | "failed";

export type Transaction = {
  id: string;
  name: string;
  email: string;
  plan: PlanName;
  amount: number;
  status: TxStatus;
  date: string; // YYYY-MM-DD
  method: string;
};

const FIRST = ["Ava", "Liam", "Noah", "Emma", "Mia", "Kai", "Sofia", "Ethan", "Zoe", "Lucas", "Aria", "Leo", "Maya", "Owen", "Isla", "Nora", "Jack", "Ruby", "Finn", "Ivy", "Marcus", "Priya", "Diego", "Yuki", "Omar", "Lena", "Theo", "Nina", "Hugo", "Amara"];
const LAST = ["Carter", "Nguyen", "Patel", "Silva", "Kim", "Rossi", "Cohen", "Mendez", "Okafor", "Haddad", "Novak", "Reyes", "Ford", "Chen", "Ali", "Brooks", "Sato", "Diaz", "Meyer", "Khan"];
const COUNTRY = ["US", "UK", "CA", "DE", "AU", "FR", "BR", "IN", "NL", "ES"];
const METHODS = ["Visa ····4242", "Mastercard ····5100", "Amex ····0005", "PayPal", "Apple Pay"];
const PLAN_LIST = PLANS.map((p) => p.name);

const pick = <T,>(arr: T[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];
const pad = (n: number) => n.toString().padStart(2, "0");
// Spread dates across the first half of 2026, deterministically.
const dateFrom = (seed: number) => {
  const month = 1 + (seed % 6); // Jan–Jun 2026
  const day = 1 + (seed * 7) % 27;
  return `2026-${pad(month)}-${pad(day)}`;
};

export const USERS: AdminUser[] = Array.from({ length: 42 }, (_, i) => {
  const first = pick(FIRST, i * 3 + 1);
  const last = pick(LAST, i * 5 + 2);
  const plan = pick(PLAN_LIST, i * 4 + 3) as PlanName;
  const suspended = i % 11 === 4; // ~4 suspended
  const months = 1 + (i % 12);
  const spend = Number((PLAN_PRICE[plan] * months).toFixed(2));
  return {
    id: `usr_${(1000 + i).toString(36)}`,
    name: `${first} ${last}`,
    email: `${first}.${last}@${pick(["gmail.com", "outlook.com", "proton.me", "company.co"], i)}`.toLowerCase(),
    plan,
    tokens: pick([5, 12, 25, 40, 75, 120, 175, 300], i * 2 + 1),
    status: suspended ? "suspended" : "active",
    joined: dateFrom(i * 3 + 2),
    lastActive: dateFrom(i * 5 + 20),
    spend,
    country: pick(COUNTRY, i * 2 + 1),
  };
});

export const TRANSACTIONS: Transaction[] = Array.from({ length: 64 }, (_, i) => {
  const u = pick(USERS, i * 3 + 1);
  const status: TxStatus = i % 13 === 6 ? "refunded" : i % 17 === 9 ? "failed" : "paid";
  const plan = pick(PLAN_LIST, i * 2 + 2) as PlanName;
  return {
    id: `in_${(90000 + i).toString(36)}`,
    name: u.name,
    email: u.email,
    plan,
    amount: PLAN_PRICE[plan],
    status,
    date: dateFrom(i * 2 + 1),
    method: pick(METHODS, i),
  };
});

export function kpis() {
  const totalUsers = USERS.length;
  const paying = USERS.filter((u) => u.status === "active" && u.plan !== "FREE");
  const activeSubscribers = paying.length;
  const mrr = Number(paying.reduce((s, u) => s + PLAN_PRICE[u.plan], 0).toFixed(2));
  const revenue = Number(
    TRANSACTIONS.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0).toFixed(2),
  );
  const refunds = Number(
    TRANSACTIONS.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0).toFixed(2),
  );
  const newThisMonth = USERS.filter((u) => u.joined >= "2026-06-01").length;
  const suspended = USERS.filter((u) => u.status === "suspended").length;
  return { totalUsers, activeSubscribers, mrr, revenue, refunds, newThisMonth, suspended };
}

// Revenue by month (Jan–Jun 2026) from paid transactions.
export function revenueByMonth() {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const totals = labels.map((_, m) => {
    const mm = pad(m + 1);
    return Number(
      TRANSACTIONS.filter((t) => t.status === "paid" && t.date.slice(5, 7) === mm)
        .reduce((s, t) => s + t.amount, 0)
        .toFixed(2),
    );
  });
  return labels.map((label, i) => ({ label, total: totals[i] }));
}

// Count of users on each plan.
export function planDistribution() {
  return PLANS.map((p) => ({ name: p.name, count: USERS.filter((u) => u.plan === p.name).length }));
}

export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 === 0 ? 0 : 2 });
