import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypt OAuth tokens at rest. Never send ciphertext or plaintext to the browser.
 * Uses SOCIAL_TOKEN_SECRET, or a derived key from DATABASE_URL as last resort (dev only).
 */
function secretKey(): Buffer | null {
  const raw = process.env.SOCIAL_TOKEN_SECRET || process.env.VAULT_MASTER_KEY || "";
  if (raw.length >= 16) return createHash("sha256").update(raw).digest();
  const db = process.env.DATABASE_URL || "";
  if (db.length >= 16 && process.env.NODE_ENV !== "production") {
    return createHash("sha256").update(`reelo-dev-social:${db}`).digest();
  }
  return null;
}

export function canEncryptTokens(): boolean {
  return Boolean(secretKey());
}

export function encryptToken(plain: string): string | null {
  const key = secretKey();
  if (!key || !plain) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptToken(blob: string | null | undefined): string | null {
  if (!blob || !blob.startsWith("v1:")) return null;
  const key = secretKey();
  if (!key) return null;
  const parts = blob.split(":");
  if (parts.length !== 4) return null;
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const data = Buffer.from(parts[3], "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
