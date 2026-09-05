/**
 * Confirmed live: the global "Ask Amber" launcher (AmberDock, fixed
 * bottom-5/6 right-5/6, z-[70]) visually overlapped the Send button of Amber
 * Fixes's own composer at /amber-builder, which is itself a full-screen
 * Amber conversation (amber-fixes-root, z-40) with its own Send button
 * anchored to the same bottom-right corner. The user is already talking to
 * Amber via Amber Fixes on that one page, so the second launcher was both
 * blocking Send and redundant there.
 *
 * The fix reuses AmberDock's existing HIDDEN_ON allowlist (already used to
 * hide the dock on /admin/login) rather than inventing a new mechanism, and
 * must add exactly one path -- removing the global launcher from any other
 * page, or removing this specific opt-out, are both regressions.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const DOCK = readFileSync(path.join(SRC, "components", "amber", "AmberDock.tsx"), "utf8");

test("Amber Fixes (/amber-builder) is added to AmberDock's HIDDEN_ON allowlist", () => {
  const hiddenOnLine = DOCK.slice(DOCK.indexOf("const HIDDEN_ON ="), DOCK.indexOf(";", DOCK.indexOf("const HIDDEN_ON =")) + 1);
  assert.match(
    hiddenOnLine,
    /"\/amber-builder"/,
    "the global launcher must be hidden on /amber-builder or it keeps overlapping Amber Fixes's own Send button",
  );
});

test("hiding the launcher on Amber Fixes does not remove it from /admin/login or anywhere else", () => {
  const hiddenOnLine = DOCK.slice(DOCK.indexOf("const HIDDEN_ON ="), DOCK.indexOf(";", DOCK.indexOf("const HIDDEN_ON =")) + 1);
  assert.match(
    hiddenOnLine,
    /"\/admin\/login"/,
    "the pre-existing /admin/login exemption must still be there -- this change must only add a path, not replace the array",
  );
  // HIDDEN_ON is the only gate in this component: anywhere not literally in
  // this array still renders the one global Amber. Two entries confirms nothing
  // wider was hidden.
  const entries = hiddenOnLine.match(/"[^"]+"/g) || [];
  assert.equal(entries.length, 2, "HIDDEN_ON must list exactly /admin/login and /amber-builder -- no page besides these two loses the global launcher");
});

test("the launcher is still gated only by pathname membership, not by area/route family", () => {
  assert.match(
    DOCK,
    /if \(HIDDEN_ON\.includes\(pathname\)\) return null;/,
    "must remain an exact-pathname check so unrelated /amber-builder/* or /admin/* routes are not accidentally swept in",
  );
});
