/**
 * The permanent character record.
 *
 * "Parents should not need to upload another picture unless they want to update
 * it" — and, more importantly, the child must look the same in story five as in
 * story one. Drift between stories is the thing a parent notices first and the
 * fastest way to lose them.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { appearancePrompt, applyBibleUpdate, isUsable, type CharacterBible } from "../character-bible.ts";

const bible = (over: Partial<CharacterBible> = {}): CharacterBible => ({
  id: "cb1",
  userId: "u1",
  name: "Luna",
  ageBand: "6-8",
  face: "round face with freckles",
  hair: "curly dark brown hair to her shoulders",
  clothing: "a yellow raincoat and red boots",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
  ...over,
});

test("the same bible always produces the same description", () => {
  // The whole point. Two stories a year apart must hand the illustrator an
  // identical sentence, which is why this is concatenation and not a model
  // summarising the bible.
  const b = bible();
  assert.equal(appearancePrompt(b), appearancePrompt(b));
  assert.equal(appearancePrompt(bible()), appearancePrompt(bible()));
});

test("the description carries what the illustrator needs", () => {
  const prompt = appearancePrompt(bible());
  for (const fragment of ["Luna", "curly dark brown hair", "round face with freckles", "yellow raincoat"]) {
    assert.ok(prompt.includes(fragment), `the prompt lost "${fragment}": ${prompt}`);
  }
});

test("a chosen art style is part of the description, so a series stays one style", () => {
  const prompt = appearancePrompt(bible({ animationStyle: "soft watercolour" }));
  assert.match(prompt, /soft watercolour/);
});

test("a bible without an appearance cannot illustrate anything", () => {
  assert.equal(isUsable(bible()), true);
  assert.equal(isUsable({ name: "Luna" }), false);
  assert.equal(isUsable(bible({ hair: "   " })), false, "whitespace is not a description");
});

test("a partial update never blanks the rest of the character", () => {
  // Parents edit one thing. Losing the rest would silently change the child
  // everywhere, which is worse than refusing the edit.
  const before = bible();
  const after = applyBibleUpdate(before, { hair: "short blonde hair" }, new Date("2026-06-01"));
  assert.equal(after.hair, "short blonde hair");
  assert.equal(after.face, before.face);
  assert.equal(after.clothing, before.clothing);
  assert.equal(after.name, before.name);
});

test("empty values in an update are ignored rather than applied", () => {
  const after = applyBibleUpdate(bible(), { clothing: "", face: undefined }, new Date());
  assert.equal(after.clothing, "a yellow raincoat and red boots");
  assert.equal(after.face, "round face with freckles");
});

test("changing the appearance bumps the version a story pins to", () => {
  // A story records which version drew it, so "why does book three look
  // different?" has an answer.
  const after = applyBibleUpdate(bible(), { hair: "short blonde hair" }, new Date());
  assert.equal(after.version, 2);
});

test("changing something that is not the appearance does not bump it", () => {
  // Renaming or adjusting personality does not invalidate existing artwork, and
  // bumping would imply the drawings are stale when they are not.
  const after = applyBibleUpdate(bible(), { personality: ["brave", "curious"] }, new Date());
  assert.equal(after.version, 1);
  assert.deepEqual(after.personality, ["brave", "curious"]);
});

test("identity fields cannot be overwritten by an update", () => {
  const after = applyBibleUpdate(
    bible(),
    { name: "Luna Rose" } as never,
    new Date(),
  );
  assert.equal(after.id, "cb1");
  assert.equal(after.userId, "u1");
  assert.equal(after.createdAt, "2026-01-01T00:00:00.000Z");
});
