"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Tab =
  | "ops"
  | "command"
  | "exec"
  | "launch"
  | "control"
  | "health"
  | "goals"
  | "departments"
  | "executive"
  | "memory"
  | "improvements"
  | "setup"
  | "intel"
  | "mission"
  | "campaigns"
  | "review"
  | "decisions"
  | "agents"
  | "cycle"
  | "reports"
  | "week"
  | "social"
  | "logs";

type Dash = {
  flagEnabled: boolean;
  emergencyStop: boolean;
  autoGenerate: boolean;
  continuousCycle: boolean;
  learningMode: boolean;
  learningWorkspaces: string[];
  launchOps: {
    cyclesCompleted: number;
    cyclesFailed: number;
    avgDurationMs: number;
    ownerInterventions: number;
    learningUpdates: number;
    recentRuns: {
      id: string;
      userId: string;
      status: string;
      goal: string;
      durationMs: number;
      error?: string | null;
      createdAt: string;
      ownerAsks?: unknown[];
    }[];
    recentMetrics: {
      id: string;
      kind: string;
      workspaceUserId?: string | null;
      metrics: Record<string, unknown>;
      createdAt: string;
    }[];
  } | null;
  opsConsole: {
    honestyNote?: string;
    readiness?: {
      score: number;
      breakdown: Record<string, number>;
      explanations: Record<string, string>;
    };
    queues?: { publishBacklog: number; schedulePending: number; agentJobsRecent: number };
    alerts?: {
      id: string;
      severity: string;
      kind: string;
      title: string;
      detail: string;
      status: string;
      recommended: string;
      workspaceUserId?: string | null;
      createdAt: string;
    }[];
    recoveries?: {
      id: string;
      action: string;
      status: string;
      createdAt: string;
      workspaceUserId?: string | null;
    }[];
    recentCheckpoints?: { cycleId: string; step: string; status: string; createdAt: string }[];
    activeAgents?: { id: string; agent: string; department?: string; title: string; status: string }[];
    flags?: Record<string, unknown>;
  } | null;
  notifyPrefs: {
    weeklyReport: boolean;
    verificationHolds: boolean;
    publishFailures: boolean;
    missionComplete: boolean;
    ownerInterventionsOnly?: boolean;
  };
  summary: {
    connectedAccounts: number;
    scheduled: number;
    amberPlaced: number;
    publishQueue: number;
    logCount: number;
    errorLike: number;
  };
  users: { id: string; email: string; name: string | null }[];
  logKinds: string[];
  accounts: { id: string; provider: string; handle: string; displayName: string; status: string; userId: string }[];
  schedules: {
    id: string;
    title: string;
    approvalStatus: string;
    amberPlaced: boolean;
    scheduledAt: string;
    publishResult: string | null;
    userId: string;
  }[];
  publish: { id: string; title: string; status: string; approvalStatus: string; userId: string }[];
  logs: { id: string; kind: string; title: string; actorEmail: string | null; createdAt: string; detail: unknown }[];
  tester: {
    userId: string;
    profile: {
      company?: string;
      brandRules?: string;
      approvalMode?: string;
    } | null;
    intelligence: {
      company: string;
      industry: string;
      competitors: string;
      serviceAreas: string;
      seasonalTrends: string;
      products: string;
      services: string;
      marketingObjectives: string;
      brandRules: string;
      goals: string;
      intelligence: Record<string, unknown>;
    } | null;
    emails: { id: string; email: string; role: string; notes: string }[];
    services: { id: string; service: string; status: string }[];
    accountMap: { socialAccountId: string; infraRole: string; provider: string; handle: string }[];
    weeks: {
      id: string;
      weekStart: string;
      status: string;
      report: Record<string, unknown>;
      strategy: Record<string, unknown>;
      createdAt: string;
    }[];
    contentRequests: { id: string; title: string; toolSlug: string; status: string; parentId: string | null }[];
    missions: {
      id: string;
      goal: string;
      status: string;
      weekId: string | null;
      report: Record<string, unknown>;
      strategy: Record<string, unknown>;
      createdAt: string;
    }[];
    productions: {
      id: string;
      title: string;
      toolSlug: string;
      status: string;
      reviewStatus: string;
      reviewNotes: string;
      parentId: string | null;
      missionId: string | null;
      creationId: string | null;
      scheduleId: string | null;
    }[];
    reports: { id: string; period: string; summary: string; body: Record<string, unknown>; createdAt: string }[];
    holds: { id: string; provider: string; step: string; status: string; explanation: string; resumeHint: string }[];
    campaigns: { id: string; title: string; objective: string; status: string; createdAt: string }[];
    decisions: {
      id: string;
      kind: string;
      priority: number;
      title: string;
      rationale: string;
      action: string;
      status: string;
    }[];
    agentJobs: { id: string; agent: string; title: string; status: string; createdAt: string }[];
    infraRecommendations: { area: string; severity: string; detail: string }[];
    learning: { patterns: Record<string, unknown>; updatedAt: string } | null;
    bos?: {
      health: Record<string, unknown> | null;
      executive: Record<string, unknown> | null;
      departments: Record<string, unknown>[];
      objectives: Record<string, unknown>[];
      memory: Record<string, unknown>[];
      improvements: Record<string, unknown>[];
      execOps?: {
        plans?: Record<string, unknown>[];
        initiatives?: Record<string, unknown>[];
        projects?: Record<string, unknown>[];
        tasks?: Record<string, unknown>[];
        kpis?: Record<string, unknown>[];
        risks?: Record<string, unknown>[];
        approvals?: Record<string, unknown>[];
        briefings?: Record<string, unknown>[];
        optimizations?: Record<string, unknown>[];
        honestyNote?: string;
      };
    };
    accounts: { id: string; provider: string; handle: string; status: string }[];
    schedules: { id: string; title: string; approvalStatus: string; amberPlaced: boolean }[];
    publish: { id: string; title: string; status: string }[];
  } | null;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "ops", label: "Ops" },
  { id: "command", label: "Command" },
  { id: "exec", label: "Exec Ops" },
  { id: "launch", label: "Launch" },
  { id: "control", label: "Control" },
  { id: "health", label: "Health" },
  { id: "goals", label: "Goals" },
  { id: "departments", label: "Departments" },
  { id: "executive", label: "Executive" },
  { id: "memory", label: "Memory" },
  { id: "improvements", label: "Improvements" },
  { id: "setup", label: "Setup" },
  { id: "intel", label: "Intel" },
  { id: "mission", label: "Mission" },
  { id: "campaigns", label: "Campaigns" },
  { id: "review", label: "Review" },
  { id: "decisions", label: "Decisions" },
  { id: "agents", label: "Agents" },
  { id: "cycle", label: "Cycle" },
  { id: "reports", label: "Reports" },
  { id: "week", label: "Week" },
  { id: "social", label: "Social" },
  { id: "logs", label: "Logs" },
];

