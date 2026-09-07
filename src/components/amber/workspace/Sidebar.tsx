"use client";

import type { JobSummary } from "./types";
import { StatusDot } from "./StatusDot";

const PROJECTS = [
  { key: "reelo", label: "Reelo" },
  { key: "forma", label: "Forma" },
  { key: "amber_hq", label: "Amber HQ" },
  { key: "launch_ready", label: "Launch Ready" },
  { key: "rest_pilot", label: "Rest Pilot" },
  { key: "dayli", label: "Dayli" },
];

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function Sidebar({
  projectKey,
  onProjectChange,
  jobs,
  activeTaskId,
  onSelectJob,
  onNewTask,
}: {
  projectKey: string;
  onProjectChange: (key: string) => void;
  jobs: JobSummary[];
  activeTaskId: string | null;
  onSelectJob: (taskId: string) => void;
  onNewTask: () => void;
}) {
  const withPr = jobs.filter((j) => j.prUrl);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/8 p-3">
        <button
          type="button"
          onClick={onNewTask}
          className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
        >
          + New task
        </button>
      </div>

      <div className="border-b border-white/8 p-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">Project</div>
        <div className="flex flex-wrap gap-1.5">
          {PROJECTS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onProjectChange(p.key)}
              className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                p.key === projectKey
                  ? "border-[rgba(255,70,85,.5)] bg-[rgba(255,60,75,.12)] text-white"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">Recent jobs</div>
        {jobs.length === 0 && <p className="px-1 text-[12px] text-white/35">No jobs yet.</p>}
        <ul className="space-y-1">
          {jobs.map((job) => (
            <li key={job.taskId}>
              <button
                type="button"
                onClick={() => onSelectJob(job.taskId)}
                className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                  job.taskId === activeTaskId ? "bg-white/[.07]" : "hover:bg-white/[.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={job.status} pulse={job.status === "running" || job.status === "testing"} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-white/85">{job.title}</span>
                </div>
                <div className="mt-0.5 pl-4 text-[11px] text-white/35">
                  {job.projectName || "—"} · {relativeTime(job.updatedAt || job.createdAt)}
                </div>
              </button>
            </li>
          ))}
        </ul>

        {withPr.length > 0 && (
          <>
            <div className="mb-1.5 mt-4 text-[10px] font-semibold uppercase tracking-wider text-white/35">Deployments</div>
            <ul className="space-y-1">
              {withPr.map((job) => (
                <li key={`pr-${job.taskId}`}>
                  <a
                    href={job.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-white/50 transition-colors hover:bg-white/[.04] hover:text-white/80"
                  >
                    <span aria-hidden>⎇</span>
                    <span className="min-w-0 flex-1 truncate">{job.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
