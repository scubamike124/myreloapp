import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * DISABLED — production incident footgun.
 *
 * Cloudflare Workers receive HTTP 403 from HeyGen CDN. This proxy used to
 * return a ~40-byte JSON error body that <video> treated as a broken/silent
 * clip. Playback must use browser fetch of the provider URL + POST
 * /api/media/ingest → GET /api/media/c/[id].
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Media proxy disabled. Use browser download + POST /api/media/ingest for same-origin playback.",
      code: "MEDIA_PROXY_DISABLED",
    },
    { status: 410 },
  );
}
