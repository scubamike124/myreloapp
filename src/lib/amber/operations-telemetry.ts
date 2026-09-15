/**
 * Amber's live operating truth, pulled from production and nowhere else.
 *
 * ==================== WHY THIS FILE EXISTS ====================
 * Amber already measures all of this inside production: `runEcosystemAudit`
 * runs from her own commander tick and persists to a durable audit log, and
 * the HQ bridge already exposes owner_dashboard, child_workforce_report,
 * shared_fetch_report, scout_execution_audit, amber_revenue and unique_funnel.
 *
 * What did not exist was a READ PATH. Relo's bridge helper exposed only
 * `overview` and the division/agent controls, so the one number the owner
 * actually needs -- how many of the 5,120 scouts and 100,000 workers did real
 * work -- was measured in production and visible nowhere.
 * =============================================================
 *
 * -------------------- THE RULE THIS FILE ENFORCES --------------------
 * Registration is not work. A scout counts as working only when production
 * holds a timestamped execution record for it (`economics.lastSearchAt`), and
 * a worker only when a durable run record exists (`lastTaskAt`). Those are the
 * fields `buildOwnerDashboard` and `buildWorkforceUtilization` already derive
 * their `executed` counts from; this module never recomputes them from a
 * registry length, and never falls back to one.
 *
 * And when a section cannot be reached, its numbers are `null`, which the UI
 * renders as NOT MEASURED. Never 0. "Nothing ran" and "we could not ask" are
 * different facts, and only one of them is a reason to go and fix something.
 * ---------------------------------------------------------------------
 */
import { amberOrgBridgeConfigured, callAmberBridge } from "./organization-bridge.ts";

/**
 * One bridge action's result, with its failure kept rather than swallowed.
 *
 * `ms` is how long the call actually took. It exists because on 2026-09-15 six
 * of ten reports came back "UNAVAILABLE — aborted due to timeout" and there was
 * no way to tell a report that needs nine seconds from one that needs ninety.
 * Recording it turns the drill-down list into a profile of which reports are
 * slow, which is what decides whether the budget or the report gets fixed.
 */
export type Section<T = unknown> =
  | { ok: true; data: T; ms?: number }
  | { ok: false; error: string; ms?: number };

/**
 * Per-call timeout, and why it is this large.
 *
 * Eight seconds produced six timeouts out of ten on the first live reading.
 * Twenty-five still produced five out of eleven -- but crucially, not the SAME
 * five. See MAX_PARALLEL below: the budget is sized to absorb queueing on a
 * server that serves these requests one at a time, not to the cost of any one
 * report.
 */
const CALL_TIMEOUT_MS = 35_000;

/**
 * Two, not six -- lowered on evidence, against the usual instinct.
 *
 * Six was chosen as the Cloudflare Workers cap, on the assumption that more
 * requests in flight meant more work done at once. Two readings thirty minutes
 * apart showed that assumption is wrong for this server:
 *
 *   report                  13:00              13:30
 *   scout_execution_audit   UNAVAILABLE 25.0s  LIVE 2.3s
 *   shared_fetch_report     LIVE 5.7s          UNAVAILABLE 25.0s
 *   child_workforce_report  UNAVAILABLE 25.0s  LIVE 22.2s
 *
 * The same report on the same data both succeeds in seconds and times out.
 * That is not report cost, it is queueing -- and payment_evidence and
 * amber_ecosystem returning at an identical 15.2s is the proof: two different
 * reports finishing in the same millisecond were released together, not served
 * together.
 *
 * Amber HQ is a single Node process, and these reports do heavy synchronous
 * work (a large state file parsed, then 100,000 workers summarised). While one
 * computes, the event loop is blocked and every other request waits. Firing six
 * at once does not make the server faster; it starts six clocks at the same
 * moment for work that happens one after another, so whichever lose the race
 * all time out together -- and which ones lose varies by whoever got in first.
 *
 * With two in flight a request waits behind at most one other, so its budget
 * covers its own work plus one report rather than five. The page takes longer.
 * That is the right trade: a slower screen showing every figure beats a fast
 * one showing half, and it refreshes on its own every sixty seconds.
 *
 * The real fix is on Amber's side -- those reports should not block her event
 * loop for twenty seconds -- and this does not pretend otherwise. It stops the
 * client from making it worse.
 */
