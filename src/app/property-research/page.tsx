import { Suspense } from "react";
import PropertyResearchClientPanel from "@/components/business/PropertyResearchClientPanel";

export const metadata = { title: "Private Property Research — Reelo" };
export const dynamic = "force-dynamic";

export default function PropertyResearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/60">Loading private opportunities…</div>}>
      <PropertyResearchClientPanel />
    </Suspense>
  );
}
