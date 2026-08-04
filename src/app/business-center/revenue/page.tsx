import BusinessShell from "@/components/design/BusinessShell";
import SoonBanner from "@/components/design/SoonBanner";

export const metadata = { title: "Revenue — Reelo" };

export default function RevenuePage() {
  return (
    <BusinessShell active="revenue" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Revenue</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Earnings and payouts for your creator business.
        </p>
      </div>

      <SoonBanner feature="Revenue" />

      <div
        className="rounded-2xl px-5 py-8 text-center"
        style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}
      >
        <p className="font-display text-lg font-bold text-white">No revenue data yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#a99a9c" }}>
          This board will show real earnings, payouts, and recent transactions once revenue tracking ships.
          Placeholder stats have been removed so nothing looks live before it is.
        </p>
      </div>
    </BusinessShell>
  );
}
