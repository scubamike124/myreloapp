/**
 * "How many books did we make this week, and how many can actually go out?"
 *
 * Two questions that sound like one. A book exists the moment `saveStory`
 * writes the row; a book is *sendable* only when every page has both its words
 * and its picture, because that is what `downloadBookPdf` turns into a file.
 * The illustration loop in `/api/storybook` is deliberately forgiving — one
 * page whose image fails does not lose the other nine — so a partly
 * illustrated book is a normal, expected outcome that is saved and charged for.
 * Counting those as finished would report a number nobody can act on.
 *
 * ## Why this file holds no SQL
 *
 * Everything here is a pure function over rows, so the counting rules can be
 * tested without a database — and, more to the point, so the rule for "ready"
 * lives in one readable place rather than inside a CASE expression that has to
 * be written twice for postgres and sqlite. `ebookStats` in store.ts does the
 * reading; this decides what the rows mean.
 *
 * It also imports nothing through the "@/" alias, for the same reason
 * products.ts does not: the test runner strips types but does not resolve
 * tsconfig paths, and a counting rule nothing can check is a counting rule that
 * will quietly drift.
 */

import { STORY_PRODUCTS, artifactsFor, type StoryProductId } from "./products.ts";

/**
 * The products that produce a book.
 *
 * Derived from the product registry rather than written out, because "which
 * deliveries include an e-book" is already answered there — the bundle counts
 * precisely because it produces the same `ebook_layout` the standalone e-book
 * does. A fourth book-bearing product added later is counted here without this
 * file being touched.
 */
export const BOOK_PRODUCTS: StoryProductId[] = STORY_PRODUCTS.filter((p) =>
  artifactsFor(p.id).includes("ebook_layout"),
).map((p) => p.id);

const BOOK_PRODUCT_SET = new Set<string>(BOOK_PRODUCTS);

/**
 * A cap on how many rows the query behind this will read.
 *
 * Declared here rather than at the call site so `truncated` cannot disagree
 * with the LIMIT that caused it: a number reported as complete when it is not
 * is worse than no number.
 */
export const EBOOK_STATS_ROW_CAP = 5000;

/** How many not-ready books are named individually before the list is cut. */
export const NOT_READY_SAMPLE = 20;

/** The largest window this will count over, in days. */
export const MAX_WINDOW_DAYS = 90;

export type EbookPage = { text?: string; image?: string };

/** One story row, reduced to what counting needs. */
export type EbookRow = {
  id: string;
  title: string;
  /** The delivery that was bought — only BOOK_PRODUCTS are counted. */
  product: string;
  /** ISO 8601. Empty or unparseable is tolerated rather than dropped. */
  createdAt: string;
  pages: EbookPage[];
};

/**
 * `ready` means every page has words and a picture — the book prints whole.
 * `incomplete` means pages exist but at least one is missing one of those.
 * `empty` means no pages were stored at all, which is not a book.
 */
export type EbookReadiness = "ready" | "incomplete" | "empty";

export type StatsWindow = {
  /** Whole days, clamped to 1…MAX_WINDOW_DAYS. */
  days: number;
  /** Inclusive lower bound, ISO 8601. */
  since: string;
  /** The moment the count was taken, ISO 8601. */
  until: string;
};

export type EbookStats = StatsWindow & {
  /** Book-bearing stories saved in the window. */
  made: number;
  /** Of those, the ones that print whole. */
  readyToPublish: number;
  /** made − readyToPublish. Carried rather than left to be subtracted. */
  notReady: number;
  byReadiness: Record<EbookReadiness, number>;
  /** Counts per delivery, e.g. { ebook: 4, bundle: 1 }. */
  byProduct: Record<string, number>;
  /** Pages across the window with no illustration stored. */
  pagesMissingIllustration: number;
  /** Rows counted in `made` whose timestamp could not be read, so they appear in no day. */
  undated: number;
  /** One entry per UTC date the window touches, oldest first. */
  byDay: { date: string; made: number; readyToPublish: number }[];
  /** The unfinished ones, named, up to NOT_READY_SAMPLE. */
  notReadyBooks: {
    id: string;
    title: string;
    createdAt: string;
    readiness: EbookReadiness;
    pages: number;
    pagesMissingIllustration: number;
  }[];
  /** The row cap was hit, so every number above is a floor, not a total. */
  truncated: boolean;
};

const filled = (v: unknown): boolean => typeof v === "string" && v.trim() !== "";

/** Pages in this book with no illustration stored. */
export function missingIllustrations(pages: EbookPage[]): number {
  return pages.reduce((n, page) => (filled(page?.image) ? n : n + 1), 0);
}

