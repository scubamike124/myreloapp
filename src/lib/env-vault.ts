import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// The key vault: a dev-time editor for .env.local.
//
// Deliberate design constraints, because this writes secrets to disk:
//
//  1. Keys are written to the SERVER's .env.local — never to browser storage.
//     (The old gateways page put live Stripe secrets in localStorage; this
//     exists so there is a convenient path that isn't that.)
//  2. Only names in KNOWN_KEYS can be written. Without an allowlist, writing an
//     arbitrary env var to .env.local is a code-execution vector — NODE_OPTIONS
//     alone would let someone preload a script into the next server start.
//  3. Secret VALUES are never sent back to the browser. Reads return presence
//     plus a short masked hint only.
//  4. Writes are refused in production (see canWrite). A deployed filesystem is
//     read-only and ephemeral, so the honest answer there is the host's own
//     environment settings.
// ---------------------------------------------------------------------------

export type KeyKind = "secret" | "public";

export type KnownKey = {
  name: string;
  label: string;
  kind: KeyKind;
  /** What breaks without it — shown in the UI. */
  purpose: string;
  /** Where to get it. */
  source?: string;
  /** Rough shape check to catch obvious paste mistakes. */
  pattern?: RegExp;
  group: string;
};

export const KNOWN_KEYS: KnownKey[] = [
  {
    name: "GEMINI_API_KEY",
    label: "Google Gemini API key",
    kind: "secret",
    purpose: "Amber, website scanning, and avatar video/image generation",
    source: "https://aistudio.google.com",
    // Two formats in the wild: the legacy `AIza…` key, and the newer `AQ.…`
    // key that AI Studio issues now (dotted, ~53 chars). Both verified working.
    pattern: /^(?:AIza[\w-]{30,}|AQ\.[\w.-]{20,})$/,
    group: "AI providers",
  },
  {
    name: "HEYGEN_API_KEY",
    label: "HeyGen API key",
    kind: "secret",
    purpose: "Avatar catalog and HeyGen talking-avatar videos",
    source: "https://app.heygen.com",
    group: "AI providers",
  },
  {
    name: "DATABASE_URL",
    label: "Database connection string",
    kind: "secret",
    purpose: "User accounts, token balances and purchase history",
    source: "https://neon.tech",
    pattern: /^postgres(ql)?:\/\//,
    group: "Accounts",
  },
  {
    name: "ADMIN_PASSWORD",
    label: "Admin password",
    kind: "secret",
    purpose: "Access to this admin dashboard",
    group: "Admin access",
  },
  {
    name: "ADMIN_SESSION_SECRET",
    label: "Admin session secret",
    kind: "secret",
    purpose: "Signs admin session cookies so changing the password logs everyone out",
    group: "Admin access",
  },
  {
    name: "STRIPE_PUBLISHABLE_KEY",
    label: "Stripe publishable key",
    kind: "public",
    purpose: "Checkout (no checkout flow consumes this yet)",
    pattern: /^pk_(test|live)_/,
    group: "Payments",
  },
  {
    name: "STRIPE_SECRET_KEY",
    label: "Stripe secret key",
    kind: "secret",
    purpose: "Server-side Stripe calls (not wired up yet)",
    pattern: /^sk_(test|live)_/,
    group: "Payments",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe webhook signing secret",
    kind: "secret",
    purpose: "Verifying Stripe webhooks (not wired up yet)",
    pattern: /^whsec_/,
    group: "Payments",
  },
  {
    name: "PAYPAL_CLIENT_ID",
    label: "PayPal client ID",
    kind: "public",
    purpose: "PayPal checkout (not wired up yet)",
    group: "Payments",
  },
  {
    name: "PAYPAL_CLIENT_SECRET",
    label: "PayPal client secret",
    kind: "secret",
    purpose: "Server-side PayPal calls (not wired up yet)",
    group: "Payments",
  },
  {
    name: "VIDEO_DAILY_LIMIT",
    label: "Daily video limit",
    kind: "public",
    purpose: "Per-user cap on Veo video generations (default 5)",
    pattern: /^\d+$/,
    group: "Limits",
  },
  {
    name: "IMAGE_DAILY_LIMIT",
    label: "Daily image limit",
    kind: "public",
    purpose: "Per-user cap on avatar image generations (default 20)",
    pattern: /^\d+$/,
    group: "Limits",
  },
  {
    name: "ANALYZE_DAILY_LIMIT",
    label: "Daily website-scan limit",
    kind: "public",
    purpose: "Per-user cap on website scans (default 25)",
    pattern: /^\d+$/,
    group: "Limits",
  },
  {
    name: "HEYGEN_DAILY_LIMIT",
    label: "Daily HeyGen limit",
    kind: "public",
    purpose: "Per-user cap on HeyGen videos (default 5)",
    pattern: /^\d+$/,
    group: "Limits",
  },
  {
    name: "HEYGEN_MAX_SECONDS",
    label: "Max video length (seconds)",
    kind: "public",
    purpose: "Caps spoken length of HeyGen clips (default 30)",
    pattern: /^\d+$/,
    group: "Limits",
  },
  {
    name: "NEXT_PUBLIC_SOCIAL_TIKTOK",
    label: "TikTok profile URL",
    kind: "public",
    purpose: "Shows a TikTok icon in the footer",
    group: "Social links",
  },
  {
    name: "NEXT_PUBLIC_SOCIAL_YOUTUBE",
    label: "YouTube profile URL",
    kind: "public",
    purpose: "Shows a YouTube icon in the footer",
    group: "Social links",
  },
  {
    name: "NEXT_PUBLIC_SOCIAL_INSTAGRAM",
    label: "Instagram profile URL",
    kind: "public",
    purpose: "Shows an Instagram icon in the footer",
    group: "Social links",
  },
  {
    name: "NEXT_PUBLIC_SOCIAL_FACEBOOK",
    label: "Facebook profile URL",
    kind: "public",
    purpose: "Shows a Facebook icon in the footer",
    group: "Social links",
  },
];

