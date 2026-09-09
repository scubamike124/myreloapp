"use client";

import { useMemo, useState, useTransition } from "react";
import type { OrganizationOverview, DivisionView, AgentView } from "@/lib/amber/organization-bridge";

type Notice = { kind: "ok" | "error"; text: string } | null;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  AVAILABLE: { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" },
  ACTIVE: { bg: "rgba(46,204,113,.15)", fg: "#2ecc71" },
  SCALING: { bg: "rgba(46,204,113,.15)", fg: "#2ecc71" },
  REDUCED: { bg: "rgba(255,159,67,.15)", fg: "#ffcf9a" },
  PAUSED: { bg: "rgba(255,159,67,.15)", fg: "#ffcf9a" },
  SUSPENDED: { bg: "rgba(255,70,85,.15)", fg: "#ff9aa3" },
  RETIRED: { bg: "rgba(255,255,255,.06)", fg: "#8a7d7f" },
  PRODUCTION_ELIGIBLE: { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" },
  QUEUED: { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" },
  IN_PROGRESS: { bg: "rgba(94,166,255,.15)", fg: "#8ec1ff" },
  DONE: { bg: "rgba(46,204,113,.15)", fg: "#2ecc71" },
  VERIFIED: { bg: "rgba(46,204,113,.2)", fg: "#2ecc71" },
  FAILED: { bg: "rgba(255,70,85,.15)", fg: "#ff9aa3" },
  REJECTED: { bg: "rgba(255,70,85,.15)", fg: "#ff9aa3" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "rgba(255,255,255,.08)", fg: "#c7bcbe" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: c.bg, color: c.fg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Banner({ tone, children }: { tone: "info" | "warn" | "ok" | "error"; children: React.ReactNode }) {
  const styles = {
    info: { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)", color: "#cabcbe" },
    warn: { border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" },
    ok: { border: "1px solid rgba(46,204,113,.35)", background: "rgba(46,204,113,.08)", color: "#8ee7b0" },
    error: { border: "1px solid rgba(255,70,85,.4)", background: "rgba(255,60,75,.09)", color: "#ff9aa3" },
  }[tone];
  return (
    <div className="mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed" style={styles}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/45">{sub}</div>}
    </div>
  );
}

function countBy<T extends { status: string }>(items: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) out[it.status] = (out[it.status] ?? 0) + 1;
  return out;
}

async function postAction(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  try {
    const res = await fetch("/api/admin/amber-organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) return { ok: false, error: data?.error || `Request failed (${res.status}).` };
    return data;
  } catch {
    return { ok: false, error: "Network error." };
  }
}

export default function AmberOrganizationDashboard({ initial }: { initial: OrganizationOverview }) {
  const [divisions, setDivisions] = useState<DivisionView[]>(initial.divisions);
  const [agents, setAgents] = useState<AgentView[]>(initial.agents);
  const [tasks] = useState(initial.recentTasks);
  const [notice, setNotice] = useState<Notice>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState({ daily: "", single: "", cumulative: "" });
  const [pending, startTransition] = useTransition();

  const divisionStatusCounts = useMemo(() => countBy(divisions), [divisions]);
  const agentStatusCounts = useMemo(() => countBy(agents), [agents]);
  const taskStatusCounts = useMemo(() => countBy(tasks), [tasks]);
  const agentsByDivision = useMemo(() => {
    const map = new Map<string, AgentView[]>();
    for (const a of agents) map.set(a.divisionId, [...(map.get(a.divisionId) ?? []), a]);
    return map;
  }, [agents]);

  const activeDivisions = divisionStatusCounts.ACTIVE ?? 0;
  const pausedDivisions = (divisionStatusCounts.PAUSED ?? 0) + (divisionStatusCounts.RETIRED ?? 0);
  const runnableAgents = agents.filter((a) => a.status !== "SUSPENDED" && a.status !== "RETIRED").length;

  const refresh = () =>
    startTransition(async () => {
      const res = await fetch("/api/admin/amber-organization", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setDivisions(data.divisions);
        setAgents(data.agents);
      }
    });

  const toggleDivision = async (d: DivisionView) => {
    setBusyId(d.id);
    setNotice(null);
    const willPause = d.status !== "PAUSED";
    const result = await postAction(
      willPause
        ? { action: "pause_division", divisionId: d.id, reason: "Paused from Amber's AI Earnings" }
        : { action: "resume_division", divisionId: d.id },
    );
    setBusyId(null);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Could not update the division." });
      return;
    }
    setDivisions((prev) => prev.map((x) => (x.id === d.id ? (result.division as DivisionView) : x)));
    setNotice({ kind: "ok", text: `${d.blueprint.name} ${willPause ? "paused" : "resumed"}.` });
  };

  const toggleAgent = async (a: AgentView) => {
    setBusyId(a.id);
    setNotice(null);
    const willPause = a.status !== "SUSPENDED";
    const result = await postAction(
      willPause
        ? { action: "pause_agent", agentId: a.id, reason: "Paused from Amber's AI Earnings" }
        : { action: "resume_agent", agentId: a.id },
    );
    setBusyId(null);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Could not update the agent." });
      return;
    }
    setAgents((prev) => prev.map((x) => (x.id === a.id ? (result.agent as AgentView) : x)));
    setNotice({ kind: "ok", text: `${a.displayName} ${willPause ? "paused" : "resumed"}.` });
  };

  // set_division_budget is supported end to end (this route -> Amber HQ's
  // reelo-organization-bridge -> division-store.setDivisionBudget); the owner
  // needs a way to actually change a cap, not just read it. A blank field
  // sends null, which Amber HQ treats as "clear this cap".
  const openBudgetEditor = (d: DivisionView) => {
    setNotice(null);
    setEditingBudget(d.id);
    setBudgetDraft({
      daily: d.dailyBudgetUsd != null ? String(d.dailyBudgetUsd) : "",
      single: d.maxSingleSpendUsd != null ? String(d.maxSingleSpendUsd) : "",
      cumulative: d.maxCumulativeSpendUsd != null ? String(d.maxCumulativeSpendUsd) : "",
    });
  };

  // "" -> null (clear the cap); a real number >= 0 -> set it; anything else
  // -> undefined, which saveBudget rejects before it calls the bridge.
  const parseUsd = (v: string): number | null | undefined => {
    const t = v.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const saveBudget = async (d: DivisionView) => {
    const dailyBudgetUsd = parseUsd(budgetDraft.daily);
    const maxSingleSpendUsd = parseUsd(budgetDraft.single);
    const maxCumulativeSpendUsd = parseUsd(budgetDraft.cumulative);
    if (dailyBudgetUsd === undefined || maxSingleSpendUsd === undefined || maxCumulativeSpendUsd === undefined) {
      setNotice({ kind: "error", text: "Each budget must be a number ≥ 0, or left blank to clear it." });
      return;
    }
    setBusyId(`budget:${d.id}`);
    setNotice(null);
    const result = await postAction({
      action: "set_division_budget",
      divisionId: d.id,
      dailyBudgetUsd,
      maxSingleSpendUsd,
      maxCumulativeSpendUsd,
    });
    setBusyId(null);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Could not update the budget." });
      return;
    }
    setDivisions((prev) => prev.map((x) => (x.id === d.id ? (result.division as DivisionView) : x)));
    setEditingBudget(null);
    setNotice({ kind: "ok", text: `${d.blueprint.name} budget updated.` });
  };

  const emergencyStop = async () => {
    setBusyId("__emergency__");
    setNotice(null);
    const result = await postAction({ action: "emergency_stop" });
    setBusyId(null);
    setConfirmingStop(false);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Emergency stop failed." });
      return;
    }
    setNotice({ kind: "ok", text: `Emergency stop: paused ${result.divisionsPaused} division(s) and ${result.agentsPaused} agent(s). No records were deleted.` });
    refresh();
  };

  const resumeFromStop = async () => {
    setBusyId("__resume__");
    setNotice(null);
    const result = await postAction({ action: "resume_from_emergency_stop" });
    setBusyId(null);
    if (!result.ok) {
      setNotice({ kind: "error", text: result.error || "Resume failed." });
      return;
    }
    setNotice({ kind: "ok", text: `Resumed ${result.divisionsResumed} division(s) and ${result.agentsResumed} agent(s). Any pause you set for its own reason stayed paused.` });
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-[28px]">Amber&apos;s AI Earnings</h1>
          <p className="mt-1 max-w-prose text-sm text-white/50">
            Amber&apos;s own autonomous organization — every number below is read live from Amber HQ&apos;s real
            division/agent/task records, not a demo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={pending}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            {pending ? "Refreshing…" : "Refresh"}
          </button>
          {!confirmingStop ? (
            <button
              onClick={() => setConfirmingStop(true)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px -8px rgba(225,29,42,.6)" }}
            >
              Emergency stop
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Pause every division and agent?</span>
              <button
                onClick={emergencyStop}
                disabled={busyId === "__emergency__"}
                className="rounded-xl px-3 py-2 text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                {busyId === "__emergency__" ? "Stopping…" : "Confirm"}
              </button>
              <button onClick={() => setConfirmingStop(false)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70">
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={resumeFromStop}
            disabled={busyId === "__resume__"}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            {busyId === "__resume__" ? "Resuming…" : "Resume from stop"}
          </button>
        </div>
      </div>

      {notice && <Banner tone={notice.kind}>{notice.text}</Banner>}

      <Banner tone="info">
        Financial totals (revenue, cost, net profit) live in Amber Earnings — this page is the organization&apos;s
        operational view: which divisions and agents exist, their real status, and owner controls. Every agent below
        is currently <strong className="font-semibold text-white/80">production-eligible, not yet actively working</strong>{" "}
        unless its status says ACTIVE — this is an honest starting point, not simulated activity.
      </Banner>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Divisions" value={divisions.length} sub={`${activeDivisions} active · ${pausedDivisions} paused`} />
        <StatCard
          label="Agents"
          value={agents.length}
          sub={`${runnableAgents} runnable · ${agentStatusCounts.SUSPENDED ?? 0} suspended`}
        />
        <StatCard label="Recent tasks" value={tasks.length} sub={`${taskStatusCounts.VERIFIED ?? 0} verified`} />
        <StatCard label="Failed tasks" value={taskStatusCounts.FAILED ?? 0} sub={`${taskStatusCounts.QUEUED ?? 0} queued`} />
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="font-display mb-4 text-base font-bold">Divisions (20)</h2>
        <div className="space-y-3">
          {divisions.map((d) => {
            const divisionAgents = agentsByDivision.get(d.id) ?? [];
            return (
              <div key={d.id} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{d.blueprint.name}</span>
                      <StatusPill status={d.status} />
                    </div>
                    <p className="mt-1 max-w-[560px] text-xs text-white/50">{d.blueprint.mission}</p>
                    {d.pauseReason && <p className="mt-1 text-xs text-[#ffcf9a]">Paused: {d.pauseReason}</p>}
                    {editingBudget === d.id ? (
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        {(
                          [
                            ["daily", "Daily $"],
                            ["single", "Max single $"],
                            ["cumulative", "Lifetime cap $"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="text-[10px] text-white/40">
                            <span className="block">{label}</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="decimal"
                              value={budgetDraft[key]}
                              onChange={(e) => setBudgetDraft((p) => ({ ...p, [key]: e.target.value }))}
                              placeholder="none"
                              className="mt-0.5 w-24 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white/80"
                            />
                          </label>
                        ))}
                        <button
                          onClick={() => saveBudget(d)}
                          disabled={busyId === `budget:${d.id}`}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
                        >
                          {busyId === `budget:${d.id}` ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingBudget(null)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-white/35">
                        Budget: {d.dailyBudgetUsd != null ? `$${d.dailyBudgetUsd}/day` : "no daily cap set"}
                        {d.maxSingleSpendUsd != null && ` · max single $${d.maxSingleSpendUsd}`}
                        {d.maxCumulativeSpendUsd != null && ` · lifetime cap $${d.maxCumulativeSpendUsd}`}
                        <button
                          onClick={() => openBudgetEditor(d)}
                          className="ml-2 font-semibold text-white/55 underline decoration-white/25 underline-offset-2 hover:text-white/80"
                        >
                          Edit
                        </button>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleDivision(d)}
                    disabled={busyId === d.id}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    {busyId === d.id ? "…" : d.status === "PAUSED" ? "Resume" : "Pause"}
                  </button>
                </div>

                {divisionAgents.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                    {divisionAgents.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-white/70">
                          <span>{a.displayName}</span>
                          <StatusPill status={a.status} />
                          <span className="text-white/35">success {Math.round(a.successRate * 100)}%</span>
                        </div>
                        <button
                          onClick={() => toggleAgent(a)}
                          disabled={busyId === a.id}
                          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50"
                        >
                          {busyId === a.id ? "…" : a.status === "SUSPENDED" ? "Resume" : "Pause"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {divisionAgents.length === 0 && (
                  <p className="mt-2 border-t border-white/5 pt-2 text-[11px] text-white/35">No agents staffed yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="font-display mb-4 text-base font-bold">Recent tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-xs text-white/45">No tasks yet — nothing has been routed to an agent.</p>
        ) : (
          <div className="scroll-fade-x overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="text-white/40">
                  <th className="pb-2 pr-3 font-semibold">Title</th>
                  <th className="pb-2 pr-3 font-semibold">Division</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 pr-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="max-w-[260px] truncate py-2 pr-3 text-white/80">{t.title}</td>
                    <td className="py-2 pr-3 text-white/60">{t.divisionId.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-3"><StatusPill status={t.status} /></td>
                    <td className="py-2 pr-3 tabular-nums text-white/45">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
