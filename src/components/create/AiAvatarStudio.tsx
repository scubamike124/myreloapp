"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Avatar = { avatarId: string; name: string; gender: string; image: string; video: string };
type Status = "idle" | "generating" | "done";

// Known-good STANDARD HeyGen voices (voice-design voices have no avatar mapping).
const VOICES = [
  { id: "f8c69e517f424cafaecde32dde57096b", label: "Allison (F)" },
  { id: "cef3bc4e0a84424cafcde6f2cf466c97", label: "Ivy (F)" },
  { id: "4754e1ec667544b0bd18cdf4bec7d6a7", label: "Brittney (F)" },
  { id: "f38a635bee7a4d1f9b0a654a31d050d2", label: "Chill Brian (M)" },
  { id: "d92994ae0de34b2e8659b456a2f388b8", label: "John Doe (M)" },
  { id: "453c20e1525a429080e2ad9e4b26f2cd", label: "Archer (M)" },
];
const PAGE = 48;

export default function AiAvatarStudio() {
  // --- gallery state ---
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Avatar | null>(null);

  // --- generation state ---
  const [script, setScript] = useState("Hi! I'm your AI presenter. Let me show you how easy it is to create studio-quality videos with Reelo.");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const genTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch a page of avatars (append when loading more, replace on a fresh query).
  const fetchAvatars = useCallback(async (nextOffset: number, replace: boolean, query: string, g: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(nextOffset), limit: String(PAGE) });
      if (query) params.set("q", query);
      if (g) params.set("gender", g);
      const res = await fetch(`/api/heygen-avatars?${params}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not load avatars.");
      setTotal(data.total);
      setOffset(nextOffset + data.avatars.length);
      setAvatars((prev) => (replace ? data.avatars : [...prev, ...data.avatars]));
      setSelected((cur) => cur ?? (replace ? data.avatars[0] ?? null : cur));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load avatars.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + debounced re-query on search/gender. One effect handles both
  // so mount fires a single request (two effects meant two identical fetches of
  // a slow endpoint). First run is immediate; later ones debounce.
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      fetchAvatars(0, true, "", "");
      return;
    }
    const t = setTimeout(() => fetchAvatars(0, true, q, gender), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, gender]);

  // Clean up timers on unmount.
  useEffect(() => () => { [genTimer, pollTimer].forEach((t) => t.current && clearInterval(t.current)); }, []);

  const generate = async () => {
    if (!selected) { setErr("Pick an avatar first."); return; }
    if (!script.trim()) { setErr("Write a script first."); return; }
    setErr(null);
    setStatus("generating");
    setProgress(0);
    if (genTimer.current) clearInterval(genTimer.current);
    if (pollTimer.current) clearInterval(pollTimer.current);
    genTimer.current = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 1500);

    try {
      const res = await fetch("/api/heygen-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, avatarId: selected.avatarId, voiceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed.");
      const videoId = data.videoId as string;

      const finalUrl = await new Promise<string>((resolve, reject) => {
        let tries = 0;
        pollTimer.current = setInterval(async () => {
          if (++tries > 168) { // ~14 min guard
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
          } catch { /* keep polling */ }
        }, 5000);
      });

      if (genTimer.current) clearInterval(genTimer.current);
      setVideoUrl(finalUrl);
      setProgress(100);
      setStatus("done");
    } catch (e) {
      if (genTimer.current) clearInterval(genTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      setErr(e instanceof Error ? e.message : "Generation failed.");
      setStatus("idle");
    }
  };

  const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#0a0607" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(900px 500px at 70% -5%,rgba(225,29,42,.16),transparent 60%)" }} />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/create" className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-display grid h-7 w-7 place-items-center rounded-lg text-xs font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}>R</span>
            Create
          </Link>
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ border: "1px solid rgba(255,70,85,.2)", color: "#cabcbe" }}>Uses 1 credit</span>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>Studio</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">AI Avatar Studio</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>Realistic AI avatars that talk and engage — {total > 0 ? total.toLocaleString() : "1,000+"} to choose from.</p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          {/* left: gallery + script */}
          <div className="lg:col-span-3 space-y-5">
            {/* search + filters */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3.5" style={inputStyle}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff8a92" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search avatars by name…" className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/35 outline-none" />
                </div>
                <div className="inline-flex gap-1 rounded-xl p-1" style={inputStyle}>
                  {[["", "All"], ["female", "Female"], ["male", "Male"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setGender(val)} className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors" style={gender === val ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { color: "#b9a9ab" }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <p className="mt-2.5 text-xs text-white/40">{total.toLocaleString()} avatars{q ? ` matching “${q}”` : ""}{gender ? ` · ${gender}` : ""}{selected ? ` · selected: ${selected.name}` : ""}</p>

              {/* avatar grid */}
              <div className="mt-4 grid max-h-[440px] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5">
                {/* First load: show placeholders so the grid never looks empty/broken. */}
                {loading && avatars.length === 0 &&
                  Array.from({ length: 15 }).map((_, i) => (
                    <div key={`sk${i}`} className="aspect-[3/4] w-full animate-pulse rounded-xl" style={{ background: "rgba(255,70,85,.07)", border: "1px solid rgba(255,70,85,.12)" }} />
                  ))}
                {avatars.map((a) => {
                  const on = selected?.avatarId === a.avatarId;
                  return (
                    <button key={a.avatarId} onClick={() => setSelected(a)} title={a.name} className="group relative overflow-hidden rounded-xl transition" style={{ border: on ? "2px solid #ff3645" : "1px solid rgba(255,70,85,.15)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.image} alt={a.name} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover transition group-hover:scale-105" style={{ background: "#1a1012" }} />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-left text-[10px] font-medium text-white/90">{a.name}</span>
                      {on && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full" style={{ background: "#ff3645" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
                    </button>
                  );
                })}
              </div>

              {offset < total && (
                <button onClick={() => fetchAvatars(offset, false, q, gender)} disabled={loading} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50">
                  {loading ? "Loading…" : `Load more (${(total - offset).toLocaleString()} left)`}
                </button>
              )}
            </div>

            {/* script + voice */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">Script <span className="text-white/40">· spoken by the avatar (max ~30s)</span></label>
                <textarea rows={4} value={script} onChange={(e) => setScript(e.target.value)} className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/85">Voice</label>
                <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="w-full appearance-none rounded-xl px-4 py-3 text-sm text-white outline-none" style={inputStyle}>
                  {VOICES.map((v) => <option key={v.id} value={v.id} className="bg-[#140a0c]">{v.label}</option>)}
                </select>
              </div>
              <button onClick={generate} disabled={status === "generating"} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}>
                {status === "generating" ? <><Spinner /> Generating…</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>{status === "done" ? "Regenerate" : "Generate avatar video"}</>}
              </button>
              {err && <p className="text-sm font-medium text-[#ff8a92]">{err}</p>}
              {status !== "generating" && !err && <p className="text-center text-xs text-white/40">Generates a real talking-avatar video with HeyGen (~1–3 min).</p>}
            </div>
          </div>

          {/* right: preview / result */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
              <p className="mb-3 px-2 text-sm font-semibold text-white/70">{status === "done" ? "Your video" : "Preview"}</p>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                {status === "done" ? (
                  <video src={videoUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay controls loop playsInline />
                ) : selected ? (
                  selected.video ? (
                    // Muted looping preview of the chosen avatar; poster is the still image.
                    <video key={selected.avatarId} src={selected.video} poster={selected.image} muted autoPlay loop playsInline className={`absolute inset-0 h-full w-full object-cover transition ${status === "generating" ? "opacity-25" : "opacity-100"}`} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.image} alt={selected.name} className={`absolute inset-0 h-full w-full object-cover transition ${status === "generating" ? "opacity-25" : "opacity-100"}`} />
                  )
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/40">Pick an avatar</div>
                )}

                {status === "generating" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55">
                    <Spinner large />
                    <div className="w-3/4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div>
                      <p className="mt-2.5 text-center text-[13px] font-medium text-white/85">Rendering your avatar…</p>
                      <p className="mt-0.5 text-center text-xs text-white/45">{progress}%</p>
                    </div>
                  </div>
                )}
              </div>

              {status === "done" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,70,85,.1)", color: "#ffb3b9" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Your avatar video is ready!
                  </div>
                  <a href={videoUrl} download className="flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
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
