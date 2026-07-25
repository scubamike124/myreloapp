"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordCreation } from "@/lib/workspace";
import { downloadMedia } from "@/lib/download-media";
import { materializeVideoUrl } from "@/lib/materialize-video";
import { playSyncedWithSound } from "@/lib/play-synced";
import { compressImageForUpload } from "@/lib/compress-image";
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguage } from "@/lib/languages";
import { PHOTO_SIZE_HINT, VEO_MAX_SECONDS } from "@/lib/upload-limits";
import SmoothVideo from "./SmoothVideo";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";
import DurationPicker from "./DurationPicker";
import { defaultDurationSeconds } from "@/lib/token-costs";
import { formatTokens, formatUsdFromTokens, standardVideoTokens } from "@/lib/token-pricing";

/**
 * AI Avatar Studio — deliberately simple:
 *  1. Message: paste a website (we scan it) OR write what they should say
 *  2. Face: pick an avatar OR upload your photo
 *  3. Generate
 */

type Avatar = { avatarId: string; name: string; gender: string; image: string; video: string };
type Status = "idle" | "scanning" | "generating" | "done";
type SourceMode = "website" | "script";
type FaceMode = "avatar" | "photo";

const VOICES = [
  { id: "f8c69e517f424cafaecde32dde57096b", label: "Allison (F)" },
  { id: "cef3bc4e0a84424cafcde6f2cf466c97", label: "Ivy (F)" },
  { id: "4754e1ec667544b0bd18cdf4bec7d6a7", label: "Brittney (F)" },
  { id: "f38a635bee7a4d1f9b0a654a31d050d2", label: "Chill Brian (M)" },
  { id: "d92994ae0de34b2e8659b456a2f388b8", label: "John Doe (M)" },
  { id: "453c20e1525a429080e2ad9e4b26f2cd", label: "Archer (M)" },
];

const DEFAULT_SCRIPT =
  "Hi! I'm glad you're here. Today I want to share something simple that can help you move faster. " +
  "With Reelo, you turn a website or a short message into a clear on-camera video — no camera crew, no complicated edit. " +
  "Watch how easy it is, then try it with your own brand. Stick around for the key details, and take the next step today.";

async function pollVeo(pollUrl: string, maxTries = 90): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(pollUrl);
    const d = await res.json();
    if (d.status === "completed" && d.videoUrl) return d.videoUrl as string;
    if (d.status === "failed") throw new Error(d.error || "Video generation failed.");
  }
  throw new Error("Video is taking too long — please try again.");
}

