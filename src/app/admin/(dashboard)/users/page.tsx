"use client";

import { useMemo, useState } from "react";
import { USERS, PLANS, type AdminUser, type PlanName, fmtMoney } from "@/lib/admin";

type SortKey = "name" | "plan" | "tokens" | "spend" | "joined" | "lastActive";

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUser[]>(USERS);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "joined", dir: -1 });
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const view = useMemo(() => {
    let r = rows.filter((u) => {
      const matchesQ = !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase());
      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesQ && matchesPlan && matchesStatus;
    });
    r = [...r].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av < bv) return -1 * sort.dir;
      if (av > bv) return 1 * sort.dir;
      return 0;
    });
    return r;
  }, [rows, q, planFilter, statusFilter, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  const update = (id: string, patch: Partial<AdminUser>) => {
    setRows((rs) => rs.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };
  const remove = (id: string) => {
    setRows((rs) => rs.filter((u) => u.id !== id));
    setSelected(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-[28px]">Users</h1>
          <p className="mt-1 text-sm text-white/50">{view.length} of {rows.length} users</p>
        </div>
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3.5 sm:max-w-xs" style={fieldStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a8b8d" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/35 outline-none" />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle}>
          <option value="all" className="bg-[#140a0c]">All plans</option>
          {PLANS.map((p) => <option key={p.name} value={p.name} className="bg-[#140a0c]">{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle}>
          <option value="all" className="bg-[#140a0c]">All statuses</option>
          <option value="active" className="bg-[#140a0c]">Active</option>
          <option value="suspended" className="bg-[#140a0c]">Suspended</option>
        </select>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
              <Th label="User" onClick={() => toggleSort("name")} active={sort.key === "name"} dir={sort.dir} />
              <Th label="Plan" onClick={() => toggleSort("plan")} active={sort.key === "plan"} dir={sort.dir} />
              <Th label="Tokens" onClick={() => toggleSort("tokens")} active={sort.key === "tokens"} dir={sort.dir} />
              <Th label="Spend" onClick={() => toggleSort("spend")} active={sort.key === "spend"} dir={sort.dir} />
              <Th label="Status" />
              <Th label="Joined" onClick={() => toggleSort("joined")} active={sort.key === "joined"} dir={sort.dir} />
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {view.map((u) => (
              <tr key={u.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(u)} className="flex items-center gap-3 text-left">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#8c0c14)" }}>{u.name[0]}</span>
                    <span>
                      <span className="block font-medium text-white">{u.name}</span>
                      <span className="block text-xs text-white/40">{u.email}</span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(255,70,85,.12)", color: "#ff8a92" }}>{u.plan}</span></td>
                <td className="px-4 py-3 text-white/80">{u.tokens}</td>
                <td className="px-4 py-3 text-white/80">{fmtMoney(u.spend)}</td>
                <td className="px-4 py-3"><StatusPill status={u.status} /></td>
                <td className="px-4 py-3 text-white/60">{u.joined}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => update(u.id, { status: u.status === "active" ? "suspended" : "active" })} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ border: "1px solid rgba(255,70,85,.25)", color: u.status === "active" ? "#ff9f43" : "#2ecc71" }}>{u.status === "active" ? "Suspend" : "Activate"}</button>
                    <button onClick={() => setSelected(u)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/70" style={{ border: "1px solid rgba(255,255,255,.12)" }}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-white/40">No users match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <UserDrawer user={selected} onClose={() => setSelected(null)} onSave={(patch) => update(selected.id, patch)} onDelete={() => remove(selected.id)} />}
    </div>
  );
}

const fieldStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;

function Th({ label, onClick, active, dir }: { label: string; onClick?: () => void; active?: boolean; dir?: 1 | -1 }) {
  return (
    <th className="px-4 py-3 font-semibold">
      {onClick ? (
        <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? "text-white" : ""}`}>
          {label}
          <span className="text-[9px]">{active ? (dir === 1 ? "▲" : "▼") : "↕"}</span>
        </button>
      ) : label}
    </th>
  );
}

function StatusPill({ status }: { status: "active" | "suspended" }) {
  const on = status === "active";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: on ? "rgba(46,204,113,.12)" : "rgba(255,159,67,.12)", color: on ? "#2ecc71" : "#ff9f43" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#2ecc71" : "#ff9f43" }} />
      {on ? "Active" : "Suspended"}
    </span>
  );
}

function UserDrawer({ user, onClose, onSave, onDelete }: { user: AdminUser; onClose: () => void; onSave: (patch: Partial<AdminUser>) => void; onDelete: () => void }) {
  const [plan, setPlan] = useState<PlanName>(user.plan);
  const [tokens, setTokens] = useState(String(user.tokens));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative h-full w-full max-w-[420px] overflow-y-auto border-l border-white/10 bg-[#0d0709] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#8c0c14)" }}>{user.name[0]}</span>
            <div>
              <div className="font-display text-lg font-bold">{user.name}</div>
              <div className="text-sm text-white/45">{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="Status"><StatusPill status={user.status} /></Info>
          <Info label="Country">{user.country}</Info>
          <Info label="Joined">{user.joined}</Info>
          <Info label="Last active">{user.lastActive}</Info>
          <Info label="Lifetime spend">{fmtMoney(user.spend)}</Info>
          <Info label="User ID"><span className="font-mono text-xs">{user.id}</span></Info>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-sm font-semibold text-white/80">Edit account</div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value as PlanName)} className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle}>
              {PLANS.map((p) => <option key={p.name} value={p.name} className="bg-[#140a0c]">{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Tokens</label>
            <input value={tokens} onChange={(e) => setTokens(e.target.value.replace(/[^0-9]/g, ""))} className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle} />
          </div>
          <button onClick={() => onSave({ plan, tokens: Number(tokens) || 0 })} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Save changes</button>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => onSave({ status: user.status === "active" ? "suspended" : "active" })} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ border: "1px solid rgba(255,70,85,.3)", color: user.status === "active" ? "#ff9f43" : "#2ecc71" }}>{user.status === "active" ? "Suspend user" : "Activate user"}</button>
          <button onClick={onDelete} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#ff5663]" style={{ border: "1px solid rgba(255,86,99,.4)" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-white/85">{children}</div>
    </div>
  );
}
