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

function pct(numerator: number, denominator: number): string {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

const OUTREACH_CAMPAIGN_LABELS: Record<string, string> = {
  ca_drop: "CA Data Broker Removal (DROP)",
  ca_accessibility: "CA ADA Accessibility",
  ca_vendor_risk: "CA Vendor Risk / Breach Notice",
  delaware_privacy: "Delaware Privacy + AI Compliance",
  business_risk: "Business Risk Intelligence API",
};

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

/**
 * Owner Actions — the one queue, and what Amber does next.
 *
 * This page used to carry two owner lists of different shapes, three sections
 * deep: "Owner Action Queue (HQ)" from the government lane and "Owner Actions
 * Needed (marketplaces)" from a raw per-platform field. Neither was ranked by
 * what clearing the item would unlock, so the thing actually worth Michael's
 * twenty minutes had no way to rise.
 *
 * HQ now does the consolidating, ranking and filtering, and this renders that
 * single result. Two components computing "what is waiting on the owner" can
 * disagree, and the one that disagrees is always the one being looked at.
 *
 * Three deliberate choices about what it says:
 *
 * ZERO ITEMS IS A STATEMENT, not an empty div. "Nothing is waiting on you"
 * is information the owner wants, and rendering nothing looks like a page
 * that failed to load.
 *
 * HELD-BACK SOURCES ARE COUNTED, not hidden. Twenty account-required sources
 * once looked like twenty lanes one signup away from revenue; seventeen were
 * shops and archives. A quietly shorter queue is the same error facing the
 * other way, so the number that was set aside stays on the page.
 *
 * "NOTHING IS AVAILABLE" IS SHOWN AS THE ANSWER IT IS. When the shortest
 * path finds no attemptable work, that is today's true state and it belongs
 * on screen next to the reasons, not replaced by the best of a bad list.
 */

/**
 * Where the scouts actually work, and what each source produces.
 *
 * The figures elsewhere on this page are activity: records fetched, searches
 * run, opportunities discovered. Every one of them was reading far higher
 * than the truth. `jobsDiscoveredLifetime` added each raw record on each
 * search, so a 37-listing board reported 46,293 "jobs discovered" — 129,766
 * across three sources against 279 distinct opportunities.
 *
 * So this shows the two numbers side by side and lets the gap speak. Three
 * rules about what it says:
 *
 * UNMEASURED READS AS UNMEASURED. A counter history never recorded shows
 * "not measured", never 0. A source with 46,293 fetches and "0 duplicates
 * suppressed" would look perfectly efficient, which is the opposite of true.
 *
 * A VERDICT IS NOT A HEALTH CHECK. Three of five connected sources report
 * healthy and have never returned a single record. "Answers every request"
 * and "produces work" are different claims and the verdict states the second.
 *
 * MONEY IS THE LAST COLUMN AND THE ONLY ONE THAT COUNTS. Everything to its
 * left is effort.
 */
/**
 * Value lanes and the specialty build decisions.
 *
 * Two questions the page could not answer before: where the money sits by
 * contract size, and what the market is paying for that Amber cannot yet do.
 *
 * The layout is built around one pairing — ADVERTISED against OBTAINABLE.
 * Every headline this system has produced has been the first kind: a $54,000
 * capability gap that was eight competitions Amber cannot enter, $4,582 of
 * specialty demand with $0 reachable. Showing advertised value alone is how
 * a pipeline looks healthy at $0.00 revenue, so the two are always adjacent
 * and obtainable is the one given the weight.
 *
 * A decision is shown with its blocking reason, because the decision alone
 * invites the wrong question — "why not build it?" — and the reason answers
 * it before it is asked.
 */
/**
 * The end-to-end funnel, as one narrowing column.
 *
 * The stages are shown adjacently and in the order money moves, because
 * every counting defect this system has produced showed up as a stage larger
 * than the one above it — 132,082 "discoveries" over 279 listings, twenty
 * "account-required opportunities" over three real ones, $54,000 "buildable"
 * over nothing buildable. Put side by side, the next one is visible without
 * an audit, and HQ writes COUNTING ERROR into its own notes when it happens.
 *
 * Three presentation rules, each earned:
 *
 * NOT MEASURED IS NOT ZERO. A stage nothing has counted reads as "not
 * measured". A confident 0 is indistinguishable from a measured absence, and
 * this system shipped that mistake in four separate counters.
 *
 * MONEY SITS APART FROM COUNTS. Advertised, obtainable and received are
 * dollars; everything above them is a tally. Mixing them is how a pipeline
 * of activity reads as revenue.
 *
 * BLOCKAGES ARE QUOTED, NOT SUMMARISED. The screening's own sentence, with
 * its count, because a paraphrase loses the thing that makes it checkable.
 */
function PipelineFunnel({
  counts,
}: {
  counts: import("@/lib/amber-earnings/hq-nationwide").PipelineCounts | null;
}) {
  const [showAll, setShowAll] = useState(false);
  if (!counts) return null;

  const fig = (v: number | null) =>
    v === null ? <span style={{ color: muted }}>not measured</span> : <span className="tabular-nums">{v.toLocaleString()}</span>;

  /** The stage where the funnel currently stops, for emphasis. */
  const firstZero = counts.stages.findIndex((s) => s.count === 0);
  const problems = counts.notes.filter((n) => n.startsWith("COUNTING ERROR"));

  return (
    <section className="mt-5">
      <h2 className="text-[17px] font-bold text-gray-900">The funnel, end to end</h2>
      <p className="mt-1 text-[13px]" style={{ color: muted }}>
        Sources checked through money received, in the order it moves. Each stage should be smaller than the one above
        it.
      </p>

      {problems.length > 0 ? (
        <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2">
          {problems.map((n, i) => (
            <p key={i} className="text-[13px] font-medium text-red-900">
              {n}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {counts.stages.map((s, i) => {
          const stops = i === firstZero;
          return (
            <div
              key={s.key}
              className="flex flex-wrap items-baseline gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0"
              style={stops ? { background: "#fef2f2" } : undefined}
            >
              <span className="min-w-[16rem] flex-1 text-[13.5px] text-gray-800">{s.label}</span>
              <span className={`text-[15px] font-bold ${stops ? "text-red-700" : "text-gray-900"}`}>{fig(s.count)}</span>
              {s.note ? (
                <span className="w-full text-[12px]" style={{ color: muted }}>
                  {s.note}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          ["Advertised", counts.money.advertisedUsd, muted],
          ["Obtainable", counts.money.obtainableUsd, undefined],
          ["Received", counts.money.receivedUsd, undefined],
        ].map(([l, v, colour], i) => (
          <div key={i} className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: label }}>
              {l as string}
            </div>
            <div className="mt-1 text-[20px] font-bold tabular-nums" style={{ color: (colour as string) || undefined }}>
              {money(v as number)}
            </div>
          </div>
        ))}
      </div>

      {counts.rejections.length > 0 ? (
        <div className="mt-3">
          <strong className="text-[14px] text-gray-900">Where opportunities stop</strong>
          <div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {(showAll ? counts.rejections : counts.rejections.slice(0, 8)).map((r, i) => (
              <div key={i} className="flex gap-3 border-b border-gray-100 px-3 py-1.5 last:border-b-0">
                <span className="w-10 shrink-0 text-right text-[13px] font-bold tabular-nums text-gray-900">{r.count}</span>
                <span className="text-[13px] text-gray-800">{r.reason}</span>
              </div>
            ))}
          </div>
          {counts.rejections.length > 8 ? (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-1.5 text-[12.5px] font-medium text-sky-700 hover:underline"
            >
              {showAll ? "Show fewer" : `Show all ${counts.rejections.length} reasons`}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <strong className="text-[14px] text-gray-900">By source</strong>
          <div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {counts.bySource.slice(0, 10).map((r) => (
              <div key={r.source} className="flex flex-wrap items-baseline gap-2 border-b border-gray-100 px-3 py-1.5 last:border-b-0">
                <span className="flex-1 truncate text-[13px] text-gray-800">{r.source}</span>
                <span className="text-[12px]" style={{ color: muted }}>
                  {r.priced} priced
                </span>
                <span className="text-[14px] font-bold tabular-nums text-gray-900">{r.opportunities}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <strong className="text-[14px] text-gray-900">By country</strong>
          <div className="mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {counts.byCountry.slice(0, 10).map((r) => (
              <div key={r.country} className="flex flex-wrap items-baseline gap-2 border-b border-gray-100 px-3 py-1.5 last:border-b-0">
                <span className="flex-1 truncate text-[13px] text-gray-800">{r.country}</span>
                <span className="text-[12px]" style={{ color: muted }}>
                  {r.priced} priced
                </span>
                <span className="text-[14px] font-bold tabular-nums text-gray-900">{r.opportunities}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {counts.notes.filter((n) => !n.startsWith("COUNTING ERROR")).length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {counts.notes
            .filter((n) => !n.startsWith("COUNTING ERROR"))
            .map((n, i) => (
              <li key={i} className="text-[12.5px]" style={{ color: muted }}>
                {n}
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}

function SpecialtyCenter({
  lanes,
  growth,
}: {
  lanes: import("@/lib/amber-earnings/hq-nationwide").LaneReport | null;
  growth: import("@/lib/amber-earnings/hq-nationwide").GrowthReport | null;
}) {
  const [openCase, setOpenCase] = useState<string | null>(null);
  if (!lanes && !growth) return null;

  const decisionTone: Record<string, string> = {
    BUILD: "#15803d",
    WATCH: "#b45309",
    REJECT: "#b91c1c",
  };

  return (
    <section className="mt-5">
      <h2 className="text-[17px] font-bold text-gray-900">Specialty markets</h2>
      <p className="mt-1 text-[13px]" style={{ color: muted }}>
        What the market pays for, by contract size and by specialty. Advertised value sits beside what Amber has a
        credible route to — the second is the only figure that may justify spending.
      </p>

      {lanes ? (
        <div className="mt-2.5 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50">
                {["Lane", "Opportunities", "Advertised", "Obtainable", "Received"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-gray-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: label }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lanes.lanes.map((l) => (
                <tr key={l.id}>
                  <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-900">{l.label}</td>
                  <td className="border-b border-gray-100 px-3 py-2 tabular-nums">{l.opportunities}</td>
                  <td className="border-b border-gray-100 px-3 py-2 tabular-nums" style={{ color: muted }}>
                    {money(l.advertisedValueUsd)}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 font-bold tabular-nums text-gray-900">
                    {money(l.obtainableValueUsd)}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 tabular-nums">{money(l.verifiedRevenueUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {lanes && lanes.unpriced > 0 ? (
        <p className="mt-1.5 text-[12.5px]" style={{ color: muted }}>
          {lanes.unpriced} opportunity(ies) publish no value at all and are in no lane. An unpriced solicitation is
          unknown, not cheap — putting it in the smallest lane would give the largest contracts the least scrutiny.
        </p>
      ) : null}

      {growth ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <strong className="text-[14px] text-gray-900">Capability decisions</strong>
            <Badge tone={growth.buildCount > 0 ? "#15803d" : "#475569"}>
              {growth.buildCount} build · {growth.watchCount} watch · {growth.rejectCount} reject
            </Badge>
          </div>

          {growth.recommended ? (
            <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: label }}>
                Build next
              </div>
              <p className="mt-0.5 text-[14px] font-semibold text-gray-900">{growth.recommended.label}</p>
              <p className="mt-0.5 text-[13px]" style={{ color: muted }}>
                {money(growth.recommended.obtainableValueUsd)} obtainable from {growth.recommended.distinctBuyers}{" "}
                buyer(s) · expected return {money(growth.recommended.expectedReturnUsd ?? 0)} on a{" "}
                {money(growth.recommended.buildCostUsd)} build · reusable across {growth.recommended.reuseBreadth}{" "}
                industry(ies)
              </p>
              {!growth.recommended.winProbabilityIsMeasured ? (
                <p className="mt-1 text-[12px] font-medium text-amber-700">
                  Its win probability is an assumption, not a measurement. Amber has won nothing yet.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-800">
              <strong>Nothing is worth building yet.</strong> A capability needs more than one buyer, value Amber can
              actually reach, economics that survive the win rate, and an eligibility path that exists.
            </p>
          )}

          <div className="mt-2 space-y-1.5">
            {growth.cases.slice(0, 12).map((c) => {
              const open = openCase === c.specialtyId;
              return (
                <div key={c.specialtyId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenCase(open ? null : c.specialtyId)}
                    aria-expanded={open}
                    className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <Badge tone={decisionTone[c.decision] || "#475569"}>{c.decision.toLowerCase()}</Badge>
                    <span className="text-[13.5px] font-semibold text-gray-900">{c.label}</span>
                    <span className="text-[12.5px]" style={{ color: muted }}>
                      {c.distinctBuyers} buyer(s) · {c.opportunities} opportunity(ies)
                    </span>
                    <span className="ml-auto text-[12.5px]" style={{ color: muted }}>
                      {money(c.advertisedValueUsd)} advertised
                    </span>
                    <span className="text-[13.5px] font-bold tabular-nums text-gray-900">
                      {money(c.obtainableValueUsd)}
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2.5">
                      <ul className="space-y-0.5">
                        {c.reasons.map((r, i) => (
                          <li key={i} className="text-[12.5px] text-gray-800">
                            {r}
                          </li>
                        ))}
                      </ul>
                      {c.blockedBy.length > 0 ? (
                        <ul className="mt-1.5 space-y-0.5">
                          {c.blockedBy.map((b, i) => (
                            <li key={i} className="text-[12.5px] font-medium text-amber-800">
                              Blocked: {b}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {growth.notes.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {growth.notes.map((n, i) => (
                <li key={i} className="text-[12.5px]" style={{ color: muted }}>
                  {n}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function SourceFunnel({ report }: { report: import("@/lib/amber-earnings/hq-nationwide").YieldReport | null }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!report) return null;

  const t = report.totals;
  const fig = (v: number | null) =>
    v === null ? <span style={{ color: muted }}>not measured</span> : <span className="tabular-nums">{v.toLocaleString()}</span>;

  const tone: Record<string, string> = {
    PRODUCTIVE: "#15803d",
    RESCANNING: "#b45309",
    NOTHING_FOR_AMBER: "#b91c1c",
    IDLE: "#b91c1c",
    EMPTY: "#b91c1c",
    STOPPED: "#475569",
    UNMEASURED: "#475569",
  };

  const looksPerListing =
    t.uniqueOpportunities > 0 && t.rawRecordsFetched > 0 ? Math.round(t.rawRecordsFetched / t.uniqueOpportunities) : null;

  return (
    <section className="mt-5">
      <h2 className="text-[17px] font-bold text-gray-900">Where the scouts are working</h2>
      <p className="mt-1 text-[13px]" style={{ color: muted }}>
        Scouts assigned through money received, per source. Computed from the scout network and the earnings ledger
        together.
      </p>

      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Scouts assigned", fig(t.scoutsAssigned)],
          ["Have ever searched", fig(t.scoutsExecuted)],
          ["Never ran", fig(t.scoutsNeverExecuted)],
          ["Records fetched", fig(t.rawRecordsFetched)],
          ["Distinct opportunities", fig(t.uniqueOpportunities)],
          ["Verified revenue", <span key="r" className="tabular-nums">{money(t.verifiedRevenueUsd)}</span>],
        ].map(([l, v], i) => (
          <div key={i} className="p-3" style={card}>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: label }}>{l}</div>
            <div className="mt-1 text-[18px] font-bold text-gray-900">{v}</div>
          </div>
        ))}
      </div>

      {looksPerListing !== null && looksPerListing >= 20 ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          <strong className="tabular-nums">{t.rawRecordsFetched.toLocaleString()}</strong> records fetched over{" "}
          <strong className="tabular-nums">{t.uniqueOpportunities}</strong> distinct opportunities — about{" "}
          <strong className="tabular-nums">{looksPerListing}</strong> looks per listing. Fetching is not discovery.
        </p>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {report.sources.map((s) => {
          const isOpen = open === s.source;
          return (
            <div key={s.source} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.source)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <Badge tone={tone[s.verdict] || "#475569"}>{s.verdict.replace(/_/g, " ").toLowerCase()}</Badge>
                <span className="text-[14px] font-semibold text-gray-900">{s.source}</span>
                <span className="flex-1 text-[13px]" style={{ color: muted }}>{s.summary}</span>
                <span className="text-[15px] font-bold tabular-nums text-gray-900">{money(s.verifiedRevenueUsd)}</span>
              </button>

              {isOpen ? (
                <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2.5">
                  <ul className="space-y-1">
                    {s.stages.map((st) => (
                      <li key={st.key} className="flex flex-wrap items-baseline gap-2 text-[13px]">
                        <span className="min-w-[15rem] flex-1 text-gray-800">{st.label}</span>
                        <span className="font-semibold text-gray-900">{fig(st.count)}</span>
                        {st.note ? (
                          <span className="w-full text-[12px] sm:w-auto" style={{ color: muted }}>— {st.note}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {s.overlap.foundByMultipleScouts > 0 ? (
                    <p className="mt-2 text-[12.5px]" style={{ color: muted }}>
                      {s.overlap.foundByMultipleScouts} listing(s) found by more than one scout
                      {s.overlap.avgScoutsPerOpportunity !== null
                        ? `, averaging ${s.overlap.avgScoutsPerOpportunity} scouts each`
                        : ""}
                      {s.overlap.mostScoutsOnOneListing
                        ? ` — one by ${s.overlap.mostScoutsOnOneListing.scouts} separate scouts`
                        : ""}
                      .
                    </p>
                  ) : null}

                  {s.mostRescanned ? (
                    <p className="mt-1 text-[12.5px]" style={{ color: muted }}>
                      Most re-read: &ldquo;{s.mostRescanned.title}&rdquo; at {s.mostRescanned.sightings} sightings.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {report.notes.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {report.notes.map((n, i) => (
            <li key={i} className="text-[12.5px]" style={{ color: muted }}>{n}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function OwnerActions({
  queue,
  path,
}: {
  queue: import("@/lib/amber-earnings/hq-nationwide").OwnerActionQueue | null;
  path: import("@/lib/amber-earnings/hq-nationwide").ShortestPath | null;
}) {
  if (!queue && !path) return null;

  const actions = queue?.actions ?? [];

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[17px] font-bold text-gray-900">Owner Actions</h2>
        {queue ? (
          <Badge tone={queue.revenueBlockingCount > 0 ? "#b91c1c" : "#475569"}>
            {actions.length === 0
              ? "nothing waiting"
              : `${actions.length} item${actions.length === 1 ? "" : "s"}${
                  queue.revenueBlockingCount > 0 ? ` · ${queue.revenueBlockingCount} blocking money` : ""
                }`}
          </Badge>
        ) : null}
      </div>

      {/* What Amber would do next, or why she cannot do anything. */}
      {path ? (
        <div
          className="mt-2 rounded-lg border p-3"
          style={{ borderColor: path.next ? "#bbf7d0" : "#e2e8f0", background: path.next ? "#f0fdf4" : "#f8fafc" }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: label }}>
            Fastest route to the first dollar
          </div>
          {path.next ? (
            <>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">
                {path.next.candidate.platform} — {path.next.candidate.title}
              </p>
              <p className="mt-0.5 text-[13px]" style={{ color: muted }}>
                {path.next.reasoning}
              </p>
              {!path.next.winProbabilityIsMeasured ? (
                <p className="mt-1 text-[12px] font-medium text-amber-700">
                  The win rate in that estimate is assumed, not measured — Amber has won nothing yet.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">Nothing is available to attempt right now.</p>
              <ul className="mt-1 space-y-0.5">
                {path.notes.slice(1, 6).map((n, i) => (
                  <li key={i} className="text-[13px]" style={{ color: muted }}>
                    {n.trim()}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[12px]" style={{ color: muted }}>
                {path.blockedCount} blocked · {path.unprofitableCount} would lose money or pay too little.
              </p>
            </>
          )}
        </div>
      ) : null}

      {actions.length === 0 ? (
        <p className="mt-2 text-[13px]" style={{ color: muted }}>
          Nothing is waiting on you. {queue?.unblockedWorkNote}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {actions.map((a) => (
            <article
              key={a.id}
              className="rounded-lg border p-3"
              style={{ borderColor: a.revenueBlocking ? "#fecaca" : "#e2e8f0", background: a.revenueBlocking ? "#fef2f2" : "#fff" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={a.revenueBlocking ? "#b91c1c" : "#475569"}>{a.source}</Badge>
                {a.revenueBlocking ? <Badge tone="#b91c1c">blocks money</Badge> : null}
                {a.expectedValueUsd > 0 ? (
                  <span className="text-[13px] font-bold text-gray-900">{money(a.expectedValueUsd)} unlocked</span>
                ) : null}
              </div>

              <p className="mt-1 text-[14px] font-semibold text-gray-900">{a.expectedOpportunity}</p>
              {a.whyRequired ? (
                <p className="mt-0.5 text-[13px]" style={{ color: muted }}>{a.whyRequired}</p>
              ) : null}

              {a.exactSteps.length > 0 ? (
                <ol className="mt-1.5 list-decimal space-y-0.5 pl-5">
                  {a.exactSteps.map((s, i) => (
                    <li key={i} className="text-[13px] text-gray-800">{s}</li>
                  ))}
                </ol>
              ) : null}

              {a.whereToClick ? (
                <a
                  href={a.whereToClick}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[12.5px] font-medium text-sky-700 hover:underline"
                >
                  {a.whereToClick} ↗
                </a>
              ) : null}

              {a.resumesFrom ? (
                <p className="mt-1 text-[12px]" style={{ color: muted }}>{a.resumesFrom}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {queue && queue.notPayers.length > 0 ? (
        <p className="mt-2 text-[12px]" style={{ color: muted }}>
          {queue.notPayers.length} source{queue.notPayers.length === 1 ? "" : "s"} held back: not places that pay for
          work ({[...new Set(queue.notPayers.map((n) => n.source))].slice(0, 6).join(", ")}
          {queue.notPayers.length > 6 ? "…" : ""}). An account there would not put money in your bank.
        </p>
      ) : null}

      {queue && queue.duplicatesMerged > 0 ? (
        <p className="mt-1 text-[12px]" style={{ color: muted }}>
          {queue.duplicatesMerged} duplicate{queue.duplicatesMerged === 1 ? "" : "s"} merged — two subsystems
          describing one errand is still one trip.
        </p>
      ) : null}
    </section>
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

        {/*
          Owner Actions — the one queue, directly under the money.
          Money first because it is the truth; this second because it is the
          only thing on the page that needs the owner rather than Amber.
        */}
        <OwnerActions queue={nationwide?.ownerActionQueue ?? null} path={nationwide?.shortestPath ?? null} />

        {/* Where the effort goes, directly under what is waiting on the owner. */}
        <SourceFunnel report={nationwide?.yieldReport ?? null} />

        {/* What the market pays for, under where the effort goes. */}
        {/* The funnel first: it is the shape of everything below. */}
        <PipelineFunnel counts={nationwide?.pipelineCounts ?? null} />

        <SpecialtyCenter lanes={nationwide?.laneReport ?? null} growth={nationwide?.growthReport ?? null} />


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
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["HQ pending payment", money(nationwide.hqMoney.pendingPaymentUsd)],
                    ["HQ verified paid", money(nationwide.hqMoney.verifiedPaidRevenueUsd)],
                    ["HQ net profit", money(nationwide.hqMoney.netProfitUsd)],
                    ["HQ jobs won", nationwide.hqMoney.jobsWon],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="p-3" style={card}>
                      <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{l}</div>
                      <div className="mt-1 text-[20px] font-bold">{v}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[12px]" style={{ color: muted }}>
                  Real TaskBounty / SporeAgent / MoltJobs money from the shared HQ store — a won job shows here as
                  pending until HQ verifies the platform paid out. See it by title below under &ldquo;HQ marketplace jobs.&rdquo;
                </p>

                <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-gray-900">Amber&rsquo;s economic state</h3>
                    <span
                      className="rounded px-2 py-1 text-[11px] font-bold uppercase"
                      style={{
                        color:
                          nationwide.hqEconomics.economicState === "PROFITABLE" || nationwide.hqEconomics.economicState === "SCALING"
                            ? "#166534"
                            : nationwide.hqEconomics.economicState === "AT_RISK" || nationwide.hqEconomics.economicState === "PAUSED"
                              ? "#991b1b"
                              : "#92400e",
                        background:
                          nationwide.hqEconomics.economicState === "PROFITABLE" || nationwide.hqEconomics.economicState === "SCALING"
                            ? "#dcfce7"
                            : nationwide.hqEconomics.economicState === "AT_RISK" || nationwide.hqEconomics.economicState === "PAUSED"
                              ? "#fee2e2"
                              : "#fef3c7",
                      }}
                    >
                      {nationwide.hqEconomics.economicState}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: muted }}>
                    Amber-earned capital only — separate from your own funds, starts at $0, and combines every real
                    marketplace job above with every other real earning source (e.g. ebook sales) reporting through
                    the same ledger.{" "}
                    {nationwide.hqEconomics.firstRealDollarAt
                      ? `First real dollar: ${new Date(nationwide.hqEconomics.firstRealDollarAt).toLocaleDateString()}.`
                      : "No real dollar earned yet."}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Earned capital", money(nationwide.hqEconomics.earnedCapitalUsd)],
                      ["Gross revenue", money(nationwide.hqEconomics.grossRevenueUsd)],
                      ["Lifetime revenue", money(nationwide.hqEconomics.lifetimeRevenueUsd)],
                      ["Lifetime net profit", money(nationwide.hqEconomics.lifetimeNetProfitUsd)],
                      ["Growth capital", money(nationwide.hqEconomics.growthCapitalUsd)],
                      ["Reserved capital", money(nationwide.hqEconomics.reservedCapitalUsd)],
                    ].map(([l, v]) => (
                      <div key={String(l)} className="p-3" style={card}>
                        <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{l}</div>
                        <div className="mt-1 text-[18px] font-bold text-gray-900">{v}</div>
                      </div>
                    ))}
                  </div>
                  {Object.values(nationwide.hqEconomics.costBreakdown).some((v) => v > 0) ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {Object.entries(nationwide.hqEconomics.costBreakdown).map(([cat, v]) => (
                        <div key={cat} className="p-3" style={card}>
                          <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{cat.replace(/_/g, " ")}</div>
                          <div className="mt-1 text-[16px] font-bold text-gray-900">{money(v)}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <h3 className="text-[15px] font-bold text-gray-900">Verified earnings — by time window</h3>
                  <p className="mt-1 text-[12px]" style={{ color: muted }}>
                    Counts a job only once it has real payment evidence — never a task marked done.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                      ["Today", nationwide.hqBreakdowns.windows.today],
                      ["Last 7 days", nationwide.hqBreakdowns.windows.last7d],
                      ["Last 30 days", nationwide.hqBreakdowns.windows.last30d],
                      ["Lifetime", nationwide.hqBreakdowns.windows.lifetime],
                    ] as const).map(([l, w]) => (
                      <div key={l} className="p-3" style={card}>
                        <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{l}</div>
                        <div className="mt-1 text-[18px] font-bold text-gray-900">{money(w.verifiedPaidRevenueUsd)}</div>
                        <div className="mt-0.5 text-[11px]" style={{ color: muted }}>
                          net {money(w.netProfitUsd)} · {w.jobsPaid} paid
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(nationwide.hqBreakdowns.byDivision.length > 0 || nationwide.hqBreakdowns.byAgent.length > 0) ? (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <h3 className="text-[15px] font-bold text-gray-900">Revenue by division &amp; agent</h3>
                    <p className="mt-1 text-[12px]" style={{ color: muted }}>
                      Every row is real verified payment or a real earning event — zeros are honest, not missing data.
                    </p>
                    {([
                      ["Division", nationwide.hqBreakdowns.byDivision],
                      ["Agent / worker", nationwide.hqBreakdowns.byAgent],
                    ] as const).map(([heading, rows]) => (
                      <div key={heading} className="mt-3 overflow-x-auto">
                        <div className="text-[11px] font-bold uppercase" style={{ color: label }}>{heading}</div>
                        <table className="mt-1 w-full min-w-[520px] text-left text-[13px]">
                          <thead>
                            <tr style={{ color: label }}>
                              <th className="py-1 pr-3 font-semibold">Name</th>
                              <th className="py-1 pr-3 font-semibold">Verified paid</th>
                              <th className="py-1 pr-3 font-semibold">Pending</th>
                              <th className="py-1 pr-3 font-semibold">Expenses</th>
                              <th className="py-1 pr-3 font-semibold">Net</th>
                              <th className="py-1 pr-3 font-semibold">Won / paid</th>
                              <th className="py-1 pr-3 font-semibold">In flight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.key} className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                <td className="py-1 pr-3 font-medium text-gray-900">{r.key.replace(/_/g, " ")}</td>
                                <td className="py-1 pr-3">{money(r.verifiedPaidRevenueUsd)}</td>
                                <td className="py-1 pr-3" style={{ color: muted }}>{money(r.pendingPaymentUsd)}</td>
                                <td className="py-1 pr-3" style={{ color: muted }}>{money(r.expensesUsd)}</td>
                                <td className="py-1 pr-3 font-medium">{money(r.netProfitUsd)}</td>
                                <td className="py-1 pr-3">{r.jobsWon} / {r.jobsPaid}</td>
                                <td className="py-1 pr-3" style={{ color: muted }}>{r.jobsInFlight}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : null}

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

        {nationwide?.ok && nationwide.outreachFunnels?.length ? (
          <section className="mt-4 p-4" style={card}>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer acquisition outreach</h2>
              <p className="mt-1 text-[13px]" style={{ color: muted }}>
                Real send funnels for Amber&rsquo;s three active outreach campaigns, tracked from Resend delivery
                and engagement webhooks. Purchases/conversions are not shown here — nothing in this system yet
                links a clicked prospect to an actual signup or payment, so that number would be a guess, not data.
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {nationwide.outreachFunnels.map((f) => (
                <article key={f.productSlug} className="p-3" style={card}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-[14px] text-gray-900">
                      {OUTREACH_CAMPAIGN_LABELS[f.productSlug] || f.productSlug}
                    </strong>
                    <span className="text-[12px]" style={{ color: muted }}>{f.productSlug}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {[
                      ["Sent", f.sent, null],
                      ["Delivered", f.delivered, pct(f.delivered, f.sent)],
                      ["Opened", f.opened, pct(f.opened, f.delivered || f.sent)],
                      ["Clicked", f.clicked, pct(f.clicked, f.opened || f.delivered || f.sent)],
                      ["Replied", f.replied, pct(f.replied, f.sent)],
                      ["Bounced", f.bounced, pct(f.bounced, f.sent)],
                      ["Complained", f.complained, pct(f.complained, f.sent)],
                    ].map(([l, v, rate]) => (
                      <div key={String(l)} className="p-2">
                        <div className="text-[10px] font-bold uppercase" style={{ color: label }}>{l}</div>
                        <div className="mt-0.5 text-[18px] font-bold text-gray-900">{v}</div>
                        {rate ? (
                          <div className="text-[11px]" style={{ color: muted }}>{rate} of {l === "Delivered" ? "sent" : "prior stage"}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-2 text-[12px]" style={{ color: muted }}>
              Bounced/complained/unsubscribed addresses are automatically suppressed from future sends. Prospects who
              open or click are prioritized for a single, gated follow-up — nobody who bounces, complains, or
              unsubscribes is re-contacted.
            </p>
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
