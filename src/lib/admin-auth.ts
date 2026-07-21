import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// Server-side admin session.
//
// The previous gate compared a NEXT_PUBLIC_ password in the browser and stored
// a plain "1" flag in sessionStorage — the password shipped in the JS bundle
// and anyone could grant themselves access from devtools. Everything here runs
// on the server only: the password is never sent to the client, and the session
// cookie is an HMAC-signed, expiring token that cannot be forged.
// ---------------------------------------------------------------------------

export const ADMIN_COOKIE = "reelo_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/** The admin password. Server-only — never expose this to the client. */
function password(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/**
 * Secret used to sign session tokens. Prefers an explicit secret so that
 * rotating the password does not silently keep old sessions valid; falls back
 * to deriving one from the password so a single env var still works.
 */
function secret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length > 0) return explicit;
  const pw = password();
  return pw ? `derived:${pw}` : null;
}

/** True when the admin area is configured at all. Unconfigured = locked shut. */
export function adminConfigured(): boolean {
  return password() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still burn a comparison so timing does not leak the length.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Verify a submitted password against the configured one, in constant time. */
export function verifyPassword(submitted: string): boolean {
  const pw = password();
  if (!pw) return false;
  return safeEqual(submitted, pw);
}

/** Mint a signed session token of the form `<expiry>.<nonce>.<hmac>`. */
export function createSessionToken(): string | null {
  const key = secret();
  if (!key) return null;
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${exp}.${nonce}`;
  return `${payload}.${sign(payload, key)}`;
}

/** Validate a session token: correct signature and not expired. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const key = secret();
  if (!key) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expRaw, nonce, mac] = parts;

  if (!safeEqual(mac, sign(`${expRaw}.${nonce}`, key))) return false;

  const exp = Number(expRaw);
  return Number.isFinite(exp) && exp > Date.now();
}
