import BusinessShell from "@/components/design/BusinessShell";
import AssetsManager from "@/components/business/AssetsManager";

export const metadata = { title: "Assets — Reelo" };

export default function AssetsPage() {
  return (
    <BusinessShell active="assets" variant="overview">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Assets</h1>
        <p className="mt-1.5 text-[14.5px]" style={{ color: "#a99a9c" }}>
          Everything you have made or uploaded, in one place.
        </p>
      </div>
      <AssetsManager />
    </BusinessShell>
  );
}
