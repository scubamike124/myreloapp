/**
 * Relo's copy of the Amber bridge secret, held where Relo can actually write.
 *
 * ==================== WHY THIS EXISTS ====================
 * Establishing the telemetry bridge needs one value present on both hosts.
 * Production ruled out the alternatives, one press at a time:
 *
 *   - The owner setting it on both dashboards means handling a live credential
 *     by hand across two consoles.
 *   - Amber installing it on Relo's Worker needs a Cloudflare API token, and on
 *     2026-09-15 production answered NO_CLOUDFLARE_TOKEN — she has none.
 *
 * The root constraint is narrow and worth naming precisely: a Worker SECRET
 * can only be written through Cloudflare. But nothing requires Relo to READ
 * the credential from a Worker secret. Amber already reads hers from her
 * environment, falling back to her own encrypted vault. This makes Relo
 * symmetric — env first, then a row it can write itself — and Cloudflare drops
 * out of the path entirely.
 * =========================================================
 *
 * ------------------------------ SAFETY ------------------------------
 * - Encrypted at rest with the SAME helper Relo already uses for OAuth tokens
 *   (AES-256-GCM, keyed by SOCIAL_TOKEN_SECRET / VAULT_MASTER_KEY). No new
 *   cryptography is introduced here.
 * - If no encryption key is present the value is NOT written in plaintext as a
 *   fallback. Storing a live credential unencrypted to avoid an error is how a
 *   database breach becomes a credential breach.
 * - Nothing here is reachable from a browser-facing route. The only consumers
 *   are server-side: the bridge client, and the connect action.
 * --------------------------------------------------------------------
 */
import { randomBytes } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { encryptToken, decryptToken, canEncryptTokens } from "@/lib/social/tokens";

const KEY = "REELO_ORG_BRIDGE_SECRET";

async function db() {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

/**
 * Created on demand rather than inside ensureSchema().
 *
 * ensureSchema() runs on ordinary page requests, and this table is touched
 * only by the connect flow and the bridge client. Putting it there would make
 * every request pay for a table almost none of them use.
 */
async function ensureTable(q: NonNullable<Awaited<ReturnType<typeof sqlAsync>>>): Promise<void> {
  await q`
    CREATE TABLE IF NOT EXISTS amber_bridge_config (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

/** A 64-character hex secret — the strength KEYS.md asks the owner to generate. */
export function generateBridgeSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Relo's stored bridge secret, or null.
 *
 * Never throws. A database that is down must leave the bridge unconfigured,
 * not take down the page whose job is to report on it.
 */
export async function loadStoredBridgeSecret(): Promise<string | null> {
  try {
    const q = await db();
    if (!q) return null;
    await ensureTable(q);
    const rows = (await q`SELECT value FROM amber_bridge_config WHERE key = ${KEY}`) as Array<{ value: string }>;
    const blob = rows?.[0]?.value;
    return blob ? decryptToken(blob) : null;
  } catch {
    return null;
  }
}

export type StoreResult = { ok: boolean; reason?: string };

/** Store (or replace) Relo's copy. Encrypted, or refused. */
export async function storeBridgeSecret(secret: string): Promise<StoreResult> {
  if (!secret) return { ok: false, reason: "empty secret" };
  if (!canEncryptTokens()) {
    return {
      ok: false,
      reason:
        "This host has no encryption key (SOCIAL_TOKEN_SECRET or VAULT_MASTER_KEY), so the value could only be stored in plaintext — which is refused.",
    };
  }
  const blob = encryptToken(secret);
  if (!blob) return { ok: false, reason: "encryption failed" };
  try {
    const q = await db();
    if (!q) return { ok: false, reason: "database unavailable" };
    await ensureTable(q);
    await q`
      INSERT INTO amber_bridge_config (key, value, updated_at)
      VALUES (${KEY}, ${blob}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "write failed" };
  }
}
