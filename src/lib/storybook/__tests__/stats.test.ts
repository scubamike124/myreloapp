/**
 * Counting the books.
 *
 * The owner's question is "how many e-books were made in the last three days,
 * and how many are ready to publish" — and the second half is the one worth
 * testing. The illustration loop is deliberately forgiving, so a book with nine
 * pictures out of ten is saved, charged for, and *not* sendable. A report that
 * counts it as finished sends the owner to look at a book that prints with a
 * blank page.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  BOOK_PRODUCTS,
  EBOOK_STATS_ROW_CAP,
  MAX_WINDOW_DAYS,
  NOT_READY_SAMPLE,
  missingIllustrations,
  readinessOf,
  statsWindow,
  summariseEbooks,
  type EbookRow,
} from "../stats.ts";

const NOW = new Date("2026-09-01T02:00:00.000Z");
const WINDOW = statsWindow(3, NOW);

/** A whole page: words and a picture. */
const page = (n = 1) => ({ text: `page ${n}`, image: `/api/media/pic-${n}.png` });
/** A page whose illustration failed — the normal partial-failure case. */
const unillustrated = (n = 1) => ({ text: `page ${n}`, image: "" });

function row(over: Partial<EbookRow> = {}): EbookRow {
  return {
    id: over.id ?? "s1",
    title: over.title ?? "The Lantern Fox",
    product: over.product ?? "ebook",
    createdAt: over.createdAt ?? "2026-08-31T09:00:00.000Z",
    pages: over.pages ?? [page(1), page(2)],
  };
}

test("the book-bearing products are read from the registry, not listed by hand", () => {
  // The bundle counts because it produces the same e-book; the film does not.
  assert.deepEqual([...BOOK_PRODUCTS].sort(), ["bundle", "ebook"]);
});

test("a book is ready only when every page has both its words and its picture", () => {
  assert.equal(readinessOf([page(1), page(2)]), "ready");
  assert.equal(readinessOf([page(1), unillustrated(2)]), "incomplete");
  assert.equal(readinessOf([{ text: "   ", image: "/pic.png" }]), "incomplete", "a blank page is not a page");
  assert.equal(readinessOf([]), "empty");
});

test("missing illustrations are counted, not just detected", () => {
  assert.equal(missingIllustrations([page(1), unillustrated(2), unillustrated(3)]), 2);
  assert.equal(missingIllustrations([page(1)]), 0);
});

test("the window rolls back from the moment of asking", () => {
  assert.equal(WINDOW.days, 3);
  assert.equal(WINDOW.since, "2026-08-29T02:00:00.000Z");
  assert.equal(WINDOW.until, NOW.toISOString());
});

test("the window is clamped rather than trusted", () => {
  assert.equal(statsWindow(0, NOW).days, 1);
  assert.equal(statsWindow(-5, NOW).days, 1);
  assert.equal(statsWindow(Number.NaN, NOW).days, 1);
  assert.equal(statsWindow(2.7, NOW).days, 2, "part of a day is not a day");
  assert.equal(statsWindow(9000, NOW).days, MAX_WINDOW_DAYS);
});

test("made and readyToPublish are different numbers, and both are reported", () => {
  const stats = summariseEbooks(
    [
      row({ id: "a", pages: [page(1), page(2)] }),
      row({ id: "b", pages: [page(1), unillustrated(2)] }),
      row({ id: "c", product: "bundle", pages: [page(1)] }),
      row({ id: "d", pages: [] }),
    ],
    WINDOW,
  );

  assert.equal(stats.made, 4);
  assert.equal(stats.readyToPublish, 2, "only a and c print whole");
  assert.equal(stats.notReady, 2);
  assert.deepEqual(stats.byReadiness, { ready: 2, incomplete: 1, empty: 1 });
  assert.deepEqual(stats.byProduct, { ebook: 3, bundle: 1 });
  assert.equal(stats.pagesMissingIllustration, 1);
  assert.equal(stats.truncated, false);
});

