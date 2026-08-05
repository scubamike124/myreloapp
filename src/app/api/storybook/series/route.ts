import { currentUser } from "@/lib/accounts";
import { readJsonLimited } from "@/lib/api-guard";
import { getCategory, suggestedTitle } from "@/lib/storybook/categories";
import {
  attachStoryToSeries,
  createSeries,
  episodeFor,
  getCharacter,
  getSeries,
  getStory,
  listSeries,
  recordEpisode,
  storiesInSeries,
} from "@/lib/storybook/store";

// ---------------------------------------------------------------------------
// Story series — "Continue Story", and everything behind it.
//
// The directive: "Instead of isolated stories, create an ongoing universe. Each
// adventure type should support unlimited sequels."
//
// A series is created *around an existing book*, not before one. Nobody decides
// a story is book one until they want a book two, so pressing Continue on a
// finished story is what starts the series — and that first book is adopted
// into it, rather than the series beginning at episode two with a gap where its
// own beginning should be.
//
// GET  → the shelves: every series with its books in reading order.
// POST → start a series from a story, and say what the next episode is called.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ ok: true, signedIn: false, series: [] });

  const series = await listSeries(user.id);
  const withBooks = await Promise.all(
    series.map(async (s) => {
      const books = await storiesInSeries(user.id, s.id);
      return {
        ...s,
        books,
        // What to call the next one, taken from the category the series was
        // started in. A suggestion the parent can ignore — it is offered so a
        // series feels planned rather than accumulated.
        nextEpisode: episodeFor(s),
        nextTitle: suggestedTitle(books[0]?.category ?? "", episodeFor(s)),
      };
    }),
  );

  return Response.json({ ok: true, signedIn: true, series: withBooks }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to start a series." }, { status: 401 });

  const body = ((await readJsonLimited(req, MAX_BODY).catch(() => null)) ?? {}) as Record<string, unknown>;
  const fromStoryId = str(body.fromStoryId, 60);
  const requestedTitle = str(body.title, 120);

  // Continuing an existing series: report where it is up to, so the client can
  // send the right episode number without having to work it out.
  const existingId = str(body.seriesId, 60);
  if (existingId) {
    const series = await getSeries(user.id, existingId);
    if (!series) return Response.json({ error: "That series is not in your library." }, { status: 404 });
    const books = await storiesInSeries(user.id, series.id);
    // The hero's name comes from the bible when there is one and from the first
    // book otherwise. Without it the maker screen starts with an empty name
    // field and episode two is about an unnamed child.
    const character = series.characterId ? await getCharacter(user.id, series.characterId) : null;
    return Response.json({
      ok: true,
      series,
      books,
      characterName: character?.name ?? "",
      nextEpisode: episodeFor(series),
      nextTitle: suggestedTitle(books[0]?.category ?? "", episodeFor(series)),
    });
  }

  if (!fromStoryId) {
    return Response.json({ error: "A series starts from a story you have already made." }, { status: 400 });
  }

  const story = await getStory(user.id, fromStoryId);
  if (!story) return Response.json({ error: "That story is not in your library." }, { status: 404 });
  if (story.seriesId) {
    return Response.json({ error: "That story is already part of a series." }, { status: 409 });
  }

  /*
   * What to call it.
   *
   * The category knows: "Princess Adventure" reads as a series in a way that
   * the first book's own title does not — "The Lost Crown" names one book, not
   * the shelf it sits on. The story's title is the fallback when no category
   * was chosen, and the parent's own title beats both.
   */
  const category = getCategory(story.category);
  const title = requestedTitle || (category ? `${category.name} Adventures` : story.title);

  const series = await createSeries(user.id, title, story.characterId);
  if (!series) return Response.json({ error: "Could not start that series." }, { status: 500 });

  /*
   * The book that started it becomes episode one of it.
   *
   * If that fails, the series exists with nothing in it and the next book would
   * be episode two of an empty shelf — so the failure is reported rather than
   * papered over with a success the caller cannot act on.
   */
  const attached = await attachStoryToSeries(user.id, story.id, series.id, 1);
  if (!attached) {
    return Response.json(
      { error: "The series was created but the first book could not be added to it." },
      { status: 500 },
    );
  }
  const seeded = await recordEpisode(
    series,
    { episode: 1, title: story.title, summary: story.pages[0]?.text ?? "" },
    {},
  );

  return Response.json({
    ok: true,
    series: seeded ?? series,
    nextEpisode: 2,
    nextTitle: suggestedTitle(story.category, 2),
  });
}
