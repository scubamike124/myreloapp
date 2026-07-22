"use client";

import { useState } from "react";
import Link from "next/link";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

// ---------------------------------------------------------------------------
// 20 Shorts Generator.
//
// A month of shorts, written: hook, spoken script, shot list, caption and
// hashtags for each. Not twenty rendered videos — that would be $12 of provider
// time and a quarter of an hour per press, so the tool would either lose money
// or lie about what it was doing.
//
// Each short instead carries a handoff to the tool that renders its kind, with
// the script already in hand. The video cost lands on the videos the customer
// actually chose to make.
// ---------------------------------------------------------------------------

type Short = {
  hook: string;
  script: string;
  shots: string[];
  caption: string;
  hashtags: string[];
  bestFor: string;
};

type Batch = { brand: string; requested: number; shorts: Short[]; scanned: boolean; rtl: boolean };

const PLATFORMS = ["TikTok", "Reels", "Shorts", "All of them"];
const TONES = ["Punchy", "Educational", "Funny", "Inspirational"];

/** Where a short of this kind is actually made. */
const STUDIO: Record<string, { href: string; label: string }> = {
  "talking head": { href: "/create/talking-photo", label: "Talking Photo" },
  product: { href: "/create/product-commercial", label: "Product Commercial" },
  "b-roll": { href: "/create/ai-avatar-studio", label: "AI Avatar Studio" },
  "screen recording": { href: "/create/ai-avatar-studio", label: "AI Avatar Studio" },
};

