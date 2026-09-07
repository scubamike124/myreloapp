"use client";

import { useState } from "react";
import type { ExecutionEvent, EventKind } from "@/lib/amber/execution-types";
import { StatusDot } from "./StatusDot";
import { DiffView } from "./DiffView";

const KIND_ICON: Record<EventKind, string> = {
  PLAN: "◇",
  INSPECT_FILE: "⌕",
  EDIT_FILE: "✎",
  RUN_COMMAND: "❯",
  COMMAND_OUTPUT: "▤",
  TEST_RESULT: "✓",
  GIT_ACTION: "⎇",
  PR_OPENED: "⇧",
  APPROVAL: "☑",
  MERGE: "⇄",
  DEPLOY_STARTED: "▲",
  DEPLOY_VERIFIED: "◉",
  ERROR: "✕",
  RETRY: "↻",
  BLOCKED: "⛔",
  COMPLETED: "★",
};

const KIND_LABEL: Record<EventKind, string> = {
  PLAN: "Plan",
  INSPECT_FILE: "Inspecting",
  EDIT_FILE: "Editing",
  RUN_COMMAND: "Command",
  COMMAND_OUTPUT: "Output",
  TEST_RESULT: "Tests",
  GIT_ACTION: "Git",
  PR_OPENED: "Pull request",
  APPROVAL: "Approval",
  MERGE: "Merge",
  DEPLOY_STARTED: "Deploy",
  DEPLOY_VERIFIED: "Production",
  ERROR: "Error",
  RETRY: "Retry",
  BLOCKED: "Blocked",
  COMPLETED: "Done",
};

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function EventRow({ event, defaultOpen }: { event: ExecutionEvent; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const expandable = Boolean(event.diff || event.detail || event.command);

  return (
    <li className="relative pl-7">
      <span className="absolute left-[3px] top-[7px]">
        <StatusDot status={event.status} pulse={event.status === "INFO"} />
      </span>
      <div
        className={`rounded-xl border border-white/8 bg-white/[.02] px-3 py-2 transition-colors ${expandable ? "cursor-pointer hover:border-white/16 hover:bg-white/[.04]" : ""}`}
        onClick={expandable ? () => setOpen((o) => !o) : undefined}
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-px shrink-0 text-[13px] text-white/40" aria-hidden>
              {KIND_ICON[event.kind]}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/35">{KIND_LABEL[event.kind]}</span>
                <span className="truncate text-[13px] font-medium text-white/85">{event.title}</span>
              </div>
              {event.filePath && <div className="mt-0.5 truncate font-mono text-[11px] text-white/40">{event.filePath}</div>}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-white/30">{timeLabel(event.createdAt)}</span>
        </div>

        {expandable && open && (
          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            {event.command && (
              <pre className="overflow-x-auto rounded-lg bg-black/40 px-2.5 py-2 font-mono text-[11.5px] text-emerald-300/90">
                <span className="text-white/30">$ </span>
                {event.command}
              </pre>
            )}
            {event.diff && <DiffView diff={event.diff} />}
            {event.detail && !event.diff && (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 px-2.5 py-2 font-mono text-[11.5px] leading-relaxed text-white/70">
                {event.detail}
              </pre>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The live execution timeline — every row is one real CodingAgentEvent row,
 * in the order it actually happened. No timers, no synthetic "still
 * working..." filler between real rows; if nothing new has happened, the
 * timeline simply doesn't grow, and the last row's pulsing dot (when its
 * status is still INFO / in-progress) is the only "activity" indicator.
 */
export function Timeline({ events, emptyLabel }: { events: ExecutionEvent[]; emptyLabel?: string }) {
  if (events.length === 0) {
    return (
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-center">
        <p className="text-sm text-white/40">{emptyLabel || "No execution activity yet."}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-2 border-l border-white/10 pl-2">
      {events.map((event, i) => (
        <EventRow key={event.id} event={event} defaultOpen={i === events.length - 1 && event.status === "ERROR"} />
      ))}
    </ol>
  );
}
