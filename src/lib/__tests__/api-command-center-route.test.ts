import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * proxy.ts matches "/admin/:path*", which does NOT cover /api/admin/*.
 * A route added there without its own guard is publicly readable.
 */
describe("the admin API route guards itself", () => {
  const src = fs.readFileSync("src/app/api/admin/api-command-center/route.ts", "utf8");

  it("verifies the admin session", () => {
    assert.match(src, /verifySessionToken/, "the route must check the session itself");
    assert.match(src, /ADMIN_COOKIE/);
  });

  it("checks authorization BEFORE reaching Amber HQ", () => {
    // Otherwise an unauthenticated caller still causes a bridge request, and
    // the secret is used on their behalf.
    const guard = src.indexOf("const denied = await requireAdmin()");
    const bridge = src.indexOf("fetchApiCommandCenter()");
    assert.ok(guard > 0 && guard < bridge, "the guard must come first");
  });

  it("returns 401 rather than an empty payload", () => {
    assert.match(src, /status: 401/);
  });

  it("never reads the bridge secret, so it cannot leak into a response", () => {
    // Naming the variable in a diagnostic ("REELO_ORG_BRIDGE_SECRET unset")
    // is useful and harmless; READING it here would be the mistake, because
    // anything this route holds can end up in a payload. The value lives
    // only in organization-bridge.ts, which never returns it.
    assert.ok(!/process\.env\.REELO_ORG_BRIDGE_SECRET/.test(src), "the route must not read the secret");
    assert.ok(!/process\.env/.test(src), "this route needs no environment access at all");
  });

  it("says when the bridge is unconfigured instead of showing a blank screen", () => {
    assert.match(src, /not configured/);
    assert.match(src, /status: 503/);
  });
});

describe("the Command Center page is reachable and marked real", () => {
  it("is in the admin navigation", () => {
    const shell = fs.readFileSync("src/components/admin/AdminShell.tsx", "utf8");
    assert.match(shell, /\/admin\/api-command-center/);
  });

  it("is exempt from any sample-data banner the shell applies", () => {
    // Its numbers come from Amber HQ's live catalogue, so a "sample data"
    // stamp would make real inventory look fabricated.
    //
    // Asserted conditionally because the mechanism is not on every branch:
    // main's AdminShell has no banner at all. Hard-coding the exemption made
    // this test fail on a shell that has nothing to be exempt from, which
    // says nothing about whether the property holds.
    const shell = fs.readFileSync("src/components/admin/AdminShell.tsx", "utf8");
    if (!/REAL_DATA_ROUTES/.test(shell)) return;
    assert.match(shell, /REAL_DATA_ROUTES = \[[^\]]*api-command-center/);
  });

  it("renders the count beside the country name, not behind a click", () => {
    // The blueprint's hard UI requirement.
    const ui = fs.readFileSync("src/components/admin/ApiCommandCenter.tsx", "utf8");
    assert.match(ui, /\{row\.name\}/);
    assert.match(ui, /\{row\.apis\}/);
    const name = ui.indexOf("{row.name}");
    const count = ui.indexOf("{row.apis}");
    assert.ok(name > 0 && count > name, "the count sits on the same row as the name");
  });

  it("shows an unmeasured figure as unmeasured, never as zero", () => {
    const ui = fs.readFileSync("src/components/admin/ApiCommandCenter.tsx", "utf8");
    assert.match(ui, /not measured/);
  });
});
