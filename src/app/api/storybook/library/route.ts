import { currentUser } from "@/lib/accounts";
import { listCharacters, listSeries, listStories } from "@/lib/storybook/store";

// ---------------------------------------------------------------------------
// The Story Library.
//
// Everything a parent has made, on one shelf: the books, the series they belong
// to, and the characters those series star. Three lists rather than one, because
// the shelf shows them as three things and joining them here would only mean
// splitting them again in the browser.
//
// Stories come back without their page text — `listStories` returns a cover and
// a page count. A shelf of fifty books does not need fifty manuscripts to draw
// itself, and the full story is one request away.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) {
    // Not an error: signed-out visitors can still make stories, they just have
    // nowhere to keep them. The UI says that rather than showing a failure.
    return Response.json(
      { ok: true, signedIn: false, stories: [], series: [], characters: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const [stories, series, characters] = await Promise.all([
    listStories(user.id),
    listSeries(user.id),
    listCharacters(user.id),
  ]);

  return Response.json(
    { ok: true, signedIn: true, stories, series, characters },
    { headers: { "Cache-Control": "no-store" } },
  );
}
