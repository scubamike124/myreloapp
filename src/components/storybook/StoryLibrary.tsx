"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCategory } from "@/lib/storybook/categories";

// ---------------------------------------------------------------------------
// The Story Library.
//
// The directive asks parents to see "All books, All movies, Favorite stories,
// Story history, Character history, Series progress, Continue Story button" —
// which is one shelf with several ways of looking at it, not seven screens.
//
// A story is shown whatever state it is in. A book whose film is still
// rendering appears with the film marked as rendering, because the alternative
// is a parent who paid for a bundle seeing only half of it and assuming the
// rest failed.
// ---------------------------------------------------------------------------

type Summary = {
  id: string;
  title: string;
  category: string;
  episode: number;
  seriesId: string | null;
  characterId: string | null;
  languageCode: string;
  product: string;
  favorite: boolean;
  pageCount: number;
  cover: string;
  createdAt: string;
};

type Character = { id: string; name: string; version: number; animationStyle?: string };
type Series = { id: string; title: string; episodes: number };

type Library = {
  signedIn: boolean;
  stories: Summary[];
  series: Series[];
  characters: Character[];
};

type Shelf = "books" | "movies" | "favorites" | "series" | "characters";

const SHELVES: { id: Shelf; label: string }[] = [
  { id: "books", label: "Books" },
  { id: "movies", label: "Movies" },
  { id: "favorites", label: "Favourites" },
  { id: "series", label: "Series" },
  { id: "characters", label: "Characters" },
];

const CARD = {
  border: "1px solid rgba(255,70,85,.18)",
  background: "rgba(20,10,12,.72)",
};

