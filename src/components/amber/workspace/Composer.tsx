"use client";

import { useState } from "react";

/**
 * The always-visible place to type — never hidden behind a menu, a modal,
 * or a toggle. Confirmed live: a real user on a real phone could not find
 * anywhere to type at all, because starting a task lived behind a
 * hamburger-menu button and a modal. This bar is part of the workspace's
 * permanent layout on every screen size; submitting from here starts a
 * real task the same way the sidebar's "New task" button does.
 */
export function Composer({ onSubmit, busy, placeholder }: { onSubmit: (text: string) => void; busy: boolean; placeholder: string }) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="shrink-0 border-t border-black/10 px-3 py-2.5 sm:px-4"
      style={{ background: "#ffffff" }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-black/12 bg-black/[.02] px-3 py-2 focus-within:border-[rgba(196,16,28,.45)]">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label="Tell Amber what to do"
          className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-[13.5px] text-black/90 placeholder-black/35 outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label="Start task"
          className="shrink-0 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          {busy ? "Starting…" : "Send"}
        </button>
      </div>
    </form>
  );
}
