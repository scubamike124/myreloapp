// ---------------------------------------------------------------------------
// "How many e-books were made in the last 7 days?" — the arithmetic, with no
// database attached.
//
// Split out from admin-content-stats.ts so it can actually be tested:
// that module reaches for @/lib/db, which pulls in react's cache() and the
// Cloudflare context and cannot be loaded by a plain `node --test` run.
// Everything in this file is pure.
//
// ## Why the window boundary is a date, not a timestamp
//
// Two dialects, three storage formats for the same idea:
//
//   command_center_usage.created_at — TIMESTAMPTZ on postgres, and sqlite's
//     own `datetime('now')` text ("2026-09-01 10:00:00") in development.
//   stories.created_at              — TIMESTAMPTZ on postgres, and a full ISO
//     string ("2026-09-01T10:00:00.000Z") on sqlite, because that row is
//     written from JS rather than by a column default.
//
// A bare `YYYY-MM-DD` is the one bound that compares correctly against all
// four: postgres casts it to midnight, and both sqlite formats start with the
// same date prefix, so sqlite's lexical comparison agrees. An ISO instant
// would not — "2026-09-01T00:00:00.000Z" sorts *after* "2026-09-01 10:00:00"
// in text, silently dropping that day's Command Center rows.
//
// The price is day granularity, which is why the window is described as whole
// UTC days rather than a rolling 168 hours, and why `since` is reported back
// so the answer can say exactly what it counted.
// ---------------------------------------------------------------------------

/** Command Center tools whose output is an illustrated e-book. */
export const EBOOK_TOOL_SLUGS: readonly string[] = ["bedtime-storybook", "ai-story-maker"];

/** Story products that include a book — a bundle is the book plus the film. */
export const EBOOK_PRODUCTS: readonly string[] = ["ebook", "bundle"];

export const DEFAULT_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 365;

/** A usable day count from whatever the model passed as `days`. */
export function clampDays(days: unknown): number {
  const n = Math.floor(Number(days));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_WINDOW_DAYS;
  return Math.min(n, MAX_WINDOW_DAYS);
}

/**
 * The first UTC day included in a `days`-long window ending today, as
 * `YYYY-MM-DD`. Seven days means today and the six before it, so asking on a
 * Monday covers last Tuesday onward — not eight partial days.
 */
export function windowStart(days: unknown, now: Date = new Date()): string {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (clampDays(days) - 1));
  return start.toISOString().slice(0, 10);
}

/** `ok` is a real boolean on postgres and 0/1 on sqlite; neither Boolean() nor === true is right on both. */
export function isOk(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true";
}

/** postgres returns COUNT(*) as a bigint *string*; sqlite returns a number. */
export function rowCount(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** One `GROUP BY tool_name, ok` row from command_center_usage. */
export type UsageCountRow = { toolName?: unknown; ok?: unknown; n?: unknown };

/** One `GROUP BY product` row from stories. */
export type StoryCountRow = { product?: unknown; n?: unknown };

export type EbookCounts = {
  /** Whole UTC days counted, including today. */
  days: number;
  /** First day counted, `YYYY-MM-DD` (UTC). */
  since: string;
  /** E-books Amber made herself, through Command Center tools. */
  amberMade: number;
  /** Attempts in the same window that failed — a failed run is not a book. */
  amberFailed: number;
  amberByTool: { tool: string; made: number; failed: number }[];
  /** E-books customers made in the product, saved to their libraries. */
  customerMade: number;
  customerByProduct: { product: string; made: number }[];
  note: string;
};

const NOTE = [
  "Amber's own e-books are counted from the Command Center tool-run ledger, which is the only record of them:",
  "a book Amber makes is returned in the conversation and is not saved into anyone's library.",
  "Customer e-books are rows in the stories table; a 'bundle' counts because it includes the book.",
  "The window is whole UTC days, so the first and last day may be partial.",
].join(" ");

/**
 * Fold the two grouped queries into one answer.
 *
 * Tools with no runs are still listed, at zero: "bedtime-storybook 3,
 * ai-story-maker 0" is a more useful answer than an unexplained 3, and it
 * keeps the shape of the result the same whether or not anything happened.
 */
export function summarizeEbookCounts(
  usage: UsageCountRow[],
  stories: StoryCountRow[],
  window: { days: number; since: string },
): EbookCounts {
  const made = new Map<string, number>();
  const failed = new Map<string, number>();

  for (const row of usage) {
    const tool = typeof row.toolName === "string" ? row.toolName : "";
    if (!EBOOK_TOOL_SLUGS.includes(tool)) continue;
    const bucket = isOk(row.ok) ? made : failed;
    bucket.set(tool, (bucket.get(tool) ?? 0) + rowCount(row.n));
  }

  const amberByTool = EBOOK_TOOL_SLUGS.map((tool) => ({
    tool,
    made: made.get(tool) ?? 0,
    failed: failed.get(tool) ?? 0,
  }));

  const byProduct = new Map<string, number>();
  for (const row of stories) {
    const product = typeof row.product === "string" ? row.product : "";
    if (!EBOOK_PRODUCTS.includes(product)) continue;
    byProduct.set(product, (byProduct.get(product) ?? 0) + rowCount(row.n));
  }
  const customerByProduct = EBOOK_PRODUCTS.map((product) => ({
    product,
    made: byProduct.get(product) ?? 0,
  }));

  return {
    days: window.days,
    since: window.since,
    amberMade: amberByTool.reduce((sum, t) => sum + t.made, 0),
    amberFailed: amberByTool.reduce((sum, t) => sum + t.failed, 0),
    amberByTool,
    customerMade: customerByProduct.reduce((sum, p) => sum + p.made, 0),
    customerByProduct,
    note: NOTE,
  };
}
