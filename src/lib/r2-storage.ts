import { isCloudflareWorkers } from "@/lib/runtime-platform";

/**
 * Cloudflare R2 persistence for finished media on Workers.
 *
 * Prefers the native MEDIA_BUCKET binding (no egress, no SigV4).
 * Falls back to S3-compatible API credentials when set in the vault.
 */

type R2Bucket = {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
};

export function r2EnvConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

async function mediaBucket(): Promise<R2Bucket | null> {
  if (!isCloudflareWorkers()) return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const bucket = (ctx?.env as { MEDIA_BUCKET?: R2Bucket } | undefined)?.MEDIA_BUCKET;
    return bucket ?? null;
  } catch {
    return null;
  }
}

function objectKey(id: string, ext: string): string {
  return `creations/${id}.${ext}`;
}

function publicUrl(id: string, ext: string): string {
  const base = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (base) return `${base}/${objectKey(id, ext)}`;
  return `/api/media/r2/${id}.${ext}`;
}

export async function r2Available(): Promise<boolean> {
  if (r2EnvConfigured()) return true;
  return (await mediaBucket()) != null;
}

export async function r2PutBytes(
  id: string,
  body: Uint8Array,
  contentType: string,
): Promise<{ url: string; bytes: number; contentType: string } | null> {
  const ext = contentType.includes("webm") ? "webm" : contentType.includes("png") ? "png" : "mp4";
  const key = objectKey(id, ext);

  const bucket = await mediaBucket();
  if (bucket) {
    try {
      await bucket.put(key, body, { httpMetadata: { contentType } });
      return { url: publicUrl(id, ext), bytes: body.byteLength, contentType };
    } catch {
      /* fall through to S3 API */
    }
  }

  if (!r2EnvConfigured()) return null;

  const account = process.env.R2_ACCOUNT_ID!.trim();
  const bucketName = process.env.R2_BUCKET!.trim();
  const endpoint = `https://${account}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.byteLength),
        "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
        Authorization: await r2AuthHeader("PUT", `/${bucketName}/${key}`, contentType, body.byteLength),
      },
      body: new Blob([new Uint8Array(body)], { type: contentType }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) return null;
    return { url: publicUrl(id, ext), bytes: body.byteLength, contentType };
  } catch {
    return null;
  }
}

export async function r2GetBytes(id: string, ext = "mp4"): Promise<{ body: Uint8Array; contentType: string } | null> {
  const key = objectKey(id, ext);
  const bucket = await mediaBucket();
  if (bucket) {
    try {
      const obj = await bucket.get(key);
      if (!obj?.body) return null;
      const buf = new Uint8Array(await new Response(obj.body).arrayBuffer());
      return { body: buf, contentType: obj.httpMetadata?.contentType || "video/mp4" };
    } catch {
      /* */
    }
  }

  if (!r2EnvConfigured()) return null;
  const account = process.env.R2_ACCOUNT_ID!.trim();
  const bucketName = process.env.R2_BUCKET!.trim();
  const endpoint = `https://${account}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: await r2AuthHeader("GET", `/${bucketName}/${key}`, "", 0) },
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return null;
    return { body: new Uint8Array(await res.arrayBuffer()), contentType: res.headers.get("content-type") || "video/mp4" };
  } catch {
    return null;
  }
}

/** Minimal AWS SigV4 for R2 S3-compatible API (only when binding unavailable). */
async function r2AuthHeader(method: string, canonicalUri: string, contentType: string, contentLength: number): Promise<string> {
  const accessKey = process.env.R2_ACCESS_KEY_ID!.trim();
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!.trim();
  const account = process.env.R2_ACCOUNT_ID!.trim();
  const region = "auto";
  const service = "s3";
  const host = `${account}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders =
    `host:${host}\n` +
    (contentType ? `content-type:${contentType}\n` : "") +
    (contentLength ? `content-length:${contentLength}\n` : "") +
    `x-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
  const signedHeaders = [
    "host",
    contentType ? "content-type" : "",
    contentLength ? "content-length" : "",
    "x-amz-content-sha256",
    "x-amz-date",
  ]
    .filter(Boolean)
    .join(";");

  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");

  const signingKey = await hmacChain(secretKey, dateStamp, region, service, "aws4_request");
  const signature = await hmacHex(signingKey, stringToSign);

  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const buf = new Uint8Array(await hmac(key, data));
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacChain(secret: string, ...parts: string[]): Promise<ArrayBuffer> {
  let key = await hmac(toArrayBuffer(new TextEncoder().encode(`AWS4${secret}`)), parts[0]);
  for (let i = 1; i < parts.length; i++) key = await hmac(key, parts[i]);
  return key;
}
