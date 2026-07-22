"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { recordCreation } from "@/lib/workspace";
import { useTokens, TokenMeter, NotEnoughTokens, shortfallFrom, type Shortfall } from "./TokenMeter";

// ---------------------------------------------------------------------------
// AI Story Maker.
//
// Pick a star — an uploaded photo or any Reelo character, the banana included —
// and it heads an ongoing series. Each episode is long (six to ten scenes of
// real narration, every one illustrated) and each remembers the ones before it.
//
// This is the opposite of Bedtime Storybook, which the two tools' old copy did
// not distinguish at all: that one makes a single short book for a child in one
// go, this one keeps a series running for as long as you want episodes.
//
// The series lives in this component: episode recaps are collected here and
// handed back to the API for the next episode. That keeps the server free of
// session state, and means closing the tab ends the series rather than leaving
// a half-written one on disk.
// ---------------------------------------------------------------------------

type Scene = { text: string; image: string };
type Episode = {
  episodeNumber: number;
  title: string;
  synopsis: string;
  cliffhanger: string;
  recap: string;
  language: { code: string; name: string; endonym: string; rtl: boolean };
  scenes: Scene[];
  illustrated: number;
};

type Character = { avatarId: string; name: string; image: string; premium?: boolean };

const GENRES = ["Adventure", "Fantasy", "Comedy", "Anime", "Mystery", "Sci-Fi", "Family", "Children's"];

/** Examples, not a menu — deliberately silly ones, because the point of this
 *  tool is that the star does not have to be a person. */
const PREMISE_EXAMPLES = [
  "Barry escapes the fruit bowl to find the legendary Golden Orchard",
  "A dragon who is terrified of heights must learn to fly",
  "A retired warlord opens a bakery and cannot escape his past",
  "Two socks separated in the wash search the house for each other",
];

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read that photo."));
    r.readAsDataURL(file);
  });
}

