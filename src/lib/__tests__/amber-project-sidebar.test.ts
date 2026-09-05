/**
 * AmberProjectSidebar.tsx / AmberFixesPanel.tsx contain JSX, which this
 * repo's `node --experimental-strip-types` test runner cannot execute --
 * see auth-session.test.ts for why every whole-component test here reads
 * real source instead.
 *
 * These assertions guard two things the full IA rebuild (sidebar + workspace
 * header + activity console, replacing the old top-of-page project pills
 * and chat-first layout) must not regress:
 *  1. The project list is real configuration data rendered by the sidebar,
 *     not project names hard-coded into this component's own JSX -- a
 *     different owner's project list is a different array passed in.
 *  2. The global AuthBar overlap fix (hiding it on /amber-builder, moving
 *     account/sign-out inline) survives the redesign, just relocated to the
 *     sidebar footer instead of the old page header.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const SIDEBAR = readFileSync(path.join(SRC, "components", "amber", "AmberProjectSidebar.tsx"), "utf8");
const PANEL = readFileSync(path.join(SRC, "components", "amber", "AmberFixesPanel.tsx"), "utf8");
const AUTH_BAR = readFileSync(path.join(SRC, "components", "design", "AuthBar.tsx"), "utf8");
const REGISTRY = readFileSync(path.join(SRC, "lib", "amber", "project-registry.ts"), "utf8");

test("the sidebar renders whatever project list it's given -- no project name is hard-coded into its own JSX", () => {
  assert.match(SIDEBAR, /projects\.map\(/, "must render from the projects prop, not a literal list");
  for (const name of ["Reelo", "Forma", "Amber HQ", "Launch Ready", "Rest Pilot", "Dayli"]) {
    assert.doesNotMatch(
      SIDEBAR,
      new RegExp(`"${name}"`),
      `"${name}" must not be hard-coded in the sidebar component -- it belongs only in project-registry.ts's data`,
    );
  }
});

test("the panel feeds the sidebar the one real project-registry list, not a duplicate", () => {
  assert.match(PANEL, /import \{ PROJECTS, projectLabel \} from "@\/lib\/amber\/project-registry"/);
  assert.match(PANEL, /<AmberProjectSidebar\s/);
  assert.match(PANEL, /projects=\{PROJECTS\}/, "must pass the real registry list, not an inline array");
});

test("each project's sidebar status comes from that project's own real most-recent run, never fabricated", () => {
  assert.match(PANEL, /statusByProject/);
  assert.match(
    PANEL,
    /out\[p\.key\] = \{ status: run\.status, prUrl: run\.prUrl, mergedAt: run\.mergedAt \}/,
    "must copy real fields off a real run object, not invent a status for a project with no runs",
  );
});

test("the sidebar's status dot is idle (not colored) when a project has no run recorded", () => {
  const fn = SIDEBAR.slice(SIDEBAR.indexOf("function dotToneFor"), SIDEBAR.indexOf("export default function"));
  assert.match(fn, /if \(!s \|\| !s\.status\) return "idle";/);
});

test("the global AuthBar is still hidden on /amber-builder after the redesign", () => {
  const hiddenOnLine = AUTH_BAR.slice(
    AUTH_BAR.indexOf("const HIDDEN_ON ="),
    AUTH_BAR.indexOf(";", AUTH_BAR.indexOf("const HIDDEN_ON =")) + 1,
  );
  assert.match(hiddenOnLine, /"\/amber-builder"/);
  assert.match(hiddenOnLine, /"\/login"/);
  assert.match(hiddenOnLine, /"\/signup"/);
});

test("account and sign-out are still reachable from the redesigned page, now in the sidebar footer", () => {
  assert.match(PANEL, /fetch\("\/api\/auth"\)/);
  assert.match(SIDEBAR, /amber-sidebar-account/);
  assert.match(SIDEBAR, /amber-sidebar-signout/);
  assert.match(SIDEBAR, /account\.role === "OWNER" \|\| account\.role === "ADMIN"/, "role badge must gate on the real account role");
});

test("a way back to Business Center still exists after removing the old page header", () => {
  assert.match(SIDEBAR, /href="\/business-center"/);
});

test("project-registry.ts remains the single source both the sidebar and text-dispatch read -- not two drifting copies", () => {
  assert.match(REGISTRY, /export const PROJECTS: ProjectDef\[\] =/);
  assert.match(PANEL, /resolveDispatchProject/);
});
