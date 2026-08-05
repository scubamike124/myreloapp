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
type Artifact = { kind: string; status: string; url: string | null; detail?: Record<string, unknown> };
type SceneClip = { scene: number; url?: string; status?: string };

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

  /*
   * Collecting the film.
   *
   * Ordering a film starts twelve Veo renders and stores their operation
   * handles; turning those handles into video is what `GET /api/storybook/movie`
   * does, and nothing was calling it. So the renders were paid for, started,
   * and never collected — and Veo's handles expire, which would have made the
   * footage unrecoverable rather than merely late.
   *
   * Polling from here means opening the story is what advances it, which is the
   * page a parent opens to watch the film anyway. It stops as soon as the film
   * settles, either way.
   */
  const [scenes, setScenes] = useState<SceneClip[]>([]);
  const [filmStatus, setFilmStatus] = useState<string | null>(null);
  const [playing, setPlaying] = useState(0);

  useEffect(() => {
    const cut = artifacts.find((a) => a.kind === "final_cut");
    if (!cut) return;
    setFilmStatus(cut.status);
    if (cut.status === "ready" && Array.isArray(cut.detail?.scenes)) {
      setScenes(cut.detail.scenes as SceneClip[]);
      return;
    }
    if (cut.status !== "producing") return;

    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/storybook/movie?storyId=${encodeURIComponent(storyId)}`, { cache: "no-store" });
        const body = await res.json();
        if (stopped || !res.ok) return;
        if (Array.isArray(body.scenes)) setScenes(body.scenes as SceneClip[]);
        if (body.settled) {
          setFilmStatus(body.done ? "ready" : "failed");
          stopped = true;
          clearInterval(timer);
        }
      } catch {
        /* keep polling — a blip is not a verdict */
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 15_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [artifacts, storyId]);

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
  const ready = scenes.filter((s) => s.url);
  const status = filmStatus ?? film?.status;

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
        {film && status !== "ready" ? (
          // Said plainly rather than hidden: a parent who bought the bundle and
          // sees only the book assumes the film failed.
          <span className="rounded-xl px-4 py-2 text-sm text-white/55" style={{ border: "1px solid rgba(255,255,255,.12)" }}>
            {status === "failed"
              ? "The film could not be made — your tokens for it have been refunded"
              : scenes.length > 0
                ? `The film is rendering — ${ready.length} of ${scenes.length} scenes done`
                : "The film is still rendering"}
          </span>
        ) : null}
      </div>

      {/*
        The film, played as the scenes it is.

        Nothing stitches the clips into a single file, so there is no one URL to
        link to. Playing them in order and advancing on `ended` is what actually
        exists; a "Watch the film" link pointed at the first clip would play six
        seconds of scene one and stop, which is worse than being told the truth.
      */}
      {status === "ready" && ready.length > 0 ? (
        <div className="mt-6 rounded-2xl p-4" style={CARD}>
          <p className="mb-2 text-sm font-semibold text-white">🎬 The film</p>
          <video
            key={ready[playing]?.url}
            src={ready[playing]?.url}
            controls
            autoPlay={playing > 0}
            playsInline
            className="w-full rounded-xl"
            onEnded={() => setPlaying((i) => (i + 1 < ready.length ? i + 1 : i))}
          />
          <p className="mt-2 text-[12px] text-white/50">
            Scene {playing + 1} of {ready.length} — it plays straight through.
            {playing > 0 ? (
              <button type="button" onClick={() => setPlaying(0)} className="ml-2 underline hover:text-white">
                Start again
              </button>
            ) : null}
          </p>
        </div>
      ) : null}

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
