"use client";

import { useEffect, useState } from "react";
import type { BuilderRun } from "@/lib/amber/progress";

/**
 * The centerpiece workspace: what Amber is actually doing to the real repo.
 * Every section here is gated on a real field from the run object -- a
 * section with nothing real to show is omitted, never replaced with a
 * placeholder that implies activity.
 *
 * The step list below is deliberately short: Queued / Working / Testing /
 * Needs approval / Merged is the complete set of states the backend
 * (CodingAgentRun) actually reports. There is no separate planning,
 * inspecting, editing, deploying or verifying step -- the backend doesn't
 * distinguish any of those from plain running, and a merge here isn't
 * currently wired to any deploy-verification record, so this console does
 * not claim either. Don't add steps here without a real field to gate them
 * on.
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

type Step = "queued" | "working" | "testing" | "review" | "merged";
const STEP_ORDER: Step[] = ["queued", "working", "testing", "review", "merged"];
const STEP_TITLE: Record<Step, string> = {
  queued: "Queued",
  working: "Working",
  testing: "Testing",
  review: "Needs approval",
  merged: "Merged",
};

function stepIndexFor(run: BuilderRun): number {
  if (run.mergedAt) return STEP_ORDER.indexOf("merged");
  if (run.status === "succeeded" && run.prUrl) return STEP_ORDER.indexOf("review");
  if (run.status === "testing") return STEP_ORDER.indexOf("testing");
  if (run.status === "running" || run.status === "needs_owner" || run.status === "needs_runtime" || run.status === "interrupted") {
    return STEP_ORDER.indexOf("working");
  }
  return STEP_ORDER.indexOf("queued");
}

function toneFor(run: BuilderRun): Tone {
  if (run.status === "failed") return "red";
  // Tests passing is real progress, but green is reserved for actually
  // DONE (merged) -- a run sitting at "succeeded" with an unmerged PR still
  // needs the owner, which reads as waiting (yellow), not finished (green).
  if (run.status === "succeeded" && run.prUrl && !run.mergedAt) return "yellow";
  if (run.status === "succeeded") return "green";
  return "yellow"; // queued, running, testing, interrupted, needs_owner, needs_runtime
}

type FinalBadge = "MERGED" | "FAILED" | "NEEDS APPROVAL" | null;

function finalBadgeFor(run: BuilderRun): FinalBadge {
  if (run.mergedAt) return "MERGED";
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

export default function AmberActivityConsole({ run, idleProjectLabel }: { run: BuilderRun | null; idleProjectLabel?: string }) {
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

  // Confirmed live: with no run at all, this returned null and the page
  // fell back to looking exactly like the plain chat screen it replaced --
  // "fixed" only while a job happened to be active. A workspace looks like
  // a workspace at rest too: this is a real, honest idle status (there
  // simply is no job), not a placeholder pretending activity exists.
  if (!run) {
    return (
      <section className="amber-console amber-console--idle" role="status" aria-label="Amber's workspace">
        <div className="amber-console-idle-title">{idleProjectLabel || "No project selected"}</div>
        <p className="amber-console-idle-hint">No job running. Tell Amber what to fix, build, or check below — real progress shows here the moment she starts.</p>
      </section>
    );
  }

  const tone = toneFor(run);
  const badge = finalBadgeFor(run);
  const step = currentStepText(run);
  const activeStepIndex = run.status === "failed" ? -1 : stepIndexFor(run);
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
    <section className={`amber-console amber-console--${tone}`} role="status" aria-live="polite" aria-label="Amber's current work">
      {run.status !== "failed" && (
        <ol className="amber-console-stepper" aria-label="Progress">
          {STEP_ORDER.map((s, i) => (
            <li
              key={s}
              className={`amber-console-step${i === activeStepIndex ? " is-active" : ""}${i < activeStepIndex ? " is-done" : ""}${s === "merged" && i === activeStepIndex ? " is-merged" : ""}`}
            >
              <span className="amber-console-step-dot" aria-hidden />
              <span className="amber-console-step-label">{STEP_TITLE[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <header className="amber-console-head">
        <div className="amber-console-title">
          <div className="amber-console-step-text">
            {step}
            {isRunning ? (
              <span className="amber-console-live-dots" aria-hidden>
                …
              </span>
            ) : null}
          </div>
        </div>
        {elapsed && <div className="amber-console-elapsed">{elapsed}</div>}
      </header>

      {retrying && (
        <p className="amber-console-retry">{isRunning ? `Retrying — attempt ${run.attempt}.` : `Took ${run.attempt} attempts.`}</p>
      )}

      {blockers.length > 0 && (
        <div className="amber-console-blockers">
          {blockers.map((b, i) => (
            <p key={i} className="amber-console-blocker">
              {b}
            </p>
          ))}
        </div>
      )}

      {hasFiles && (
        <div className="amber-console-section">
          <div className="amber-console-section-label">Files changed ({run.changedFiles!.length})</div>
          <ul className="amber-console-files">
            {run.changedFiles!.slice(0, 12).map((f) => (
              <li key={f}>{f}</li>
            ))}
            {run.changedFiles!.length > 12 && <li>…and {run.changedFiles!.length - 12} more</li>}
          </ul>
          {/* The backend only records file paths, not line-level diff content --
              the real diff lives on the PR itself, linked below, rather than a
              fabricated inline diff view. */}
          {run.prUrl && (
            <a href={run.prUrl} target="_blank" rel="noreferrer" className="amber-console-diff-link">
              View full diff on GitHub →
            </a>
          )}
        </div>
      )}

      {hasTests && (
        <div className="amber-console-section">
          <div className="amber-console-section-label">Tests</div>
          <p className="amber-console-tests-line">
            {typeof run.testEvidence?.passed === "number" && (
              <span className="amber-console-tests-pass">{run.testEvidence.passed} passed</span>
            )}
            {typeof run.testEvidence?.failed === "number" && run.testEvidence.failed > 0 && (
              <span className="amber-console-tests-fail"> · {run.testEvidence.failed} failed</span>
            )}
          </p>
          {(run.testEvidence?.failures?.length ?? 0) > 0 && (
            <ul className="amber-console-failures">
              {run.testEvidence!.failures!.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {run.prUrl && (
        <div className="amber-console-section">
          <div className="amber-console-section-label">Pull request</div>
          <a href={run.prUrl} target="_blank" rel="noreferrer" className="amber-console-pr-link">
            {run.mergedAt ? "View merged pull request" : "Review pull request"}
          </a>
        </div>
      )}

      {badge && <div className={`amber-console-final amber-console-final--${tone}`}>{badge}</div>}

      {hasDetails && (
        <details className="amber-console-details">
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
                <dd className="amber-console-summary">{run.summary}</dd>
              </>
            )}
          </dl>
        </details>
      )}
    </section>
  );
}