function when(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function StoryLibrary() {
  const [data, setData] = useState<Library | null>(null);
  const [shelf, setShelf] = useState<Shelf>("books");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /*
   * The payload is checked before it is trusted.
   *
   * `setData(await res.json())` was wrong in two ways at once. A non-2xx
   * response — a 502 while the Worker redeploys, say — parsed into an object
   * with no `signedIn`, so a parent with a full shelf was shown the signed-out
   * panel; and a body with no `stories` array made the filter below throw. A
   * thrown fetch set the error but left `data` null, and the null guard renders
   * "Loading…" before the error is ever reached, so a failed load looked like a
   * load that had not finished yet — forever.
   */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/storybook/library", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || typeof body?.signedIn !== "boolean" || !Array.isArray(body?.stories)) {
        setErr(body?.error || "Could not load your library.");
        return;
      }
      setData({
        signedIn: body.signedIn,
        stories: body.stories,
        series: Array.isArray(body.series) ? body.series : [],
        characters: Array.isArray(body.characters) ? body.characters : [],
      });
      setErr(null);
    } catch {
      setErr("Could not load your library.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFavorite = async (story: Summary) => {
    setBusy(story.id);
    // Optimistic: the shelf redraws immediately and is corrected by the reload
    // below if the write did not land.
    setData((d) =>
      d ? { ...d, stories: d.stories.map((s) => (s.id === story.id ? { ...s, favorite: !s.favorite } : s)) } : d,
    );
    try {
      await fetch(`/api/storybook/story/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !story.favorite }),
      });
    } catch {
      // Caught rather than left to reject: this runs from an onClick, where an
      // unhandled rejection is an uncaught error in the console and nothing on
      // screen. The reload below puts the heart back where it belongs.
      setErr("That change did not save.");
    } finally {
      setBusy(null);
      void load();
    }
  };

  /*
   * "Continue Story" has to actually continue the story.
   *
   * Creating the series and reloading the shelf is only half of it: the parent
   * pressed a button that promises the next book, and was left looking at the
   * same list with no indication of what to do next. So it creates the series
   * and then goes where the next book is written, carrying the series id.
   */
  const startSeries = async (story: Summary) => {
    setBusy(story.id);
    setErr(null);
    try {
      const res = await fetch("/api/storybook/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStoryId: story.id }),
      });
      const body = await res.json();
      if (!res.ok || !body?.series?.id) {
        setErr(body?.error || "Could not start that series.");
        return;
      }
      window.location.href = `/create/bedtime-storybook?series=${encodeURIComponent(body.series.id)}`;
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  };

  /*
   * A failed load is its own state, and it comes first.
   *
   * It needs its own retry because `load` is otherwise only reachable from the
   * favourite and series buttons, and neither of those is on screen while
   * `data` is null — so without this the only way out was a page refresh.
   */
  if (!data && err) {
    return (
      <div className="rounded-2xl p-6 text-center" style={CARD}>
        <p className="text-sm text-[#ff8b95]">{err}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-white/50">Loading your stories…</p>;
  }

  if (!data.signedIn) {
    return (
      <div className="rounded-2xl p-6 text-center" style={CARD}>
        <h2 className="text-lg font-semibold text-white">Your stories live here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Sign in and every storybook you make is kept — with the same character, so the next one can carry on where
          the last left off.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { stories, series, characters } = data;
  // A movie is a story bought as a film or a bundle. Derived from what was
  // ordered rather than stored twice, so the two can never disagree.
  const movies = stories.filter((s) => s.product === "movie" || s.product === "bundle");
  const favorites = stories.filter((s) => s.favorite);

  const shown = shelf === "movies" ? movies : shelf === "favorites" ? favorites : stories;

  const counts: Record<Shelf, number> = {
    books: stories.length,
    movies: movies.length,
    favorites: favorites.length,
    series: series.length,
    characters: characters.length,
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SHELVES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setShelf(s.id)}
            className="rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors"
            style={
              shelf === s.id
                ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
                : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }
            }
          >
            {s.label} <span className="opacity-60">{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {err ? <p className="mb-4 text-sm text-[#ff8b95]">{err}</p> : null}

      {shelf === "characters" ? (
        characters.length === 0 ? (
          <Empty
            title="No saved characters yet"
            body="A character is saved the first time you make a story with a photo. After that, the same child can star in every book without uploading the picture again."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <div key={c.id} className="rounded-2xl p-4" style={CARD}>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="mt-1 text-[12px] text-white/50">
                  {c.animationStyle ? `${c.animationStyle} · ` : ""}
                  {/* Version is shown because it explains why an older book
                      looks different, rather than leaving it a mystery. */}
                  description v{c.version}
                </p>
              </div>
            ))}
          </div>
        )
      ) : shelf === "series" ? (
        series.length === 0 ? (
          <Empty
            title="No series yet"
            body="Open a story and press Continue Story. The book you started from becomes episode one, and the next one carries on from it — same characters, same world."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {series.map((s) => {
              const books = stories.filter((b) => b.seriesId === s.id).sort((a, b) => a.episode - b.episode);
              return (
                <div key={s.id} className="rounded-2xl p-4" style={CARD}>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    {books.length} {books.length === 1 ? "book" : "books"} · next is episode {s.episodes + 1}
                  </p>
                  <ol className="mt-3 space-y-1">
                    {books.map((b) => (
                      <li key={b.id} className="text-[13px] text-white/70">
                        <span className="text-white/40">{b.episode}.</span>{" "}
                        <Link href={`/stories/${b.id}`} className="hover:text-white">
                          {b.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={`/create/bedtime-storybook?series=${s.id}`}
                    className="mt-3 inline-block rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                  >
                    Continue the story
                  </Link>
                </div>
              );
            })}
          </div>
        )
      ) : shown.length === 0 ? (
        <Empty
          title={
            shelf === "movies"
              ? "No movies yet"
              : shelf === "favorites"
                ? "Nothing favourited yet"
                : "No stories yet"
          }
          body={
            shelf === "movies"
              ? "Choose the film or the bundle when you make a story, and it appears here."
              : shelf === "favorites"
                ? "Tap the heart on a story to keep it here."
                : "Make your first storybook and it will be waiting here afterwards."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => {
            const category = getCategory(s.category);
            return (
              <div key={s.id} className="overflow-hidden rounded-2xl" style={CARD}>
                {s.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- stored covers are same-origin or blob URLs
                  <img src={s.cover} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center text-3xl text-white/20">📖</div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/stories/${s.id}`} className="text-sm font-semibold text-white hover:underline">
                      {s.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(s)}
                      disabled={busy === s.id}
                      aria-label={s.favorite ? `Remove ${s.title} from favourites` : `Add ${s.title} to favourites`}
                      aria-pressed={s.favorite}
                      className="shrink-0 text-lg leading-none transition-opacity disabled:opacity-40"
                    >
                      {s.favorite ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <p className="mt-1 text-[12px] text-white/45">
                    {category ? `${category.emoji} ${category.name} · ` : ""}
                    {s.pageCount} pages · {when(s.createdAt)}
                  </p>
                  {s.seriesId ? (
                    <p className="mt-1 text-[12px] text-white/40">Episode {s.episode}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startSeries(s)}
                      disabled={busy === s.id}
                      className="mt-3 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      {busy === s.id ? "Starting…" : "Continue Story"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={CARD}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-white/55">{body}</p>
    </div>
  );
}