const BY_NAME = new Map(KNOWN_KEYS.map((k) => [k.name, k]));

export function isKnownKey(name: string): boolean {
  return BY_NAME.has(name);
}

export function getKnownKey(name: string): KnownKey | undefined {
  return BY_NAME.get(name);
}

/**
 * Writes are only allowed outside production. On a deployed host the filesystem
 * is read-only and per-instance, so writing there would silently do nothing —
 * and allowing arbitrary config writes on a public server is a bad trade.
 */
export function canWrite(): boolean {
  return process.env.NODE_ENV !== "production";
}

const ENV_PATH = path.join(process.cwd(), ".env.local");

/**
 * Show only the last 4 characters, the way Stripe and AWS do. Revealing a
 * prefix too would leak a meaningful fraction of a short secret — an admin
 * password like "hunter2-abcd" would be more than half exposed.
 */
export function mask(value: string): string {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
}

export type KeyStatus = {
  name: string;
  label: string;
  kind: KeyKind;
  purpose: string;
  source?: string;
  group: string;
  set: boolean;
  /** Masked for secrets; plain for public values (they're not sensitive). */
  preview: string | null;
  /** True when the live process has a value that differs from .env.local, i.e.
   *  the server hasn't picked up a recent edit yet. */
  needsRestart: boolean;
};

/** Parse a .env file into a map. Handles `export `, quotes, and comments. */
function parseEnv(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out.set(m[1], value);
  }
  return out;
}

async function readEnvFile(): Promise<string> {
  try {
    return await readFile(ENV_PATH, "utf8");
  } catch {
    return ""; // no .env.local yet — that's fine, we'll create it
  }
}

