"use client";

import { useState } from "react";
import type { BuilderRun } from "@/lib/amber/progress";
import type { ExecutionEvent } from "./types";
import { StatusBadge, StatusDot } from "./StatusDot";
import { Timeline } from "./Timeline";

function currentStepLabel(events: ExecutionEvent[], run: BuilderRun | null): string {
  const last = events[events.length - 1];
  if (last && last.status === "INFO") return last.title;
  if (!run || !run.status) return "Waiting for a task…";
  switch (run.status) {
    case "queued":
      return "Queued";
    case "running":
      return "Working in the repository…";
    case "testing":
      return "Running tests…";
    case "succeeded":
      return run.mergedAt ? "Merged and verified live" : run.prUrl ? "Ready for review" : "Completed";
    case "failed":
      return "Run failed";
    case "needs_owner":
      return "Needs a decision from you";
    case "needs_runtime":
      return "Missing a required key or runtime";
    default:
      return run.status;
  }
}

export function CenterPanel({
  run,
  events,
  onApprove,
  approving,
}: {
  run: BuilderRun | null;
  events: ExecutionEvent[];
  onApprove: () => void;
  approving: boolean;
}) {
  const [showFiles, setShowFiles] = useState(true);
  const planEvent = events.find((e) => e.kind === "PLAN");
  const needsApproval = run?.status === "succeeded" && Boolean(run.prUrl) && !run.mergedAt;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-3 sm:px-5">
        {run ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={(run.status as never) || "queued"} />
              {run.backend && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/40">{run.backend}</span>}
              {typeof run.attempt === "number" && run.attempt > 1 && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/40">attempt {run.attempt}</span>
              )}
            </div>
            <h1 className="mt-1.5 text-[15px] font-semibold leading-snug text-white sm:text-[16px]">
              {run.summary?.split("\n")[0]?.slice(0, 140) || run.taskId}
            </h1>
            <p className="mt-1 text-[13px] text-white/55">{currentStepLabel(events, run)}</p>
            {planEvent && <p className="mt-1 text-[11.5px] text-white/35">Plan: {planEvent.detail || planEvent.title}</p>}
          </>
        ) : (
          <div>
            <h1 className="text-[15px] font-semibold text-white">No task selected</h1>
            <p className="mt-1 text-[13px] text-white/45">Type below to start one, or pick one from Recent jobs.</p>
          </div>
        )}
      </div>

      {/* Files changed + PR/approve */}
      {run && (run.changedFiles?.length || run.prUrl) ? (
        <div className="border-b border-white/8 px-4 py-2.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            {run.changedFiles && run.changedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFiles((s) => !s)}
                className="text-[12.5px] font-medium text-white/60 hover:text-white/85"
              >
                {run.changedFiles.length} file{run.changedFiles.length === 1 ? "" : "s"} changed {showFiles ? "▾" : "▸"}
              </button>
            )}
            {run.prUrl && (
              <a href={run.prUrl} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-sky-300 hover:underline">
                View pull request ↗
              </a>
            )}
            {run.mergedAt && (
              <span className="flex items-center gap-1.5 text-[12.5px] text-emerald-300">
                <StatusDot status="OK" /> Merged &amp; deployed
              </span>
            )}
            {needsApproval && (
              <button
                type="button"
                onClick={onApprove}
                disabled={approving}
                className="ml-auto rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#22c55e,#15803d)" }}
              >
                {approving ? "Merging…" : "Approve & deploy"}
              </button>
            )}
          </div>
          {showFiles && run.changedFiles && run.changedFiles.length > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-[11.5px] text-white/45">
              {run.changedFiles.map((f) => (
                <li key={f} className="truncate">
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {run?.ownerReason && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-400/25 bg-amber-400/[.06] px-3 py-2 text-[12.5px] text-amber-200 sm:mx-5">
          {run.ownerReason}
        </div>
      )}

      {/* Live timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
        <Timeline events={events} emptyLabel={run ? "Starting…" : "Type below to see Amber work in real time."} />
      </div>
    </div>
  );
}
