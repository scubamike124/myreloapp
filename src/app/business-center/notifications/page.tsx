import BusinessShell from "@/components/design/BusinessShell";
import NotificationsCenter from "@/components/business/NotificationsCenter";

export const metadata = { title: "Notifications — Reelo" };

export default function NotificationsPage() {
  return (
    <BusinessShell active="notifications" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Notifications</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Due calendar items, low balance alerts, and team invites.
        </p>
      </div>
      <NotificationsCenter />
    </BusinessShell>
  );
}
