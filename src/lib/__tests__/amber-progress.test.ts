import test from "node:test";
import assert from "node:assert/strict";
import { activityFromRunDiff, publicRun, type BuilderRun } from "../amber/progress.ts";

test("publicRun exposes createdAt/completedAt/attempt for elapsed-time and retry display", () => {
  const run = publicRun({
    id: "r1",
    status: "running",
    createdAt: "2026-09-01T00:00:00.000Z",
    completedAt: "2026-09-01T00:05:00.000Z",
    attempt: 2,
  });
  assert.equal(run.createdAt, "2026-09-01T00:00:00.000Z");
  assert.equal(run.completedAt, "2026-09-01T00:05:00.000Z");
  assert.equal(run.attempt, 2);
});

test("publicRun distinguishes a merged PR from one merely opened", () => {
  const opened = publicRun({ id: "r1", status: "succeeded", prUrl: "https://github.com/x/y/pull/1" });
  assert.equal(opened.mergedAt, undefined);

  const merged = publicRun({
    id: "r1",
    status: "succeeded",
    prUrl: "https://github.com/x/y/pull/1",
    mergedAt: "2026-09-01T01:00:00.000Z",
    mergedSha: "abc1234",
  });
  assert.equal(merged.mergedAt, "2026-09-01T01:00:00.000Z");
  assert.equal(merged.mergedSha, "abc1234");
});

test("publicRun carries real test failure text through, not just pass/fail counts", () => {
  const run = publicRun({
    id: "r1",
    status: "testing",
    testEvidence: { passed: 3, failed: 1, testsRun: ["a", "b"], failures: ["expected 2 got 3"] },
  });
  assert.deepEqual(run.testEvidence?.failures, ["expected 2 got 3"]);
});

test("publicRun never trusts a non-https prUrl", () => {
  const run = publicRun({ id: "r1", status: "succeeded", prUrl: "javascript:alert(1)" });
  assert.equal(run.prUrl, undefined);
});

test("activityFromRunDiff reports a merge only once, when mergedAt actually changes", () => {
  const before: BuilderRun = { id: "r1", status: "succeeded", prUrl: "https://x/pull/1" };
  const afterMerge: BuilderRun = { ...before, mergedAt: "2026-09-01T01:00:00.000Z" };

  const lines = activityFromRunDiff(before, afterMerge);
  assert.ok(lines.some((l) => l.text === "Pull request merged."));

  // Diffing the same merged state against itself must not re-report it.
  const noChange = activityFromRunDiff(afterMerge, afterMerge);
  assert.equal(
    noChange.some((l) => l.text === "Pull request merged."),
    false,
  );
});

test("activityFromRunDiff reports a retry only when attempt actually increases", () => {
  const first: BuilderRun = { id: "r1", status: "running", attempt: 1 };
  const retried: BuilderRun = { ...first, attempt: 2 };

  const lines = activityFromRunDiff(first, retried);
  assert.ok(lines.some((l) => l.text.includes("Retrying (attempt 2)")));

  const same = activityFromRunDiff(retried, retried);
  assert.equal(
    same.some((l) => l.text.includes("Retrying")),
    false,
  );
});
