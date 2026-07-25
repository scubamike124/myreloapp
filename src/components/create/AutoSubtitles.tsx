"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

type Format = "SRT" | "VTT";

export default function AutoSubtitles() {
  const [script, setScript] = useState("");
  const [format, setFormat] = useState<Format>("SRT");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [content, setContent] = useState("");
  const [cues, setCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const tokens = useTokens();

  const onFile = (f?: File) => {
    fileRef.current = f ?? null;
    setFileName(f?.name ?? "");
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(new Error("Could not read the file."));
      r.readAsDataURL(file);
    });

  const generate = async () => {
    if (!script.trim() && !fileRef.current) {
      setErr("Paste a script or upload a short audio/video clip.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    setContent("");
    setCues([]);
    try {
      let audioBase64 = "";
      let mimeType = "audio/mpeg";
      if (fileRef.current) {
        if (fileRef.current.size > 8 * 1024 * 1024) {
          throw new Error("Keep uploads under ~8MB, or paste the script instead.");
        }
        audioBase64 = await fileToBase64(fileRef.current);
        mimeType = fileRef.current.type || "audio/mpeg";
      }
      const res = await fetch("/api/auto-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: script.trim(),
          format,
          audioBase64: audioBase64 || undefined,
          mimeType,
        }),
      });
      const data = await res.json();
      const gap = await shortfallFrom(res, data);
      if (gap) {
        setShort(gap);
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Generation failed.");
      tokens.setBalance(data.balance);
      setContent(String(data.content || ""));
      setCues(Array.isArray(data.cues) ? data.cues : []);
      recordCreation({
        toolSlug: "auto-subtitles",
        toolTitle: "Auto Subtitles",
        title: `Subtitles (${format})`,
        status: "completed",
        kind: "file",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Generation failed.";
      setErr(message);
      recordCreation({
        toolSlug: "auto-subtitles",
        toolTitle: "Auto Subtitles",
        title: "Subtitles",
        status: "failed",
        kind: "file",
        error: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!content) return;
    const blob = new Blob([content], { type: format === "VTT" ? "text/vtt" : "application/x-subrip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reelo-subtitles.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <TokenMeter slug="auto-subtitles" tokens={tokens} variant="chip" />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>Studio</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Auto Subtitles</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>Generate accurate SRT/VTT subtitles from a script or short clip.</p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md lg:col-span-3 sm:p-7">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Upload audio or video (optional)</span>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/20 px-4 py-4">
                <input
                  type="file"
                  accept="audio/*,video/mp4,video/webm,.mp3,.wav,.m4a,.mp4,.webm"
                  className="text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </div>
              {fileName && <p className="mt-1.5 text-xs text-white/45">{fileName}</p>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Script / transcript</span>
              <textarea
                rows={8}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste spoken words if you don't have an audio file…"
                className="w-full resize-y rounded-xl bg-transparent px-4 py-3 text-sm text-white placeholder-white/35 outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)" }}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Format</span>
              <div className="flex gap-2">
                {(["SRT", "VTT"] as Format[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={format === f
                      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 28px -8px rgba(225,29,42,.6)" }}
            >
              {busy ? "Generating…" : content ? "Regenerate" : "Generate subtitles"}
            </button>
            {short && <NotEnoughTokens {...short} />}
            {err && <p role="alert" className="text-sm font-medium text-[#ff8a92]">{err}</p>}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
              <p className="mb-3 px-2 text-sm font-semibold text-white/70">{content ? "Your subtitles" : "Preview"}</p>
              {content ? (
                <div className="space-y-3">
                  <pre className="max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/60 p-3 text-[11px] leading-relaxed text-white/80 whitespace-pre-wrap">
                    {content}
                  </pre>
                  {cues.length > 0 && (
                    <p className="text-xs text-white/45">{cues.length} cues · download as .{format.toLowerCase()}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={download}
                      className="rounded-full px-3 py-2.5 text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      Download {format}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setContent(""); setCues([]); }}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold hover:bg-white/10"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid aspect-[9/16] place-items-center rounded-2xl border border-white/10 bg-black/50 px-6 text-center text-sm text-white/45">
                  Subtitles will appear here as SRT or VTT you can download into any editor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
