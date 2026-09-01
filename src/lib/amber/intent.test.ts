import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyAmberMode, isAmberFixWorkIntent } from "./intent.ts";

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
});