export function readinessOf(pages: EbookPage[]): EbookReadiness {
  if (!Array.isArray(pages) || pages.length === 0) return "empty";
  const whole = pages.every((page) => filled(page?.text) && filled(page?.image));
  return whole ? "ready" : "incomplete";
}

/**
 * The window "the last N days" actually means.
 *
 * Rolling from the moment of asking, not calendar days — "the last 3 days" on a
 * Tuesday morning means since Saturday morning, which is what someone asking it
 * out loud means. The consequence is that the oldest day bucket is partial, and
 * `since` is returned so that is visible rather than inferred.
 */
export function statsWindow(days: number, now: Date = new Date()): StatsWindow {
  const whole = Number.isFinite(days) ? Math.floor(days) : 0;
  const clamped = Math.max(1, Math.min(MAX_WINDOW_DAYS, whole || 1));
  const until = now.getTime();
  return {
    days: clamped,
    since: new Date(until - clamped * 86_400_000).toISOString(),
    until: new Date(until).toISOString(),
  };
}

const utcDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/**
 * Count the books.
 *
 * Rows are expected to be the window's rows already, but the lower bound is
 * re-applied here so the answer cannot be wider than the window it is labelled
 * with. A row whose timestamp will not parse is *kept* — it is a real book, and
 * dropping it to keep the daily chart tidy would understate the total — and
 * reported as `undated` instead.
 */
export function summariseEbooks(rows: EbookRow[], window: StatsWindow): EbookStats {
  const sinceMs = Date.parse(window.since);
  const byReadiness: Record<EbookReadiness, number> = { ready: 0, incomplete: 0, empty: 0 };
  const byProduct: Record<string, number> = {};
  const days = new Map<string, { made: number; readyToPublish: number }>();
  const notReadyBooks: EbookStats["notReadyBooks"] = [];

  let made = 0;
  let readyToPublish = 0;
  let pagesMissingIllustration = 0;
  let undated = 0;

  for (const row of rows) {
    if (!BOOK_PRODUCT_SET.has(row.product)) continue;

    const at = Date.parse(row.createdAt);
    const dated = Number.isFinite(at);
    if (dated && at < sinceMs) continue;

    const pages = Array.isArray(row.pages) ? row.pages : [];
    const readiness = readinessOf(pages);
    const missing = missingIllustrations(pages);

    made++;
    byReadiness[readiness]++;
    byProduct[row.product] = (byProduct[row.product] ?? 0) + 1;
    pagesMissingIllustration += missing;
    if (readiness === "ready") readyToPublish++;
    else if (notReadyBooks.length < NOT_READY_SAMPLE) {
      notReadyBooks.push({
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        readiness,
        pages: pages.length,
        pagesMissingIllustration: missing,
      });
    }

    if (!dated) {
      undated++;
      continue;
    }
    const key = utcDay(at);
    const bucket = days.get(key) ?? { made: 0, readyToPublish: 0 };
    bucket.made++;
    if (readiness === "ready") bucket.readyToPublish++;
    days.set(key, bucket);
  }

  return {
    ...window,
    made,
    readyToPublish,
    notReady: made - readyToPublish,
    byReadiness,
    byProduct,
    pagesMissingIllustration,
    undated,
    byDay: dayBuckets(window, days),
    notReadyBooks,
    truncated: rows.length >= EBOOK_STATS_ROW_CAP,
  };
}

/**
 * Every UTC date the window touches, including the ones with nothing in them.
 *
 * A quiet day has to appear as a zero. Omitting it turns "nobody made a book on
 * Sunday" into "Sunday is missing from the report", and those read very
 * differently to whoever is looking at the trend.
 *
 * A rolling 3-day window usually spans four dates, because it starts partway
 * through the oldest one.
 */
function dayBuckets(
  window: StatsWindow,
  counted: Map<string, { made: number; readyToPublish: number }>,
): EbookStats["byDay"] {
  const first = Date.parse(window.since);
  const last = Date.parse(window.until);
  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return [...counted.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, n]) => ({ date, ...n }));
  }

  const out: EbookStats["byDay"] = [];
  // Step from UTC midnight of the first day so the loop lands on dates rather
  // than on times, whatever hour the window opened at.
  let cursor = Date.parse(`${utcDay(first)}T00:00:00.000Z`);
  // Bounded by construction: MAX_WINDOW_DAYS days is at most 91 dates.
  while (cursor <= last) {
    const date = utcDay(cursor);
    out.push({ date, ...(counted.get(date) ?? { made: 0, readyToPublish: 0 }) });
    cursor += 86_400_000;
  }
  return out;
}
