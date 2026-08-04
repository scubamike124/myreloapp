import BusinessShell from "@/components/design/BusinessShell";
import WorkspaceAnalytics from "@/components/business/WorkspaceAnalytics";

export const metadata = { title: "Workspace analytics — Reelo" };

export default function AnalyticsPage() {
  return (
    <BusinessShell active="analytics" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Workspace analytics</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Creations and token spend from your account — not social reach.
        </p>
      </div>
      <WorkspaceAnalytics />
    </BusinessShell>
  );
}
