// ---------------------------------------------------------------------------
// Command Center agent loop — OpenAI, streamed, tool-calling.
//
// Sibling to text-chain.ts, which is Reelo's AI service layer for one-shot
// structured JSON (Gemini -> Claude -> OpenAI fallback). This module is a
// different shape on purpose: a multi-turn conversation that can call tools
// and stream back to the browser, which one-shot JSON generation never needed.
//
// One interface (runAgentTurn), one implementation (OpenAI) for now — exactly
// how text-chain.ts keeps callGemini/callClaude/callOpenAI behind one
// signature. Adding a Claude tool-use path later is a new function plus one
// line in the switch, not a rewrite. OpenAI is the only provider today because
// it's what was asked for; there is no fallback chain here the way there is in
// generateJson, because a silent model swap mid-conversation would be a worse
// experience than a clear "OpenAI isn't configured" error.
// ---------------------------------------------------------------------------

export type AgentRole = "system" | "user" | "assistant" | "tool";

export type AgentToolCall = {
  id: string;
  name: string;
  arguments: string; // raw JSON text, as the model produced it
};

/** A user turn's content — plain text, or text plus dropped images (vision). */
export type UserContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export type AgentMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | UserContentPart[] }
  | { role: "assistant"; content: string; toolCalls?: AgentToolCall[] }
  | { role: "tool"; content: string; toolCallId: string; name: string };

export type AgentToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
};

/** Structured events streamed to the client — richer than plain text, since a
 *  tool call and its result both need to render as something. */
export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; id: string; name: string; arguments: string }
  | { type: "tool_result"; id: string; name: string; ok: boolean; result: unknown }
  | { type: "usage"; tokensIn: number; tokensOut: number }
  | { type: "error"; message: string }
  | { type: "done" };

export type RunAgentOptions = {
  systemPrompt: string;
  messages: AgentMessage[];
  tools: AgentToolDef[];
  /** Executes one tool call and returns its result (already validated/typed by the caller). */
  executeTool: (name: string, args: unknown) => Promise<{ ok: boolean; result: unknown }>;
  /** Safety valve against a runaway tool-call loop. */
  maxToolRounds?: number;
  onEvent: (event: AgentEvent) => void;
};

export function openAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const MODEL = process.env.COMMAND_CENTER_MODEL || "gpt-4.1";
const OPENAI_BASE = "https://api.openai.com/v1";

type OpenAIToolCallChunk = { index: number; id?: string; function?: { name?: string; arguments?: string } };

/**
 * One turn of the OpenAI chat-completions stream: text deltas and/or tool
 * calls, assembled from SSE chunks. Returns what the assistant said/asked for
 * so the caller can decide whether to execute tools and loop again.
 */
async function streamOneTurn(
  apiKey: string,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AgentToolDef[],
  onEvent: (event: AgentEvent) => void,
): Promise<{ content: string; toolCalls: AgentToolCall[]; tokensIn: number; tokensOut: number }> {
  const body = {
    model: MODEL,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => {
        if (m.role === "assistant") {
          return {
            role: "assistant",
            content: m.content || null,
            tool_calls: m.toolCalls?.length
              ? m.toolCalls.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: { name: tc.name, arguments: tc.arguments },
                }))
              : undefined,
          };
        }
        if (m.role === "tool") {
          return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
        }
        return { role: m.role, content: m.content };
      }),
    ],
    tools: tools.length
      ? tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }))
      : undefined,
  };

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok || !res.body) {
    let msg = `OpenAI request failed (${res.status}).`;
    try {
      const data = await res.json();
      msg = data?.error?.message ?? msg;
    } catch {
      /* keep generic message */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  const callsByIndex = new Map<number, AgentToolCall>();
  let tokensIn = 0;
  let tokensOut = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let json: {
        choices?: Array<{ delta?: { content?: string; tool_calls?: OpenAIToolCallChunk[] } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      if (json.usage) {
        tokensIn = json.usage.prompt_tokens ?? tokensIn;
        tokensOut = json.usage.completion_tokens ?? tokensOut;
      }
      const delta = json.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        onEvent({ type: "text", delta: delta.content });
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = callsByIndex.get(tc.index) ?? { id: "", name: "", arguments: "" };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name += tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          callsByIndex.set(tc.index, existing);
        }
      }
    }
  }

  const toolCalls = [...callsByIndex.values()].filter((c) => c.id && c.name);
  return { content, toolCalls, tokensIn, tokensOut };
}

/**
 * Run the full agent loop: stream a turn, execute any tool calls the model
 * asked for, feed results back, repeat until the model produces a plain-text
 * turn with no tool calls (or maxToolRounds is hit).
 */
export async function runAgentTurn(opts: RunAgentOptions): Promise<void> {
  const { systemPrompt, tools, executeTool, onEvent, maxToolRounds = 8 } = opts;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    onEvent({ type: "error", message: "The Command Center needs OPENAI_API_KEY set on the server." });
    onEvent({ type: "done" });
    return;
  }

  const transcript: AgentMessage[] = [...opts.messages];

  try {
    for (let round = 0; round <= maxToolRounds; round++) {
      const turn = await streamOneTurn(apiKey, systemPrompt, transcript, tools, onEvent);
      onEvent({ type: "usage", tokensIn: turn.tokensIn, tokensOut: turn.tokensOut });

      if (turn.toolCalls.length === 0) {
        // Plain-text turn — the assistant is done for now.
        break;
      }

      transcript.push({ role: "assistant", content: turn.content, toolCalls: turn.toolCalls });

      if (round === maxToolRounds) {
        onEvent({ type: "error", message: "Stopped after too many tool calls in a row — ask me to continue if this wasn't finished." });
        break;
      }

      for (const call of turn.toolCalls) {
        let args: unknown = {};
        try {
          args = call.arguments ? JSON.parse(call.arguments) : {};
        } catch {
          /* malformed arguments — the tool executor gets an empty object and can fail cleanly */
        }
        onEvent({ type: "tool_call", id: call.id, name: call.name, arguments: call.arguments });
        let outcome: { ok: boolean; result: unknown };
        try {
          outcome = await executeTool(call.name, args);
        } catch (e) {
          outcome = { ok: false, result: { error: e instanceof Error ? e.message : String(e) } };
        }
        onEvent({ type: "tool_result", id: call.id, name: call.name, ok: outcome.ok, result: outcome.result });
        transcript.push({
          role: "tool",
          toolCallId: call.id,
          name: call.name,
          content: JSON.stringify(outcome.result).slice(0, 20_000),
        });
      }
    }
  } catch (e) {
    onEvent({ type: "error", message: e instanceof Error ? e.message : "The Command Center hit an error." });
  } finally {
    onEvent({ type: "done" });
  }
}
