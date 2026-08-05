/**
 * Every action that is charged or advertised must have a price.
 *
 * This is a whole-repository test rather than a unit test, because the bug it
 * guards against is not in any one function. `costOf` returns 1 token for an
 * action it does not recognise and `creditLabel` returns the words "Pricing to
 * be confirmed" — neither throws, neither logs. So a tool can ship, charge the
 * wrong amount, and print a placeholder where its price should be, and every
 * test in the suite still passes.
 *
 * That is not hypothetical. `ai-story-maker` was live in exactly that state:
 * `chargeFor("ai-story-maker")` in its route and `TokenMeter slug="ai-story-maker"`
 * twice in its UI, and the slug in neither price table. It billed 1 token by
 * accident and displayed "Pricing to be confirmed" to customers.
 *
 * So the check reads the source for the slugs that are actually used, rather
 * than trusting a list someone has to remember to update — a list like that
 * would have been just as out of date as the price table was.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

/**
 * The priced actions, read out of the source rather than imported.
 *
 * `token-costs.ts` imports through the "@/" alias, which the type-stripping
 * test runner does not resolve. Reading the file is not a workaround here so
 * much as the more faithful check: this test is about what the shipped source
 * says, and parsing it cannot be satisfied by a mock.
 */
function pricedActions(): Set<string> {
  const source = readFileSync(path.join(SRC, "lib", "token-costs.ts"), "utf8");
  const start = source.indexOf("export const TOKEN_COST");
  assert.ok(start >= 0, "TOKEN_COST is no longer declared the way this test finds it");
  const body = source.slice(start, source.indexOf("};", start));
  const keys = new Set<string>();
  for (const m of body.matchAll(/^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/gm)) {
    keys.add(m[1] ?? m[2] ?? m[3]);
  }
  keys.delete("TOKEN_COST");
  return keys;
}

const PRICED = pricedActions();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Actions priced by duration rather than by a flat entry.
 *
 * `costOf` resolves these before it ever reads TOKEN_COST, so their absence
 * from the map is correct rather than an oversight.
 */
const DURATION_PRICED = new Set([
  "website-commercial",
  "product-commercial",
  "talking-photo",
  "dancing-photo",
  "ai-avatar-studio",
]);

const files = walk(SRC);

function slugsMatching(pattern: RegExp): Map<string, string> {
  const found = new Map<string, string>();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      const slug = match[1];
      // Template literals and variables are not literal slugs; skip anything
      // that is not a plain identifier-ish string.
      if (!slug || /[${}]/.test(slug)) continue;
      if (!found.has(slug)) found.set(slug, path.relative(process.cwd(), file).replace(/\\/g, "/"));
    }
  }
  return found;
}

test("every action passed to chargeFor has a price", () => {
  const charged = slugsMatching(/chargeFor\(\s*["'`]([^"'`]+)["'`]/g);
  assert.ok(charged.size > 0, "found no chargeFor call sites — the scan is broken, not the code");

  const unpriced = [...charged].filter(([slug]) => !DURATION_PRICED.has(slug) && !PRICED.has(slug));
  assert.deepEqual(
    unpriced,
    [],
    `these actions are charged but have no price, so costOf() silently bills 1 token:\n` +
      unpriced.map(([slug, file]) => `  ${slug}  (${file})`).join("\n"),
  );
});

test("every slug shown to a customer has a price", () => {
  const shown = new Map([
    ...slugsMatching(/<TokenMeter[^>]*\bslug=["']([^"']+)["']/g),
    ...slugsMatching(/creditLabel\(\s*["'`]([^"'`]+)["'`]/g),
  ]);
  assert.ok(shown.size > 0, "found no price displays — the scan is broken, not the code");

  const unpriced = [...shown].filter(([slug]) => !DURATION_PRICED.has(slug) && !PRICED.has(slug));
  assert.deepEqual(
    unpriced,
    [],
    `these slugs are displayed but have no price, so the page reads "Pricing to be confirmed":\n` +
      unpriced.map(([slug, file]) => `  ${slug}  (${file})`).join("\n"),
  );
});

test("the storybook delivery products are priced before anything can charge them", () => {
  // Named explicitly as well as caught by the scan above: the delivery picker
  // will charge these, and a movie billed at the unknown-action default would
  // sell a $40 product for $10.
  for (const slug of ["storybook-ebook", "storybook-movie", "storybook-bundle"]) {
    assert.ok(PRICED.has(slug), `${slug} is not in TOKEN_COST`);
  }
  // The amounts themselves are asserted against FLAT_TOKEN_COST in
  // storybook/__tests__/products.test.ts, which can import it directly.
  assert.ok(PRICED.has("ai-story-maker"), "ai-story-maker is not in TOKEN_COST");
});
