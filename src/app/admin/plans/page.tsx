"use client";

import { useState } from "react";
import { PLANS, USERS, type Plan, fmtMoney } from "@/lib/admin";

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ price: string; tokens: string }>({ price: "", tokens: "" });

  const startEdit = (p: Plan) => {
    setEditing(p.name);
    setDraft({ price: String(p.price), tokens: String(p.tokens) });
  };
  const save = (name: string) => {
    setPlans((ps) => ps.map((p) => (p.name === name ? { ...p, price: Number(draft.price) || 0, tokens: Number(draft.tokens) || 0 } : p)));
    setEditing(null);
  };
  const toggle = (name: string) => setPlans((ps) => ps.map((p) => (p.name === name ? { ...p, active: !p.active } : p)));

  const subsFor = (name: string) => USERS.filter((u) => u.plan === name && u.status === "active").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-[28px]">Plans</h1>
      <p className="mt-1 text-sm text-white/50">Manage pricing tiers, token allowances, and availability.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isEditing = editing === p.name;
          const subs = subsFor(p.name);
          return (
            <div key={p.name} className="rounded-2xl border border-white/10 bg-black/40 p-5" style={!p.active ? { opacity: 0.55 } : undefined}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-wider" style={{ color: "#ff8a92" }}>{p.name}</div>
                  <div className="mt-0.5 text-xs text-white/40">{subs} active {subs === 1 ? "subscriber" : "subscribers"}</div>
                </div>
                <button onClick={() => toggle(p.name)} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={p.active ? { background: "rgba(46,204,113,.14)", color: "#2ecc71" } : { background: "rgba(255,255,255,.08)", color: "#9a8b8d" }}>{p.active ? "Live" : "Hidden"}</button>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/45">Price / month ($)</label>
                    <input value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value.replace(/[^0-9.]/g, "") }))} className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none" style={fieldStyle} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/45">Tokens</label>
                    <input value={draft.tokens} onChange={(e) => setDraft((d) => ({ ...d, tokens: e.target.value.replace(/[^0-9]/g, "") }))} className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none" style={fieldStyle} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => save(p.name)} className="flex-1 rounded-xl px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Save</button>
                    <button onClick={() => setEditing(null)} className="rounded-xl px-3 py-2 text-sm font-semibold text-white/60" style={{ border: "1px solid rgba(255,255,255,.12)" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-white">{fmtMoney(p.price)}</span>
                    <span className="text-sm text-white/40">/mo</span>
                  </div>
                  <div className="mt-2 text-sm text-white/60">{p.tokens.toLocaleString()} tokens / month</div>
                  <button onClick={() => startEdit(p)} className="mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold text-white/80" style={{ border: "1px solid rgba(255,70,85,.25)" }}>Edit plan</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const fieldStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;
