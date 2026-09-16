"use client";

/**
 * Amber's live operating truth, on one screen.
 *
 * Two rules this component exists to keep:
 *
 *  1. REGISTERED IS NOT WORKING. Every "working" figure comes from a
 *     production execution record with a timestamp. The registry total is
 *     shown beside it, greyed, as the denominator it is -- never as the
 *     answer.
 *  2. NULL IS NOT ZERO. A metric production could not be asked renders as
 *     NOT MEASURED. "Nothing ran" and "we could not ask" look identical on a
 *     dashboard that prints 0 for both, and they call for opposite responses.
 */
import { useCallback, useEffect, useState } from "react";
import type { AmberOperations, OwnerSummary, Section, ReloLedgerRow, LedgerBasis } from "@/lib/amber/operations-telemetry";
import type { OwnerEscalationView, ActivityEventView } from "@/lib/amber/operations-views";
import type { ConnectAmberResult } from "@/lib/amber/connect-amber";
// Values, not just types: imported from the view module so this client
// component never pulls the telemetry module's server-only graph into the
// browser bundle.
import { escalationsFrom, activityFrom } from "@/lib/amber/operations-views";

const REFRESH_MS = 60_000;

function Num({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-sm font-medium text-white/35">NOT MEASURED</span>;
  return (
    <span className="tabular-nums">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

function Money({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm font-medium text-white/35">NOT MEASURED</span>;
  return <span className="tabular-nums">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
}

/** working / registered, with the denominator visibly subordinate. */
function Ratio({ working, registered }: { working: number | null; registered: number | null }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={working === null ? "" : working > 0 ? "text-[#7ee787]" : "text-[#ff9aa3]"}>
        <Num value={working} />
      </span>
      {registered !== null && (
        <span className="text-sm font-normal text-white/35">/ {registered.toLocaleString()}</span>
      )}
    </span>
  );
}

function Tile({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-1 font-display text-xl font-bold leading-tight sm:text-2xl">{children}</div>
      {hint && <div className="mt-1 text-[11px] leading-snug text-white/40">{hint}</div>}
    </div>
  );
}

/**
 * CONNECT AMBER.
 *
 * One press. Relo asks Amber HQ to establish the bridge; Amber does it with
 * credentials she already holds; Relo then re-reads the telemetry so the page
 * proves the result rather than merely announcing it.
 *
 * The owner is never shown, asked for, or required to copy a secret. Three
 * states only, in the owner's words: CONNECTING…, CONNECTED, or NEEDS OWNER
 * ATTENTION with a plain-English reason.
 */
function ConnectAmberButton({ onConnected }: { onConnected: () => Promise<void> | void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ConnectAmberResult | null>(null);

  const press = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/amber-connect", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; result?: ConnectAmberResult; error?: string };
      if (json.result) {
        setResult(json.result);
        // Prove it. A button that says CONNECTED without the page filling in
        // has told the owner nothing they can rely on.
        if (json.ok) await onConnected();
      } else {
        setResult({
          at: new Date().toISOString(),
          channel: null,
          outcome: "NEEDS_OWNER_ATTENTION",
          message: json.error || "Relo could not complete the request.",
          whatToDo: null,
          hqStatus: null,
        });
      }
    } catch (e) {
      setResult({
        at: new Date().toISOString(),
        channel: null,
        outcome: "NEEDS_OWNER_ATTENTION",
        message: e instanceof Error ? e.message : "The request failed.",
        whatToDo: null,
        hqStatus: null,
      });
    } finally {
      setBusy(false);
    }
  }, [onConnected]);

  const connected = result?.outcome === "CONNECTED";

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={press}
        disabled={busy}
        className={`w-full rounded-xl px-4 py-3 font-display text-base font-bold transition sm:w-auto sm:px-8 ${
          connected
            ? "bg-[#7ee787]/15 text-[#7ee787] ring-1 ring-[#7ee787]/40"
            : "bg-[#ff8892] text-black disabled:opacity-60"
        }`}
      >
        {busy ? "CONNECTING…" : connected ? "CONNECTED ✓" : "CONNECT AMBER"}
      </button>

      {!result && !busy && (
        <p className="mt-2 text-xs leading-relaxed text-white/45">
          Press once. Amber establishes the connection herself using her own credentials — nothing to copy, and no
          secret is ever shown here.
        </p>
      )}

      {result && (
        <div
          className={`mt-2 rounded-xl border p-3 ${
            connected ? "border-[#7ee787]/30 bg-[#7ee787]/[0.06]" : "border-[#ffd479]/30 bg-[#ffd479]/[0.06]"
          }`}
        >
          <div className={`font-display text-sm font-bold ${connected ? "text-[#7ee787]" : "text-[#ffd479]"}`}>
            {connected
              ? "CONNECTED"
              : result.outcome === "HQ_NOT_DEPLOYED_YET"
                ? "ALMOST — AMBER IS STILL DEPLOYING"
                : "NEEDS OWNER ATTENTION"}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-white/75">{result.message}</p>
          {result.whatToDo && <p className="mt-1 text-sm leading-relaxed text-white/55">{result.whatToDo}</p>}
        </div>
      )}
    </div>
  );
}

