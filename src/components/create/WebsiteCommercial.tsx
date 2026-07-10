"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type Step = "input" | "scanning" | "detected" | "generating" | "result";
type UploadStage = "connecting" | "uploading" | "posted";

const RESULT_VIDEO = "/assets/hero-video.mp4";
const MAX_SECONDS = 8; // single cinematic clip length (test mode)

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

const PLATFORMS: { name: string; bg: string; icon: string }[] = [
  { name: "TikTok", bg: "#000000", icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { name: "Instagram", bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", icon: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
  { name: "YouTube", bg: "#FF0000", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { name: "Facebook", bg: "#1877F2", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
];

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
  const [copied, setCopied] = useState(false);
  const [upload, setUpload] = useState<{ platform: string; bg: string; stage: UploadStage; pct: number } | null>(null);

  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const genTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const upTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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
    setUpload(null);
    setErr(null);
    setStep("generating");
    setProgress(0);
    if (genTimer.current) clearInterval(genTimer.current);
    // Ease toward 95% while the real (multi-minute) render runs.
    genTimer.current = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 2400);
    try {
      const res = await fetch("/api/generate-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (genTimer.current) clearInterval(genTimer.current);
      if (!res.ok || !data.ok) throw new Error(data.error || "Video generation failed.");
      setVideoUrl(data.videoUrl);
      setProgress(100);
      setStep("result");
    } catch (e) {
      if (genTimer.current) clearInterval(genTimer.current);
      setErr(e instanceof Error ? e.message : "Video generation failed.");
      setStep("detected");
    }
  };

  const startOver = () => {
    [scanTimer, genTimer, upTimer].forEach((t) => t.current && clearInterval(t.current));
    setStep("input");
    setUrl("");
    setProgress(0);
    setUpload(null);
  };

  const copyLink = () => {
    try {
      navigator.clipboard?.writeText(`https://reelo.app/v/${brand.toLowerCase().replace(/\s+/g, "-")}-commercial`);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const startUpload = (platform: string, bg: string) => {
    if (upTimer.current) clearInterval(upTimer.current);
    setUpload({ platform, bg, stage: "connecting", pct: 0 });
    let tick = 0;
    upTimer.current = setInterval(() => {
      tick++;
      setUpload((u) => {
        if (!u) return u;
        if (u.stage === "connecting") return tick > 13 ? { ...u, stage: "uploading", pct: 0 } : u;
        if (u.stage === "uploading") {
          const np = u.pct + 4;
          if (np >= 100) {
            if (upTimer.current) clearInterval(upTimer.current);
            return { ...u, stage: "posted", pct: 100 };
          }
          return { ...u, pct: np };
        }
        return u;
      });
    }, 90);
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
              <video ref={videoRef} src={videoUrl || RESULT_VIDEO} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
              {!upload && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                  <span className="rounded-md px-2 py-1 text-[11px] font-semibold text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>0:0{MAX_SECONDS} · {style}</span>
                  <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "rgba(10,6,8,.6)", backdropFilter: "blur(4px)" }}>
                    {muted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
                    )}
                  </button>
                </div>
              )}

              {upload && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: "rgba(6,3,4,.86)", backdropFilter: "blur(6px)" }}>
                  {upload.stage === "connecting" && (
                    <><PlatBadge bg={upload.bg} /><Spinner large /><p className="text-sm font-semibold">Connecting to {upload.platform}…</p></>
                  )}
                  {upload.stage === "uploading" && (
                    <>
                      <PlatBadge bg={upload.bg} />
                      <p className="text-sm font-semibold">Uploading to {upload.platform}…</p>
                      <div className="w-3/4"><div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${upload.pct}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div><p className="mt-2 text-xs text-white/55">{upload.pct}%</p></div>
                    </>
                  )}
                  {upload.stage === "posted" && (
                    <>
                      <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(46,204,113,.15)", border: "2px solid #2ecc71" }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                      <div><p className="text-[15px] font-bold">Published to {upload.platform}!</p><p className="mt-1 text-xs text-white/55">Your commercial is now live on your {upload.platform} account.</p></div>
                      <div className="flex flex-col items-center gap-2">
                        <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: upload.bg }}>View post<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg></a>
                        <button onClick={() => setUpload(null)} className="text-xs font-semibold text-white/55 hover:text-white">Done</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {!upload && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-white/55">Upload to your social media — one click</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.name} onClick={() => startUpload(p.name, p.bg)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: p.bg }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={p.icon} /></svg>
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a href={videoUrl || RESULT_VIDEO} download className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                    Download
                  </a>
                  <button onClick={copyLink} className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                    {copied ? "Copied!" : "Link"}
                  </button>
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

function PlatBadge({ bg }: { bg: string }) {
  return <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: bg, boxShadow: "0 8px 24px -6px rgba(0,0,0,.6)" }} />;
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