export default function AmberAdminDashboard() {
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [tab, setTab] = useState<Tab>("ops");
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [objectiveGoal, setObjectiveGoal] = useState("");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryBody, setMemoryBody] = useState("");
  const [testerId, setTesterId] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [brandRules, setBrandRules] = useState("");
  const [approvalMode, setApprovalMode] = useState<"require" | "auto">("require");
  const [weekResult, setWeekResult] = useState<string>("");
  const [missionGoal, setMissionGoal] = useState("Increase awareness for my transportation business.");
  const [missionResult, setMissionResult] = useState("");
  const [cycleResult, setCycleResult] = useState("");
  const [intelDraft, setIntelDraft] = useState({
    competitors: "",
    serviceAreas: "",
    seasonalTrends: "",
    products: "",
    services: "",
    marketingObjectives: "",
  });

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (testerId) qs.set("userId", testerId);
      if (kindFilter) qs.set("kind", kindFilter);
      const res = await fetch(`/api/admin/amber?${qs}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error || "Couldn't load Amber admin data.");
        return;
      }
      setData(json);
      setErr(null);
      if (Array.isArray(json.learningWorkspaces)) {
        setSelectedWorkspaces(json.learningWorkspaces.map(String));
      }
      if (json.tester?.profile) {
        setBrandRules(String(json.tester.profile.brandRules || ""));
        setApprovalMode(json.tester.profile.approvalMode === "auto" ? "auto" : "require");
      }
      if (json.tester?.intelligence) {
        const i = json.tester.intelligence;
        setIntelDraft({
          competitors: String(i.competitors || ""),
          serviceAreas: String(i.serviceAreas || ""),
          seasonalTrends: String(i.seasonalTrends || ""),
          products: String(i.products || ""),
          services: String(i.services || ""),
          marketingObjectives: String(i.marketingObjectives || ""),
        });
      }
    } catch {
      setErr("Network error.");
    }
  }, [testerId, kindFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/admin/amber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.message || json.error || "Action failed.");
        return json;
      }
      await load();
      return json;
    } finally {
      setBusy(false);
    }
  };

  const setupGenerate = async () => {
    if (!testerId) {
      setErr("Pick a tester user first.");
      return;
    }
    const json = await post({ action: "setup_generate", userId: testerId });
    if (json?.ok) setFlash(String(json.summary || "Setup plan saved."));
  };

  const card = { border: "1px solid rgba(255,70,85,.2)", background: "rgba(14,6,8,.55)" } as const;

  const learningSummary = useMemo(() => {
    const p = data?.tester?.learning?.patterns;
    if (!p) return null;
    return p;
  }, [data]);

  if (err && !data) {
    return <p className="text-sm text-red-300">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-white/50">Loading Amber testing cockpit…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{
              background: tab === t.id ? "linear-gradient(135deg,#ff3645,#c4101c)" : "rgba(255,255,255,.06)",
              color: "#fff",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {flash ? <p className="text-sm text-[#5fd08a]">{flash}</p> : null}
      {err ? <p className="text-sm text-red-300">{err}</p> : null}

      <div className="rounded-2xl p-4" style={card}>
        <label className="block text-xs uppercase tracking-wide text-white/50">Tester user</label>
        <select
          className="mt-1 w-full max-w-lg rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={testerId}
          onChange={(e) => setTesterId(e.target.value)}
        >
          <option value="">Select user…</option>
          {data.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
              {u.name ? ` (${u.name})` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-white/45">
          Week/setup APIs for a chosen user run via Super Admin actions below. Customer-facing Amber stays 403.
        </p>
      </div>

      {tab === "ops" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Production Operations Console</h2>
            <p className="mt-1 text-xs text-white/50">
              {data.opsConsole?.honestyNote ||
                "Amber operational signals only — not host CPU/RAM on Workers."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await post({ action: "compute_readiness" });
                  setFlash("Readiness score refreshed.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Refresh readiness
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await post({ action: "scan_alerts" });
                  setFlash("Alert scan complete.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/90 disabled:opacity-40"
              >
                Scan alerts
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await post({ action: "ops_console_refresh" });
                  setFlash("Ops console refreshed.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/90 disabled:opacity-40"
              >
                Refresh console
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                Readiness:{" "}
                <strong className="text-[#5fd08a]">{data.opsConsole?.readiness?.score ?? "—"}/100</strong>
              </div>
              <div>
                Publish backlog: <strong>{data.opsConsole?.queues?.publishBacklog ?? 0}</strong>
              </div>
              <div>
                Schedule pending: <strong>{data.opsConsole?.queues?.schedulePending ?? 0}</strong>
              </div>
              <div>
                Recent agent jobs: <strong>{data.opsConsole?.queues?.agentJobsRecent ?? 0}</strong>
              </div>
            </div>
            {data.opsConsole?.readiness?.breakdown ? (
              <pre className="mt-3 max-h-40 overflow-auto text-xs text-white/60">
                {JSON.stringify(data.opsConsole.readiness.breakdown, null, 2)}
              </pre>
            ) : null}
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h3 className="font-semibold">Open alerts</h3>
            <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
              {(data.opsConsole?.alerts || []).filter((a) => a.status === "open").length === 0 ? (
                <li className="text-white/50">No open alerts.</li>
              ) : null}
              {(data.opsConsole?.alerts || [])
                .filter((a) => a.status === "open")
                .slice(0, 15)
                .map((a) => (
                  <li key={a.id} className="border-b border-white/5 pb-2">
                    <span className="text-[#ff8892]">{a.severity}</span> {a.title}
                    <p className="text-xs text-white/50">{a.recommended}</p>
                    <button
                      type="button"
                      className="text-xs underline text-white/60"
                      disabled={busy}
                      onClick={async () => {
                        await post({ action: "resolve_ops_alert", alertId: a.id });
                        setFlash("Alert resolved.");
                      }}
                    >
                      Resolve
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h3 className="font-semibold">Checkpoints & recoveries</h3>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-white/65">
              {(data.opsConsole?.recentCheckpoints || []).slice(0, 12).map((c, i) => (
                <li key={`${c.cycleId}-${c.step}-${i}`}>
                  {c.status} · {c.step} · {String(c.cycleId).slice(0, 8)}…
                </li>
              ))}
            </ul>
            <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-xs text-white/65">
              {(data.opsConsole?.recoveries || []).slice(0, 8).map((r) => (
                <li key={r.id}>
                  {r.status} · {r.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "command" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Owner Command Center</h2>
            <p className="mt-1 text-xs text-white/50">
              Every command is audited via recovery events + amber_action_logs. Destructive ops use emergency
              stop / maintenance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["emergency_stop_on", "Emergency stop ON"],
                  ["emergency_stop_off", "Clear emergency stop"],
                  ["pause_automation", "Pause automation"],
                  ["resume_automation", "Resume Learning Mode"],
                  ["maintenance_mode", "Maintenance mode"],
                  ["scan_alerts", "Scan alerts"],
                  ["compute_readiness", "Compute readiness"],
                ] as const
              ).map(([cmd, label]) => (
                <button
                  key={cmd}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await post({ action: "owner_command", command: cmd, userId: testerId || undefined });
                    setFlash(`Command: ${label}`);
                  }}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white/90 disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !testerId}
                onClick={async () => {
                  await post({ action: "owner_command", command: "retry_productions", userId: testerId });
                  setFlash("Retry productions started.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Retry failed productions
              </button>
              <button
                type="button"
                disabled={busy || !testerId}
                onClick={async () => {
                  await post({ action: "owner_command", command: "retry_cycle", userId: testerId });
                  setFlash("Recovery cycle started.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Retry / trigger BOS cycle
              </button>
            </div>
            <p className="mt-2 text-xs text-white/40">Select a tester user above for workspace-scoped recovery.</p>
          </div>
        </div>
      ) : null}

      {tab === "exec" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Executive Operations (Amber 34)</h2>
            <p className="mt-1 text-xs text-white/50">
              {data.tester?.bos?.execOps?.honestyNote ||
                "Plan → initiatives → projects → tasks → KPIs → risks → briefing. Reelo-honest metrics only."}
            </p>
            <textarea
              className="mt-3 min-h-[70px] w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm"
              placeholder="Strategic goal for executive planning…"
              value={objectiveGoal}
              onChange={(e) => setObjectiveGoal(e.target.value)}
              disabled={!testerId}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !testerId || !objectiveGoal.trim()}
                onClick={async () => {
                  await post({ action: "exec_plan", userId: testerId, goal: objectiveGoal.trim() });
                  setFlash("Executive plan created.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Build plan
              </button>
              <button
                type="button"
                disabled={busy || !testerId}
                onClick={async () => {
                  await post({
                    action: "exec_ops_pass",
                    userId: testerId,
                    goal: objectiveGoal.trim() || undefined,
                  });
                  setFlash("Executive ops pass complete.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Run full exec ops pass
              </button>
              <button
                type="button"
                disabled={busy || !testerId}
                onClick={async () => {
                  await post({ action: "exec_briefing", userId: testerId, kind: "weekly" });
                  setFlash("Weekly briefing generated.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/90 disabled:opacity-40"
              >
                Weekly briefing
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl p-5" style={card}>
              <h3 className="font-semibold">Initiatives</h3>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                {(data.tester?.bos?.execOps?.initiatives || []).map((i) => (
                  <li key={String(i.id)}>
                    <span className="text-[#ff8892]">{String(i.department)}</span> {String(i.title)}{" "}
                    <span className="text-white/40">({Math.round(Number(i.progress || 0) * 100)}%)</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={card}>
              <h3 className="font-semibold">KPIs</h3>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                {(data.tester?.bos?.execOps?.kpis || []).slice(0, 12).map((k) => (
                  <li key={String(k.id)}>
                    {String(k.label)}: <strong>{String(k.value)}</strong> / {String(k.target)}{" "}
                    <span className="text-white/40">{String(k.trend)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={card}>
              <h3 className="font-semibold">Risks</h3>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
                {(data.tester?.bos?.execOps?.risks || [])
                  .filter((r) => r.status === "open")
                  .map((r) => (
                    <li key={String(r.id)}>
                      <span className="text-[#ff8892]">{String(r.severity)}</span> {String(r.title)}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={card}>
              <h3 className="font-semibold">Approvals</h3>
              <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-sm">
                {(data.tester?.bos?.execOps?.approvals || []).map((a) => (
                  <li key={String(a.id)} className="border-b border-white/5 pb-1">
                    <span className="text-white/40">{String(a.status)}</span> {String(a.title)}
                    {a.status === "pending" ? (
                      <span className="ml-2 space-x-2">
                        <button
                          type="button"
                          className="text-xs underline text-[#5fd08a]"
                          disabled={busy}
                          onClick={async () => {
                            await post({
                              action: "resolve_approval",
                              userId: testerId,
                              approvalId: a.id,
                              decision: "approved",
                            });
                          }}
                        >
                          approve
                        </button>
                        <button
                          type="button"
                          className="text-xs underline text-[#ff8892]"
                          disabled={busy}
                          onClick={async () => {
                            await post({
                              action: "resolve_approval",
                              userId: testerId,
                              approvalId: a.id,
                              decision: "rejected",
                            });
                          }}
                        >
                          reject
                        </button>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h3 className="font-semibold">Latest briefing</h3>
            {(data.tester?.bos?.execOps?.briefings || [])[0] ? (
              <pre className="mt-2 max-h-56 overflow-auto text-xs text-white/70">
                {JSON.stringify((data.tester?.bos?.execOps?.briefings || [])[0], null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-white/50">No briefing yet — run exec ops pass.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "launch" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Real-world Learning (admin only)</h2>
            <p className="mt-1 text-sm text-white/60">
              Not a public launch. Customers stay on 403. Select test workspaces — BI, learning, campaigns,
              reports, social, brand kit, calendar, and queue stay isolated per user.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(data.learningMode)}
                  disabled={busy}
                  onChange={async (e) => {
                    await post({ action: "set_learning_mode", enabled: e.target.checked });
                    setFlash(e.target.checked ? "Learning Mode ON." : "Learning Mode OFF.");
                  }}
                />
                Learning Mode
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(data.continuousCycle)}
                  disabled={busy}
                  onChange={async (e) => {
                    await post({ action: "set_continuous_cycle", enabled: e.target.checked });
                    setFlash(e.target.checked ? "Continuous Mode ON." : "Continuous Mode OFF.");
                  }}
                />
                Continuous Mode (weekly cron)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(data.notifyPrefs?.ownerInterventionsOnly)}
                  disabled={busy}
                  onChange={async (e) => {
                    await post({ action: "set_notify_prefs", ownerInterventionsOnly: e.target.checked });
                    setFlash("Owner-intervention notify preference saved.");
                  }}
                />
                Interrupt owner only when necessary
              </label>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h3 className="font-semibold">Test workspaces</h3>
            <p className="mt-1 text-xs text-white/50">
              Multi-select authorized admin workspaces. Amber never mixes data across them.
            </p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
              {data.users.map((u) => {
                const checked = selectedWorkspaces.includes(u.id);
                return (
                  <li key={u.id}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={() => {
                          setSelectedWorkspaces((prev) =>
                            checked ? prev.filter((id) => id !== u.id) : [...prev, u.id],
                          );
                        }}
                      />
                      <span>
                        {u.email}
                        {u.name ? ` (${u.name})` : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await post({ action: "set_learning_workspaces", userIds: selectedWorkspaces });
                  setFlash(`Saved ${selectedWorkspaces.length} learning workspace(s).`);
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Save workspace list
              </button>
              <button
                type="button"
                disabled={busy || !data.learningMode || selectedWorkspaces.length === 0}
                onClick={async () => {
                  const json = await post({
                    action: "run_learning_cycles",
                    userIds: selectedWorkspaces,
                  });
                  if (json?.ok) setFlash("Learning cycles completed for selected workspaces.");
                  else if (json?.skipped) setFlash(`Skipped: ${json.skipped}`);
                  else if (json?.results) setFlash("Batch finished — check results / logs.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/90 disabled:opacity-40"
              >
                Run Learning cycles now
              </button>
            </div>
            <p className="mt-2 text-xs text-white/40">
              Cron: POST /api/amber/cron/weekly with AMBER_CRON_SECRET when Learning + Continuous are ON.
            </p>
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h3 className="font-semibold">Amber operational metrics</h3>
            <p className="mt-1 text-xs text-white/50">Evaluating Amber — not customer social reach.</p>
            {data.launchOps ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div>
                  Cycles completed: <strong>{data.launchOps.cyclesCompleted}</strong>
                </div>
                <div>
                  Cycles failed: <strong>{data.launchOps.cyclesFailed}</strong>
                </div>
                <div>
                  Avg duration: <strong>{Math.round(data.launchOps.avgDurationMs / 1000)}s</strong>
                </div>
                <div>
                  Owner interventions: <strong>{data.launchOps.ownerInterventions}</strong>
                </div>
                <div>
                  Learning updates: <strong>{data.launchOps.learningUpdates}</strong>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/50">No ops metrics yet — run a Learning cycle.</p>
            )}
            {data.launchOps?.recentRuns?.length ? (
              <ul className="mt-4 max-h-48 space-y-2 overflow-auto text-xs text-white/70">
                {data.launchOps.recentRuns.slice(0, 12).map((r) => (
                  <li key={r.id} className="border-b border-white/5 pb-1">
                    <span className="text-[#ff8892]">{r.status}</span>{" "}
                    <span className="font-mono text-white/40">{String(r.userId).slice(0, 8)}…</span>{" "}
                    {r.goal?.slice(0, 60) || "—"}{" "}
                    <span className="text-white/40">({Math.round(Number(r.durationMs || 0) / 1000)}s)</span>
                    {r.error ? <span className="text-red-300"> {r.error}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "health" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Business Health</h2>
            <p className="mt-1 text-xs text-white/50">
              Reelo workspace metrics only — not social platform reach, views, or engagement unless a real adapter
              returns them.
            </p>
            <button
              type="button"
              disabled={busy || !testerId}
              onClick={async () => {
                await post({ action: "compute_health", userId: testerId });
                setFlash("Health snapshot saved.");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Compute health now
            </button>
            {data.tester?.bos?.health ? (
              <pre className="mt-3 max-h-80 overflow-auto text-xs text-white/70">
                {JSON.stringify(data.tester.bos.health, null, 2)}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-white/50">No health snapshot yet — pick a tester and compute.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "goals" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Objectives</h2>
            <textarea
              className="mt-3 min-h-[80px] w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm"
              placeholder="Business objective (e.g. Increase airport transportation bookings)"
              value={objectiveGoal}
              onChange={(e) => setObjectiveGoal(e.target.value)}
              disabled={!testerId}
            />
            <button
              type="button"
              disabled={busy || !testerId || !objectiveGoal.trim()}
              onClick={async () => {
                await post({ action: "save_objective", userId: testerId, goal: objectiveGoal.trim() });
                setFlash("Objective saved — Amber will expand plan.");
                setObjectiveGoal("");
              }}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Save objective
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {(data.tester?.bos?.objectives || []).map((o) => (
                <li key={String(o.id)} className="border-b border-white/5 pb-2">
                  <span className="text-[#ff8892]">{String(o.status)}</span> {String(o.goal)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "departments" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Departments</h2>
            <button
              type="button"
              disabled={busy || !testerId}
              onClick={async () => {
                await post({ action: "ensure_departments", userId: testerId });
                setFlash("Departments ensured.");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Ensure departments
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {(data.tester?.bos?.departments || []).map((d) => (
                <li key={String(d.id)} className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2">
                  <strong>{String(d.label)}</strong>
                  <span className="text-white/50">{String(d.status)}</span>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs text-[#ff8892] underline"
                    onClick={async () => {
                      await post({
                        action: "set_department",
                        userId: testerId,
                        slug: d.slug,
                        paused: d.status !== "paused",
                      });
                    }}
                  >
                    {d.status === "paused" ? "Activate" : "Pause"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "executive" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Executive Brain</h2>
            <button
              type="button"
              disabled={busy || !testerId}
              onClick={async () => {
                await post({ action: "build_executive_brief", userId: testerId, goal: objectiveGoal || undefined });
                setFlash("Executive brief built.");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Build executive brief
            </button>
            {data.tester?.bos?.executive ? (
              <pre className="mt-3 max-h-96 overflow-auto text-xs text-white/70">
                {JSON.stringify(data.tester.bos.executive, null, 2)}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-white/50">No brief yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "memory" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Company Memory</h2>
            <input
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              placeholder="Memory title"
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              disabled={!testerId}
            />
            <textarea
              className="mt-2 min-h-[60px] w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm"
              placeholder="Body / preference note"
              value={memoryBody}
              onChange={(e) => setMemoryBody(e.target.value)}
              disabled={!testerId}
            />
            <button
              type="button"
              disabled={busy || !testerId || !memoryTitle.trim()}
              onClick={async () => {
                await post({
                  action: "write_memory",
                  userId: testerId,
                  kind: "preference",
                  title: memoryTitle.trim(),
                  body: memoryBody,
                });
                setFlash("Memory saved.");
                setMemoryTitle("");
                setMemoryBody("");
              }}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Write memory
            </button>
            <ul className="mt-4 max-h-72 space-y-2 overflow-auto text-sm">
              {(data.tester?.bos?.memory || []).map((m) => (
                <li key={String(m.id)} className="border-b border-white/5 pb-2">
                  <span className="text-[#ff8892]">[{String(m.kind)}]</span> {String(m.title)}
                  <p className="text-xs text-white/50">{String(m.body || "").slice(0, 160)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "improvements" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Improvements</h2>
            <button
              type="button"
              disabled={busy || !testerId}
              onClick={async () => {
                await post({ action: "generate_improvements", userId: testerId });
                setFlash("Improvements generated.");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Generate improvements
            </button>
            <ul className="mt-4 space-y-3 text-sm">
              {(data.tester?.bos?.improvements || []).map((imp) => (
                <li key={String(imp.id)} className="border-b border-white/5 pb-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[#ff8892]">{String(imp.area)}</span>
                    <span className="text-white/40">{String(imp.status)}</span>
                    <span className="text-white/40">{String(imp.effort)}</span>
                  </div>
                  <p>{String(imp.recommendation)}</p>
                  <div className="mt-1 flex gap-2 text-xs">
                    {(["accepted", "dismissed", "done"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        className="underline text-white/60"
                        disabled={busy}
                        onClick={async () => {
                          await post({
                            action: "set_improvement_status",
                            userId: testerId,
                            improvementId: imp.id,
                            status: st,
                          });
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "control" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Feature flag</h2>
            <p className="mt-1 text-sm text-white/60">
              OFF by default. When ON, only Super Admin + <code className="text-[#ff8892]">AMBER_ADMIN_EMAILS</code>.
            </p>
            <p className="mt-2 text-sm font-bold" style={{ color: data.flagEnabled ? "#5fd08a" : "#ff8a92" }}>
              Status: {data.flagEnabled ? "ON (admin testing)" : "OFF"}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy || data.flagEnabled}
                onClick={async () => {
                  await post({ action: "set_flag", enabled: true });
                  setFlash("Amber Autonomous Mode ON.");
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Enable
              </button>
              <button
                type="button"
                disabled={busy || !data.flagEnabled}
                onClick={async () => {
                  await post({ action: "set_flag", enabled: false });
                  setFlash("Amber Autonomous Mode OFF.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80 disabled:opacity-40"
              >
                Disable
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ ...card, border: "1px solid rgba(255,60,60,.55)" }}>
            <h2 className="font-display text-xl font-bold text-[#ff8a92]">Emergency stop</h2>
            <p className="mt-1 text-sm text-white/60">
              Blocks all Amber ops / weekly / publish paths even when the flag is ON.
            </p>
            <p className="mt-2 text-sm font-bold" style={{ color: data.emergencyStop ? "#ff8a92" : "#5fd08a" }}>
              {data.emergencyStop ? "STOP ENGAGED" : "Clear — operations allowed when flag ON"}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy || data.emergencyStop}
                onClick={async () => {
                  await post({ action: "set_emergency_stop", stopped: true });
                  setFlash("Emergency stop ON.");
                }}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Engage stop
              </button>
              <button
                type="button"
                disabled={busy || !data.emergencyStop}
                onClick={async () => {
                  await post({ action: "set_emergency_stop", stopped: false });
                  setFlash("Emergency stop cleared.");
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80 disabled:opacity-40"
              >
                Clear stop
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-lg font-bold">Approval & brand rules</h2>
            <p className="mt-1 text-sm text-white/55">Saved on the selected tester&apos;s business profile.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="text-sm">
                Approval mode{" "}
                <select
                  className="ml-2 rounded border border-white/15 bg-black/40 px-2 py-1"
                  value={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.value === "auto" ? "auto" : "require")}
                >
                  <option value="require">require</option>
                  <option value="auto">auto</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.autoGenerate}
                  disabled={busy}
                  onChange={async (e) => {
                    await post({ action: "set_auto_generate", enabled: e.target.checked });
                    setFlash(e.target.checked ? "Auto-generate ON." : "Auto-generate OFF.");
                  }}
                />
                amber_auto_generate (default OFF)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(data.continuousCycle)}
                  disabled={busy}
                  onChange={async (e) => {
                    await post({ action: "set_continuous_cycle", enabled: e.target.checked });
                    setFlash(e.target.checked ? "Continuous cycle ON." : "Continuous cycle OFF.");
                  }}
                />
                continuous weekly cycle (cron-ready flag)
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">
              {(
                [
                  ["weeklyReport", "Weekly reports"],
                  ["verificationHolds", "Verification holds"],
                  ["publishFailures", "Publish failures"],
                  ["missionComplete", "Mission complete"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Boolean(data.notifyPrefs?.[key])}
                    disabled={busy}
                    onChange={async (e) => {
                      await post({ action: "set_notify_prefs", [key]: e.target.checked });
                      setFlash("Notification prefs saved.");
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <textarea
              className="mt-3 min-h-[120px] w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm"
              placeholder="Brand rules: do/don't, claims, CTAs…"
              value={brandRules}
              onChange={(e) => setBrandRules(e.target.value)}
              disabled={!testerId}
            />
            <button
              type="button"
              disabled={busy || !testerId}
              onClick={async () => {
                await post({
                  action: "save_brand_rules",
                  userId: testerId,
                  brandRules,
                  approvalMode,
                });
                setFlash("Brand rules saved.");
              }}
              className="mt-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Save rules
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Connected accounts", data.summary.connectedAccounts],
              ["Amber calendar placements", data.summary.amberPlaced],
              ["Log errors (approx)", data.summary.errorLike],
            ].map(([label, n]) => (
              <div key={String(label)} className="rounded-xl p-4" style={card}>
                <p className="text-xs text-white/50">{label}</p>
                <p className="mt-1 text-2xl font-bold">{n as number}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "setup" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Business setup agent</h2>
            <p className="mt-1 text-sm text-white/60">
              Plan + track email / service structure. Does not provision Google Workspace or Microsoft 365.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={() => void setupGenerate()}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Generate email / infra plan
            </button>
            <p className="mt-2 text-xs text-white/45">Plan + track only — no mailbox provisioning.</p>
          </div>
          {data.tester ? (
            <>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Infra emails</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/75">
                  {data.tester.emails.length === 0 ? <li>None yet.</li> : null}
                  {data.tester.emails.map((e) => (
                    <li key={e.id}>
                      <span className="text-[#ff8892]">{e.role}</span> — {e.email}
                      {e.notes ? <span className="text-white/45"> ({e.notes})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Service links</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/75">
                  {data.tester.services.map((s) => (
                    <li key={s.id}>
                      {s.service}: <span className="text-white/50">{s.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Social → infra map</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/75">
                  {data.tester.accountMap.length === 0 ? <li>No mappings.</li> : null}
                  {data.tester.accountMap.map((m) => (
                    <li key={m.socialAccountId}>
                      {m.provider}:@{m.handle} → {m.infraRole}
                    </li>
                  ))}
                </ul>
                {data.tester.accounts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {data.tester.accounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        disabled={busy}
                        className="mr-2 rounded border border-white/15 px-2 py-1 text-xs"
                        onClick={async () => {
                          const json = await post({
                            action: "map_account",
                            userId: testerId,
                            socialAccountId: a.id,
                            infraRole: "social",
                          });
                          if (json?.ok) setFlash(`Mapped ${a.provider}:@${a.handle}`);
                        }}
                      >
                        Map {a.provider}:@{a.handle} → social
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-white/45">No connected accounts (or keys_needed) for this user.</p>
                )}
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Verification holds</h3>
                <p className="mt-1 text-xs text-white/45">
                  Amber pauses only the blocked step when a provider needs owner identity/legal/payment verification.
                </p>
                <button
                  type="button"
                  disabled={busy || !testerId}
                  className="mt-2 rounded border border-white/15 px-3 py-1 text-xs"
                  onClick={async () => {
                    const json = await post({ action: "detect_holds", userId: testerId });
                    if (json?.ok) setFlash(`Detected ${(json.holds || []).length} hold(s).`);
                  }}
                >
                  Scan infra / OAuth needs
                </button>
                <ul className="mt-2 space-y-2 text-sm">
                  {(data.tester.holds || []).map((h) => (
                    <li key={h.id} className="border-b border-white/5 pb-2">
                      <span className="text-[#ff8892]">{h.status}</span> {h.provider}/{h.step}
                      <p className="text-white/55 text-xs">{h.explanation}</p>
                      {h.status === "paused" ? (
                        <button
                          type="button"
                          className="mt-1 text-xs underline"
                          disabled={busy}
                          onClick={async () => {
                            await post({ action: "resolve_hold", userId: testerId, holdId: h.id });
                            setFlash("Hold resolved.");
                          }}
                        >
                          Mark resolved / resume
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/50">Select a tester user to view setup.</p>
          )}
        </div>
      ) : null}

      {tab === "intel" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Business intelligence</h2>
            <p className="mt-1 text-sm text-white/60">
              Amber understands the business: profile, competitors, services, seasonal trends, objectives.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({ action: "refresh_intelligence", userId: testerId });
                if (json?.ok) setFlash(String(json.insights?.summary || "BI refreshed."));
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Refresh from workspace
            </button>
          </div>
          {data.tester ? (
            <div className="rounded-2xl p-5 space-y-2" style={card}>
              {(
                [
                  ["competitors", "Competitors"],
                  ["serviceAreas", "Service areas"],
                  ["seasonalTrends", "Seasonal trends"],
                  ["products", "Products"],
                  ["services", "Services"],
                  ["marketingObjectives", "Marketing objectives"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs text-white/50">
                  {label}
                  <textarea
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 p-2 text-sm text-white"
                    rows={2}
                    value={intelDraft[key]}
                    onChange={(e) => setIntelDraft((d) => ({ ...d, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <button
                type="button"
                disabled={busy || !testerId}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                onClick={async () => {
                  await post({ action: "save_intelligence", userId: testerId, ...intelDraft });
                  setFlash("Intelligence saved.");
                }}
              >
                Save intelligence
              </button>
              {data.tester.intelligence?.intelligence ? (
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-white/60">
                  {JSON.stringify(data.tester.intelligence.intelligence, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-white/50">Select a tester user.</p>
          )}
        </div>
      ) : null}

      {tab === "mission" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Business mission</h2>
            <p className="mt-1 text-sm text-white/60">
              Give Amber a goal. She runs strategy → video productions → brand review → calendar → publish queue →
              learning. Owner sets direction; Amber executes.
            </p>
            <textarea
              className="mt-3 min-h-[90px] w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm"
              value={missionGoal}
              onChange={(e) => setMissionGoal(e.target.value)}
              disabled={!testerId}
              placeholder="e.g. Increase awareness for my transportation business."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop || !missionGoal.trim()}
                onClick={async () => {
                  setMissionResult("");
                  const json = await post({
                    action: "execute_mission",
                    userId: testerId,
                    goal: missionGoal.trim(),
                  });
                  if (json?.ok) {
                    setFlash(`Mission ${json.missionId} → ${json.status}`);
                    setMissionResult(JSON.stringify(json.report || json, null, 2));
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Execute full cycle
              </button>
              <button
                type="button"
                disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop || !missionGoal.trim()}
                onClick={async () => {
                  const json = await post({
                    action: "create_mission",
                    userId: testerId,
                    goal: missionGoal.trim(),
                  });
                  if (json?.ok) setFlash(`Mission saved: ${json.missionId}`);
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80 disabled:opacity-40"
              >
                Save mission only
              </button>
            </div>
            {missionResult ? (
              <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-white/70">
                {missionResult}
              </pre>
            ) : null}
          </div>
          {data.tester ? (
            <>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Missions</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {(data.tester.missions || []).length === 0 ? (
                    <li className="text-white/50">No missions yet.</li>
                  ) : null}
                  {(data.tester.missions || []).map((m) => (
                    <li key={m.id} className="border-b border-white/5 pb-2">
                      <span className="text-[#ff8892]">{m.status}</span> — {m.goal}
                      <button
                        type="button"
                        disabled={busy}
                        className="ml-2 text-xs underline text-white/50"
                        onClick={async () => {
                          setMissionResult("");
                          const json = await post({
                            action: "execute_mission",
                            userId: testerId,
                            missionId: m.id,
                          });
                          if (json?.ok) {
                            setFlash(`Re-ran ${m.id}`);
                            setMissionResult(JSON.stringify(json.report || json, null, 2));
                          }
                        }}
                      >
                        Re-run
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Video productions</h3>
                <ul className="mt-2 max-h-56 space-y-1 overflow-auto text-sm text-white/75">
                  {(data.tester.productions || []).map((p) => (
                    <li key={p.id}>
                      {p.parentId ? "↳ " : ""}
                      {p.title}{" "}
                      <Link className="text-[#ff8892] underline" href={`/tools/${p.toolSlug}`}>
                        {p.toolSlug}
                      </Link>{" "}
                      <span className="text-white/40">
                        {p.status}/{p.reviewStatus}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-white/45">
                  Library packages are script briefs until rendered via live tools. Publish never fakes Posted.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/50">Select a tester user first.</p>
          )}
        </div>
      ) : null}

      {tab === "review" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Content review</h2>
            <p className="mt-1 text-sm text-white/60">
              Amber checks brand rules, goals, quality, platform fit, and messaging before calendar placement.
            </p>
          </div>
          {data.tester ? (
            <div className="rounded-2xl p-5" style={card}>
              <ul className="space-y-3 text-sm">
                {(data.tester.productions || [])
                  .filter((p) => p.parentId)
                  .slice(0, 30)
                  .map((p) => (
                    <li key={p.id} className="border-b border-white/5 pb-3">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-white/45">
                        {p.reviewStatus}
                        {p.reviewNotes ? ` — ${p.reviewNotes}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["approve", "improve", "reject"] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            disabled={busy}
                            className="rounded border border-white/15 px-2 py-1 text-xs capitalize"
                            onClick={async () => {
                              const json = await post({
                                action: "review_production",
                                userId: testerId,
                                productionId: p.id,
                                decision: d,
                              });
                              if (json?.ok) setFlash(`${d}: ${p.title}`);
                            }}
                          >
                            {d}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded border border-white/15 px-2 py-1 text-xs"
                          onClick={async () => {
                            const json = await post({
                              action: "review_production",
                              userId: testerId,
                              productionId: p.id,
                            });
                            if (json?.ok) setFlash(`Amber review → ${json.reviewStatus}`);
                          }}
                        >
                          Amber review
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/50">Select a tester user.</p>
          )}
        </div>
      ) : null}

      {tab === "campaigns" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Campaign builder</h2>
            <p className="mt-1 text-sm text-white/60">
              Complete reusable campaigns: audience, scripts, captions, CTAs, schedule, platform variations.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({
                  action: "build_campaign",
                  userId: testerId,
                  objective: missionGoal.trim(),
                });
                if (json?.ok) setFlash(`Campaign ${json.campaignId}`);
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Build campaign from goal
            </button>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({ action: "retry_productions", userId: testerId });
                if (json?.ok) setFlash(`Retried ${(json.retried || []).length} production(s)`);
              }}
              className="ml-2 mt-3 rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80 disabled:opacity-40"
            >
              Retry failed productions
            </button>
          </div>
          {data.tester ? (
            <div className="rounded-2xl p-5" style={card}>
              <ul className="space-y-2 text-sm">
                {(data.tester.campaigns || []).map((c) => (
                  <li key={c.id} className="border-b border-white/5 pb-2">
                    <span className="text-[#ff8892]">{c.status}</span> — {c.title}
                    <p className="text-xs text-white/45">{c.objective}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "decisions" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Decision engine</h2>
            <p className="mt-1 text-sm text-white/60">
              Amber prioritizes promote / pause / improve / invest / wait like a department manager.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({ action: "run_decisions", userId: testerId });
                if (json?.ok) setFlash(`${(json.decisions || []).length} decisions`);
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Run decision engine
            </button>
          </div>
          {data.tester ? (
            <div className="rounded-2xl p-5" style={card}>
              <ul className="space-y-2 text-sm">
                {(data.tester.decisions || []).map((d) => (
                  <li key={d.id} className="border-b border-white/5 pb-2">
                    <span className="font-mono text-xs text-white/40">P{d.priority}</span>{" "}
                    <span className="text-[#ff8892]">{d.kind}</span> — {d.title}
                    <p className="text-xs text-white/55">{d.rationale}</p>
                    <p className="text-xs text-white/40">Action: {d.action}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "agents" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Agent collaboration</h2>
            <p className="mt-1 text-sm text-white/60">
              Amber assigns Video, Research, SEO, Design, Sales, Analytics workers while remaining accountable.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({
                  action: "assign_agents",
                  userId: testerId,
                  goal: missionGoal.trim(),
                });
                if (json?.ok) setFlash(`Assigned ${(json.jobs || []).length} jobs`);
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Assign agent jobs
            </button>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({ action: "rebalance_calendar", userId: testerId });
                if (json?.ok) setFlash(`Rebalanced ${json.updated || 0} items`);
              }}
              className="ml-2 mt-3 rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80 disabled:opacity-40"
            >
              Rebalance calendar
            </button>
          </div>
          {data.tester ? (
            <>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Recent agent jobs</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {(data.tester.agentJobs || []).map((j) => (
                    <li key={j.id}>
                      <span className="text-[#ff8892]">{j.agent}</span> — {j.title}{" "}
                      <span className="text-white/40">{j.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Infrastructure recommendations</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {(data.tester.infraRecommendations || []).map((r, i) => (
                    <li key={i}>
                      <span className="text-[#ff8892]">{r.severity}</span> [{r.area}] {r.detail}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "cycle" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Weekly autonomous cycle</h2>
            <p className="mt-1 text-sm text-white/60">
              Review → analyze → strategy → content → review → calendar → performance → learn → executive report →
              next week.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                setCycleResult("");
                const json = await post({
                  action: "run_cycle",
                  userId: testerId,
                  goal: missionGoal.trim() || undefined,
                });
                if (json?.ok) {
                  setFlash(`Cycle ${json.cycleId} → report ${json.reportId}`);
                  setCycleResult(JSON.stringify(json, null, 2));
                }
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Run Amber 32 BOS cycle now
            </button>
            <p className="mt-2 text-xs text-white/45">
              Health → Executive → Decisions → Departments → Campaign → Workers → QA → Memory → Learning → Report
            </p>
            {cycleResult ? (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-white/70">
                {cycleResult}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Executive reports</h2>
            <p className="mt-1 text-sm text-white/60">
              Owner-facing weekly summaries: videos, campaigns, posts, problems, recommended actions. Honest Reelo
              metrics only.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                const json = await post({ action: "generate_report", userId: testerId });
                if (json?.ok) setFlash(String(json.summary || "Report generated.").slice(0, 200));
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Generate report now
            </button>
          </div>
          {data.tester ? (
            <div className="rounded-2xl p-5" style={card}>
              <ul className="space-y-3 text-sm">
                {(data.tester.reports || []).length === 0 ? (
                  <li className="text-white/50">No reports yet — run Cycle or Generate.</li>
                ) : null}
                {(data.tester.reports || []).map((r) => (
                  <li key={r.id} className="border-b border-white/5 pb-3">
                    <span className="font-mono text-xs text-white/40">{r.period}</span>
                    <p className="mt-1 text-white/80">{r.summary}</p>
                    {r.body?.recommendedActions ? (
                      <p className="mt-1 text-xs text-white/45">
                        Actions: {JSON.stringify(r.body.recommendedActions)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "week" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-xl font-bold">Weekly marketing engine</h2>
            <p className="mt-1 text-sm text-white/60">
              Runs review → strategy → content requests → captions → calendar placement → report + learning.
            </p>
            <button
              type="button"
              disabled={busy || !testerId || !data.flagEnabled || data.emergencyStop}
              onClick={async () => {
                setWeekResult("");
                const json = await post({ action: "run_week", userId: testerId });
                if (json?.ok) {
                  setFlash(`Week ${json.weekId} → ${json.status}`);
                  setWeekResult(JSON.stringify(json.report || json, null, 2));
                }
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Run weekly cycle now
            </button>
            {weekResult ? (
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-white/70">
                {weekResult}
              </pre>
            ) : null}
          </div>
          {data.tester ? (
            <>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Weeks</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {data.tester.weeks.length === 0 ? <li className="text-white/50">No weeks yet.</li> : null}
                  {data.tester.weeks.map((w) => (
                    <li key={w.id} className="border-b border-white/5 pb-2">
                      <span className="font-mono text-xs text-white/40">{w.weekStart}</span>{" "}
                      <span className="text-[#ff8892]">{w.status}</span>
                      <p className="text-white/60">{String(w.report?.strategySummary || w.strategy?.strategySummary || "—")}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">Content requests</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/75">
                  {data.tester.contentRequests.map((c) => (
                    <li key={c.id}>
                      {c.title}{" "}
                      <Link className="text-[#ff8892] underline" href={`/tools/${c.toolSlug}`}>
                        {c.toolSlug}
                      </Link>{" "}
                      <span className="text-white/40">{c.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-5" style={card}>
                <h3 className="font-semibold">What Amber learned</h3>
                {learningSummary ? (
                  <pre className="mt-2 max-h-48 overflow-auto text-xs text-white/70">
                    {JSON.stringify(learningSummary, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm text-white/50">No learning row yet — run a weekly cycle.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "social" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-lg font-bold">Connected accounts</h2>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
              {(data.tester?.accounts || data.accounts).slice(0, 40).map((a) => (
                <li key={a.id}>
                  {a.provider}:@{a.handle} — <span className="text-white/50">{a.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-lg font-bold">Calendar (Amber-placed)</h2>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
              {(data.tester?.schedules || data.schedules.filter((s) => s.amberPlaced)).slice(0, 30).map((s) => (
                <li key={s.id}>
                  {s.title} — {s.approvalStatus}
                  {"amberPlaced" in s && s.amberPlaced ? " · amber" : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-display text-lg font-bold">Publish queue</h2>
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
              {(data.tester?.publish || data.publish).slice(0, 30).map((p) => (
                <li key={p.id}>
                  {p.title} — {p.status}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/45">
              Publish uses honest OAuth adapters — failures surface as real adapter errors, never fake Posted.
            </p>
            <Link href="/business-center/social" className="mt-2 inline-block text-sm text-[#ff8892] underline">
              Open BC Social (admin-gated)
            </Link>
          </div>
        </div>
      ) : null}

      {tab === "logs" ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-white/50">Filter by kind</label>
                <select
                  className="mt-1 block rounded border border-white/15 bg-black/40 px-2 py-1 text-sm"
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {data.logKinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="rounded border border-white/15 px-3 py-1 text-sm"
                onClick={() => void load()}
              >
                Refresh
              </button>
            </div>
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto text-sm">
              {data.logs.map((l) => (
                <li key={l.id} className="border-b border-white/5 pb-2">
                  <span className="font-mono text-[10px] text-white/35">{String(l.createdAt).slice(0, 19)}</span>{" "}
                  <span className="text-[#ff8892]">{l.kind}</span> — {l.title}
                  {l.actorEmail ? <span className="text-white/40"> · {l.actorEmail}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          {learningSummary ? (
            <div className="rounded-2xl p-5" style={card}>
              <h3 className="font-semibold">Learning summary (tester)</h3>
              <pre className="mt-2 max-h-40 overflow-auto text-xs text-white/70">
                {JSON.stringify(learningSummary, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
