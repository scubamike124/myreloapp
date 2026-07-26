import AmberAdminDashboard from "@/components/admin/AmberAdminDashboard";

export const metadata = { title: "Amber 32 — Business Operating System" };

export default function AdminAmberPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Amber 32 — Business Operating System</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          COO command layer on admin-only Learning Mode: health, executive brain, departments, memory,
          objectives, explainable decisions, and continuous weekly learning. Not customer-facing.
        </p>
        <p className="mt-2 text-xs text-white/40">
          Reelo workspace metrics only — not social platform reach, views, or engagement unless a real adapter
          returns them.
        </p>
      </div>
      <AmberAdminDashboard />
    </div>
  );
}
