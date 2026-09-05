/**
 * AmberFixesPanel.tsx contains JSX, which this repo's
 * `node --experimental-strip-types` test runner cannot execute -- same
 * reason every whole-repository test here reads real source instead of
 * importing app code (see auth-session.test.ts). These assertions guard the
 * actual bug fixes: two independent systems no longer both start work for
 * the same message, and the project a request targets is resolved from the
 * text, not blindly taken from whichever pill happens to be selected.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const PANEL = readFileSync(path.join(SRC, "components", "amber", "AmberFixesPanel.tsx"), "utf8");
const AMBER_ROUTE = readFileSync(path.join(SRC, "app", "api", "amber", "route.ts"), "utf8");
const CONTEXT = readFileSync(path.join(SRC, "lib", "amber", "context.ts"), "utf8");

test("the panel resolves the project from the message text before starting work, not from the pill alone", () => {
  assert.match(
    PANEL,
    /const dispatch = resolveDispatchProject\(trimmed, projectKey\);/,
    "execution-mode sends must resolve the target project from the actual message",
  );
  assert.match(
    PANEL,
    /await startRepair\(trimmed, dispatch\.projectKey\);/,
    "the resolved project, not the raw pill state, must be what actually gets sent to the coding-agent pipeline",
  );
});

test("a message naming two different projects asks instead of guessing", () => {
  const sendFn = PANEL.slice(PANEL.indexOf("const send = useCallback"));
  assert.match(sendFn, /dispatch\.kind === "ambiguous"/);
  assert.match(sendFn, /return;/, "must stop before calling startRepair when the project is ambiguous");
});

test("the pill visibly updates when the text names a different project than what's selected", () => {
  const sendFn = PANEL.slice(PANEL.indexOf("const send = useCallback"));
  assert.match(
    sendFn,
    /setProjectKey\(dispatch\.projectKey\)/,
    "the UI must reflect which project Amber is actually about to work on, not silently diverge from it",
  );
});

test("the panel tells /api/amber a task was already started, so it does not independently start a second one", () => {
  assert.match(
    PANEL,
    /alreadyStarted: true, resolvedProjectKey: dispatch\.projectKey/,
    "streamAmber must flag that startRepair already began real work for this message",
  );
});

test("context.ts actually carries projectKey and alreadyStarted through to the server, validated against the real registry", () => {
  assert.match(CONTEXT, /isProjectKey\(o\.projectKey\)/, "an unrecognized projectKey must be dropped, not trusted verbatim");
  assert.match(CONTEXT, /alreadyStarted = o\.alreadyStarted === true/);
  assert.match(CONTEXT, /projectKey, alreadyStarted \};?\s*$/m, "parseContext must actually return these fields, not just validate and discard them");
});

test("/api/amber short-circuits on alreadyStarted instead of independently deciding to start work again", () => {
  const fn = AMBER_ROUTE.slice(AMBER_ROUTE.indexOf("function runOwnerTurn"));
  const shortCircuit = fn.slice(0, fn.indexOf("const autoFix"));
  assert.match(
    shortCircuit,
    /opts\.onAmberFix && opts\.alreadyStarted/,
    "must check alreadyStarted before ever reaching the auto-fix/startDevTask branch",
  );
});

test("the defensive auto-fix fallback resolves the real project instead of hardcoding Reelo", () => {
  const fn = AMBER_ROUTE.slice(AMBER_ROUTE.indexOf("function runOwnerTurn"));
  const autoFixBlock = fn.slice(fn.indexOf("if (autoFix)"));
  assert.match(
    autoFixBlock,
    /resolveDispatchProject\(lastUser, opts\.projectKey \|\| "reelo"\)/,
    "must resolve the project from the actual message, not assume Reelo",
  );
  assert.match(
    autoFixBlock,
    /dispatch\.projectKey !== "reelo"/,
    "must refuse rather than silently mis-target when the resolved project isn't one this bridge can actually reach",
  );
});