/** One link in the Amber -> HQ -> Relo chain, with its own state. */
function Link({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-white/60">
      <span className={ok ? "text-[#7ee787]" : "text-[#ff9aa3]"}>{ok ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}

function StatusPill({ state, label }: { state: "good" | "bad" | "warn" | "unknown"; label: string }) {
  const tone =
    state === "good" ? "border-[#7ee787]/40 bg-[#7ee787]/10 text-[#7ee787]"
    : state === "bad" ? "border-[#ff9aa3]/40 bg-[#ff9aa3]/10 text-[#ff9aa3]"
    : state === "warn" ? "border-[#ffd479]/40 bg-[#ffd479]/10 text-[#ffd479]"
    : "border-white/15 bg-white/5 text-white/50";
  return <span className={`inline-flex rounded-full border px-3 py-1 font-display text-sm font-bold ${tone}`}>{label}</span>;
}

/** A bridge section, expandable to its raw production payload. */
/**
 * The complete reason breakdown, in the owner's language.
 *
 * Production reported 451 found and 0 executable. The drill-down carries the
 * raw report; this is the version that can be read on a phone, and it keeps
 * the two columns apart on purpose — work Amber owes, and asks only the owner
 * can answer. Mixing them is how engineering ends up parked in an owner queue.
 */
function WhyNothingExecutable({ section }: { section: Section }) {
  if (!section.ok) return null;
  const payload = section.data as {
    report?: Record<string, unknown>;
    funnel?: {
      total?: number;
      gates?: Array<{ stage: string; remaining: number; lost: number; test: string; lostBecause?: Array<{ reason: string; count: number }> }>;
      bottleneck?: { stage: string; lost: number; why: string } | null;
    };
  } | null;
  /**
   * The blocker report moved under `report` when the funnel joined it on the
   * same action. Both shapes are read so a Relo deploy landing before Amber's
   * still renders rather than blanking the panel.
   */
  const d = ((payload?.report ?? payload) ?? null) as {
    total?: number;
    executable?: number;
    repairableByAmber?: number;
    ownerBlocked?: number;
    balances?: boolean;
    reasons?: Array<{ key: string; label: string; count: number; owner: string | null; whatWouldFix: string }>;
    ownerActions?: Array<{ action: string; sources: string[]; opportunitiesUnblocked: number }>;
    rejections?: {
      storedRejected: number;
      currentQualificationVersion: number;
      genuine: number;
      stale: number;
      staleAndNowPassing: number;
      note: string;
    };
    submitPathBuildQueue?: Array<{
      source: string;
      blocked: number;
      pricedValueUsd: number;
      unpricedCount: number;
      largestPayoutUsd: number;
      whyNoPath: string;
    }>;
  } | null;
  if (!d || typeof d.total !== "number") return null;
  const funnel = payload?.funnel;
  const rej = d.rejections;

  const reasons = (d.reasons ?? []).filter((r) => r.key !== "executable");
  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="font-display text-base font-bold">Why nothing is executable</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">
        Every opportunity on record, not a sample. {d.total} found, {d.executable ?? 0} executable.
      </p>

      {d.balances === false && (
        <p className="mt-2 rounded-xl border border-[#ff9aa3]/40 bg-[#ff9aa3]/10 p-2 text-[12px] text-[#ff9aa3]">
          The reason counts do not sum to the total, so this breakdown is incomplete. Read it as such.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Amber can fix</div>
          <div className="mt-1 font-display text-xl font-bold tabular-nums">{d.repairableByAmber ?? 0}</div>
        </div>
        <div className="rounded-xl border border-[#f0b429]/30 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Needs you</div>
          <div className="mt-1 font-display text-xl font-bold tabular-nums text-[#f0b429]">{d.ownerBlocked ?? 0}</div>
        </div>
      </div>

      {/* The gate-by-gate funnel: which gate actually closed. */}
      {Array.isArray(funnel?.gates) && funnel.gates.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Funnel, gate by gate</div>
          <ol className="mt-2 space-y-1">
            <li className="flex items-baseline justify-between gap-2 text-[12px]">
              <span className="text-white/70">total on record</span>
              <span className="font-display font-bold tabular-nums">{(funnel.total ?? d.total ?? 0).toLocaleString()}</span>
            </li>
            {funnel.gates.map((g) => (
              <li key={g.stage} className="border-t border-white/5 pt-1">
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="text-white/70">{g.stage.replace(/_/g, " ")}</span>
                  <span className="flex items-baseline gap-2">
                    {g.lost > 0 && <span className="text-[11px] text-[#ff9aa3]">−{g.lost.toLocaleString()}</span>}
                    <span className="font-display font-bold tabular-nums">
                      {/* remaining is -1 when the stage could not be measured. */}
                      {g.remaining < 0 ? <span className="text-sm font-medium text-white/35">NOT MEASURED</span> : g.remaining.toLocaleString()}
                    </span>
                  </span>
                </div>
                {(g.lostBecause ?? []).slice(0, 2).map((b) => (
                  <div key={b.reason} className="mt-0.5 text-[11px] leading-snug text-white/35">
                    {b.reason}
                    {b.count > 0 && ` (${b.count.toLocaleString()})`}
                  </div>
                ))}
              </li>
            ))}
          </ol>
          {funnel.bottleneck && (
            <p className="mt-2 text-[11px] leading-snug text-white/45">
              Biggest loss Amber controls: <span className="text-white/70">{funnel.bottleneck.stage.replace(/_/g, " ")}</span> lost{" "}
              {funnel.bottleneck.lost.toLocaleString()} — {funnel.bottleneck.why}
            </p>
          )}
        </div>
      )}

      {/* Genuine rejections vs stale ones — they look identical on a stored row. */}
      {rej && rej.storedRejected > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 p-3 text-[12px]">
          <div className="text-[11px] uppercase tracking-wide text-white/45">
            Rejections, by which rules decided them (current v{rej.currentQualificationVersion})
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <div className="font-display text-lg font-bold tabular-nums">{rej.genuine.toLocaleString()}</div>
              <div className="text-[11px] text-white/45">genuine — the answer stands</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold tabular-nums text-[#f0b429]">{rej.stale.toLocaleString()}</div>
              <div className="text-[11px] text-white/45">stale — awaiting re-ask</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold tabular-nums text-[#7ee787]">{rej.staleAndNowPassing.toLocaleString()}</div>
              <div className="text-[11px] text-white/45">stale AND passing now</div>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-white/35">{rej.note}</p>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {reasons.map((r) => (
          <div key={r.key} className="rounded-xl border border-white/10 p-3 text-[12px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{r.label}</span>
              <span className="shrink-0 tabular-nums font-semibold">{r.count}</span>
            </div>
            <div className="mt-1 text-white/50">{r.whatWouldFix}</div>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                r.owner === "owner"
                  ? "border-[#f0b429]/40 bg-[#f0b429]/10 text-[#f0b429]"
                  : "border-white/15 bg-white/5 text-white/55"
              }`}
            >
              {r.owner === "owner" ? "Needs you" : "Amber's own work"}
            </span>
          </div>
        ))}
      </div>

      {/* What to build next, ranked by the money actually on those boards. */}
      {(d.submitPathBuildQueue ?? []).length > 0 && (
        <div className="mt-3 rounded-xl border border-[#7ee787]/30 bg-[#7ee787]/[0.04] p-3">
          <div className="text-[12px] font-semibold text-[#7ee787]">Submit paths worth building, highest value first</div>
          <p className="mt-1 text-[11px] leading-snug text-white/45">
            Sources whose only blocker is that no submission path exists yet. Ranked on published payouts only — an
            unpriced notice is counted but never valued.
          </p>
          <ul className="mt-2 space-y-2">
            {(d.submitPathBuildQueue ?? []).slice(0, 6).map((q, i) => (
              <li key={q.source} className="rounded-lg border border-white/10 p-2 text-[12px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">
                    {i + 1}. {q.source}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-[#7ee787]">
                    ${q.pricedValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  {q.blocked.toLocaleString()} blocked
                  {q.unpricedCount > 0 && `, ${q.unpricedCount.toLocaleString()} unpriced`}
                  {q.largestPayoutUsd > 0 && `, largest $${q.largestPayoutUsd.toLocaleString()}`}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-white/35">{q.whyNoPath}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(d.ownerActions ?? []).length > 0 && (
        <div className="mt-3 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 p-3">
          <div className="text-[12px] font-semibold text-[#f0b429]">What only you can do</div>
          <ul className="mt-2 space-y-2">
            {(d.ownerActions ?? []).map((a) => (
              <li key={a.action} className="text-[12px] leading-relaxed text-[#f0b429]">
                {a.action}{" "}
                <span className="text-[#f0b429]/70">
                  (unblocks {a.opportunitiesUnblocked} on {a.sources.join(", ")})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * Amber's growth ladder, for the owner.
 *
 * The progress bar is the point: Amber's next objective has to be legible at a
 * glance, and so does the fact that it is bought with evidenced profit and
 * nothing else. "Excluded" is rendered rather than hidden, because a level
 * system that does not say what it refuses to count invites the assumption
 * that activity counts.
 */
/**
 * The execution ladder, end to end, from 100,000 registered down to what
 * actually produced something nobody already had.
 *
 * Every rung below `assigned` comes from a durable record with a timestamp on
 * it. The rungs above it are capacity and are labelled as such, because the
 * whole point of this panel is that the drop between them is the real story
 * and a dashboard that hides it is the thing that made this necessary.
 */
function WorkforceEvidence({ section }: { section: Section }) {
  if (!section.ok) return null;
  const e = (section.data as { evidence?: Record<string, unknown> } | null)?.evidence as
    | {
        funnel?: {
          registered: number;
          unlocked: number | null;
          assigned: number;
          executedLast15m: number;
          executedLast1h: number;
          executedLast24h: number;
          producedUniqueResult: number;
        };
        windows?: Array<{
          window: string;
          label: string;
          workers: number;
          managers: number;
          workBreakdown?: Record<string, number>;
          managerDetail?: Array<{ division: string; runsInWindow: number }>;
        }>;
        allowance?: {
          tierId: number | null;
          unlockedPerTick: number | null;
          basePerTickDispatch: number;
          effectivePerTickDispatch: number;
          binding: boolean;
          enforced: boolean;
          distinctWorkersLast24h: number;
          unitNote: string;
          verdict: string;
        };
      }
    | undefined;
  const f = e?.funnel;
  if (!f) return null;

  /**
   * Capacity and evidence are visually separated on purpose. A single column
   * of descending numbers reads as one funnel, and only the bottom four rungs
   * are backed by an execution record.
   */
  const rungs: Array<{ label: string; value: number | null; evidence: boolean; note: string }> = [
    { label: "Registered", value: f.registered, evidence: false, note: "Worker specs that exist" },
    { label: "Unlocked by tier", value: f.unlocked, evidence: false, note: "Deployment ceiling, per tick" },
    { label: "Uniquely assigned", value: f.assigned, evidence: false, note: "Holds a slice nobody else holds" },
    { label: "Executed (15m)", value: f.executedLast15m, evidence: true, note: "Run record timestamped in window" },
    { label: "Executed (1h)", value: f.executedLast1h, evidence: true, note: "Run record timestamped in window" },
    { label: "Executed (24h)", value: f.executedLast24h, evidence: true, note: "Run record timestamped in window" },
    { label: "Produced unique result", value: f.producedUniqueResult, evidence: true, note: "Something nobody already had" },
  ];

  const a = e?.allowance;

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="font-display text-base font-bold">Workforce execution evidence</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">
        Registration, assignment and scheduled status are capacity. Only the timestamped rungs below are evidence that
        anything ran.
      </p>

      <ol className="mt-3 space-y-1.5">
        {rungs.map((r) => (
          <li
            key={r.label}
            className={`flex items-baseline justify-between gap-3 rounded-xl border p-2.5 ${
              r.evidence ? "border-[#7ee787]/25 bg-[#7ee787]/[0.04]" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <span className="min-w-0">
              <span className="text-[13px] font-medium">{r.label}</span>
              <span className="ml-2 text-[11px] text-white/40">{r.note}</span>
              {!r.evidence && <span className="ml-2 text-[10px] uppercase tracking-wide text-white/30">capacity</span>}
            </span>
            <span className="shrink-0 font-display text-lg font-bold tabular-nums">
              <Num value={r.value} />
            </span>
          </li>
        ))}
      </ol>

      {Array.isArray(e?.windows) && e.windows.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {e.windows.map((w) => {
            const work = Object.entries(w.workBreakdown ?? {}).sort((x, y) => y[1] - x[1]);
            return (
              <div key={w.window} className="rounded-xl border border-white/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-white/45">Last {w.label}</div>
                <div className="mt-1 text-[13px]">
                  <span className="font-display text-lg font-bold tabular-nums">{w.workers.toLocaleString()}</span>
                  <span className="ml-1 text-white/45">workers</span>
                  <span className="mx-1.5 text-white/20">·</span>
                  <span className="font-display text-lg font-bold tabular-nums">{w.managers.toLocaleString()}</span>
                  <span className="ml-1 text-white/45">managers</span>
                </div>
                {/* What the work actually was. A bare count invites the
                    assumption that active means useful, and it does not. */}
                {work.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-[11px] text-white/45">
                    {work.slice(0, 4).map(([k, n]) => (
                      <li key={k} className="flex justify-between gap-2">
                        <span className="truncate">{k.replace(/_/g, " ")}</span>
                        <span className="tabular-nums">{n.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11px] text-white/35">No run recorded in this window.</p>
                )}
                {(w.managerDetail ?? []).length > 0 && (
                  <p className="mt-2 text-[11px] leading-snug text-white/35">
                    {(w.managerDetail ?? [])
                      .slice(0, 3)
                      .map((m) => `${m.division.replace(/_/g, " ")} (${m.runsInWindow})`)
                      .join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {a && (
        <div
          className={`mt-3 rounded-xl border p-3 text-[12px] leading-relaxed ${
            a.enforced ? "border-white/10 bg-white/[0.03] text-white/60" : "border-[#ff9aa3]/30 bg-[#ff9aa3]/[0.05] text-[#ffc9cf]"
          }`}
        >
          <div className="text-[11px] uppercase tracking-wide text-white/45">Growth allowance vs dispatch</div>
          <p className="mt-1">{a.verdict}</p>
          <p className="mt-1.5 text-[11px] text-white/40">{a.unitNote}</p>
          <p className="mt-1.5 text-[11px] text-white/40">
            Per tick: {a.effectivePerTickDispatch.toLocaleString()} dispatched of {a.basePerTickDispatch.toLocaleString()} base
            {a.unlockedPerTick !== null && `, ceiling ${a.unlockedPerTick.toLocaleString()}`}
            {a.tierId !== null && ` (tier ${a.tierId})`}.
          </p>
        </div>
      )}
    </section>
  );
}

function AmberGrowth({ section }: { section: Section }) {
  if (!section.ok) return null;
  const d = (section.data as { growth?: Record<string, unknown> } | null)?.growth as
    | {
        achievedTier?: { id: number; name: string; note: string };
        nextTier?: { id: number; name: string } | null;
        holdingEarnedTier?: boolean;
        qualifyingNetProfitUsd?: number;
        profitToNextTierUsd?: number | null;
        progressToNextPct?: number;
        nextWorkerReward?: number | null;
        workerAllowance?: number;
        operatingWorkerAllowance?: number;
        roi?: number | null;
        contraction?: { active: boolean; reason: string | null };
        reinvestment?: {
          baseUsd: number;
          earnedUsd: number;
          ownerCeilingUsd: number;
          effectiveUsd: number;
          spentTodayUsd: number;
          ceilingBinds: boolean;
        };
        capacityHonesty?: string;
        excludedFromQualifying?: string[];
        summary?: string;
      }
    | undefined;
  if (!d?.achievedTier) return null;

  const pct = Math.max(0, Math.min(100, d.progressToNextPct ?? 0));
  const money = (v: number | undefined) => `$${(v ?? 0).toFixed(2)}`;
  const r = d.reinvestment;

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="font-display text-base font-bold">Amber Growth</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">{d.summary}</p>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="font-display text-xl font-bold">
          Tier {d.achievedTier.id} — {d.achievedTier.name}
        </span>
        {d.nextTier && (
          <span className="text-[12px] text-white/45">
            next: Tier {d.nextTier.id} — {d.nextTier.name}
          </span>
        )}
      </div>

      {/* Progress to the next tier. */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#7ee787]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-white/40">
        <span>{pct}% to next tier</span>
        {d.profitToNextTierUsd !== null && d.profitToNextTierUsd !== undefined && (
          <span>{money(d.profitToNextTierUsd)} more qualifying profit</span>
        )}
      </div>

      {d.holdingEarnedTier && (
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[12px] text-white/55">
          This reading is below the tier already earned. The achievement stands; only deployed capacity moves.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Qualifying profit</div>
          <div className="mt-1 font-display text-lg font-bold tabular-nums">{money(d.qualifyingNetProfitUsd)}</div>
          <div className="mt-1 text-white/40">evidenced revenue minus cost</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Next reward</div>
          <div className="mt-1 font-display text-lg font-bold tabular-nums">
            {d.nextWorkerReward ? `+${d.nextWorkerReward.toLocaleString()}` : "—"}
          </div>
          <div className="mt-1 text-white/40">productive worker capacity</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Workers unlocked</div>
          <div className="mt-1 font-display text-lg font-bold tabular-nums">
            {(d.operatingWorkerAllowance ?? 0).toLocaleString()}
          </div>
          {d.operatingWorkerAllowance !== d.workerAllowance && (
            <div className="mt-1 text-[#f0b429]">contracted from {(d.workerAllowance ?? 0).toLocaleString()}</div>
          )}
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">ROI</div>
          <div className="mt-1 font-display text-lg font-bold tabular-nums">
            {d.roi === null || d.roi === undefined ? (
              <span className="text-sm font-medium text-white/35">NOT MEASURED</span>
            ) : (
              `${d.roi}x`
            )}
          </div>
        </div>
      </div>

      {r && (
        <div className="mt-3 rounded-xl border border-white/10 p-3 text-[12px]">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Reinvestment allowance</div>
          <div className="mt-1 text-white/70">
            base {money(r.baseUsd)}/day · earned {money(r.earnedUsd)}/day · your ceiling {money(r.ownerCeilingUsd)}/day
          </div>
          <div className="mt-1 font-display text-lg font-bold tabular-nums">
            {money(r.effectiveUsd)}/day <span className="text-[11px] font-normal text-white/40">spendable</span>
          </div>
          <div className="mt-1 text-white/40">spent today {money(r.spentTodayUsd)}</div>
          {r.ceilingBinds && (
            <p className="mt-2 rounded-lg border border-[#f0b429]/40 bg-[#f0b429]/10 p-2 text-[#f0b429]">
              Amber&rsquo;s performance has earned {money(r.earnedUsd)}/day but your ceiling is {money(r.ownerCeilingUsd)}/day.
              Raising it is your decision — she will never raise it herself.
            </p>
          )}
        </div>
      )}

      {d.contraction?.active && (
        <p className="mt-3 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 p-3 text-[12px] leading-relaxed text-[#f0b429]">
          {d.contraction.reason}
        </p>
      )}

      {d.capacityHonesty && <p className="mt-3 text-[12px] leading-relaxed text-white/50">{d.capacityHonesty}</p>}

      {(d.excludedFromQualifying ?? []).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-white/45">What does NOT count toward a tier</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-white/50">
            {(d.excludedFromQualifying ?? []).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Which standard a booking met, said in the owner's language. */
function BasisBadge({ basis }: { basis: LedgerBasis }) {
  const style =
    basis === "wallet-credit"
      ? { cls: "border-[#7ee787]/40 bg-[#7ee787]/10 text-[#7ee787]", label: "Wallet credit observed" }
      : basis === "platform-escrow"
        ? { cls: "border-[#f0b429]/40 bg-[#f0b429]/10 text-[#f0b429]", label: "Platform-reported escrow" }
        : { cls: "border-white/15 bg-white/5 text-white/50", label: "Basis not stated" };
  return (
    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.cls}`}>
      {style.label}
    </span>
  );
}

/**
 * The two ledgers, side by side.
 *
 * On 2026-09-15 Amber HQ reported paymentCount 0 and $0.00 across 469 jobs
 * while the Earnings page showed $15 lifetime. Both were true: the Earnings
 * page reads Relo's own booked rows and Amber HQ never sees them. Nothing on
 * any screen said so, so the only way to notice was to ask both and compare
 * by hand.
 *
 * Showing them together makes a disagreement visible the moment it appears,
 * and names it rather than quietly preferring one number.
 */
function TwoLedgers({ ops }: { ops: AmberOperations }) {
  const relo = ops.reloLedger;
  const ev = ops.sections.paymentEvidence;
  const hqTotal = ev.ok ? (ev.data as { evidencedTotalUsd?: number } | null)?.evidencedTotalUsd ?? null : null;
  const hqCount = ev.ok ? (ev.data as { paymentCount?: number } | null)?.paymentCount ?? null : null;
  const money = (v: number | null) =>
    v === null ? <span className="text-sm font-medium text-white/35">NOT MEASURED</span> : `$${v.toFixed(2)}`;

  const disagree = hqTotal !== null && relo !== null && Math.abs(hqTotal - relo.totalUsd) > 0.004;

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="font-display text-base font-bold">Where the money figures come from</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">
        Two separate ledgers. The Amber Earnings page reads Relo&rsquo;s; Amber HQ keeps her own and cannot see
        Relo&rsquo;s. They are shown together so a disagreement is never silent.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Amber HQ ledger</div>
          <div className="mt-1 font-display text-xl font-bold tabular-nums">{money(hqTotal)}</div>
          <div className="mt-1 text-[11px] text-white/40">
            {hqCount === null ? "with payment evidence" : `${hqCount} payment record(s) with evidence`}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-wide text-white/45">Relo booked ledger</div>
          <div className="mt-1 font-display text-xl font-bold tabular-nums">{money(relo ? relo.totalUsd : null)}</div>
          <div className="mt-1 text-[11px] text-white/40">
            {relo === null ? "database unreadable" : `${relo.rows.length} confirmed revenue row(s)`}
          </div>
        </div>
      </div>

      {disagree && (
        <p className="mt-3 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 p-3 text-[13px] leading-relaxed text-[#f0b429]">
          The two ledgers disagree. Neither is wrong on its own terms &mdash; they record different things &mdash; but
          the Earnings page shows the Relo figure, so that is the one labelled &ldquo;verified paid&rdquo; to you.
        </p>
      )}

      {relo !== null && relo.rows.some((r) => r.basis !== "wallet-credit") && (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/55">
          <span className="font-semibold text-white/75">Not every booking meets the same standard.</span> A booking
          backed by a <em>wallet credit</em> is money observed arriving. One backed by a{" "}
          <em>platform escrow hash</em> is the marketplace stating it released payment — which is its claim, not an
          independent confirmation the funds landed. Both are booked; only one is proof of receipt.
        </p>
      )}

      {relo !== null && relo.rows.length > 0 && (
        <div className="mt-3 space-y-2">
          {relo.rows.map((r: ReloLedgerRow, i: number) => (
            <div key={`${r.jobId ?? "row"}-${i}`} className="rounded-xl border border-white/10 p-3 text-[12px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{r.platformSlug || "unknown platform"}</span>
                <span className="tabular-nums font-semibold">${r.amountUsd.toFixed(2)}</span>
              </div>
              <BasisBadge basis={r.basis} />
              <div className="mt-1 break-words text-white/50">{r.note || "no note recorded"}</div>
              <div className="mt-1 text-white/35">
                {r.occurredAt} &middot; source: {r.source || "unrecorded"} &middot; job: {r.jobId ?? "none"}
              </div>
            </div>
          ))}
        </div>
      )}
      {relo !== null && relo.rows.length === 0 && (
        <p className="mt-3 text-[13px] text-white/45">Relo has booked no confirmed revenue rows.</p>
      )}
    </section>
  );
}

/** How old this reading is, said plainly once it stops being current. */
function StaleWarning({
  fetchedAt,
  now,
  loading,
  onRefresh,
}: {
  fetchedAt: string;
  now: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  const ageMs = now - Date.parse(fetchedAt);
  if (!Number.isFinite(ageMs) || ageMs < 120_000) return null;

  const mins = Math.floor(ageMs / 60_000);
  const age = mins < 60 ? `${mins} minute${mins === 1 ? "" : "s"}` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return (
    <div className="mt-3 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 p-3 text-[13px] leading-relaxed text-[#f0b429]">
      <span className="font-semibold">This reading is {age} old.</span> Nothing here is current — it is what
      production said then, not now.{" "}
      <button type="button" onClick={onRefresh} disabled={loading} className="underline underline-offset-2 disabled:opacity-50">
        {loading ? "Reading…" : "Read again"}
      </button>
    </div>
  );
}

function SectionBlock({ name, title, section }: { name: string; title: string; section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold">{title}</span>
          <span className="block truncate text-[11px] text-white/40">{name}</span>
        </span>
        {section.ok ? (
          <span className="shrink-0 text-[11px] font-semibold text-[#7ee787]">
            LIVE{section.ms === undefined ? "" : ` · ${(section.ms / 1000).toFixed(1)}s`}
          </span>
        ) : (
          /**
           * The elapsed time is shown on failures too. On a timeout it is the
           * one number that says whether the budget was the problem or the
           * report is genuinely broken.
           */
          <span className="shrink-0 text-[11px] font-semibold text-[#ff9aa3]">
            UNAVAILABLE{section.ms === undefined ? "" : ` · ${(section.ms / 1000).toFixed(1)}s`}
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-white/10 p-3">
          {section.ok ? (
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-white/70">
              {JSON.stringify(section.data, null, 2)}
            </pre>
          ) : (
            <p className="text-xs leading-relaxed text-[#ff9aa3]">{section.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One thing Amber needs from the owner.
 *
 * Plain English is the whole point. `technical` exists and is deliberately
 * behind a disclosure: a queue whose primary explanation is a log line is a
 * queue the owner stops opening.
 */
function EscalationCard({ item }: { item: OwnerEscalationView }) {
  const [open, setOpen] = useState(false);
  const resolved = item.status === "RESOLVED";
  const tone = resolved
    ? "border-white/10 bg-white/[0.02]"
    : item.revenueBlocked
      ? "border-[#ff9aa3]/45 bg-[#ff9aa3]/[0.07]"
      : item.urgency === "CRITICAL"
        ? "border-[#ff9aa3]/30 bg-[#ff9aa3]/[0.04]"
        : "border-[#ffd479]/30 bg-[#ffd479]/[0.04]";

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        {resolved ? (
          <span className="rounded-full border border-[#7ee787]/40 bg-[#7ee787]/10 px-2 py-0.5 text-[11px] font-bold text-[#7ee787]">RESOLVED</span>
        ) : (
          <span className="rounded-full border border-current/30 px-2 py-0.5 text-[11px] font-bold">{item.urgency}</span>
        )}
        {item.revenueBlocked && !resolved && (
          <span className="rounded-full border border-[#ff9aa3]/40 bg-[#ff9aa3]/10 px-2 py-0.5 text-[11px] font-bold text-[#ff9aa3]">MONEY BLOCKED</span>
        )}
        {!resolved && item.seenInAudits > 1 && (
          <span className="text-[11px] text-white/40">waiting since {new Date(item.firstSeenAt).toLocaleString()}</span>
        )}
      </div>

      <h3 className="mt-2 font-display text-base font-bold leading-snug">{item.whatHappened}</h3>

      {resolved ? (
        <p className="mt-2 text-sm leading-relaxed text-[#7ee787]/90">{item.resolvedBy}</p>
      ) : (
        <div className="mt-2 space-y-2 text-sm leading-relaxed">
          <p className="text-white/70"><span className="text-white/40">Affects: </span>{item.whatIsAffected}</p>
          <p className="text-white/70"><span className="text-white/40">Amber can&apos;t fix it because: </span>{item.whyAmberCannotFix}</p>

          {item.repairAttempts.length > 0 && (
            <div>
              <div className="text-white/40">Amber already tried:</div>
              <ul className="mt-1 space-y-1">
                {item.repairAttempts.map((a, i) => (
                  <li key={i} className="text-white/65">
                    <span className={a.worked ? "text-[#7ee787]" : "text-[#ff9aa3]"}>{a.worked ? "✓" : "✗"}</span>{" "}
                    {a.whatAmberDid}
                    {a.result && <span className="text-white/40"> — {a.result}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.whatWeNeedFromYou.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-white/55">What Amber needs you to do</div>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-white/85">
                {item.whatWeNeedFromYou.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {item.technical && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-[11px] text-white/35 underline">
            {open ? "Hide" : "Show"} technical detail
          </button>
          {open && (
            <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-2 text-[11px] text-white/55">
              {JSON.stringify(item.technical, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

function NeedsOwnerAttention({ section }: { section: Section }) {
  const { open, resolved } = escalationsFrom(section);
  const [showResolved, setShowResolved] = useState(false);

  if (!section.ok) {
    return (
      <section className="rounded-2xl border border-[#ffd479]/30 bg-[#ffd479]/[0.06] p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold text-[#ffd479]">Needs your attention</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#ffd479]/90">
          CONNECTION LOST — Amber could not be asked what she needs. This is not the same as &ldquo;nothing is
          wrong&rdquo;. {section.error}
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border p-4 sm:p-6 ${open.length > 0 ? "border-[#ff9aa3]/40 bg-[#ff9aa3]/[0.05]" : "border-white/10 bg-black/40"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">
          Needs your attention{open.length > 0 && <span className="ml-2 text-[#ff9aa3]">{open.length}</span>}
        </h2>
        {resolved.length > 0 && (
          <button type="button" onClick={() => setShowResolved((v) => !v)} className="text-xs text-white/45 underline">
            {showResolved ? "Hide" : "Show"} {resolved.length} recently resolved
          </button>
        )}
      </div>

      {open.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Nothing is waiting on you. Amber has not hit a problem she cannot handle herself.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {open.map((item) => <EscalationCard key={item.id} item={item} />)}
        </div>
      )}

      {showResolved && (
        <div className="mt-3 space-y-2">
          {resolved.map((item) => <EscalationCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}

function AmberActivity({ section }: { section: Section }) {
  const events: ActivityEventView[] = activityFrom(section);
  if (!section.ok) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold">Amber&apos;s reports</h2>
        <p className="mt-2 text-sm text-[#ffd479]">CONNECTION LOST — {section.error}</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
      <h2 className="font-display text-lg font-bold">Amber&apos;s reports</h2>
      <p className="mt-1 text-xs text-white/45">Important events only, summarized by Amber. Routine worker activity is not reported here.</p>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-white/55">Amber has not reported anything significant yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex gap-2.5 border-b border-white/5 pb-2 last:border-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.level === "good" ? "bg-[#7ee787]" : e.level === "bad" ? "bg-[#ff9aa3]" : "bg-white/30"}`} />
              <div className="min-w-0">
                <div className="font-display text-sm font-bold leading-snug">{e.headline}</div>
                <div className="text-sm leading-relaxed text-white/60">{e.detail}</div>
                <div className="mt-0.5 text-[11px] text-white/35">
                  {new Date(e.lastAt).toLocaleString()}
                  {e.occurrences > 1 && ` · ${e.occurrences}× since ${new Date(e.firstAt).toLocaleDateString()}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OwnerBlock({ s }: { s: OwnerSummary }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <Tile label="Scouts working" hint="Timestamped search record in production">
        <Ratio working={s.scoutsWorking} registered={s.scoutsRegistered} />
      </Tile>
      <Tile label="Workers working (24h)" hint="Durable run record in production">
        <Ratio working={s.workersWorking} registered={s.workersRegistered} />
      </Tile>
      <Tile label="Workers working (1h)" hint="Distinct workers with a run timestamped in the last hour">
        <Num value={s.workersWorking1h} />
      </Tile>
      <Tile label="Workers working (15m)" hint="The tightest window production can evidence">
        <Num value={s.workersWorking15m} />
      </Tile>
      <Tile
        label="Managers operating (1h)"
        hint={
          s.managersBasis === "windowed execution evidence"
            ? "Divisions with an owned assignment run timestamped in the last hour"
            : s.managersBasis
              ? `Basis: ${s.managersBasis} (lifetime, not windowed)`
              : undefined
        }
      >
        <Ratio working={s.managersOperating} registered={s.managersRegistered} />
      </Tile>
      <Tile label="Unique results produced" hint="Results nobody had already got">
        <Num value={s.uniqueResultsProduced} />
      </Tile>

      <Tile label="External checks today" hint="Real upstream requests only">
        <Num value={s.externalChecksToday} />
      </Tile>
      <Tile label="Unique sites/sources"><Num value={s.uniqueSourcesToday} /></Tile>
      <Tile label="Duplicate fetches prevented"><Num value={s.duplicateFetchesPrevented} /></Tile>
      <Tile label="Duplicate dispatches prevented"><Num value={s.duplicateDispatchesPrevented} /></Tile>

      <Tile label="Opportunities found"><Num value={s.opportunitiesFound} /></Tile>
      <Tile label="Executable"><Num value={s.executable} /></Tile>
      <Tile label="Pursued"><Num value={s.pursued} /></Tile>
      <Tile label="Won"><Num value={s.won} /></Tile>

      <Tile label="Paid"><Num value={s.paid} /></Tile>
      <Tile label="Revenue"><Money value={s.revenueUsd} /></Tile>
      <Tile label="Cost"><Money value={s.costUsd} /></Tile>
      <Tile label="Net profit">
        <span className={s.netUsd !== null && s.netUsd < 0 ? "text-[#ff9aa3]" : undefined}>
          <Money value={s.netUsd} />
        </span>
      </Tile>
    </div>
  );
}

export default function AmberOperationsDashboard({ initial }: { initial: AmberOperations }) {
  const [ops, setOps] = useState<AmberOperations>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/amber-operations", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok && json.operations) {
        setOps(json.operations as AmberOperations);
        setError(null);
      } else {
        setError(json?.error || "Could not refresh.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  /**
   * Re-read when the tab comes back into view.
   *
   * A background tab has its timers throttled or suspended -- on a phone,
   * switching apps stops the interval entirely. Production, 2026-09-15: a
   * reading taken at 13:30 was still on screen at 13:47, down to identical
   * per-report timings, because the page had never re-fetched. It looked
   * exactly like current data.
   *
   * The interval is the steady heartbeat; this is what covers the case the
   * interval cannot see.
   */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  /** Ticks once a second so the age below counts up without a re-fetch. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  const s = ops.summary;

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold sm:text-[28px]">Amber Operations</h1>
            <p className="mt-1 text-xs text-white/45">
              Live production telemetry from Amber HQ. Nothing here is computed from how many agents exist.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="shrink-0 rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white/80 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill
            state={s.amberStatus === "RUNNING" ? "good" : s.amberStatus === "BLOCKED" ? "warn" : s.amberStatus === "STOPPED" ? "bad" : "unknown"}
            label={`AMBER: ${s.amberStatus}`}
          />
          <StatusPill
            state={s.pipeline === "WORKING" ? "good" : s.pipeline === "NOT WORKING" ? "bad" : "unknown"}
            label={`PIPELINE: ${s.pipeline}`}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/50">{s.amberStatusReason}</p>
        <p className="text-xs leading-relaxed text-white/50">{s.pipelineReason}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/35">
          <span>HQ commit: {ops.hqCommitShort ?? ops.hqCommit?.slice(0, 7) ?? "unknown"}</span>
          {ops.hqStartedAt && <span>process up since {new Date(ops.hqStartedAt).toLocaleString()}</span>}
          <span>read {new Date(ops.fetchedAt).toLocaleTimeString()}</span>
        </div>

        {/*
          Age, stated outright once a reading is no longer current.

          "read 1:29:30 PM" is true but easy to read as now, and a status page
          showing seventeen-minute-old figures as if they were current is the
          same failure as printing 0 for something never measured: a confident
          screen that is wrong.
        */}
        <StaleWarning fetchedAt={ops.fetchedAt} now={now} loading={loading} onRefresh={refresh} />

        {error && <p className="mt-2 text-xs text-[#ff9aa3]">{error}</p>}

        {/*
          The connection, diagnosed rather than described.

          Every failure used to render the same "not connected", so the one
          thing worth knowing — WHICH end of the chain is wrong — was the one
          thing the page could not say. Each link reports its own state, and a
          rejected credential is called out separately from a missing one
          because they need different fixes.
        */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span className="font-bold uppercase tracking-wide text-white/45">Connection</span>
            <Link
              label={`Amber HQ up${ops.connection.hqServiceCommit ? ` (${ops.connection.hqServiceCommit})` : ""}`}
              ok={ops.connection.hqServiceUp === true}
            />
            <Link label="Relo has the secret" ok={ops.connection.reloSecretPresent} />
            <Link label="Amber HQ reachable" ok={ops.connection.hqReachable} />
            <Link label="HQ accepted it" ok={ops.connection.hqAuthAccepted} />
            <span className={`font-bold ${ops.connection.live ? "text-[#7ee787]" : "text-[#ff9aa3]"}`}>
              {ops.connection.live ? "LIVE" : "NOT LIVE"}
            </span>
          </div>
          {!ops.connection.live && <ConnectAmberButton onConnected={refresh} />}

          {ops.connection.brokenLink && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="text-xs leading-relaxed text-[#ffd479]">{ops.connection.brokenLink}</p>
              {ops.connection.fixHint && (
                <p className="mt-1 text-xs leading-relaxed text-white/55">{ops.connection.fixHint}</p>
              )}
              <p className="mt-1 text-[11px] text-white/35">
                Until then every figure below reads NOT MEASURED rather than zero.
              </p>
            </div>
          )}
        </div>

        {ops.configured && ops.unavailable.length > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-[#ffd479]">
            {ops.unavailable.length} of {ops.reportCount} production reports could not be read ({ops.unavailable.join(", ")}). The
            figures they feed show NOT MEASURED.
          </p>
        )}
      </header>

      {/* Problems that need the owner go ABOVE everything else, per the
          owner's instruction: "Put problems requiring me at the top where I
          cannot miss them." */}
      <NeedsOwnerAttention section={ops.sections.escalations} />

      <section className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold">Right now</h2>
        <p className="mb-3 mt-1 text-xs text-white/45">
          Green means a production execution record proves it. Grey means production could not be asked.
        </p>
        <OwnerBlock s={s} />
      </section>

      <WorkforceEvidence section={ops.sections.workforce} />
      <AmberGrowth section={ops.sections.growth} />
      <WhyNothingExecutable section={ops.sections.blockers} />
      <AmberActivity section={ops.sections.activity} />

      {s.topIdleReason && (
        <section className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
          <h2 className="font-display text-lg font-bold">Why the idle majority is idle</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">{s.topIdleReason}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="px-1 font-display text-lg font-bold">Drill down</h2>
        <p className="px-1 pb-1 text-xs text-white/45">
          Amber → divisions/managers → scouts → workers. Each block is the live production report behind the
          figures above; open one to read exactly what production returned.
        </p>
        <SectionBlock name="overview" title="Divisions & managers" section={ops.sections.organization} />
        <SectionBlock name="owner_dashboard" title="Scouts, children & sources" section={ops.sections.ownerDashboard} />
        <SectionBlock name="scout_execution_audit" title="Per-scout execution evidence" section={ops.sections.scoutAudit} />
        <SectionBlock name="child_workforce_report" title="Worker utilization & windows" section={ops.sections.workforce} />
        <SectionBlock name="shared_fetch_report" title="Real external fetches & dedup" section={ops.sections.sharedFetch} />
        <SectionBlock name="unique_funnel" title="Money funnel" section={ops.sections.funnel} />
        <SectionBlock name="amber_revenue" title="Revenue, cost & net" section={ops.sections.revenue} />
        {/* The rows behind the money: method, reference, amount, observed at. */}
        <SectionBlock name="payment_evidence" title="Payment evidence (every dollar counted)" section={ops.sections.paymentEvidence} />
        <SectionBlock name="opportunity_blockers" title="Why nothing is executable (every opportunity)" section={ops.sections.blockers} />
        <SectionBlock name="amber_growth" title="Growth ladder (raw)" section={ops.sections.growth} />
        <TwoLedgers ops={ops} />
        <SectionBlock name="amber_ecosystem" title="Amber's own audit & manager health" section={ops.sections.ecosystem} />
        <SectionBlock name="owner_escalations" title="Owner escalations (raw)" section={ops.sections.escalations} />
      </section>
    </div>
  );
}
