"use client";

import { useMemo, useState } from "react";
import type { DivisionDrilldownView, ChildWorkforceReport, ChildWorkforceWindow } from "@/lib/amber/organization-bridge";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/45">{sub}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: "rgba(46,204,113,.15)", fg: "#2ecc71" },
  IDLE: { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" },
  BLOCKED: { bg: "rgba(255,159,67,.15)", fg: "#ffcf9a" },
  FAILED: { bg: "rgba(255,70,85,.15)", fg: "#ff9aa3" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: c.bg, color: c.fg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function WindowTable({ window, label }: { window: ChildWorkforceWindow; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-bold">{label}</h3>
        <span className="text-[11px] text-white/40">{window.ticksInWindow} real tick(s) in window</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <span>Dispatched: <strong className="tabular-nums">{window.dispatched}</strong></span>
        <span className="text-[#8ee7b0]">Productive: <strong className="tabular-nums">{window.productive}</strong></span>
        <span className="text-white/50">Completed-empty: <strong className="tabular-nums">{window.empty}</strong></span>
        <span className="text-[#ff9aa3]">Failed/blocked: <strong className="tabular-nums">{window.failed + window.blocked}</strong></span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">By role (dispatched / productive)</div>
          <div className="mt-1 space-y-0.5 text-xs">
            {Object.entries(window.byRole).map(([role, v]) => (
              <div key={role} className="flex justify-between">
                <span className="text-white/60">{role}</span>
                <span className="tabular-nums">{v.dispatched} / {v.productive}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">By source (dispatched / productive)</div>
          <div className="mt-1 space-y-0.5 text-xs">
            {Object.entries(window.bySource).map(([src, v]) => (
              <div key={src} className="flex justify-between">
                <span className="text-white/60">{src}</span>
                <span className="tabular-nums">{v.dispatched} / {v.productive}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-white/40">By category &amp; geography</summary>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-0.5 text-xs">
            {Object.entries(window.byCategory).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-white/60">{k}</span>
                <span className="tabular-nums">{v.dispatched} / {v.productive}</span>
              </div>
            ))}
          </div>
          <div className="space-y-0.5 text-xs">
            {Object.entries(window.byGeography).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-white/60">{k}</span>
                <span className="tabular-nums">{v.dispatched} / {v.productive}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
      <div className="mt-3 border-t border-white/10 pt-2 text-xs text-white/50">
        monitor (real external search): {window.monitor.searched} searched · {window.monitor.uniqueNew} new listing(s) · {window.monitor.duplicates} already known ·{" "}
        {window.monitor.qualified} newly qualified · {window.monitor.rejected} rejected
      </div>
    </div>
  );
}

export default function ScoutChildWorkforcePanel({
  drilldown,
  childWorkforce,
}: {
  drilldown: DivisionDrilldownView[] | null;
  childWorkforce: ChildWorkforceReport | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [windowTab, setWindowTab] = useState<"last1h" | "last24h" | "last7d">("last24h");

  const hierarchy = childWorkforce?.hierarchy ?? null;
  const idleAfterRunning = hierarchy ? hierarchy.byStatus.IDLE - hierarchy.neverRun : 0;

  const rotationMath = useMemo(() => {
    if (!childWorkforce) return null;
    const perTick = childWorkforce.windows.last1h.ticksInWindow > 0 ? childWorkforce.windows.last1h.dispatched / childWorkforce.windows.last1h.ticksInWindow : 0;
    if (perTick <= 0 || !hierarchy) return null;
    const ticksToFullRotation = Math.ceil(hierarchy.total / perTick);
    const hoursToFullRotation = (ticksToFullRotation * 10) / 60; // */10 * * * * -- see tickSchedule
    return { perTick: Math.round(perTick), ticksToFullRotation, hoursToFullRotation: Math.round(hoursToFullRotation * 10) / 10 };
  }, [childWorkforce, hierarchy]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold">Scouts → child workers → results</h2>

      {!childWorkforce ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-[#ff9aa3]">Could not reach Amber HQ for the child-workforce report.</div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/50">
            Tick schedule: <code className="text-[#ff8892]">{childWorkforce.tickSchedule.cronExpr}</code> — {childWorkforce.tickSchedule.detail}
            {rotationMath && (
              <>
                {" "}Real pace right now: ~{rotationMath.perTick} worker(s)/tick → full rotation of all {hierarchy!.total.toLocaleString()} in ~{rotationMath.ticksToFullRotation} ticks (~
                {rotationMath.hoursToFullRotation}h).
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total child workers" value={hierarchy!.total.toLocaleString()} />
            <StatCard label="Active" value={hierarchy!.byStatus.ACTIVE} />
            <StatCard label="Idle (has run)" value={idleAfterRunning} />
            <StatCard label="Never dispatched" value={hierarchy!.neverRun} />
            <StatCard label="Blocked" value={hierarchy!.byStatus.BLOCKED} />
            <StatCard label="Failed" value={hierarchy!.byStatus.FAILED} />
          </div>
          <p className="text-[11px] text-white/40">
            No PAUSED/SCHEDULED status exists at the child-worker level today -- only ACTIVE/IDLE/BLOCKED/FAILED are real states this system tracks; reported honestly rather than added to match a
            requested list.
          </p>

          <div>
            <div className="flex gap-2">
              {(["last1h", "last24h", "last7d"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindowTab(w)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${windowTab === w ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
                >
                  {w === "last1h" ? "Last hour" : w === "last24h" ? "Last 24h" : "Last 7 days"}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <WindowTable window={childWorkforce.windows[windowTab]} label={windowTab === "last1h" ? "Last hour" : windowTab === "last24h" ? "Last 24 hours" : "Last 7 days"} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <h3 className="font-display text-sm font-bold">Sample workers (most recently touched)</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-white/40">
                  <tr>
                    <th className="pb-1 pr-3">Worker</th>
                    <th className="pb-1 pr-3">Role</th>
                    <th className="pb-1 pr-3">Source</th>
                    <th className="pb-1 pr-3">Status</th>
                    <th className="pb-1 pr-3">Last result</th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchy!.sample.map((w) => (
                    <tr key={w.id} className="border-t border-white/5">
                      <td className="py-1 pr-3 font-mono text-[10px] text-white/50">{w.id}</td>
                      <td className="py-1 pr-3">{w.role}</td>
                      <td className="py-1 pr-3">{w.source}</td>
                      <td className="py-1 pr-3">{w.status ? <StatusPill status={w.status} /> : "—"}</td>
                      <td className="py-1 pr-3 text-white/60">{w.lastResult ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {childWorkforce.statusTracking.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <h3 className="font-display text-sm font-bold">status_tracking (event-driven, kept separate from the 100,000)</h3>
              <p className="mt-1 text-[11px] text-white/40">Attributes a real marketplace job&apos;s status check back to the scout that found it -- created only when a real job exists, never pre-enumerated.</p>
              <div className="mt-2 space-y-1 text-xs">
                {childWorkforce.statusTracking.map((w) => (
                  <div key={w.id} className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-white/60">{w.scoutId} ({w.source})</span>
                    <StatusPill status={w.status} />
                    <span className="text-white/50">{w.lastResult}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="font-display text-lg font-bold">Divisions → agents → tasks</h2>
      {!drilldown ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-[#ff9aa3]">Could not reach Amber HQ for the workforce drilldown.</div>
      ) : (
        <div className="space-y-3">
          {drilldown.map((div) => (
            <div key={div.divisionId} className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">{div.divisionId}</h3>
                <StatusPill status={div.status} />
              </div>
              <div className="mt-2 space-y-2">
                {div.agents.map((a) => (
                  <div key={a.agent.id} className="rounded-xl border border-white/5 bg-white/[.02] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button className="text-left text-sm font-semibold" onClick={() => setExpanded(expanded === a.agent.id ? null : a.agent.id)}>
                        {a.agent.key}
                      </button>
                      <div className="flex items-center gap-2">
                        <StatusPill status={a.agent.status} />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.wiringStatus === "connected" ? "bg-white/10 text-white/60" : "bg-[rgba(255,159,67,.15)] text-[#ffcf9a]"}`}>
                          {a.wiringStatus === "connected" ? "wired" : "dormant/unwired"}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {a.activeWorkers}/{a.concurrencyCap} active worker(s)
                        </span>
                      </div>
                    </div>
                    {a.neverAssignedWork && <p className="mt-1 text-[11px] text-white/40">Never assigned a task.</p>}
                    {expanded === a.agent.id && (
                      <div className="mt-2 space-y-1 border-t border-white/5 pt-2 text-xs">
                        {a.recentTasks.length === 0 ? (
                          <p className="text-white/40">No task history.</p>
                        ) : (
                          a.recentTasks.map((t) => (
                            <div key={t.id} className="flex justify-between gap-3">
                              <span className="truncate text-white/70">{t.title}</span>
                              <span className="shrink-0 text-white/40">
                                <StatusPill status={t.status} /> {t.lastResult}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
