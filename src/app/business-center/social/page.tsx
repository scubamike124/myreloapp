import { Suspense } from "react";
import BusinessShell from "@/components/design/BusinessShell";
import SocialGateClient from "@/components/business/SocialGateClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Social — Reelo" };

export default function SocialPage() {
  return (
    <BusinessShell active="social" variant="overview">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em]">Social</h1>
        <p className="mt-1 text-[15px]" style={{ color: "#a99a9c" }}>
          Connect and grow your social channels.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm" style={{ color: "#9a8b8d" }}>Loading…</p>}>
        <SocialGateClient />
      </Suspense>
    </BusinessShell>
  );
}
