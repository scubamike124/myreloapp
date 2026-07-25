import { readIngested } from "@/lib/media-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin playback for ingested videos (Cache API / memory / later R2).
 * Supports Range so browsers can seek without re-downloading the whole file.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const hit = await readIngested(id);
  if (!hit) {
    return Response.json({ error: "Media not found or expired." }, { status: 404 });
  }

  const body = hit.body;
  const type = hit.contentType || "video/mp4";
  const total = body.byteLength;
  const range = req.headers.get("range");

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (m) {
      let start = m[1] ? Number(m[1]) : 0;
      let end = m[2] ? Number(m[2]) : total - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= total || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const slice = body.subarray(start, end + 1);
      const copy = new Uint8Array(slice);
      return new Response(copy, {
        status: 206,
        headers: {
          "Content-Type": type,
          "Content-Length": String(copy.byteLength),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  const copy = new Uint8Array(body);
  return new Response(copy, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(copy.byteLength),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
