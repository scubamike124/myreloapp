/**
 * Unit tests for storybook personalization prompt construction.
 * Run: node scripts/test-storybook-prompts.mjs
 */
import assert from "node:assert/strict";
import {
  buildIllustrationPrompt,
  buildStoryPrompt,
  looksAdultOriented,
  summarizeStorybookRequest,
} from "../src/lib/storybook-prompts.ts";

function test(name, fn) {
  try {
    fn();
    console.log("PASS", name);
  } catch (e) {
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}

const adultIdea = "An older gentleman looking for a nice woman";
const childIdea = "Being brave on the first day at a new school";

test("1. adult + romance + Wizard: topic is primary, not bedtime child template", () => {
  const prompt = buildStoryPrompt({
    characterName: "Harold",
    idea: adultIdea,
    theme: "Wizard",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 4,
  });
  assert.equal(looksAdultOriented(adultIdea, "Harold"), true);
  assert.match(prompt, /PRIMARY STORY REQUEST/);
  assert.match(prompt, /older gentleman looking for a nice woman/i);
  assert.match(prompt, /Wizard/);
  assert.match(prompt, /does NOT replace the story topic/i);
  assert.doesNotMatch(prompt, /child aged about 3 to 7/i);
  assert.doesNotMatch(prompt, /gentle bedtime picture-book story for a child/i);
  assert.match(prompt, /ADULT main character/i);
  // Role present but topic authoritative
  assert.match(prompt, /AUTHORITATIVE/);
});

test("2. child + bedtime preset: child-friendly path allowed", () => {
  const prompt = buildStoryPrompt({
    characterName: "Ava",
    idea: childIdea,
    theme: "Explorer",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 6,
  });
  assert.equal(looksAdultOriented(childIdea, "Ava"), false);
  assert.match(prompt, /first day at a new school/i);
  assert.doesNotMatch(prompt, /ADULT main character/);
});

test("3. adult + Detective: detective is costume only", () => {
  const prompt = buildStoryPrompt({
    characterName: "James",
    idea: "A retired detective solving one last neighbourhood mystery",
    theme: "Detective",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 4,
  });
  assert.equal(looksAdultOriented(prompt, "James") || looksAdultOriented("A retired detective solving one last neighbourhood mystery", "James"), true);
  assert.match(prompt, /retired detective/i);
  assert.match(prompt, /Detective/);
  assert.doesNotMatch(prompt, /child aged about 3 to 7/i);
});

test("4. custom typed topic with no preset wording", () => {
  const custom = "My uncle building a radio telescope in the attic";
  const prompt = buildStoryPrompt({
    characterName: "Uncle Ray",
    idea: custom,
    theme: "Astronaut",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 4,
  });
  assert.match(prompt, /radio telescope in the attic/i);
  assert.doesNotMatch(prompt, /Being brave on the first day/);
  assert.doesNotMatch(prompt, /red ball that rolls away/);
});

test("5. generated story prompt references submitted topic verbatim", () => {
  const idea = "An older gentleman looking for a nice woman";
  const prompt = buildStoryPrompt({
    characterName: "Walter",
    idea,
    theme: "Wizard",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 4,
  });
  assert.ok(prompt.includes(`"${idea}"`));
  const summary = summarizeStorybookRequest({
    characterName: "Walter",
    idea,
    theme: "Wizard",
    languageName: "English",
    languageEndonym: "English",
    pageCount: 4,
  });
  assert.equal(summary.idea, idea);
  assert.equal(summary.theme, "Wizard");
  assert.equal(summary.adultOriented, true);
});

test("6. illustration prompt preserves photo identity / adult age", () => {
  const img = buildIllustrationPrompt({
    illustration: "The main character tips his wizard hat to a kind woman in a garden",
    theme: "Wizard",
    pageText: "Walter met someone wonderful.",
    adultOriented: true,
  });
  assert.match(img, /attached photograph is the main character/i);
  assert.match(img, /Do NOT turn this adult into a child/i);
  assert.match(img, /approximate age/);
  assert.match(img, /Wizard/i);
  assert.match(img, /Page text/);
  assert.doesNotMatch(img, /The child in the attached photograph/i);
  assert.doesNotMatch(img, /cosy bedtime mood/);
});

test("7. child illustration path does not force adult language", () => {
  const img = buildIllustrationPrompt({
    illustration: "The main character waves at the school gate",
    theme: "Explorer",
    pageText: "Ava took a deep breath.",
    adultOriented: false,
  });
  assert.match(img, /attached photograph is the main character/i);
  assert.doesNotMatch(img, /Do NOT turn this adult into a child/);
});

if (!process.exitCode) console.log("\nAll storybook prompt tests passed.");
