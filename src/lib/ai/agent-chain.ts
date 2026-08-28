// ---------------------------------------------------------------------------
// Command Center agent loop — streamed, tool-calling, multi-provider.
//
// Sibling to text-chain.ts, which is Reelo's AI service layer for one-shot
// structured JSON (Gemini -> Claude -> OpenAI fallback). This module is a
// different shape on purpose: a multi-turn conversation that can call tools
// and stream back to the browser, which one-shot JSON generation never needed.
//
// Claude (Anthropic) is the default provider — this is Michael's own admin
// chat, and he asked for it to actually behave like Claude rather than
// GPT-4.1, which has a genuinely different voice/style even given the exact
// same system prompt. Falls back to OpenAI only if ANTHROPIC_API_KEY isn't
// set, so an environment with just the older key keeps working rather than
// going dark. No mid-conversation provider switching: the choice is made once
// per process from what's configured, not per-turn, since a model swap
// mid-conversation would be a worse experience than a clear error.
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

export type AgentProvider = "anthropic" | "openai";

function activeProvider(): AgentProvider {
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai";
}

/** True once whichever provider is active has its key set. Named generically
 *  (not openAIConfigured) since the active provider can be either. */
export function agentProviderConfigured(): boolean {
  return activeProvider() === "anthropic" ? Boolean(process.env.ANTHROPIC_API_KEY) : Boolean(process.env.OPENAI_API_KEY);
}

/** The exact model string in use right now — for cost tracking (cost.ts) and
 *  anywhere else that needs to know without duplicating the provider switch. */
export function currentAgentModel(): string {
  return activeProvider() === "anthropic" ? CLAUDE_MODEL : OPENAI_MODEL;
}

/** The provider name in use right now, for usage-ledger labeling. */
export function currentAgentProvider(): AgentProvider {
  return activeProvider();
}

type TurnResult = { content: string; toolCalls: AgentToolCall[]; tokensIn: number; tokensOut: number };

// --- Anthropic (Claude) ------------------------------------------------------

const CLAUDE_MODEL = process.env.COMMAND_CENTER_MODEL || "claude-sonnet-5";
const ANTHROPIC_BASE = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };

/**
 * AgentMessage's "tool" role doesn't exist in Anthropic's schema — a tool
 * result is a content block inside a "user" message instead, and consecutive
 * tool-role messages (multiple tool calls answered in one round) must land in
 * ONE user message, not several, or the API rejects the turn order.
 */
function toAnthropicMessages(messages: AgentMessage[]): { role: "user" | "assistant"; content: string | AnthropicContentBlock[] }[] {
  const out: { role: "user" | "assistant"; content: string | AnthropicContentBlock[] }[] = [];
  for (const m of messages) {
    if (m.role === "system") continue; // system is a top-level param, not a message
    if (m.role === "tool") {
      const block: AnthropicContentBlock = { type: "tool_result", tool_use_id: m.toolCallId, content: m.content };
      const last = out[out.length - 1];
      if (last && last.role === "user" && Array.isArray(last.content)) {
        last.content.push(block);
      } else {
        out.push({ role: "user", content: [block] });
      }
      continue;
    }
    if (m.role === "assistant") {
      const blocks: AnthropicContentBlock[] = [];
      if (m.content) blocks.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls ?? []) {
        let input: unknown = {};
        try {
          input = tc.arguments ? JSON.parse(tc.arguments) : {};
        } catch {
          /* malformed — send an empty object rather than fail the whole turn */
        }
        blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input });
      }
      out.push({ role: "assistant", content: blocks.length ? blocks : "" });
      continue;
    }
    // user
    if (typeof m.content === "string") {
      out.push({ role: "user", content: m.content });
    } else {
      out.push({
        role: "user",
        content: m.content.map((p) =>
          p.type === "text"
            ? { type: "text" as const, text: p.text }
            : { type: "text" as const, text: `[image attached: ${p.image_url.url.slice(0, 40)}...]` },
        ),
      });
      // Note: vision content parts are described rather than sent as Anthropic
      // image blocks here — Command Center's own tool executors already
      // receive the real attachment bytes directly (see command-center-tools.ts),
      // so the model only ever needs to know an image was attached, not see it
      // itself, to decide which tool to call.
    }
  }
  return out;
}

