"use client";

import { useMemo, useState } from "react";
import { TRANSACTIONS, PLANS, type Transaction, type TxStatus, fmtMoney } from "@/lib/admin";

const statusColor: Record<TxStatus, string> = { paid: "#2ecc71", refunded: "#ff9f43", failed: "#ff5663" };

export default function AdminPayments() {
  const [rows, setRows] = useState<Transaction[]>(TRANSACTIONS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [plan, setPlan] = useState<string>("all");

  const view = useMemo(
    () =>
      rows
        .filter((t) => {
          const mq = !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.email.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q);
          const ms = status === "all" || t.status === status;
          const mp = plan === "all" || t.plan === plan;
          return mq && ms && mp;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [rows, q, status, plan],
  );

  const totals = useMemo(() => {
    const paid = rows.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
    const refunded = rows.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0);
    const failed = rows.filter((t) => t.status === "failed").length;
    return { paid, refunded, failed, net: paid - refunded };
  }, [rows]);

  const refund = (id: string) => setRows((rs) => rs.map((t) => (t.id === id ? { ...t, status: "refunded" } : t)));

  const cards = [
    { label: "Net revenue", value: fmtMoney(totals.net), accent: "#2ecc71" },
    { label: "Collected", value: fmtMoney(totals.paid), accent: "#ff8a92" },
    { label: "Refunded", value: fmtMoney(totals.refunded), accent: "#ff9f43" },
    { label: "Failed payments", value: String(totals.failed), accent: "#ff5663" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-[28px]">Payments</h1>
      <p className="mt-1 text-sm text-white/50">{view.length} of {rows.length} transactions</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/45">{c.label}</div>
            <div className="mt-2 font-display text-[24px] font-bold" style={{ color: c.accent }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3.5 sm:max-w-xs" style={fieldStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a8b8d" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or invoice" className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/35 outline-none" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle}>
          <option value="all" className="bg-[#140a0c]">All statuses</option>
          <option value="paid" className="bg-[#140a0c]">Paid</option>
          <option value="refunded" className="bg-[#140a0c]">Refunded</option>
          <option value="failed" className="bg-[#140a0c]">Failed</option>
        </select>
        <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={fieldStyle}>
          <option value="all" className="bg-[#140a0c]">All plans</option>
          {PLANS.map((p) => <option key={p.name} value={p.name} className="bg-[#140a0c]">{p.name}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {view.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-white/60">{t.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{t.name}</div>
                  <div className="text-xs text-white/40">{t.email}</div>
                </td>
                <td className="px-4 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(255,70,85,.12)", color: "#ff8a92" }}>{t.plan}</span></td>
                <td className="px-4 py-3 font-semibold text-white">{fmtMoney(t.amount)}</td>
                <td className="px-4 py-3 text-white/60">{t.method}</td>
                <td className="px-4 py-3 text-white/60">{t.date}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize" style={{ background: `${statusColor[t.status]}22`, color: statusColor[t.status] }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[t.status] }} />{t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {t.status === "paid" ? (
                    <button onClick={() => refund(t.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#ff9f43]" style={{ border: "1px solid rgba(255,159,67,.35)" }}>Refund</button>
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </td>
              </tr>
            ))}
            {view.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-white/40">No transactions match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const fieldStyle = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;
