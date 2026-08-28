// ---------------------------------------------------------------------------
// Command Center conversation persistence — history, search, rename, pin.
//
// Same shape as src/lib/engine/jobs.ts: a q() guard, typed rows, a hydrate
// step. No user_id — see the note in db.ts's schema block, this belongs to
// the single admin session, not a customer account.
// ---------------------------------------------------------------------------

import { randomUUID } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import type { AgentMessage, AgentToolCall } from "@/lib/ai/agent-chain";

async function q() {
  if (!dbConfigured()) return null;
  const query = await sqlAsync();
  if (!query || !(await ensureSchema())) return null;
  return query;
}

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls: AgentToolCall[] | null;
  createdAt: string;
};

type ConvRow = { id: string; title: string; pinned: number | boolean; created_at: string; updated_at: string };
type MsgRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tool_calls_json: string | null;
  created_at: string;
};

function hydrateConv(row: ConvRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    pinned: Boolean(Number(row.pinned)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hydrateMsg(row: MsgRow): StoredMessage {
  let toolCalls: AgentToolCall[] | null = null;
  if (row.tool_calls_json) {
    try {
      toolCalls = JSON.parse(row.tool_calls_json);
    } catch {
      toolCalls = null;
    }
  }
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as StoredMessage["role"],
    content: row.content,
    toolCalls,
    createdAt: row.created_at,
  };
}

export async function createConversation(title = "New chat"): Promise<Conversation | null> {
  const query = await q();
  if (!query) return null;
  const id = randomUUID();
  await query`INSERT INTO command_center_conversations (id, title) VALUES (${id}, ${title.slice(0, 200)})`;
  return getConversation(id);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const query = await q();
  if (!query) return null;
  const rows = (await query`SELECT * FROM command_center_conversations WHERE id = ${id}`) as unknown as ConvRow[];
  return rows[0] ? hydrateConv(rows[0]) : null;
}

/** search is a simple case-insensitive substring match on the title — enough
 *  at admin-single-user scale, no need for full-text search infrastructure. */
export async function listConversations(opts: { search?: string; limit?: number } = {}): Promise<Conversation[]> {
  const query = await q();
  if (!query) return [];
  const limit = opts.limit ?? 100;
  const like = opts.search ? `%${opts.search.toLowerCase()}%` : null;
  const rows = (
    like
      ? await query`
          SELECT * FROM command_center_conversations
          WHERE LOWER(title) LIKE ${like}
          ORDER BY pinned DESC, updated_at DESC LIMIT ${limit}`
      : await query`
          SELECT * FROM command_center_conversations
          ORDER BY pinned DESC, updated_at DESC LIMIT ${limit}`
  ) as unknown as ConvRow[];
  return rows.map(hydrateConv);
}

export async function renameConversation(id: string, title: string): Promise<void> {
  const query = await q();
  if (!query) return;
  await query`UPDATE command_center_conversations SET title = ${title.slice(0, 200)}, updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  const query = await q();
  if (!query) return;
  await query`UPDATE command_center_conversations SET pinned = ${pinned ? 1 : 0}, updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export async function deleteConversation(id: string): Promise<void> {
  const query = await q();
  if (!query) return;
  await query`DELETE FROM command_center_conversations WHERE id = ${id}`;
}

export async function touchConversation(id: string): Promise<void> {
  const query = await q();
  if (!query) return;
  await query`UPDATE command_center_conversations SET updated_at = ${new Date().toISOString()} WHERE id = ${id}`;
}

export async function appendMessage(
  conversationId: string,
  message: AgentMessage,
): Promise<void> {
  const query = await q();
  if (!query) return;
  const id = randomUUID();
  const toolCalls = message.role === "assistant" ? message.toolCalls ?? null : null;
  const toolCallId = message.role === "tool" ? message.toolCallId : undefined;
  const name = message.role === "tool" ? message.name : undefined;
  await query`
    INSERT INTO command_center_messages (id, conversation_id, role, content, tool_calls_json)
    VALUES (${id}, ${conversationId}, ${message.role}, ${message.content},
            ${toolCalls ? JSON.stringify(toolCalls) : (toolCallId ? JSON.stringify([{ toolCallId, name }]) : null)})`;
  await touchConversation(conversationId);
}

export async function messagesFor(conversationId: string): Promise<StoredMessage[]> {
  const query = await q();
  if (!query) return [];
  const rows = (await query`
    SELECT * FROM command_center_messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC`) as unknown as MsgRow[];
  return rows.map(hydrateMsg);
}

/** For handing the stored transcript back into runAgentTurn's messages[]. */
export function toAgentMessages(stored: StoredMessage[]): AgentMessage[] {
  return stored.map((m) => {
    if (m.role === "tool") {
      const meta = (m.toolCalls as unknown as { toolCallId: string; name: string }[] | null)?.[0];
      return { role: "tool", content: m.content, toolCallId: meta?.toolCallId ?? "", name: meta?.name ?? "" };
    }
    if (m.role === "assistant") {
      return { role: "assistant", content: m.content, toolCalls: m.toolCalls ?? undefined };
    }
    return { role: "user", content: m.content };
  });
}
