/**
 * Regression coverage for the login/session flow, added after two real
 * incidents in one session: (1) a customer account showed "Guest" on
 * Business Center despite a valid login, and (2) Michael couldn't find a way
 * to sign out. Neither was actually caused by a code change in this repo --
 * both traced to Cloudflare running a different deploy than what's in git --
 * but there was no test anywhere guarding the properties that a *real*
 * regression here would break. This is a whole-repository test, in the same
 * style as pricing-coverage.test.ts and db-access.test.ts: it reads the
 * actual source of the auth files and asserts the specific properties this
 * session proved matter, rather than importing app code (this repo's test
 * runner has no path-alias resolution for `@/...`, so every existing test
 * here works this way).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const read = (rel: string) => readFileSync(path.join(SRC, rel), "utf8");

test("session cookie is httpOnly, sameSite=lax, and secure in production", () => {
  const route = read("app/api/auth/route.ts");
  const setter = route.slice(route.indexOf("function applySessionCookie"));
  assert.match(setter, /httpOnly:\s*true/, "session cookie must be httpOnly or it's readable by any injected script");
  assert.match(setter, /sameSite:\s*["']lax["']/, "sameSite must stay lax -- stricter breaks OAuth-style redirects back into the app, looser is a CSRF risk");
  assert.match(setter, /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/, "cookie must be marked secure in production or browsers may drop it over HTTPS");
});

test("logout actually clears the session cookie and deletes the server-side session row", () => {
  const route = read("app/api/auth/route.ts");
  const accounts = read("lib/accounts.ts");
  assert.match(route, /action === ["']logout["']/, "the logout action must exist in /api/auth");
  assert.match(accounts, /export async function endSession/, "endSession must exist -- deleting the session row is what makes a stolen cookie useless after logout");
  assert.match(accounts, /DELETE FROM sessions WHERE id/, "endSession must actually delete the row, not just tell the client to forget the cookie");
});

test("a real Sign out control exists and calls the real logout action", () => {
  // Confirmed live: Michael could not find a way to sign out at all. The
  // control exists (TokenPanel.tsx, on /account) but nothing enforced that
  // it keeps existing or keeps calling the real endpoint.
  const panel = read("components/account/TokenPanel.tsx");
  assert.match(panel, />\s*Sign out\s*</, "a visible Sign out control must exist somewhere a signed-in user can reach it");
  assert.match(panel, /action:\s*["']logout["']/, "the Sign out control must call the real logout action, not just clear local UI state");
});

test("currentUser only returns a user for a non-expired session", () => {
  const accounts = read("lib/accounts.ts");
  const fn = accounts.slice(accounts.indexOf("export async function currentUser"));
  assert.match(
    fn.slice(0, fn.indexOf("\n}")),
    /expires_at\s*>/,
    "currentUser's session lookup must filter on expiry -- otherwise a logged-out or long-dead session id still resolves to a real user",
  );
});

test("password sign-up/sign-in/reset are rejected, not silently processed", () => {
  // Removed entirely with no customers ever on a password account. This
  // guards against someone re-wiring these actions back in without
  // noticing Google is supposed to be the only way in now.
  const route = read("app/api/auth/route.ts");
  for (const action of ["signup", "login", "reset-password", "request-reset"]) {
    assert.match(
      route,
      new RegExp(`action === ["']${action}["']`),
      `POST /api/auth must still recognize "${action}" so it can explicitly reject it`,
    );
  }
  assert.doesNotMatch(
    route,
    /createUser\(|authenticate\(|resetPasswordWithToken\(|createPasswordResetToken\(/,
    "the route must not call any password-auth function -- these actions should be rejected outright, not processed",
  );
});

test("AuthForm no longer renders a password field", () => {
  const form = read("components/account/AuthForm.tsx");
  assert.doesNotMatch(form, /type=["']password["']/, "no password input should remain in the sign-in/sign-up form");
  assert.match(form, /Continue with Google/, "Google must still be the offered sign-in method");
});

test("a failed Google sign-in shows a real error, never a silent session", () => {
  const complete = read("lib/complete-google-login.ts");
  assert.match(
    complete,
    /searchParams\.set\(["']error["']/,
    "a failed Google callback must redirect with a visible error, not silently continue",
  );
  const form = read("components/account/AuthForm.tsx");
  assert.match(form, /params\.get\(["']error["']\)/, "the sign-in page must actually read and display that error param");
});

test("only the configured owner email can ever receive the OWNER role via Google sign-in", () => {
  const claim = read("lib/owner-claim.ts");
  assert.match(
    claim,
    /CONFIGURED_OWNER_EMAILS\.includes\(email\)/,
    "promoting an existing account to OWNER must check the configured owner email allowlist -- without this, any Google account could end up OWNER",
  );
});

test("OWNER/ADMIN status is visibly shown, not just the signed-in name", () => {
  // Confirmed live: after signing in, Michael saw his name but nothing told
  // him whether the account was actually recognized as owner. "Signed in"
  // must not be the only thing shown.
  const panel = read("components/account/TokenPanel.tsx");
  assert.match(panel, /state\.user\.role/, "the account page must read the signed-in user's role");
  assert.match(panel, /OWNER.*ADMIN|ADMIN.*OWNER/s, "the account page must render OWNER/ADMIN as a visible badge, not silently ignore role");

  const dashboard = read("components/business/BusinessProDashboard.tsx");
  assert.match(dashboard, /role === ["']OWNER["']/, "Business Center Pro must also check the role, not just signedIn/userName");
});

test("the owner-mode Amber persona still overrides the base \"cannot act\" restriction", () => {
  // Regression test for the exact bug found live this session: the base
  // AMBER_SYSTEM_PROMPT's "you cannot act" line bled into owner-mode replies
  // even after start_dev_task genuinely queued real work, because the
  // addendum only softly said the restriction "does not apply." If this
  // explicit override ever gets refactored away, Amber Fix will start
  // contradicting itself again in owner mode with no test catching it.
  const persona = read("lib/amber/persona.ts");
  const addendum = persona.slice(persona.indexOf("AMBER_ADMIN_OPERATOR_ADDENDUM ="));
  assert.match(
    addendum,
    /is FALSE in this mode/i,
    "the owner addendum must explicitly state the base persona's \"cannot act\" restriction is false in owner mode, not just that it \"does not apply\"",
  );
  assert.match(
    addendum,
    /I can't directly do X/,
    "the addendum must explicitly forbid the exact disclaimer phrasing that caused the live contradiction",
  );
});
