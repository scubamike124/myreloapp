import test from "node:test";
import assert from "node:assert/strict";
import { buildFeedItems } from "../amber/feed.ts";
import type { ExecutionEvent } from "../amber/execution-types.ts";

let seq = 0;
function ev(partial: Partial<ExecutionEvent> & Pick<ExecutionEvent, "kind" | "title">): ExecutionEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    status: "INFO",
    createdAt: new Date(2026, 0, 1, 0, 0, seq).toISOString(),
    ...partial,
  };
}

test("a burst of inspection events collapses into one real feed item", () => {
  const events = [
    ev({ kind: "INSPECT_FILE", title: "Inspecting src/app/page.tsx", filePath: "src/app/page.tsx" }),
    ev({ kind: "RUN_COMMAND", title: "Running: ls -la", command: "ls -la" }),
    ev({ kind: "COMMAND_OUTPUT", title: "Output of: ls -la", detail: "..." }),
    ev({ kind: "INSPECT_FILE", title: "Inspecting src/lib/tools.ts", filePath: "src/lib/tools.ts" }),
  ];
  const items = buildFeedItems(events);
  assert.equal(items.length, 1, "four raw investigation events must collapse to one feed line");
  assert.equal(items[0].text, "Inspecting the repository…");
  assert.equal(items[0].events.length, 4, "the real underlying events must still be attached for expand view");
});

test("an edit gets its own feed item named after the real file, not the raw title", () => {
  const events = [
    ev({ kind: "EDIT_FILE", title: "Editing /tmp/coding-agent-abc/src/components/Header.tsx", filePath: "/tmp/coding-agent-abc/src/components/Header.tsx", diff: "--- before\nold\n+++ after\nnew" }),
  ];
  const items = buildFeedItems(events);
  assert.equal(items.length, 1);
  assert.equal(items[0].text, "Editing Header.tsx");
  assert.equal(items[0].events[0].diff, "--- before\nold\n+++ after\nnew", "the real diff must stay attached, not be discarded");
});

test("a RUN_COMMAND test run and its TEST_RESULT combine into a single line with real pass/fail counts", () => {
  const events = [
    ev({ kind: "RUN_COMMAND", title: "Running automated tests" }),
    ev({ kind: "TEST_RESULT", title: "Tests: 111 passed, 0 failed", status: "OK", detail: "ran: npm test" }),
  ];
  const items = buildFeedItems(events);
  assert.equal(items.length, 1, "the running-tests placeholder must be replaced, not duplicated");
  assert.equal(items[0].text, "Tests passed");
  assert.equal(items[0].tone, "ok");
  assert.equal(items[0].meta, "111 passed, 0 failed");
  assert.equal(items[0].events.length, 2, "both the real command and the real result stay attached");
});

test("a failing TEST_RESULT is reported as failed, in red, with the real detail available", () => {
  const events = [
    ev({ kind: "RUN_COMMAND", title: "Running automated tests" }),
    ev({ kind: "TEST_RESULT", title: "Tests: 3 passed, 1 failed", status: "ERROR", detail: "ran: npm test\nsome real failure text" }),
  ];
  const items = buildFeedItems(events);
  assert.equal(items.length, 1);
  assert.equal(items[0].text, "Tests failed");
  assert.equal(items[0].tone, "error");
});

test("investigation before AND after an edit produces two separate feed items, not one merged blob", () => {
  const events = [
    ev({ kind: "INSPECT_FILE", title: "Inspecting src/app/page.tsx", filePath: "src/app/page.tsx" }),
    ev({ kind: "EDIT_FILE", title: "Editing src/app/page.tsx", filePath: "src/app/page.tsx" }),
    ev({ kind: "RUN_COMMAND", title: "Running: git diff" }),
  ];
  const items = buildFeedItems(events);
  assert.equal(items.length, 3);
  assert.equal(items[0].text, "Inspecting the repository…");
  assert.equal(items[1].text, "Editing page.tsx");
  assert.equal(items[2].text, "Inspecting the repository…");
});

test("PR_OPENED carries the real URL through as a link, not just text", () => {
  const events = [ev({ kind: "PR_OPENED", title: "Pull request opened: https://github.com/scubamike124/myreloapp/pull/116", status: "OK" })];
  const items = buildFeedItems(events);
  assert.equal(items[0].text, "Pull request opened");
  assert.equal(items[0].href, "https://github.com/scubamike124/myreloapp/pull/116");
});

test("a failed PR_OPENED is shown as a failure with the real reason, not silently as success", () => {
  const events = [ev({ kind: "PR_OPENED", title: "Could not open pull request", status: "ERROR", detail: "No file changes were detected" })];
  const items = buildFeedItems(events);
  assert.equal(items[0].text, "Could not open a pull request");
  assert.equal(items[0].tone, "error");
  assert.equal(items[0].meta, "No file changes were detected");
});

test("the full real happy-path sequence produces the expected short, ordered feed", () => {
  const events: ExecutionEvent[] = [
    ev({ kind: "PLAN", title: "Plan: claude_code (medium_impl)", detail: "shape=medium_impl" }),
    ev({ kind: "RUN_COMMAND", title: "Running: ls -la" }),
    ev({ kind: "COMMAND_OUTPUT", title: "Output of: ls -la" }),
    ev({ kind: "EDIT_FILE", title: "Editing src/components/design/HeroMenu.tsx", filePath: "src/components/design/HeroMenu.tsx" }),
    ev({ kind: "GIT_ACTION", title: "claude_code finished — 1 file(s) changed", status: "OK", detail: "src/components/design/HeroMenu.tsx" }),
    ev({ kind: "RUN_COMMAND", title: "Running automated tests" }),
    ev({ kind: "TEST_RESULT", title: "Tests: 111 passed, 0 failed", status: "OK" }),
    ev({ kind: "PR_OPENED", title: "Pull request opened: https://github.com/x/y/pull/116", status: "OK" }),
    ev({ kind: "COMPLETED", title: "Run completed and verified", status: "OK" }),
    ev({ kind: "APPROVAL", title: "Owner approved PR #116 — merging" }),
    ev({ kind: "MERGE", title: "Merged x/y#116", status: "OK", detail: "08a643e1be8bdf588159abd9d0e3ca7a9749da35" }),
    ev({ kind: "DEPLOY_STARTED", title: "Deploy started" }),
    ev({ kind: "DEPLOY_VERIFIED", title: "Production verified live at 08a643e", status: "OK" }),
  ];
  const items = buildFeedItems(events);
  const texts = items.map((i) => i.text);
  assert.deepEqual(texts, [
    "Planning the approach…",
    "Inspecting the repository…",
    "Editing HeroMenu.tsx",
    "Preparing the change for review…",
    "Tests passed",
    "Pull request opened",
    "Task completed",
    "Approved — merging…",
    "Merged",
    "Deploying to production…",
    "Production verified — change is live",
  ]);
  // Every item must be traceable back to at least one real event.
  for (const item of items) assert.ok(item.events.length > 0);
});
