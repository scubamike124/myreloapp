import { sqlAsync, ensureSchema, dbConfigured } from "@/lib/db";

/** Canonical owner email — always privileged on Relo when present in users. */
const CONFIGURED_OWNER_EMAILS = [
  (process.env.OWNER_EMAIL || "").trim().toLowerCase(),
  "scubamike124@gmail.com",
].filter(Boolean);

/**
 * Race-safe first-owner claim. Returns true only for the single winner.
 * Uses a conditional UPDATE so two concurrent Google callbacks cannot both win.
 */
export async function tryClaimFirstOwner(userId: string): Promise<boolean> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return false;

  const updated = (await q`
    UPDATE users
    SET role = 'OWNER'
    WHERE id = ${userId}
      AND COALESCE(role, 'USER') <> 'OWNER'
      AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.role = 'OWNER')
    RETURNING id
  `) as { id: string }[];

  if (updated.length === 0) {
    // If an OWNER already exists but this user is the configured owner email,
    // promote them (and demote any other OWNER) so Michael always resolves as OWNER.
    return ensureConfiguredOwner(userId);
  }

  try {
    await q`
      INSERT INTO platform_meta (key, value, updated_at)
      VALUES ('owner_user_id', ${userId}, ${new Date().toISOString()})
      ON CONFLICT (key) DO NOTHING
    `;
    await q`
      INSERT INTO platform_meta (key, value, updated_at)
      VALUES ('owner_claimed_at', ${new Date().toISOString()}, ${new Date().toISOString()})
      ON CONFLICT (key) DO NOTHING
    `;
  } catch {
    /* optional meta table */
  }

  return true;
}

/**
 * Ensure the configured owner email always has role OWNER.
 * Safe to call on every Google login for that account.
 */
export async function ensureConfiguredOwner(userId: string): Promise<boolean> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return false;

  const rows = (await q`
    SELECT id, email, role FROM users WHERE id = ${userId} LIMIT 1
  `) as { id: string; email: string; role: string }[];
  const row = rows[0];
  if (!row) return false;
  const email = row.email.trim().toLowerCase();
  if (!CONFIGURED_OWNER_EMAILS.includes(email)) return false;
  if (row.role === "OWNER") return false;

  // Unique index users_one_owner — clear other owners first, then set this one.
  await q`UPDATE users SET role = 'ADMIN' WHERE role = 'OWNER' AND id <> ${userId}`;
  await q`UPDATE users SET role = 'OWNER' WHERE id = ${userId}`;
  return true;
}

export async function ownerAlreadyClaimed(): Promise<boolean> {
  if (!dbConfigured()) return true;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return true;
  const rows = (await q`SELECT 1 AS ok FROM users WHERE role = 'OWNER' LIMIT 1`) as { ok: number }[];
  return rows.length > 0;
}