const MAX_PARALLEL = 2;

async function section<T>(body: Record<string, unknown>): Promise<Section<T>> {
  const started = Date.now();
  try {
    const data = await callAmberBridge<T>(body, { timeoutMs: CALL_TIMEOUT_MS });
    return { ok: true, data, ms: Date.now() - started };
  } catch (e) {
    // One dead action must not blank the whole dashboard: the others still
    // carry real production truth, and the failure is reported as a failure.
    // The elapsed time is kept on failures too -- on a timeout it is the single
    // most useful number, because it says whether the budget was the problem.
    return { ok: false, error: e instanceof Error ? e.message : "Bridge call failed.", ms: Date.now() - started };
  }
}

/** Run tasks with a hard cap on how many are in flight at once. */
async function pooled<T>(tasks: Array<() => Promise<T>>, limit = MAX_PARALLEL): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= tasks.length) return;
      out[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return out;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
/** Read a dotted path, returning null rather than throwing on any gap. */
function at(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const seg of path.split(".")) {
    const r = rec(cur);
    if (!r) return null;
    cur = r[seg];
  }
  return cur ?? null;
}

export type AmberStatus = "RUNNING" | "STOPPED" | "BLOCKED" | "UNKNOWN";
export type PipelineStatus = "WORKING" | "NOT WORKING" | "UNKNOWN";

/**
 * The owner's headline block. Every field is `number | null`:
 * null means production could not be asked, NOT that the answer is zero.
 */
export type OwnerSummary = {
  amberStatus: AmberStatus;
  amberStatusReason: string;
  pipeline: PipelineStatus;
  pipelineReason: string;

  scoutsRegistered: number | null;
  scoutsWorking: number | null;
  workersRegistered: number | null;
  workersWorking: number | null;
  workersWorking1h: number | null;
  workersWorking7d: number | null;
  /** Workers whose last run produced a result nobody had already got. */
  uniqueResultsProduced: number | null;

  /** Divisions/managers registered, and how many are actually operating. */
  managersRegistered: number | null;
  managersOperating: number | null;
  /** How `managersOperating` was established, so the tile cannot overstate it. */
  managersBasis: "execution evidence" | "work assigned" | null;

  /** Items Amber cannot clear herself and needs the owner for. */
  needsOwnerCount: number | null;
  needsOwnerRevenueBlocking: number | null;

  /** REAL upstream requests. Excludes reuses, internal audits and bookkeeping. */
  externalChecksToday: number | null;
  uniqueSourcesToday: number | null;
  duplicateFetchesPrevented: number | null;
  duplicateDispatchesPrevented: number | null;

  opportunitiesFound: number | null;
  executable: number | null;
  pursued: number | null;
  won: number | null;
  paid: number | null;

  revenueUsd: number | null;
  costUsd: number | null;
  netUsd: number | null;

  /** Why the idle majority is idle, taken from production's own statement. */
  topIdleReason: string | null;
};

/**
 * Which link in the chain is broken, named rather than guessed.
 *
 * The chain is: Amber's telemetry -> HQ bridge -> Relo's server -> this page.
 * Every failure used to arrive as the same "not connected", so the one thing
 * the owner needed to know -- WHICH end is missing the secret -- was the one
 * thing the page could not say. These three booleans separate them, and a 401
 * is called out specifically because it means both hosts are up and holding
 * DIFFERENT secrets, which is a different fix from either being unset.
 */
