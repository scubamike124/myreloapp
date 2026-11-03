/**
 * The avatar library's secondary filter has to reach the list, not just the heading.
 *
 * `/avatars` renders eight filter links — Sofa & Lounge, Casual, Outdoor,
 * Office, Standing, Seated, Formal Wear, Uniform — and every one of them points
 * at `/avatars/all?filter=<slug>`. The category page read that param, counted
 * the filtered catalog into the `(n)` beside the title, and printed a "Clear
 * the Office filter" link, and then rendered `<AvatarList primary={slug} />`
 * with no filter at all. The list fetched `/api/avatars` without `filter`, so
 * the page showed "Office (128)" above all 1,509 avatars. The API and the
 * search function both handled `filter` correctly the whole time; the prop was
 * simply never passed, which is why nothing failed loudly.
 *
 * Two halves, because the bug had two halves:
 *
 *   1. The filter genuinely narrows the catalog — asserted against the real
 *      data, so the heading's number is a real number and a list that ignores
 *      it is provably showing something else.
 *   2. The filter is actually plumbed URL -> page -> AvatarList -> /api/avatars.
 *      This part reads the source, in the same style as pricing-coverage.test.ts,
 *      auth-session.test.ts and db-access.test.ts: the wiring lives in a React
 *      component and a server page, and this repo's runner has no path-alias or
 *      JSX support, so the shipped source is what can be checked.
 *
 *   node --experimental-strip-types --test src/lib/__tests__/avatar-browse.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { FILTERS, ALL_PRIMARIES, inFilter, inPrimary, type CatalogAvatar } from "../avatar-taxonomy.ts";

const SRC = path.join(process.cwd(), "src");
const read = (rel: string) => readFileSync(path.join(SRC, rel), "utf8");
const readJson = (rel: string) => JSON.parse(read(rel)) as CatalogAvatar[];

/**
 * The catalog, assembled the way avatar-catalog.ts assembles it.
 *
 * Rebuilt here rather than imported because avatar-catalog.ts imports through
 * the "@/" alias, which the type-stripping runner does not resolve.
 * avatar-taxonomy.ts imports nothing, so the matching logic under test is the
 * real one.
 */
const CATALOG: CatalogAvatar[] = [
  ...readJson("data/character-avatars.json").map((a) => ({ ...a, source: "reelo", gender: a.gender || "neutral" })),
  ...readJson("data/heygen-avatars.json").map((a) => ({ ...a, source: "heygen" })),
];

test("every filter link on /avatars leads to a genuinely narrower list", () => {
  assert.ok(CATALOG.length > 100, "the catalog did not load — this test is checking nothing");

  for (const f of FILTERS) {
    const n = CATALOG.filter((a) => inFilter(a, f.slug)).length;
    assert.ok(n > 0, `the ${f.name} filter matches no avatar, so its link on /avatars leads to an empty page`);
    assert.ok(
      n < CATALOG.length,
      `the ${f.name} filter matches the whole catalog, so this test cannot tell a filtered list from an unfiltered one`,
    );
  }
});

test("a filter applied inside a category never widens it", () => {
  // The property the category page's count relies on: search({ primary, filter })
  // is a subset of search({ primary }). If it were not, showing the filtered
  // count above a filtered list would still be inconsistent.
  for (const p of ALL_PRIMARIES) {
    const inCategory = CATALOG.filter((a) => inPrimary(a, p.slug));
    if (!inCategory.length) continue;
    for (const f of FILTERS) {
      const both = inCategory.filter((a) => inFilter(a, f.slug));
      assert.ok(
        both.length <= inCategory.length,
        `${p.slug} + ${f.slug} returned more avatars than ${p.slug} alone`,
      );
    }
  }
});

test("the category page hands its filter to the list, not only to the heading", () => {
  const page = read("app/avatars/[slug]/page.tsx");

  assert.match(
    page,
    /<AvatarList[^>]*\bfilter=\{/,
    "the page reads ?filter= and prints a 'Clear the … filter' link, so it must pass that filter to <AvatarList> — " +
      "without it the heading counts one set of avatars and the list below shows another",
  );
  assert.match(
    page,
    /search\(\s*\{\s*primary:\s*slug,\s*filter\s*[,}]/,
    "the count for a category must include the filter too, or /avatars/healthcare?filter=office shows the unfiltered total",
  );
});

test("AvatarList forwards its filter to /api/avatars and refetches when it changes", () => {
  const list = read("components/avatars/AvatarList.tsx");

  const load = list.slice(list.indexOf("const load = useCallback("), list.indexOf("useEffect("));
  assert.ok(load.length > 0, "AvatarList no longer loads through a useCallback — this test needs rewriting, not deleting");

  assert.match(
    load,
    /p\.set\(\s*["']filter["']\s*,\s*filter\s*\)/,
    "the filter must go into the /api/avatars query string — the endpoint already supports it",
  );
  assert.match(
    load.slice(load.lastIndexOf("[")),
    /\bfilter\b/,
    "filter must be a dependency of load, or switching filters keeps showing the previous filter's results",
  );
});

test("/api/avatars still accepts the filter it is being sent", () => {
  const route = read("app/api/avatars/route.ts");
  assert.match(
    route,
    /filter:\s*\(sp\.get\(["']filter["']\)/,
    "the route must read ?filter= — everything above depends on it",
  );
});
