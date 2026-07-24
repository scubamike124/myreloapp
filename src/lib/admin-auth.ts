/**
 * Server-side admin session (Edge + Node compatible).
 *
 * Uses Web Crypto (HMAC-SHA256) so the same verifier works in Edge Middleware
 * (required by @opennextjs/cloudflare) and in Node API routes.
 */

export const ADMIN_COOKIE = "reelo_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function password(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

function secret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length > 0) return explicit;
  const pw = password();
  return pw ? `derived:${pw}` : null;
}

export function adminConfigured(): boolean {
  return password() !== null;
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...view].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

async function sign(payload: string, key: string): Promise<string> {
  const keyBytes = fromUtf8(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payloadBytes = fromUtf8(payload);
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    payloadBytes.buffer.slice(
      payloadBytes.byteOffset,
      payloadBytes.byteOffset + payloadBytes.byteLength,
    ) as ArrayBuffer,
  );
  return toHex(sig);
}

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = fromUtf8(a);
  const bb = fromUtf8(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function verifyPassword(submitted: string): boolean {
  const pw = password();
  if (!pw) return false;
  return safeEqual(submitted, pw);
}

export async function createSessionToken(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const nonceBytes = new Uint8Array(12);
  crypto.getRandomValues(nonceBytes);
  const nonce = toHex(nonceBytes);
  const payload = `${exp}.${nonce}`;
  return `${payload}.${await sign(payload, key)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const key = secret();
  if (!key) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expRaw, nonce, mac] = parts;

  const expected = await sign(`${expRaw}.${nonce}`, key);
  if (!safeEqual(mac, expected)) return false;

  const exp = Number(expRaw);
  return Number.isFinite(exp) && exp > Date.now();
}
