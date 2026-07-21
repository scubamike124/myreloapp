#!/usr/bin/env node
// ---------------------------------------------------------------------------
// One-time bootstrap: creates .env.local with an admin password so you can log
// in and manage every other key from Admin → Key vault.
//
// This exists because of a chicken-and-egg problem: the vault is behind the
// admin login, and the admin password is itself one of the keys. Something has
// to set that first key outside the browser.
//
// Run with: npm run setup
// ---------------------------------------------------------------------------

import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env.local");

async function readExisting() {
  try {
    return await readFile(ENV_PATH, "utf8");
  } catch {
    return "";
  }
}

function hasKey(text, name) {
  return new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*\\S`, "m").test(text);
}

/** Read a line without echoing it to the terminal. */
async function askHidden(rl, question) {
  // Piped/non-interactive stdin can't be masked, and the raw-mode reader below
  // would fight readline for the stream. Fall back to a plain prompt.
  if (!stdin.isTTY) return rl.question(question);

  stdout.write(question);
  const wasRaw = stdin.isRaw;
  stdin.setRawMode(true);

  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk) => {
      const s = chunk.toString("utf8");
      for (const ch of s) {
        if (ch === "\r" || ch === "\n") {
          stdin.off("data", onData);
          if (stdin.isTTY) stdin.setRawMode(Boolean(wasRaw));
          stdout.write("\n");
          resolve(value);
          return;
        }
        const code = ch.charCodeAt(0);
        if (code === 3) {
          // Ctrl+C
          stdout.write("\n");
          process.exit(130);
        }
        if (code === 127 || code === 8) {
          // Backspace / delete
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        if (code < 32) continue; // ignore other control characters
        value += ch;
        stdout.write("*");
      }
    };
    stdin.on("data", onData);
    rl.pause();
  });
}

const existing = await readExisting();

console.log("\n  Reelo setup\n  ───────────\n");

if (hasKey(existing, "ADMIN_PASSWORD")) {
  console.log("  .env.local already has ADMIN_PASSWORD set.");
  console.log("  Start the app with `npm run dev`, then open http://localhost:3000/admin");
  console.log("  and use Key vault to manage the rest.\n");
  process.exit(0);
}

let password = "";

// Non-interactive path, for scripted setup:
//   SETUP_ADMIN_PASSWORD=... npm run setup
const fromEnv = (process.env.SETUP_ADMIN_PASSWORD ?? "").trim();

if (fromEnv) {
  if (fromEnv.length < 8) {
    console.log("  SETUP_ADMIN_PASSWORD must be at least 8 characters.\n");
    process.exit(1);
  }
  password = fromEnv;
  console.log("  Using SETUP_ADMIN_PASSWORD from the environment.");
} else if (!stdin.isTTY) {
  console.log("  No terminal available for a password prompt.");
  console.log("  Run it interactively, or pass SETUP_ADMIN_PASSWORD=<password>.\n");
  process.exit(1);
} else {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (password.length < 8) {
      password = (await askHidden(rl, "  Choose an admin password (min 8 chars): ")).trim();
      if (password.length < 8) console.log("  Too short — try again.");
    }

    const confirm = (await askHidden(rl, "  Confirm password: ")).trim();
    if (confirm !== password) {
      console.log("\n  Passwords didn't match. Nothing was written.\n");
      process.exit(1);
    }
  } finally {
    rl.close();
  }
}

const sessionSecret = randomBytes(32).toString("hex");

const block = [
  "# Created by `npm run setup`.",
  "# This file is gitignored — never commit it.",
  "# Manage the remaining keys at http://localhost:3000/admin → Key vault",
  "",
  `ADMIN_PASSWORD=${/[\s#"']/.test(password) ? `"${password.replace(/"/g, '\\"')}"` : password}`,
  `ADMIN_SESSION_SECRET=${sessionSecret}`,
  "",
].join("\n");

const output = existing.trim().length > 0 ? `${existing.replace(/\s*$/, "")}\n\n${block}` : block;

await writeFile(ENV_PATH, output, { encoding: "utf8", mode: 0o600 });

console.log("\n  ✓ Wrote .env.local (admin password + a random session secret)\n");
console.log("  Next:");
console.log("    1. npm run dev");
console.log("    2. open http://localhost:3000/admin");
console.log("    3. add your Gemini and HeyGen keys in Key vault\n");
