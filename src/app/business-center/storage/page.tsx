import BusinessShell from "@/components/design/BusinessShell";
import StorageManager from "@/components/business/StorageManager";

export const metadata = { title: "Storage — Reelo" };

export default function StoragePage() {
  return (
    <BusinessShell active="storage" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Storage manager</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          See what you are keeping and delete creations you no longer need.
        </p>
      </div>
      <StorageManager />
    </BusinessShell>
  );
}
