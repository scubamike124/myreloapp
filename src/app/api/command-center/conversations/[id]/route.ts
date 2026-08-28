import { getConversation, messagesFor, renameConversation, setPinned, deleteConversation } from "@/lib/ai/conversations";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) return Response.json({ error: "Not found." }, { status: 404 });
  const messages = await messagesFor(id);
  return Response.json({ conversation, messages });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { title?: string; pinned?: boolean };
  if (typeof body.title === "string") await renameConversation(id, body.title);
  if (typeof body.pinned === "boolean") await setPinned(id, body.pinned);
  const conversation = await getConversation(id);
  if (!conversation) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ conversation });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteConversation(id);
  return Response.json({ ok: true });
}
