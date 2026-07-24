import { readFile } from "node:fs/promises";
import path from "node:path";
import { isEphemeralFilesystem } from "@/lib/runtime-platform";
import { SITE_URL } from "@/lib/site";

/**
 * Read a file shipped under /public.
 * On Cloudflare Workers there is no durable project disk — fetch via ASSETS
 * binding or the public site URL instead of node:fs.
 */
export async function readPublicAsset(relPath: string): Promise<Buffer | null> {
  const clean = relPath.replace(/^\//, "");

  if (!isEphemeralFilesystem()) {
    try {
      return await readFile(path.join(process.cwd(), "public", clean));
    } catch {
      /* fall through */
    }
  }

  // Prefer ASSETS binding when running under OpenNext / Wrangler
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const assets = (ctx?.env as { ASSETS?: { fetch: typeof fetch } } | undefined)?.ASSETS;
    if (assets?.fetch) {
      const res = await assets.fetch(new Request(`https://assets.local/${clean}`));
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
  } catch {
    /* not on Workers / binding unavailable */
  }

  try {
    const res = await fetch(`${SITE_URL}/${clean}`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
