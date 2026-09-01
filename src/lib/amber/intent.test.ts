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
});