export default function AiAvatarStudio() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("website");
  const [faceMode, setFaceMode] = useState<FaceMode>("avatar");
  const [url, setUrl] = useState("");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);

  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selected, setSelected] = useState<Avatar | null>(null);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [muted, setMuted] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [clipHint, setClipHint] = useState("");
  const [avatarSeconds, setAvatarSeconds] = useState(() => defaultDurationSeconds("ai-avatar-studio"));
  const [photoSeconds, setPhotoSeconds] = useState(() => defaultDurationSeconds("talking-photo"));
  const tokens = useTokens();
  const meterSeconds = faceMode === "photo" ? photoSeconds : avatarSeconds;
  const meterSlug = faceMode === "photo" ? "talking-photo" : "ai-avatar-studio";

  const genTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLVideoElement | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/heygen-avatars?limit=24&offset=0");
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const list = (Array.isArray(data.avatars) ? data.avatars : []) as Avatar[];
        setAvatars(list);
        setSelected((cur) => cur ?? list[0] ?? null);
      } catch {
        setErr("Could not load avatars — try the Avatar Library link.");
      } finally {
        if (!cancelled) setLoadingAvatars(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Arriving from Shorts / Avatar Library with ?script= or ?avatar=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantedScript = params.get("script");
    if (wantedScript) setScript(wantedScript.slice(0, 2000));
    const wantedId = params.get("avatar");
    if (!wantedId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/heygen-avatars?id=${encodeURIComponent(wantedId)}`);
        const data = await res.json();
        if (!cancelled && res.ok && data.avatar) {
          setFaceMode("avatar");
          setSelected(data.avatar as Avatar);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      [genTimer, pollTimer].forEach((t) => t.current && clearInterval(t.current));
      revokeRef.current?.();
    },
    [],
  );

  const scanWebsite = useCallback(async () => {
    if (!url.trim()) {
      setErr("Paste a website URL first.");
      return;
    }
    setErr(null);
    setStatus("scanning");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ideaCount: 5, languageCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not scan that website.");
      const written = String(data.script || "").trim();
      if (!written) throw new Error("Scan worked, but no script came back. Try writing one yourself.");
      setScript(written);
      setSourceMode("script");
      setStatus("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed.");
      setStatus("idle");
    }
  }, [url, languageCode]);

  const onPhoto = (f?: File) => {
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
    setFaceMode("photo");
    setErr(null);
  };

  const generate = async () => {
    const spoken = script.trim();
    if (!spoken) {
      setErr("Add a message — scan a website or write what they should say.");
      return;
    }
    if (faceMode === "avatar" && !selected) {
      setErr("Pick an avatar, or switch to Upload your photo.");
      return;
    }
    if (faceMode === "photo" && !photo) {
      setErr("Upload a photo of the person who should speak.");
      return;
    }

    setErr(null);
    setShort(null);
    setClipHint("");
    setStatus("generating");
    setProgress(0);
    if (genTimer.current) clearInterval(genTimer.current);
    if (pollTimer.current) clearInterval(pollTimer.current);
    genTimer.current = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 1500);

    try {
      let remoteUrl = "";

      if (faceMode === "photo" && photo) {
        // Your photo → Veo talking clip (~8s).
        const { base64, mimeType } = await compressImageForUpload(photo, {
          maxEdge: 1024,
          quality: 0.8,
          maxBytes: 3 * 1024 * 1024,
        });
        const lang = getLanguage(languageCode);
        const langLine =
          lang.code !== "en"
            ? ` Speak the entire dialogue clearly in ${lang.name} (${lang.endonym}), not English.`
            : ` Speak clearly in English.`;
        const prompt =
          `A close-up of the person in the photo looking at the camera and speaking naturally with clear audible speech, ` +
          `lip-syncing exactly: "${spoken.slice(0, 500)}".${langLine} Subtle natural head movement, engaging eye contact. ` +
          `The spoken words must be clearly audible throughout.`;
        const res = await fetch("/api/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType,
            prompt,
            action: "talking-photo",
            seconds: photoSeconds,
          }),
        });
        const data = await res.json();
        const gap = await shortfallFrom(res, data);
        if (gap) {
          if (genTimer.current) clearInterval(genTimer.current);
          setShort(gap);
          setProgress(0);
          setStatus("idle");
          return;
        }
        if (!res.ok || !data.ok) throw new Error(data.error || "Video generation failed.");
        tokens.setBalance(data.balance);
        setClipHint(
          `Photo videos are ~${photoSeconds}s (max ${VEO_MAX_SECONDS}s). For longer clips, pick an avatar above instead.`,
        );
        remoteUrl = await pollVeo(data.poll as string);
      } else {
        // Avatar → HeyGen (length from chosen target + script).
        const res = await fetch("/api/heygen-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            script: spoken,
            avatarId: selected!.avatarId,
            voiceId,
            action: "ai-avatar-studio",
            seconds: avatarSeconds,
          }),
        });
        const data = await res.json();
        const gap = await shortfallFrom(res, data);
        if (gap) {
          if (genTimer.current) clearInterval(genTimer.current);
          setShort(gap);
          setProgress(0);
          setStatus("idle");
          return;
        }
        if (!res.ok || !data.ok) throw new Error(data.error || "Video generation failed.");
        tokens.setBalance(data.balance);
        setClipHint(
          data.expanded
            ? `We expanded a short script so the video lasts about ${data.targetSeconds || avatarSeconds}s.`
            : `Avatar video aims for about ${data.targetSeconds || avatarSeconds} seconds.`,
        );
        const videoId = data.videoId as string;
        remoteUrl = await new Promise<string>((resolve, reject) => {
          let tries = 0;
          pollTimer.current = setInterval(async () => {
            if (++tries > 168) {
              if (pollTimer.current) clearInterval(pollTimer.current);
              reject(new Error("Video is taking too long — please try again."));
              return;
            }
            try {
              const r = await fetch(`/api/heygen-video?video_id=${videoId}`);
              const d = await r.json();
              if (d.status === "completed" && d.videoUrl) {
                if (pollTimer.current) clearInterval(pollTimer.current);
                resolve((d.videoUrl as string) || (d.providerUrl as string));
              } else if (d.status === "failed") {
                if (pollTimer.current) clearInterval(pollTimer.current);
                reject(new Error(d.error?.detail || d.error?.message || "Generation failed on HeyGen."));
              }
            } catch {
              /* keep polling */
            }
          }, 5000);
        });
      }

      revokeRef.current?.();
      setProgress(96);
      const local = await materializeVideoUrl(remoteUrl);
      revokeRef.current = local.revoke ?? null;

      if (genTimer.current) clearInterval(genTimer.current);
      setVideoUrl(local.url);
      setMuted(true);
      setNeedsGesture(true);
      setProgress(100);
      setStatus("done");
      recordCreation({
        toolSlug: "ai-avatar-studio",
        toolTitle: "AI Avatar Studio",
        title: spoken.slice(0, 60) || "Avatar video",
        status: "completed",
        kind: "video",
        mediaUrl: local.url,
      });
    } catch (e) {
      if (genTimer.current) clearInterval(genTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      const message = e instanceof Error ? e.message : "Generation failed.";
      setErr(message);
      setStatus("idle");
      recordCreation({
        toolSlug: "ai-avatar-studio",
        toolTitle: "AI Avatar Studio",
        title: script.trim().slice(0, 60) || "Avatar video",
        status: "failed",
        kind: "video",
        error: message,
      });
    }
  };

  const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;
  const canGenerate =
    script.trim().length > 0 &&
    ((faceMode === "avatar" && Boolean(selected)) || (faceMode === "photo" && Boolean(photo)));

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ backgroundImage: "radial-gradient(900px 500px at 70% -5%,rgba(225,29,42,.16),transparent 60%)" }}
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/create" className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="font-display grid h-7 w-7 place-items-center rounded-lg text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}
            >
              R
            </span>
            Create
          </Link>
          <TokenMeter slug={meterSlug} tokens={tokens} variant="chip" seconds={meterSeconds} />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-3xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>
          Studio
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">AI Avatar Studio</h1>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#a99a9c" }}>
          Three steps: add a website or message → pick an avatar or your photo → choose length &amp; generate.
          Avatar videos use standard tier pricing (from {formatTokens(standardVideoTokens(30))} tokens /{" "}
          {formatUsdFromTokens(standardVideoTokens(30))}). Your-photo clips are up to ~{VEO_MAX_SECONDS}s and bill as
          the up-to-30s tier.
        </p>
        <p
          className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
          style={{ border: "1px solid rgba(255,70,85,.25)", background: "rgba(255,60,75,.06)", color: "#ffb3b9" }}
        >
          Need longer than {VEO_MAX_SECONDS} seconds? Choose <strong className="text-white">Pick an avatar</strong> (not
          your photo). Write or scan the script in your language below.
        </p>

        <div className="mt-7 space-y-5">
          {/* STEP 1 — message */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md sm:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#ff8892" }}>
              1 · What should they say?
            </p>
            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Language</label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={inputStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#140a0c]">
                    {l.name}
                    {l.endonym !== l.name ? ` — ${l.endonym}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-white/40">
                Website scans and spoken lines use this language. Write your message in the same language.
              </p>
            </div>
            <div className="mb-3 flex gap-1.5">
              {(
                [
                  ["website", "Scan a website"],
                  ["script", "Write a message"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSourceMode(id)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold"
                  style={
                    sourceMode === id
                      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {sourceMode === "website" ? (
              <div>
                <div className="flex items-center gap-2 rounded-xl px-3.5" style={inputStyle}>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void scanWebsite()}
                    placeholder="yourbusiness.com"
                    className="w-full bg-transparent py-3 text-[15px] text-white placeholder-white/35 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void scanWebsite()}
                  disabled={status === "scanning" || !url.trim()}
                  className="mt-3 w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  {status === "scanning" ? "Scanning…" : "Scan website & write script"}
                </button>
                <p className="mt-2 text-xs text-white/40">We read the page and write a ~25-second commercial script for you.</p>
              </div>
            ) : (
              <div>
                <textarea
                  rows={5}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-white outline-none"
                  style={inputStyle}
                  placeholder="What should the presenter say?"
                />
                <p className="mt-2 text-xs text-white/40">
                  Aim for a few sentences. Short one-liners are expanded automatically so the video isn&apos;t only ~5
                  seconds.
                </p>
              </div>
            )}
          </section>

          {/* STEP 2 — face */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ff8892" }}>
                2 · Who appears on camera?
              </p>
              <Link href="/avatars?tool=ai-avatar-studio" className="text-xs font-semibold underline underline-offset-2" style={{ color: "#ff8892" }}>
                Avatar Library →
              </Link>
            </div>
            <div className="mb-3 flex gap-1.5">
              {(
                [
                  ["avatar", "Pick an avatar"],
                  ["photo", "Upload your photo"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFaceMode(id)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold"
                  style={
                    faceMode === id
                      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {faceMode === "avatar" ? (
              <>
                <div className="grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {loadingAvatars &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4] animate-pulse rounded-xl" style={{ background: "rgba(255,70,85,.08)" }} />
                    ))}
                  {avatars.map((a) => {
                    const on = selected?.avatarId === a.avatarId;
                    return (
                      <button
                        key={a.avatarId}
                        type="button"
                        title={a.name}
                        onClick={() => setSelected(a)}
                        className="relative overflow-hidden rounded-xl"
                        style={{ border: on ? "2px solid #ff3645" : "1px solid rgba(255,255,255,.1)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.image} alt={a.name} className="aspect-[3/4] w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-1 text-[10px]">{a.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Voice</label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-white outline-none"
                    style={inputStyle}
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#140a0c]">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl px-4 py-8 text-center" style={{ border: "2px dashed rgba(255,70,85,.3)" }}>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="" className="h-28 w-28 rounded-xl object-cover" />
                ) : (
                  <span className="text-3xl" aria-hidden>
                    📷
                  </span>
                )}
                <span className="text-sm text-white/70">{photo ? photo.name : "Clear front-facing photo works best"}</span>
                <span className="max-w-sm text-[11px] leading-relaxed text-white/35">{PHOTO_SIZE_HINT}</span>
                <span className="max-w-sm text-[11px] leading-relaxed text-[#ffb3b9]">
                  Your-photo videos are limited to about {VEO_MAX_SECONDS}s — pick an avatar for longer.
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
            )}
          </section>

          {/* STEP 3 — generate */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md sm:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#ff8892" }}>
              3 · Length &amp; generate
            </p>
            <div className="mb-4">
              {faceMode === "photo" ? (
                <DurationPicker action="talking-photo" value={photoSeconds} onChange={setPhotoSeconds} />
              ) : (
                <DurationPicker action="ai-avatar-studio" value={avatarSeconds} onChange={setAvatarSeconds} />
              )}
            </div>
            {short && (
              <div className="mb-3">
                <NotEnoughTokens {...short} />
              </div>
            )}
            {err && <p className="mb-3 text-sm font-medium text-[#ff8a92]">{err}</p>}
            <button
              type="button"
              onClick={() => void generate()}
              disabled={status === "generating" || status === "scanning" || !canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}
            >
              {status === "generating" ? (
                <>
                  <Spinner /> Generating…
                </>
              ) : (
                "Generate talking video"
              )}
            </button>
            <TokenMeter slug={meterSlug} tokens={tokens} seconds={meterSeconds} />
            <p className="mt-2 text-center text-xs text-white/40">
              {faceMode === "photo"
                ? `Your-photo path ≈ ${photoSeconds}s (provider max ${VEO_MAX_SECONDS}s). Keep this tab open.`
                : `Avatar path ≈ ${avatarSeconds}s from script length. Keep this tab open.`}
            </p>
            <p className="mt-1 text-center text-[11px] text-white/35">{PHOTO_SIZE_HINT}</p>
          </section>

          {/* Result */}
          {(status === "generating" || status === "done") && (
            <section className="rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                {status === "done" ? (
                  <>
                    <SmoothVideo
                      ref={resultRef}
                      key={videoUrl}
                      src={videoUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                      controls
                      muted={muted}
                    />
                    {needsGesture && (
                      <button
                        type="button"
                        onClick={() => {
                          const v = resultRef.current;
                          if (!v) return;
                          setMuted(false);
                          void playSyncedWithSound(v)
                            .then(() => setNeedsGesture(false))
                            .catch(() => {});
                        }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70"
                      >
                        <span
                          className="grid h-16 w-16 place-items-center rounded-full"
                          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                            <polygon points="8 5 20 12 8 19" />
                          </svg>
                        </span>
                        <span className="text-lg font-bold">Tap to play with sound</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Spinner large />
                    <div className="w-3/4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }}
                        />
                      </div>
                      <p className="mt-2 text-center text-sm text-white/80">Rendering your video… {progress}%</p>
                    </div>
                  </div>
                )}
              </div>
              {status === "done" && (
                <div className="mt-3 space-y-2">
                  {clipHint && <p className="text-xs text-white/45">{clipHint}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus("idle");
                        setVideoUrl("");
                        setProgress(0);
                      }}
                      className="rounded-full border border-white/15 py-2.5 text-sm font-semibold"
                    >
                      Make another
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadMedia(videoUrl, `reelo-avatar-${Date.now()}.mp4`)}
                      className="rounded-full py-2.5 text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner({ large }: { large?: boolean }) {
  const s = large ? 46 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className="animate-spin text-[#ff5663]">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
