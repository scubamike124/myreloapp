import AmberAdminDashboard from "@/components/admin/AmberAdminDashboard";

export const metadata = { title: "Amber 35 — Enterprise OS" };

export default function AdminAmberPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Amber 35 — Enterprise Intelligence & Multi-Business OS
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Multi-workspace enterprise layer on Amber 32–34: knowledge graph, predictive ops, self-optimization,
          benchmarking, governance, and business reviews. Admin Learning Mode only — not public.
        </p>
        <p className="mt-2 text-xs text-white/40">
          Aggregate Reelo + Amber ops metrics only. Predictions are trend heuristics with confidence scores.
        </p>
      </div>
      <AmberAdminDashboard />
    </div>
  );
}
