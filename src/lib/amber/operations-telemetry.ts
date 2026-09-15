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

/** One bridge action's result, with its failure kept rather than swallowed. */
export type Section<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function section<T>(body: Record<string, unknown>): Promise<Section<T>> {
  try {
    return { ok: true, data: await callAmberBridge<T>(body) };
  } catch (e) {
    // One dead action must not blank the whole dashboard: the other six still
    // carry real production truth, and the failure is reported as a failure.
    return { ok: false, error: e instanceof Error ? e.message : "Bridge call failed." };
  }
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

export type AmberOperations = {
  configured: boolean;
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
  };
  /** Actions that could not be reached, named so a gap is never silent. */
  unavailable: string[];
};

function notConfigured(now: string): AmberOperations {
  const err = "REELO_ORG_BRIDGE_SECRET is not set on this host, so Amber HQ cannot be reached.";
  const dead: Section = { ok: false, error: err };
  return {
    configured: false,
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
      escalations: dead, activity: dead, ecosystem: dead,
    },
    unavailable: ["owner_dashboard", "child_workforce_report", "shared_fetch_report", "scout_execution_audit", "overview", "amber_revenue", "unique_funnel", "owner_escalations", "amber_activity", "amber_ecosystem"],
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

export async function fetchAmberOperations(): Promise<AmberOperations> {
  const now = new Date().toISOString();
  if (!amberOrgBridgeConfigured()) return notConfigured(now);

  // All seven in parallel: the dashboard is a status page, and seven serial
  // 20-second timeouts is not a status page.
  const [ownerDashboard, workforce, sharedFetch, scoutAudit, organization, revenue, funnel, escalations, activity, ecosystem] = await Promise.all([
    section({ action: "owner_dashboard" }),
    section({ action: "child_workforce_report" }),
    section({ action: "shared_fetch_report" }),
    section({ action: "scout_execution_audit" }),
    section({ action: "overview" }),
    section({ action: "amber_revenue" }),
    section({ action: "unique_funnel", days: 1 }),
    section({ action: "owner_escalations" }),
    section({ action: "amber_activity", limit: 40 }),
    section({ action: "amber_ecosystem" }),
  ]);

  const sections = { ownerDashboard, workforce, sharedFetch, scoutAudit, organization, revenue, funnel, escalations, activity, ecosystem };
  const unavailable = Object.entries(sections).filter(([, v]) => !v.ok).map(([k]) => k);

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
  const uniqueSourcesToday = uniqueSourcesFrom(at(sf, "records")) ?? (Array.isArray(at(sf, "report.byEndpoint")) ? (at(sf, "report.byEndpoint") as unknown[]).length : null);
  const duplicateDispatchesPrevented = num(at(wf, "utilization.duplicateWorkPrevented.last24h"));

  // ---- Money and funnel. ----
  const opportunitiesFound = stage(fn, ["FOUND", "discovered", "found"]);
  const executable = stage(fn, ["EXECUTABLE_NOW", "EXECUTABLE", "executable"]);
  const pursued = stage(fn, ["PURSUED", "pursued"]);
  const won = stage(fn, ["WON", "won"]);
  const paid = stage(fn, ["PAID", "paid"]);
  const revenueUsd = num(at(rev, "revenue.verifiedPaidRevenueUsd")) ?? num(at(rev, "revenue.lifetimeRevenueUsd"));
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
  };
}


// ---------------------------------------------------------------------------
// Owner-facing views of Amber's own reports.
//
// Narrowed defensively rather than cast: these cross a network boundary from a
// separately-deployed service, so a field that is missing must render as
// missing, never crash the page that is supposed to tell the owner what is
// wrong.
// ---------------------------------------------------------------------------

export type RepairAttemptView = { at: string; whatAmberDid: string; result: string | null; worked: boolean };

export type OwnerEscalationView = {
  id: string;
  status: "OPEN" | "RESOLVED";
  urgency: "CRITICAL" | "IMPORTANT" | "MINOR";
  title: string;
  whatHappened: string;
  whatIsAffected: string;
  whyAmberCannotFix: string;
  whatWeNeedFromYou: string[];
  revenueBlocked: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  seenInAudits: number;
  repairAttempts: RepairAttemptView[];
  resolvedAt?: string;
  resolvedBy?: string;
  technical?: { rule?: string; severity?: string; evidence?: string; lastAction?: string };
};

export type ActivityEventView = {
  id: string;
  kind: string;
  level: "good" | "bad" | "info";
  headline: string;
  detail: string;
  firstAt: string;
  lastAt: string;
  occurrences: number;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function toEscalation(raw: unknown): OwnerEscalationView | null {
  const r = rec(raw);
  if (!r) return null;
  const title = str(r.title) || str(r.whatHappened);
  if (!title) return null;
  const urgency = r.urgency === "CRITICAL" || r.urgency === "IMPORTANT" || r.urgency === "MINOR" ? r.urgency : "MINOR";
  return {
    id: str(r.id, title),
    status: r.status === "RESOLVED" ? "RESOLVED" : "OPEN",
    urgency,
    title,
    whatHappened: str(r.whatHappened, title),
    whatIsAffected: str(r.whatIsAffected, "Not stated."),
    whyAmberCannotFix: str(r.whyAmberCannotFix, "Not stated."),
    whatWeNeedFromYou: strList(r.whatWeNeedFromYou),
    revenueBlocked: r.revenueBlocked === true,
    firstSeenAt: str(r.firstSeenAt),
    lastSeenAt: str(r.lastSeenAt),
    seenInAudits: num(r.seenInAudits) ?? 1,
    repairAttempts: Array.isArray(r.repairAttempts)
      ? r.repairAttempts.flatMap((a) => {
          const ar = rec(a);
          if (!ar) return [];
          return [{ at: str(ar.at), whatAmberDid: str(ar.whatAmberDid), result: typeof ar.result === "string" ? ar.result : null, worked: ar.worked === true }];
        })
      : [],
    resolvedAt: typeof r.resolvedAt === "string" ? r.resolvedAt : undefined,
    resolvedBy: typeof r.resolvedBy === "string" ? r.resolvedBy : undefined,
    technical: rec(r.technical) as OwnerEscalationView["technical"],
  };
}

/** Amber's open asks and her recently closed ones. */
export function escalationsFrom(section: Section): { open: OwnerEscalationView[]; resolved: OwnerEscalationView[] } {
  if (!section.ok) return { open: [], resolved: [] };
  const openRaw = at(section.data, "open");
  const resolvedRaw = at(section.data, "resolved");
  return {
    open: (Array.isArray(openRaw) ? openRaw : []).map(toEscalation).filter((x): x is OwnerEscalationView => x !== null),
    resolved: (Array.isArray(resolvedRaw) ? resolvedRaw : []).map(toEscalation).filter((x): x is OwnerEscalationView => x !== null),
  };
}

/** Amber's summarized report of important events. */
export function activityFrom(section: Section): ActivityEventView[] {
  if (!section.ok) return [];
  const raw = at(section.data, "events");
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e) => {
    const r = rec(e);
    const headline = str(r?.headline);
    if (!r || !headline) return [];
    const level = r.level === "good" || r.level === "bad" ? r.level : "info";
    return [{
      id: str(r.id, headline),
      kind: str(r.kind, "info"),
      level,
      headline,
      detail: str(r.detail),
      firstAt: str(r.firstAt),
      lastAt: str(r.lastAt),
      occurrences: num(r.occurrences) ?? 1,
    }];
  });
}
