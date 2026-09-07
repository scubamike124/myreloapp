/**
 * Counting e-books.
 *
 * The failure this guards against is not a crash — it is a confident wrong
 * number. Every value in these rows arrives in a different shape depending on
 * which database answered (postgres hands back a real boolean and a bigint
 * *string*; sqlite hands back 0/1 and a number), and the window boundary has
 * to compare correctly against three different stored timestamp formats. A
 * mistake in either place produces a plausible-looking count that is simply
 * false, which is worse than an error, because Amber would then state it to
 * the owner as fact.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WINDOW_DAYS,
  EBOOK_TOOL_SLUGS,
  MAX_WINDOW_DAYS,
  clampDays,
  isOk,
  rowCount,
  summarizeEbookCounts,
  windowStart,
} from "../ai/ebook-counts.ts";
import { classifyAmberMode } from "../amber/intent.ts";

const NOW = new Date("2026-09-07T10:30:00.000Z");

test("a 7-day window starts six days back — today plus the six before it", () => {
  assert.equal(windowStart(7, NOW), "2026-09-01");
});

test("a 1-day window is today only", () => {
  assert.equal(windowStart(1, NOW), "2026-09-07");
});

test("the window boundary crosses a month and a year end correctly", () => {
  assert.equal(windowStart(7, new Date("2026-03-03T00:00:00.000Z")), "2026-02-25");
  assert.equal(windowStart(7, new Date("2027-01-02T23:59:59.000Z")), "2026-12-27");
});

test("the boundary is a bare date, which is what both sqlite timestamp formats compare against", () => {
  // stories.created_at on sqlite is a full ISO string; command_center_usage's
  // is `datetime('now')` text. Both must sort at or after the boundary on the
  // first day of the window, or that day is silently dropped.
  const since = windowStart(7, NOW);
  assert.match(since, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok("2026-09-01T00:00:00.000Z" >= since);
  assert.ok("2026-09-01 00:00:00" >= since);
  assert.ok(!("2026-08-31T23:59:59.999Z" >= since));
});

test("clampDays falls back to a week for anything unusable and caps the range", () => {
  assert.equal(clampDays(undefined), DEFAULT_WINDOW_DAYS);
  assert.equal(clampDays("not a number"), DEFAULT_WINDOW_DAYS);
  assert.equal(clampDays(0), DEFAULT_WINDOW_DAYS);
  assert.equal(clampDays(-4), DEFAULT_WINDOW_DAYS);
  assert.equal(clampDays(3), 3);
  assert.equal(clampDays("30"), 30);
  assert.equal(clampDays(10_000), MAX_WINDOW_DAYS);
});

test("isOk reads success from either dialect, and only from a real success", () => {
  for (const truthy of [true, 1, "1", "t", "true"]) assert.equal(isOk(truthy), true, String(truthy));
  for (const falsy of [false, 0, "0", "f", "false", null, undefined]) {
    assert.equal(isOk(falsy), false, String(falsy));
  }
});

test("rowCount reads postgres's bigint string as well as sqlite's number", () => {
  assert.equal(rowCount("3"), 3);
  assert.equal(rowCount(3), 3);
  assert.equal(rowCount(0), 0);
  assert.equal(rowCount(null), 0);
  assert.equal(rowCount("nonsense"), 0);
});

test("counts Amber's own books per tool, keeping failed attempts out of the total", () => {
  const counts = summarizeEbookCounts(
    [
      { toolName: "bedtime-storybook", ok: true, n: "4" },
      { toolName: "bedtime-storybook", ok: false, n: "1" },
      { toolName: "ai-story-maker", ok: 1, n: 2 },
    ],
    [],
    { days: 7, since: "2026-09-01" },
  );

  assert.equal(counts.amberMade, 6);
  assert.equal(counts.amberFailed, 1);
  assert.deepEqual(counts.amberByTool, [
    { tool: "bedtime-storybook", made: 4, failed: 1 },
    { tool: "ai-story-maker", made: 2, failed: 0 },
  ]);
});

test("tool runs that are not e-books are not counted as e-books", () => {
  const counts = summarizeEbookCounts(
    [
      { toolName: "commercial-director", ok: true, n: 9 },
      { toolName: "shorts-20", ok: true, n: 20 },
      { toolName: null, ok: true, n: 3 },
      { toolName: "bedtime-storybook", ok: true, n: 1 },
    ],
    [],
    { days: 7, since: "2026-09-01" },
  );

  assert.equal(counts.amberMade, 1);
});

test("a bundle counts as a customer e-book; a movie does not", () => {
  const counts = summarizeEbookCounts(
    [],
    [
      { product: "ebook", n: "5" },
      { product: "bundle", n: "2" },
      { product: "movie", n: "8" },
    ],
    { days: 7, since: "2026-09-01" },
  );

  assert.equal(counts.customerMade, 7);
  assert.deepEqual(counts.customerByProduct, [
    { product: "ebook", made: 5 },
    { product: "bundle", made: 2 },
  ]);
});

test("Amber's own books and customers' books stay separate — the two are never summed", () => {
  const counts = summarizeEbookCounts(
    [{ toolName: "bedtime-storybook", ok: true, n: 3 }],
    [{ product: "ebook", n: 11 }],
    { days: 7, since: "2026-09-01" },
  );

  assert.equal(counts.amberMade, 3);
  assert.equal(counts.customerMade, 11);
  assert.ok(!Object.values(counts).includes(14));
});

test("nothing made in the window reports zero, not a missing figure", () => {
  const counts = summarizeEbookCounts([], [], { days: 7, since: "2026-09-01" });

  assert.equal(counts.amberMade, 0);
  assert.equal(counts.amberFailed, 0);
  assert.equal(counts.customerMade, 0);
  // Every known e-book tool is still listed, so "0" is visibly a count.
  assert.deepEqual(
    counts.amberByTool.map((t) => t.tool),
    [...EBOOK_TOOL_SLUGS],
  );
});

/**
 * The other half of answering this question is not answering it with a build.
 * src/lib/amber/intent.test.ts covers the classifier generally, but it sits
 * outside the glob `npm test` runs — and this exact sentence is the one that
 * went wrong live, so it gets a case in a file that actually executes.
 */
test("asking how many e-books were made is a question, on both surfaces", () => {
  const asked = "Can you see how many ebooks Amber made in the last 7 days";
  assert.equal(classifyAmberMode(asked, [], { surface: "general" }), "conversation");
  assert.equal(classifyAmberMode(asked, [], { surface: "amber-fix" }), "conversation");
});

test("the window it counted is reported back, so the answer can state it", () => {
  const counts = summarizeEbookCounts([], [], { days: 7, since: "2026-09-01" });
  assert.equal(counts.days, 7);
  assert.equal(counts.since, "2026-09-01");
  assert.match(counts.note, /whole UTC days/);
});
