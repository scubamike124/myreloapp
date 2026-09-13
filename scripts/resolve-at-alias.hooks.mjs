// Node's own module resolver has no idea what "@/" means — that mapping is
// TypeScript's own (tsconfig.json's `paths`), applied by the bundler at
// build time and by IDEs for navigation, never by Node itself. Running
// tests directly with `node --experimental-strip-types` (no bundler in the
// loop) hits this the moment any file under test transitively imports
// something via "@/..." — Node throws ERR_MODULE_NOT_FOUND treating "@" as
// an npm package name, because as far as Node is concerned, that is exactly
// what it looks like.
//
// This is a genuinely small, real gap: `identity.ts` and `opportunity.ts`
// (property-intelligence) both import `@/lib/db`, and their test files
// (matching.test.ts, blueprint-unlock.test.ts) failed with exactly this
// error before this loader existed — not a bug in either file, just Node
// asked to resolve a path only the bundler knows how to read.
//
// Registered via `--import` so it applies to every test file run this way,
// project-wide, rather than patching each affected file's imports one at a
// time as the next one happens to need it.
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = pathToFileURL(path.join(import.meta.dirname, "..", "src") + "/").href;

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    // "@/lib/db" carries no extension — that is fine for the bundler, which
    // resolves it against the real file on disk, but Node's own resolver
    // needs one. Every source file the alias points into is TypeScript.
    const rest = /\.[a-zA-Z0-9]+$/.test(specifier) ? specifier.slice(2) : `${specifier.slice(2)}.ts`;
    return next(new URL(rest, ROOT).href, context);
  }
  return next(specifier, context);
}
