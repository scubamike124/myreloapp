"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SRC = "/assets/hero-launch.mp4";

/**
 * Skip autoplay for Save-Data, metered/slow connections, or reduced-motion.
 * Those users get the first frame and a play button instead of an unrequested
 * download. The clip is kept under Cloudflare Workers' 25 MiB asset limit.
 */
function shouldAutoplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;

  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;

  return true;
}

function fmt(t: number) {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Starts false and only flips true once play() actually resolves, so the
  // control icon always reflects reality — including when autoplay is skipped.
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // Muted autoplay (required for autoplay to be allowed, esp. on mobile).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Force the muted *attribute* (React doesn't always render it) so iOS/Android
    // will allow inline autoplay.
    v.muted = true;
    v.setAttribute("muted", "");
    v.defaultMuted = true;

    // Leave it paused; `playing` already defaults to false.
    if (!shouldAutoplay()) return;

    const tryPlay = () => {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };
    tryPlay();
    // Retry once the browser has enough data — covers slow mobile connections.
    v.addEventListener("loadeddata", tryPlay);
    v.addEventListener("canplay", tryPlay);

    // Re-attempt when the hero scrolls into view (some mobile browsers defer autoplay).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting && v.paused) tryPlay();
      },
      { threshold: 0.25 },
    );
    io.observe(v);

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      io.disconnect();
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next && v.paused) v.play().catch(() => {});
    setMuted(next);
  };

  const seekFromClientX = useCallback((clientX: number) => {
    const v = videoRef.current;
    const bar = barRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setCurrent(v.currentTime);
  }, []);

  const onBarPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onBarPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) seekFromClientX(e.clientX);
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-[20px]"
        style={{
          border: "1px solid rgba(255,70,85,.3)",
          boxShadow: "0 0 60px -20px rgba(225,29,42,.6), 0 24px 60px -30px rgba(0,0,0,.8)",
        }}
      >
        <video
          ref={videoRef}
          src={SRC}
          className="block aspect-[8/7] w-full cursor-pointer bg-black object-cover"
          // No autoPlay attribute: playback is started by the effect above so
          // that Save-Data / slow-connection / reduced-motion users are not
          // forced into a large download. preload="metadata" keeps the initial
          // request to the header rather than eagerly buffering the whole clip.
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onClick={togglePlay}
        />

        {/* Control bar */}
        <div
          className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(10,6,8,.72)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,70,85,.18)" }}
        >
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="-m-1.5 shrink-0 p-1.5 text-white">
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4" /></svg>
            )}
          </button>

          <span className="shrink-0 text-[12px] font-medium tabular-nums text-white/85">
            {fmt(current)} / {fmt(duration)}
          </span>

          <div
            ref={barRef}
            onPointerDown={onBarPointerDown}
            onPointerMove={onBarPointerMove}
            className="group relative h-4 flex-1 cursor-pointer"
          >
            <div className="absolute top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full" style={{ background: "rgba(255,255,255,.25)" }} />
            <div className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} />
            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${pct}%` }} />
          </div>

          <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="-m-1.5 shrink-0 p-1.5 text-white/90">
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
            )}
          </button>

          <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="-m-1.5 shrink-0 p-1.5 text-white/90">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
