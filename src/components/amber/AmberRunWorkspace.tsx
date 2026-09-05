"use client";

import { useEffect, useState } from "react";
import type { BuilderRun } from "@/lib/amber/progress";

/**
 * Live execution status for the run Amber Fixes is currently tracking.
 * Every field rendered here comes straight from the real BuilderRun the
 * panel is already polling — nothing here is simulated or invented. A field
 * with no real value (no test run yet, no PR, no error) is simply omitted,
 * never shown as a fake placeholder.
 */

type Tone = "red" | "yellow" | "green";

const STEP_LABEL: Record<string, string> = {
  queued: "Queued",
  running: "Working in the repository",
  testing: "Running tests",
  succeeded: "Tests passed",
  failed: "Failed",
  needs_owner: "Waiting on you",
  needs_runtime: "Waiting on a required runtime or credential",
  interrupted: "Interrupted",
};

function toneFor(run: BuilderRun): Tone {
  if (run.status === "failed") return "red";
  // Tests passing is real progress, but green is reserved for actually
  // DONE (merged) -- a run sitting at "succeeded" with an unmerged PR still
  // needs the owner, which reads as waiting (yellow), not finished (green).
  if (run.status === "succeeded" && run.prUrl && !run.mergedAt) return "yellow";
  if (run.status === "succeeded") return "green";
  return "yellow"; // queued, running, testing, interrupted, needs_owner, needs_runtime
}

type FinalBadge = "DONE" | "FAILED" | "NEEDS APPROVAL" | null;

function finalBadgeFor(run: BuilderRun): FinalBadge {
  if (run.mergedAt) return "DONE";
  if (run.status === "failed") return "FAILED";
  if (run.status === "needs_owner" || run.status === "needs_runtime") return "NEEDS APPROVAL";
  if (run.status === "succeeded" && run.prUrl && !run.mergedAt) return "NEEDS APPROVAL";
  return null; // still queued/running/testing/interrupted -- not a final state yet
}

function currentStepText(run: BuilderRun): string {
  if (run.mergedAt) return "Merged";
  if (run.status === "succeeded" && run.prUrl && !run.mergedAt) return "Pull request opened — waiting on your approval";
  return STEP_LABEL[run.status || ""] || "Working";
}

function formatElapsed(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AmberRunWorkspace({ run }: { run: BuilderRun | null }) {
  const isRunning = run?.status === "queued" || run?.status === "running" || run?.status === "testing";
  const [now, setNow] = useState(() => Date.now());

  // Keep the elapsed timer ticking while work is actually in progress --
  // this is the "still looks alive, not frozen" signal, driven by a real
  // clock against the run's real createdAt, not a fake progress animation.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  if (!run) return null;

  const tone = toneFor(run);
  const badge = finalBadgeFor(run);
  const step = currentStepText(run);
  const createdAtMs = run.createdAt ? Date.parse(run.createdAt) : NaN;
  const endMs = run.completedAt ? Date.parse(run.completedAt) : now;
  const elapsed = Number.isFinite(createdAtMs) ? formatElapsed(endMs - createdAtMs) : null;
  const retrying = (run.attempt ?? 1) > 1;

  const blockers = [run.ownerReason, run.prHandoffWarning, run.status === "failed" ? run.error : undefined].filter(
    (x): x is string => Boolean(x),
  );

  const hasTests = typeof run.testEvidence?.passed === "number" || typeof run.testEvidence?.failed === "number";
  const hasFiles = (run.changedFiles?.length ?? 0) > 0;
  const hasDetails = Boolean(run.summary || run.backend || run.id || run.taskId);

  return (
    <section
      className={`amber-workspace amber-workspace--${tone}`}
      role="status"
      aria-live="polite"
      aria-label="Amber's current work"
    >
      <header className="amber-workspace-head">
        <span className={`amber-workspace-dot amber-workspace-dot--${tone}`} aria-hidden />
        <div className="amber-workspace-title">
          <div className="amber-workspace-job">{run.projectName || "Task"}</div>
          <div className="amber-workspace-step">
            {step}
            {isRunning ? <span className="amber-workspace-live-dots" aria-hidden>…</span> : null}
          </div>
        </div>
        {elapsed && <div className="amber-workspace-elapsed">{elapsed}</div>}
      </header>

      {retrying && (
        <p className="amber-workspace-retry">
          {isRunning ? `Retrying — attempt ${run.attempt}.` : `Took ${run.attempt} attempts.`}
        </p>
      )}

      {blockers.length > 0 && (
        <div className="amber-workspace-blockers">
          {blockers.map((b, i) => (
            <p key={i} className="amber-workspace-blocker">
              {b}
            </p>
          ))}
        </div>
      )}

      {hasFiles && (
        <div className="amber-workspace-section">
          <div className="amber-workspace-section-label">Files changed ({run.changedFiles!.length})</div>
          <ul className="amber-workspace-files">
            {run.changedFiles!.slice(0, 12).map((f) => (
              <li key={f}>{f}</li>
            ))}
            {run.changedFiles!.length > 12 && <li>…and {run.changedFiles!.length - 12} more</li>}
          </ul>
        </div>
      )}

      {hasTests && (
        <div className="amber-workspace-section">
          <div className="amber-workspace-section-label">Tests</div>
          <p className="amber-workspace-tests-line">
            {typeof run.testEvidence?.passed === "number" && (
              <span className="amber-workspace-tests-pass">{run.testEvidence.passed} passed</span>
            )}
            {typeof run.testEvidence?.failed === "number" && run.testEvidence.failed > 0 && (
              <span className="amber-workspace-tests-fail"> · {run.testEvidence.failed} failed</span>
            )}
          </p>
          {(run.testEvidence?.failures?.length ?? 0) > 0 && (
            <ul className="amber-workspace-failures">
              {run.testEvidence!.failures!.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {run.prUrl && (
        <div className="amber-workspace-section">
          <div className="amber-workspace-section-label">Pull request</div>
          <a href={run.prUrl} target="_blank" rel="noreferrer" className="amber-workspace-pr-link">
            {run.mergedAt ? "View merged pull request" : "Review pull request"}
          </a>
        </div>
      )}

      {badge && <div className={`amber-workspace-final amber-workspace-final--${tone}`}>{badge}</div>}

      {hasDetails && (
        <details className="amber-workspace-details">
          <summary>Technical details</summary>
          <dl>
            {run.backend && (
              <>
                <dt>Worker</dt>
                <dd>{run.backend}</dd>
              </>
            )}
            {run.taskId && (
              <>
                <dt>Task</dt>
                <dd>{run.taskId}</dd>
              </>
            )}
            {run.mergedSha && (
              <>
                <dt>Merged commit</dt>
                <dd>{run.mergedSha.slice(0, 7)}</dd>
              </>
            )}
            {run.summary && (
              <>
                <dt>Summary</dt>
                <dd className="amber-workspace-summary">{run.summary}</dd>
              </>
            )}
          </dl>
        </details>
      )}
    </section>
  );
}
