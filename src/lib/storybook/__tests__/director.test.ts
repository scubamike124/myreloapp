/**
 * The quality gate.
 *
 * The directive says "do not deliver low-quality productions", which is a
 * promise about what happens when the check is uncertain. So the tests that
 * matter here are the ones about failure: a half-answer from the reviewer, a
 * good average hiding a broken hero, a rewrite loop with no end.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  CRITERIA,
  MAX_ATTEMPTS,
  NON_NEGOTIABLE,
  NON_NEGOTIABLE_FLOOR,
  THRESHOLD,
  judge,
  readScores,
  rewriteBrief,
  verdictSummary,
} from "../director.ts";
import { MAX_SCENES, buildMoviePrompt, buildScenePrompt, isRenderable, planSeconds, readPlan } from "../movie-plan.ts";

const allAt = (n: number) => readScores(Object.fromEntries(CRITERIA.map((c) => [c, n])));

test("the eight criteria the directive named are the ones scored", () => {
  assert.deepEqual([...CRITERIA], [
    "storyQuality",
    "hook",
    "emotionalPacing",
    "cameraMovement",
    "visualConsistency",
    "characterConsistency",
    "educationalValue",
    "entertainmentValue",
  ]);
});

test("a good plan is approved", () => {
  const v = judge(allAt(8));
  assert.equal(v.approved, true);
  assert.equal(v.failed.length, 0);
});

test("a plan exactly at the bar is approved — the threshold is a bar, not a hurdle", () => {
  assert.equal(judge(allAt(THRESHOLD)).approved, true);
});

test("a missing score is a zero, so half an answer fails rather than passes", () => {
  // The failure mode of a quality check must be "rejected", never "approved by
  // accident" — a reviewer that returns four of eight numbers is not evidence
  // that the film is good.
  const partial = readScores({ storyQuality: 9, hook: 9, emotionalPacing: 9, cameraMovement: 9 });
  const v = judge(partial);
  assert.equal(v.approved, false);
  assert.ok(v.failed.includes("characterConsistency"));
});

test("nonsense from the reviewer scores zero rather than throwing", () => {
  const v = judge(readScores({ storyQuality: "excellent", hook: null, emotionalPacing: NaN }));
  assert.equal(v.approved, false);
  assert.equal(v.scores.storyQuality, 0);
});

test("scores are clamped, so a reviewer cannot award itself 100", () => {
  const v = readScores({ ...Object.fromEntries(CRITERIA.map((c) => [c, 100])), hook: -5 });
  assert.equal(v.storyQuality, 10);
  assert.equal(v.hook, 0);
});

test("a strong average does not rescue an inconsistent character", () => {
  // The one failure a parent notices immediately, and the reason the character
  // bible exists at all.
  const scores = allAt(10);
  scores.characterConsistency = 4;
  const v = judge(scores);
  assert.equal(v.approved, false);
  assert.ok(v.blocking.includes("characterConsistency"));
  assert.ok(v.average > THRESHOLD, "the average is still high — that is the point of the test");
});

test("both non-negotiables are enforced at their own floor", () => {
  for (const c of NON_NEGOTIABLE) {
    const scores = allAt(10);
    scores[c] = NON_NEGOTIABLE_FLOOR - 1;
    assert.equal(judge(scores).approved, false, `${c} below its floor should block`);
  }
});

test("the rewrite brief names what failed instead of asking for better", () => {
  const scores = allAt(9);
  scores.hook = 3;
  scores.emotionalPacing = 5;
  const brief = rewriteBrief(judge(scores, "The opening is flat."));
  assert.match(brief, /Hook \(scored 3\/10\)/);
  assert.match(brief, /Emotional pacing \(scored 5\/10\)/);
  assert.match(brief, /The opening is flat\./);
  // Worst first: with only three attempts, the rewrite should lead with the
  // thing most likely to be the reason it failed.
  assert.ok(brief.indexOf("Hook") < brief.indexOf("Emotional pacing"));
  assert.match(brief, /Do not restart the story/);
});

test("an approved plan gets no rewrite brief", () => {
  assert.equal(rewriteBrief(judge(allAt(9))), "");
});

test("the retry loop is finite", () => {
  // "Automatically improve and regenerate" without a limit is a loop that bills
  // a parent for a film it never delivers.
  assert.ok(MAX_ATTEMPTS >= 2 && MAX_ATTEMPTS <= 5);
});

test("the summary tells a parent what happened", () => {
  assert.match(verdictSummary(judge(allAt(8)), 1), /approved/i);
  assert.match(verdictSummary(judge(allAt(8)), 3), /attempt 3/);
  const scores = allAt(9);
  scores.hook = 2;
  assert.match(verdictSummary(judge(scores), 1), /sent it back: hook scored 2\/10/);
});

// --- the plan ---------------------------------------------------------------

const page = (n: number) => ({ text: `Page ${n} happens.`, illustration: `a drawing of page ${n}` });

test("a plan survives a model that omits half the fields", () => {
  const plan = readPlan({ scenes: [{ action: "She runs." }, {}] }, "Untitled");
  assert.equal(plan.title, "Untitled");
  assert.equal(plan.scenes.length, 2);
  // Defaults rather than a throw: losing eleven good scenes because the twelfth
  // has no lighting note helps nobody, and the gate decides what is good enough.
  assert.equal(plan.scenes[0].shot, "medium shot");
  assert.equal(plan.scenes[0].transition, "cut");
  assert.equal(plan.scenes[0].number, 1);
  assert.equal(plan.scenes[1].number, 2);
});

test("a plan with no filmable scenes is not renderable", () => {
  assert.equal(isRenderable(readPlan({ scenes: [] }, "x")), false);
  assert.equal(isRenderable(readPlan({ scenes: [{ narration: "words" }] }, "x")), false);
  assert.equal(isRenderable(readPlan({ scenes: [{ action: "She runs." }] }, "x")), true);
});

test("a runaway model cannot bill for a hundred scenes", () => {
  const plan = readPlan({ scenes: Array.from({ length: 200 }, () => ({ action: "x" })) }, "x");
  assert.equal(plan.scenes.length, MAX_SCENES);
  assert.equal(planSeconds(plan), MAX_SCENES * 6);
});

test("the screenplay prompt hands over the book as what happens", () => {
  const prompt = buildMoviePrompt({
    title: "The Lost Crown",
    dedication: "For Mia",
    pages: [page(1), page(2), page(3)],
    characterName: "Mia",
    appearance: "Mia, a child, with curly dark hair, wearing a yellow raincoat.",
    languageName: "English",
  });
  assert.match(prompt, /Page 1: Page 1 happens\./);
  assert.match(prompt, /adapt it, do not replace it/);
  assert.match(prompt, /3-scene/);
  assert.match(prompt, /looks exactly like this, in every scene/);
});

test("a rejected plan is rewritten with the reason attached", () => {
  const scores = allAt(9);
  scores.hook = 3;
  const prompt = buildMoviePrompt({
    title: "T",
    dedication: "",
    pages: [page(1)],
    characterName: "Mia",
    languageName: "English",
    revision: rewriteBrief(judge(scores)),
  });
  assert.match(prompt, /REVISION REQUIRED/);
  assert.match(prompt, /Hook \(scored 3\/10\)/);
});

test("every scene prompt carries the appearance, because the model has no memory", () => {
  const plan = readPlan(
    { visualStyle: "warm watercolour", scenes: [{ action: "She runs." }, { action: "She stops." }] },
    "x",
  );
  const appearance = "Mia, a child, with curly dark hair.";
  for (const scene of plan.scenes) {
    const p = buildScenePrompt(plan, scene, appearance);
    assert.match(p, /warm watercolour/);
    assert.match(p, /Mia, a child, with curly dark hair\./);
    assert.match(p, /no watermark/);
  }
});
