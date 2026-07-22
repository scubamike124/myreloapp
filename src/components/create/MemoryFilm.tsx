"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

// ---------------------------------------------------------------------------
// Story & Memory Generator.
//
// Your own photographs, cut into one film you can keep. The server writes the
// narration; the film itself is drawn and recorded here, in the browser.
//
// Doing it client-side is what makes the tool cheap enough to exist: the photos
// are already on this machine, so nothing is uploaded twice, nothing is stored,
// and there is no $0.60-per-photograph render bill. The recording is a real
// file the customer downloads, not a slideshow that dies with the tab.
//
// Photos are drawn CONTAINED, never cropped — with a blurred copy filling the
// letterbox. Someone's memories are not a design element to be trimmed to fit.
// ---------------------------------------------------------------------------

const TYPES = [
  { label: "Family", value: "family", icon: "👨‍👩‍👧" },
  { label: "Pet", value: "pet", icon: "🐶" },
  { label: "Fantasy", value: "fantasy", icon: "🐉" },
  { label: "Anime", value: "anime", icon: "🌸" },
  { label: "Kids", value: "kids", icon: "🧸" },
  { label: "Tribute", value: "tribute", icon: "🕊️" },
  { label: "Wedding", value: "wedding", icon: "💍" },
  { label: "Vacation", value: "vacation", icon: "🏝️" },
];

const W = 1080;
const H = 1920;
const TITLE_MS = 2000;
const PHOTO_MS = 3600;
const CLOSING_MS = 2400;
const FADE_MS = 450;

type Shot = { file: File; url: string };
type Script = { title: string; opening: string; closing: string; captions: string[]; rtl: boolean };

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read that photo."));
    r.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load a photo."));
    img.src = url;
  });
}

