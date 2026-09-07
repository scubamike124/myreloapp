/**
 * The public pages must not send visitors somewhere other than where the link
 * says they are going.
 *
 * The bug this was written for: the "See Roadmap" button under the three Phase
 * cards in FeaturesSection pointed at "/#how-it-works" — the How It Works
 * section of the home page, not the roadmap. Nothing failed. Next.js happily
 * routes to "/", the anchor exists, and every test passed, so the only way to
 * notice was to click it. On /features it was worse: the button threw you off
 * the page you were reading and onto the home page.
 *
 * Neither check imports anything. Both read the shipped .tsx source, because a
 * link is markup rather than a function and there is nothing to call.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const APP = path.join(SRC, "app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walk(full, out);
    } else if (entry.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/** Every route that has a page, with route groups like "(dashboard)" removed. */
function routes(): string[] {
  const found: string[] = [];
  for (const file of walk(APP)) {
    if (path.basename(file) !== "page.tsx") continue;
    const dir = path.relative(APP, path.dirname(file)).split(path.sep).filter(Boolean);
    const segments = dir.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
    found.push("/" + segments.join("/"));
  }
  return found.map((r) => (r === "/" ? r : r.replace(/\/$/, "")));
}

const ROUTES = routes();

/** "/create/[slug]" matches "/create/talking-photo". */
function isRoute(pathname: string): boolean {
  const want = pathname.split("/").filter(Boolean);
  return ROUTES.some((route) => {
    const have = route.split("/").filter(Boolean);
    if (have.length !== want.length) return false;
    return have.every((seg, i) => (seg.startsWith("[") && seg.endsWith("]")) || seg === want[i]);
  });
}

const FILES = walk(SRC);

test("every internal link points at a route that exists", () => {
  assert.ok(ROUTES.length > 0, "found no page.tsx files — the scan is broken, not the code");

  const dead: string[] = [];
  for (const file of FILES) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/href="(\/[^"]*)"/g)) {
      // Template literals and interpolated paths are not literal links.
      if (/[${}]/.test(match[1])) continue;
      // "/#pricing" is the home page plus an anchor; the anchor is not a route.
      const pathname = match[1].split(/[#?]/)[0].replace(/\/$/, "") || "/";
      if (isRoute(pathname)) continue;
      dead.push(`  ${match[1]}  (${path.relative(process.cwd(), file).replace(/\\/g, "/")})`);
    }
  }

  assert.deepEqual(dead, [], `these links have no page behind them:\n${dead.join("\n")}`);
});

test("a link that says Roadmap goes to the roadmap", () => {
  const wrong: string[] = [];
  let checked = 0;

  for (const file of FILES) {
    const source = readFileSync(file, "utf8");
    // <Link href="...">…Roadmap…</Link> — the label is what the visitor reads,
    // so it is the label, not the href, that decides where this should go.
    for (const match of source.matchAll(/<Link\s+href="([^"]+)"[^>]*>([^<]*)<\/Link>/g)) {
      const [, href, label] = match;
      if (!/roadmap/i.test(label)) continue;
      checked++;
      if (href.split(/[#?]/)[0].replace(/\/$/, "") === "/roadmap") continue;
      wrong.push(`  "${label.trim()}" → ${href}  (${path.relative(process.cwd(), file).replace(/\\/g, "/")})`);
    }
  }

  assert.ok(checked > 0, "found no links labelled Roadmap — the scan is broken, not the code");
  assert.deepEqual(wrong, [], `these links say Roadmap but go somewhere else:\n${wrong.join("\n")}`);
});
