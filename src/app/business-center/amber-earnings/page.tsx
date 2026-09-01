import { Suspense } from "react";
import AmberEarningsPanel from "@/components/business/AmberEarningsPanel";

export const metadata = { title: "Amber Earnings — Reelo" };
export const dynamic = "force-dynamic";

export default function AmberEarningsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/60">Loading Amber Earnings…</div>}>
      <AmberEarningsPanel />
    </Suspense>
  );
}
