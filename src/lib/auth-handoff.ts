import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Short-lived signed login links so the owner can open one URL and land signed in
 * without pasting a password (browser autofill often mangles those).
 */
function handoffSecret(): string {
  return (
    process.env.SOCIAL_TOKEN_SECRET ||
    process.env.VAULT_MASTER_KEY ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "dev-auth-handoff"
  );
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64url");
}

export function mintLoginHandoff(userId: string, ttlMs = 15 * 60_000): string {
  const exp = Date.now() + ttlMs;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${userId}.${exp}.${nonce}`;
  const sig = createHmac("sha256", handoffSecret()).update(payload).digest();
  return b64url(`${payload}.${sig.toString("base64url")}`);
}

export function verifyLoginHandoff(
  token: string,
): { ok: true; userId: string } | { ok: false; error: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, error: "Invalid link." };
  }
  const lastDot = decoded.lastIndexOf(".");
  if (lastDot <= 0) return { ok: false, error: "Invalid link." };
  const payload = decoded.slice(0, lastDot);
  const sigB64 = decoded.slice(lastDot + 1);
  const parts = payload.split(".");
  if (parts.length !== 3) return { ok: false, error: "Invalid link." };
  const [userId, expRaw] = parts;
  if (!userId || !/^\d+$/.test(expRaw)) return { ok: false, error: "Invalid link." };

  const expect = createHmac("sha256", handoffSecret()).update(payload).digest();
  let got: Buffer;
  try {
    got = Buffer.from(sigB64, "base64url");
  } catch {
    return { ok: false, error: "Invalid link." };
  }
  if (got.length !== expect.length || !timingSafeEqual(got, expect)) {
    return { ok: false, error: "Invalid or expired link." };
  }
  if (Date.now() > Number(expRaw)) return { ok: false, error: "That login link has expired." };
  return { ok: true, userId };
}
