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

/**
 * The source funnel on the same page.
 *
 * Every activity figure this page used to show was reading far higher than
 * the truth: `jobsDiscoveredLifetime` added each raw record on each search,
 * so a 37-listing board reported 46,293 "jobs discovered" and 129,766 across
 * three sources stood against 279 distinct opportunities.
 */
describe("the source funnel is on the page the owner reads", () => {
  it("renders one funnel section fed from HQ", () => {
    const src = panel();
    assert.equal((src.match(/<SourceFunnel\b/g) ?? []).length, 1);
    assert.match(src, /nationwide\?\.yieldReport/);
    assert.match(bridge(), /extractYieldReport/);
  });

  it("shows records fetched beside distinct opportunities, never one alone", () => {
    const src = panel();
    assert.match(src, /Records fetched/);
    assert.match(src, /Distinct opportunities/);
  });

  it("says 'fetching is not discovery' when the ratio is absurd", () => {
    assert.match(panel(), /Fetching is not discovery/);
  });

  it("renders an unmeasured counter as unmeasured, not as zero", () => {
    // A source with 46,293 fetches and "0 duplicates suppressed" would read
    // as perfectly efficient, which is the opposite of the truth.
    const src = panel();
    const fig = src.slice(src.indexOf("function SourceFunnel"), src.indexOf("function OwnerActions"));
    assert.match(fig, /v === null \? <span style=\{\{ color: muted \}\}>not measured<\/span>/);
  });

  it("surfaces the idle and duplicate-scout counts", () => {
    const src = panel();
    assert.match(src, /Never ran/);
    assert.match(src, /found by more than one scout/);
  });

  it("puts verified revenue last, as the only column that counts", () => {
    const src = panel();
    const section = src.slice(src.indexOf("function SourceFunnel"), src.indexOf("function OwnerActions"));
    assert.ok(
      section.indexOf("Records fetched") < section.indexOf("Verified revenue"),
      "effort reads left of money",
    );
  });

  it("does not re-derive the funnel on the client", () => {
    const section = panel().slice(panel().indexOf("function SourceFunnel"), panel().indexOf("function OwnerActions"));
    assert.ok(!/\.reduce\(/.test(section.replace(/\/\*[\s\S]*?\*\//g, "")), "HQ computes it from both systems of record");
  });
});

/**
 * Specialty markets on the same page.
 *
 * Every headline this system has produced has been advertised value: a
 * $54,000 capability gap that was eight competitions Amber cannot enter,
 * $4,582 of specialty demand with $0 reachable. Advertised value alone is
 * how a pipeline looks healthy at $0.00 revenue.
 */
describe("advertised value never appears without obtainable beside it", () => {
  const section = () => {
    const src = panel();
    return src.slice(src.indexOf("function SpecialtyCenter"), src.indexOf("function SourceFunnel"));
  };

  it("renders one specialty section fed from HQ", () => {
    const src = panel();
    assert.equal((src.match(/<SpecialtyCenter\b/g) ?? []).length, 1);
    assert.match(src, /nationwide\?\.laneReport/);
    assert.match(src, /nationwide\?\.growthReport/);
    assert.match(bridge(), /extractLaneReport/);
    assert.match(bridge(), /extractGrowthReport/);
  });

  it("shows both value figures in every place either appears", () => {
    const s = section();
    assert.match(s, /Advertised/);
    assert.match(s, /Obtainable/);
    assert.ok(
      s.indexOf("Advertised") < s.indexOf("Obtainable"),
      "obtainable reads to the right of advertised, in the stronger position",
    );
  });

  it("gives obtainable the visual weight and advertised the muted style", () => {
    const s = section();
    assert.match(s, /advertisedValueUsd\)\}\s*\n?\s*<\/td>/);
    assert.match(s, /font-bold tabular-nums text-gray-900">\s*\n?\s*\{money\(l\.obtainableValueUsd\)\}/);
  });

  it("explains that an unpriced opportunity is in no lane", () => {
    assert.match(section(), /unknown, not cheap/);
  });

  it("states plainly when nothing is worth building", () => {
    assert.match(section(), /Nothing is worth building yet/);
  });

  it("names the four conditions rather than just refusing", () => {
    const s = section();
    assert.match(s, /more than one buyer/);
    assert.match(s, /economics that survive the win rate/);
    assert.match(s, /eligibility path that exists/);
  });

  it("shows each decision with the reason it was blocked", () => {
    // The decision alone invites "why not build it?" — the reason answers
    // that before it is asked.
    const s = section();
    assert.match(s, /c\.blockedBy\.map/);
    assert.match(s, /Blocked:/);
  });

  it("labels an assumed win probability on screen", () => {
    assert.match(section(), /an assumption, not a measurement/);
  });

  it("does not compute any of it on the client", () => {
    const s = section().replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/\.reduce\(/.test(s), "HQ computes these from both systems of record");
  });
});
