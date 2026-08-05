import { currentUser } from "@/lib/accounts";
import { readJsonLimited } from "@/lib/api-guard";
import {
  CHILD_IMAGE_CONSENT_TEXT,
  CHILD_IMAGE_CONSENT_VERSION,
  CONSENT_KIND,
  CONSENT_PROMISES,
} from "@/lib/storybook/consent";
import {
  consentsFor,
  deleteAllStorybookData,
  deleteCharacter,
  listCharacters,
  listSeries,
  listStories,
} from "@/lib/storybook/store";

// ---------------------------------------------------------------------------
// Your child's data: see it, and delete it.
//
// A privacy policy that promises deletion without a way to delete is a promise
// nobody can keep. This is the way.
//
// GET    — what is held, in plain terms, including the consent on record.
// DELETE — remove one character, or everything.
//
// The photograph is not listed because it is never stored. What persists is the
// written description derived from it, which is the thing that actually
// describes a real child and therefore the thing a deletion request means.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to see your data." }, { status: 401 });

  const [characters, stories, series, consents] = await Promise.all([
    listCharacters(user.id),
    listStories(user.id),
    listSeries(user.id),
    consentsFor(user.id, CONSENT_KIND),
  ]);

  return Response.json(
    {
      ok: true,
      /*
       * Described rather than dumped. The point is for a parent to understand
       * what exists about their child, so each entry says what it is in words
       * before it says how many.
       */
      held: {
        characters: characters.map((c) => ({
          id: c.id,
          name: c.name,
          describedAs: [c.hair, c.face, c.clothing].filter(Boolean).join("; "),
          version: c.version,
          createdAt: c.createdAt,
        })),
        stories: stories.map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt })),
        series: series.map((s) => ({ id: s.id, title: s.title, episodes: s.episodes })),
      },
      photographs: {
        stored: false,
        explanation:
          "Photos are sent to our AI providers to draw the character and are not kept by Reelo. " +
          "What is kept is the written description above.",
      },
      consent: {
        onRecord: consents,
        currentWording: { version: CHILD_IMAGE_CONSENT_VERSION, text: CHILD_IMAGE_CONSENT_TEXT },
        promises: CONSENT_PROMISES,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to delete your data." }, { status: 401 });

  const body = ((await readJsonLimited(req, 4096).catch(() => null)) ?? {}) as Record<string, unknown>;
  const characterId = str(body.characterId, 60);
  const everything = body.everything === true;

  if (!characterId && !everything) {
    return Response.json(
      { error: 'Send { characterId } to remove one character, or { everything: true } to remove all of it.' },
      { status: 400 },
    );
  }

  if (everything) {
    const ok = await deleteAllStorybookData(user.id);
    return Response.json(
      ok
        ? {
            ok: true,
            deleted: "every character, story and series on this account",
            /*
             * The consent record deliberately survives.
             *
             * It is the evidence that permission was given for something that
             * has now been removed. Deleting it alongside the data would leave
             * no answer to "was this authorised?" — which is the question the
             * record exists to answer, and it holds no description of a child.
             */
            consentRecordKept: true,
          }
        : { error: "Could not delete that data." },
      { status: ok ? 200 : 500 },
    );
  }

  // Default to keeping the books a family paid for: once the description is
  // gone they hold no personal data, only the story and its pictures.
  const ok = await deleteCharacter(user.id, characterId, body.withStories === true);
  return Response.json(ok ? { ok: true } : { error: "That character is not in your library." }, {
    status: ok ? 200 : 404,
  });
}
