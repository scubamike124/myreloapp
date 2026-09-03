/**
 * HQ Amber Earnings bridge — Relo Business Center is the owner UI.
 * Single source of truth: https://hq.amberoneai.com/api/amber-earnings
 * Relo never sends the owner to a separate HQ dashboard.
 */

export const HQ_APPLIED_JOB_STATUSES = new Set([
  "queued",
  "claimed",
  "active",
  "submitted",
  "won",
  "completed",
  "paid",
]);

export const HQ_EMP_APPLIED_STATUSES = new Set([
  "Prepared",
  "Submitted",
  "Accepted",
  "Awarded",
  "Completed",
  "Invoiced",
  "Paid",
]);

export const RELO_APPLIED_JOB_STATUSES = new Set([
  "accepted",
  "working",
  "testing",
  "submitted",
  "accepted_by_customer",
  "payment_pending",
  "paid",
]);

export type NationwideEmp = {
  at: string;
  worker: { ticks: number; lastTickAt: string | null; notes: string[]; paused: boolean };
  money: {
    potentialUsd: number;
    inProcess: number;
    awarded: number;
    receivedUsd: number;
    note?: string;
  };
  sources: { total: number; healthy: number; degraded: number; blocked: number };
  departments: {
    contracts: number;
    funding: number;
    claims: number;
    recovery: number;
    work?: number;
    savings?: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    skillId?: string;
    priorityScore?: number;
    rejectionReasons?: string[];
    sourceIds?: string[];
    eligibilityVerdict?: string;
    eligibilityLabel?: string;
    eligibilityNotes?: string;
    capabilityFit?: number;
    hasProposalPackage?: boolean;
    automationDepth?: {
      amberMaxLegitimate?: string;
      ownerMustComplete?: string[];
      blockers?: string[];
      discover?: string;
      readSolicitation?: string;
      draftProposal?: string;
      portalSubmit?: string;
      certificationsRepresentations?: string;
    } | null;
    solicitation?: {
      noticeId?: string;
      solicitationNumber?: string;
      naicsCode?: string;
      setAside?: string;
      setAsideDescription?: string;
      uiLink?: string;
      attachmentCount?: number;
      requirementsCount?: number;
      deepenedAt?: string;
    } | null;
    proposalPackage?: {
      draftedAt?: string;
      executiveSummary?: string;
      openQuestions?: string[];
      certificationsOwnerOnly?: string[];
      signatureOwnerOnly?: string[];
      submitOwnerOnly?: string[];
      disclaimer?: string;
      checklistCount?: number;
      checklistNeedsOwner?: number;
    } | null;
  }>;
  filteredOpportunities?: Array<{
    id: string;
    title: string;
    status: string;
    eligibilityVerdict?: string;
    rejectionReasons?: string[];
  }>;
  sam?: {
    apiKeyPresent?: boolean;
    entityRegistered?: boolean | null;
    entityActive?: boolean | null;
    ueiOnFile?: boolean;
    canCompeteOnPortal?: boolean;
    note?: string;
    listed?: number;
    activeBoard?: number;
    filteredOut?: number;
    preparedPackages?: number;
    likelyQualified?: number;
    needsOwnerFacts?: number;
  };
  ownerBusiness?: {
    legalBusinessName?: string | null;
    uei?: string | null;
    samEntityRegistered?: boolean | null;
    samEntityActive?: boolean | null;
    smallBusiness?: boolean | null;
    setAsideCodes?: string[];
    naicsCodes?: string[];
    updatedAt?: string | null;
  };
  ownerActions: Array<{ id: string; requiredAction: string; reason: string; alreadyDone?: string; opportunityId?: string }>;
  blockers: Array<{
    id: string;
    code: string;
    sourceId?: string;
    opportunityId?: string;
    whatHappened: string;
    nextRetryAt?: string | null;
  }>;
  activity: Array<{ id: string; at: string; department: string; text: string }>;
};

export type HqMarketplaceJob = {
  id?: string;
  title: string;
  status: string;
  marketplace?: string;
  payoutUsd?: number;
  description?: string;
  externalId?: string;
};

/**
 * HQ's own real marketplace money (TaskBounty/SporeAgent/MoltJobs), read out of
 * `snapshot.metrics` — separate from `emp` (the nationwide government/grants
 * lane) and from Relo's own local per-user accounting. Before this, a real
 * won job's payout sat inside `snapshot` but nothing on the page ever read it,
 * so it was invisible even though the fetch that pulled it in was working.
 */
export type HqMoney = {
  pendingPaymentUsd: number;
  verifiedPaidRevenueUsd: number;
  netProfitUsd: number;
  jobsWon: number;
  activeJobs: number;
};

function emptyHqMoney(): HqMoney {
  return { pendingPaymentUsd: 0, verifiedPaidRevenueUsd: 0, netProfitUsd: 0, jobsWon: 0, activeJobs: 0 };
}

