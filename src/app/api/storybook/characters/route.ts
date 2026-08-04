import { currentUser } from "@/lib/accounts";
import { readJsonLimited } from "@/lib/api-guard";
import { applyBibleUpdate, isUsable, type CharacterBible } from "@/lib/storybook/character-bible";
import { getCharacter, listCharacters, saveCharacter, writeCharacter } from "@/lib/storybook/store";

// ---------------------------------------------------------------------------
// Character Bibles — the permanent record of a child as a character.
//
// A bible is what lets book four look like book one, and what lets a sequel be
// ordered without uploading the photo again. It is stored as words rather than
// as the photograph: the storybook page promises parents their photo "is not
// kept by Reelo", and a description honours that promise while still keeping
// the character the same.
//
// PATCH merges rather than replaces. Parents edit one thing — a haircut, a new
// favourite jumper — and a replace would blank the rest of the description,
// silently changing how the child is drawn everywhere.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 64 * 1024;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

function strings(v: unknown, max: number): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, 120)).slice(0, max) : [];
}

const AGE_BANDS = ["3-5", "6-8", "9-12"] as const;

function ageBand(v: unknown): CharacterBible["ageBand"] {
  const s = str(v, 8);
  return (AGE_BANDS as readonly string[]).includes(s) ? (s as CharacterBible["ageBand"]) : undefined;
}

export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ ok: true, signedIn: false, characters: [] });
  return Response.json(
    { ok: true, signedIn: true, characters: await listCharacters(user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to save a character." }, { status: 401 });

  const body = ((await readJsonLimited(req, MAX_BODY).catch(() => null)) ?? {}) as Record<string, unknown>;

  const draft = {
    name: str(body.name, 40),
    ageBand: ageBand(body.ageBand),
    face: str(body.face, 400),
    hair: str(body.hair, 200),
    clothing: str(body.clothing, 200),
    bodyProportions: str(body.bodyProportions, 200) || undefined,
    animationStyle: str(body.animationStyle, 120) || undefined,
    expressions: strings(body.expressions, 8),
    personality: strings(body.personality, 8),
    voice: {
      voiceId: str((body.voice as Record<string, unknown>)?.voiceId, 80) || undefined,
      tone: str((body.voice as Record<string, unknown>)?.tone, 120) || undefined,
    },
  };

  // Refused here rather than at illustration time: an unusable bible produces a
  // character who looks different in every book, which is the exact failure the
  // bible exists to prevent — and it would not be noticed until the book arrived.
  if (!isUsable(draft)) {
    return Response.json(
      { error: "A character needs a name and a description of their face, hair and clothes." },
      { status: 400 },
    );
  }

  const saved = await saveCharacter(user.id, draft);
  if (!saved) return Response.json({ error: "Could not save that character." }, { status: 500 });
  return Response.json({ ok: true, character: saved });
}

export async function PATCH(req: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to update a character." }, { status: 401 });

  const body = ((await readJsonLimited(req, MAX_BODY).catch(() => null)) ?? {}) as Record<string, unknown>;
  const id = str(body.id, 60);
  const current = id ? await getCharacter(user.id, id) : null;
  if (!current) return Response.json({ error: "That character is not in your library." }, { status: 404 });

  // Only fields actually present are passed through — `applyBibleUpdate` treats
  // an absent field as "unchanged", which is what makes a partial edit safe.
  const update: Partial<CharacterBible> = {};
  if (typeof body.name === "string") update.name = str(body.name, 40);
  if (typeof body.face === "string") update.face = str(body.face, 400);
  if (typeof body.hair === "string") update.hair = str(body.hair, 200);
  if (typeof body.clothing === "string") update.clothing = str(body.clothing, 200);
  if (typeof body.bodyProportions === "string") update.bodyProportions = str(body.bodyProportions, 200);
  if (typeof body.animationStyle === "string") update.animationStyle = str(body.animationStyle, 120);
  if (body.ageBand !== undefined) update.ageBand = ageBand(body.ageBand);
  if (Array.isArray(body.expressions)) update.expressions = strings(body.expressions, 8);
  if (Array.isArray(body.personality)) update.personality = strings(body.personality, 8);

  const next = applyBibleUpdate(current, update, new Date());
  const ok = await writeCharacter(next);
  if (!ok) return Response.json({ error: "Could not update that character." }, { status: 500 });

  return Response.json({
    ok: true,
    character: next,
    // A version bump means existing artwork was drawn from an older
    // description. Reported so the UI can explain why book five looks
    // different rather than leaving it a mystery.
    appearanceChanged: next.version !== current.version,
  });
}
