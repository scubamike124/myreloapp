import { Suspense } from "react";
import MotorBridgeCommandCenter from "@/components/business/MotorBridgeCommandCenter";

export const metadata = { title: "MotorBridge Command Center — Reelo" };
export const dynamic = "force-dynamic";

export default function MotorBridgeCommandCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-white/70">Loading MotorBridge Command Center…</div>}>
      <MotorBridgeCommandCenter />
    </Suspense>
  );
}
