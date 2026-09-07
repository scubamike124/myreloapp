"use client";

import { useState } from "react";
import type { BuilderRun } from "@/lib/amber/progress";
import type { ExecutionEvent } from "@/lib/amber/execution-types";
import { StatusBadge, StatusDot } from "./StatusDot";
import { LiveFeed } from "./LiveFeed";

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
  const [showFiles, setShowFiles] = useState(false);
  const needsApproval = run?.status === "succeeded" && Boolean(run.prUrl) && !run.mergedAt;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Compact header — status + title only. What Amber is doing right
          now lives in the live feed below, not duplicated up here. */}
      <div className="shrink-0 border-b border-black/8 px-4 py-2.5 sm:px-5">
        {run ? (
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={(run.status as never) || "queued"} />
            <h1 className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-black/90">
              {run.summary?.split("\n")[0]?.slice(0, 140) || run.taskId}
            </h1>
          </div>
        ) : (
          <h1 className="text-[13.5px] font-semibold text-black/60">No task selected</h1>
        )}
      </div>

      {/* Files changed + PR/approve — real, actionable info, kept slim. */}
      {run && (run.changedFiles?.length || run.prUrl) ? (
        <div className="shrink-0 border-b border-black/8 px-4 py-2 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            {run.changedFiles && run.changedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFiles((s) => !s)}
                className="text-[12px] font-medium text-black/55 hover:text-black/85"
              >
                {run.changedFiles.length} file{run.changedFiles.length === 1 ? "" : "s"} changed {showFiles ? "▾" : "▸"}
              </button>
            )}
            {run.prUrl && (
              <a href={run.prUrl} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-sky-700 hover:underline">
                Pull request ↗
              </a>
            )}
            {run.mergedAt && (
              <span className="flex items-center gap-1.5 text-[12px] text-emerald-700">
                <StatusDot status="OK" /> Merged &amp; deployed
              </span>
            )}
            {needsApproval && (
              <button
                type="button"
                onClick={onApprove}
                disabled={approving}
                className="ml-auto rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#22c55e,#15803d)" }}
              >
                {approving ? "Merging…" : "Approve & deploy"}
              </button>
            )}
          </div>
          {showFiles && run.changedFiles && run.changedFiles.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-black/45">
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
        <div className="mx-4 mt-2 shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800 sm:mx-5">
          {run.ownerReason}
        </div>
      )}

      {/* The live feed — this is the primary experience. It owns its own
          scrolling and auto-follow behavior; it must be a direct flex child
          here so its scroll-height math is correct. */}
      <div className="min-h-0 flex-1">
        <LiveFeed events={events} idleLabel={run ? "Starting…" : "Type below to watch Amber work in real time."} />
      </div>
    </div>
  );
}
