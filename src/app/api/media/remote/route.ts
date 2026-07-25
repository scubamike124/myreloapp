import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Same-origin proxy for provider media (HeyGen CDN, etc.).
 *
 * Playing / downloading cross-origin MP4s directly fails in production:
 * incomplete Range fetches look like "broken playback", and missing CORS
 * often yields a silent or unplayable clip. Fetching server-side and serving
 * from our origin keeps the full file (including the audio track) intact.
 *
 * Only https URLs from known video providers are allowed.
 */
const ALLOWED_HOSTS = [
  "heygen.com",
  "resource.heygen.com",
  "files.heygen.ai",
  "cdn.heygen.com",
  "heygen.ai",
  "googleapis.com",
  "googleusercontent.com",
  "storage.googleapis.com",
  "vercel-storage.com",
  "blob.vercel-storage.com",
  "r2.cloudflarestorage.com",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src");
  if (!src) return NextResponse.json({ error: "Missing src." }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src." }, { status: 400 });
  }
  if (target.protocol !== "https:") {
    return NextResponse.json({ error: "Only https sources are allowed." }, { status: 400 });
  }
  if (!hostAllowed(target.hostname)) {
    return NextResponse.json({ error: "Source host is not allowed." }, { status: 403 });
  }

  const range = req.headers.get("range") ?? undefined;
  try {
    const upstream = await fetch(target.toString(), {
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(180_000),
      redirect: "follow",
    });
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream media failed (${upstream.status}).` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    const type = upstream.headers.get("content-type") || "video/mp4";
    headers.set("Content-Type", type);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=3600");
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    const cr = upstream.headers.get("content-range");
    if (cr) headers.set("Content-Range", cr);
    // Same-origin for the app; still useful when opening the URL directly.
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Media proxy failed." },
      { status: 502 },
    );
  }
}
