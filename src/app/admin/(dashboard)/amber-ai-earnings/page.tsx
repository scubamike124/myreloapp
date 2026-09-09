import type { Metadata } from "next";
import { amberOrgBridgeConfigured, fetchOrganizationOverview } from "@/lib/amber/organization-bridge";
import AmberOrganizationDashboard from "@/components/admin/AmberOrganizationDashboard";

export const metadata: Metadata = { title: "Amber's AI Earnings — Reelo Admin" };

// Always render fresh: division/agent/task state changes continuously.
export const dynamic = "force-dynamic";

export default async function AmberAiEarningsPage() {
  if (!amberOrgBridgeConfigured()) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="font-display text-2xl font-bold sm:text-[28px]">Amber&apos;s AI Earnings</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/60">
          This page isn&apos;t connected yet. Set <code className="text-[#ff8892]">REELO_ORG_BRIDGE_SECRET</code> on
          this host to the same value already configured on Amber HQ (Railway, service{" "}
          <code className="text-[#ff8892]">amber-hq-web</code>), then reload.
        </p>
      </div>
    );
  }

  let overview: Awaited<ReturnType<typeof fetchOrganizationOverview>> | null = null;
  let fetchError: string | null = null;
  try {
    overview = await fetchOrganizationOverview();
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "unknown error";
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="font-display text-2xl font-bold sm:text-[28px]">Amber&apos;s AI Earnings</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-[#ff9aa3]">Could not reach Amber HQ: {fetchError}.</p>
      </div>
    );
  }

  return <AmberOrganizationDashboard initial={overview} />;
}