export default function ShortsPlanner() {
  const [mode, setMode] = useState<"url" | "prompt">("url");
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(20);
  const [platform, setPlatform] = useState(PLATFORMS[3]);
  const [tone, setTone] = useState(TONES[0]);
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState<string>("");
  const tokens = useTokens();

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(""), 1600);
  };

  const generate = async () => {
    if (mode === "url" && !url.trim()) {
      setErr("Paste your website address first.");
      return;
    }
    if (mode === "prompt" && !prompt.trim()) {
      setErr("Say what the shorts should be about first.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    setBatch(null);
    try {
      const res = await fetch("/api/shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url.trim() : "",
          prompt: mode === "prompt" ? prompt.trim() : "",
          count,
          platform,
          tone,
          languageCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const gap = await shortfallFrom(res, data);
        if (gap) setShort(gap);
        else setErr(data.error || "Couldn't write the shorts. Try again.");
        return;
      }
      tokens.setBalance(data.balance);
      setBatch({
        brand: data.brand,
        requested: data.requested,
        shorts: data.shorts,
        scanned: data.scanned,
        rtl: Boolean(data.language?.rtl),
      });
      setOpen(0);
      recordCreation({
        toolSlug: "shorts-20",
        toolTitle: "20 Shorts Generator",
        title: `${data.shorts.length} shorts${data.brand ? ` — ${data.brand}` : ""}`,
        status: "completed",
        kind: "image",
        mediaUrl: "",
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const asText = (b: Batch) =>
    b.shorts
      .map(
        (s, i) =>
          `${i + 1}. ${s.hook}\n\n${s.script}\n\nSHOTS:\n${s.shots.map((x) => `  - ${x}`).join("\n")}\n\n` +
          `CAPTION: ${s.caption}\n${s.hashtags.map((h) => `#${h}`).join(" ")}\n`,
      )
      .join("\n----------------------------------------\n\n");

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
          <TokenMeter slug="shorts-20" tokens={tokens} variant="chip" />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>
          Studio
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">20 Shorts Generator</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>
          A month of shorts from one website or one sentence — each with its hook, spoken script, shot list, caption
          and hashtags.
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "#7d6f71" }}>
          These are scripts, not finished videos. Any one of them can be sent to the studio that films it, so you only
          spend on the videos you actually want.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          {/* ---------------- setup ---------------- */}
          <div
            className="flex flex-col gap-5 rounded-2xl p-5 lg:col-span-2"
            style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
          >
            <div>
              <p className="mb-2 text-[13px] font-semibold text-white/80">Where should the ideas come from?</p>
              <div className="mb-3 flex gap-1.5">
                {(["url", "prompt"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors"
                    style={
                      mode === m
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {m === "url" ? "My website" : "A topic"}
                  </button>
                ))}
              </div>

              {mode === "url" ? (
                <>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourbrand.com"
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                    style={inputStyle}
                  />
                  <p className="mt-1 text-[11.5px] text-white/35">
                    We read your site so the shorts are about what you actually sell.
                  </p>
                </>
              ) : (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Healthy meal-prep tips for busy parents"
                  className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  style={inputStyle}
                />
              )}
            </div>

            <div>
              <label htmlFor="sh-count" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                How many shorts
              </label>
              <select
                id="sh-count"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
              >
                {[5, 10, 15, 20, 25, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} shorts
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Platform</label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((pl) => (
                  <button
                    key={pl}
                    onClick={() => setPlatform(pl)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={
                      platform === pl
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {pl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={
                      tone === t
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="sh-lang" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Language
              </label>
              <select
                id="sh-lang"
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
              onClick={generate}
              disabled={busy}
              className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              {busy ? `Planning ${count} shorts…` : batch ? "Plan another month" : `Generate ${count} shorts`}
            </button>

            <TokenMeter slug="shorts-20" tokens={tokens} />

            {short && <NotEnoughTokens {...short} />}

            {busy && (
              <p className="text-[12px] leading-relaxed text-white/45">
                Reading, then writing every script in full. A month of shorts takes up to a minute.
              </p>
            )}

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

          {/* ---------------- the plan ---------------- */}
          <div className="lg:col-span-3">
            {!batch ? (
              <div
                className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center"
                style={{ border: "1px dashed rgba(255,70,85,.2)", background: "rgba(20,10,12,.35)" }}
              >
                <span className="text-4xl" aria-hidden>
                  🗓️
                </span>
                <p className="font-display text-lg font-bold">No plan yet</p>
                <p className="max-w-[380px] text-[13px] leading-relaxed" style={{ color: "#8d7f81" }}>
                  Paste your website or name a topic. You will get a month of shorts, each one different, each ready to
                  film.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3"
                  style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-lg font-bold">{batch.brand || "Your shorts"}</p>
                    <p className="text-[12.5px] text-white/45">
                      {batch.shorts.length} shorts
                      {batch.shorts.length < batch.requested && ` (you asked for ${batch.requested})`}
                      {batch.scanned && " · from your website"}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(asText(batch), "all")}
                    className="rounded-lg px-3 py-2 text-[12.5px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                  >
                    {copied === "all" ? "Copied ✓" : "Copy all"}
                  </button>
                </div>

                {batch.shorts.map((s, i) => {
                  const studio = STUDIO[s.bestFor] ?? STUDIO["talking head"];
                  const isOpen = open === i;
                  return (
                    <div
                      key={i}
                      dir={batch.rtl ? "rtl" : "ltr"}
                      className="overflow-hidden rounded-2xl"
                      style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[.03]"
                      >
                        <span
                          className="font-display mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold"
                          style={{ border: "1px solid rgba(255,70,85,.3)", color: "#ff5663" }}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-semibold leading-snug">{s.hook}</span>
                          <span className="mt-0.5 block text-[11.5px] uppercase tracking-wider text-white/35">
                            {s.bestFor}
                          </span>
                        </span>
                        <span className="mt-1 shrink-0 text-white/30">{isOpen ? "−" : "+"}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-white/10 px-4 py-4">
                          <p className="text-[14px] leading-relaxed" style={{ color: "#d8cbcd" }}>
                            {s.script}
                          </p>

                          {s.shots.length > 0 && (
                            <>
                              <p className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wider text-white/35">
                                On screen
                              </p>
                              <ul className="flex flex-col gap-1">
                                {s.shots.map((sh, j) => (
                                  <li key={j} className="text-[13px] leading-relaxed" style={{ color: "#b9acae" }}>
                                    • {sh}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          <p className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-wider text-white/35">
                            Caption
                          </p>
                          <p className="text-[13.5px] leading-relaxed" style={{ color: "#b9acae" }}>
                            {s.caption}
                          </p>
                          {s.hashtags.length > 0 && (
                            <p className="mt-1 text-[13px]" style={{ color: "#ff8892" }}>
                              {s.hashtags.map((h) => `#${h}`).join(" ")}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={studio.href}
                              className="rounded-lg px-3 py-2 text-[12.5px] font-bold text-white"
                              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                            >
                              Film this in {studio.label}
                            </Link>
                            <button
                              onClick={() => copy(s.script, `script-${i}`)}
                              className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white/60 transition-colors hover:text-white"
                              style={{ border: "1px solid rgba(255,255,255,.12)" }}
                            >
                              {copied === `script-${i}` ? "Copied ✓" : "Copy script"}
                            </button>
                            <button
                              onClick={() =>
                                copy(`${s.caption}\n${s.hashtags.map((h) => `#${h}`).join(" ")}`, `cap-${i}`)
                              }
                              className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white/60 transition-colors hover:text-white"
                              style={{ border: "1px solid rgba(255,255,255,.12)" }}
                            >
                              {copied === `cap-${i}` ? "Copied ✓" : "Copy caption"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
