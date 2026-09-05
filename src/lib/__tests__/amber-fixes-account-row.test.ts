/**
 * Confirmed live via the owner's own screenshot: the global AuthBar (fixed
 * top-right, z-[70], mounted once in the root layout) floated directly on
 * top of Amber Fixes's own header -- the "← Business Center" back link and
 * "Amber Fixes" title sit at the top of that page's fixed-position,
 * full-screen root (amber-fixes-root, z-40), so the two collided in the same
 * corner. Same class of bug as AmberDock covering the Send button
 * (amber-dock-amber-fix.test.ts), fixed the same way: hide the global
 * floating control on this one route.
 *
 * Unlike AmberDock, AuthBar is the app's only sign-out control, so hiding it
 * outright would remove sign-out from this page rather than just declutter
 * it. The fix instead adds an inline account row (name, role, sign out) to
 * Amber Fixes's own header, styled to match that page instead of floating
 * over it.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const AUTH_BAR = readFileSync(path.join(SRC, "components", "design", "AuthBar.tsx"), "utf8");
const PANEL = readFileSync(path.join(SRC, "components", "amber", "AmberFixesPanel.tsx"), "utf8");
const CSS = readFileSync(path.join(SRC, "components", "amber", "amber-fixes.css"), "utf8");

test("the global AuthBar is hidden on /amber-builder, not just /login and /signup", () => {
  const hiddenOnLine = AUTH_BAR.slice(
    AUTH_BAR.indexOf("const HIDDEN_ON ="),
    AUTH_BAR.indexOf(";", AUTH_BAR.indexOf("const HIDDEN_ON =")) + 1,
  );
  assert.match(hiddenOnLine, /"\/amber-builder"/, "AuthBar must not render on Amber Fixes's own full-screen page");
  assert.match(hiddenOnLine, /"\/login"/, "the pre-existing /login exemption must still be there");
  assert.match(hiddenOnLine, /"\/signup"/, "the pre-existing /signup exemption must still be there");
});

test("Amber Fixes renders its own account row instead of relying on the (now-hidden) global bar", () => {
  assert.match(PANEL, /fetch\("\/api\/auth"\)/, "must read the same auth source AuthBar used");
  assert.match(PANEL, /className="amber-fixes-account"/, "must render an inline account row in its own header");
  assert.match(PANEL, /amber-fixes-account-signout/, "sign-out must still be reachable from this page");
});

test("the account row only claims a role that is actually OWNER or ADMIN, never fabricated", () => {
  assert.match(
    PANEL,
    /account\.role === "OWNER" \|\| account\.role === "ADMIN"/,
    "must gate the role badge on the real account role, not show one unconditionally",
  );
});

test("the inline account row has its own styling, not reused from the floating global pill", () => {
  assert.match(CSS, /\.amber-fixes-account\s*\{/, "needs its own layout rule");
  assert.match(CSS, /\.amber-fixes-account-role\s*\{/, "needs its own role-badge rule");
  assert.match(CSS, /\.amber-fixes-account-signout\s*\{/, "needs its own sign-out button rule");
});
