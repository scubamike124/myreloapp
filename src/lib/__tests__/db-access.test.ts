/**
 * Nothing may use the synchronous `sql()` outside db.ts.
 *
 * `sql()` returns null on Cloudflare Workers whenever Postgres is reached over
 * TCP — which is this app's production configuration, Supabase behind
 * Hyperdrive. db.ts says so in a comment at the return: *"Sync path cannot read
 * Hyperdrive. On Workers + non-Neon, callers must use sqlAsync()."*
 *
 * A caller that ignores that does not crash and does not log. It gets null,
 * takes whatever "database unavailable" branch it has, and returns an empty
 * list or a 503 — forever, in production only, while working perfectly in
 * development against SQLite.
 *
 * That is exactly what happened: POST /api/creations answered 503 to every
 * request, so no video a customer paid for was ever recorded, and the Library
 * they were sent to could never show anything. It was invisible for as long as
 * nobody opened the library on the live site.
 *
 * A grep is a blunt instrument, and it is the right one here: the failure is
 * silent, environment-specific, and cannot be reproduced by any unit test that
 * does not run on Workers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

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

test("no caller outside db.ts uses the synchronous sql()", () => {
  const offenders: string[] = [];

  for (const file of walk(SRC)) {
    // db.ts defines both and legitimately uses the sync one internally.
    if (file.endsWith(`${path.sep}db.ts`)) continue;
    const source = readFileSync(file, "utf8");
    // `= sql()` is the assignment form every caller uses. Deliberately narrow:
    // sqlAsync(), sql`...` tagged templates and unrelated identifiers ending in
    // "sql" must not match.
    for (const m of source.matchAll(/=\s*sql\(\)/g)) {
      const line = source.slice(0, m.index).split("\n").length;
      offenders.push(`${path.relative(process.cwd(), file).replace(/\\/g, "/")}:${line}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `these call sites get null on Workers and fail silently in production — use \`await sqlAsync()\`:\n` +
      offenders.map((o) => `  ${o}`).join("\n"),
  );
});