async function streamOneClaudeTurn(
  apiKey: string,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AgentToolDef[],
  onEvent: (event: AgentEvent) => void,
): Promise<TurnResult> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: toAnthropicMessages(messages),
    tools: tools.length ? tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })) : undefined,
    stream: true,
  };

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok || !res.body) {
    let msg = `Claude request failed (${res.status}).`;
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
  let tokensIn = 0;
  let tokensOut = 0;
  const blocks = new Map<number, { type: "text" | "tool_use"; id?: string; name?: string; json: string }>();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let evt: Record<string, unknown>;
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }

      if (evt.type === "message_start") {
        const usage = (evt.message as { usage?: { input_tokens?: number } } | undefined)?.usage;
        if (usage?.input_tokens) tokensIn = usage.input_tokens;
      } else if (evt.type === "content_block_start") {
        const index = evt.index as number;
        const cb = evt.content_block as { type: string; id?: string; name?: string };
        blocks.set(index, { type: cb.type as "text" | "tool_use", id: cb.id, name: cb.name, json: "" });
      } else if (evt.type === "content_block_delta") {
        const index = evt.index as number;
        const delta = evt.delta as { type: string; text?: string; partial_json?: string };
        const block = blocks.get(index);
        if (!block) continue;
        if (delta.type === "text_delta" && delta.text) {
          content += delta.text;
          onEvent({ type: "text", delta: delta.text });
        } else if (delta.type === "input_json_delta" && delta.partial_json) {
          block.json += delta.partial_json;
        }
      } else if (evt.type === "message_delta") {
        const usage = evt.usage as { output_tokens?: number } | undefined;
        if (usage?.output_tokens) tokensOut = usage.output_tokens;
      }
    }
  }

  const toolCalls: AgentToolCall[] = [...blocks.values()]
    .filter((b) => b.type === "tool_use" && b.id && b.name)
    .map((b) => ({ id: b.id!, name: b.name!, arguments: b.json || "{}" }));

  return { content, toolCalls, tokensIn, tokensOut };
}

// --- OpenAI -------------------------------------------------------------------

const OPENAI_MODEL = process.env.COMMAND_CENTER_MODEL || "gpt-4.1";
const OPENAI_BASE = "https://api.openai.com/v1";

type OpenAIToolCallChunk = { index: number; id?: string; function?: { name?: string; arguments?: string } };

async function streamOneOpenAITurn(
  apiKey: string,
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AgentToolDef[],
  onEvent: (event: AgentEvent) => void,
): Promise<TurnResult> {
  const body = {
    model: OPENAI_MODEL,
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

// --- dispatch -----------------------------------------------------------------

async function streamOneTurn(
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AgentToolDef[],
  onEvent: (event: AgentEvent) => void,
): Promise<TurnResult> {
  if (activeProvider() === "anthropic") {
    return streamOneClaudeTurn(process.env.ANTHROPIC_API_KEY!, systemPrompt, messages, tools, onEvent);
  }
  return streamOneOpenAITurn(process.env.OPENAI_API_KEY!, systemPrompt, messages, tools, onEvent);
}

/**
 * Run the full agent loop: stream a turn, execute any tool calls the model
 * asked for, feed results back, repeat until the model produces a plain-text
 * turn with no tool calls (or maxToolRounds is hit).
 */
export async function runAgentTurn(opts: RunAgentOptions): Promise<void> {
  const { systemPrompt, tools, executeTool, onEvent, maxToolRounds = 8 } = opts;
  if (!agentProviderConfigured()) {
    onEvent({
      type: "error",
      message:
        activeProvider() === "anthropic"
          ? "The Command Center needs ANTHROPIC_API_KEY set on the server."
          : "The Command Center needs OPENAI_API_KEY set on the server.",
    });
    onEvent({ type: "done" });
    return;
  }

  const transcript: AgentMessage[] = [...opts.messages];

  try {
    for (let round = 0; round <= maxToolRounds; round++) {
      const turn = await streamOneTurn(systemPrompt, transcript, tools, onEvent);
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

