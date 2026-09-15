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
import type { AmberOperations, OwnerSummary, Section, OwnerEscalationView, ActivityEventView } from "@/lib/amber/operations-telemetry";
import { escalationsFrom, activityFrom } from "@/lib/amber/operations-telemetry";

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

function StatusPill({ state, label }: { state: "good" | "bad" | "warn" | "unknown"; label: string }) {
  const tone =
    state === "good" ? "border-[#7ee787]/40 bg-[#7ee787]/10 text-[#7ee787]"
    : state === "bad" ? "border-[#ff9aa3]/40 bg-[#ff9aa3]/10 text-[#ff9aa3]"
    : state === "warn" ? "border-[#ffd479]/40 bg-[#ffd479]/10 text-[#ffd479]"
    : "border-white/15 bg-white/5 text-white/50";
  return <span className={`inline-flex rounded-full border px-3 py-1 font-display text-sm font-bold ${tone}`}>{label}</span>;
}

/** A bridge section, expandable to its raw production payload. */
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
          <span className="shrink-0 text-[11px] font-semibold text-[#7ee787]">LIVE</span>
        ) : (
          <span className="shrink-0 text-[11px] font-semibold text-[#ff9aa3]">UNAVAILABLE</span>
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
      <Tile label="Workers working (1h)"><Num value={s.workersWorking1h} /></Tile>
      <Tile label="Managers operating" hint={s.managersBasis ? `Basis: ${s.managersBasis}` : undefined}>
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

        {error && <p className="mt-2 text-xs text-[#ff9aa3]">{error}</p>}

        {!ops.configured && (
          <div className="mt-4 rounded-xl border border-[#ffd479]/30 bg-[#ffd479]/10 p-3">
            <p className="text-xs leading-relaxed text-[#ffd479]">
              Not connected to Amber HQ. Set <code>REELO_ORG_BRIDGE_SECRET</code> on this host to the same value
              already configured on Amber HQ (Railway, service <code>amber-hq-web</code>), then reload. Until then
              every figure below reads NOT MEASURED rather than zero.
            </p>
          </div>
        )}

        {ops.configured && ops.unavailable.length > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-[#ffd479]">
            {ops.unavailable.length} of 10 production reports could not be read ({ops.unavailable.join(", ")}). The
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
        <SectionBlock name="amber_ecosystem" title="Amber's own audit & manager health" section={ops.sections.ecosystem} />
        <SectionBlock name="owner_escalations" title="Owner escalations (raw)" section={ops.sections.escalations} />
      </section>
    </div>
  );
}
