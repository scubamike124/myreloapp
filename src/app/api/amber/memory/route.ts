import { requireUser, str } from "@/lib/workspace-api";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { requireAmberAutonomous, isSuperAdminSession } from "@/lib/amber-autonomous";
import { recall, remember, type MemoryKind } from "@/lib/amber-memory";

export const runtime = "nodejs";

async function targetUser(bodyUserId: string | undefined, sessionId: string) {
  if (!bodyUserId || bodyUserId === sessionId) return sessionId;
  if (await isSuperAdminSession()) return bodyUserId;
  return sessionId;
}

export async function GET(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = await targetUser(new URL(req.url).searchParams.get("userId") || undefined, auth.user.id);
  const memory = await recall(auth.q, userId, { limit: 40 });
  return Response.json({ ok: true, memory });
}

export async function POST(req: Request) {
  const gate = await requireAmberAutonomous();
  if (!gate.ok) return gate.response;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 16_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }
  const userId = await targetUser(str(body.userId, 80) || undefined, auth.user.id);
  const kind = (str(body.kind, 40) || "preference") as MemoryKind;
  const title = str(body.title, 200);
  if (!title) return Response.json({ ok: false, error: "title required" }, { status: 400 });
  const id = await remember(auth.q, userId, {
    kind,
    title,
    body: str(body.body, 4000),
    actorEmail: auth.user.email,
  });
  return Response.json({ ok: true, id, memory: await recall(auth.q, userId, { limit: 40 }) });
}