export type ConnectionDiagnosis = {
  /**
   * Is Amber HQ itself up? Answered WITHOUT any credential.
   *
   * /api/health/public serves the commit HQ is running and needs no secret,
   * which is what makes "AMBER HQ: LIVE" provable from Relo even while the
   * bridge is still dark. Without it, a missing secret and a dead HQ produce
   * the same silence, and they need opposite fixes.
   */
  hqServiceUp: boolean | null;
  /** The commit Amber HQ is actually serving, from its own process. */
  hqServiceCommit: string | null;
  /** Is REELO_ORG_BRIDGE_SECRET present on Relo's server? */
  reloSecretPresent: boolean;
  /** Did any call reach Amber HQ and get an HTTP response at all? */
  hqReachable: boolean;
  /** Did HQ accept our secret? False on 401 — the two hosts disagree. */
  hqAuthAccepted: boolean;
  live: boolean;
  /** The single thing to fix, in one sentence. */
  brokenLink: string | null;
  fixHint: string | null;
};

export type AmberOperations = {
  configured: boolean;
  connection: ConnectionDiagnosis;
  fetchedAt: string;
  /** The commit production is actually serving, straight from the process. */
  hqCommit: string | null;
  hqCommitShort: string | null;
  hqStartedAt: string | null;
  summary: OwnerSummary;
  sections: {
    ownerDashboard: Section;
    workforce: Section;
    sharedFetch: Section;
    scoutAudit: Section;
    organization: Section;
    revenue: Section;
    funnel: Section;
    escalations: Section;
    activity: Section;
    ecosystem: Section;
    paymentEvidence: Section;
  };
  /** Actions that could not be reached, named so a gap is never silent. */
  unavailable: string[];
  /**
   * How many reports were attempted. Derived, never written down: the count
   * was hardcoded as "10" in the UI and adding an eleventh silently made the
   * sentence wrong.
   */
  reportCount: number;
  /**
   * Relo's OWN confirmed revenue rows, read locally rather than over the
   * bridge.
   *
   * Production, 2026-09-15: Amber HQ reported paymentCount 0 and $0.00 across
   * 469 jobs while the Earnings page showed $15 lifetime. Both were true --
   * they are different ledgers, and nothing on any screen said so.
   *
   * null means Relo's database could not be read, which is not the same as no
   * revenue booked. Same rule as every other figure here.
   */
  reloLedger: { totalUsd: number; rows: ReloLedgerRow[] } | null;
};

/** One booked revenue row, as the owner should be able to audit it. */
export type ReloLedgerRow = {
  platformSlug: string;
  jobId: string | null;
  amountUsd: number;
  source: string;
  occurredAt: string;
  note: string;
};

/**
 * Never throws and never invents a zero: an unreadable database yields null,
 * so "we could not check" stays distinct from "nothing is booked".
 */
async function readReloLedger(): Promise<{ totalUsd: number; rows: ReloLedgerRow[] } | null> {
  try {
    const { listConfirmedRevenueRows } = await import("../amber-earnings/persist.ts");
    const rows = await listConfirmedRevenueRows(100);
    return {
      totalUsd: Math.round(rows.reduce((t, r) => t + r.amountUsd, 0) * 100) / 100,
      rows: rows.map((r) => ({
        platformSlug: r.platformSlug,
        jobId: r.jobId,
        amountUsd: r.amountUsd,
        source: r.source,
        occurredAt: r.occurredAt,
        note: r.note,
      })),
    };
  } catch {
    return null;
  }
}

