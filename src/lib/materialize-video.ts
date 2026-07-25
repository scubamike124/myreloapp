/**
 * Fetch / verify a finished video, then ingest bytes to same-origin storage
 * so <video> and download never depend on HeyGen CDN or Worker proxies.
 *
 * Returns a playable URL preference order:
 *   1. Same-origin /api/media/c/... (or blob/disk URL from ingest)
 *   2. Temporary blob: URL (tab-local fallback)
 */
export async function materializeVideoUrl(source: string): Promise<{
  url: string;
  bytes: number;
  revoke?: () => void;
  durable: boolean;
  backend?: string;
}> {
  if (!source) throw new Error("No video URL returned.");

  const { buf, contentType } = await readVideoBytes(source);
  assertMp4OrWebm(buf, contentType);

  // Prefer same-origin ingest so Library/download/playback share one URL.
  try {
    const body = new Blob([new Uint8Array(buf)], {
      type: contentType.includes("webm") ? "video/webm" : "video/mp4",
    });
    const res = await fetch("/api/media/ingest", {
      method: "POST",
      headers: { "Content-Type": body.type },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok && typeof data.url === "string") {
      return {
        url: data.url as string,
        bytes: Number(data.bytes) || buf.byteLength,
        durable: true,
        backend: typeof data.backend === "string" ? data.backend : "ingest",
      };
    }
  } catch {
    /* fall through to blob: */
  }

  const copy = new Uint8Array(buf);
  const blob = new Blob([copy], {
    type: contentType.includes("webm") ? "video/webm" : "video/mp4",
  });
  const url = URL.createObjectURL(blob);
  return {
    url,
    bytes: buf.byteLength,
    revoke: () => URL.revokeObjectURL(url),
    durable: false,
    backend: "blob-url",
  };
}

async function readVideoBytes(source: string): Promise<{ buf: Uint8Array; contentType: string }> {
  if (source.startsWith("data:")) {
    const match = source.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (!match) throw new Error("Invalid data-URL video.");
    const binary = atob(match[2]);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return { buf, contentType: match[1] || "video/mp4" };
  }

  // Same-origin media we already ingested — no need to re-fetch as CORS remote.
  if (source.startsWith("/api/media/") || source.startsWith("blob:")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Could not read video (${res.status}).`);
    return {
      buf: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") || "video/mp4",
    };
  }

  const res = await fetch(source, {
    mode: "cors",
    credentials: "omit",
    headers: { Accept: "video/mp4,video/webm,video/*,*/*;q=0.8" },
  });
  if (!res.ok) throw new Error(`Could not download the finished video (${res.status}).`);
  return {
    buf: new Uint8Array(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "video/mp4",
  };
}

function assertMp4OrWebm(buf: Uint8Array, contentType: string) {
  if (buf.byteLength < 32) throw new Error("Video file was empty or truncated.");
  const head = new TextDecoder().decode(buf.slice(0, 40)).trim();
  if (head.startsWith("{") || head.startsWith("<")) {
    throw new Error("Server returned an error instead of a video file. Please regenerate.");
  }
  if (contentType.includes("webm")) return;
  const brand = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
  if (brand !== "ftyp" && !hasFtypNearby(buf)) {
    throw new Error("Downloaded file is not a playable MP4.");
  }
}

function hasFtypNearby(buf: Uint8Array): boolean {
  const max = Math.min(buf.byteLength - 4, 128);
  for (let i = 0; i < max; i++) {
    if (buf[i] === 0x66 && buf[i + 1] === 0x74 && buf[i + 2] === 0x79 && buf[i + 3] === 0x70) {
      return true;
    }
  }
  return false;
}