test("a film is not a book", () => {
  const stats = summariseEbooks(
    [row({ id: "a" }), row({ id: "m", product: "movie", pages: [page(1)] })],
    WINDOW,
  );
  assert.equal(stats.made, 1);
  assert.equal(stats.byProduct.movie, undefined);
});

test("rows older than the window are not counted, whatever the query returned", () => {
  const stats = summariseEbooks(
    [row({ id: "in", createdAt: "2026-08-29T02:00:00.000Z" }), row({ id: "out", createdAt: "2026-08-28T23:59:59.000Z" })],
    WINDOW,
  );
  assert.equal(stats.made, 1, "the lower bound is inclusive, and nothing before it survives");
});

test("the unfinished books are named, so there is something to act on", () => {
  const stats = summariseEbooks([row({ id: "b", title: "Half a Fox", pages: [page(1), unillustrated(2)] })], WINDOW);
  assert.deepEqual(stats.notReadyBooks, [
    {
      id: "b",
      title: "Half a Fox",
      createdAt: "2026-08-31T09:00:00.000Z",
      readiness: "incomplete",
      pages: 2,
      pagesMissingIllustration: 1,
    },
  ]);
});

test("the named list is capped but the count is not", () => {
  const many = Array.from({ length: NOT_READY_SAMPLE + 5 }, (_, i) =>
    row({ id: `b${i}`, pages: [unillustrated(i)] }),
  );
  const stats = summariseEbooks(many, WINDOW);
  assert.equal(stats.notReady, NOT_READY_SAMPLE + 5);
  assert.equal(stats.notReadyBooks.length, NOT_READY_SAMPLE);
});

test("a quiet day appears as a zero rather than going missing", () => {
  const stats = summariseEbooks(
    [
      row({ id: "a", createdAt: "2026-08-30T10:00:00.000Z", pages: [page(1)] }),
      row({ id: "b", createdAt: "2026-08-30T20:00:00.000Z", pages: [unillustrated(1)] }),
      row({ id: "c", createdAt: "2026-09-01T01:00:00.000Z", pages: [page(1)] }),
    ],
    WINDOW,
  );

  // Three rolling days starting mid-morning span four UTC dates; the oldest is
  // a partial one, which is why `since` is reported alongside.
  assert.deepEqual(
    stats.byDay.map((d) => d.date),
    ["2026-08-29", "2026-08-30", "2026-08-31", "2026-09-01"],
  );
  assert.deepEqual(stats.byDay, [
    { date: "2026-08-29", made: 0, readyToPublish: 0 },
    { date: "2026-08-30", made: 2, readyToPublish: 1 },
    { date: "2026-08-31", made: 0, readyToPublish: 0 },
    { date: "2026-09-01", made: 1, readyToPublish: 1 },
  ]);
});

test("a book with an unreadable timestamp is still a book", () => {
  const stats = summariseEbooks([row({ id: "a" }), row({ id: "?", createdAt: "" })], WINDOW);
  assert.equal(stats.made, 2, "dropping it to keep the chart tidy would understate the total");
  assert.equal(stats.undated, 1);
  assert.equal(
    stats.byDay.reduce((n, d) => n + d.made, 0),
    1,
    "but it belongs to no day",
  );
});

test("hitting the row cap is reported, because the numbers are then a floor", () => {
  const capped = Array.from({ length: EBOOK_STATS_ROW_CAP }, (_, i) => row({ id: `s${i}` }));
  assert.equal(summariseEbooks(capped, WINDOW).truncated, true);
  assert.equal(summariseEbooks(capped.slice(0, -1), WINDOW).truncated, false);
});

test("no books is a clean zero, not an empty object", () => {
  const stats = summariseEbooks([], WINDOW);
  assert.equal(stats.made, 0);
  assert.equal(stats.readyToPublish, 0);
  assert.equal(stats.notReady, 0);
  assert.deepEqual(stats.byReadiness, { ready: 0, incomplete: 0, empty: 0 });
  assert.deepEqual(stats.notReadyBooks, []);
  assert.equal(stats.byDay.length, 4, "the days are still listed, all empty");
});
