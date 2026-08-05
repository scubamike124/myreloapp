"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadBookPdf } from "@/lib/book-pdf";
import { getLanguage, isRTL } from "@/lib/languages";

// ---------------------------------------------------------------------------
// A saved story, reopened.
//
// The point of persistence made visible: a book made in March can be read, and
// downloaded as a PDF, in December — without regenerating anything and without
// spending another token.
//
// The download reuses `downloadBookPdf`, the same function the maker screen
// uses. That button used to call window.print(), which promised a file and
// produced a print job; a second implementation here would be a second chance
// to make that mistake.
// ---------------------------------------------------------------------------

type Page = { text: string; image: string; illustration?: string };
type Story = {
  id: string;
  title: string;
  dedication: string;
  languageCode: string;
  episode: number;
  seriesId: string | null;
  pages: Page[];
};
type Artifact = { kind: string; status: string; url: string | null };

const CARD = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.72)" };

export default function StoryReader({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<Story | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [error, setError] = useState<string | null>(null);
  /*
   * Kept apart from `error`, which means "this story could not be opened" and
   * replaces the whole view. A PDF that fails to build must not take the story
   * off the screen — least of all the button that failed, which is the one the
   * reader wants to press again.
   */
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/storybook/story/${storyId}`, { cache: "no-store" });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(body.error || "Could not open that story.");
        else {
          setStory(body.story);
          setArtifacts(body.artifacts ?? []);
        }
      } catch {
        if (!cancelled) setError("Could not open that story.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const savePdf = async () => {
    if (!story) return;
    setSaving(true);
    setPdfError(null);
    try {
      // Rebuilt from the stored code rather than stored as an object: the PDF
      // needs the reading direction, and a book written in Arabic must still
      // lay out right-to-left when it is reopened months later.
      const language = getLanguage(story.languageCode);
      await downloadBookPdf({
        title: story.title,
        dedication: story.dedication,
        pages: story.pages,
        language: { ...language, rtl: isRTL(language.code) },
      });
    } catch {
      setPdfError("Could not build the PDF. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-sm text-[#ff8b95]">{error}</p>;
  if (!story) return <p className="text-sm text-white/50">Opening…</p>;

  const film = artifacts.find((a) => a.kind === "final_cut");

  return (
    <div>
      <Link href="/stories" className="text-[13px] text-white/50 hover:text-white">
        ← Story Library
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-white">{story.title}</h1>
      {story.dedication ? <p className="mt-1 text-sm italic text-white/55">{story.dedication}</p> : null}
      {story.seriesId ? <p className="mt-1 text-[13px] text-white/45">Episode {story.episode}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void savePdf()}
          disabled={saving}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          {saving ? "Building the PDF…" : "Download as PDF"}
        </button>
        {film?.status === "ready" && film.url ? (
          <a
            href={film.url}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ border: "1px solid rgba(255,70,85,.3)" }}
          >
            Watch the film
          </a>
        ) : film ? (
          // Said plainly rather than hidden: a parent who bought the bundle and
          // sees only the book assumes the film failed.
          <span className="rounded-xl px-4 py-2 text-sm text-white/55" style={{ border: "1px solid rgba(255,255,255,.12)" }}>
            {film.status === "failed" ? "The film could not be made — we will look into it" : "The film is still rendering"}
          </span>
        ) : null}
      </div>

      {pdfError ? <p className="mt-3 text-[13px] text-[#ff8b95]">{pdfError}</p> : null}

      <div className="mt-8 space-y-6">
        {story.pages.map((page, i) => (
          <div key={i} className="overflow-hidden rounded-2xl sm:flex" style={CARD}>
            {page.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- stored covers are same-origin or blob URLs
              <img src={page.image} alt="" className="h-56 w-full object-cover sm:h-auto sm:w-1/2" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center text-white/20 sm:w-1/2">
                Illustration unavailable
              </div>
            )}
            <div className="flex flex-1 items-center p-5">
              <p className="text-[15px] leading-relaxed text-white/85">{page.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
