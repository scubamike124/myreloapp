/**
 * Who counts as an adult, and why getting it wrong is expensive.
 *
 * `looksAdultOriented` does not only change the prose. The route passes the
 * same flag into every illustration prompt, where it used to emit "Do NOT turn
 * this adult into a child. Keep adult proportions and age." on a page being
 * drawn from a photograph of a six-year-old. So a false positive did not
 * produce a slightly-off story — it produced illustration instructions that
 * argued with the child's own photo, on every page, with no way for the parent
 * to turn it off.
 *
 * The word boundary is what did the damage: a hyphen is one, so "Spider-Man"
 * matched a bare `man`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { buildIllustrationPrompt, looksAdultOriented } from "../storybook-prompts.ts";

test("ordinary children's requests are not adult requests", () => {
  const childlike = [
    "A story about Milo meeting Spider-Man",
    "Emma and the gingerbread man run away",
    "A story about Iron Man visiting school",
    "Leo and his older brother build a treehouse",
    "Ava helps an old lady cross the road",
    "Building a snowman on the first day of winter",
    "Ruby finds a ladybug in the garden",
  ];
  for (const idea of childlike) {
    assert.equal(looksAdultOriented(idea, "Milo"), false, `wrongly flagged as adult: ${idea}`);
  }
});

test("genuinely adult requests are still recognised", () => {
  const adult = [
    "An older gentleman looking for a nice woman",
    "A story about my wife and our anniversary",
    "A romance between two neighbours",
    "Retirement, and what comes after it",
    "An elderly widower learning to cook",
    "A man who moves to a new city for work",
  ];
  for (const idea of adult) {
    assert.equal(looksAdultOriented(idea, "Harold"), true, `missed an adult request: ${idea}`);
  }
});

test("an older person in the story is not the same as an older person as the hero", () => {
  // Same words, different requests. The hero is who the request opens with.
  assert.equal(looksAdultOriented("Ava helps an old lady cross the road", "Ava"), false);
  assert.equal(looksAdultOriented("An old lady who paints the sea every morning", "Rose"), true);
  assert.equal(looksAdultOriented("Ben visits an old man next door", "Ben"), false);
  assert.equal(looksAdultOriented("An older man learning to swim", "Frank"), true);
});

test("a childlike phrase wins even when an adult phrase follows it", () => {
  // The allow-list is an early return rather than one condition among several,
  // so this cannot be re-flagged further down.
  assert.equal(looksAdultOriented("Ollie's older brother meets Spider-Man", "Ollie"), false);
});

test("the adult age instruction never fights an attached photograph", () => {
  const withPhoto = buildIllustrationPrompt({
    illustration: "standing on a hill",
    theme: "Explorer",
    pageText: "Up they went.",
    adultOriented: true,
    characterName: "Sam",
    hasPhoto: true,
  });
  // The photo is already ground truth. Repeating "keep adult proportions" is
  // redundant when the flag is right and harmful when it is wrong.
  assert.ok(!withPhoto.includes("Do NOT turn this adult into a child"));
  assert.match(withPhoto, /Match the age implied by the photograph/);

  const noPhoto = buildIllustrationPrompt({
    illustration: "standing on a hill",
    theme: "Explorer",
    pageText: "Up they went.",
    adultOriented: true,
    characterName: "Sam",
    appearance: "Sam, a grown adult, with short grey hair, a lined face, wearing a wool coat.",
    hasPhoto: false,
  });
  assert.match(noPhoto, /Do NOT turn this adult into a child/);
});

test("without a photo the description is named as the ground truth", () => {
  const prompt = buildIllustrationPrompt({
    illustration: "reading by a window",
    theme: "Wizard",
    pageText: "She read on.",
    adultOriented: false,
    characterName: "Mia",
    appearance: "Mia, a child, with curly dark hair, freckles, wearing a yellow raincoat.",
    hasPhoto: false,
  });
  // Saying "the attached photograph" when nothing is attached invites the model
  // to invent one.
  assert.ok(!prompt.includes("attached photograph"));
  assert.match(prompt, /looks exactly like this: Mia, a child/);
});
