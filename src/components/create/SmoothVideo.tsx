"use client";

import { forwardRef, useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { materializeVideoUrl } from "@/lib/materialize-video";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string;
};

async function forceBlobUrl(source: string): Promise<{ url: string; revoke?: () => void }> {
  if (source.startsWith("blob:") || source.startsWith("data:")) {
    return { url: source };
  }
  // Prefer shared materialize (also verifies MP4), then raw fetch fallback.
  try {
    const local = await materializeVideoUrl(source);
    if (local.url.startsWith("blob:") || local.url.startsWith("data:")) {
      return { url: local.url, revoke: local.revoke };
    }
  } catch {
    /* fall through */
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Could not load video (${res.status}).`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get("content-type") || "video/mp4";
  const blob = new Blob([buf], { type: type.includes("webm") ? "video/webm" : "video/mp4" });
  const url = URL.createObjectURL(blob);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

/**
 * Guarantees <video> only ever receives a local blob:/data: URL.
 * Network / chunked Worker URLs cause stutter and apparent A/V desync.
 */
const SmoothVideo = forwardRef<HTMLVideoElement, Props>(function SmoothVideo({ src, ...rest }, ref) {
  const [playSrc, setPlaySrc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    setPlaySrc("");

    const run = async () => {
      revokeRef.current?.();
      revokeRef.current = null;
      if (!src) return;

      try {
        const local = await forceBlobUrl(src);
        if (cancelled) {
          local.revoke?.();
          return;
        }
        if (!local.url.startsWith("blob:") && !local.url.startsWith("data:")) {
          throw new Error("Smooth playback requires a local media URL.");
        }
        revokeRef.current = local.revoke ?? null;
        setPlaySrc(local.url);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Could not prepare video.");
          setPlaySrc("");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      revokeRef.current?.();
      revokeRef.current = null;
    };
  }, [src]);

  if (err) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-black px-4 text-center text-sm text-white/70">
        {err}
      </div>
    );
  }

  if (!playSrc) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-black text-sm text-white/50">
        Preparing smooth playback…
      </div>
    );
  }

  return (
    <video
      ref={ref}
      {...rest}
      src={playSrc}
      playsInline
      preload="auto"
      disableRemotePlayback
    />
  );
});

export default SmoothVideo;
