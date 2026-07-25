/**
 * Turn a remote (or data:) video URL into a same-origin blob: URL after
 * verifying the bytes are a real MP4 — not a JSON error body.
 *
 * Cloudflare Workers cannot re-host HeyGen CDN files today (storage=none, and
 * Worker fetches to HeyGen often 403). Playing the signed CDN URL directly can
 * look silent/broken in some browsers. Fetching with CORS (HeyGen sends
 * Access-Control-Allow-Origin: *) and playing a blob: URL keeps the full file
 * — including the AAC audio track — intact for <video> and download.
 */
export async function materializeVideoUrl(source: string): Promise<{
  url: string;
  bytes: number;
  revoke?: () => void;
}> {
  if (!source) throw new Error("No video URL returned.");

  let buf: Uint8Array;
  let contentType = "video/mp4";

  if (source.startsWith("data:")) {
    const match = source.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (!match) throw new Error("Invalid data-URL video.");
    contentType = match[1] || "video/mp4";
    const binary = atob(match[2]);
    buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  } else {
    const res = await fetch(source, {
      mode: "cors",
      credentials: "omit",
      headers: { Accept: "video/mp4,video/*,*/*;q=0.8" },
    });
    if (!res.ok) throw new Error(`Could not download the finished video (${res.status}).`);
    contentType = res.headers.get("content-type") || "video/mp4";
    buf = new Uint8Array(await res.arrayBuffer());
  }

  assertMp4(buf);

  // A fresh Uint8Array avoids SharedArrayBuffer / BlobPart typing issues.
  const copy = new Uint8Array(buf);
  const blob = new Blob([copy], {
    type: contentType.includes("video") || contentType.includes("octet") ? "video/mp4" : contentType,
  });
  const url = URL.createObjectURL(blob);
  return { url, bytes: buf.byteLength, revoke: () => URL.revokeObjectURL(url) };
}

function assertMp4(buf: Uint8Array) {
  if (buf.byteLength < 32) throw new Error("Video file was empty or truncated.");
  const head = new TextDecoder().decode(buf.slice(0, 40)).trim();
  if (head.startsWith("{") || head.startsWith("<")) {
    throw new Error("Server returned an error instead of a video file. Please regenerate.");
  }
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
