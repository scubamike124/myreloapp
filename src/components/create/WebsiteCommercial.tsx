"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { recordCreation } from "@/lib/workspace";

type Step = "input" | "scanning" | "detected" | "generating" | "result";
const MAX_SECONDS = 30; // HeyGen spokesperson commercial cap

const SCAN_TASKS = [
  "Fetching your website…",
  "Reading your copy & headings…",
  "Detecting brand colors & logo…",
  "Understanding what you do…",
  "Summarizing your business…",
];

const RENDER_STAGES = [
  "Writing your script…",
  "Storyboarding the scenes…",
  "Rendering cinematic shots…",
  "Adding voiceover & music…",
  "Color grading…",
  "Finalizing your 30-second commercial…",
];

const STYLES = ["Cinematic", "Energetic", "Luxury", "Minimal"];

function brandFromUrl(url: string) {
  try {
    let u = url.trim();
    if (!/^https?:\/\//.test(u)) u = "https://" + u;
    const host = new URL(u).hostname.replace(/^www\./, "");
    const root = host.split(".")[0].replace(/[-_]/g, " ");
    return root.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Your Brand";
  } catch {
    return "Your Brand";
  }
}

const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;

export default function WebsiteCommercial() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [scanIdx, setScanIdx] = useState(0);

  const [brand, setBrand] = useState("");
  const [about, setAbout] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [script, setScript] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);

  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const genTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const renderStage = RENDER_STAGES[Math.min(RENDER_STAGES.length - 1, Math.floor((progress / 100) * RENDER_STAGES.length))];

  const analyze = async () => {
    if (!url.trim()) return;
    setErr(null);
    setStep("scanning");
    setScanIdx(0);
    if (scanTimer.current) clearInterval(scanTimer.current);
    // Advance the scan checklist while the real request is in flight.
    scanTimer.current = setInterval(() => setScanIdx((i) => (i >= SCAN_TASKS.length ? i : i + 1)), 700);

    try {
      const [res] = await Promise.all([
        fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      const data = await res.json();
      if (scanTimer.current) clearInterval(scanTimer.current);
      if (!res.ok || !data.ok) throw new Error(data.error || "Analysis failed.");
      setBrand(data.businessName || brandFromUrl(url));
      setAbout(data.about || "");
      setScript(data.script || "");
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      setCategory(data.category || "");
      setStep("detected");
    } catch (e) {
      if (scanTimer.current) clearInterval(scanTimer.current);
      setErr(e instanceof Error ? e.message : "Analysis failed.");
      setBrand(brandFromUrl(url));
      setAbout("We couldn't reach the AI just now — edit the details below and generate anyway.");
      setScript("");
      setIdeas([]);
      setCategory("");
      setStep("detected");
    }
  };

  const generate = async () => {
    setErr(null);
    setStep("generating");
    setProgress(0);
    if (genTimer.current) clearInterval(genTimer.current);
    if (pollTimer.current) clearInterval(pollTimer.current);
    // Ease toward 95% while the real render runs (HeyGen ~1–3 min).
    genTimer.current = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 1500);

    // HeyGen renders a spokesperson presenting the AI-written script.
    const finalScript = script.trim() || `${brand}. ${about}`.trim();

    try {
      // 1. Kick off the HeyGen render (returns a video id immediately).
      const res = await fetch("/api/heygen-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: finalScript }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Video generation failed.");
      const videoId = data.videoId as string;

      // 2. Poll our status endpoint until HeyGen finishes.
      const finalUrl = await new Promise<string>((resolve, reject) => {
        let tries = 0;
        pollTimer.current = setInterval(async () => {
          if (++tries > 168) { // ~14 min safety guard (HeyGen's trial queue can be slow)
            if (pollTimer.current) clearInterval(pollTimer.current);
            reject(new Error("Video is taking too long — please try again."));
            return;
          }
          try {
            const r = await fetch(`/api/heygen-video?video_id=${videoId}`);
            const d = await r.json();
            if (d.status === "completed" && d.videoUrl) {
              if (pollTimer.current) clearInterval(pollTimer.current);
              resolve(d.videoUrl as string);
            } else if (d.status === "failed") {
              if (pollTimer.current) clearInterval(pollTimer.current);
              reject(new Error(d.error?.detail || d.error?.message || "Generation failed on HeyGen."));
            }
          } catch {
            /* transient network blip — keep polling */
          }
        }, 5000);
      });

      if (genTimer.current) clearInterval(genTimer.current);
      setVideoUrl(finalUrl);
      setProgress(100);
      setStep("result");
      recordCreation({
        toolSlug: "website-commercial",
        toolTitle: "Website Commercial",
        title: brand || url,
        status: "completed",
        kind: "video",
        mediaUrl: finalUrl,
      });
    } catch (e) {
      if (genTimer.current) clearInterval(genTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      const message = e instanceof Error ? e.message : "Video generation failed.";
      setErr(message);
      setStep("detected");
      recordCreation({
        toolSlug: "website-commercial",
        toolTitle: "Website Commercial",
        title: brand || url,
        status: "failed",
        kind: "video",
        error: message,
      });
    }
  };

  const startOver = () => {
    [scanTimer, genTimer, pollTimer].forEach((t) => t.current && clearInterval(t.current));
    setStep("input");
    setUrl("");
    setProgress(0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(900px 500px at 70% -5%,rgba(225,29,42,.16),transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,70,85,.05) 1px,transparent 1px)", backgroundSize: "26px 26px" }} />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/create" className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-display grid h-7 w-7 place-items-center rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}>R</span>
            Create
          </Link>
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ border: "1px solid rgba(255,70,85,.2)", color: "#cabcbe" }}>Uses 5 credits</span>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* ---------- INPUT ---------- */}
        {step === "input" && (
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.06)", color: "#ff8a92" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" /></svg>
              Website to Commercial AI
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              From URL to{" "}
              <span style={{ background: "linear-gradient(120deg,#ff4a57,#c4101c)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>30 days of content</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-[1.6]" style={{ color: "#a99a9c" }}>
              Reelo analyzes your website, writes 20 video ideas, builds your content calendar, and turns the ideas into videos.
            </p>

            <div className="mx-auto mt-8 max-w-[560px] rounded-3xl border border-white/10 bg-black/40 p-5 text-left backdrop-blur-md sm:p-6">
              <label className="mb-2 block text-sm font-semibold text-white/85">Your website</label>
              <div className="flex items-center gap-2 rounded-xl px-3.5" style={inputStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8a92" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
                <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyze()} placeholder="yourbusiness.com" className="w-full bg-transparent py-3 text-[15px] text-white placeholder-white/35 outline-none" />
              </div>
              <button onClick={analyze} disabled={!url.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-50" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>
                Analyze My Website
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
              <p className="mt-3 text-xs leading-relaxed text-white/40">Works with any URL — myreelo.com, https://myreelo.com, or https://www.myreelo.com. Your commercial is capped at 30 seconds for the best quality and price.</p>
            </div>
          </div>
        )}

        {/* ---------- SCANNING ---------- */}
        {step === "scanning" && (
          <div className="mx-auto max-w-[520px] pt-6 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl" style={{ border: "1px solid rgba(255,70,85,.3)", boxShadow: "0 0 30px -6px rgba(225,29,42,.6)" }}>
              <Spinner large />
            </div>
            <h2 className="font-display text-2xl font-bold">Scanning your website…</h2>
            <p className="mt-1 text-sm" style={{ color: "#a99a9c" }}>{url}</p>
            <div className="mx-auto mt-7 max-w-[420px] space-y-2.5 text-left">
              {SCAN_TASKS.map((t, i) => {
                const done = i < scanIdx;
                const active = i === scanIdx;
                return (
                  <div key={t} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${done || active ? "opacity-100" : "opacity-40"}`} style={{ border: "1px solid rgba(255,70,85,.15)", background: "rgba(255,60,75,.03)" }}>
                    {done ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    ) : active ? (
                      <Spinner />
                    ) : (
                      <span className="h-[18px] w-[18px] rounded-full border border-white/20" />
                    )}
                    <span className="text-sm font-medium text-white/85">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------- DETECTED (auto-filled, editable = manual option) ---------- */}
        {step === "detected" && (
          <div className="mx-auto max-w-[620px]">
            {err ? (
              <div className="mb-5 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ border: "1px solid rgba(255,159,67,.35)", background: "rgba(255,159,67,.08)", color: "#ffcf9a" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                {err}
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ border: "1px solid rgba(46,204,113,.3)", background: "rgba(46,204,113,.08)", color: "#8ff0b5" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                We scanned <strong className="mx-1 text-white">{url}</strong>{category ? <> · detected <strong className="mx-1 text-white">{category}</strong></> : null} — tweak anything, or just generate.
              </div>
            )}

            <div className="space-y-5 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">Business name</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">What your business does</label>
                <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-white outline-none" style={inputStyle} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/85">Style</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-white outline-none" style={inputStyle}>
                    {STYLES.map((s) => <option key={s} value={s} className="bg-[#140a0c]">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/85">Detected brand colors</label>
                  <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={inputStyle}>
                    {["#ff3645", "#c4101c", "#0a0607", "#ffb3b9"].map((c) => <span key={c} className="h-6 w-6 rounded-full" style={{ background: c, border: "1px solid rgba(255,255,255,.2)" }} />)}
                  </div>
                </div>
              </div>

              {/* AI-written commercial script */}
              {script && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/85">Commercial script <span className="text-white/40">· AI-written</span></label>
                  <textarea rows={4} value={script} onChange={(e) => setScript(e.target.value)} className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-white outline-none" style={inputStyle} />
                </div>
              )}

              {/* 20 AI video ideas */}
              {ideas.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/85">{ideas.length} video ideas <span className="text-white/40">· generated for {brand}</span></label>
                  <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl p-2" style={inputStyle}>
                    {ideas.map((idea, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/80">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>{i + 1}</span>
                        {idea}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 30s hard cap */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ border: "1px solid rgba(255,70,85,.25)", background: "rgba(255,60,75,.05)" }}>
                <div className="flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8a92" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  <div>
                    <div className="text-sm font-semibold text-white">Duration · {MAX_SECONDS} seconds</div>
                    <div className="text-xs text-white/45">Commercials are capped at {MAX_SECONDS}s for the best quality &amp; price.</div>
                  </div>
                </div>
                <span className="rounded-md px-2.5 py-1 text-xs font-bold" style={{ background: "rgba(255,70,85,.14)", color: "#ff8a92" }}>Max {MAX_SECONDS}s</span>
              </div>

              <button onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.01]" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                Generate {MAX_SECONDS}s Cinematic Commercial
              </button>
              <button onClick={startOver} className="w-full text-center text-xs font-semibold text-white/45 hover:text-white">← Use a different website</button>
            </div>
          </div>
        )}

        {/* ---------- GENERATING ---------- */}
        {step === "generating" && (
          <div className="mx-auto max-w-[420px] pt-8 text-center">
            <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Spinner large />
                <div className="w-3/4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div>
                  <p className="mt-2.5 text-[13px] font-medium text-white/85">{renderStage}</p>
                  <p className="mt-0.5 text-xs text-white/45">{progress}%</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm" style={{ color: "#a99a9c" }}>Directing a cinematic {MAX_SECONDS}-second spot for <span className="text-white">{brand}</span>…</p>
            <p className="mt-1 text-xs text-white/40">Generating real AI video — this takes ~1–2 minutes. Keep this tab open.</p>
          </div>
        )}

        {/* ---------- RESULT ---------- */}
        {step === "result" && (
          <div className="mx-auto max-w-[480px]">
            <div className="mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,70,85,.1)", color: "#ffb3b9" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Your cinematic commercial for <strong className="mx-1 text-white">{brand}</strong> is ready!
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video ref={videoRef} src={videoUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
              {(
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                  <span className="rounded-md px-2 py-1 text-[11px] font-semibold text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>0:{String(MAX_SECONDS).padStart(2, "0")} · {style}</span>
                  <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>
                    {muted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                    )}
                  </button>
                </div>
              )}

            </div>

            {(
              <div className="mt-4 space-y-3">
                {/* No social publishing integration exists, so we point the user
                    at the download rather than faking an upload. */}
                <p className="text-xs leading-relaxed text-white/45">
                  Download your commercial to post it. Direct publishing to TikTok, Instagram and YouTube isn&apos;t
                  connected yet.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a href={videoUrl} download={`reelo-${brand.toLowerCase().replace(/\s+/g, "-") || "commercial"}.mp4`} className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                    Download
                  </a>
                  <button onClick={startOver} className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    New
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function Spinner({ large }: { large?: boolean }) {
  const s = large ? 40 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className="animate-spin text-[#ff5663]">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
