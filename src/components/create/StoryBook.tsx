"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { recordCreation } from "@/lib/workspace";

// ---------------------------------------------------------------------------
// Bedtime Storybook.
//
// Upload a photo of your child, say what the story should be about, and get an
// illustrated picture book with them as the hero — in any supported language.
//
// "Save" is a print view rather than a bundled PDF library: every browser can
// print to PDF, it costs no dependency, and it produces a file a parent can
// keep or send to a grandparent.
// ---------------------------------------------------------------------------

type Page = { text: string; image: string };
type Book = {
  title: string;
  dedication: string;
  language: { code: string; name: string; endonym: string; rtl: boolean };
  pages: Page[];
  illustrated: number;
};

const THEMES = ["Superhero", "Explorer", "Astronaut", "Pirate", "Knight", "Wizard", "Detective", "Animal friend"];

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read that photo."));
    r.readAsDataURL(file);
  });
}

export default function StoryBook() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [childName, setChildName] = useState("");
  const [idea, setIdea] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);
  const [pages, setPages] = useState(6);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [spread, setSpread] = useState(0);
  const bookRef = useRef<HTMLDivElement>(null);

  const onPhoto = (f?: File) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setErr(null);
  };

  const make = async () => {
    if (!photo) {
      setErr("Upload a photo of your child first.");
      return;
    }
    setBusy(true);
    setErr(null);
    setBook(null);
    try {
      const base64 = await fileToBase64(photo);
      const res = await fetch("/api/storybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: base64,
          mimeType: photo.type || "image/jpeg",
          childName,
          idea,
          theme,
          languageCode,
          pages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Couldn't make the book. Try again.");
        return;
      }
      setBook(data);
      setSpread(0);
      recordCreation({
        toolSlug: "bedtime-storybook",
        toolTitle: "Bedtime Storybook",
        title: data.title,
        status: "completed",
        kind: "image",
        mediaUrl: data.pages?.[0]?.image ?? "",
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const dir = book?.language.rtl ? "rtl" : "ltr";

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-16 sm:px-8">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
          Bedtime Storybook
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] leading-[1.6] text-white/55">
          Upload a photo of your child, say what the story should be about, and Amber writes and illustrates a picture
          book with them as the hero — ready to read tonight.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* ---- controls ---- */}
        <div className="flex flex-col gap-4 rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(255,60,75,.03)" }}>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Photo of your child</label>
            <label
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[.04]"
              style={{ border: "1px dashed rgba(255,70,85,.35)" }}
            >
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>📷</span>
              )}
              <span className="text-[13px] text-white/60">{photo ? photo.name : "Choose a clear, front-facing photo"}</span>
            </label>
          </div>

          <div>
            <label htmlFor="sb-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">Child&apos;s name</label>
            <input
              id="sb-name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Ava"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
              style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
            />
          </div>

          <div>
            <label htmlFor="sb-idea" className="mb-1.5 block text-[13px] font-semibold text-white/80">What should it be about?</label>
            <textarea
              id="sb-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="A story about a red ball that rolls away"
              className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
              style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-white/80">They become a…</label>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                  style={
                    theme === t
                      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sb-lang" className="mb-1.5 block text-[13px] font-semibold text-white/80">Language</label>
              <select
                id="sb-lang"
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
            <div>
              <label htmlFor="sb-pages" className="mb-1.5 block text-[13px] font-semibold text-white/80">Pages</label>
              <select
                id="sb-pages"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
              >
                {[4, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} pages</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={make}
            disabled={busy}
            className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            {busy ? "Writing and illustrating…" : "Make the book"}
          </button>

          {busy && (
            <p className="text-[12px] leading-relaxed text-white/45">
              Writing the story, then painting every page. A {pages}-page book takes a minute or two.
            </p>
          )}

          {err && (
            <p role="alert" className="rounded-xl px-3.5 py-2.5 text-[13px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
              {err}
            </p>
          )}

          <p className="text-[11.5px] leading-relaxed text-white/35">
            Photos are sent to the AI provider to draw your child as a character, and are not kept by Reelo. See the{" "}
            <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>.
          </p>
        </div>

        {/* ---- the book ---- */}
        <div>
          {!book && !busy && (
            <div className="grid h-full min-h-[380px] place-items-center rounded-2xl p-8 text-center" style={{ border: "1px dashed rgba(255,70,85,.22)" }}>
              <div>
                <span className="text-4xl" aria-hidden>📖</span>
                <p className="mt-3 text-[14px] text-white/45">Your book will appear here.</p>
              </div>
            </div>
          )}

          {book && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="font-display flex-1 text-xl font-bold text-white">{book.title}</h2>
                <button
                  onClick={() => window.print()}
                  className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  Save as PDF
                </button>
              </div>

              {book.illustrated < book.pages.length && (
                <p className="mb-3 rounded-xl px-3.5 py-2 text-[12px]" style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}>
                  {book.pages.length - book.illustrated} of {book.pages.length} pages couldn&apos;t be illustrated. The
                  story is complete — you can regenerate for the missing pictures.
                </p>
              )}

              <div ref={bookRef} id="storybook-print" dir={dir}>
                {book.dedication && (
                  <p className="mb-4 text-center text-[13px] italic text-white/50">{book.dedication}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {book.pages.map((p, i) => (
                    <article
                      key={i}
                      className={`overflow-hidden rounded-2xl ${i === spread ? "" : ""}`}
                      style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(14,7,9,.6)" }}
                    >
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="grid aspect-square w-full place-items-center bg-white/[.03] text-white/30">
                          no illustration
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Page {i + 1}</p>
                        <p className="mt-1.5 text-[14.5px] leading-[1.65] text-white/85">{p.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-[12px] text-white/35">
                Written in {book.language.name}
                {book.language.endonym !== book.language.name ? ` (${book.language.endonym})` : ""}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print view: just the book, on white, one page per sheet. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #storybook-print, #storybook-print * { visibility: visible !important; }
          #storybook-print { position: absolute; inset: 0; background: #fff; }
          #storybook-print article { break-inside: avoid; border: none !important; background: #fff !important; }
          #storybook-print p { color: #111 !important; }
        }
      `}</style>
    </div>
  );
}
