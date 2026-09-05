/**
 * AmberRunWorkspace.tsx contains JSX, which this repo's
 * `node --experimental-strip-types` test runner cannot execute (it strips
 * types only, not JSX) — same reason every whole-repository test here reads
 * real source instead of importing app code (see auth-session.test.ts).
 * These assertions guard the "do not fake activity" contract: every section
 * must be gated on a real field from the run object, never shown
 * unconditionally, and the panel must actually pass live run data in.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const WORKSPACE = readFileSync(path.join(SRC, "components", "amber", "AmberRunWorkspace.tsx"), "utf8");
const PANEL = readFileSync(path.join(SRC, "components", "amber", "AmberFixesPanel.tsx"), "utf8");

test("the workspace renders nothing when there is no real run to show", () => {
  assert.match(WORKSPACE, /if \(!run\) return null;/, "must not render a placeholder/demo state with no real run");
});

test("files/tests/PR sections are gated on real data, not always shown", () => {
  assert.match(WORKSPACE, /hasFiles\s*=\s*\(run\.changedFiles\?\.\length\s*\?\?\s*0\)\s*>\s*0/);
  assert.match(WORKSPACE, /\{hasFiles\s*&&/, "files section must be conditional on real changedFiles");
  assert.match(WORKSPACE, /hasTests\s*=\s*typeof run\.testEvidence/);
  assert.match(WORKSPACE, /\{hasTests\s*&&/, "tests section must be conditional on real testEvidence");
  assert.match(WORKSPACE, /\{run\.prUrl\s*&&/, "PR section must be conditional on a real prUrl");
});

test("the final status badge only ever renders one of the three requested states, and only when actually final", () => {
  const fn = WORKSPACE.slice(WORKSPACE.indexOf("function finalBadgeFor"), WORKSPACE.indexOf("function currentStepText"));
  assert.match(fn, /"DONE"/);
  assert.match(fn, /"FAILED"/);
  assert.match(fn, /"NEEDS APPROVAL"/);
  assert.match(fn, /return null;/, "must return null (no badge) while still queued/running/testing -- not fabricate an early DONE/FAILED");
});

test("DONE means actually merged (mergedAt), not just a PR that was opened", () => {
  const fn = WORKSPACE.slice(WORKSPACE.indexOf("function finalBadgeFor"), WORKSPACE.indexOf("function currentStepText"));
  assert.match(fn, /if \(run\.mergedAt\) return "DONE";/);
});

test("the elapsed timer only ticks while a run is actually in progress", () => {
  assert.match(
    WORKSPACE,
    /if \(!isRunning\) return;/,
    "must stop ticking once a run is no longer queued/running/testing, or it fakes ongoing activity after the work already ended",
  );
});

test("the workspace is wired into the real panel with the real live run state, not static/demo data", () => {
  assert.match(PANEL, /<AmberRunWorkspace run=\{currentRun\}\s*\/>/, "must be rendered with the same state the polling loop updates");
  assert.match(PANEL, /setCurrentRun\(run\)/, "must update on a freshly-started run");
  assert.match(PANEL, /setCurrentRun\(target\)/, "must update on every poll tick, or the panel goes stale mid-run");
});

test("polling continues through a real pending-approval state, not just while actively running", () => {
  assert.match(
    PANEL,
    /pendingApproval\s*=\s*target\.status\s*===\s*"succeeded"\s*&&\s*Boolean\(target\.prUrl\)\s*&&\s*!target\.mergedAt/,
    "a successful run awaiting merge must keep polling so a later merge (approved via chat) actually reaches DONE",
  );
});
