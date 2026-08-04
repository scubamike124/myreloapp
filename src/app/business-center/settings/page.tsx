import BusinessShell from "@/components/design/BusinessShell";
import WorkspaceSettingsForm from "@/components/business/WorkspaceSettingsForm";

export const metadata = { title: "Workspace settings — Reelo" };

export default function SettingsPage() {
  return (
    <BusinessShell active="settings" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Workspace settings</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Display name, timezone, and notification preferences.
        </p>
      </div>
      <WorkspaceSettingsForm />
    </BusinessShell>
  );
}
