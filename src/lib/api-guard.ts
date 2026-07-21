import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// ---------------------------------------------------------------------------
// Shared guards for the public API routes: per-IP rate limiting and an
// SSRF-safe URL validator.
//
// The rate limiters are in-memory, so they reset on cold start and are not
// shared between serverless instances. That is a real limitation — a durable
// store (Vercel KV / Redis) is the production answer — but an approximate
// limit is still far better than none on routes that spend money per call.
// ---------------------------------------------------------------------------

export function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") || "local";
}

type Bucket = { day: string; count: number };

/** A per-IP daily quota. Returns remaining, or null when the cap is reached. */
export function createDailyLimiter(limit: number) {
  const buckets = new Map<string, Bucket>();
  const today = () => new Date().toISOString().slice(0, 10); // UTC day

  return {
    /** Checks BEFORE consuming, so a limit of 0 correctly denies everything. */
    consume(id: string): number | null {
      const day = today();
      let b = buckets.get(id);
      if (!b || b.day !== day) {
        b = { day, count: 0 };
        buckets.set(id, b);
      }
      if (b.count >= limit) return null;
      b.count += 1;
      return limit - b.count;
    },
    /** Give a unit back when the work never actually happened. */
    refund(id: string) {
      const b = buckets.get(id);
      if (b) b.count = Math.max(0, b.count - 1);
    },
    limit,
  };
}

/**
 * Read a JSON body with a hard size ceiling. Routes here accept base64 image
 * payloads, so without a cap a single request could pin an unbounded amount of
 * memory.
 */
export async function readJsonLimited(req: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new PayloadTooLarge(maxBytes);
  }

  const reader = req.body?.getReader();
  if (!reader) return {};

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new PayloadTooLarge(maxBytes);
    }
    chunks.push(value);
  }

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder().decode(buf));
}

export class PayloadTooLarge extends Error {
  constructor(public maxBytes: number) {
    super(`Payload exceeds ${Math.floor(maxBytes / 1024 / 1024)}MB limit.`);
    this.name = "PayloadTooLarge";
  }
}

// --- SSRF protection -------------------------------------------------------

/** Private, loopback, link-local and other non-public ranges. */
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // unique local
    if (v6.startsWith("fe80")) return true; // link-local
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — re-check the embedded address.
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

/**
 * Normalize a user-supplied URL and refuse anything that would let the server
 * reach its own network — loopback, RFC1918 ranges, and the cloud metadata
 * endpoint at 169.254.169.254 in particular.
 *
 * Note this validates the address the hostname resolves to *now*; a determined
 * attacker can still race DNS re-binding between this check and the fetch.
 * Closing that fully requires pinning the resolved IP at connect time.
 */
export async function assertSafeUrl(raw: string): Promise<string> {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;

  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are supported.");
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "");

  // Literal IPs skip DNS entirely.
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new UnsafeUrlError("That address isn't reachable.");
    return parsed.toString();
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new UnsafeUrlError("That address isn't reachable.");
  }

  let resolved: { address: string }[];
  try {
    resolved = await lookup(host, { all: true });
  } catch {
    throw new UnsafeUrlError("We couldn't resolve that domain.");
  }

  if (resolved.length === 0 || resolved.some((r) => isPrivateAddress(r.address))) {
    throw new UnsafeUrlError("That address isn't reachable.");
  }

  return parsed.toString();
}