/**
 * Real Sent/Delivered/Opened/Clicked/Bounced/Complained/Replied counts for
 * one outreach campaign (ca_drop / ca_accessibility / ca_vendor_risk),
 * sourced from HQ's own EmailEvent table via Resend webhooks. Purchase/
 * conversion isn't wired to this yet -- no code anywhere correlates a
 * clicked prospect to an actual signup, so that number would be fabricated
 * if shown here. Only real, tracked stages appear.
 */
export type OutreachCampaignFunnel = {
  productSlug: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  complained: number;
};

function asOutreachFunnels(v: unknown): OutreachCampaignFunnel[] {
  if (!Array.isArray(v)) return [];
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  return v
    .filter((f) => f && typeof f === "object")
    .map((f) => {
      const r = asRecord(f);
      return {
        productSlug: String(r.productSlug || ""),
        sent: num(r.sent),
        delivered: num(r.delivered),
        opened: num(r.opened),
        clicked: num(r.clicked),
        replied: num(r.replied),
        bounced: num(r.bounced),
        complained: num(r.complained),
      };
    });
}

function extractHqMoney(snapshot: Record<string, unknown>): HqMoney {
  const metrics = asRecord(snapshot.metrics);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    pendingPaymentUsd: num(metrics.pendingPaymentUsd),
    verifiedPaidRevenueUsd: num(metrics.verifiedPaidRevenueUsd),
    netProfitUsd: num(metrics.netProfitUsd),
    jobsWon: num(metrics.jobsWon),
    activeJobs: num(metrics.activeJobs),
  };
}