function notConfigured(now: string): AmberOperations {
  const err = "REELO_ORG_BRIDGE_SECRET is not set on this host, so Amber HQ cannot be reached.";
  const dead: Section = { ok: false, error: err };
  return {
    configured: false,
    connection: {
      hqServiceUp: null,
      hqServiceCommit: null,
      reloSecretPresent: false,
      hqReachable: false,
      hqAuthAccepted: false,
      live: false,
      brokenLink: "Relo's server does not have REELO_ORG_BRIDGE_SECRET, so it never contacts Amber HQ.",
      fixHint: "Set REELO_ORG_BRIDGE_SECRET on Relo (Cloudflare Worker secret) to the same value Amber HQ holds (Railway, service amber-hq-web).",
    },
    fetchedAt: now,
    hqCommit: null,
    hqCommitShort: null,
    hqStartedAt: null,
    summary: {
      amberStatus: "UNKNOWN",
      amberStatusReason: err,
      pipeline: "UNKNOWN",
      pipelineReason: err,
      scoutsRegistered: null, scoutsWorking: null,
      workersRegistered: null, workersWorking: null, workersWorking1h: null, workersWorking7d: null,
      uniqueResultsProduced: null,
      managersRegistered: null, managersOperating: null, managersBasis: null,
      needsOwnerCount: null, needsOwnerRevenueBlocking: null,
      externalChecksToday: null, uniqueSourcesToday: null,
      duplicateFetchesPrevented: null, duplicateDispatchesPrevented: null,
      opportunitiesFound: null, executable: null, pursued: null, won: null, paid: null,
      revenueUsd: null, costUsd: null, netUsd: null,
      topIdleReason: null,
    },
    sections: {
      ownerDashboard: dead, workforce: dead, sharedFetch: dead,
      scoutAudit: dead, organization: dead, revenue: dead, funnel: dead,
      escalations: dead, activity: dead, ecosystem: dead, paymentEvidence: dead,
    },
    unavailable: [
      "owner_dashboard", "child_workforce_report", "shared_fetch_report", "scout_execution_audit",
      "overview", "amber_revenue", "unique_funnel", "owner_escalations", "amber_activity",
      "amber_ecosystem", "payment_evidence",
    ],
    reportCount: 11,
    reloLedger: null,
  };
}

/**
 * How many DISTINCT external sources were really fetched.
 *
 * Counted from the shared-fetch records by host, not by fetch key: two keys
 * against the same host are one source. Reuses are excluded by construction --
 * a reuse is a request that was never made, which is the opposite of a check.
 */
function uniqueSourcesFrom(records: unknown): number | null {
  if (!Array.isArray(records)) return null;
  const hosts = new Set<string>();
  for (const r of records) {
    const url = at(r, "url");
    if (typeof url !== "string") continue;
    try {
      hosts.add(new URL(url).hostname.toLowerCase().replace(/^www\./, ""));
    } catch {
      // A legacy connector row carries no URL; it is still one distinct source.
      hosts.add(url.toLowerCase());
    }
  }
  return hosts.size;
}

/** Pick the funnel stage count by any of the names production may use for it. */
function stage(funnel: unknown, names: string[]): number | null {
  const stages = at(funnel, "stages");
  if (Array.isArray(stages)) {
    for (const n of names) {
      const hit = stages.find((s) => String(at(s, "key") ?? at(s, "stage") ?? "").toUpperCase() === n.toUpperCase());
      if (hit) {
        const c = num(at(hit, "count"));
        if (c !== null) return c;
      }
    }
  }
  for (const n of names) {
    const direct = num(at(funnel, n));
    if (direct !== null) return direct;
  }
  return null;
}

/**
 * Ask Amber HQ whether it is alive, using no credential at all.
 *
 * Deliberately separate from the bridge calls: this must still answer when the
 * bridge is dark, because "HQ is down" and "we have no secret" are different
 * problems and the owner needs to know which one they have.
 */
