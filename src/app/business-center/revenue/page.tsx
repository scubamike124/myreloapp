import BusinessShell from "@/components/design/BusinessShell";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import SoonBanner from "@/components/design/SoonBanner";

export const metadata = { title: "Revenue — Reelo" };

const STATS: { icon: IconKey; v: string; l: string; delta?: string }[] = [
  { icon: "dollar", v: "$12.4K", l: "Total Revenue", delta: "↑ 18% this month" },
  { icon: "growth", v: "$3.2K", l: "This Month", delta: "↑ 9% vs last" },
  { icon: "clock", v: "$890", l: "Pending Payout", delta: "Next: Jul 1" },
  { icon: "users", v: "1,284", l: "Subscribers", delta: "↑ 124 new" },
];

const TX = [
  { src: "Creator Plan — Annual", date: "Jun 26, 2026", amount: "+$190.00", status: "Paid" },
  { src: "Token Pack — 100", date: "Jun 24, 2026", amount: "+$69.99", status: "Paid" },
  { src: "Pro Plan — Monthly", date: "Jun 22, 2026", amount: "+$49.99", status: "Paid" },
  { src: "Refund — Core Plan", date: "Jun 20, 2026", amount: "−$49.00", status: "Refunded" },
  { src: "Token Pack — 500", date: "Jun 18, 2026", amount: "+$249.99", status: "Paid" },
];

export default function RevenuePage() {
  return (
    <BusinessShell active="revenue" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Revenue</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>Monitor your earnings and growth.</p>
      </div>

      <SoonBanner feature="Revenue" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
            <div className="mb-2 flex items-center justify-between"><BIcon name={s.icon} size={22} /></div>
            <div className="font-display text-2xl font-bold">{s.v}</div>
            <div className="text-xs" style={{ color: "#8e7f81" }}>{s.l}</div>
            {s.delta && <div className="mt-1 text-[11px]" style={{ color: "#5fd08a" }}>{s.delta}</div>}
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="mb-6 rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
        <div className="mb-3 flex items-center justify-between"><span className="font-display font-bold">Revenue Trend</span><span className="text-xs" style={{ color: "#8e7f81" }}>Last 6 months</span></div>
        <svg viewBox="0 0 600 160" className="h-40 w-full" preserveAspectRatio="none">
          <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,70,85,.4)" /><stop offset="1" stopColor="rgba(255,70,85,0)" /></linearGradient></defs>
          <path d="M0 130 L100 110 L200 118 L300 80 L400 70 L500 40 L600 24" fill="none" stroke="#ff3645" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0 130 L100 110 L200 118 L300 80 L400 70 L500 40 L600 24 L600 160 L0 160 Z" fill="url(#rev)" />
        </svg>
      </div>

      {/* transactions */}
      <div className="mb-3 font-display text-lg font-bold">Recent Transactions</div>
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}>
        {TX.map((t) => (
          <div key={t.src + t.date} className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{t.src}</div><div className="text-xs" style={{ color: "#8e7f81" }}>{t.date}</div></div>
            <div className="font-display text-sm font-bold" style={{ color: t.amount.startsWith("−") ? "#ff7b85" : "#5fd08a" }}>{t.amount}</div>
            <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={t.status === "Refunded" ? { color: "#ff7b85", background: "rgba(255,70,85,.14)" } : { color: "#5fd08a", background: "rgba(95,208,138,.14)" }}>{t.status}</span>
          </div>
        ))}
      </div>
    </BusinessShell>
  );
}