export default function StoryMaker() {
  // --- the cast ------------------------------------------------------------
  const [mode, setMode] = useState<"character" | "photo">("character");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCast, setLoadingCast] = useState(true);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Character | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // --- the series ----------------------------------------------------------
  const [characterName, setCharacterName] = useState("");
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [scenes, setScenes] = useState(8);
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [short, setShort] = useState<Shortfall | null>(null);
  const tokens = useTokens();
  const latestRef = useRef<HTMLDivElement>(null);

  // The Reelo characters — the banana, the dragons, the warlords. Loaded from
  // the same catalog the Avatar Library uses, so the cast here is never a
  // hand-written subset that drifts out of date.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/avatars?source=reelo&limit=400");
        const data = await res.json();
        if (cancelled) return;
        const list = (Array.isArray(data.avatars) ? data.avatars : []) as Character[];
        setCharacters(list);
      } catch {
        /* the upload path still works without the catalog */
      } finally {
        if (!cancelled) setLoadingCast(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPhoto = (f?: File) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setPicked(null);
    setErr(null);
  };

  const pick = (c: Character) => {
    setPicked(c);
    setPhoto(null);
    setPreview("");
    setErr(null);
    // A name is a nicety, not a requirement — but pre-filling it from the
    // character saves the obvious typing.
    if (!characterName.trim()) setCharacterName(c.name);
  };

  const shown = q.trim()
    ? characters.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
    : characters;

  const hasStar = Boolean(picked || photo);

  const writeEpisode = useCallback(async () => {
    if (!hasStar) {
      setErr("Pick a character or upload a photo first.");
      return;
    }
    setBusy(true);
    setErr(null);
    setShort(null);
    try {
      const payload: Record<string, unknown> = {
        characterName: characterName.trim(),
        premise: premise.trim(),
        genre,
        scenes,
        languageCode,
        episodeNumber: episodes.length + 1,
        // The series memory: only recaps travel, which is all the next episode
        // needs to follow on.
        previously: episodes.map((e) => ({ number: e.episodeNumber, title: e.title, recap: e.recap })),
      };
      if (picked) payload.avatarId = picked.avatarId;
      if (photo) {
        payload.photo = await fileToBase64(photo);
        payload.mimeType = photo.type || "image/jpeg";
      }

      const res = await fetch("/api/story-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const gap = await shortfallFrom(res, data);
        if (gap) setShort(gap);
        else setErr(data.error || "Couldn't write the episode. Try again.");
        return;
      }
      tokens.setBalance(data.balance);
      setEpisodes((prev) => [...prev, data as Episode]);
      recordCreation({
        toolSlug: "ai-story-maker",
        toolTitle: "AI Story Maker",
        title: `${characterName.trim() || "Series"} — Ep. ${data.episodeNumber}: ${data.title}`,
        status: "completed",
        kind: "image",
        mediaUrl: data.scenes?.[0]?.image ?? "",
      });
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }, [hasStar, characterName, premise, genre, scenes, languageCode, episodes, picked, photo, tokens]);

  // Bring a finished episode into view rather than leaving it below the fold.
  useEffect(() => {
    if (episodes.length > 0) latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [episodes.length]);

  const inputStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" } as const;
  const started = episodes.length > 0;

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
          <TokenMeter slug="ai-story-maker" tokens={tokens} variant="chip" />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#ff5663" }}>
          Studio
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">AI Story Maker</h1>
        <p className="mt-2" style={{ color: "#a99a9c" }}>
          Pick a star — your own photo or any Reelo character — and give them a series. Every episode is long, fully
          illustrated, and remembers the ones before it.
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "#7d6f71" }}>
          Looking for a single picture book for tonight instead?{" "}
          <Link href="/create/bedtime-storybook" className="underline underline-offset-2 hover:text-white">
            Bedtime Storybook
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
              <p className="mb-2 text-[13px] font-semibold text-white/80">Who stars in it?</p>
              <div className="mb-3 flex gap-1.5">
                {(["character", "photo"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={started}
                    className="flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={
                      mode === m
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {m === "character" ? "Reelo character" : "Upload a photo"}
                  </button>
                ))}
              </div>

              {mode === "character" ? (
                <>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={loadingCast ? "Loading characters…" : `Search ${characters.length} characters — try "banana"`}
                    disabled={started}
                    className="mb-2 w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50"
                    style={inputStyle}
                  />
                  <div
                    className="grid max-h-[280px] grid-cols-4 gap-1.5 overflow-y-auto rounded-xl p-1.5"
                    style={{ border: "1px solid rgba(255,255,255,.07)" }}
                  >
                    {shown.map((c) => (
                      <button
                        key={c.avatarId}
                        onClick={() => pick(c)}
                        disabled={started}
                        title={c.name}
                        className="relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.04] disabled:cursor-not-allowed"
                        style={{
                          border:
                            picked?.avatarId === c.avatarId
                              ? "2px solid #ff3645"
                              : "1px solid rgba(255,255,255,.08)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[9px] text-white/80">
                          {c.name}
                        </span>
                      </button>
                    ))}
                    {!loadingCast && shown.length === 0 && (
                      <p className="col-span-4 px-2 py-6 text-center text-[12.5px] text-white/40">
                        No character matches “{q}”.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-white/[.03]"
                  style={inputStyle}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={started}
                    onChange={(e) => onPhoto(e.target.files?.[0])}
                  />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden>
                      📷
                    </span>
                  )}
                  <span className="text-[13px] text-white/60">
                    {photo ? photo.name : "A person, a pet, a toy — anything can star"}
                  </span>
                </label>
              )}
            </div>

            <div>
              <label htmlFor="sm-name" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                Their name
              </label>
              <input
                id="sm-name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Barry the Banana"
                disabled={started}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-60"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="sm-premise" className="mb-1 block text-[13px] font-semibold text-white/80">
                What is the series about? <span style={{ color: "#ff8892" }}>★</span>
              </label>
              <p className="mb-1.5 text-[11.5px] leading-relaxed text-white/40">
                The setup for the whole series. Each episode carries on from the last.
              </p>
              <textarea
                id="sm-premise"
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                rows={3}
                placeholder={PREMISE_EXAMPLES[0]}
                disabled={started}
                className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-60"
                style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)" }}
              />
              {!started && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PREMISE_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPremise(ex)}
                      className="rounded-md px-2 py-1 text-left text-[11px] text-white/45 transition-colors hover:text-white"
                      style={{ border: "1px solid rgba(255,255,255,.08)" }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-white/80">Genre</label>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    disabled={started}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={
                      genre === g
                        ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                        : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
                    }
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sm-lang" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                  Language
                </label>
                <select
                  id="sm-lang"
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  disabled={started}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none disabled:opacity-60"
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
                <label htmlFor="sm-scenes" className="mb-1.5 block text-[13px] font-semibold text-white/80">
                  Scenes per episode
                </label>
                <select
                  id="sm-scenes"
                  value={scenes}
                  onChange={(e) => setScenes(Number(e.target.value))}
                  disabled={started}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none disabled:opacity-60"
                  style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(20,10,12,.9)" }}
                >
                  {[6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} scenes
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={writeEpisode}
              disabled={busy || !hasStar}
              className="rounded-xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              {busy
                ? `Writing episode ${episodes.length + 1}…`
                : started
                  ? `Write episode ${episodes.length + 1}`
                  : "Start the series"}
            </button>

            <TokenMeter slug="ai-story-maker" tokens={tokens} />

            {short && <NotEnoughTokens {...short} />}

            {busy && (
              <p className="text-[12px] leading-relaxed text-white/45">
                Writing the episode, then illustrating every scene. This takes a minute or two.
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

            {started && (
              <button
                onClick={() => {
                  setEpisodes([]);
                  setErr(null);
                  setShort(null);
                }}
                className="rounded-xl py-2.5 text-[12.5px] font-semibold text-white/55 transition-colors hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,.12)" }}
              >
                Start a different series
              </button>
            )}
          </div>

          {/* ---------------- the series ---------------- */}
          <div className="lg:col-span-3">
            {!started ? (
              <div
                className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center"
                style={{ border: "1px dashed rgba(255,70,85,.2)", background: "rgba(20,10,12,.35)" }}
              >
                <span className="text-4xl" aria-hidden>
                  🎬
                </span>
                <p className="font-display text-lg font-bold">No episodes yet</p>
                <p className="max-w-[380px] text-[13px] leading-relaxed" style={{ color: "#8d7f81" }}>
                  Pick your star, say what the series is about, and write episode one. Each episode you add continues
                  the story from where the last one ended.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {episodes.map((ep, i) => (
                  <article
                    key={ep.episodeNumber}
                    ref={i === episodes.length - 1 ? latestRef : undefined}
                    dir={ep.language?.rtl ? "rtl" : "ltr"}
                    className="overflow-hidden rounded-2xl"
                    style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}
                  >
                    <header className="border-b border-white/10 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#ff5663" }}>
                        Episode {ep.episodeNumber}
                      </p>
                      <h2 className="font-display mt-0.5 text-xl font-bold">{ep.title}</h2>
                      {ep.synopsis && (
                        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "#a99a9c" }}>
                          {ep.synopsis}
                        </p>
                      )}
                      {ep.illustrated < ep.scenes.length && (
                        <p className="mt-2 text-[11.5px]" style={{ color: "#ffcf9a" }}>
                          {ep.scenes.length - ep.illustrated} of {ep.scenes.length} scenes could not be illustrated —
                          the writing is all there.
                        </p>
                      )}
                    </header>

                    <div className="flex flex-col gap-5 p-5">
                      {ep.scenes.map((s, si) => (
                        <div key={si} className="grid gap-3 sm:grid-cols-2">
                          {s.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.image}
                              alt=""
                              className="aspect-video w-full rounded-xl object-cover"
                              style={{ border: "1px solid rgba(255,255,255,.08)" }}
                            />
                          ) : (
                            <div
                              className="grid aspect-video w-full place-items-center rounded-xl text-2xl"
                              style={{ border: "1px dashed rgba(255,255,255,.12)" }}
                              aria-hidden
                            >
                              🎨
                            </div>
                          )}
                          <p className="self-center text-[14px] leading-relaxed" style={{ color: "#d8cbcd" }}>
                            {s.text}
                          </p>
                        </div>
                      ))}

                      {ep.cliffhanger && (
                        <p
                          className="rounded-xl px-4 py-3 text-[13.5px] font-semibold italic"
                          style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.06)", color: "#ffb3ba" }}
                        >
                          {ep.cliffhanger}
                        </p>
                      )}
                    </div>
                  </article>
                ))}

                <button
                  onClick={writeEpisode}
                  disabled={busy}
                  className="rounded-xl py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  {busy ? `Writing episode ${episodes.length + 1}…` : `Continue — write episode ${episodes.length + 1}`}
                </button>

                <button
                  onClick={() => window.print()}
                  className="rounded-xl py-2.5 text-[12.5px] font-semibold text-white/55 transition-colors hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,.12)" }}
                >
                  Save the series (print or PDF)
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11.5px] leading-relaxed text-white/35">
          Your photo is sent to the AI provider to draw the character and is not kept by Reelo. Episodes live in this
          page only — save or print them before you close it. See the{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
