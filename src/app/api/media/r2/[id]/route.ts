import { r2GetBytes } from "@/lib/r2-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serve objects stored in R2 when no public bucket URL is configured. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const clean = id.replace(/\.(mp4|webm|png)$/i, "");
  const ext = id.match(/\.(mp4|webm|png)$/i)?.[1]?.toLowerCase() || "mp4";
  const hit = await r2GetBytes(clean, ext);
  if (!hit) {
    return Response.json({ error: "Media not found." }, { status: 404 });
  }
  return new Response(new Uint8Array(hit.body), {
    status: 200,
    headers: {
      "Content-Type": hit.contentType,
      "Content-Length": String(hit.body.byteLength),
      "Cache-Control": "public, max-age=86400, immutable",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
