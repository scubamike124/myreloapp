/**
 * The fifteen adventures, and the occasions that layer onto them.
 *
 * These are mostly checks that the data is complete rather than that logic is
 * correct, which is the point: the categories ARE the feature. A category with
 * no guidance produces a generic story wearing a costume, and nothing else in
 * the system would notice.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  SEASONAL_STORIES,
  STORY_CATEGORIES,
  categoryGuidance,
  getCategory,
  inSeason,
  seasonalNow,
  suggestedTitle,
} from "../categories.ts";

test("the fifteen adventures the directive asked for are all present", () => {
  assert.equal(STORY_CATEGORIES.length, 15);
  for (const id of [
    "princess",
    "superhero",
    "space",
    "dinosaur",
    "pirate",
    "fairy",
    "unicorn",
    "mermaid",
    "dragon",
    "wizard",
    "jungle",
    "detective",
    "wild-west",
    "race-car",
    "winter-kingdom",
  ]) {
    assert.ok(getCategory(id), `missing category: ${id}`);
  }
});

test("every category can actually direct a story", () => {
  for (const c of STORY_CATEGORIES) {
    assert.ok(c.emoji.length > 0, `${c.id} has no emoji`);
    assert.ok(c.blurb.length > 10, `${c.id} has no blurb`);
    // A category whose guidance is a description rather than an instruction
    // produces a paragraph about the genre instead of a story in it.
    assert.ok(c.guidance.length > 40, `${c.id} guidance is too thin to shape a story`);
    assert.ok(c.seriesTitles.length >= 4, `${c.id} cannot sustain a series`);
  }
});

test("ids and names are unique, so a picker cannot show the same thing twice", () => {
  assert.equal(new Set(STORY_CATEGORIES.map((c) => c.id)).size, 15);
  assert.equal(new Set(STORY_CATEGORIES.map((c) => c.name)).size, 15);
});

test("the seven occasions the directive asked for are all present", () => {
  for (const id of ["christmas", "halloween", "birthday", "easter", "summer", "back-to-school", "valentines"]) {
    assert.ok(
      SEASONAL_STORIES.some((s) => s.id === id),
      `missing occasion: ${id}`,
    );
  }
});

test("occasions are offered when they are relevant", () => {
  const october = new Date(Date.UTC(2026, 9, 15));
  const ids = seasonalNow(october).map((s) => s.id);
  assert.ok(ids.includes("halloween"));
  assert.ok(!ids.includes("christmas"));
});

test("a birthday is available on any day of the year", () => {
  const birthday = SEASONAL_STORIES.find((s) => s.id === "birthday");
  assert.ok(birthday);
  for (const month of [0, 3, 6, 9]) {
    assert.ok(inSeason(birthday, new Date(Date.UTC(2026, month, 1))), `not offered in month ${month + 1}`);
  }
});

test("summer moves to the other half of the year in the southern hemisphere", () => {
  const summer = SEASONAL_STORIES.find((s) => s.id === "summer");
  assert.ok(summer);
  const january = new Date(Date.UTC(2026, 0, 15));
  assert.equal(inSeason(summer, january, "north"), false);
  assert.equal(inSeason(summer, january, "south"), true);
});

test("a fixed date does not move hemisphere", () => {
  const christmas = SEASONAL_STORIES.find((s) => s.id === "christmas");
  assert.ok(christmas);
  const december = new Date(Date.UTC(2026, 11, 20));
  assert.equal(inSeason(christmas, december, "south"), true);
});

test("guidance combines the adventure and the occasion without either winning", () => {
  const text = categoryGuidance("princess", "christmas");
  assert.match(text, /Princess/);
  assert.match(text, /Christmas/);
  // The parent's own request outranks both — the prompt builder places it
  // above, and this line stops the model resolving the tie the other way.
  assert.match(text, /does not replace what the parent asked for/);
});

test("no category and no occasion means no extra instruction at all", () => {
  assert.equal(categoryGuidance("", undefined), "");
  assert.equal(categoryGuidance("not-a-category"), "");
});

test("sequel titles are suggested in order and then cycle", () => {
  assert.equal(suggestedTitle("princess", 1), "The Lost Crown");
  assert.equal(suggestedTitle("princess", 4), "Royal Rescue");
  // Rather than running out: a series is meant to support "unlimited sequels".
  assert.equal(suggestedTitle("princess", 5), "The Lost Crown");
  assert.equal(suggestedTitle("not-a-category", 1), "");
});
