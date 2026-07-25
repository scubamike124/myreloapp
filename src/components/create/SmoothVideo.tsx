"use client";

import { forwardRef, useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { materializeVideoUrl } from "@/lib/materialize-video";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string;
};

/**
 * Plays video from a local blob: URL whenever the source would otherwise be
 * streamed (HeyGen CDN or chunked /api/media/c). Chunked Worker responses
 * cause stutter that looks like A/V desync.
 */
const SmoothVideo = forwardRef<HTMLVideoElement, Props>(function SmoothVideo({ src, ...rest }, ref) {
  const [playSrc, setPlaySrc] = useState(() =>
    src.startsWith("blob:") || src.startsWith("data:") ? src : "",
  );
  const [err, setErr] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);

    const run = async () => {
      revokeRef.current?.();
      revokeRef.current = null;

      if (!src) {
        setPlaySrc("");
        return;
      }
      if (src.startsWith("blob:") || src.startsWith("data:")) {
        setPlaySrc(src);
        return;
      }

      try {
        const local = await materializeVideoUrl(src);
        if (cancelled) {
          local.revoke?.();
          return;
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
