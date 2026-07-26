import AmberAdminDashboard from "@/components/admin/AmberAdminDashboard";

export const metadata = { title: "Amber 33 — Ops & Command" };

export default function AdminAmberPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Amber 33 — Production Ops & Owner Command
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Operational hardening on Amber 32 BOS: readiness score, alerts, recovery, checkpoints, and audited
          owner commands. Admin Learning Mode only — not customer-facing.
        </p>
        <p className="mt-2 text-xs text-white/40">
          Amber operational signals from Reelo + Amber tables only. Host CPU/RAM are not available on Cloudflare
          Workers and are not shown.
        </p>
      </div>
      <AmberAdminDashboard />
    </div>
  );
}
