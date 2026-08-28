import { AMBER_SYSTEM_PROMPT, AMBER_ADMIN_OPERATOR_ADDENDUM } from "@/lib/amber/persona";
import { runAgentTurn, agentProviderConfigured, currentAgentModel, currentAgentProvider, type AgentMessage, type AgentEvent, type UserContentPart } from "@/lib/ai/agent-chain";
import { commandCenterToolDefs, executeCommandCenterTool } from "@/lib/ai/command-center-tools";
import { createConversation, getConversation, appendMessage, messagesFor, toAgentMessages, renameConversation } from "@/lib/ai/conversations";
import { recordUsage, estimateReasoningCostUsd } from "@/lib/ai/cost";
import { isAdminSession, unauthorized } from "@/lib/admin-session";

// ---------------------------------------------------------------------------
// Admin Command Center — streaming chat + tool calling.
//
// The comment this replaced claimed "everything under /admin is gated by
// src/proxy.ts before this route is ever reached" — false for this path.
// middleware.ts's matcher is /admin/:path* only; /api/command-center/chat
// doesn't start with /admin/ and was never touched by it. Confirmed live:
// an anonymous curl with no cookie got a real answer from Amber, including
// the ability to call every Command Center tool (start_dev_task,
// approve_dev_task — which merges PRs and deploys — publish_post, etc).
// The check below is the real, enforced gate that comment described.
//
// Streams newline-delimited JSON (AgentEvent) rather than plain text, unlike
// /api/amber — the client needs to render tool calls and their results as
// distinct UI, not just append characters to a bubble.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

type Attachment = { data: string; mimeType: string; name?: string };

function buildUserContent(message: string, attachments: Attachment[]): string | UserContentPart[] {
  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  if (images.length === 0) return message;
  const parts: UserContentPart[] = [{ type: "text", text: message }];
  for (const img of images.slice(0, 6)) {
    parts.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } });
  }
  return parts;
}

function titleFrom(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed || "New chat";
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) return unauthorized();
  if (!agentProviderConfigured()) {
    return Response.json({ error: "The Command Center needs ANTHROPIC_API_KEY (or OPENAI_API_KEY) set on the server." }, { status: 503 });
  }

  let body: { conversationId?: string; message?: string; attachments?: Attachment[] };
  try {
    body = (await req.json()) as { conversationId?: string; message?: string; attachments?: Attachment[] };
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.slice(0, 20_000) : "";
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 6) : [];
  if (!message.trim() && attachments.length === 0) {
    return Response.json({ error: "Say something first." }, { status: 400 });
  }

  let conversationId = body.conversationId;
  let isNew = false;
  if (conversationId) {
    const existing = await getConversation(conversationId);
    if (!existing) conversationId = undefined;
  }
  if (!conversationId) {
    const created = await createConversation(titleFrom(message));
    conversationId = created?.id;
    isNew = true;
  }

  const history = conversationId ? toAgentMessages(await messagesFor(conversationId)) : [];
  const userMessage: AgentMessage = { role: "user", content: buildUserContent(message, attachments) };

  if (conversationId) {
    await appendMessage(conversationId, { role: "user", content: message });
    if (!isNew) {
      // Keep the title fresh-ish on the very first real exchange of an
      // auto-titled conversation without renaming it on every later message.
    }
  }

  const cid = conversationId ?? null;
  const tools = commandCenterToolDefs();

  // Accumulate what actually happened so it can be persisted after the
  // stream finishes — see the Phase 1 plan's persistence design. A tool round
  // flushes as soon as every tool_call in it has a matching tool_result; a
  // trailing plain-text turn (no tool calls) flushes on "done".
  let pendingText = "";
  let pendingToolCalls: { id: string; name: string; arguments: string }[] = [];
  let pendingResults: string[] = [];
  const toPersist: AgentMessage[] = [];

  const flushRoundIfComplete = () => {
    if (pendingToolCalls.length > 0 && pendingResults.length === pendingToolCalls.length) {
      toPersist.push({ role: "assistant", content: pendingText, toolCalls: pendingToolCalls });
      for (let i = 0; i < pendingToolCalls.length; i++) {
        toPersist.push({
          role: "tool",
          toolCallId: pendingToolCalls[i].id,
          name: pendingToolCalls[i].name,
          content: pendingResults[i],
        });
      }
      pendingText = "";
      pendingToolCalls = [];
      pendingResults = [];
    }
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      // GPT-4.1 has no live clock — without this, "schedule for tomorrow 9am"
      // gets resolved against its training cutoff instead of today, which
      // schedule_post then rejects as a past time. Server runs in UTC.
      const now = new Date();
      const nowLine = `\n\n# Current time\nRight now it is ${now.toISOString()} (UTC), a ${now.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}. Resolve relative dates ("tomorrow", "next Friday") against this, in UTC, unless Michael states a different timezone.`;

      await runAgentTurn({
        systemPrompt: `${AMBER_SYSTEM_PROMPT}\n\n${AMBER_ADMIN_OPERATOR_ADDENDUM}${nowLine}`,
        messages: [...history, userMessage],
        tools,
        executeTool: (name, args) =>
          executeCommandCenterTool(
            name,
            args,
            cid,
            attachments.map((a) => ({ data: a.data, mimeType: a.mimeType, name: a.name })),
          ),
        onEvent: (event) => {
          send(event);
          if (event.type === "text") pendingText += event.delta;
          if (event.type === "tool_call") pendingToolCalls.push({ id: event.id, name: event.name, arguments: event.arguments });
          if (event.type === "tool_result") {
            pendingResults.push(JSON.stringify(event.result).slice(0, 20_000));
            flushRoundIfComplete();
          }
          if (event.type === "usage" && cid) {
            void recordUsage({
              conversationId: cid,
              kind: "reasoning",
              provider: currentAgentProvider(),
              estimatedCostUsd: estimateReasoningCostUsd(currentAgentModel(), event.tokensIn, event.tokensOut),
              tokensIn: event.tokensIn,
              tokensOut: event.tokensOut,
              ok: true,
            });
          }
        },
      });

      // Trailing plain-text turn — never flushed by a tool_result because it
      // has no tool calls.
      if (pendingText || pendingToolCalls.length) {
        toPersist.push({ role: "assistant", content: pendingText, toolCalls: pendingToolCalls.length ? pendingToolCalls : undefined });
      }

      if (cid) {
        for (const m of toPersist) await appendMessage(cid, m);
        if (isNew) await renameConversation(cid, titleFrom(message));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      // The client needs this up front for a brand-new chat, which has no id
      // until this request creates one — a header is available before any of
      // the stream body, unlike smuggling it into the first NDJSON line.
      "X-Conversation-Id": cid ?? "",
      "X-Conversation-New": isNew ? "1" : "0",
    },
  });
}
