/**
 * Moved here from src/lib/amber/intent.test.ts, which sat outside the glob
 * `npm test` actually runs (src/lib/__tests__/*.test.ts only) and so never
 * executed in CI. That mattered: this classifier is the exact thing that
 * failed live on "Can you see how many ebooks Amber made in the last 7
 * days" — it auto-queued a real coding task (5 files changed, a PR opened
 * and merged) to answer what should have been a read-only lookup. A
 * dedicated regression file for that classifier that nothing ever ran is
 * worse than no file at all, because it looks like coverage.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyAmberMode, isAmberFixWorkIntent } from "../amber/intent.ts";

describe("classifyAmberMode amber-fix", () => {
  it("treats a clear Relo copy/UI objective as execution", () => {
    const mode = classifyAmberMode(
      "On the Reelo Business Center page, update the Amber Fix card so it says she inspects the repo and ships the work herself — don't ask me which sentence to change.",
      [],
      { surface: "amber-fix" },
    );
    assert.equal(mode, "execution");
  });

  it("keeps creative video asks as conversation", () => {
    const mode = classifyAmberMode("Can you make a video?", [], { surface: "amber-fix" });
    assert.equal(mode, "conversation");
  });

  it("keeps vague what-should-we questions as conversation", () => {
    const mode = classifyAmberMode("What should we repair first?", [], { surface: "amber-fix" });
    assert.equal(mode, "conversation");
  });
});

describe("isAmberFixWorkIntent", () => {
  it("treats the exact production fail phrase as work", () => {
    assert.equal(isAmberFixWorkIntent("Can you change one line on Reelo for me?"), true);
  });

  it("does not treat creative video asks as work", () => {
    assert.equal(isAmberFixWorkIntent("Can you make a video?"), false);
  });

  // Regression: confirmed live, this exact question got auto-queued as a
  // coding task on Amber Fixes -- purely because "publish" is an EXEC_VERB
  // and the sentence was long, with nothing checking that any product or
  // codebase was actually being referenced.
  it("does not treat an e-book status question as work, even though it contains 'publish'", () => {
    assert.equal(
      isAmberFixWorkIntent(
        "Can you see how many e book were made in the last 3 days and how many are ready for publish",
      ),
      false,
    );
  });

  it("does not treat other informational questions containing execution-shaped words as work", () => {
    assert.equal(isAmberFixWorkIntent("How many jobs are still pending, and what's the status of the queue?"), false);
    assert.equal(isAmberFixWorkIntent("What's our current earnings, and how many opportunities are in the pipeline?"), false);
  });

  it("still treats a real fix request phrased as a question as work", () => {
    assert.equal(isAmberFixWorkIntent("Can you fix the broken navbar button on the homepage?"), true);
  });

  // Regression: this is the second live incident, and the reason this file
  // now runs at all. Same failure shape as the "publish" case above, in the
  // wild again with different wording — which is exactly why the fix has to
  // be structural (this classifier is the one thing actually consulted at
  // every entry point, see amber-fix-composer-gate.test.ts) rather than one
  // more regex patch aimed at one more sentence.
  it("does not treat 'how many ebooks were made' as work — the exact sentence that shipped PR #117", () => {
    assert.equal(isAmberFixWorkIntent("Can you see how many ebooks Amber made in the last 7 days"), false);
    assert.equal(isAmberFixWorkIntent("Check how many e-books Amber made in the last seven days"), false);
  });

  it("does not treat other ordinary business-status questions as work", () => {
    assert.equal(isAmberFixWorkIntent("How many customers signed up this week?"), false);
    assert.equal(isAmberFixWorkIntent("What's our current inventory of avatar templates?"), false);
    assert.equal(isAmberFixWorkIntent("Is the Stripe API responding normally right now?"), false);
    assert.equal(isAmberFixWorkIntent("What activity happened on the account in the last 24 hours?"), false);
    assert.equal(isAmberFixWorkIntent("How many businesses are on the Forma waitlist?"), false);
  });
});