/** Word-wrap into lines that fit `max` pixels, capped so a long caption cannot
 *  push the picture off screen. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, maxLines = 4): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export default function MemoryFilm() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [type, setType] = useState(TYPES[0].value);
  const [details, setDetails] = useState("");
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [script, setScript] = useState<Script | null>(null);

  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [filmUrl, setFilmUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number>(0);
  const tokens = useTokens();

  // Object URLs are a real leak if a long session adds and removes many photos.
  useEffect(() => {
    return () => {
      shots.forEach((s) => URL.revokeObjectURL(s.url));
      if (filmUrl) URL.revokeObjectURL(filmUrl);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const room = 12 - shots.length;
    const added = Array.from(list)
      .slice(0, Math.max(0, room))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (added.length) {
      setShots((s) => [...s, ...added]);
      setScript(null);
      setFilmUrl("");
      setErr(null);
    }
  };

  const removeAt = (i: number) => {
    setShots((s) => {
      URL.revokeObjectURL(s[i].url);
      return s.filter((_, j) => j !== i);
    });
    setScript(null);
    setFilmUrl("");
  };

  const move = (i: number, dir: -1 | 1) => {
    setShots((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setScript(null);
    setFilmUrl("");
  };

  const totalMs = TITLE_MS + shots.length * PHOTO_MS + CLOSING_MS;

  // --- drawing -------------------------------------------------------------

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, s: Script, t: number) => {
      ctx.save();
      ctx.fillStyle = "#0a0607";
      ctx.fillRect(0, 0, W, H);

      const card = (heading: string, sub: string, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 86px Georgia, serif";
        wrap(ctx, heading, W - 200, 3).forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 - 40 + i * 100));
        if (sub) {
          ctx.fillStyle = "#d8b6ba";
          ctx.font = "italic 44px Georgia, serif";
          wrap(ctx, sub, W - 260, 3).forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 + 150 + i * 60));
        }
        ctx.globalAlpha = 1;
      };

      const fade = (elapsed: number, span: number) =>
        Math.min(1, Math.min(elapsed, span - elapsed) / FADE_MS) || 0;

      if (t < TITLE_MS) {
        card(s.title, s.opening, Math.max(0, fade(t, TITLE_MS)));
        ctx.restore();
        return;
      }

      const afterTitle = t - TITLE_MS;
      const idx = Math.floor(afterTitle / PHOTO_MS);

      if (idx >= shots.length) {
        card(s.closing || "", "", Math.max(0, fade(afterTitle - shots.length * PHOTO_MS, CLOSING_MS)));
        ctx.restore();
        return;
      }

      const img = imagesRef.current[idx];
      const elapsed = afterTitle - idx * PHOTO_MS;
      const alpha = Math.max(0, fade(elapsed, PHOTO_MS));
      const progress = elapsed / PHOTO_MS;
      // A slow push-in. Small enough to feel like a film, not a zoom effect.
      const zoom = 1 + progress * 0.07;

      if (img) {
        ctx.globalAlpha = alpha;

        // Blurred fill behind, so a landscape photo sits in a soft frame rather
        // than on black bars — and is never cropped to fill.
        const coverScale = Math.max(W / img.width, H / img.height) * 1.1;
        ctx.filter = "blur(40px) brightness(0.45)";
        ctx.drawImage(
          img,
          (W - img.width * coverScale) / 2,
          (H - img.height * coverScale) / 2,
          img.width * coverScale,
          img.height * coverScale,
        );
        ctx.filter = "none";

        // The photograph itself: contained, whole, nothing trimmed.
        const fit = Math.min(W / img.width, (H * 0.72) / img.height) * zoom;
        const dw = img.width * fit;
        const dh = img.height * fit;
        ctx.drawImage(img, (W - dw) / 2, H * 0.38 - dh / 2, dw, dh);
        ctx.globalAlpha = 1;
      }

      const caption = s.captions[idx];
      if (caption) {
        ctx.globalAlpha = alpha;
        const grad = ctx.createLinearGradient(0, H * 0.62, 0, H);
        grad.addColorStop(0, "rgba(10,6,7,0)");
        grad.addColorStop(0.35, "rgba(10,6,7,0.92)");
        grad.addColorStop(1, "rgba(10,6,7,1)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.62, W, H * 0.38);

        ctx.textAlign = "center";
        ctx.fillStyle = "#f2e9ea";
        ctx.font = "44px Georgia, serif";
        wrap(ctx, caption, W - 160, 4).forEach((ln, i) => ctx.fillText(ln, W / 2, H * 0.78 + i * 62));
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
    [shots.length],
  );

  const drawPoster = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && script) drawFrame(ctx, script, TITLE_MS / 2);
  }, [script, drawFrame]);

  useEffect(() => {
    drawPoster();
  }, [drawPoster]);

  const runFilm = useCallback(
    (onDone?: () => void) => {
      const canvas = canvasRef.current;
      const s = script;
      if (!canvas || !s) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const start = performance.now();
      const tick = () => {
        const t = performance.now() - start;
        if (t >= totalMs) {
          setPlaying(false);
          onDone?.();
          // Settle back on the title card rather than the final fade-to-black.
          drawFrame(ctx, s, TITLE_MS / 2);
          return;
        }
        drawFrame(ctx, s, t);
        rafRef.current = requestAnimationFrame(tick);
      };
      setPlaying(true);
      tick();
    },
    [script, totalMs, drawFrame],
  );

  // --- actions -------------------------------------------------------------

  const write = async () => {
    if (shots.length < 2) {
      setErr("Add at least 2 photos — a film needs something to move between.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    setFilmUrl("");
    try {
      const photos = await Promise.all(
        shots.map(async (s) => ({ data: await fileToBase64(s.file), mimeType: s.file.type || "image/jpeg" })),
      );
      const res = await fetch("/api/memory-film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos, type, details: details.trim(), languageCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const gap = await shortfallFrom(res, data);
        if (gap) setShort(gap);
        else setErr(data.error || "Couldn't write the narration. Try again.");
        return;
      }
      tokens.setBalance(data.balance);
      imagesRef.current = await Promise.all(shots.map((s) => loadImage(s.url)));
      setScript({
        title: data.title,
        opening: data.opening,
        closing: data.closing,
        captions: data.captions,
        rtl: Boolean(data.language?.rtl),
      });
      recordCreation({
        toolSlug: "story-memory-generator",
        toolTitle: "Story & Memory Generator",
        title: data.title,
        status: "completed",
        kind: "video",
        mediaUrl: "",
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const record = () => {
    const canvas = canvasRef.current;
    if (!canvas || !script) return;
    // Recording is real time — the film is played once and captured as it goes.
    const stream = canvas.captureStream(30);
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType =
      typeof MediaRecorder === "undefined" ? undefined : types.find((t) => MediaRecorder.isTypeSupported(t));
    if (!mimeType) {
      setErr("This browser cannot save video. Chrome, Edge and Firefox can.");
      return;
    }
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setFilmUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setRecording(false);
    };
    setRecording(true);
    rec.start();
    runFilm(() => setTimeout(() => rec.state !== "inactive" && rec.stop(), 250));
  };

  const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" } as const;

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ backgroundImage: "radial-gradient(900px 500px at 70% -5%,rgba(225,29,42,.16),transparent 60%)" }}
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
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
          <TokenMeter slug="story-memory-generator" tokens={tokens} variant="chip" />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>
          Studio
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Story &amp; Memory Generator
        </h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>
          Your own photographs, cut into one film with written narration. Nothing here is AI-generated art — these stay
          your pictures, whole and uncropped.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          {/* ---------------- setup ---------------- */}
          <div
            className="flex flex-col gap-5 rounded-2xl p-5 lg:col-span-2"
            style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
          >
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-white/80">
                Your photos <span style={{ color: "#ff8892" }}>★</span>{" "}
                <span className="font-normal text-white/35">({shots.length}/12)</span>
              </p>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/[.03]"
                style={inputStyle}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>
                  🖼️
                </span>
                <span className="text-[13px] text-white/60">
                  {shots.length ? "Add more photos" : "Choose 2 to 12 photos, in any order"}
                </span>
              </label>

              {shots.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {shots.map((s, i) => (
                    <div
                      key={s.url}
                      className="flex items-center gap-2 rounded-lg p-1.5"
                      style={{ border: "1px solid rgba(255,255,255,.07)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt="" className="h-10 w-10 rounded object-cover" />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-white/50">{s.file.name}</span>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move earlier"
                        className="px-1.5 text-white/40 hover:text-white disabled:opacity-20"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === shots.length - 1}
                        aria-label="Move later"
                        className="px-1.5 text-white/40 hover:text-white disabled:opacity-20"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeAt(i)}
                        aria-label="Remove"
                        className="px-1.5 text-white/40 hover:text-[#ff8a92]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">What kind of memory?</label>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={
                      type === t.value
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    <span aria-hidden>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="mf-details" className="mb-1 block text-[13px] font-semibold text-white/80">
                Tell us about it
              </label>
              <p className="mb-1.5 text-[11.5px] leading-relaxed text-white/40">
                Names, the occasion, what it meant. We only use what you write here — no invented details.
              </p>
              <textarea
                id="mf-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Our trip to the mountains last summer, the last one with Grandpa."
                className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="mf-lang" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Language
              </label>
              <select
                id="mf-lang"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                    {l.endonym !== l.name ? ` — ${l.endonym}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={write}
              disabled={busy || shots.length < 2}
              className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              {busy ? "Reading your photos…" : script ? "Rewrite the narration" : "Make the film"}
            </button>

            <TokenMeter slug="story-memory-generator" tokens={tokens} />

            {short && <NotEnoughTokens {...short} />}

            {err && (
              <p
                role="alert"
                className="rounded-xl px-3.5 py-2.5 text-[13px]"
                style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}
              >
                {err}
              </p>
            )}
          </div>

          {/* ---------------- the film ---------------- */}
          <div className="lg:col-span-3">
            <div
              className="overflow-hidden rounded-2xl p-5"
              style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
            >
              {!script ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
                  <span className="text-4xl" aria-hidden>
                    🎞️
                  </span>
                  <p className="font-display text-lg font-bold">No film yet</p>
                  <p className="max-w-[380px] text-[13px] leading-relaxed" style={{ color: "#8d7f81" }}>
                    Add your photos and press make. We look at each one and write a line for it, then cut them together
                    into a film you can download and keep.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-xl font-bold">{script.title}</h2>
                    <span className="text-[12.5px] text-white/40">
                      {shots.length} photos · {Math.round(totalMs / 1000)}s
                    </span>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="mx-auto w-full max-w-[300px] rounded-xl bg-black"
                    style={{ aspectRatio: "9 / 16", border: "1px solid rgba(255,255,255,.08)" }}
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => runFilm()}
                      disabled={playing || recording}
                      className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      {playing && !recording ? "Playing…" : "Preview"}
                    </button>
                    <button
                      onClick={record}
                      disabled={playing || recording}
                      className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white/70 disabled:opacity-50"
                      style={{ border: "1px solid rgba(255,255,255,.14)" }}
                    >
                      {recording ? `Recording… ${Math.round(totalMs / 1000)}s` : "Save as video"}
                    </button>
                  </div>

                  {filmUrl && (
                    <a
                      href={filmUrl}
                      download={`${script.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "memory"}.webm`}
                      className="mt-2 block rounded-xl py-2.5 text-center text-[13px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#3ad17a,#1f9b54)" }}
                    >
                      Download your film
                    </a>
                  )}

                  <p className="mt-3 text-[11.5px] leading-relaxed text-white/35">
                    The film carries written narration on screen. There is no spoken voiceover — that needs a
                    text-to-speech provider we have not connected yet.
                  </p>

                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/35">Narration</p>
                    <ol className="flex flex-col gap-1.5" dir={script.rtl ? "rtl" : "ltr"}>
                      {script.captions.map((c, i) => (
                        <li key={i} className="text-[12.5px] leading-relaxed" style={{ color: "#b9acae" }}>
                          {i + 1}. {c || <span className="text-white/25">(no line for this photo)</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11.5px] leading-relaxed text-white/35">
          Your photos are sent to the AI provider once, to write the narration, and are not kept by Reelo. The film
          itself is made on your own device and never uploaded. See the{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
