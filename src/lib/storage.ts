import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// Durable storage for finished videos and images, over two drivers.
//
//   Disk   — files under .data/media, kept for RETENTION_DAYS then deleted.
//            Needs no account and no provider. A bounded retention window is
//            what makes this practical: without one, a video product fills any
//            disk you give it. Used wherever the filesystem persists.
//
//   Blob   — Vercel Blob, used when BLOB_READ_WRITE_TOKEN is set. Required on
//            Vercel, whose filesystem is wiped between requests.
//
// Retention is a real promise to the customer, so it is stated in the UI and
// enforced by an actual sweep rather than left implicit.
// ---------------------------------------------------------------------------

export const RETENTION_DAYS = Number(process.env.MEDIA_RETENTION_DAYS ?? 30);

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

/** Disk is only safe where the filesystem survives — never on Vercel. */
function diskAllowed(): boolean {
  if (blobToken()) return false;
  const ephemeral = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
  return !ephemeral;
}

export function mediaDir(): string {
  return process.env.MEDIA_PATH || path.join(process.cwd(), ".data", "media");
}

export type StorageDriver = "blob" | "disk" | "none";

export function storageDriver(): StorageDriver {
  if (blobToken()) return "blob";
  if (diskAllowed()) return "disk";
  return "none";
}

export function storageConfigured(): boolean {
  return storageDriver() !== "none";
}

export type Stored = { url: string; bytes: number; contentType: string };

/** Turn a data: URL into bytes, or fetch a remote one. Both are what providers return. */
async function readSource(source: string): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    if (source.startsWith("data:")) {
      // [\s\S] rather than the /s flag: this project's TS target predates it.
      const match = source.match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!match) return null;
      return { body: Buffer.from(match[2], "base64"), contentType: match[1] };
    }
    const res = await fetch(source, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) return null;
    return {
      body: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

/**
 * Persist a generated file and return a URL that will serve it.
 *
 * `id` must be unguessable — it ends up in a URL, and a predictable one would
 * let somebody walk the sequence and read other people's videos.
 */
export async function store(source: string, id: string, kind: "video" | "image"): Promise<Stored | null> {
  if (!source) return null;
  const file = await readSource(source);
  if (!file) return null;

  const ext = kind === "image" ? "png" : "mp4";
  const token = blobToken();

  if (token) {
    try {
      const res = await fetch(`https://blob.vercel-storage.com/creations/${id}.${ext}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-api-version": "7",
          "x-content-type": file.contentType,
        },
        body: new Uint8Array(file.body),
        signal: AbortSignal.timeout(180_000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { url?: string };
      return data.url ? { url: data.url, bytes: file.body.length, contentType: file.contentType } : null;
    } catch {
      return null;
    }
  }

  if (!diskAllowed()) return null;

  try {
    const dir = mediaDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.${ext}`), file.body);
    // Served through a route rather than statically, so retention can be
    // enforced on read as well as by the sweep.
    return { url: `/api/media/${id}.${ext}`, bytes: file.body.length, contentType: file.contentType };
  } catch {
    return null;
  }
}

/** Remove a stored file. Missing files are not an error — the sweep is best-effort. */
export async function remove(id: string, kind: string): Promise<void> {
  if (blobToken()) return; // blob objects expire by their own lifecycle rules
  const ext = kind === "image" ? "png" : "mp4";
  try {
    await unlink(path.join(mediaDir(), `${id}.${ext}`));
  } catch {
    /* already gone */
  }
}

export async function sizeOf(id: string, kind: string): Promise<number | null> {
  const ext = kind === "image" ? "png" : "mp4";
  try {
    return (await stat(path.join(mediaDir(), `${id}.${ext}`))).size;
  } catch {
    return null;
  }
}
