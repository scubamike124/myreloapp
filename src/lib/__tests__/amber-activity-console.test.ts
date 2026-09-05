/**
 * AmberActivityConsole.tsx contains JSX, which this repo's
 * `node --experimental-strip-types` test runner cannot execute (it strips
 * types only, not JSX) -- same reason every whole-component test here reads
 * real source instead of importing app code (see auth-session.test.ts).
 * These assertions guard the "do not fake activity" contract carried over
 * from the console's predecessor (AmberRunWorkspace): every section must be
 * gated on a real field from the run object, never shown unconditionally,
 * and the panel must actually pass live run data in.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const CONSOLE_SRC = readFileSync(path.join(SRC, "components", "amber", "AmberActivityConsole.tsx"), "utf8");
const PANEL = readFileSync(path.join(SRC, "components", "amber", "AmberFixesPanel.tsx"), "utf8");

test("the console shows a real, honest idle state when there is no run -- not nothing, and not fake activity", () => {
  const idleBlock = CONSOLE_SRC.slice(CONSOLE_SRC.indexOf("if (!run) {"), CONSOLE_SRC.indexOf("const tone = toneFor(run);"));
  assert.match(idleBlock, /No job running/, "idle state must say plainly that nothing is running, not imply activity");
  assert.doesNotMatch(
    idleBlock,
    /amber-console-elapsed|amber-console-final|amber-console-stepper/,
    "idle state must not show an elapsed timer, a final status badge, or a progress stepper -- there is no run to time, conclude, or step through",
  );
});

test("files/tests/PR sections are gated on real data, not always shown", () => {
  assert.match(CONSOLE_SRC, /hasFiles\s*=\s*\(run\.changedFiles\?\.\length\s*\?\?\s*0\)\s*>\s*0/);
  assert.match(CONSOLE_SRC, /\{hasFiles\s*&&/, "files section must be conditional on real changedFiles");
  assert.match(CONSOLE_SRC, /hasTests\s*=\s*typeof run\.testEvidence/);
  assert.match(CONSOLE_SRC, /\{hasTests\s*&&/, "tests section must be conditional on real testEvidence");
  assert.match(CONSOLE_SRC, /\{run\.prUrl\s*&&/, "PR section must be conditional on a real prUrl");
});

test("the final status badge only ever renders one of the three requested states, and only when actually final", () => {
  const fn = CONSOLE_SRC.slice(CONSOLE_SRC.indexOf("function finalBadgeFor"), CONSOLE_SRC.indexOf("function currentStepText"));
  assert.match(fn, /"MERGED"/);
  assert.match(fn, /"FAILED"/);
  assert.match(fn, /"NEEDS APPROVAL"/);
  assert.match(fn, /return null;/, "must return null (no badge) while still queued/running/testing -- not fabricate an early MERGED/FAILED");
});

test("MERGED means actually merged (mergedAt), not just a PR that was opened", () => {
  const fn = CONSOLE_SRC.slice(CONSOLE_SRC.indexOf("function finalBadgeFor"), CONSOLE_SRC.indexOf("function currentStepText"));
  assert.match(fn, /if \(run\.mergedAt\) return "MERGED";/);
});

test("the elapsed timer only ticks while a run is actually in progress", () => {
  assert.match(
    CONSOLE_SRC,
    /if \(!isRunning\) return;/,
    "must stop ticking once a run is no longer queued/running/testing, or it fakes ongoing activity after the work already ended",
  );
});

test("the progress stepper has exactly the steps the backend can actually report -- no Planning/Inspecting/Editing/Deploying/Verifying step", () => {
  // Confirmed against the real CodingAgentRun backend (amberai): status is
  // one of queued/running/testing/succeeded/failed/needs_owner/needs_runtime
  // /interrupted, with no field distinguishing "planning" from "editing"
  // within a run. Inventing extra steps in this fixed stepper would be
  // fabricated-progress UI. Deploy verification is real (see the separate
  // "deployStatus" test below) but deliberately lives in its own gated
  // section below the stepper, not as a stepper step -- most repos have no
  // deploy signal at all, which a fixed-position step can't express honestly.
  const stepOrderLine = CONSOLE_SRC.slice(
    CONSOLE_SRC.indexOf("const STEP_ORDER"),
    CONSOLE_SRC.indexOf(";", CONSOLE_SRC.indexOf("const STEP_ORDER")) + 1,
  );
  assert.match(stepOrderLine, /"queued"/);
  assert.match(stepOrderLine, /"working"/);
  assert.match(stepOrderLine, /"testing"/);
  assert.match(stepOrderLine, /"review"/);
  assert.match(stepOrderLine, /"merged"/);
  const steps = stepOrderLine.match(/"[^"]+"/g) || [];
  assert.equal(steps.length, 5, "exactly 5 real steps -- no Planning, Inspecting, Editing, Deploying, or Verifying step exists to add");
  for (const fake of ["planning", "inspecting", "editing", "complete"]) {
    assert.doesNotMatch(
      stepOrderLine.toLowerCase(),
      new RegExp(`"${fake}"`),
      `must not fabricate a "${fake}" step -- no backend field distinguishes it from a real step`,
    );
  }
});

test("deploy verification only ever shows a real, backend-reported outcome, gated on run.deployStatus", () => {
  // Unlike the fixed stepper above, this section is real: amberai's
  // approve.ts now actually merges the PR and, for the one repo with a real
  // health-check endpoint, polls it and records the true outcome as
  // deployStatus. This must stay strictly gated on that field -- never shown
  // for a repo with no deployStatus at all, and never claim "verified"
  // without deployStatus literally being "verified".
  assert.match(CONSOLE_SRC, /\{run\.deployStatus\s*&&/, "the whole deployment section must be conditional on a real deployStatus");
  assert.match(CONSOLE_SRC, /run\.deployStatus === "verifying"/);
  assert.match(CONSOLE_SRC, /run\.deployStatus === "verified"/);
  assert.match(CONSOLE_SRC, /run\.deployStatus === "unverified"/);
  const deploySection = CONSOLE_SRC.slice(CONSOLE_SRC.indexOf("{run.deployStatus && ("), CONSOLE_SRC.indexOf("{badge &&"));
  const verifiedBranch = deploySection.slice(deploySection.indexOf('run.deployStatus === "verified"'));
  assert.match(verifiedBranch, /Deployed and verified live/, "the 'verified' claim text must live inside the deployStatus === \"verified\" branch");
  assert.equal(
    (deploySection.match(/Deployed and verified live/g) || []).length,
    1,
    "the 'verified' claim text must appear exactly once, not also in the verifying/unverified branches",
  );
});

test("Approve & merge only appears on a real, unmerged, succeeded run with an open PR -- never fabricates an approval affordance", () => {
  const section = CONSOLE_SRC.slice(CONSOLE_SRC.indexOf("{run.prUrl && ("), CONSOLE_SRC.indexOf("{run.deployStatus &&"));
  assert.match(section, /!run\.mergedAt && run\.status === "succeeded" && onApprove/, "must gate on real unmerged+succeeded state, not just prUrl being present");
});

test("changed files link to the real PR diff on GitHub instead of a fabricated inline diff", () => {
  // The backend only stores changed file paths, never line-level diff
  // content -- rendering a fake "diff view" from just a filename list would
  // misrepresent what Amber actually changed.
  assert.match(CONSOLE_SRC, /View full diff on GitHub/);
  assert.doesNotMatch(
    CONSOLE_SRC,
    /diff --git|@@ -\d|^\+\+\+ |^--- /m,
    "must not attempt to render invented diff hunks -- no line-level diff data exists to show",
  );
});

test("the console is wired into the real panel with the real live run state, not static/demo data", () => {
  assert.match(PANEL, /<AmberActivityConsole\s+run=\{currentRun\}/, "must be rendered with the same state the polling loop updates");
  assert.match(PANEL, /setCurrentRun\(run\)/, "must update on a freshly-started run");
  assert.match(PANEL, /setCurrentRun\(target\)/, "must update on every poll tick, or the console goes stale mid-run");
});

test("the run persists across a reload instead of vanishing the moment the tab refreshes", () => {
  assert.match(PANEL, /const storedRun = loadJson<BuilderRun \| null>\(RUN_KEY, null\);/);
  assert.match(PANEL, /setCurrentRun\(storedRun\)/);
  assert.match(PANEL, /sessionStorage\.setItem\(RUN_KEY, JSON\.stringify\(currentRun\)\)/);
  assert.match(PANEL, /sessionStorage\.setItem\(ACTIVE_RUN_ID_KEY, JSON\.stringify\(activeRunId\)\)/);
});

test("polling continues through a real pending-approval state, not just while actively running", () => {
  assert.match(
    PANEL,
    /pendingApproval\s*=\s*target\.status\s*===\s*"succeeded"\s*&&\s*Boolean\(target\.prUrl\)\s*&&\s*!target\.mergedAt/,
    "a successful run awaiting merge must keep polling so a later merge actually reaches merged",
  );
});

test("polling continues while a real deploy-verification check is in flight, or its outcome would never surface", () => {
  assert.match(
    PANEL,
    /pendingDeploy\s*=\s*Boolean\(target\.mergedAt\)\s*&&\s*target\.deployStatus\s*===\s*"verifying"/,
    "must keep polling after merge while deployStatus is still 'verifying', or the real verified/unverified outcome never reaches the console",
  );
});

test("Approve & merge calls the real backend action, not a local status flip", () => {
  assert.match(PANEL, /const approveRun = useCallback\(/, "must be a real network call, not a client-side state toggle");
  assert.match(PANEL, /action:\s*"approve"/);
  assert.match(PANEL, /fetch\("\/api\/amber-builder"/);
  assert.match(PANEL, /taskId:\s*idOrTaskId/, "must send the real run/task id -- there is nothing else identifying which PR to merge");
});
