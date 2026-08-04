/**
 * Series memory — the thing that makes book four know about book one.
 *
 * The failures worth guarding against are the quiet ones: memory that grows
 * without bound until the prompt truncates, a fact stored twice under two
 * capitalisations so the model thinks there are two grandpas, and a cap that
 * drops the founding characters instead of the incidental ones.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_MEMORY,
  MAX_FACTS,
  RECENT_EPISODES,
  continuityPrompt,
  nextEpisode,
  readMemory,
  rememberEpisode,
} from "../story-memory.ts";

const note = (episode: number) => ({ episode, title: `Book ${episode}`, summary: `Something happened in ${episode}.` });

test("an episode is remembered, and the next one follows it", () => {
  const after = rememberEpisode(EMPTY_MEMORY, note(1), { characters: ["Grandpa Joe"], places: ["The lighthouse"] });
  assert.equal(after.episodes.length, 1);
  assert.equal(nextEpisode(after), 2);
  assert.deepEqual(after.characters, ["Grandpa Joe"]);
});

test("the same character named twice is one character", () => {
  let memory = rememberEpisode(EMPTY_MEMORY, note(1), { characters: ["Grandpa Joe"] });
  memory = rememberEpisode(memory, note(2), { characters: ["grandpa joe", "Mrs Patel"] });
  assert.deepEqual(memory.characters, ["Grandpa Joe", "Mrs Patel"]);
});

test("re-recording an episode replaces it rather than duplicating it", () => {
  let memory = rememberEpisode(EMPTY_MEMORY, note(1), {});
  memory = rememberEpisode(memory, { episode: 1, title: "Book 1, retitled", summary: "Rewritten." }, {});
  assert.equal(memory.episodes.length, 1);
  assert.equal(memory.episodes[0].title, "Book 1, retitled");
});

test("memory stays a fixed size however long the series runs", () => {
  let memory = EMPTY_MEMORY;
  for (let i = 1; i <= 40; i++) {
    memory = rememberEpisode(memory, note(i), {
      characters: [`Character ${i}`],
      places: [`Place ${i}`],
      lessons: [`Lesson ${i}`],
      keepsakes: [`Keepsake ${i}`],
    });
  }
  assert.equal(memory.episodes.length, RECENT_EPISODES);
  assert.equal(memory.characters.length, MAX_FACTS);
  // Episode 40 still follows 39 even though episode 1 is no longer written out.
  assert.equal(nextEpisode(memory), 41);
});

test("when the cap bites, the founding facts are the ones that survive", () => {
  let memory = EMPTY_MEMORY;
  for (let i = 1; i <= 30; i++) {
    memory = rememberEpisode(memory, note(i), { characters: [`Character ${i}`] });
  }
  // Book one's cast outlives book thirty's walk-on part: a reader would notice
  // the family dog vanishing, not a shopkeeper mentioned once.
  assert.equal(memory.characters[0], "Character 1");
  assert.ok(!memory.characters.includes("Character 30"));
});

test("the briefing tells the model what not to repeat", () => {
  const memory = rememberEpisode(EMPTY_MEMORY, note(1), {
    characters: ["Grandpa Joe"],
    lessons: ["Sharing makes things better"],
  });
  const prompt = continuityPrompt(memory, "The Lighthouse Adventures");
  assert.match(prompt, /The Lighthouse Adventures/);
  assert.match(prompt, /Grandpa Joe/);
  assert.match(prompt, /Sharing makes things better/);
  assert.match(prompt, /Do NOT repeat/);
});

test("a first story gets no continuity briefing at all", () => {
  assert.equal(continuityPrompt(EMPTY_MEMORY, "Brand New"), "");
});

test("unreadable stored memory degrades to empty rather than throwing", () => {
  assert.deepEqual(readMemory("not json"), EMPTY_MEMORY);
  assert.deepEqual(readMemory(null), EMPTY_MEMORY);
  assert.deepEqual(readMemory({ episodes: "nonsense", characters: [1, 2] }), EMPTY_MEMORY);
});

test("memory survives a round trip through the database column", () => {
  const memory = rememberEpisode(EMPTY_MEMORY, note(3), { characters: ["Ada"], keepsakes: ["A brass key"] });
  assert.deepEqual(readMemory(JSON.stringify(memory)), memory);
});
