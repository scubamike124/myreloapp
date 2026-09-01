import { Suspense } from "react";
import PropertyIntelligencePanel from "@/components/business/PropertyIntelligencePanel";

export const metadata = { title: "Amber Property Intelligence — Reelo" };
export const dynamic = "force-dynamic";

export default function PropertyIntelligencePage() {
  return (
    <Suspense fallback={<div className="p-8" style={{ color: "#111", background: "#fff" }}>Loading Amber Property Intelligence…</div>}>
      <PropertyIntelligencePanel />
    </Suspense>
  );
}
