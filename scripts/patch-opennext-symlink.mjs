/**
 * OpenNext on Windows without Developer Mode fails when recreating package
 * symlinks (EPERM). Patch copyTracedFiles to copy instead.
 * Idempotent. Run before `opennextjs-cloudflare build`.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const target = path.join(
  process.cwd(),
  "node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js",
);
if (!existsSync(target)) {
  console.log("skip: copyTracedFiles.js not found");
  process.exit(0);
}

const src = readFileSync(target, "utf8");
if (src.includes("Windows without symlink privilege")) {
  console.log("opennext symlink patch already applied");
  process.exit(0);
}

const needle = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

const replacement = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code === "EEXIST") {
                    // already linked
                }
                else if (e.code === "EPERM" || e.code === "EINVAL") {
                    // Windows without symlink privilege: materialize a real copy.
                    const resolved = path.isAbsolute(symlink)
                        ? symlink
                        : path.resolve(path.dirname(from), symlink);
                    cpSync(resolved, to, { recursive: true });
                }
                else {
                    throw e;
                }
            }
        }`;

if (!src.includes(needle)) {
  console.log("skip: expected symlink block not found (opennext version changed?)");
  process.exit(0);
}

writeFileSync(target, src.replace(needle, replacement));
console.log("applied opennext Windows symlink→copy patch");
