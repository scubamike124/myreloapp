import { randomBytes, scrypt as scryptCb, timingSafeEqual, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

// ---------------------------------------------------------------------------
// User accounts.
//
// Deliberately dependency-free: scrypt from node:crypto for hashing, and an
// opaque session id in an httpOnly cookie checked against the sessions table.
// The admin gate already works this way, and adding an auth framework for
// email-and-password would be a large dependency for very little.
//
// Passwords are never logged, never returned, and compared in constant time.
// ---------------------------------------------------------------------------

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "reelo_session";
export const SESSION_DAYS = 30;

export type User = { id: string; email: string; name: string | null };

async function hash(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function verify(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Minimum viable password rule: length beats forced punctuation. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 200) return "That password is too long.";
  return null;
}

export async function createUser(email: string, password: string, name: string): Promise<User | { error: string }> {
  const q = sql();
  if (!q || !(await ensureSchema())) return { error: "Accounts are not available yet." };

  const clean = email.trim().toLowerCase();
  const existing = (await q`SELECT id FROM users WHERE email = ${clean}`) as { id: string }[];
  if (existing.length > 0) return { error: "An account with that email already exists." };

  const id = randomUUID();
  await q`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (${id}, ${clean}, ${await hash(password)}, ${name.trim().slice(0, 80) || null})`;

  // Welcome credit, recorded like every other movement so the balance always
  // equals the sum of the ledger.
  await q`
    INSERT INTO token_ledger (user_id, delta, reason, ref)
    VALUES (${id}, ${WELCOME_TOKENS}, 'welcome', ${`welcome:${id}`})
    ON CONFLICT (ref) DO NOTHING`;

  return { id, email: clean, name: name.trim() || null };
}

export const WELCOME_TOKENS = 5;

export async function authenticate(email: string, password: string): Promise<User | null> {
  const q = sql();
  if (!q || !(await ensureSchema())) return null;
  const rows = (await q`
    SELECT id, email, name, password_hash FROM users WHERE email = ${email.trim().toLowerCase()}
  `) as { id: string; email: string; name: string | null; password_hash: string }[];
  const row = rows[0];
  if (!row) {
    // Burn comparable time so a missing account is not detectable by timing.
    await hash(password);
    return null;
  }
  if (!(await verify(password, row.password_hash))) return null;
  return { id: row.id, email: row.email, name: row.name };
}

export async function startSession(userId: string): Promise<string | null> {
  const q = sql();
  if (!q || !(await ensureSchema())) return null;
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${userId}, ${expires.toISOString()})`;
  return id;
}

export async function endSession(sessionId: string): Promise<void> {
  const q = sql();
  if (!q) return;
  await q`DELETE FROM sessions WHERE id = ${sessionId}`;
}

/** The signed-in user for this request, or null. */
export async function currentUser(): Promise<User | null> {
  if (!dbConfigured()) return null;
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  const q = sql();
  if (!q || !(await ensureSchema())) return null;

  const rows = (await q`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sid} AND s.expires_at > now()
  `) as User[];
  return rows[0] ?? null;
}
