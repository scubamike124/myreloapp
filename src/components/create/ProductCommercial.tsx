"use client";

import { useState } from "react";
import Link from "next/link";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

// ---------------------------------------------------------------------------
// Product Commercial.
//
// Upload the thing you sell; get a short cinematic advert of it. The uploaded
// photo is what Veo animates, so the product on screen is the customer's own —
// which is the whole difference from Website Commercial, where a HeyGen
// presenter talks about a business instead.
// ---------------------------------------------------------------------------

const LOOKS = ["Studio", "Lifestyle", "Outdoor", "Neon", "Marble & Gold"];
const MUSIC = ["Upbeat", "Ambient", "Luxury", "Energetic"];

type Result = {
  headline: string;
  voiceover: string;
  caption: string;
  shot: string;
  videoUrl: string;
  scannedPage: boolean;
};

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read that image."));
    r.readAsDataURL(file);
  });
}

export default function ProductCommercial() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [productName, setProductName] = useState("");
  const [details, setDetails] = useState("");
  const [url, setUrl] = useState("");
  const [look, setLook] = useState(LOOKS[0]);
  const [music, setMusic] = useState(MUSIC[0]);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const tokens = useTokens();

  const onPhoto = (f?: File) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setErr(null);
  };

  const generate = async () => {
    if (!photo) {
      setErr("Upload a photo of your product first.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    setResult(null);
    setProgress(0);
    // Veo takes a minute or two, so the bar eases toward 95 rather than sitting
    // still — it never claims to be finished before the video arrives.
    const timer = setInterval(() => setProgress((p) => Math.min(95, p + 1)), 1200);
    try {
      const imageBase64 = await fileToBase64(photo);
      const res = await fetch("/api/product-commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: photo.type || "image/jpeg",
          productName: productName.trim(),
          details: details.trim(),
          url: url.trim(),
          look,
          music,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const gap = await shortfallFrom(res, data);
        if (gap) setShort(gap);
        else setErr(data.error || "Couldn't make the advert. Try again.");
        return;
      }
      tokens.setBalance(data.balance);
      setProgress(100);
      setResult(data as Result);
      recordCreation({
        toolSlug: "product-commercial",
        toolTitle: "Product Commercial",
        title: productName.trim() || data.headline || "Product advert",
        status: "completed",
        kind: "video",
        mediaUrl: data.videoUrl,
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
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
          <TokenMeter slug="product-commercial" tokens={tokens} variant="chip" />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>
          Studio
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">Product Commercial</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>
          Upload a photo of what you sell. We write the ad and animate your actual product — not a stock stand-in.
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "#7d6f71" }}>
          Want a presenter talking about your business instead?{" "}
          <Link href="/create/website-commercial" className="underline underline-offset-2 hover:text-white">
            Website Commercial
          </Link>{" "}
          does that.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          {/* ---------------- setup ---------------- */}
          <div
            className="flex flex-col gap-5 rounded-2xl p-5 lg:col-span-2"
            style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
          >
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-white/80">
                Your product <span style={{ color: "#ff8892" }}>★</span>
              </p>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/[.03]"
                style={inputStyle}
              >
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>
                    📦
                  </span>
                )}
                <span className="text-[13px] text-white/60">
                  {photo ? photo.name : "A clear shot on a plain background works best"}
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="pc-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Product name
              </label>
              <input
                id="pc-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Harbour Roast Coffee"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="pc-details" className="mb-1 block text-[13px] font-semibold text-white/80">
                What should people know about it?
              </label>
              <p className="mb-1.5 text-[11.5px] leading-relaxed text-white/40">
                We only say what you tell us here — no invented claims, prices or awards.
              </p>
              <textarea
                id="pc-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Single-origin, roasted weekly in small batches, ground to order."
                className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="pc-url" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Product page <span className="font-normal text-white/35">(optional)</span>
              </label>
              <input
                id="pc-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://store.com/product"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                style={inputStyle}
              />
              <p className="mt-1 text-[11.5px] text-white/35">
                If you paste one we read it for wording. The video always comes from your photo.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Look</label>
              <div className="flex flex-wrap gap-1.5">
                {LOOKS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLook(l)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={
                      look === l
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="pc-music" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Music mood
              </label>
              <select
                id="pc-music"
                value={music}
                onChange={(e) => setMusic(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
              >
                {MUSIC.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11.5px] text-white/35">
                Sets the mood of the edit. We do not add an audio track — drop your own on when you post.
              </p>
            </div>

            <button
              onClick={generate}
              disabled={busy || !photo}
              className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              {busy ? "Filming your product…" : result ? "Make another" : "Generate product video"}
            </button>

            <TokenMeter slug="product-commercial" tokens={tokens} />

            {short && <NotEnoughTokens {...short} />}

            {busy && (
              <div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff3645,#ff8a92)" }}
                  />
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                  Writing the ad, then rendering the shot. This takes a minute or two.
                </p>
              </div>
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

          {/* ---------------- result ---------------- */}
          <div className="lg:col-span-3">
            {!result ? (
              <div
                className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center"
                style={{ border: "1px dashed rgba(255,70,85,.2)", background: "rgba(20,10,12,.35)" }}
              >
                <span className="text-4xl" aria-hidden>
                  🎥
                </span>
                <p className="font-display text-lg font-bold">No advert yet</p>
                <p className="max-w-[380px] text-[13px] leading-relaxed" style={{ color: "#8d7f81" }}>
                  Upload your product and press generate. You will get a vertical clip ready for TikTok, Reels or
                  Shorts, plus the caption to post with it.
                </p>
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-2xl"
                style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
              >
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="aspect-[9/16] w-full rounded-xl bg-black object-cover"
                    style={{ border: "1px solid rgba(255,255,255,.08)" }}
                  />
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#ff5663" }}>
                        Headline
                      </p>
                      <p className="font-display mt-0.5 text-2xl font-bold">{result.headline}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#ff5663" }}>
                        Voiceover
                      </p>
                      <p className="mt-0.5 text-[14px] leading-relaxed" style={{ color: "#d8cbcd" }}>
                        {result.voiceover}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#ff5663" }}>
                        Caption
                      </p>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed" style={{ color: "#d8cbcd" }}>
                        {result.caption}
                      </p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(result.caption)}
                        className="mt-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-white/60 transition-colors hover:text-white"
                        style={{ border: "1px solid rgba(255,255,255,.12)" }}
                      >
                        Copy caption
                      </button>
                    </div>
                    <a
                      href={result.videoUrl}
                      download="product-commercial.mp4"
                      className="rounded-xl py-2.5 text-center text-[13px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      Download video
                    </a>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-3">
                  <p className="text-[11.5px] leading-relaxed text-white/35">
                    Shot direction used: {result.shot}
                    {result.scannedPage && " · Wording informed by your product page."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11.5px] leading-relaxed text-white/35">
          Your product photo is sent to the AI provider to render the clip and is not kept by Reelo. See the{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
