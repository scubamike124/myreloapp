import { readIngested } from "@/lib/media-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin bytes for ingested videos.
 *
 * Note: OpenNext on Cloudflare often rewrites this to Transfer-Encoding: chunked
 * (stripping Content-Length). Editor preview must use blob: URLs from
 * materializeVideoUrl — this route is for download / library fetch of the full
 * file, with Range support when the platform preserves it.
 */
function videoHeaders(type: string, extra: Record<string, string> = {}) {
  return {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400, immutable",
    "X-Content-Type-Options": "nosniff",
    // Discourage intermediaries from transforming the body.
    "X-Reelo-Media": "1",
    ...extra,
  };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const hit = await readIngested(id);
  if (!hit) {
    return Response.json({ error: "Media not found or expired." }, { status: 404 });
  }

  const type = hit.contentType || "video/mp4";
  const total = hit.body.byteLength;
  const range = req.headers.get("range");

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (m) {
      let start = m[1] !== "" && m[1] != null ? Number(m[1]) : 0;
      let end = m[2] !== "" && m[2] != null ? Number(m[2]) : total - 1;
      // Clamp oversized ends (some players send huge end values).
      if (Number.isFinite(end) && end >= total) end = total - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end) {
        return new Response(null, {
          status: 416,
          headers: videoHeaders(type, { "Content-Range": `bytes */${total}` }),
        });
      }
      // Cap single range slice to reduce Worker CPU spikes (still correct for players).
      const maxSlice = 2 * 1024 * 1024;
      if (end - start + 1 > maxSlice) end = start + maxSlice - 1;

      const slice = hit.body.subarray(start, end + 1);
      const blob = new Blob([new Uint8Array(slice)], { type });
      return new Response(blob, {
        status: 206,
        headers: videoHeaders(type, {
          "Content-Length": String(slice.byteLength),
          "Content-Range": `bytes ${start}-${end}/${total}`,
        }),
      });
    }
  }

  // Prefer Blob so runtimes that respect Blob.size emit Content-Length.
  const blob = new Blob([new Uint8Array(hit.body)], { type });
  return new Response(blob, {
    status: 200,
    headers: videoHeaders(type, {
      "Content-Length": String(total),
    }),
  });
}