export type NationwideView = {
  ok: boolean;
  reason?: string;
  hqUrl: string;
  hqApplied: number;
  hqRejected: number;
  hqJobCount: number;
  hqJobs: HqMarketplaceJob[];
  empApplied: number;
  emp: NationwideEmp | null;
  /** Real marketplace money (pending payment, verified paid, net profit, jobs won). */
  hqMoney: HqMoney;
  /** Real Sent/Delivered/Opened/Clicked funnel per outreach campaign (ca_drop/ca_accessibility/ca_vendor_risk). */
  outreachFunnels: OutreachCampaignFunnel[];
  /** Full HQ snapshot metrics (marketplace lanes) when available. */
  snapshot?: Record<string, unknown> | null;
  readiness?: Record<string, unknown> | null;
  /** Last HQ control action result (tick / pause). */
  lastAction?: { action: string; ok: boolean; detail?: string; at: string } | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function countByStatus(jobs: Array<{ status?: string }>, wanted: Set<string>): number {
  return jobs.filter((j) => wanted.has(String(j.status || ""))).length;
}

export function countReloApplied(jobs: Array<{ status: string }>): {
  applied: number;
  rejected: number;
  submitted: number;
} {
  return {
    applied: jobs.filter((j) => RELO_APPLIED_JOB_STATUSES.has(j.status)).length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
    submitted: jobs.filter((j) =>
      ["submitted", "accepted_by_customer", "payment_pending", "paid"].includes(j.status),
    ).length,
  };
}

export function summarizeHqEarningsJson(json: unknown, hqUrl: string): NationwideView {
  const root = asRecord(json);
  const snapshot = asRecord(root.snapshot);
  const jobsRaw = Array.isArray(snapshot.jobs) ? snapshot.jobs : [];
  const jobs = jobsRaw
    .filter((j) => j && typeof j === "object")
    .map((j) => {
      const r = asRecord(j);
      return {
        id: typeof r.id === "string" ? r.id : undefined,
        title: String(r.title || "Untitled"),
        status: String(r.status || ""),
        marketplace: typeof r.marketplace === "string" ? r.marketplace : undefined,
        payoutUsd: typeof r.payoutUsd === "number" ? r.payoutUsd : undefined,
        description: typeof r.description === "string" ? r.description : undefined,
        externalId: typeof r.externalId === "string" ? r.externalId : undefined,
      };
    });
  const empRaw = root.emp && typeof root.emp === "object" ? asRecord(root.emp) : null;
  const emp = empRaw ? (empRaw as unknown as NationwideEmp) : null;
  const empOpps = Array.isArray(emp?.opportunities) ? emp.opportunities : [];
  return {
    ok: true,
    hqUrl,
    hqApplied: countByStatus(jobs, HQ_APPLIED_JOB_STATUSES),
    hqRejected: jobs.filter((j) => j.status === "rejected").length,
    hqJobCount: jobs.length,
    hqJobs: jobs.slice(0, 80),
    empApplied: empOpps.filter((o) => HQ_EMP_APPLIED_STATUSES.has(String(o.status || ""))).length,
    emp,
    hqMoney: extractHqMoney(snapshot),
    outreachFunnels: asOutreachFunnels(root.outreachFunnels),
    snapshot: Object.keys(snapshot).length ? snapshot : null,
    readiness: root.readiness && typeof root.readiness === "object" ? asRecord(root.readiness) : null,
    lastAction: null,
  };
}

let cache: { at: number; view: NationwideView } | null = null;

function emptyView(hqUrl: string, reason: string): NationwideView {
  return {
    ok: false,
    reason,
    hqUrl,
    hqApplied: 0,
    hqRejected: 0,
    hqJobCount: 0,
    hqJobs: [],
    empApplied: 0,
    emp: null,
    hqMoney: emptyHqMoney(),
    outreachFunnels: [],
    snapshot: null,
    readiness: null,
    lastAction: null,
  };
}

function remember(view: NationwideView): NationwideView {
  cache = { at: Date.now(), view };
  return view;
}

export function clearHqNationwideCache() {
  cache = null;
}

function hqBaseUrl(): string {
  return (process.env.AMBER_HQ_URL || "https://hq.amberoneai.com").replace(/\/$/, "");
}

/** Prefer CRON_SECRET — Relo's AMBER_BUILDER_SECRET is often unset on HQ. */
function hqSecretCandidates(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [
    process.env.AMBER_HQ_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.AMBER_BUILDER_SECRET,
    process.env.SOCIAL_TOKEN_SECRET,
  ]) {
    const v = String(raw || "").trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function hqAuthHeaders(token: string): Record<string, string> {
  return {
    "x-cron-secret": token,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchHqNationwide(opts?: { bypassCache?: boolean }): Promise<NationwideView> {
  const hqUrl = hqBaseUrl();
  if (!opts?.bypassCache && cache && Date.now() - cache.at < 45_000) return cache.view;

  const tokens = hqSecretCandidates();
  if (!tokens.length) {
    return emptyView(hqUrl, "missing_hq_secret");
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20_000);
  try {
    let lastStatus = 0;
    for (const token of tokens) {
      const res = await fetch(`${hqUrl}/api/amber-earnings`, {
        headers: hqAuthHeaders(token),
        cache: "no-store",
        signal: ac.signal,
      });
      lastStatus = res.status;
      if (res.status === 401 || res.status === 403) continue;
      if (!res.ok) return remember(emptyView(hqUrl, `hq_http_${res.status}`));
      const json = await res.json().catch(() => null);
      if (!json) return remember(emptyView(hqUrl, "hq_invalid_json"));
      return remember(summarizeHqEarningsJson(json, hqUrl));
    }
    return remember(emptyView(hqUrl, `hq_http_${lastStatus || 401}`));
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return remember(emptyView(hqUrl, aborted ? "hq_timeout" : "hq_fetch_failed"));
  } finally {
    clearTimeout(timer);
  }
}

/** Proxy owner control actions to HQ so Relo is the only UI needed. */
export async function proxyHqEarningsAction(
  action: string,
  extra?: Record<string, unknown>,
): Promise<{ ok: boolean; detail: string; nationwide: NationwideView }> {
  const hqUrl = hqBaseUrl();
  const tokens = hqSecretCandidates();
  if (!tokens.length) {
    return { ok: false, detail: "missing_hq_secret", nationwide: emptyView(hqUrl, "missing_hq_secret") };
  }

  const path =
    action === "tick" || action === "hq-tick" || action === "hq-scan"
      ? `${hqUrl}/api/amber-earnings/tick`
      : `${hqUrl}/api/amber-earnings`;

  const bodyAction =
    action === "hq-tick" || action === "hq-scan"
      ? "tick"
      : action === "hq-pause-all"
        ? "pause-all"
        : action === "hq-resume-all"
          ? "resume-all"
          : action.replace(/^hq-/, "");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 90_000);
  try {
    let lastStatus = 0;
    let json: Record<string, unknown> = {};
    let authorized = false;
    for (const token of tokens) {
      const res = await fetch(path, {
        method: "POST",
        headers: hqAuthHeaders(token),
        body: JSON.stringify({ action: bodyAction, ...extra }),
        signal: ac.signal,
      });
      lastStatus = res.status;
      json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status === 401 || res.status === 403) continue;
      authorized = true;
      clearHqNationwideCache();
      const nationwide = await fetchHqNationwide({ bypassCache: true });
      if (!res.ok) {
        return {
          ok: false,
          detail: `hq_action_http_${res.status}`,
          nationwide: {
            ...nationwide,
            lastAction: {
              action: bodyAction,
              ok: false,
              detail: String(json.error || res.status),
              at: new Date().toISOString(),
            },
          },
        };
      }
      return {
        ok: true,
        detail: bodyAction,
        nationwide: {
          ...nationwide,
          lastAction: { action: bodyAction, ok: true, at: new Date().toISOString() },
        },
      };
    }
    clearHqNationwideCache();
    const nationwide = await fetchHqNationwide({ bypassCache: true });
    return {
      ok: false,
      detail: authorized ? `hq_action_http_${lastStatus}` : `hq_action_http_${lastStatus || 401}`,
      nationwide: {
        ...nationwide,
        lastAction: {
          action: bodyAction,
          ok: false,
          detail: String(json.error || lastStatus || 401),
          at: new Date().toISOString(),
        },
      },
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      detail: aborted ? "hq_action_timeout" : "hq_action_failed",
      nationwide: emptyView(hqUrl, aborted ? "hq_action_timeout" : "hq_action_failed"),
    };
  } finally {
    clearTimeout(timer);
  }
}