async function probeHqService(): Promise<{ up: boolean | null; commit: string | null }> {
  const base = (process.env.AMBER_ORG_BRIDGE_URL || "https://hq.amberoneai.com").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/health/public`, {
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { up: false, commit: null };
    const body = (await res.json().catch(() => null)) as unknown;
    const commit = at(body, "version.commitShort") ?? at(body, "version.commit");
    return { up: true, commit: typeof commit === "string" ? commit : null };
  } catch {
    // No response at all. Distinct from "answered badly", which returns up:false
    // with a status; here we genuinely could not reach it.
    return { up: null, commit: null };
  }
}

export async function fetchAmberOperations(): Promise<AmberOperations> {
  const now = new Date().toISOString();
  if (!(await amberOrgBridgeConfigured())) {
    // The secret is missing, which is precisely when "is HQ even up?" is the
    // question the owner needs answered before touching anything.
    const probe = await probeHqService();
    const out = notConfigured(now);
    out.connection.hqServiceUp = probe.up;
    out.connection.hqServiceCommit = probe.commit;
    out.hqCommitShort = probe.commit;
    return out;
  }

  // All seven in parallel: the dashboard is a status page, and seven serial
  // 20-second timeouts is not a status page.
  const hqProbe = await probeHqService();
  const [ownerDashboard, workforce, sharedFetch, scoutAudit, organization, revenue, funnel, escalations, activity, ecosystem, paymentEvidence] =
    await pooled([
    () => section({ action: "owner_dashboard" }),
    /**
     * summaryOnly: the utilization totals and the time windows, without the
     * per-worker hierarchy, activity, rotation and status lists -- all of which
     * range over 100,000 workers. Nothing on this page reads them, and
     * unbounded they made this the last report still failing.
     */
    () => section({ action: "child_workforce_report", summaryOnly: true }),
    /**
     * recordLimit: 0 — the totals and the per-endpoint roll-up, without the
     * per-record list. Unbounded, that list was large enough that the response
     * body did not finish arriving inside the timeout, and the section was
     * recorded as LIVE holding nothing. Nothing on this page reads the rows.
     */
    () => section({ action: "shared_fetch_report", recordLimit: 0 }),
    () => section({ action: "scout_execution_audit" }),
    () => section({ action: "overview" }),
    () => section({ action: "amber_revenue" }),
    () => section({ action: "unique_funnel", days: 1 }),
    () => section({ action: "owner_escalations" }),
    () => section({ action: "amber_activity", limit: 40 }),
    () => section({ action: "amber_ecosystem" }),
    /**
     * The rows behind the money, not a total. Cheap on purpose: it filters the
     * earnings snapshot rather than building the revenue report, which is one
     * of the actions currently timing out.
     */
    () => section({ action: "payment_evidence" }),
  ]);

  const sections = { ownerDashboard, workforce, sharedFetch, scoutAudit, organization, revenue, funnel, escalations, activity, ecosystem, paymentEvidence };
  const unavailable = Object.entries(sections).filter(([, v]) => !v.ok).map(([k]) => k);

  /**
   * Diagnose the chain from what the calls actually did.
   *
   * A 401 is treated separately and deliberately: it proves both hosts are up
   * and talking, and that they hold DIFFERENT secrets. That is a different
   * repair from "the secret is missing", and reporting both as "not connected"
   * is what made this take days to place.
   */
  const errors = Object.values(sections).filter((v) => !v.ok).map((v) => (v as { error: string }).error);
  const anyOk = Object.values(sections).some((v) => v.ok);
  const sawAuthRejection = errors.some((e) => /\b401\b|unauthor/i.test(e));
  const sawTransportFailure = errors.some((e) => /abort|timeout|fetch failed|network|ENOTFOUND|ECONN/i.test(e));

  const connection: ConnectionDiagnosis = {
    hqServiceUp: hqProbe.up,
    hqServiceCommit: hqProbe.commit,
    reloSecretPresent: true,
    hqReachable: anyOk || sawAuthRejection || (errors.length > 0 && !sawTransportFailure),
    hqAuthAccepted: anyOk,
    live: anyOk,
    brokenLink: null,
    fixHint: null,
  };
  if (!connection.live) {
    if (sawAuthRejection) {
      connection.hqAuthAccepted = false;
      connection.brokenLink = "Amber HQ rejected Relo's credential — the two hosts are holding different secrets.";
      connection.fixHint = "Set REELO_ORG_BRIDGE_SECRET to the SAME value on both Relo (Cloudflare) and Amber HQ (Railway, service amber-hq-web).";
    } else if (sawTransportFailure) {
      connection.hqReachable = false;
      connection.brokenLink =
        hqProbe.up === true
          ? "Amber HQ is up, but its bridge endpoint did not respond to Relo."
          : "Relo's server could not reach Amber HQ at all — no HTTP response.";
      connection.fixHint =
        hqProbe.up === true
          ? "HQ's public health endpoint answered, so the service is running — the bridge route itself is failing or timing out."
          : "Check that amber-hq-web is running on Railway and that hq.amberoneai.com resolves.";
    } else {
      connection.brokenLink = "Amber HQ answered, but every report failed.";
      connection.fixHint = errors[0] ?? "See the drill-down sections for the exact error.";
    }
  }

  const dash = ownerDashboard.ok ? ownerDashboard.data : null;
  const wf = workforce.ok ? workforce.data : null;
  const sf = sharedFetch.ok ? sharedFetch.data : null;
  const rev = revenue.ok ? revenue.data : null;
  const fn = funnel.ok ? funnel.data : null;
  const esc = escalations.ok ? escalations.data : null;
  const eco = ecosystem.ok ? ecosystem.data : null;

  // ---- Build identity, straight from the running process. ----
  const hqCommit = (at(dash, "hqBuild.commit") ?? at(wf, "hqBuild.commit") ?? at(rev, "hqBuild.commit")) as string | null;
  const hqCommitShort = (at(dash, "hqBuild.commitShort") ?? at(wf, "hqBuild.commitShort")) as string | null;
  const hqStartedAt = (at(dash, "hqBuild.startedAt") ?? at(wf, "hqBuild.startedAt")) as string | null;

  // ---- Evidence-only counts. `executed` is derived in production from a
  // timestamped record; registered is carried separately and never substituted.
  const scoutsRegistered = num(at(dash, "dashboard.scouts.registered"));
  const scoutsWorking = num(at(dash, "dashboard.scouts.executed"));
  const workersRegistered = num(at(wf, "utilization.totals.registered")) ?? num(at(dash, "dashboard.children.registered"));
  const workersWorking = num(at(wf, "utilization.totals.executedLast24h"));
  const workersWorking1h = num(at(wf, "windows.last1h.executed")) ?? num(at(wf, "utilization.totals.executedLast1h"));
  const workersWorking7d = num(at(wf, "utilization.totals.executedLast7d"));
  const uniqueResultsProduced = num(at(wf, "utilization.totals.producedUniqueResult"));

  /**
   * Managers actually operating.
   *
   * Preferred basis is EXECUTION: managerHealth rows carry `worked`, a count
   * of real run records. Only when that is unavailable does this fall back to
   * `managers.withWork` -- which means work was ASSIGNED, not performed -- and
   * the basis is reported alongside so the tile can say which it is rather
   * than quietly passing one off as the other.
   */
  const managerHealth = at(eco, "live.managerHealth") ?? at(eco, "recentAudits.0.managerHealth");
  let managersRegistered = num(at(eco, "live.managers.total")) ?? num(at(eco, "recentAudits.0.managers.total"));
  let managersOperating: number | null = null;
  let managersBasis: "execution evidence" | "work assigned" | null = null;
  if (Array.isArray(managerHealth) && managerHealth.length > 0) {
    managersRegistered = managersRegistered ?? managerHealth.length;
    managersOperating = managerHealth.filter((m) => (num(at(m, "worked")) ?? 0) > 0).length;
    managersBasis = "execution evidence";
  } else {
    const withWork = num(at(eco, "live.managers.withWork")) ?? num(at(eco, "recentAudits.0.managers.withWork"));
    if (withWork !== null) {
      managersOperating = withWork;
      managersBasis = "work assigned";
    }
  }

  const needsOwnerCount = num(at(esc, "openCount"));
  const needsOwnerRevenueBlocking = num(at(esc, "revenueBlockingCount"));

  // ---- Real external activity only. ----
  const externalChecksToday = num(at(sf, "report.totals.fetches"));
  const duplicateFetchesPrevented = num(at(sf, "report.totals.reuses")) ?? num(at(sf, "report.requestsAvoided"));
  /**
   * Counted from the per-endpoint roll-up, not the per-record list.
   *
   * This read `records` first, with byEndpoint as a `??` fallback. Then the
   * client started asking for `recordLimit: 0` to keep the response small, so
   * `records` arrived as `[]` -- and an empty array is not nullish. It counted
   * zero distinct hosts and RETURNED 0, so the fallback never ran and the page
   * said "834 real upstream requests recorded across 0 sources".
   *
   * byEndpoint carries a url per row, so hostname de-duplication still applies
   * and two keys on one host still count as one source. `records` remains a
   * fallback for a caller that asks for the rows, and an explicit 0 is only
   * reported when production actually fetched nothing.
   */
  const byEndpoint = at(sf, "report.byEndpoint");
  const uniqueSourcesToday =
    (Array.isArray(byEndpoint) && byEndpoint.length > 0 ? uniqueSourcesFrom(byEndpoint) : null) ??
    (Array.isArray(at(sf, "records")) && (at(sf, "records") as unknown[]).length > 0
      ? uniqueSourcesFrom(at(sf, "records"))
      : null) ??
    (externalChecksToday === 0 ? 0 : null);
  const duplicateDispatchesPrevented = num(at(wf, "utilization.duplicateWorkPrevented.last24h"));

  /**
   * ---- Money and funnel. ----
   *
   * The revenue report carries its OWN funnel, with the same stage names, and
   * it answers when unique_funnel times out. Reading only unique_funnel left
   * five tiles at NOT MEASURED while the numbers sat in a report that was
   * already live on the same screen.
   *
   * unique_funnel stays first: it is the dedicated report, and the fallback is
   * a fallback. `{ stages }` is the shape `stage()` expects, so the revenue
   * report's array is wrapped rather than the helper being widened.
   */
  const revenueFunnel = at(rev, "revenue.funnel");
  const fnFallback = Array.isArray(revenueFunnel) ? { stages: revenueFunnel } : null;
  const fromFunnel = (names: string[]) => stage(fn, names) ?? stage(fnFallback, names);

  const opportunitiesFound = fromFunnel(["FOUND", "discovered", "found"]) ?? num(at(rev, "revenue.diagnostics.opportunitiesStored"));
  const executable = fromFunnel(["EXECUTABLE_NOW", "EXECUTABLE", "executable"]) ?? num(at(rev, "revenue.executableOpportunities"));
  const pursued = fromFunnel(["PURSUED", "pursued"]) ?? num(at(rev, "revenue.workSubmitted"));
  const won = fromFunnel(["WON", "won"]) ?? num(at(rev, "revenue.workWon"));
  const paid = fromFunnel(["PAID", "paid"]);
  /**
   * moneyReceivedUsd is the field this report actually publishes.
   *
   * This read `verifiedPaidRevenueUsd` first -- the name the EARNINGS snapshot
   * uses -- which does not exist on the revenue report. So REVENUE showed NOT
   * MEASURED while COST and NET PROFIT showed $0.00 from the very same live
   * report, which is the worst of both: it looks like a measurement gap and a
   * measured zero at once.
   *
   * The snapshot's names are kept after it, because a caller on a different
   * shape should still resolve rather than silently read as unmeasured.
   */
  const revenueUsd =
    num(at(rev, "revenue.moneyReceivedUsd")) ??
    num(at(rev, "revenue.verifiedPaidRevenueUsd")) ??
    num(at(rev, "revenue.lifetimeRevenueUsd"));
  const costUsd = num(at(rev, "revenue.costUsd")) ?? num(at(rev, "revenue.spentTodayUsd"));
  const netUsd = num(at(rev, "revenue.netProfitUsd")) ?? (revenueUsd !== null && costUsd !== null ? Math.round((revenueUsd - costUsd) * 1e6) / 1e6 : null);

  // ---- Status, stated with its reason so it is never a bare light. ----
  let amberStatus: AmberStatus = "UNKNOWN";
  let amberStatusReason = "Production did not report a tick time.";
  const pausedAll = at(rev, "revenue.pausedAll") === true || at(dash, "dashboard.pausedAll") === true;
  const lastTickAt = (at(dash, "dashboard.lastTickAt") ?? at(wf, "lastTickAt")) as string | null;
  if (pausedAll) {
    amberStatus = "BLOCKED";
    amberStatusReason = "Owner pause is in force — Amber is stopped by instruction, not by fault.";
  } else if (typeof lastTickAt === "string") {
    const ageMin = (Date.now() - new Date(lastTickAt).getTime()) / 60_000;
    if (Number.isFinite(ageMin) && ageMin <= 90) {
      amberStatus = "RUNNING";
      amberStatusReason = `Last production tick ${Math.round(ageMin)} minute(s) ago.`;
    } else {
      amberStatus = "STOPPED";
      amberStatusReason = `Last production tick was ${Math.round(ageMin)} minutes ago — the loop is not ticking.`;
    }
  } else if (unavailable.length === Object.keys(sections).length) {
    amberStatusReason = "Amber HQ could not be reached at all.";
  }

  /**
   * The pipeline is working only if REAL external requests happened.
   * Internal coverage audits and duplicate suppression are not checks, and a
   * workforce that only ever did internal bookkeeping is not discovering.
   */
  let pipeline: PipelineStatus = "UNKNOWN";
  let pipelineReason = "Shared-fetch telemetry unavailable.";
  if (externalChecksToday !== null) {
    if (externalChecksToday > 0) {
      pipeline = "WORKING";
      pipelineReason = `${externalChecksToday} real upstream request(s) recorded across ${uniqueSourcesToday ?? "?"} source(s).`;
    } else {
      pipeline = "NOT WORKING";
      pipelineReason = "No real upstream request has been recorded — any worker activity was internal only.";
    }
  }

  // Production states its own reason for the idle majority; prefer it to a guess.
  const topIdleReason =
    (at(wf, "utilization.ceiling.statement") as string | null) ??
    (typeof at(dash, "dashboard.idleReason") === "string" ? (at(dash, "dashboard.idleReason") as string) : null);

  return {
    configured: true,
    connection,
    fetchedAt: now,
    hqCommit: typeof hqCommit === "string" ? hqCommit : null,
    hqCommitShort: typeof hqCommitShort === "string" ? hqCommitShort : null,
    hqStartedAt: typeof hqStartedAt === "string" ? hqStartedAt : null,
    summary: {
      amberStatus, amberStatusReason, pipeline, pipelineReason,
      scoutsRegistered, scoutsWorking,
      workersRegistered, workersWorking, workersWorking1h, workersWorking7d,
      uniqueResultsProduced,
      managersRegistered, managersOperating, managersBasis,
      needsOwnerCount, needsOwnerRevenueBlocking,
      externalChecksToday, uniqueSourcesToday,
      duplicateFetchesPrevented, duplicateDispatchesPrevented,
      opportunitiesFound, executable, pursued, won, paid,
      revenueUsd, costUsd, netUsd,
      topIdleReason,
    },
    sections,
    unavailable,
    reportCount: Object.keys(sections).length,
    reloLedger: await readReloLedger(),
  };
}


/**
 * Re-exported for callers already reaching for them here. The definitions live
 * in operations-views.ts so the client bundle can import them without pulling
 * this module's credentialed I/O along with them.
 */
export {
  escalationsFrom,
  activityFrom,
  type RepairAttemptView,
  type OwnerEscalationView,
  type ActivityEventView,
} from "./operations-views.ts";
