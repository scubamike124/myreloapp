"use client";

import { useCallback, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Secondary conversation panel — for asking Amber questions or giving her
 * instructions in plain language, not for driving execution. Starting real
 * work happens through the explicit "New task" flow, which is unambiguous
 * about which repository and what outcome; a chat message here is never
 * silently turned into a coding task.
 */
export function ChatDrawer({ projectKey, open, onClose }: { projectKey: string; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setBusy(true);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/amber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: next,
            context: { path: "/amber-builder", page: "amber-fix", projectKey },
          }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setMessages((m) => [...m, { role: "assistant", content: data.error || "Amber couldn't reply just now." }]);
          return;
        }
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setMessages((m) => [...m, { role: "assistant", content: "Connection lost. Try again." }]);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, projectKey],
  );

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[380px] flex-col border-l border-white/10 transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      } lg:static lg:z-auto lg:h-full lg:max-w-none lg:translate-x-0 lg:border-l ${open ? "lg:flex" : "lg:hidden"}`}
      style={{ background: "rgba(12,7,9,.98)" }}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-3">
        <div>
          <div className="text-[13px] font-semibold text-white/85">Ask Amber</div>
          <div className="text-[11px] text-white/35">Discussion, not execution</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white lg:hidden" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        {messages.length === 0 && <p className="text-[12.5px] leading-relaxed text-white/40">Ask about the plan, the code, or what to try next.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className="max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[12.5px] leading-relaxed"
              style={m.role === "user" ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)" }}
            >
              {m.content || (busy && i === messages.length - 1 ? "…" : null)}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-white/8 p-2.5"
      >
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[.03] px-2.5 py-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask a question…"
            className="max-h-24 min-h-[22px] flex-1 resize-none bg-transparent text-[12.5px] text-white placeholder-white/30 outline-none"
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
