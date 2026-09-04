/**
 * The Amber Fix console banner is admin-only.
 *
 * `/amber-builder` is the one route that renders `AmberFixesPanel`, and it is
 * gated by `requireAdminAccess()`. A banner added to that panel is therefore
 * invisible to customers — but only for as long as both of those facts hold.
 * Copy gets reused, and a "nice status line" is exactly the sort of thing that
 * later gets pasted onto a marketing page or lifted into a shared shell, at
 * which point an internal developer status message is shipping to buyers with
 * nothing failing.
 *
 * So this reads the source rather than rendering the component: the claim being
 * checked is about where the string exists in the repo, which no render of a
 * single component could tell us. Component modules also import through the
 * "@/" alias, which the type-stripping test runner does not resolve.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const PANEL = path.join(SRC, "components", "amber", "AmberFixesPanel.tsx");
const PANEL_CSS = path.join(SRC, "components", "amber", "amber-fixes.css");
const ROUTE = path.join(SRC, "app", "amber-builder", "page.tsx");

const STATUS_LINE = "Amber Fix — Autonomous Developer Online.";

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__") continue;
      out.push(...sourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx|css)$/.test(entry)) out.push(full);
  }
  return out;
}

test("the status banner is declared once and rendered in the Amber Fix header", () => {
  const panel = readFileSync(PANEL, "utf8");

  assert.ok(
    panel.includes(`const AMBER_FIX_STATUS_LINE = "${STATUS_LINE}";`),
    "AMBER_FIX_STATUS_LINE is no longer declared with the expected copy",
  );

  const head = panel.slice(panel.indexOf("amber-fixes-titles"), panel.indexOf("amber-fixes-projects"));
  assert.ok(head.length > 0, "the Amber Fix header markup is no longer laid out the way this test finds it");
  assert.match(head, /className="amber-fixes-status"/, "the status banner is not rendered in the header");
  assert.match(head, /\{AMBER_FIX_STATUS_LINE\}/, "the header renders a hardcoded string instead of the constant");
});

test("the status banner has styles of its own", () => {
  const css = readFileSync(PANEL_CSS, "utf8");
  // Plain `.amber-fixes-status` would lose to `.amber-fixes-titles p`, which sets
  // the muted description colour — the banner would silently render grey.
  assert.ok(
    css.includes(".amber-fixes-titles .amber-fixes-status {"),
    "the status banner rule must outrank `.amber-fixes-titles p`",
  );
  assert.ok(css.includes(".amber-fixes-status-dot {"), "the status dot has no styles");
});

test("the status banner reaches no customer-facing surface", () => {
  const carriers = sourceFiles(SRC).filter((f) => readFileSync(f, "utf8").includes(STATUS_LINE));
  assert.deepEqual(
    carriers.map((f) => path.relative(SRC, f)),
    [path.relative(SRC, PANEL)],
    "the admin-only status line has been copied outside AmberFixesPanel",
  );
});

test("the only route rendering the Amber Fix panel is admin-gated", () => {
  const importers = sourceFiles(SRC)
    .filter((f) => f.endsWith(".tsx") && f !== PANEL)
    .filter((f) => /from "[^"]*(?:@\/components\/amber|\.)\/AmberFixesPanel"/.test(readFileSync(f, "utf8")));

  assert.deepEqual(
    importers.map((f) => path.relative(SRC, f)),
    [path.relative(SRC, ROUTE)],
    "AmberFixesPanel is rendered somewhere other than the admin-gated /amber-builder route",
  );

  const route = readFileSync(ROUTE, "utf8");
  assert.match(route, /requireAdminAccess\(\)/, "/amber-builder no longer checks admin access");
  assert.match(route, /redirect\(`\/admin\/login/, "/amber-builder no longer redirects non-admins to the admin login");
});
