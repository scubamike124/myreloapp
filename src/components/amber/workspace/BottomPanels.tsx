"use client";

import { useState } from "react";
import type { ExecutionEvent } from "@/lib/amber/execution-types";
import { StatusDot } from "./StatusDot";
import { DiffView } from "./DiffView";

type TabId = "terminal" | "tests" | "git" | "deploy" | "logs";

const TABS: { id: TabId; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "tests", label: "Tests" },
  { id: "git", label: "Git & Deploy" },
  { id: "logs", label: "All events" },
];

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

function TerminalTab({ events }: { events: ExecutionEvent[] }) {
  const lines = events.filter((e) => e.kind === "RUN_COMMAND" || e.kind === "COMMAND_OUTPUT" || e.kind === "TEST_RESULT");
  if (!lines.length) return <Empty text="No commands have run yet." />;
  return (
    <div className="space-y-0.5 font-mono text-[12px] leading-relaxed">
      {lines.map((e) => (
        <div key={e.id}>
          {e.kind === "RUN_COMMAND" ? (
            <div className="text-emerald-700">
              <span className="text-black/35">$ </span>
              {e.command || e.title}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap pl-3 text-black/55">{e.detail || e.title}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

function TestsTab({ events }: { events: ExecutionEvent[] }) {
  const rows = events.filter((e) => e.kind === "TEST_RESULT");
  if (!rows.length) return <Empty text="No test runs recorded yet." />;
  return (
    <ul className="space-y-2">
      {rows.map((e) => (
        <li key={e.id} className="rounded-lg border border-black/8 bg-black/[.015] p-2.5">
          <div className="flex items-center gap-2">
            <StatusDot status={e.status} />
            <span className="text-[13px] font-medium text-black/85">{e.title}</span>
            <span className="ml-auto font-mono text-[10px] text-black/35">{timeLabel(e.createdAt)}</span>
          </div>
          {e.detail && <pre className="mt-1.5 whitespace-pre-wrap pl-4 font-mono text-[11.5px] text-black/55">{e.detail}</pre>}
        </li>
      ))}
    </ul>
  );
}

function GitDeployTab({ events }: { events: ExecutionEvent[] }) {
  const rows = events.filter((e) =>
    ["GIT_ACTION", "PR_OPENED", "APPROVAL", "MERGE", "DEPLOY_STARTED", "DEPLOY_VERIFIED"].includes(e.kind),
  );
  if (!rows.length) return <Empty text="No git or deploy activity yet." />;
  return (
    <ul className="space-y-2">
      {rows.map((e) => (
        <li key={e.id} className="rounded-lg border border-black/8 bg-black/[.015] p-2.5">
          <div className="flex items-center gap-2">
            <StatusDot status={e.status} />
            <span className="text-[13px] font-medium text-black/85">{e.title}</span>
            <span className="ml-auto font-mono text-[10px] text-black/35">{timeLabel(e.createdAt)}</span>
          </div>
          {e.detail && <div className="mt-1 pl-4 font-mono text-[11.5px] text-black/50">{e.detail}</div>}
        </li>
      ))}
    </ul>
  );
}

function LogsTab({ events }: { events: ExecutionEvent[] }) {
  if (!events.length) return <Empty text="No activity yet." />;
  return (
    <ul className="space-y-1.5">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-2 text-[12px]">
          <StatusDot status={e.status} className="mt-1" />
          <span className="font-mono text-[10px] text-black/35">{timeLabel(e.createdAt)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-black/35">{e.kind}</span>
          <span className="min-w-0 flex-1 truncate text-black/75">{e.title}</span>
        </li>
      ))}
      {events.some((e) => e.diff) && (
        <li className="pt-2">
          {events
            .filter((e) => e.diff)
            .slice(-1)
            .map((e) => (
              <DiffView key={e.id} diff={e.diff!} />
            ))}
        </li>
      )}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-[12.5px] text-black/40">{text}</p>;
}

/**
 * Collapsible bottom workspace: Terminal / Tests / Git & Deploy / All events.
 * Every tab is a filtered view of the exact same real event array the
 * timeline renders — there is no second, independent "logs" data source
 * that could ever drift from what the timeline shows.
 */
export function BottomPanels({ events }: { events: ExecutionEvent[] }) {
  const [tab, setTab] = useState<TabId>("terminal");
  // Collapsed by default: the live feed (LiveFeed.tsx) is the primary
  // experience now. This strip stays reachable for real technical detail
  // but must not compete with it for screen space on load, especially on
  // a phone where every extra open panel is scroll distance.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-col border-t border-black/8" style={{ background: "#faf9f8" }}>
      <div className="flex items-center gap-1 overflow-x-auto px-2 pt-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setCollapsed(false);
            }}
            className={`shrink-0 rounded-t-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              !collapsed && tab === t.id ? "bg-white text-black/90" : "text-black/40 hover:text-black/70"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          className="ml-auto shrink-0 rounded-lg px-2 py-1.5 text-[12px] text-black/40 hover:text-black/70"
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>
      {!collapsed && (
        <div className="max-h-[34vh] overflow-y-auto bg-white px-3 py-3 sm:max-h-[30vh]">
          {tab === "terminal" && <TerminalTab events={events} />}
          {tab === "tests" && <TestsTab events={events} />}
          {tab === "git" && <GitDeployTab events={events} />}
          {tab === "logs" && <LogsTab events={events} />}
        </div>
      )}
    </div>
  );
}