/** Current status of every known key. Never leaks a secret value. */
export async function readStatuses(): Promise<KeyStatus[]> {
  const fileValues = parseEnv(await readEnvFile());

  return KNOWN_KEYS.map((k) => {
    const fileValue = fileValues.get(k.name) ?? "";
    const liveValue = process.env[k.name] ?? "";
    const effective = fileValue || liveValue;
    const set = effective.length > 0;

    return {
      name: k.name,
      label: k.label,
      kind: k.kind,
      purpose: k.purpose,
      source: k.source,
      group: k.group,
      set,
      preview: set ? (k.kind === "secret" ? mask(effective) : effective) : null,
      // The running process only reads .env.local at startup.
      needsRestart: fileValue !== "" && fileValue !== liveValue,
    };
  });
}

/**
 * Read one key's real value, preferring .env.local over the running process so
 * a just-saved key can be tested without a restart.
 *
 * SERVER ONLY. The return value must never be sent to the browser — it exists
 * so the server can make a validation call on the user's behalf.
 */
export async function readRawValue(name: string): Promise<string> {
  if (!BY_NAME.has(name)) return "";
  const fileValue = parseEnv(await readEnvFile()).get(name);
  return fileValue || process.env[name] || "";
}

export type WriteResult = {
  written: string[];
  errors: { name: string; message: string }[];
  warnings: { name: string; message: string }[];
};

/**
 * Merge updates into .env.local, preserving unrelated lines and comments.
 * An empty value removes the key. Rejects anything not in KNOWN_KEYS.
 */
export async function writeKeys(updates: Record<string, string>): Promise<WriteResult> {
  const result: WriteResult = { written: [], errors: [], warnings: [] };
  const accepted = new Map<string, string>();

  for (const [name, rawValue] of Object.entries(updates)) {
    const known = BY_NAME.get(name);
    if (!known) {
      // Refuse unknown names outright — see note 2 at the top of this file.
      result.errors.push({ name, message: "Unknown key — not writable." });
      continue;
    }
    const value = String(rawValue ?? "").trim();

    if (value.length > 0) {
      if (/[\r\n]/.test(value)) {
        result.errors.push({ name, message: "Value cannot contain line breaks." });
        continue;
      }
      // A shape mismatch is a hint, not a verdict. Providers change their key
      // formats without telling us, and refusing to save a key the provider
      // would happily accept leaves no way forward. Save it and flag it — the
      // Test button asks the provider itself, which is the real answer.
      if (known.pattern && !known.pattern.test(value)) {
        result.warnings.push({
          name,
          message: `This doesn't match the usual ${known.label} format — saved anyway. Use Test to check it against the provider.`,
        });
      }
    }
    accepted.set(name, value);
  }

  if (accepted.size === 0) return result;

  const original = await readEnvFile();
  const lines = original ? original.split(/\r?\n/) : [];
  const handled = new Set<string>();

  // Replace existing definitions in place so surrounding comments survive.
  const next = lines.map((line) => {
    const m = line.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!m) return line;
    const name = m[1];
    if (!accepted.has(name)) return line;
    handled.add(name);
    const value = accepted.get(name)!;
    return value === "" ? null : `${name}=${serializeValue(value)}`;
  });

  const kept = next.filter((l): l is string => l !== null);

  // Append anything that wasn't already present.
  const additions: string[] = [];
  for (const [name, value] of accepted) {
    if (handled.has(name) || value === "") continue;
    additions.push(`${name}=${serializeValue(value)}`);
  }
  if (additions.length > 0) {
    if (kept.length > 0 && kept[kept.length - 1].trim() !== "") kept.push("");
    kept.push("# Added from the Reelo admin vault", ...additions);
  }

  const output = kept.join("\n").replace(/\n{3,}$/, "\n") + (kept[kept.length - 1] === "" ? "" : "\n");

  // Write to a temp file then rename, so an interrupted write can't leave a
  // half-written .env.local that breaks the next server start.
  const tmp = `${ENV_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, output, { encoding: "utf8", mode: 0o600 });
  await rename(tmp, ENV_PATH);

  result.written = [...accepted.keys()];
  return result;
}

/** Quote only when needed, so the file stays readable. */
function serializeValue(value: string): string {
  return /[\s#"']/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}
