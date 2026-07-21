import { kpis, revenueByMonth, planDistribution, TRANSACTIONS, USERS, fmtMoney } from "@/lib/admin";

const statusColor: Record<string, string> = { paid: "#2ecc71", refunded: "#ff9f43", failed: "#ff5663" };

export default function AdminOverview() {
  const k = kpis();
  const rev = revenueByMonth();
  const dist = planDistribution();
  const maxRev = Math.max(...rev.map((r) => r.total), 1);
  const maxDist = Math.max(...dist.map((d) => d.count), 1);
  const recentTx = [...TRANSACTIONS].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  const recentUsers = [...USERS].sort((a, b) => (a.joined < b.joined ? 1 : -1)).slice(0, 6);

  const cards = [
    { label: "Total users", value: k.totalUsers.toLocaleString(), sub: `${k.newThisMonth} new this month`, accent: "#ff5663" },
    { label: "Active subscriptions", value: k.activeSubscribers.toLocaleString(), sub: `${k.suspended} suspended`, accent: "#ff8a92" },
    { label: "MRR", value: fmtMoney(k.mrr), sub: "Monthly recurring", accent: "#2ecc71" },
    { label: "Revenue (paid)", value: fmtMoney(k.revenue), sub: `${fmtMoney(k.refunds)} refunded`, accent: "#ff9f43" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-[28px]">Overview</h1>
      <p className="mt-1 text-sm text-white/50">Snapshot of users, subscriptions, and revenue.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/45">{c.label}</div>
            <div className="mt-2 font-display text-[26px] font-bold" style={{ color: c.accent }}>{c.value}</div>
            <div className="mt-1 text-xs text-white/40">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* revenue chart */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="mb-4 text-sm font-semibold text-white/80">Revenue — 2026</div>
          {/* items-stretch (not items-end) so each column fills the 12rem
              track — otherwise the columns collapse to their content height and
              the bars' percentage heights resolve against nothing, rendering
              every bar as a 4px sliver. */}
          <div className="flex h-48 items-stretch gap-3">
            {rev.map((r) => (
              <div key={r.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${(r.total / maxRev) * 100}%`, background: "linear-gradient(180deg,#ff4a57,#c4101c)", minHeight: 4 }} title={fmtMoney(r.total)} />
                </div>
                <span className="text-[11px] text-white/45">{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* plan distribution */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="mb-4 text-sm font-semibold text-white/80">Users by plan</div>
          <div className="space-y-2.5">
            {dist.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-[132px] shrink-0 truncate text-[12px] text-white/60">{d.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full" style={{ width: `${(d.count / maxDist) * 100}%`, background: "linear-gradient(90deg,#ff3645,#c4101c)" }} />
                </div>
                <span className="w-5 text-right text-xs font-semibold text-white/70">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* recent transactions */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="mb-3 text-sm font-semibold text-white/80">Recent transactions</div>
          <div className="space-y-1">
            {recentTx.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-white/5">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="truncate text-xs text-white/40">{t.plan} · {t.date}</div>
                </div>
                <div className="ml-3 text-right">
                  <div className="font-semibold">{fmtMoney(t.amount)}</div>
                  <div className="text-xs font-medium capitalize" style={{ color: statusColor[t.status] }}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* recent signups */}
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="mb-3 text-sm font-semibold text-white/80">Recent signups</div>
          <div className="space-y-1">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-white/5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#8c0c14)" }}>{u.name[0]}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.name}</div>
                    <div className="truncate text-xs text-white/40">{u.email}</div>
                  </div>
                </div>
                <span title={u.plan} className="ml-3 max-w-[45%] shrink truncate rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(255,70,85,.12)", color: "#ff8a92" }}>{u.plan}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
