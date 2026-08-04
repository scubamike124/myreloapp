import { isCloudflareWorkers, isEphemeralFilesystem } from "@/lib/runtime-platform";
import { r2PutBytes } from "@/lib/r2-storage";

/**
 * Same-origin media persistence that does NOT fetch provider CDNs from the Worker.
 *
 * Production incident: Cloudflare Workers get HTTP 403 from HeyGen CDN, so any
 * path that downloads HeyGen server-side fails. Bytes must arrive from the
 * browser (CORS works) or from a Worker fetch that succeeds (Google Veo).
 *
 * Backends, in order:
 *   1. Vercel Blob — if BLOB_READ_WRITE_TOKEN is set (upload raw bytes)
 *   2. Disk — only on non-ephemeral Node hosts
 *   3. Cache API — Workers, no extra secrets (best-effort TTL)
 */

const MEMORY = new Map<string, { body: Uint8Array; contentType: string; expires: number }>();
const CACHE_TTL_SEC = 60 * 60 * 24 * 7; // 7 days — honest vs a fake 30-day promise on Cache

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

function cacheRequest(id: string): Request {
  // Host is arbitrary; Cache API keys on the full Request URL within the zone.
  return new Request(`https://media.reelo.local/c/${encodeURIComponent(id)}`);
}

export type Ingested = { url: string; bytes: number; contentType: string; backend: "blob" | "disk" | "cache" | "memory" | "r2" };

/**
 * File extension for a stored type.
 *
 * It has to be right rather than decorative: /api/media/[file] types its
 * response from the extension alone, so a PNG written as `.mp4` is served as
 * `video/mp4` and renders as a broken image. This started as video-only
 * storage, where "mp4 unless webm" was true; the storybook stores
 * illustrations through the same door.
 */
function extensionFor(type: string): string {
  if (type.includes("webm")) return "webm";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return "mp4";
}

export async function ingestBytes(
  id: string,
  body: Uint8Array,
  contentType = "video/mp4",
): Promise<Ingested | null> {
  if (!id || !body?.byteLength) return null;
  if (body.byteLength > 40 * 1024 * 1024) return null; // hard cap

  const type = contentType.includes("video") || contentType.includes("octet") ? "video/mp4" : contentType;
  const token = blobToken();

  if (token) {
    try {
      const ext = extensionFor(type);
      const res = await fetch(`https://blob.vercel-storage.com/creations/${id}.${ext}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-api-version": "7",
          "x-content-type": type,
        },
        body: new Uint8Array(body),
        signal: AbortSignal.timeout(180_000),
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) return { url: data.url, bytes: body.byteLength, contentType: type, backend: "blob" };
      }
    } catch {
      /* fall through */
    }
  }

  const r2 = await r2PutBytes(id, body, type);
  if (r2) {
    return { url: r2.url, bytes: r2.bytes, contentType: r2.contentType, backend: "r2" };
  }

  if (!isEphemeralFilesystem() && !isCloudflareWorkers()) {
    try {
      const { mkdir, writeFile } = await import("node:fs/promises");
      const path = await import("node:path");
      const dir = process.env.MEDIA_PATH || path.join(process.cwd(), ".data", "media");
      await mkdir(dir, { recursive: true });
      const ext = extensionFor(type);
      await writeFile(path.join(dir, `${id}.${ext}`), Buffer.from(body));
      return { url: `/api/media/${id}.${ext}`, bytes: body.byteLength, contentType: type, backend: "disk" };
    } catch {
      /* fall through */
    }
  }

  // Cache API (Workers) — no secrets required.
  try {
    if (typeof caches !== "undefined" && "default" in caches) {
      const store = (caches as { default: Cache }).default;
      const response = new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": type,
          "Cache-Control": `public, max-age=${CACHE_TTL_SEC}`,
          "X-Reelo-Bytes": String(body.byteLength),
        },
      });
      await store.put(cacheRequest(id), response);
      return { url: `/api/media/c/${id}`, bytes: body.byteLength, contentType: type, backend: "cache" };
    }
  } catch {
    /* fall through */
  }

  // Last resort: isolate memory (dev / single isolate only).
  MEMORY.set(id, { body, contentType: type, expires: Date.now() + CACHE_TTL_SEC * 1000 });
  return { url: `/api/media/c/${id}`, bytes: body.byteLength, contentType: type, backend: "memory" };
}

export async function readIngested(id: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!id || id.length > 120 || /[^a-zA-Z0-9_-]/.test(id)) return null;

  try {
    if (typeof caches !== "undefined" && "default" in caches) {
      const store = (caches as { default: Cache }).default;
      const hit = await store.match(cacheRequest(id));
      if (hit) {
        const buf = new Uint8Array(await hit.arrayBuffer());
        return { body: buf, contentType: hit.headers.get("content-type") || "video/mp4" };
      }
    }
  } catch {
    /* */
  }

  const mem = MEMORY.get(id);
  if (mem) {
    if (Date.now() > mem.expires) {
      MEMORY.delete(id);
      return null;
    }
    return { body: mem.body, contentType: mem.contentType };
  }

  return null;
}
