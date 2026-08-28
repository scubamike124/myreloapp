"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDictation } from "@/lib/useDictation";
import type { AgentEvent } from "@/lib/ai/agent-chain";

// ---------------------------------------------------------------------------
// Full-screen admin Command Center. One workspace, three regions: a
// conversation sidebar (history/search/pin/rename), the transcript, and a
// composer with voice input and drag-and-drop attachments.
//
// Streams newline-delimited AgentEvent JSON from /api/command-center/chat and
// renders tool calls as their own chip rather than folding them into the text
// bubble — the whole point of this surface over the plain-text AmberDock is
// that a tool call is a real, visible action, not narrated prose.
// ---------------------------------------------------------------------------

type ConversationSummary = { id: string; title: string; pinned: boolean; updatedAt: string };
type UsageSummary = { todayUsd: number; monthUsd: number; limits: { dailyUsd: number; monthlyUsd: number } };

type ToolChip = { id: string; name: string; args: string; status: "running" | "ok" | "failed"; result?: unknown };

type Turn = { id: string; role: "user" | "assistant"; text: string; tools: ToolChip[]; attachments?: { name: string; dataUrl: string }[] };

type Attachment = { name: string; mimeType: string; data: string; dataUrl: string };

function readableToolName(name: string): string {
  return name.replace(/^run_/, "").replace(/_/g, " ");
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function ChatWorkspace() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [title, setTitle] = useState("New chat");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadSidebar = useCallback(async (q?: string) => {
    const res = await fetch(`/api/command-center/conversations${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json().catch(() => null);
    if (data?.conversations) setConversations(data.conversations);
    if (data?.usage) setUsage(data.usage);
  }, []);

  useEffect(() => {
    void loadSidebar();
  }, [loadSidebar]);

  useEffect(() => {
    const t = setTimeout(() => void loadSidebar(search || undefined), 250);
    return () => clearTimeout(t);
  }, [search, loadSidebar]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setBusy(false);
    setError(null);
    setConversationId(id);
    const res = await fetch(`/api/command-center/conversations/${id}`);
    const data = await res.json().catch(() => null);
    if (!data?.conversation) return;
    setTitle(data.conversation.title);
    const loaded: Turn[] = [];
    for (const m of data.messages as { id: string; role: string; content: string; toolCalls: { id: string; name: string; arguments: string }[] | null }[]) {
      if (m.role === "user") {
        loaded.push({ id: m.id, role: "user", text: m.content, tools: [] });
      } else if (m.role === "assistant") {
        loaded.push({
          id: m.id,
          role: "assistant",
          text: m.content,
          tools: (m.toolCalls ?? []).map((tc) => ({ id: tc.id, name: tc.name, args: tc.arguments, status: "ok" as const })),
        });
      }
      // tool-role rows are folded into the preceding assistant turn's chips at
      // send time; on reload we don't re-fetch their result payloads into the
      // chip (content is on the tool row itself, not worth a second pass for
      // a v1 history view) — the chip still shows what ran and that it ran.
    }
    setTurns(loaded);
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
    setError(null);
    setConversationId(null);
    setTitle("New chat");
    setTurns([]);
    setInput("");
    setAttachments([]);
    inputRef.current?.focus();
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue; // vision attachments only for v1
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const data = dataUrl.split(",")[1] ?? "";
        setAttachments((prev) => [...prev, { name: file.name, mimeType: file.type, data, dataUrl }].slice(-6));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const dictation = useDictation({
    getBaseText: () => input,
    onTranscript: (text) => {
      setInput(text);
      inputRef.current?.focus();
    },
    onError: setError,
  });

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && attachments.length === 0) || busy) return;

      const userTurn: Turn = {
        id: `local-${Date.now()}`,
        role: "user",
        text: trimmed,
        tools: [],
        attachments: attachments.length ? attachments.map((a) => ({ name: a.name, dataUrl: a.dataUrl })) : undefined,
      };
      const assistantTurn: Turn = { id: `local-${Date.now()}-a`, role: "assistant", text: "", tools: [] };
      setTurns((t) => [...t, userTurn, assistantTurn]);
      setInput("");
      setAttachments([]);
      setError(null);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/command-center/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            conversationId,
            message: trimmed,
            attachments: attachments.map((a) => ({ data: a.data, mimeType: a.mimeType, name: a.name })),
          }),
        });

        const newId = res.headers.get("X-Conversation-Id");
        const isNew = res.headers.get("X-Conversation-New") === "1";
        if (newId && newId !== conversationId) setConversationId(newId);

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "The Command Center couldn't reply just now.");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let event: AgentEvent;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }
            setTurns((all) => {
              const copy = [...all];
              const last = copy[copy.length - 1];
              if (last?.role !== "assistant") return all;
              const updated = { ...last, tools: [...last.tools] };
              if (event.type === "text") updated.text += event.delta;
              if (event.type === "tool_call") {
                updated.tools.push({ id: event.id, name: event.name, args: event.arguments, status: "running" });
              }
              if (event.type === "tool_result") {
                const idx = updated.tools.findIndex((c) => c.id === event.id);
                if (idx >= 0) updated.tools[idx] = { ...updated.tools[idx], status: event.ok ? "ok" : "failed", result: event.result };
              }
              if (event.type === "error") setError(event.message);
              copy[copy.length - 1] = updated;
              return copy;
            });
          }
        }

        if (isNew) void loadSidebar(search || undefined);
        else void loadSidebar(search || undefined);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Connection lost. Try again.");
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [attachments, busy, conversationId, loadSidebar, search],
  );

  const pinned = conversations.filter((c) => c.pinned);
  const rest = conversations.filter((c) => !c.pinned);

  return (
    <div className="fixed inset-0 z-40 flex text-white" style={{ background: "#0a0607" }}>
      {/* Sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur-md md:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3.5">
          <Link href="/admin" className="rounded-lg p-1.5 text-white/50 hover:text-white" aria-label="Back to Admin">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </Link>
          <span className="font-display text-sm font-bold">Command Center</span>
        </div>
        <div className="p-3">
          <button
            type="button"
            onClick={newChat}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            + New chat
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="mt-2.5 w-full rounded-xl border border-white/12 bg-white/[.04] px-3 py-2 text-[13px] text-white placeholder-white/30 outline-none focus:border-[rgba(255,70,85,.4)]"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {pinned.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-white/35">Pinned</div>
              {pinned.map((c) => (
                <ConversationRow key={c.id} c={c} active={c.id === conversationId} onOpen={openConversation} onChanged={() => loadSidebar(search || undefined)} renamingId={renamingId} setRenamingId={setRenamingId} />
              ))}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-white/35">History</div>
              {rest.map((c) => (
                <ConversationRow key={c.id} c={c} active={c.id === conversationId} onOpen={openConversation} onChanged={() => loadSidebar(search || undefined)} renamingId={renamingId} setRenamingId={setRenamingId} />
              ))}
            </>
          )}
          {conversations.length === 0 && <div className="px-2.5 py-4 text-[13px] text-white/35">No conversations yet.</div>}
        </div>
        {usage && <UsageBar usage={usage} />}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3.5 md:px-6">
          <Link href="/admin" className="rounded-lg p-1.5 text-white/50 hover:text-white md:hidden" aria-label="Back to Admin">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </Link>
          <div className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</div>
          {usage && (
            <div className="hidden text-[12px] text-white/45 sm:block">
              {fmtUsd(usage.todayUsd)} today · {fmtUsd(usage.monthUsd)} this month
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
        >
          {turns.length === 0 && (
            <div className="mx-auto max-w-xl pt-10 text-center">
              <p className="text-sm leading-relaxed text-white/60">
                Tell me what to make, check, or fix — I&apos;ll break it down and run the real tools.
              </p>
            </div>
          )}
          {turns.map((turn) => (
            <TurnBubble key={turn.id} turn={turn} pending={busy && turn.role === "assistant" && turn === turns[turns.length - 1]} />
          ))}
          {error && (
            <p className="mx-auto max-w-2xl rounded-xl px-3.5 py-2.5 text-[12px]" style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}>
              {error}
            </p>
          )}
          {dragOver && (
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center" style={{ background: "rgba(10,6,7,.85)" }}>
              <div className="rounded-2xl border-2 border-dashed border-[#ff3645] px-8 py-6 text-sm font-semibold">Drop to attach</div>
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-white/10 px-4 py-3.5 md:px-8"
        >
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/70 text-[10px] text-white"
                    aria-label={`Remove ${a.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className="flex items-end gap-2 rounded-2xl px-3.5 py-2.5"
            style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" }}
          >
            <label className="shrink-0 cursor-pointer rounded-xl p-2 text-white/45 transition-colors hover:text-white" aria-label="Attach a file">
              <input type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.4 11.1 12.4 20a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.9 1.9 0 0 1-2.7-2.7l8.3-8.3" /></svg>
            </label>
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={dictation.listening ? "Recording… click the mic again when you're done" : dictation.transcribing ? "Transcribing…" : "Ask the Command Center to do something…"}
              className="max-h-48 min-h-[24px] flex-1 resize-none bg-transparent text-[14px] text-white placeholder-white/30 outline-none"
            />
            <button
              type="button"
              onClick={dictation.micSupported ? dictation.toggleDictation : () => setError("Voice input needs a microphone and a secure page (https or localhost).")}
              disabled={dictation.transcribing}
              aria-pressed={dictation.listening}
              className={`shrink-0 rounded-xl p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${dictation.listening ? "text-white" : "text-white/45 hover:text-white"}`}
              style={dictation.listening ? { background: "rgba(255,60,75,.22)" } : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={dictation.listening ? "animate-pulse" : undefined}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>
            </button>
            <button
              type="submit"
              disabled={busy || (input.trim().length === 0 && attachments.length === 0)}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConversationRow({
  c,
  active,
  onOpen,
  onChanged,
  renamingId,
  setRenamingId,
}: {
  c: ConversationSummary;
  active: boolean;
  onOpen: (id: string) => void;
  onChanged: () => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
}) {
  const [draft, setDraft] = useState(c.title);
  const isRenaming = renamingId === c.id;

  const commitRename = async () => {
    setRenamingId(null);
    if (draft.trim() && draft !== c.title) {
      await fetch(`/api/command-center/conversations/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.trim() }),
      });
      onChanged();
    }
  };

  return (
    <div
      className="group flex items-center gap-1 rounded-lg px-2.5 py-2"
      style={active ? { background: "rgba(255,70,85,.12)" } : undefined}
    >
      {isRenaming ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setRenamingId(null);
          }}
          className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-[13px] text-white outline-none"
        />
      ) : (
        <button type="button" onClick={() => onOpen(c.id)} className="min-w-0 flex-1 truncate text-left text-[13px] text-white/80 hover:text-white">
          {c.title}
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          await fetch(`/api/command-center/conversations/${c.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pinned: !c.pinned }),
          });
          onChanged();
        }}
        className="hidden shrink-0 rounded p-1 text-white/35 hover:text-white group-hover:block"
        style={c.pinned ? { display: "block", color: "#ff8892" } : undefined}
        aria-label={c.pinned ? "Unpin" : "Pin"}
        title={c.pinned ? "Unpin" : "Pin"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3l5 5-5.5 1.5L12 17l-1-6-6-1 7.5-3.5L16 3z" /></svg>
      </button>
      <button
        type="button"
        onClick={() => setRenamingId(c.id)}
        className="hidden shrink-0 rounded p-1 text-white/35 hover:text-white group-hover:block"
        aria-label="Rename"
        title="Rename"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
      </button>
      <button
        type="button"
        onClick={async () => {
          await fetch(`/api/command-center/conversations/${c.id}`, { method: "DELETE" });
          onChanged();
        }}
        className="hidden shrink-0 rounded p-1 text-white/35 hover:text-[#ff6b76] group-hover:block"
        aria-label="Delete"
        title="Delete"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
      </button>
    </div>
  );
}

function UsageBar({ usage }: { usage: UsageSummary }) {
  const dayPct = Math.min(100, (usage.todayUsd / usage.limits.dailyUsd) * 100);
  return (
    <div className="border-t border-white/10 px-4 py-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-white/45">
        <span>Today</span>
        <span>
          {fmtUsd(usage.todayUsd)} / {fmtUsd(usage.limits.dailyUsd)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${dayPct}%`, background: dayPct > 90 ? "#ff3645" : "linear-gradient(90deg,#ff3645,#c4101c)" }} />
      </div>
      <div className="mt-1.5 text-[11px] text-white/35">{fmtUsd(usage.monthUsd)} this month of {fmtUsd(usage.limits.monthlyUsd)}</div>
    </div>
  );
}

function TurnBubble({ turn, pending }: { turn: Turn; pending: boolean }) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          {turn.attachments && turn.attachments.length > 0 && (
            <div className="mb-1.5 flex justify-end gap-1.5">
              {turn.attachments.map((a, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={a.dataUrl} alt={a.name} className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {turn.text && (
            <div className="whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
              {turn.text}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {turn.tools.map((chip) => (
          <ToolCallChip key={chip.id} chip={chip} />
        ))}
        {(turn.text || pending) && (
          <div className="whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed" style={{ background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.9)" }}>
            {turn.text || <Dots />}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallChip({ chip }: { chip: ToolChip }) {
  const color = chip.status === "running" ? "#ffb020" : chip.status === "ok" ? "#3ddc84" : "#ff5a63";
  const label = chip.status === "running" ? "Running" : chip.status === "ok" ? "Done" : "Failed";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-[12px]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="font-semibold text-white/85">{readableToolName(chip.name)}</span>
        <span className="text-white/40">— {label}</span>
      </div>
      {chip.status !== "running" && chip.result != null && (
        <div className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-white/45">
          {typeof chip.result === "object" ? JSON.stringify(chip.result).slice(0, 600) : String(chip.result)}
        </div>
      )}
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}
