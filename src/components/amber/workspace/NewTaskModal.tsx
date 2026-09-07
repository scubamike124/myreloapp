"use client";

import { useState } from "react";

/**
 * Explicit task submission — the primary way work starts in this workspace.
 * No intent-detection, no "did you mean to start a task" guessing: the
 * project is already chosen in the sidebar, and the description here goes
 * straight into the real prompt sent to the coding-agent loop.
 */
export function NewTaskModal({
  projectLabel,
  onSubmit,
  onClose,
}: {
  projectLabel: string;
  onSubmit: (description: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-black/10 p-5 shadow-2xl"
        style={{ background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[15px] font-semibold text-black/90">New task — {projectLabel}</div>
        <p className="mb-3 text-[12.5px] text-black/50">
          Describe the outcome. Amber inspects the repository herself to find what to change — you don&apos;t need to
          name files or line numbers.
        </p>
        <textarea
          autoFocus
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Find a real issue on the pricing page, fix it, test it, and open a PR."'
          className="w-full resize-none rounded-xl border border-black/12 bg-black/[.02] px-3 py-2.5 text-[13px] text-black/90 placeholder-black/35 outline-none focus:border-[rgba(196,16,28,.45)]"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[13px] font-medium text-black/50 hover:text-black/80">
            Cancel
          </button>
          <button
            type="button"
            disabled={text.trim().length < 8}
            onClick={() => {
              onSubmit(text.trim());
              setText("");
            }}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
          >
            Start task
          </button>
        </div>
      </div>
    </div>
  );
}
