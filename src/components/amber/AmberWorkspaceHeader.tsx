"use client";

import type { BuilderRun } from "@/lib/amber/progress";

/**
 * Developer-oriented status bar for the active project. Every value here is
 * read straight off the real BuilderRun (or is the static project label) --
 * there is no repo/branch/deploy claim made that the backend doesn't
 * actually report. In particular, this deliberately does NOT show a
 * "deployed"/"verified in production" indicator: that signal exists in a
 * different backend record this run type isn't wired to yet (see the
 * project's own notes), so claiming it here would be exactly the kind of
 * fabricated status this product must never show.
 */

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  testing: "Testing",
  succeeded: "Succeeded",
  failed: "Failed",
  needs_owner: "Needs you",
  needs_runtime: "Needs runtime",
  interrupted: "Interrupted",
};

function toneFor(run: BuilderRun | null): "idle" | "red" | "yellow" | "green" {
  if (!run || !run.status) return "idle";
  if (run.status === "failed") return "red";
  if (run.status === "succeeded" && run.mergedAt) return "green";
  return "yellow";
}

function statusLabelFor(run: BuilderRun): string {
  if (run.mergedAt) return "Merged";
  if (run.status === "succeeded" && run.prUrl && !run.mergedAt) return "Needs approval";
  return STATUS_LABEL[run.status || ""] || "Unknown";
}

export default function AmberWorkspaceHeader({
  projectLabel,
  run,
  onOpenSidebar,
}: {
  projectLabel: string;
  run: BuilderRun | null;
  onOpenSidebar: () => void;
}) {
  const tone = toneFor(run);
  const label = run ? statusLabelFor(run) : "Idle";

  return (
    <header className="amber-devbar">
      <button type="button" className="amber-devbar-menu" onClick={onOpenSidebar} aria-label="Show projects">
        <BarsMark />
      </button>
      <div className="amber-devbar-project">
        <span className="amber-devbar-project-name">{projectLabel}</span>
        {run?.taskId && <span className="amber-devbar-task">#{run.taskId.slice(-8)}</span>}
      </div>
      <span className={`amber-devbar-status amber-devbar-status--${tone}`}>
        <span className={`amber-devbar-status-dot amber-devbar-status-dot--${tone}`} aria-hidden />
        {label}
      </span>
      {run?.backend && <span className="amber-devbar-engine">{run.backend}</span>}
      {typeof run?.attempt === "number" && run.attempt > 1 && (
        <span className="amber-devbar-attempt">attempt {run.attempt}</span>
      )}
      {run?.prUrl && (
        <a href={run.prUrl} target="_blank" rel="noreferrer" className="amber-devbar-pr">
          {run.mergedAt ? "Merged PR" : "View PR"} {run.prNumber ? `#${run.prNumber}` : ""}
        </a>
      )}
    </header>
  );
}

function BarsMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
