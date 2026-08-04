"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { STORY_CATEGORIES, getCategory, seasonalNow, type SeasonalStory } from "@/lib/storybook/categories";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

// ---------------------------------------------------------------------------
// Storybook — photo of the main character + YOUR story request.
// Theme is costume/role only; the custom topic is the plot.
// ---------------------------------------------------------------------------

type Page = { text: string; image: string; illustration?: string };
type Book = {
  title: string;
  dedication: string;
  language: { code: string; name: string; endonym: string; rtl: boolean };
  pages: Page[];
  illustrated: number;
  submitted?: Record<string, unknown>;
  debug?: { summary?: unknown; storyPrompt?: string; imagePromptStructure?: string };
};

const THEMES = ["Superhero", "Explorer", "Astronaut", "Pirate", "Knight", "Wizard", "Detective", "Animal friend"];

/** Optional suggestions only — never applied unless the user taps one. */
const PROMPT_EXAMPLES = [
  "An older gentleman looking for a kind companion",
  "Being brave on the first day at a new school",
  "A rainy-day adventure through the neighbourhood",
  "Learning to ride a bike without training wheels",
  "A detective solving a missing-hat mystery",
];

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
  const [characterName, setCharacterName] = useState("");
  const [idea, setIdea] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const [categoryId, setCategoryId] = useState("");
  const [seasonalId, setSeasonalId] = useState("");
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);
  const [pages, setPages] = useState(6);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const tokens = useTokens();
  const [book, setBook] = useState<Book | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [spread, setSpread] = useState(0);
  const bookRef = useRef<HTMLDivElement>(null);

  /*
   * Which occasions to offer.
   *
   * Resolved after mount rather than during render: `new Date()` runs once on
   * the server and again in the browser, and a request that straddles the turn
   * of a month would render two different lists and fail to hydrate. The row is
   * optional, so appearing a frame late costs nothing and guessing costs a
   * hydration error.
   */
  const [seasonalOptions, setSeasonalOptions] = useState<SeasonalStory[]>([]);
  useEffect(() => {
    setSeasonalOptions(seasonalNow(new Date()));
  }, []);
  const activeCategory = categoryId ? getCategory(categoryId) : null;

  const onPhoto = (f?: File) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setErr(null);
  };

  /**
   * Save the book as an actual PDF file.
   *
   * This button used to call `window.print()`. On a desktop that opens a print
   * dialog where PDF is one destination among several; on a phone it usually
   * only offers printers. It promised a file and produced a print job.
   *
   * The work happens off the main render path and can take a second or two on a
   * long book, so the button reports that it is working rather than appearing
   * to do nothing. A failure is shown with the print fallback beside it — the
   * reader should never be left with a dead button and no way to keep the book.
   */
  const savePdf = async () => {
    if (!book) return;
    setSavingPdf(true);
    setPdfError(null);
    try {
      const { downloadBookPdf } = await import("@/lib/book-pdf");
      await downloadBookPdf(book);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "The PDF could not be built.");
    } finally {
      setSavingPdf(false);
    }
  };

  const make = async () => {
    if (!photo) {
      setErr("Upload a photo of the main character first.");
      return;
    }
    if (!idea.trim()) {
      setErr("Say what the story should be about — your words become the plot.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    setBook(null);
    try {
      const base64 = await fileToBase64(photo);
      const payload = {
        photo: base64,
        mimeType: photo.type || "image/jpeg",
        characterName: characterName.trim(),
        childName: characterName.trim(), // legacy field name
        idea: idea.trim(),
        theme,
        categoryId,
        seasonalId,
        languageCode,
        pages,
        debug: process.env.NODE_ENV !== "production",
      };
      if (process.env.NODE_ENV !== "production") {
        console.info("[storybook] submitting", {
          characterName: payload.characterName,
          idea: payload.idea,
          theme: payload.theme,
          pages: payload.pages,
          languageCode: payload.languageCode,
          photoBytes: Math.floor(base64.length * 0.75),
        });
      }
      const res = await fetch("/api/storybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const gap = await shortfallFrom(res, data);
        if (gap) setShort(gap);
        else setErr(data.error || "Couldn't make the book. Try again.");
        return;
      }
      tokens.setBalance(data.balance);
      setBook(data);
      setSpread(0);
      recordCreation({
        toolSlug: "bedtime-storybook",
        toolTitle: "Storybook",
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
      <header className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
            Storybook
          </h1>
          <p className="mt-2 max-w-[620px] text-[15px] leading-[1.6] text-white/55">
            Upload a photo of the main character, write what the story should be about, and get an illustrated picture
            book starring them — in any supported language.
          </p>
        </div>
        <TokenMeter slug="bedtime-storybook" tokens={tokens} variant="chip" />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(255,60,75,.03)" }}>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Photo of the main character</label>
            <label
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[.04]"
              style={{ border: "1px dashed rgba(255,70,85,.35)" }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>
                  📷
                </span>
              )}
              <span className="text-[13px] text-white/60">
                {photo ? photo.name : "Upload a clear JPG/PNG under ~8MB"}
              </span>
            </label>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
              Large phone photos are auto-shrunk. If upload fails, choose a smaller picture.
            </p>
          </div>

          <div>
            <label htmlFor="sb-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">
              Character&apos;s name
            </label>
            <input
              id="sb-name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Alex"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
              style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" }}
            />
          </div>

          <div>
            <label htmlFor="sb-idea" className="mb-1 block text-[13px] font-semibold text-white/80">
              What should the story be about? <span style={{ color: "#ff8892" }}>★</span>
            </label>
            <p className="mb-1.5 text-[11.5px] leading-relaxed text-white/40">
              Your words are the plot. Suggestions below are optional — once you type your own request, that request
              wins.
            </p>
            <textarea
              id="sb-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="Type your story idea…"
              className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
              style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)" }}
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PROMPT_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIdea(ex)}
                  className="rounded-md px-2 py-1 text-left text-[11px] text-white/45 transition-colors hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,.08)" }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/*
            The adventure. Distinct from the costume picker below it, and
            labelled so: the category decides what kind of story gets written,
            the theme decides what the hero is wearing while it happens.

            "Any adventure" is first and is the default, because this tool's
            existing promise is that what the parent types becomes the plot.
            Pre-selecting a genre would quietly start steering every story.
          */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-white/80">
              Adventure <span className="font-normal text-white/40">(optional — shapes the kind of story)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                style={
                  categoryId === ""
                    ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                    : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                }
              >
                Any adventure
              </button>
              {STORY_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  title={c.blurb}
                  className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                  style={
                    categoryId === c.id
                      ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                      : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                  }
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            {activeCategory ? <p className="mt-1.5 text-[11px] text-white/45">{activeCategory.blurb}</p> : null}
          </div>

          {/*
            Occasions are only shown when they are actually near. A Christmas
            button in June is clutter; in December it is the reason a parent
            opened the page. Birthday has no season and is always here.
          */}
          {seasonalOptions.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Occasion <span className="font-normal text-white/40">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {seasonalOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeasonalId(seasonalId === s.id ? "" : s.id)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                    style={
                      seasonalId === s.id
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-white/80">
              They become a… <span className="font-normal text-white/40">(costume / role only)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
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
              <label htmlFor="sb-lang" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Language
              </label>
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
              <label htmlFor="sb-pages" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Pages
              </label>
              <select
                id="sb-pages"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
              >
                {[4, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} pages
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={make}
            disabled={busy}
            className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            {busy ? "Writing and illustrating…" : "Make the book"}
          </button>

          <TokenMeter slug="bedtime-storybook" tokens={tokens} />
          {short && <NotEnoughTokens {...short} />}

          {busy && (
            <p className="text-[12px] leading-relaxed text-white/45">
              Writing the story from your request, then illustrating every page with your photo as the character.
              A {pages}-page book takes a minute or two.
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

          <p className="text-[11.5px] leading-relaxed text-white/35">
            Photos are sent to the AI provider to draw your character and are not kept by Reelo. See the{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>

        <div>
          {!book && !busy && (
            <div
              className="grid h-full min-h-[380px] place-items-center rounded-2xl p-8 text-center"
              style={{ border: "1px dashed rgba(255,70,85,.22)" }}
            >
              <div>
                <span className="text-4xl" aria-hidden>
                  📖
                </span>
                <p className="mt-3 text-[14px] text-white/45">Your book will appear here.</p>
              </div>
            </div>
          )}

          {book && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="font-display flex-1 text-xl font-bold text-white">{book.title}</h2>
                <button
                  type="button"
                  onClick={savePdf}
                  disabled={savingPdf}
                  className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  {savingPdf ? "Building your PDF…" : "Save as PDF"}
                </button>
                {/* Print kept as its own button. It used to be what "Save as
                    PDF" secretly did; some people do want a printed book, and
                    it is also the fallback if the export fails. */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white/60 transition-colors hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,.14)" }}
                >
                  Print
                </button>
              </div>

              {pdfError && (
                <p
                  className="mb-3 rounded-xl px-3.5 py-2 text-[12px]"
                  style={{ border: "1px solid rgba(255,88,88,.3)", background: "rgba(255,88,88,.07)", color: "#ffb3b3" }}
                >
                  {pdfError} You can still use Print and choose “Save as PDF” as the destination.
                </p>
              )}

              {book.submitted && (
                <p className="mb-3 rounded-xl px-3.5 py-2 text-[11.5px] leading-relaxed text-white/50" style={{ border: "1px solid rgba(255,255,255,.08)" }}>
                  Plot used: “{String(book.submitted.idea)}” · Role: {String(book.submitted.theme)}
                  {book.submitted.characterName ? ` · ${String(book.submitted.characterName)}` : ""}
                </p>
              )}

              {book.illustrated < book.pages.length && (
                <p
                  className="mb-3 rounded-xl px-3.5 py-2 text-[12px]"
                  style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}
                >
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
                      className={i === spread ? "" : ""}
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
