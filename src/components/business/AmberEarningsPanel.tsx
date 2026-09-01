"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import BusinessShell from "@/components/design/BusinessShell";
import type {
  ApprovalRow,
  EarningsCenter,
  IntegrationMode,
  JobRow,
  OpportunityDetail,
  PlatformRow,
} from "@/lib/amber-earnings/center-types";
import type { NationwideView } from "@/lib/amber-earnings/hq-nationwide";

const page: CSSProperties = {
  background: "#ffffff",
  color: "#111827",
  borderRadius: 16,
  padding: "1.25rem 1rem 2.5rem",
  margin: "0 -0.25rem",
};

const card: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,.04)",
};

const muted = "#4b5563";
const label = "#6b7280";

function money(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

function modeColor(s: string): string {
  if (["CONNECTED", "READY_TO_WORK", "PAID", "RUNNING", "paid", "connected"].includes(s)) return "#15803d";
  if (["WORKING", "SUBMITTED", "PAYMENT_PENDING", "accepted", "working", "submitted"].includes(s)) return "#1d4ed8";
  if (["SETUP_REQUIRED", "DISCOVERY_ONLY", "needs_mike", "PAUSED", "paused", "evaluating"].includes(s)) return "#b45309";
  if (["BLOCKED", "ERROR", "rejected", "failed", "error"].includes(s)) return "#b91c1c";
  return "#4b5563";
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const color = tone || modeColor(String(children));
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

function PrimaryBtn({ disabled, onClick, children }: { disabled?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-[13px] font-bold text-white"
      style={{ background: disabled ? "#9ca3af" : "#111827" }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ disabled, onClick, children }: { disabled?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-3 py-2 text-[13px] font-semibold"
      style={{ border: "1px solid #d1d5db", background: "#fff", color: "#111827", opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}

function Field({ label: l, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-2 sm:grid sm:grid-cols-[160px_1fr] sm:gap-3">
      <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: label }}>{l}</div>
      <div className="text-[14px] text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

export default function AmberEarningsPanel() {
  const [center, setCenter] = useState<EarningsCenter | null>(null);
  const [nationwide, setNationwide] = useState<NationwideView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("Loading Amber Earnings…");
  const [needSignIn, setNeedSignIn] = useState(false);
  const [platform, setPlatform] = useState<PlatformRow | null>(null);
  const [job, setJob] = useState<JobRow | null>(null);
  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [hqDetail, setHqDetail] = useState<{
    kind: "job" | "opportunity";
    id: string;
    title: string;
    status: string;
    meta: string;
    body: string;
    lines: string[];
  } | null>(null);
  const [tab, setTab] = useState<"active" | "opportunities" | "history" | "accounting">("opportunities");
  const [agentId, setAgentId] = useState("");
  const [moltApiKey, setMoltApiKey] = useState("");
  const [wpApiKey, setWpApiKey] = useState("");
  const [wpAgentId, setWpAgentId] = useState("");
  const [showOpps, setShowOpps] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/amber-earnings", { cache: "no-store", credentials: "include" });
    const json = await res.json();
    if (res.status === 401) {
      setNeedSignIn(true);
      setNotice("Sign in to Business Center Pro to open Amber Earnings.");
      return;
    }
    if (!res.ok) {
      setNotice(json.error || "Load failed");
      return;
    }
    setNeedSignIn(false);
    if (json.nationwide) setNationwide(json.nationwide as NationwideView);
    const c = json.center as EarningsCenter | null;
    if (c) {
      setCenter(c);
      setNotice(
        `Worker ${c.amberStatus}. Last scan ${c.lastSuccessfulScan ? new Date(c.lastSuccessfulScan).toLocaleString() : "never"}.`,
      );
    } else {
      setCenter(null);
      setNotice(
        json.nationwide?.ok
          ? `HQ SoT loaded · ${json.nationwide.hqJobCount || 0} marketplace jobs · ${json.nationwide.emp?.sources?.total ?? 0} nationwide sources.`
          : "Signed in — loading Amber Earnings…",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!center?.deviceAuth) return;
    const id = window.setInterval(() => void act("taskbounty-poll"), 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.deviceAuth?.userCode]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    const res = await fetch("/api/amber-earnings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (json.center) setCenter(json.center as EarningsCenter);
    if (json.nationwide) setNationwide(json.nationwide as NationwideView);
    if (!res.ok) setNotice(json.error || "Action failed");
    else if (action !== "taskbounty-poll") setNotice(`Done: ${action.replace(/-/g, " ")}`);
    setBusy(null);
  }

  const k = center?.kpis;
  const a = center?.accounting;
  const disabled = !!busy || needSignIn;
  const openOpps = (center?.opportunities || []).filter((o) => !o.expiredOrGone);

  return (
    <BusinessShell active="hubpro" variant="pro">
      <div style={page} data-pro-feature="amber-earnings">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: muted }}>
          Business Center Pro · Card 28 · Owner admin
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Amber Earnings</h1>
            <p className="mt-1 max-w-3xl text-[15px]" style={{ color: muted }}>{notice}</p>
          </div>
          <Badge>{center?.amberStatus || "…"}</Badge>
        </div>

        {needSignIn ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 p-4" style={card}>
            <p className="flex-1 text-[14px]" style={{ color: muted }}>Sign in to manage the live command center.</p>
            <Link href="/login?next=/business-center/amber-earnings" className="rounded-lg bg-gray-900 px-3 py-2 text-[13px] font-bold text-white">
              Sign in
            </Link>
          </div>
        ) : null}

        {/* Verified earnings */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Verified paid (today)", money(k?.todayEarnings || 0)],
            ["Verified paid (week)", money(k?.thisWeek || 0)],
            ["Verified paid (month)", money(k?.thisMonth || 0)],
            ["Verified paid (lifetime)", money(a?.verifiedPaidRevenue || k?.lifetimeRevenue || 0)],
            ["Verified expenses", money(a?.expenses || 0)],
            ["Verified net profit", money(a?.verifiedNetProfit || 0)],
          ].map(([l, v]) => (
            <div key={l} className="p-3" style={card}>
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: label }}>{l}</div>
              <div className="mt-1 text-[20px] font-bold text-gray-900">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[13px]" style={{ color: muted }}>
          {a?.definition || "Main earnings = verified paid revenue only. Opportunities are never counted as paid."}
        </p>

        {/* Pipeline KPIs */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Active jobs</div>
            <div className="mt-1 text-[20px] font-bold">{k?.activeJobs ?? 0}</div>
          </div>
          <button
            type="button"
            className="p-3 text-left"
            style={{ ...card, borderColor: "#93c5fd", cursor: "pointer" }}
            onClick={() => { setShowOpps(true); setTab("opportunities"); setOpp(null); }}
          >
            <div className="text-[11px] font-bold uppercase" style={{ color: "#1d4ed8" }}>Available opportunities</div>
            <div className="mt-1 text-[20px] font-bold text-blue-700 underline decoration-2 underline-offset-2">
              {k?.availableOpportunities ?? 0}
            </div>
            <div className="mt-1 text-[12px]" style={{ color: muted }}>Click to view all unique live listings</div>
          </button>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Connected (usable auth)</div>
            <div className="mt-1 text-[20px] font-bold">{k?.connectedPlatforms ?? 0}</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Potential opp. value</div>
            <div className="mt-1 text-[20px] font-bold">{money(a?.potentialOpportunityValue || 0)}</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Accepted job value</div>
            <div className="mt-1 text-[20px] font-bold">{money(a?.acceptedJobValue || 0)}</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Pending payment</div>
            <div className="mt-1 text-[20px] font-bold">{money(a?.pendingPayment || 0)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Relo applied</div>
            <div className="mt-1 text-[20px] font-bold">{k?.jobsApplied ?? 0}</div>
            <div className="mt-1 text-[12px]" style={{ color: muted }}>Bids / claims / submit / paid — not listings found</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Relo submitted</div>
            <div className="mt-1 text-[20px] font-bold">{k?.jobsSubmitted ?? 0}</div>
          </div>
          <div className="p-3" style={{ ...card, borderColor: "#fecaca" }}>
            <div className="text-[11px] font-bold uppercase" style={{ color: "#b91c1c" }}>Relo rejected</div>
            <div className="mt-1 text-[20px] font-bold text-red-700">{k?.jobsRejected ?? 0}</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>HQ applied</div>
            <div className="mt-1 text-[20px] font-bold">{nationwide?.ok ? nationwide.hqApplied + nationwide.empApplied : "—"}</div>
            <div className="mt-1 text-[12px]" style={{ color: muted }}>Marketplace + nationwide submissions</div>
          </div>
          <div className="p-3" style={{ ...card, borderColor: "#fecaca" }}>
            <div className="text-[11px] font-bold uppercase" style={{ color: "#b91c1c" }}>HQ rejected</div>
            <div className="mt-1 text-[20px] font-bold text-red-700">{nationwide?.ok ? nationwide.hqRejected : "—"}</div>
          </div>
          <div className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase" style={{ color: label }}>HQ jobs reviewed</div>
            <div className="mt-1 text-[20px] font-bold">{nationwide?.ok ? nationwide.hqJobCount : "—"}</div>
          </div>
        </div>

        {nationwide ? (
          <section className="mt-4 p-4" style={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nationwide · government · claims (HQ SoT)</h2>
                <p className="mt-1 text-[13px]" style={{ color: muted }}>
                  Loaded directly into this page from the shared HQ Amber Earnings backend. No separate dashboard required.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostBtn disabled={disabled} onClick={() => void act("hq-tick")}>Run HQ scan</GhostBtn>
                <GhostBtn disabled={disabled} onClick={() => void act("hq-pause-all")}>Pause HQ</GhostBtn>
                <GhostBtn disabled={disabled} onClick={() => void act("hq-resume-all")}>Resume HQ</GhostBtn>
              </div>
            </div>
            {!nationwide.ok ? (
              <p className="mt-3 text-[14px] text-amber-800">
                Could not load HQ snapshot ({nationwide.reason || "unknown"}). Relo marketplace lanes below still work.
                Fix: ensure Relo has the same CRON_SECRET / AMBER_BUILDER_SECRET as HQ, then Run HQ scan.
                Relo applied {k?.jobsApplied ?? 0} · rejected {k?.jobsRejected ?? 0}.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[13px]" style={{ color: muted }}>
                  HQ marketplace applied {nationwide.hqApplied} · rejected {nationwide.hqRejected} · reviewed {nationwide.hqJobCount}.
                  Nationwide submitted {nationwide.empApplied}.
                  {nationwide.emp
                    ? ` Catalog ${nationwide.emp.sources.total} sources · healthy ${nationwide.emp.sources.healthy} · EMP ticks ${nationwide.emp.worker.ticks} · last ${nationwide.emp.worker.lastTickAt || "never"}.`
                    : ""}
                  {nationwide.lastAction
                    ? ` Last HQ action: ${nationwide.lastAction.action} (${nationwide.lastAction.ok ? "ok" : "failed"}).`
                    : ""}
                </p>
                {nationwide.emp ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Contracts found", nationwide.emp.departments.contracts],
                      ["Funding found", nationwide.emp.departments.funding],
                      ["Claim Watch (private)", nationwide.emp.departments.claims],
                      ["Recovery found", nationwide.emp.departments.recovery],
                      ["In process", nationwide.emp.money.inProcess],
                      ["Awarded (evidence)", nationwide.emp.money.awarded],
                      ["Received (evidenced)", money(nationwide.emp.money.receivedUsd)],
                      ["Sources cataloged", nationwide.emp.sources.total],
                    ].map(([l, v]) => (
                      <div key={String(l)} className="p-3" style={card}>
                        <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{l}</div>
                        <div className="mt-1 text-[18px] font-bold text-gray-900">{v}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {(nationwide.emp?.blockers || []).length ? (
                  <div className="mt-3">
                    <strong className="text-[14px]">HQ blockers / errors</strong>
                    {nationwide.emp!.blockers.map((b) => (
                      <article key={b.id} className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="#b91c1c">{b.code}</Badge>
                          <span className="text-[13px] text-gray-800">{b.whatHappened}</span>
                        </div>
                        {b.nextRetryAt ? (
                          <p className="mt-1 text-[12px]" style={{ color: muted }}>Next retry {b.nextRetryAt}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : null}

                {(nationwide.emp?.ownerActions || []).length ? (
                  <div className="mt-3">
                    <strong className="text-[14px]">Owner Action Queue (HQ)</strong>
                    {nationwide.emp!.ownerActions.map((a) => (
                      <p key={a.id} className="mt-2 text-[13px] text-gray-800">
                        {a.requiredAction} — <span style={{ color: muted }}>{a.reason}</span>
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4">
                  <strong className="text-[14px]">HQ marketplace jobs</strong>
                  <p className="text-[12px]" style={{ color: muted }}>Open any row here — status reflects apply / submit / paid on the shared HQ store.</p>
                  {(nationwide.hqJobs || []).slice(0, 40).map((j, idx) => (
                    <article
                      key={j.id || `${j.title}-${idx}`}
                      className="mt-2 cursor-pointer border-t border-gray-100 pt-2"
                      onClick={() =>
                        setHqDetail({
                          kind: "job",
                          id: j.id || `hq-job-${idx}`,
                          title: j.title,
                          status: j.status,
                          meta: `${j.marketplace || "HQ marketplace"}${typeof j.payoutUsd === "number" ? ` · ${money(j.payoutUsd)}` : ""}`,
                          body: j.description || "HQ marketplace job from the shared Amber Earnings store.",
                          lines: [
                            `Status: ${j.status}`,
                            j.marketplace ? `Marketplace: ${j.marketplace}` : "",
                            j.externalId ? `External id: ${j.externalId}` : "",
                            typeof j.payoutUsd === "number" ? `Payout: ${money(j.payoutUsd)}` : "",
                          ].filter(Boolean),
                        })
                      }
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong className="text-[14px]">{j.title}</strong>
                        <span className="text-[12px]" style={{ color: muted }}>
                          {j.marketplace || "hq"} · {j.status}
                          {typeof j.payoutUsd === "number" ? ` · ${money(j.payoutUsd)}` : ""}
                        </span>
                      </div>
                    </article>
                  ))}
                  {!nationwide.hqJobs?.length ? (
                    <p className="mt-2 text-[13px]" style={{ color: muted }}>No HQ marketplace jobs yet. Run HQ scan.</p>
                  ) : null}
                </div>

                {nationwide.emp?.sam ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <strong className="text-[14px] text-amber-950">SAM.gov automation status</strong>
                    <p className="mt-1 text-[13px] text-amber-950/90">{nationwide.emp.sam.note}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                      <Badge tone={nationwide.emp.sam.apiKeyPresent ? "#15803d" : "#b91c1c"}>
                        API key {nationwide.emp.sam.apiKeyPresent ? "present" : "missing"}
                      </Badge>
                      <Badge tone={nationwide.emp.sam.canCompeteOnPortal ? "#15803d" : "#b45309"}>
                        Entity compete {nationwide.emp.sam.canCompeteOnPortal ? "ready" : "blocked"}
                      </Badge>
                      <Badge>Listed {nationwide.emp.sam.listed ?? 0}</Badge>
                      <Badge>Active board {nationwide.emp.sam.activeBoard ?? 0}</Badge>
                      <Badge>Filtered out {nationwide.emp.sam.filteredOut ?? 0}</Badge>
                      <Badge>Likely qualified {nationwide.emp.sam.likelyQualified ?? 0}</Badge>
                      <Badge>Needs facts {nationwide.emp.sam.needsOwnerFacts ?? 0}</Badge>
                      <Badge>Draft packages {nationwide.emp.sam.preparedPackages ?? 0}</Badge>
                    </div>
                    <p className="mt-2 text-[12px]" style={{ color: muted }}>
                      Registered={String(nationwide.emp.sam.entityRegistered)} · Active={String(nationwide.emp.sam.entityActive)} · UEI on file={String(nationwide.emp.sam.ueiOnFile)}.
                      Set entity facts via HQ action <code>set-owner-business</code> (UEI / Active registration) — separate from vault SAM_API_KEY.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <strong className="text-[14px]">Nationwide / government opportunities (active board)</strong>
                  <p className="text-[12px]" style={{ color: muted }}>
                    Amber deep-reads solicitations, filters ineligible/unfit work, and drafts proposal packages.
                    Certifications, signatures, and SAM portal submit stay owner-only — never auto-filled.
                  </p>
                  {(nationwide.emp?.opportunities || []).slice(0, 40).map((o) => (
                    <article
                      key={o.id}
                      className="mt-2 cursor-pointer border-t border-gray-100 pt-2"
                      onClick={() =>
                        setHqDetail({
                          kind: "opportunity",
                          id: o.id,
                          title: o.title,
                          status: o.status,
                          meta: `${o.type} · ${o.eligibilityLabel || o.eligibilityVerdict || "—"}`,
                          body:
                            o.automationDepth?.amberMaxLegitimate ||
                            o.eligibilityNotes ||
                            o.proposalPackage?.executiveSummary ||
                            (o.rejectionReasons || []).join(" ") ||
                            `${o.type} opportunity from EMP nationwide scan.`,
                          lines: [
                            `Type: ${o.type}`,
                            `Status: ${o.status}`,
                            o.eligibilityLabel ? `Eligibility: ${o.eligibilityLabel}` : "",
                            o.eligibilityNotes ? `Notes: ${o.eligibilityNotes}` : "",
                            typeof o.capabilityFit === "number" ? `Capability fit: ${o.capabilityFit}` : "",
                            o.solicitation?.noticeId ? `Notice: ${o.solicitation.noticeId}` : "",
                            o.solicitation?.naicsCode ? `NAICS: ${o.solicitation.naicsCode}` : "",
                            o.solicitation?.setAsideDescription || o.solicitation?.setAside
                              ? `Set-aside: ${o.solicitation.setAsideDescription || o.solicitation.setAside}`
                              : "",
                            o.solicitation?.attachmentCount
                              ? `Attachments inventoried: ${o.solicitation.attachmentCount}`
                              : "",
                            o.solicitation?.requirementsCount
                              ? `Requirements extracted: ${o.solicitation.requirementsCount}`
                              : "",
                            o.automationDepth?.amberMaxLegitimate
                              ? `Amber max: ${o.automationDepth.amberMaxLegitimate}`
                              : "",
                            ...(o.automationDepth?.ownerMustComplete || []).map((s) => `Owner must: ${s}`),
                            ...(o.proposalPackage?.certificationsOwnerOnly || []).map((s) => `Cert (owner): ${s}`),
                            ...(o.proposalPackage?.submitOwnerOnly || []).map((s) => `Submit (owner): ${s}`),
                            o.solicitation?.uiLink ? `SAM link: ${o.solicitation.uiLink}` : "",
                            ...(o.rejectionReasons || []),
                          ].filter(Boolean),
                        })
                      }
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong className="text-[14px]">{o.title}</strong>
                        <span className="text-[12px]" style={{ color: muted }}>
                          {o.type} · {o.status}
                          {o.hasProposalPackage ? " · draft ready" : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {o.eligibilityLabel ? <Badge tone="#1d4ed8">{o.eligibilityLabel}</Badge> : null}
                        {o.automationDepth?.portalSubmit === "owner_only" ? (
                          <Badge tone="#b45309">Portal submit = owner only</Badge>
                        ) : null}
                        {o.hasProposalPackage ? <Badge tone="#15803d">Proposal draft ready</Badge> : null}
                      </div>
                      {o.automationDepth?.amberMaxLegitimate ? (
                        <p className="mt-1 text-[12px] text-gray-800">{o.automationDepth.amberMaxLegitimate}</p>
                      ) : null}
                      {o.automationDepth?.ownerMustComplete?.[0] ? (
                        <p className="text-[12px]" style={{ color: muted }}>
                          Next owner step: {o.automationDepth.ownerMustComplete[0]}
                        </p>
                      ) : null}
                    </article>
                  ))}
                  {!nationwide.emp?.opportunities?.length ? (
                    <p className="mt-2 text-[13px]" style={{ color: muted }}>
                      None on the active board yet. Run HQ scan — Amber will filter and prep; it will not portal-submit.
                    </p>
                  ) : null}
                </div>

                {(nationwide.emp?.filteredOpportunities || []).length ? (
                  <div className="mt-4">
                    <strong className="text-[14px]">Filtered out (not eligible / not a fit)</strong>
                    <ul className="mt-2 space-y-1 text-[13px] text-gray-700">
                      {nationwide.emp!.filteredOpportunities!.slice(0, 15).map((o) => (
                        <li key={o.id}>
                          {o.title} — {o.eligibilityVerdict || o.status}
                          {o.rejectionReasons?.length ? ` (${o.rejectionReasons[0]})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(nationwide.emp?.activity || []).length ? (
                  <div className="mt-4">
                    <strong className="text-[14px]">HQ activity</strong>
                    <ul className="mt-2 space-y-1 text-[13px] text-gray-800">
                      {nationwide.emp!.activity.slice(0, 15).map((a) => (
                        <li key={a.id}>
                          <span style={{ color: muted }}>{a.at}</span> · {a.department}: {a.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {/* Why active = 0 */}
        <section className="mt-4 p-4" style={{ ...card, borderColor: "#fcd34d", background: "#fffbeb" }}>
          <h2 className="text-lg font-bold text-gray-900">Why Active Jobs = {k?.activeJobs ?? 0}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-800">{center?.whyActiveJobsZero || "Loading…"}</p>
          <p className="mt-2 text-[13px]" style={{ color: muted }}>{center?.executionEngineStatus}</p>
        </section>

        {/* Active work */}
        <section className="mt-4 p-4" style={card}>
          <h2 className="text-lg font-bold text-gray-900">Active work</h2>
          {center?.activeWork?.idle ? (
            <p className="mt-2 text-[15px] font-semibold text-gray-700">Idle — Amber is not performing any accepted job right now.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {(center?.activeWork?.jobs || []).map((w) => (
                <div key={w.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[15px]">{w.title}</strong>
                    <Badge tone="#1d4ed8">{w.stage}</Badge>
                    <span className="text-[13px]" style={{ color: muted }}>{w.platformName}</span>
                  </div>
                  <p className="mt-1 text-[13px]"><strong>Current action:</strong> {w.currentAction}</p>
                  <p className="text-[13px]"><strong>Progress:</strong> {w.progressLabel}</p>
                  <p className="text-[13px]"><strong>Deliverable:</strong> {w.deliverableStatus} · <strong>QA:</strong> {w.qualityStatus} · <strong>Submission:</strong> {w.submissionStatus}</p>
                  {w.blockers.length ? (
                    <p className="mt-1 text-[13px] font-semibold text-red-700">Blockers: {w.blockers.join(" · ")}</p>
                  ) : null}
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Completed</div>
                      <ul className="list-disc pl-4 text-[13px]">{w.completedSteps.map((s) => <li key={s}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase" style={{ color: label }}>Remaining</div>
                      <ul className="list-disc pl-4 text-[13px]">{w.remainingSteps.map((s) => <li key={s}>{s}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Needs Mike */}
        {center?.approvals?.length ? (
          <section className="mt-4 p-4" style={{ ...card, borderColor: "#fbbf24" }}>
            <h2 className="text-lg font-bold text-gray-900">Needs Mike</h2>
            <p className="mt-1 text-[13px]" style={{ color: muted }}>Only real owner steps. Amber does not ask you to create accounts she cannot use afterward.</p>
            <div className="mt-3 space-y-3">
              {center.approvals.map((ap: ApprovalRow) => (
                <div key={ap.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[15px]">{ap.title}</strong>
                    <Badge tone="#b45309">{ap.requiredOrOptional || "required"}</Badge>
                    {ap.unlocksUsableWorkflow === false ? <Badge tone="#b91c1c">Does not unlock full execution</Badge> : null}
                  </div>
                  <Field label="Amber already did" value={ap.amberCompleted || ap.detail} />
                  <Field label="You need to do" value={ap.mikeMustDo || ap.title} />
                  <Field label="Why" value={ap.whyRequired || ap.detail} />
                  <Field label="After you finish" value={ap.afterMikeCompletes || "Amber re-checks on next scan."} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ap.actionUrl ? (
                      <a href={ap.actionUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-gray-900 px-3 py-2 text-[13px] font-bold text-white">
                        Open required step
                      </a>
                    ) : null}
                    <GhostBtn disabled={disabled} onClick={() => void act("resolve-approval", { approvalId: ap.id })}>Mark done</GhostBtn>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryBtn disabled={disabled} onClick={() => void act("pause-all")}>Pause all</PrimaryBtn>
          <GhostBtn disabled={disabled} onClick={() => void act("resume-all")}>Resume all</GhostBtn>
          <GhostBtn disabled={disabled} onClick={() => void act("scan")}>Run scan now</GhostBtn>
          <GhostBtn disabled={disabled} onClick={() => void act("taskbounty-connect")}>Connect TaskBounty</GhostBtn>
          <GhostBtn
            disabled={disabled}
            onClick={() => {
              const p = (center?.platforms || []).find((x) => x.slug === "moltjobs");
              if (p) setPlatform(p);
            }}
          >
            Enter MoltJobs API key
          </GhostBtn>
          <GhostBtn
            disabled={disabled}
            onClick={() => {
              const p = (center?.platforms || []).find((x) => x.slug === "workprotocol");
              if (p) setPlatform(p);
            }}
          >
            WorkProtocol
          </GhostBtn>
          <GhostBtn onClick={() => setLogsOpen((v) => !v)}>Worker logs</GhostBtn>
          <Link href="/business-center/pro" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] font-semibold text-gray-900">
            Back to Pro
          </Link>
        </div>

        {center?.deviceAuth ? (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[14px] font-bold text-gray-900">Approve TaskBounty code {center.deviceAuth.userCode}</p>
            <a className="text-[14px] font-semibold text-blue-700 underline" href={center.deviceAuth.verificationUriComplete || center.deviceAuth.verificationUri} target="_blank" rel="noreferrer">
              Open TaskBounty approval page
            </a>
            <p className="mt-1 text-[13px]" style={{ color: muted }}>Do not paste your Google password here.</p>
          </div>
        ) : null}

        {logsOpen ? (
          <section className="mt-4 p-4" style={card}>
            <h2 className="text-lg font-bold">Worker logs</h2>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[12px] text-gray-700">
              {(center?.worker.notes || []).join("\n") || "No log lines yet. Run Scan Now."}
            </pre>
          </section>
        ) : null}

        {/* Platforms */}
        <section className="mt-4 p-4" style={card}>
          <h2 className="text-lg font-bold text-gray-900">Platforms — discovery vs execution</h2>
          <p className="mt-1 text-[13px]" style={{ color: muted }}>
            “Connected” means usable auth for the actions Amber can perform. Discovery-only boards are labeled honestly.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead style={{ color: label }}>
                <tr>
                  {["Platform", "Mode", "Discover", "Accept", "Perform", "Submit", "Pay track", "Open", "Attention"].map((h) => (
                    <th key={h} className="pb-2 pr-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(center?.platforms || []).filter((p) => p.status !== "rejected").map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 pr-2">
                      <button type="button" className="font-bold text-blue-700 underline" onClick={() => { setPlatform(p); setJob(null); setOpp(null); }}>
                        {p.name}
                      </button>
                    </td>
                    <td className="pr-2"><Badge>{p.integrationMode as IntegrationMode}</Badge></td>
                    <td className="pr-2">{p.canDiscover ? "Yes" : "No"}</td>
                    <td className="pr-2">{p.canAccept ? "Yes" : "No"}</td>
                    <td className="pr-2">{p.canPerform ? "Yes" : "No"}</td>
                    <td className="pr-2">{p.canSubmit ? "Yes" : "No"}</td>
                    <td className="pr-2">{p.canTrackPayment ? "Yes" : "No"}</td>
                    <td className="pr-2">{p.availableJobs}</td>
                    <td className="pr-2 text-amber-800">{p.capabilitySummary || p.attention || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {platform ? (
          <section className="mt-4 p-4" style={card}>
            <div className="mb-2 flex justify-between gap-2">
              <h3 className="text-lg font-bold">{platform.name}</h3>
              <button type="button" className="text-[13px] font-semibold text-blue-700" onClick={() => setPlatform(null)}>Close</button>
            </div>
            <Field label="Website" value={<a className="text-blue-700 underline" href={platform.website} target="_blank" rel="noreferrer">{platform.website}</a>} />
            <Field label="Mode" value={<Badge>{platform.integrationMode}</Badge>} />
            <Field label="Capability" value={platform.capabilitySummary} />
            <Field label="Blockers" value={(platform.capabilityBlockers || []).join(" · ") || "—"} />
            {platform.slug === "sporeagent" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Existing SporeAgent id"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-900"
                />
                <PrimaryBtn disabled={disabled || !agentId.trim()} onClick={() => void act("spore-connect", { agentId: agentId.trim() })}>
                  Save SporeAgent id
                </PrimaryBtn>
              </div>
            ) : null}
            {platform.slug === "moltjobs" ? (
              <div className="mt-3 space-y-2">
                <p className="text-[13px]" style={{ color: muted }}>
                  Paste your MoltJobs API key (<code className="text-[12px]">mj_live_…</code>). Never paste a wallet private key.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={moltApiKey}
                    onChange={(e) => setMoltApiKey(e.target.value)}
                    placeholder="mj_live_…"
                    type="password"
                    autoComplete="off"
                    className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-900"
                  />
                  <PrimaryBtn
                    disabled={disabled || !moltApiKey.trim()}
                    onClick={() =>
                      void act("moltjobs-connect", { apiKey: moltApiKey.trim() }).then(() => setMoltApiKey(""))
                    }
                  >
                    Save MoltJobs API key
                  </PrimaryBtn>
                </div>
                <a
                  className="text-[13px] font-semibold text-blue-700 underline"
                  href="https://hq.amberoneai.com/dashboard/vault?focus=moltjobs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Or store it in Amber Vault (MOLTJOBS_API_KEY)
                </a>
              </div>
            ) : null}
            {platform.slug === "workprotocol" ? (
              <div className="mt-3 space-y-2">
                <p className="text-[13px]" style={{ color: muted }}>
                  Amber auto-registers on Scan. Optional: paste an existing <code className="text-[12px]">wp_agent_…</code> key + agent UUID.
                </p>
                <div className="flex flex-wrap gap-2">
                  <PrimaryBtn disabled={disabled} onClick={() => void act("workprotocol-register")}>
                    Register Amber on WorkProtocol
                  </PrimaryBtn>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={wpApiKey}
                    onChange={(e) => setWpApiKey(e.target.value)}
                    placeholder="wp_agent_…"
                    type="password"
                    autoComplete="off"
                    className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-900"
                  />
                  <input
                    value={wpAgentId}
                    onChange={(e) => setWpAgentId(e.target.value)}
                    placeholder="agent UUID"
                    autoComplete="off"
                    className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[14px] text-gray-900"
                  />
                  <PrimaryBtn
                    disabled={disabled || !wpApiKey.trim() || !wpAgentId.trim()}
                    onClick={() =>
                      void act("workprotocol-connect", {
                        apiKey: wpApiKey.trim(),
                        agentId: wpAgentId.trim(),
                      }).then(() => {
                        setWpApiKey("");
                        setWpAgentId("");
                      })
                    }
                  >
                    Save WorkProtocol credentials
                  </PrimaryBtn>
                </div>
                <a
                  className="text-[13px] font-semibold text-blue-700 underline"
                  href="https://workprotocol.ai/"
                  target="_blank"
                  rel="noreferrer"
                >
                  workprotocol.ai
                </a>
              </div>
            ) : null}
            <GhostBtn disabled={disabled} onClick={() => void act("pause-marketplace", { marketplace: platform.slug, paused: !platform.paused })}>
              {platform.paused ? "Resume platform" : "Pause platform"}
            </GhostBtn>
          </section>
        ) : null}

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["opportunities", "Opportunities"],
            ["active", "Projects"],
            ["history", "Work history"],
            ["accounting", "Accounting"],
          ] as const).map(([t, labelText]) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); if (t === "opportunities") setShowOpps(true); }}
              className="rounded-lg px-3 py-2 text-[13px] font-bold"
              style={tab === t ? { background: "#111827", color: "#fff" } : { border: "1px solid #d1d5db", background: "#fff", color: "#111827" }}
            >
              {labelText}
            </button>
          ))}
        </div>

        {(tab === "opportunities" || showOpps) && tab === "opportunities" ? (
          <section className="mt-3 p-4" style={card}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {openOpps.length} unique live opportunities
                </h2>
                <p className="text-[13px]" style={{ color: muted }}>
                  Audit: open {center?.opportunityAudit.uniqueOpen ?? 0} · still available {center?.opportunityAudit.stillAvailable ?? 0} ·
                  Amber can perform {center?.opportunityAudit.capableOfCompleting ?? 0} · can accept {center?.opportunityAudit.canAcceptWithCurrentAccess ?? 0} ·
                  expired/gone {center?.opportunityAudit.expiredOrGone ?? 0}
                </p>
              </div>
            </div>
            {openOpps.length === 0 ? (
              <p className="mt-3 text-[14px]" style={{ color: muted }}>No open listings on live boards right now. Run Scan Now.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {openOpps.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left hover:border-blue-300"
                    onClick={() => setOpp(o)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[15px] text-gray-900">{o.title}</strong>
                      <span className="text-[13px] font-semibold">{o.platformName} · {o.compensationUsd != null ? money(o.compensationUsd) : "pay n/a"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge>{o.connectionStatus}</Badge>
                      {o.canAcceptAutonomously ? <Badge tone="#15803d">Can bid/accept</Badge> : <Badge tone="#b45309">Cannot accept yet</Badge>}
                      {o.canPerform ? <Badge tone="#15803d">Can perform</Badge> : <Badge tone="#b91c1c">Cannot perform</Badge>}
                    </div>
                    {o.primaryBlocker && !/^No blocker|^Skill fit OK/i.test(o.primaryBlocker) ? (
                      <p className="mt-1 text-[12px] font-medium text-gray-800">
                        Blocker: {o.primaryBlocker}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 text-[13px]" style={{ color: muted }}>{o.description || "No description in source listing."}</p>
                  </button>
                ))}
              </div>
            )}
            {(center?.opportunities || []).some((o) => o.expiredOrGone) ? (
              <div className="mt-4">
                <h3 className="font-bold text-gray-800">Expired / gone from open board</h3>
                <ul className="mt-1 list-disc pl-5 text-[13px] text-gray-600">
                  {center!.opportunities.filter((o) => o.expiredOrGone).slice(0, 20).map((o) => (
                    <li key={o.id}>{o.platformName}: {o.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "active" ? (
          <section className="mt-3 p-4" style={card}>
            <h2 className="text-lg font-bold">Projects (non-rejected)</h2>
            {(center?.jobs || []).length === 0 ? (
              <p className="mt-2 text-[14px]" style={{ color: muted }}>No non-rejected project rows. Discovery may still have open opportunities above.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {center!.jobs.map((j) => (
                  <button key={j.id} type="button" className="block w-full rounded-lg border border-gray-200 p-3 text-left" onClick={() => setJob(j)}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong>{j.title}</strong>
                      <span>{j.platformName} · {j.status} · {money(j.payoutUsd)}</span>
                    </div>
                    <p className="mt-1 text-[13px]" style={{ color: muted }}>{j.workNotes || j.description.slice(0, 160)}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="mt-3 p-4" style={card}>
            <h2 className="text-lg font-bold">Work history / audit trail</h2>
            <p className="text-[13px]" style={{ color: muted }}>Every job Amber attempted — discovered → gates → accept/bid → (execution when implemented).</p>
            <div className="mt-3 space-y-2">
              {(center?.history || []).map((j) => (
                <button key={j.id} type="button" className="block w-full rounded-lg border border-gray-200 p-3 text-left" onClick={() => setJob(j)}>
                  <div className="flex flex-wrap justify-between gap-2 text-[14px]">
                    <strong>{j.title}</strong>
                    <Badge>{j.status}</Badge>
                  </div>
                  <div className="text-[12px]" style={{ color: muted }}>
                    {j.platformName} · discovered {new Date(j.discoveredAt).toLocaleString()} · updated {new Date(j.updatedAt).toLocaleString()}
                  </div>
                  {j.rejectReason ? <p className="mt-1 text-[13px] text-red-700">{j.rejectReason}</p> : null}
                  <pre className="mt-1 max-h-20 overflow-auto text-[11px] text-gray-600">{j.log.slice(-4).join("\n")}</pre>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "accounting" ? (
          <section className="mt-3 p-4" style={card}>
            <h2 className="text-lg font-bold">Accounting (verified vs potential)</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Field label="Verified paid revenue" value={money(a?.verifiedPaidRevenue || 0)} />
              <Field label="Potential opportunity value" value={money(a?.potentialOpportunityValue || 0)} />
              <Field label="Accepted job value" value={money(a?.acceptedJobValue || 0)} />
              <Field label="Submitted / receivable" value={money(a?.submittedReceivable || 0)} />
              <Field label="Pending payment" value={money(a?.pendingPayment || 0)} />
              <Field label="Expenses" value={money(a?.expenses || 0)} />
              <Field label="Verified net profit" value={money(a?.verifiedNetProfit || 0)} />
            </div>
            {(center?.ledger || []).length === 0 ? (
              <p className="mt-3 text-[14px]" style={{ color: muted }}>No confirmed ledger rows yet.</p>
            ) : (
              center!.ledger.map((l) => (
                <div key={l.id} className="flex justify-between gap-2 border-t border-gray-100 py-2 text-[13px]">
                  <span>{l.occurredAt.slice(0, 16)} · {l.platformSlug} · {l.kind} · {l.confirmed ? "CONFIRMED" : "UNVERIFIED"}</span>
                  <span className="font-semibold">{money(l.amountUsd)}</span>
                </div>
              ))
            )}
          </section>
        ) : null}

        {/* Opportunity detail */}
        {opp ? (
          <section className="mt-4 p-4" style={{ ...card, borderColor: "#93c5fd" }}>
            <div className="mb-2 flex justify-between gap-2">
              <h3 className="text-xl font-bold text-gray-900">{opp.title}</h3>
              <button type="button" className="text-[13px] font-semibold text-blue-700" onClick={() => setOpp(null)}>Close</button>
            </div>
            <Field label="Platform" value={opp.platformName} />
            <Field label="Status" value={<Badge>{opp.connectionStatus}</Badge>} />
            <Field label="Description" value={opp.description || "Not provided by source"} />
            <Field
              label="Original source"
              value={
                opp.sourceUrl ? (
                  <a className="font-semibold text-blue-700 underline" href={opp.sourceUrl} target="_blank" rel="noreferrer">
                    {opp.sourceLabel} — verify independently
                  </a>
                ) : (
                  opp.sourceLabel
                )
              }
            />
            <Field label="Compensation" value={opp.compensationUsd != null ? money(opp.compensationUsd) : "Not stated by source"} />
            <Field label="Est. expenses" value={opp.estimatedExpensesUsd != null ? money(opp.estimatedExpensesUsd) : "Not estimated"} />
            <Field label="Est. net" value={opp.estimatedNetUsd != null ? money(opp.estimatedNetUsd) : "Not estimated"} />
            <Field label="Deadline" value={opp.deadline || "Not stated by source"} />
            <Field label="Requirements" value={opp.requirements.length ? opp.requirements.join(", ") : "Not stated by source"} />
            <Field label="Skills required" value={opp.skillsRequired.length ? opp.skillsRequired.join(", ") : "Not stated by source"} />
            <Field label="Amber meets requirements" value={opp.amberMeetsRequirements == null ? "Unknown / incomplete listing" : opp.amberMeetsRequirements ? "Yes" : "No"} />
            <Field label="Account required" value={opp.accountRequired ? "Yes" : "No"} />
            <Field label="Can accept autonomously" value={opp.canAcceptAutonomously ? "Yes" : "No"} />
            <Field label="Can perform (skill fit)" value={opp.canPerform ? "Yes" : "No"} />
            <Field label="Can submit" value={opp.canSubmit ? "Yes" : "No"} />
            <Field label="Can track payment" value={opp.canTrackPayment ? "Yes" : "No"} />
            <Field label="Work category" value={opp.workCategory || "—"} />
            <Field label="Primary blocker" value={opp.primaryBlocker || "—"} />
            <Field label="Why Amber believes she can" value={opp.whyCanPerform || "—"} />
            <Field label="What blocks accept / delivery" value={opp.whyCannot || "—"} />
            <Field label="Missing capabilities" value={(opp.missingCapabilities || []).join(" · ") || "None"} />
            <Field label="Missing inputs" value={(opp.missingInputs || []).join(" · ") || "None"} />
            <Field label="Pipeline blockers" value={(opp.pipelineBlockers || []).join(" · ") || "None"} />
            <Field label="All gate notes" value={opp.capability.missing.join(" · ") || "—"} />
            <Field label="Discovered" value={new Date(opp.discoveredAt).toLocaleString()} />
            <Field label="Last verified" value={new Date(opp.lastVerifiedAt).toLocaleString()} />
            <Field label="Expired / gone" value={opp.expiredOrGone ? "Yes — no longer on open board" : "No — present on live board"} />
          </section>
        ) : null}

        {/* HQ job / nationwide opportunity detail (in-page — no HQ redirect) */}
        {hqDetail ? (
          <section className="mt-4 p-4" style={{ ...card, borderColor: "#86efac" }}>
            <div className="mb-2 flex justify-between gap-2">
              <h3 className="text-xl font-bold text-gray-900">{hqDetail.title}</h3>
              <button type="button" className="text-[13px] font-semibold text-blue-700" onClick={() => setHqDetail(null)}>
                Close
              </button>
            </div>
            <Field label="Kind" value={hqDetail.kind === "job" ? "HQ marketplace job" : "Nationwide / gov / claims opportunity"} />
            <Field label="Status" value={<Badge>{hqDetail.status}</Badge>} />
            <Field label="Meta" value={hqDetail.meta} />
            <Field label="Detail" value={hqDetail.body} />
            {hqDetail.lines.map((line) => (
              <p key={line} className="mt-1 text-[13px] text-gray-800">
                {line}
              </p>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              <GhostBtn disabled={disabled} onClick={() => void act("hq-tick")}>
                Refresh / advance HQ tick
              </GhostBtn>
            </div>
          </section>
        ) : null}

        {/* Job detail */}
        {job ? (
          <section className="mt-4 p-4" style={card}>
            <div className="mb-2 flex justify-between">
              <h3 className="text-lg font-bold">{job.title}</h3>
              <button type="button" className="text-[13px] font-semibold text-blue-700" onClick={() => setJob(null)}>Close</button>
            </div>
            <Field label="Platform" value={job.platformName} />
            <Field label="Status" value={<Badge>{job.status}</Badge>} />
            <Field label="Payout" value={money(job.payoutUsd)} />
            <Field label="Est. cost / expected profit" value={`${money(job.estimatedCostUsd)} / ${money(job.expectedProfitUsd)}`} />
            <Field label="Payment status" value={job.paymentStatus} />
            <Field label="Description" value={job.description || "—"} />
            <Field label="Work notes" value={job.workNotes || "—"} />
            <Field label="Reject reason" value={job.rejectReason || "—"} />
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-gray-50 p-2 text-[11px] text-gray-700">{job.log.join("\n") || "No activity yet."}</pre>
            <div className="mt-2 flex gap-2">
              <GhostBtn disabled={disabled} onClick={() => void act("stop-job", { jobId: job.id })}>Stop</GhostBtn>
              <GhostBtn disabled={disabled} onClick={() => void act("retry-job", { jobId: job.id })}>Retry evaluate</GhostBtn>
            </div>
          </section>
        ) : null}
      </div>
    </BusinessShell>
  );
}
