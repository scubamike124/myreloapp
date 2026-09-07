// ---------------------------------------------------------------------------
// Read-only content counts for the owner's Amber turn.
//
// Confirmed live and written into the persona already: "how many e-books were
// made in the last 3 days" got queued as a *coding task* instead of answered,
// because a count question is not a change request and Amber had no tool that
// could see the number. The persona's instruction for that case is to check a
// real tool or say plainly that the data source isn't connected — this is the
// real tool. It only ever SELECTs; nothing here writes, charges, or generates.
//
// Two sources, deliberately reported apart rather than added together:
//
//   Amber's own books  — command_center_usage, the ledger every Command Center
//     tool call already writes (src/lib/ai/cost.ts). It is the only record
//     that a Command Center storybook happened at all: generateStorybookSync
//     returns the book to the conversation and does not save a `stories` row.
//   Customers' books   — the `stories` table, platform-wide. Aggregate counts
//     only; no titles, no user ids, nothing about a particular child.
//
// The arithmetic and the window boundary live in ebook-counts.ts, which has no
// database import and is unit-tested.
// ---------------------------------------------------------------------------

import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import {
  clampDays,
  summarizeEbookCounts,
  windowStart,
  type EbookCounts,
  type StoryCountRow,
  type UsageCountRow,
} from "@/lib/ai/ebook-counts";

async function q() {
  if (!dbConfigured()) return null;
  const query = await sqlAsync();
  if (!query || !(await ensureSchema())) return null;
  return query;
}

export type EbookCountResult =
  | ({ ok: true; unavailable?: string[] } & EbookCounts)
  | { ok: false; error: string };

/**
 * How many e-books were made in the last `days` whole UTC days.
 *
 * The two queries are attempted independently: an older database that predates
 * one of the tables should cost that half of the answer, not the whole thing,
 * and whatever failed is named in `unavailable` so the answer can say which
 * number is missing instead of quietly reporting a low total as fact.
 */
export async function countEbooksMade(days?: unknown): Promise<EbookCountResult> {
  const window = { days: clampDays(days), since: "" };
  window.since = windowStart(window.days);

  const query = await q();
  if (!query) {
    return {
      ok: false,
      error:
        "No database is reachable from this deploy, so there is no e-book count to read (DATABASE_URL is unset or unreachable).",
    };
  }

  const unavailable: string[] = [];

  let usage: UsageCountRow[] = [];
  try {
    usage = (await query`
      SELECT tool_name AS "toolName", ok, COUNT(*) AS n
      FROM command_center_usage
      WHERE kind = 'tool' AND created_at >= ${window.since}
      GROUP BY tool_name, ok`) as UsageCountRow[];
  } catch (e) {
    unavailable.push(`Amber's own runs: ${e instanceof Error ? e.message : "query failed"}`);
  }

  let stories: StoryCountRow[] = [];
  try {
    stories = (await query`
      SELECT product, COUNT(*) AS n
      FROM stories
      WHERE created_at >= ${window.since}
      GROUP BY product`) as StoryCountRow[];
  } catch (e) {
    unavailable.push(`Customer books: ${e instanceof Error ? e.message : "query failed"}`);
  }

  if (unavailable.length === 2) {
    return { ok: false, error: `Could not read either source — ${unavailable.join("; ")}` };
  }

  const counts = summarizeEbookCounts(usage, stories, window);
  return unavailable.length ? { ok: true, ...counts, unavailable } : { ok: true, ...counts };
}
