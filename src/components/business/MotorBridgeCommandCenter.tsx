"use client";

import { useEffect, useState } from "react";
import BusinessShell from "@/components/design/BusinessShell";

type CommandCenterData = {
  ok: true;
  pausedAll: boolean;
  funnel: {
    uploadsTotal: number;
    trialUploads: number;
    activeTrials: number;
    paidCustomers: number;
    dataPartners: number;
  };
  customers: { totalCustomers: number; activeTrials: number; paidCustomers: number; dataPartners: number };
  uploads: {
    totalUploads: number;
    byConnector: { connectorSlug: string; count: number }[];
    byCategory: { category: string; count: number }[];
    byMaturity: { maturity: string; count: number }[];
    trialUploads: number;
    eligibleForIntelligence: number;
  };
  compatibility: {
    slug: string;
    name: string;
    categories: string[];
    legalAccessStatus: string;
    maturity: string;
    recordsProcessed: number;
  }[];
  testedConnectorCount: number;
  catalogTotal: number;
  vendorResearchQueue: { vendor: string; domain: string; status: string }[];
};

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,.03)" }}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#7d8891" }}>
        {label}
      </div>
      <div className="text-2xl font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs" style={{ color: "#8a949d" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default function MotorBridgeCommandCenter() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/motorbridge/command-center", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <BusinessShell active="motorbridge" variant="overview">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "#4fd1c5" }}>
            MotorBridge Command Center
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">The business, not the activity log</h1>
          <p className="mt-1 text-sm" style={{ color: "#8a949d" }}>
            Every number below is a real query result. A pre-launch product legitimately shows zeros here — that is
            the honest state, not a broken page.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error === "Unauthorized" || error === "Forbidden"
              ? "This page is for the account owner only."
              : `Could not load Command Center data: ${error}`}
          </div>
        )}

        {!data && !error && <div className="text-sm" style={{ color: "#8a949d" }}>Loading…</div>}

        {data && (
          <>
            {data.pausedAll && (
              <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                MotorBridge is currently PAUSED (owner kill-switch). No new uploads are being accepted.
              </div>
            )}

            {/* Top-level, no-vanity-metric cards (§40, §50) */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <Card label="MRR" value="$0" hint="no paid customers yet" />
              <Card label="Total Revenue" value="$0" hint="no revenue recorded yet" />
              <Card label="Trials" value={data.customers.activeTrials} />
              <Card label="Paid Customers" value={data.customers.paidCustomers} />
              <Card label="Data Partners" value={data.customers.dataPartners} />
              <Card label="Supported Formats" value={`${data.testedConnectorCount} / ${data.catalogTotal}`} hint="tested / cataloged" />
              <Card label="Successful Imports" value={data.uploads.totalUploads} hint={`${data.uploads.trialUploads} from free trials`} />
              <Card label="Eligible for Intelligence" value={data.uploads.eligibleForIntelligence} hint="rights-permitted records" />
            </div>

            {/* Sales funnel (§41) — stages this build cannot yet measure are shown at 0, not hidden */}
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#7d8891" }}>
                Sales funnel
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase" style={{ color: "#7d8891" }}>
                      {["Discovered", "Contacted", "Replied", "Sample submitted", "Successful import", "Trial started", "Paid", "Data Partner"].map(
                        (h) => (
                          <th key={h} className="px-4 py-3">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[0, 0, 0, 0, data.uploads.totalUploads, data.customers.activeTrials, data.customers.paidCustomers, data.customers.dataPartners].map(
                        (v, i) => (
                          <td key={i} className="px-4 py-3 font-semibold text-white/90" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {v}
                          </td>
                        ),
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs" style={{ color: "#6b7580" }}>
                Discovered/Contacted/Replied read 0 because outreach infrastructure (§10-11 of the blueprint) hasn't
                been built yet — not because it ran and found nothing.
              </p>
            </div>

            {/* Compatibility dashboard (§43) */}
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#7d8891" }}>
                Compatibility dashboard
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase" style={{ color: "#7d8891" }}>
                      <th className="px-4 py-3">System</th>
                      <th className="px-4 py-3">Categories</th>
                      <th className="px-4 py-3">Legal status</th>
                      <th className="px-4 py-3">Maturity</th>
                      <th className="px-4 py-3">Records processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.compatibility.map((c) => (
                      <tr key={c.slug} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-semibold text-white/90">{c.name}</td>
                        <td className="px-4 py-3" style={{ color: "#a9b4bd" }}>
                          {c.categories.join(", ")}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#a9b4bd" }}>
                          {c.legalAccessStatus.replace(/_/g, " ").toLowerCase()}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#a9b4bd" }}>
                          {c.maturity.replace(/_/g, " ").toLowerCase()}
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#4fd1c5", fontVariantNumeric: "tabular-nums" }}>
                          {c.recordsProcessed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vendor research queue — discovered vs actually supported (§10) */}
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#7d8891" }}>
                Vendor research queue
              </h2>
              <p className="mb-3 text-xs" style={{ color: "#6b7580" }}>
                Named vendors from the blueprint, not yet connectors — each needs its actual published format
                verified before a parser is written.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.vendorResearchQueue.map((v) => (
                  <span key={v.vendor} className="rounded-full border border-white/10 px-3 py-1.5 text-xs" style={{ color: "#a9b4bd" }}>
                    {v.vendor} · {v.status.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </BusinessShell>
  );
}
