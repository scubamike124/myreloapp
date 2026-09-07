"use client";

import { useState } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Secondary conversation panel — for asking Amber questions or giving her
 * instructions in plain language, not for driving execution. Starting real
 * work happens through the explicit "New task" flow, which is unambiguous
 * about which repository and what outcome; a chat message here is never
 * silently turned into a coding task.
 *
 * Controlled by AmberWorkspace: the send/stream logic lives there now
 * because the main Composer also needs to reach it — an ordinary question
 * typed into the always-visible Composer is routed here too (see
 * isAmberFixWorkIntent in AmberWorkspace), not into a dev task, so this
 * drawer and the Composer share one real conversation rather than each
 * silently keeping its own.
 */
export function ChatDrawer({
  messages,
  busy,
  onSend,
  open,
  onClose,
}: {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[380px] flex-col border-l border-black/10 transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      } lg:static lg:z-auto lg:h-full lg:max-w-none lg:translate-x-0 lg:border-l ${open ? "lg:flex" : "lg:hidden"}`}
      style={{ background: "#faf9f8" }}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-black/8 px-3.5 py-3">
        <div>
          <div className="text-[13px] font-semibold text-black/85">Ask Amber</div>
          <div className="text-[11px] text-black/40">Discussion, not execution</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-black/40 hover:text-black lg:hidden" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        {messages.length === 0 && <p className="text-[12.5px] leading-relaxed text-black/40">Ask about the plan, the code, or what to try next.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className="max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[12.5px] leading-relaxed"
              style={m.role === "user" ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { background: "#ffffff", color: "rgba(0,0,0,.82)", border: "1px solid rgba(0,0,0,.08)" }}
            >
              {m.content || (busy && i === messages.length - 1 ? "…" : null)}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-black/8 p-2.5"
      >
        <div className="flex items-end gap-2 rounded-xl border border-black/12 bg-white px-2.5 py-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask a question…"
            className="max-h-24 min-h-[22px] flex-1 resize-none bg-transparent text-[12.5px] text-black/85 placeholder-black/30 outline-none"
          />
          <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-lg p-1.5 text-white transition-opacity disabled:opacity-40" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </aside>
  );
}
