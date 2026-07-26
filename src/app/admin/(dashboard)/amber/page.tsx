import AmberAdminDashboard from "@/components/admin/AmberAdminDashboard";

export const metadata = { title: "Amber 34 — Executive Operations" };

export default function AdminAmberPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Amber 34 — Autonomous Executive Operations
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Strategic planning, cross-department coordination, KPI optimization, risks, approvals, and executive
          briefings — on top of Amber 32 BOS + Amber 33 Ops. Admin Learning Mode only.
        </p>
        <p className="mt-2 text-xs text-white/40">
          Reelo workspace + Amber ops KPIs only — not fabricated revenue, pipeline, or social reach.
        </p>
      </div>
      <AmberAdminDashboard />
    </div>
  );
}
