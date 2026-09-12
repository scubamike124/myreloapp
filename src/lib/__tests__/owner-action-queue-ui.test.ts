/**
 * ONE owner action queue on the Amber Earnings page.
 *
 * The page carried two owner lists of different shapes, three sections deep:
 * "Owner Action Queue (HQ)" from the government lane and "Owner Actions
 * Needed (marketplaces)" from a raw per-platform field. Neither was ranked by
 * what clearing the item would unlock, so the one thing worth twenty minutes
 * of the owner's time had no way to rise above a seller signup on a Polish
 * e-commerce site.
 *
 * These read the source rather than rendering it, which is what the rest of
 * this suite does — the assertions worth making here are structural: that
 * there is one queue and not two, that it comes from HQ rather than being
 * re-derived, and that the honest-empty cases are actually written.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const PANEL = "src/components/business/AmberEarningsPanel.tsx";
const BRIDGE = "src/lib/amber-earnings/hq-nationwide.ts";

const panel = () => fs.readFileSync(PANEL, "utf8");
const bridge = () => fs.readFileSync(BRIDGE, "utf8");

describe("there is one queue, not two", () => {
  it("no longer renders the two old owner lists", () => {
    const src = panel();
    const rendered = src.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/Owner Action Queue \(HQ\)/.test(rendered), "the government-lane list must be gone");
    assert.ok(!/Owner Actions Needed \(marketplaces\)/.test(rendered), "the raw per-marketplace list must be gone");
  });

  it("renders exactly one Owner Actions section", () => {
    const matches = panel().match(/<OwnerActions\b/g) ?? [];
    assert.equal(matches.length, 1);
  });

  it("stops reading the raw hqOwnerSteps field for display", () => {
    const rendered = panel().replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/nationwide\.hqOwnerSteps/.test(rendered), "the consolidated queue replaces it");
  });
});

describe("the queue comes from HQ, not from this page", () => {
  it("reads ownerActionQueue off the snapshot", () => {
    assert.match(bridge(), /extractOwnerActionQueue/);
    assert.match(bridge(), /snapshot\.ownerActionQueue/);
    assert.match(panel(), /nationwide\?\.ownerActionQueue/);
  });

  it("does not re-rank or re-merge on the client", () => {
    // Two places computing "what is waiting on the owner" can disagree, and
    // the one that disagrees is always the one being looked at.
    const src = panel();
    const component = src.slice(src.indexOf("function OwnerActions"));
    assert.ok(!/\.sort\(/.test(component), "ranking belongs to HQ");
    assert.ok(!/dedupe|consolidat/i.test(component.replace(/\/\*[\s\S]*?\*\//g, "")), "merging belongs to HQ");
  });

  it("carries the shortest-path answer through as well", () => {
    assert.match(bridge(), /extractShortestPath/);
    assert.match(panel(), /nationwide\?\.shortestPath/);
  });
});

describe("the honest cases are actually written", () => {
  it("says nothing is waiting rather than rendering an empty space", () => {
    assert.match(panel(), /Nothing is waiting on you/);
  });

  it("shows 'nothing is available to attempt' as the answer it is", () => {
    // Today's true state: competitions Amber cannot win, buyers who are not
    // people, and a paused marketplace.
    assert.match(panel(), /Nothing is available to attempt right now/);
  });

  it("labels an assumed win rate on screen", () => {
    assert.match(panel(), /assumed, not measured/);
  });

  it("counts the sources it held back instead of hiding them", () => {
    const src = panel();
    assert.match(src, /notPayers/);
    assert.match(src, /held back/);
    assert.match(src, /would not put money in your bank/);
  });
});

describe("a blocking item is visibly a blocking item", () => {
  it("marks and colours the ones that stop money moving", () => {
    const src = panel();
    assert.match(src, /blocks money/);
    assert.match(src, /revenueBlockingCount/);
  });

  it("shows the exact steps rather than a vague instruction", () => {
    assert.match(panel(), /a\.exactSteps\.map/);
  });

  it("links where to click", () => {
    assert.match(panel(), /a\.whereToClick/);
  });
});
