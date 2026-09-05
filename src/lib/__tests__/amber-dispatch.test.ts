import test from "node:test";
import assert from "node:assert/strict";
import { findProjectMentions, PROJECTS } from "../amber/project-registry.ts";
import { resolveDispatchProject } from "../amber/dispatch.ts";

test("findProjectMentions matches a project named in free text", () => {
  const hits = findProjectMentions("Fix the broken checkout on Reelo");
  assert.deepEqual(
    hits.map((h) => h.key),
    ["reelo"],
  );
});

test("findProjectMentions does not match a project name inside another word", () => {
  // "forma" must not match inside "format" or "information".
  const hits = findProjectMentions("Please reformat the information on the page");
  assert.equal(hits.length, 0);
});

test("findProjectMentions finds multiple distinct projects when both are named", () => {
  const hits = findProjectMentions("Compare Reelo and Forma pricing pages");
  const keys = new Set(hits.map((h) => h.key));
  assert.ok(keys.has("reelo"));
  assert.ok(keys.has("forma"));
});

test("resolveDispatchProject: text naming a project overrides a different selected pill", () => {
  // Confirmed live bug: Forma pill selected, "fix Reelo" typed -> Amber
  // worked on Forma. The text must win.
  const result = resolveDispatchProject("Fix Reelo's broken checkout webhook", "forma");
  assert.deepEqual(result, { kind: "resolved", projectKey: "reelo", label: "Reelo", source: "text" });
});

test("resolveDispatchProject: no project named in text falls back to the pill", () => {
  const result = resolveDispatchProject("fix the broken checkout webhook", "forma");
  assert.deepEqual(result, { kind: "resolved", projectKey: "forma", label: "Forma", source: "pill" });
});

test("resolveDispatchProject: text naming the same project as the pill resolves from text (no false switch signal needed)", () => {
  const result = resolveDispatchProject("fix reelo", "reelo");
  assert.equal(result.kind, "resolved");
  if (result.kind === "resolved") {
    assert.equal(result.projectKey, "reelo");
    assert.equal(result.source, "text");
  }
});

test("resolveDispatchProject: two different projects named is ambiguous, not guessed", () => {
  const result = resolveDispatchProject("fix reelo and forma", "dayli");
  assert.equal(result.kind, "ambiguous");
  if (result.kind === "ambiguous") {
    const keys = new Set(result.candidates.map((c) => c.key));
    assert.ok(keys.has("reelo"));
    assert.ok(keys.has("forma"));
  }
});

test("every project in the registry has at least one alias that resolves back to it", () => {
  for (const p of PROJECTS) {
    for (const alias of p.aliases) {
      const hits = findProjectMentions(`please fix something on ${alias} today`);
      assert.ok(
        hits.some((h) => h.key === p.key),
        `alias "${alias}" for ${p.key} did not resolve back to ${p.key}`,
      );
    }
  }
});
