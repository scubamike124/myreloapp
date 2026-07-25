import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ingestBytes } from "@/lib/media-ingest";
import { clientId, createDailyLimiter } from "@/lib/api-guard";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Accept finished video BYTES from the browser.
 *
 * The Worker must never fetch HeyGen CDN URLs (403). The browser can; it posts
 * the verified MP4 here so we can serve same-origin playback/download.
 */
const limiter = createDailyLimiter(Number(process.env.MEDIA_INGEST_DAILY_LIMIT ?? 40));
const MAX_BYTES = 40 * 1024 * 1024;

export async function POST(req: Request) {
  const idKey = clientId(req);
  const remaining = limiter.consume(idKey);
  if (remaining === null) {
    return NextResponse.json({ ok: false, error: "Daily media ingest limit reached." }, { status: 429 });
  }

  try {
    const type = (req.headers.get("content-type") || "video/mp4").split(";")[0].trim();
    if (!type.startsWith("video/") && type !== "application/octet-stream") {
      limiter.refund(idKey);
      return NextResponse.json({ ok: false, error: "Expected a video body." }, { status: 415 });
    }

    const buf = new Uint8Array(await req.arrayBuffer());
    if (buf.byteLength < 32 || buf.byteLength > MAX_BYTES) {
      limiter.refund(idKey);
      return NextResponse.json({ ok: false, error: "Video too small or too large." }, { status: 413 });
    }

    // Reject obvious non-MP4 / JSON error bodies early.
    const head = new TextDecoder().decode(buf.slice(0, 40)).trim();
    if (head.startsWith("{") || head.startsWith("<")) {
      limiter.refund(idKey);
      return NextResponse.json({ ok: false, error: "Body is not a video file." }, { status: 400 });
    }
    const brand = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
    const looksMp4 = brand === "ftyp" || type.includes("webm");
    if (!looksMp4 && type.includes("mp4")) {
      limiter.refund(idKey);
      return NextResponse.json({ ok: false, error: "Body is not a valid MP4." }, { status: 400 });
    }

    const id = randomUUID().replace(/-/g, "");
    const stored = await ingestBytes(id, buf, type.includes("webm") ? "video/webm" : "video/mp4");
    if (!stored) {
      limiter.refund(idKey);
      return NextResponse.json({ ok: false, error: "Could not store media." }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      id,
      url: stored.url,
      bytes: stored.bytes,
      backend: stored.backend,
      remainingToday: remaining,
    });
  } catch (e) {
    limiter.refund(idKey);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Ingest failed." },
      { status: 502 },
    );
  }
}
