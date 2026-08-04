import { currentUser } from "@/lib/accounts";
import { deleteStory, getStory, listArtifacts } from "@/lib/storybook/store";

// ---------------------------------------------------------------------------
// One story, in full — the pages, and whatever has been produced from them.
//
// This is what "open" on the shelf calls, and what the e-book download reads
// so a book can be re-downloaded months later without regenerating anything.
//
// Every query is scoped by user id in the WHERE clause rather than fetched and
// then checked, so someone else's story id returns 404 rather than a row that
// has to be remembered to be discarded.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to open a saved story." }, { status: 401 });

  const { id } = await ctx.params;
  const story = await getStory(user.id, id);
  if (!story) return Response.json({ error: "That story is not in your library." }, { status: 404 });

  const artifacts = await listArtifacts(story.id);
  return Response.json({ ok: true, story, artifacts }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser().catch(() => null);
  if (!user) return Response.json({ error: "Sign in to manage your library." }, { status: 401 });

  const { id } = await ctx.params;
  // Read first: DELETE reports success whether or not a row matched, and
  // "deleted" about someone else's story is a lie worth avoiding.
  const story = await getStory(user.id, id);
  if (!story) return Response.json({ error: "That story is not in your library." }, { status: 404 });

  const ok = await deleteStory(user.id, id);
  return Response.json(ok ? { ok: true } : { error: "Could not delete that story." }, { status: ok ? 200 : 500 });
}
