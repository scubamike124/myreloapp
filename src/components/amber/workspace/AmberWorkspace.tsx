"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BuilderRun } from "@/lib/amber/progress";
import type { ExecutionEvent, JobSummary, RunStatus } from "@/lib/amber/execution-types";
import { Sidebar } from "./Sidebar";
import { CenterPanel } from "./CenterPanel";
import { BottomPanels } from "./BottomPanels";
import { ChatDrawer } from "./ChatDrawer";
import { NewTaskModal } from "./NewTaskModal";
import { StatusDot } from "./StatusDot";
import { Composer } from "./Composer";

const PROJECT_LABELS: Record<string, string> = {
  reelo: "Reelo",
  forma: "Forma",
  amber_hq: "Amber HQ",
  launch_ready: "Launch Ready",
  rest_pilot: "Rest Pilot",
  dayli: "Dayli",
};

function runToJobSummary(run: BuilderRun): JobSummary {
  return {
    taskId: run.taskId || run.id || "",
    title: run.summary?.split("\n")[0]?.slice(0, 90) || run.taskId || "Task",
    status: (run.status as RunStatus) || "queued",
    backend: run.backend,
    projectName: run.projectName,
    changedFiles: run.changedFiles,
    prUrl: run.prUrl,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

/**
 * Amber Fixes — a real coding-agent workspace, not a chat box. Every value
 * rendered here comes from a real backend response (GET/POST /api/amber-
 * builder, backed by CodingAgentRun + CodingAgentEvent) — there is no local
 * timer standing in for progress, and nothing here fabricates a status.
 */
export function AmberWorkspace() {
  const [projectKey, setProjectKey] = useState("reelo");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<BuilderRun | null>(null);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const activeTaskIdRef = useRef(activeTaskId);
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/amber-builder", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const runs: BuilderRun[] = Array.isArray(data.runs) ? data.runs : [];
      setJobs(runs.map(runToJobSummary));
      if (!activeTaskIdRef.current && runs.length) {
        setActiveTaskId(runToJobSummary(runs[0]).taskId);
      }
      const current = runs.find((r) => (r.taskId || r.id) === activeTaskIdRef.current);
      if (current) setActiveRun(current);
    } catch {
      /* keep showing the last known state rather than clearing it on a blip */
    }
  }, []);

  const refreshEvents = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/amber-builder?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.events)) setEvents(data.events);
    } catch {
      /* keep the last known trail rather than clearing it on a blip */
    }
  }, []);

  // Job list: always polling, modest cadence — this drives the sidebar and
  // the header's run status even when no specific task is open.
  useEffect(() => {
    void refreshJobs();
    const id = setInterval(() => void refreshJobs(), 4000);
    return () => clearInterval(id);
  }, [refreshJobs]);

  // Event trail for the open task: faster cadence while it's actually live.
  useEffect(() => {
    if (!activeTaskId) return;
    void refreshEvents(activeTaskId);
    const live = activeRun?.status === "queued" || activeRun?.status === "running" || activeRun?.status === "testing";
    const id = setInterval(() => void refreshEvents(activeTaskId), live ? 2000 : 6000);
    return () => clearInterval(id);
  }, [activeTaskId, activeRun?.status, refreshEvents]);

  const handleSelectJob = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    setSidebarOpen(false);
  }, []);

  const handleNewTask = useCallback(
    async (description: string) => {
      setShowNewTask(false);
      setStarting(true);
      setError(null);
      try {
        const res = await fetch("/api/amber-builder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: description, projectKey, executeNow: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          setError(data.error || "Could not start that task.");
          return;
        }
        const taskId: string | undefined = data.task?.id;
        if (taskId) setActiveTaskId(taskId);
        await refreshJobs();
      } catch {
        setError("Connection lost while starting the task.");
      } finally {
        setStarting(false);
      }
    },
    [projectKey, refreshJobs],
  );

  const handleApprove = useCallback(async () => {
    if (!activeTaskId) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/amber-builder/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: activeTaskId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setError(data.error || "Could not merge that pull request.");
        return;
      }
      await refreshJobs();
      await refreshEvents(activeTaskId);
    } catch {
      setError("Connection lost while approving.");
    } finally {
      setApproving(false);
    }
  }, [activeTaskId, refreshJobs, refreshEvents]);

  return (
    <div className="fixed inset-0 flex flex-col text-white" style={{ background: "#0a0608" }}>
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/8 px-3">
        <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-white/50 hover:text-white lg:hidden" aria-label="Open jobs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/admin" className="hidden text-[13px] font-semibold text-white/40 hover:text-white/70 sm:block">
          ← Admin
        </Link>
        <div className="mx-auto flex items-center gap-2 text-[13px] font-semibold">
          <span aria-hidden>◆</span> Amber Fixes
          <span className="hidden text-white/30 sm:inline">· {PROJECT_LABELS[projectKey] || projectKey}</span>
        </div>
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          className={`rounded-lg p-1.5 ${chatOpen ? "text-white" : "text-white/50 hover:text-white"}`}
          aria-label="Toggle chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/[.08] px-4 py-2 text-[12.5px] text-red-300">
          <StatusDot status="ERROR" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto text-red-300/60 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — overlay on mobile/tablet, static column on desktop */}
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/8 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "rgba(12,7,9,.98)" }}
        >
          <Sidebar
            projectKey={projectKey}
            onProjectChange={(k) => {
              setProjectKey(k);
              setSidebarOpen(false);
            }}
            jobs={jobs}
            activeTaskId={activeTaskId}
            onSelectJob={handleSelectJob}
            onNewTask={() => {
              setShowNewTask(true);
              setSidebarOpen(false);
            }}
          />
        </div>

        {/* Center + bottom panels */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            {starting && !activeRun ? (
              <div className="flex h-full items-center justify-center text-[13px] text-white/40">Starting task…</div>
            ) : (
              <CenterPanel run={activeRun} events={activeTaskId ? events : []} onApprove={handleApprove} approving={approving} />
            )}
          </div>
          <Composer onSubmit={handleNewTask} busy={starting} placeholder={`Tell Amber what to do on ${PROJECT_LABELS[projectKey] || projectKey}…`} />
          <BottomPanels events={activeTaskId ? events : []} />
        </div>

        <ChatDrawer projectKey={projectKey} open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      {showNewTask && (
        <NewTaskModal projectLabel={PROJECT_LABELS[projectKey] || projectKey} onSubmit={handleNewTask} onClose={() => setShowNewTask(false)} />
      )}
    </div>
  );
}
