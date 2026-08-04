import { randomBytes, scrypt as scryptCb, timingSafeEqual, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sqlAsync, ensureSchema, dbConfigured } from "@/lib/db";
import { WELCOME_TOKENS } from "@/lib/token-pricing";

export { WELCOME_TOKENS };

// ---------------------------------------------------------------------------
// User accounts.
//
// Deliberately dependency-free: Web Crypto PBKDF2 for new hashes (reliable on
// Cloudflare Workers), with scrypt verify kept for any legacy rows. Opaque
// session id in an httpOnly cookie checked against the sessions table.
//
// Passwords are never logged, never returned, and compared in constant time.
// ---------------------------------------------------------------------------

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "reelo_session";
export const SESSION_DAYS = 30;
const PBKDF2_ITERS = 100_000; // Workers Web Crypto rejects > 100_000 iterations.

export type User = { id: string; email: string; name: string | null };

async function dbSql() {
  return sqlAsync();
}

async function pbkdf2Hex(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return Buffer.from(bits).toString("hex");
}

async function hash(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await pbkdf2Hex(password, salt);
  return `pbkdf2:${PBKDF2_ITERS}:${salt.toString("hex")}:${derived}`;
}

async function verify(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  const scheme = parts[0];

  if (scheme === "pbkdf2") {
    const [, iterStr, saltHex, hashHex] = parts;
    if (!iterStr || !saltHex || !hashHex) return false;
    const iterations = Number(iterStr);
    if (!Number.isFinite(iterations) || iterations < 1) return false;
    const salt = Buffer.from(saltHex, "hex");
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256,
    );
    const derived = Buffer.from(bits);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }

  if (scheme === "scrypt") {
    const [, saltHex, hashHex] = parts;
    if (!saltHex || !hashHex) return false;
    const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }

  return false;
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
  const q = await dbSql();
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
  try {
    await q`
      INSERT INTO token_ledger (user_id, delta, reason, ref)
      VALUES (${id}, ${WELCOME_TOKENS}, 'welcome', ${`welcome:${id}`})`;
  } catch (e) {
    // Unique-ref races are fine; other ledger failures should surface.
    const msg = e instanceof Error ? e.message : "";
    if (!/duplicate|unique/i.test(msg)) throw e;
  }

  return { id, email: clean, name: name.trim() || null };
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const q = await dbSql();
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
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return null;
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q`INSERT INTO sessions (id, user_id, expires_at) VALUES (${id}, ${userId}, ${expires.toISOString()})`;
  return id;
}

export async function endSession(sessionId: string): Promise<void> {
  const q = await dbSql();
  if (!q) return;
  await q`DELETE FROM sessions WHERE id = ${sessionId}`;
}

/** The signed-in user for this request, or null. */
export async function currentUser(): Promise<User | null> {
  if (!dbConfigured()) return null;
  // Resolve Hyperdrive before cookies() — cookies can drop OpenNext ALS.
  const q = await dbSql();
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  if (!q || !(await ensureSchema())) return null;

  const rows = (await q`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sid} AND s.expires_at > ${new Date().toISOString()}
  `) as User[];
  return rows[0] ?? null;
}

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create a one-time password reset token for an existing account.
 * Always returns ok-shaped result to callers so they can avoid email enumeration;
 * `token` is only present when an account exists (for the mailer).
 */
export async function createPasswordResetToken(
  email: string,
): Promise<{ ok: true; token?: string; email?: string }> {
  const q = await dbSql();
  if (!q || !(await ensureSchema())) return { ok: true };

  const clean = email.trim().toLowerCase();
  const rows = (await q`SELECT id, email FROM users WHERE email = ${clean}`) as {
    id: string;
    email: string;
  }[];
  const user = rows[0];
  if (!user) {
    await hash("timing-pad");
    return { ok: true };
  }

  await q`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TTL_MS).toISOString();
  await q`
    INSERT INTO password_reset_tokens (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, ${expires})`;
  return { ok: true, token, email: user.email };
}

/** Apply a reset token and set a new password. Invalid/expired → null. */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  const problem = passwordProblem(newPassword);
  if (problem) return { error: problem };

  const q = await dbSql();
  if (!q || !(await ensureSchema())) return { error: "Accounts are not available yet." };

  const clean = token.trim();
  if (!clean || clean.length < 32) return { error: "That reset link is invalid or expired." };

  const rows = (await q`
    SELECT user_id FROM password_reset_tokens
    WHERE token = ${clean} AND expires_at > ${new Date().toISOString()}
  `) as { user_id: string }[];
  const row = rows[0];
  if (!row) return { error: "That reset link is invalid or expired." };

  await q`UPDATE users SET password_hash = ${await hash(newPassword)} WHERE id = ${row.user_id}`;
  await q`DELETE FROM password_reset_tokens WHERE user_id = ${row.user_id}`;
  // Force re-login after a password change.
  await q`DELETE FROM sessions WHERE user_id = ${row.user_id}`;
  return { ok: true };
}
