// ---------------------------------------------------------------------------
// Durable storage for finished videos and images.
//
// Today a creation exists in exactly one place: the tab that made it. Veo hands
// back a base64 data URL, HeyGen hands back a link that expires, and the
// Library keeps only metadata in localStorage. Clear your browser, open your
// phone, or come back next week and the video you paid for is gone.
//
// This uploads the bytes somewhere permanent and returns a stable URL.
//
// Provider-agnostic on purpose. Vercel Blob is implemented because it is one
// env var on the host this deploys to; S3 or R2 would slot in beside it without
// anything above this file changing.
//
// Without a token configured, store() returns null and callers keep the
// existing behaviour — the product degrades rather than breaks.
// ---------------------------------------------------------------------------

export function storageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type Stored = { url: string; bytes: number; contentType: string };

/** Turn a data: URL into bytes, or fetch a remote URL. Both are what providers give us. */
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
 * Persist a generated file and return its permanent URL.
 *
 * `key` should be stable and unguessable — it becomes part of a public URL, so
 * it must not be a predictable sequence someone could walk to read other
 * people's videos.
 */
export async function store(source: string, key: string): Promise<Stored | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !source) return null;

  const file = await readSource(source);
  if (!file) return null;

  try {
    // Vercel Blob's REST API directly, rather than the @vercel/blob package:
    // one fetch against a documented endpoint is a smaller commitment than a
    // dependency, and keeps the swap to S3 or R2 a local change.
    const res = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "7",
        "x-content-type": file.contentType,
        // Never overwrite: keys are unique per creation, so a collision means a
        // bug, and silently replacing someone's video would be the worst
        // possible response to it.
        "x-add-random-suffix": "1",
      },
      body: new Uint8Array(file.body),
      signal: AbortSignal.timeout(180_000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    if (!data.url) return null;

    return { url: data.url, bytes: file.body.length, contentType: file.contentType };
  } catch {
    return null;
  }
}
