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
/** The 5 marketplace-adapter-only view, kept exactly as before -- nothing reading these fields should notice a change. */
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

export type HqEconomicState = "STARTING" | "SURVIVING" | "PROFITABLE" | "SCALING" | "AT_RISK" | "PAUSED";

/**
 * The combined true-economics view (marketplace adapters + the Standard
 * Earning Source Interface's external sources, e.g. ebook sales) -- see
 * amberai's src/lib/amber-earnings/snapshot.ts for how these are computed.
 * Distinct from HqMoney above so existing readers of that type are
 * unaffected by this addition.
 */
export type HqEconomics = {
  grossRevenueUsd: number;
  costBreakdown: Record<string, number>;
  earnedCapitalUsd: number;
  reservedCapitalUsd: number;
  growthCapitalUsd: number;
  lifetimeRevenueUsd: number;
  lifetimeNetProfitUsd: number;
  /** null until Amber's first real (non-test) dollar has ever landed. */
  firstRealDollarAt: string | null;
  economicState: HqEconomicState;
};

function emptyHqEconomics(): HqEconomics {
  return {
    grossRevenueUsd: 0,
    costBreakdown: {},
    earnedCapitalUsd: 0,
    reservedCapitalUsd: 0,
    growthCapitalUsd: 0,
    lifetimeRevenueUsd: 0,
    lifetimeNetProfitUsd: 0,
    firstRealDollarAt: null,
    economicState: "STARTING",
  };
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

const HQ_ECONOMIC_STATES = new Set(["STARTING", "SURVIVING", "PROFITABLE", "SCALING", "AT_RISK", "PAUSED"]);

function extractHqEconomics(snapshot: Record<string, unknown>): HqEconomics {
  const metrics = asRecord(snapshot.metrics);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const costBreakdownRaw = asRecord(metrics.costBreakdown);
  const costBreakdown: Record<string, number> = {};
  for (const [k, v] of Object.entries(costBreakdownRaw)) costBreakdown[k] = num(v);
  const stateRaw = typeof metrics.economicState === "string" ? metrics.economicState : "";
  return {
    grossRevenueUsd: num(metrics.grossRevenueUsd),
    costBreakdown,
    earnedCapitalUsd: num(metrics.earnedCapitalUsd),
    reservedCapitalUsd: num(metrics.reservedCapitalUsd),
    growthCapitalUsd: num(metrics.growthCapitalUsd),
    lifetimeRevenueUsd: num(metrics.lifetimeRevenueUsd),
    lifetimeNetProfitUsd: num(metrics.lifetimeNetProfitUsd),
    firstRealDollarAt: typeof metrics.firstRealDollarAt === "string" ? metrics.firstRealDollarAt : null,
    economicState: (HQ_ECONOMIC_STATES.has(stateRaw) ? stateRaw : "STARTING") as HqEconomicState,
  };
}

/**
 * The "revenue by division / agent / marketplace" and "today/7d/30d/lifetime"
 * breakdowns HQ computes in snapshot.metrics.{byDivision,byAgent,byMarketplace,
 * windows}. Every figure is real: verified PaymentEvidence or a real
 * EarningEvent — never a status string or a task marked DONE. Empty until HQ
 * has that field deployed and Amber has earned something.
 */
export type HqEarningsBucket = {
  key: string;
  grossRevenueUsd: number;
  verifiedPaidRevenueUsd: number;
  pendingPaymentUsd: number;
  expensesUsd: number;
  netProfitUsd: number;
  jobsWon: number;
  jobsPaid: number;
  jobsInFlight: number;
};

export type HqEarningsWindow = {
  grossRevenueUsd: number;
  verifiedPaidRevenueUsd: number;
  expensesUsd: number;
  netProfitUsd: number;
  jobsPaid: number;
};

export type HqBreakdowns = {
  byMarketplace: HqEarningsBucket[];
  byDivision: HqEarningsBucket[];
  byAgent: HqEarningsBucket[];
  windows: { today: HqEarningsWindow; last7d: HqEarningsWindow; last30d: HqEarningsWindow; lifetime: HqEarningsWindow };
};

function emptyHqWindow(): HqEarningsWindow {
  return { grossRevenueUsd: 0, verifiedPaidRevenueUsd: 0, expensesUsd: 0, netProfitUsd: 0, jobsPaid: 0 };
}

function emptyHqBreakdowns(): HqBreakdowns {
  return {
    byMarketplace: [],
    byDivision: [],
    byAgent: [],
    windows: { today: emptyHqWindow(), last7d: emptyHqWindow(), last30d: emptyHqWindow(), lifetime: emptyHqWindow() },
  };
}

function asBuckets(v: unknown): HqEarningsBucket[] {
  if (!Array.isArray(v)) return [];
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  return v
    .filter((b) => b && typeof b === "object")
    .map((b) => {
      const r = asRecord(b);
      return {
        key: String(r.key || "—"),
        grossRevenueUsd: num(r.grossRevenueUsd),
        verifiedPaidRevenueUsd: num(r.verifiedPaidRevenueUsd),
        pendingPaymentUsd: num(r.pendingPaymentUsd),
        expensesUsd: num(r.expensesUsd),
        netProfitUsd: num(r.netProfitUsd),
        jobsWon: num(r.jobsWon),
        jobsPaid: num(r.jobsPaid),
        jobsInFlight: num(r.jobsInFlight),
      };
    });
}

function asWindow(v: unknown): HqEarningsWindow {
  const r = asRecord(v);
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  return {
    grossRevenueUsd: num(r.grossRevenueUsd),
    verifiedPaidRevenueUsd: num(r.verifiedPaidRevenueUsd),
    expensesUsd: num(r.expensesUsd),
    netProfitUsd: num(r.netProfitUsd),
    jobsPaid: num(r.jobsPaid),
  };
}

function extractHqBreakdowns(snapshot: Record<string, unknown>): HqBreakdowns {
  const metrics = asRecord(snapshot.metrics);
  const w = asRecord(metrics.windows);
  return {
    byMarketplace: asBuckets(metrics.byMarketplace),
    byDivision: asBuckets(metrics.byDivision),
    byAgent: asBuckets(metrics.byAgent),
    windows: {
      today: asWindow(w.today),
      last7d: asWindow(w.last7d),
      last30d: asWindow(w.last30d),
      lifetime: asWindow(w.lifetime),
    },
  };
}

/**
 * HQ's own general owner-action list (src/lib/amber-earnings/tick.ts's
 * ownerStepsFor + governmentOwnerSteps on the HQ side) — one owner-only step
 * per marketplace that needs it: a vaulted key, a device-login approval, or
 * (Dealwork) the claim link to attach a real payout method. Separate from
 * `emp.ownerActions`, which is only the government/grants lane; before this,
 * everything else in `ownerSteps` was fetched from HQ but never read by
 * anything on this page, so a real, actionable step like "claim your
 * Dealwork payout" was invisible here even though the data was already
 * arriving.
 */
export type HqOwnerStep = { platform: string; whatINeedToDo: string; whereToClick: string; whyRequired: string };

/** One item from HQ's consolidated owner queue. */
export type OwnerActionItem = {
  id: string;
  source: string;
  category: string;
  whyRequired: string;
  expectedOpportunity: string;
  expectedValueUsd: number;
  exactSteps: string[];
  whereToClick: string;
  /** Does clearing this ONE item let money actually move? */
  revenueBlocking: boolean;
  origins: string[];
  resumesFrom: string;
};

export type OwnerActionQueue = {
  at: string;
  actions: OwnerActionItem[];
  revenueBlockingCount: number;
  totalExpectedValueUsd: number;
  unblockedWorkNote: string;
  duplicatesMerged: number;
  /**
   * Items HQ held back because the platform does not pay for work.
   *
   * Rendered as a count, not hidden. Twenty sources once looked like twenty
   * lanes one signup away from revenue and seventeen were shops, archives and
   * a cosmetic-surgery directory — a silently shorter queue would be the same
   * error facing the other way.
   */
  notPayers: Array<{ source: string; purpose: string; why: string }>;
};

/** HQ's answer to "what should Amber try next, and how soon does it pay?" */
export type ShortestPath = {
  at: string;
  next: {
    candidate: { platform: string; externalId: string; title: string; hoursToCash: number };
    score: number;
    netPaymentUsd: number;
    winProbabilityIsMeasured: boolean;
    reasoning: string;
  } | null;
  availableCount: number;
  blockedCount: number;
  unprofitableCount: number;
  notes: string[];
};


/** One measured step in a source's funnel. `count: null` means unmeasured. */
export type YieldStage = { key: string; label: string; count: number | null; note?: string };

/**
 * What one source is doing with the capacity it holds.
 *
 * Separate from "is it healthy" on purpose: three of five connected sources
 * report healthy and have never returned a single record.
 */
export type SourceYield = {
  source: string;
  verdict: string;
  summary: string;
  stages: YieldStage[];
  uniquePerHundredFetched: number | null;
  recordsPerSearch: number | null;
  scoutsNeverExecuted: number | null;
  mostRescanned: { externalId: string; title: string; sightings: number } | null;
  overlap: {
    foundByMultipleScouts: number;
    avgScoutsPerOpportunity: number | null;
    mostScoutsOnOneListing: { externalId: string; scouts: number } | null;
  };
  verifiedRevenueUsd: number;
};

export type YieldReport = {
  at: string;
  sources: SourceYield[];
  totals: {
    scoutsAssigned: number;
    scoutsExecuted: number;
    scoutsNeverExecuted: number;
    rawRecordsFetched: number;
    uniqueOpportunities: number;
    verifiedRevenueUsd: number;
    duplicatesSuppressed: number | null;
  };
  notes: string[];
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}


/** One contract-value lane, with advertised held apart from obtainable. */
export type LaneRow = {
  id: string;
  label: string;
  minUsd: number;
  maxUsd: number | null;
  opportunities: number;
  advertisedValueUsd: number;
  /** The subset with a credible route. The only figure that may justify spend. */
  obtainableValueUsd: number;
  verifiedRevenueUsd: number;
  diligence: string[];
};

export type LaneReport = {
  lanes: LaneRow[];
  /** Opportunities publishing no value — in no lane, not in the cheapest. */
  unpriced: number;
  notes: string[];
};

/** One specialty's build case: BUILD, WATCH or REJECT, with the numbers. */
export type SpecialtyCase = {
  specialtyId: string;
  label: string;
  decision: string;
  distinctBuyers: number;
  distinctCountries: number;
  opportunities: number;
  advertisedValueUsd: number;
  obtainableValueUsd: number;
  winProbability: number | null;
  winProbabilityIsMeasured: boolean;
  expectedReturnUsd: number | null;
  buildCostUsd: number;
  reuseBreadth: number;
  blockedBy: string[];
  reasons: string[];
};

export type GrowthReport = {
  cases: SpecialtyCase[];
  recommended: SpecialtyCase | null;
  buildCount: number;
  watchCount: number;
  rejectCount: number;
  notes: string[];
};

function extractLaneReport(snapshot: Record<string, unknown>): LaneReport | null {
  const l = asRecord(snapshot.laneReport);
  if (!Array.isArray(l.lanes)) return null;
  return {
    lanes: (l.lanes as Record<string, unknown>[]).map((row) => {
      const lane = asRecord(row.lane);
      return {
        id: String(lane.id || ""),
        label: String(lane.label || ""),
        minUsd: num(lane.minUsd) ?? 0,
        maxUsd: num(lane.maxUsd),
        opportunities: num(row.opportunities) ?? 0,
        advertisedValueUsd: num(row.advertisedValueUsd) ?? 0,
        obtainableValueUsd: num(row.obtainableValueUsd) ?? 0,
        verifiedRevenueUsd: num(row.verifiedRevenueUsd) ?? 0,
        diligence: Array.isArray(lane.diligence) ? lane.diligence.map(String) : [],
      };
    }),
    unpriced: num(l.unpriced) ?? 0,
    notes: Array.isArray(l.notes) ? l.notes.map(String) : [],
  };
}

function asSpecialtyCase(c: Record<string, unknown>): SpecialtyCase {
  return {
    specialtyId: String(c.specialtyId || ""),
    label: String(c.label || ""),
    decision: String(c.decision || ""),
    distinctBuyers: num(c.distinctBuyers) ?? 0,
    distinctCountries: num(c.distinctCountries) ?? 0,
    opportunities: num(c.opportunities) ?? 0,
    advertisedValueUsd: num(c.advertisedValueUsd) ?? 0,
    obtainableValueUsd: num(c.obtainableValueUsd) ?? 0,
    winProbability: num(c.winProbability),
    winProbabilityIsMeasured: Boolean(c.winProbabilityIsMeasured),
    expectedReturnUsd: num(c.expectedReturnUsd),
    buildCostUsd: num(c.buildCostUsd) ?? 0,
    reuseBreadth: num(c.reuseBreadth) ?? 0,
    blockedBy: Array.isArray(c.blockedBy) ? c.blockedBy.map(String) : [],
    reasons: Array.isArray(c.reasons) ? c.reasons.map(String) : [],
  };
}

function extractGrowthReport(snapshot: Record<string, unknown>): GrowthReport | null {
  const g = asRecord(snapshot.capabilityGrowth);
  if (!Array.isArray(g.cases)) return null;
  const rec = asRecord(g.recommended);
  return {
    cases: (g.cases as Record<string, unknown>[]).map(asSpecialtyCase),
    recommended: rec.specialtyId ? asSpecialtyCase(rec) : null,
    buildCount: num(g.buildCount) ?? 0,
    watchCount: num(g.watchCount) ?? 0,
    rejectCount: num(g.rejectCount) ?? 0,
    notes: Array.isArray(g.notes) ? g.notes.map(String) : [],
  };
}

function extractYieldReport(snapshot: Record<string, unknown>): YieldReport | null {
  const y = asRecord(snapshot.yieldReport);
  if (!Array.isArray(y.sources)) return null;
  const t = asRecord(y.totals);
  return {
    at: String(y.at || ""),
    sources: (y.sources as Record<string, unknown>[]).map((s) => {
      const o = asRecord(s.overlap);
      const most = asRecord(s.mostRescanned);
      const mostScouts = asRecord(o.mostScoutsOnOneListing);
      return {
        source: String(s.source || ""),
        verdict: String(s.verdict || ""),
        summary: String(s.summary || ""),
        stages: Array.isArray(s.stages)
          ? (s.stages as Record<string, unknown>[]).map((st) => ({
              key: String(st.key || ""),
              label: String(st.label || ""),
              count: num(st.count),
              note: st.note ? String(st.note) : undefined,
            }))
          : [],
        uniquePerHundredFetched: num(s.uniquePerHundredFetched),
        recordsPerSearch: num(s.recordsPerSearch),
        scoutsNeverExecuted: num(s.scoutsNeverExecuted),
        mostRescanned: most.externalId
          ? { externalId: String(most.externalId), title: String(most.title || ""), sightings: num(most.sightings) ?? 0 }
          : null,
        overlap: {
          foundByMultipleScouts: num(o.foundByMultipleScouts) ?? 0,
          avgScoutsPerOpportunity: num(o.avgScoutsPerOpportunity),
          mostScoutsOnOneListing: mostScouts.externalId
            ? { externalId: String(mostScouts.externalId), scouts: num(mostScouts.scouts) ?? 0 }
            : null,
        },
        verifiedRevenueUsd: num(s.verifiedRevenueUsd) ?? 0,
      };
    }),
    totals: {
      scoutsAssigned: num(t.scoutsAssigned) ?? 0,
      scoutsExecuted: num(t.scoutsExecuted) ?? 0,
      scoutsNeverExecuted: num(t.scoutsNeverExecuted) ?? 0,
      rawRecordsFetched: num(t.rawRecordsFetched) ?? 0,
      uniqueOpportunities: num(t.uniqueOpportunities) ?? 0,
      verifiedRevenueUsd: num(t.verifiedRevenueUsd) ?? 0,
      duplicatesSuppressed: num(t.duplicatesSuppressed),
    },
    notes: Array.isArray(y.notes) ? y.notes.map(String) : [],
  };
}

function extractOwnerActionQueue(snapshot: Record<string, unknown>): OwnerActionQueue | null {
  const q = asRecord(snapshot.ownerActionQueue);
  if (!Array.isArray(q.actions)) return null;
  return {
    at: String(q.at || ""),
    actions: (q.actions as Record<string, unknown>[]).map((a) => ({
      id: String(a.id || ""),
      source: String(a.source || "Amber"),
      category: String(a.category || ""),
      whyRequired: String(a.whyRequired || ""),
      expectedOpportunity: String(a.expectedOpportunity || ""),
      expectedValueUsd: Number(a.expectedValueUsd) || 0,
      exactSteps: Array.isArray(a.exactSteps) ? a.exactSteps.map(String) : [],
      whereToClick: String(a.whereToClick || ""),
      revenueBlocking: Boolean(a.revenueBlocking),
      origins: Array.isArray(a.origins) ? a.origins.map(String) : [],
      resumesFrom: String(a.resumesFrom || ""),
    })),
    revenueBlockingCount: Number(q.revenueBlockingCount) || 0,
    totalExpectedValueUsd: Number(q.totalExpectedValueUsd) || 0,
    unblockedWorkNote: String(q.unblockedWorkNote || ""),
    duplicatesMerged: Number(q.duplicatesMerged) || 0,
    notPayers: Array.isArray(q.notPayers)
      ? (q.notPayers as Record<string, unknown>[]).map((n) => ({
          source: String(n.source || ""),
          purpose: String(n.purpose || ""),
          why: String(n.why || ""),
        }))
      : [],
  };
}

function extractShortestPath(snapshot: Record<string, unknown>): ShortestPath | null {
  const p = asRecord(snapshot.shortestPath);
  if (!Array.isArray(p.notes)) return null;
  const next = asRecord(p.next);
  const candidate = asRecord(next.candidate);
  return {
    at: String(p.at || ""),
    next: next.reasoning
      ? {
          candidate: {
            platform: String(candidate.platform || ""),
            externalId: String(candidate.externalId || ""),
            title: String(candidate.title || ""),
            hoursToCash: Number(candidate.hoursToCash) || 0,
          },
          score: Number(next.score) || 0,
          netPaymentUsd: Number(next.netPaymentUsd) || 0,
          winProbabilityIsMeasured: Boolean(next.winProbabilityIsMeasured),
          reasoning: String(next.reasoning || ""),
        }
      : null,
    availableCount: Number(p.availableCount) || 0,
    blockedCount: Number(p.blockedCount) || 0,
    unprofitableCount: Number(p.unprofitableCount) || 0,
    notes: p.notes.map(String),
  };
}

function extractHqOwnerSteps(snapshot: Record<string, unknown>): HqOwnerStep[] {
  const raw = Array.isArray(snapshot.ownerSteps) ? snapshot.ownerSteps : [];
  return raw
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object")
    .map((s) => ({
      platform: String(s.platform || "Amber"),
      whatINeedToDo: String(s.whatINeedToDo || ""),
      whereToClick: String(s.whereToClick || ""),
      whyRequired: String(s.whyRequired || ""),
    }));
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
  /** True combined economics: marketplaces + every Standard Earning Source Interface source (e.g. ebook sales). Amber-earned capital, distinct from owner funds, starts at $0. */
  hqEconomics: HqEconomics;
  /** Verified money grouped by division / agent / marketplace, and by today/7d/30d/lifetime. All zero until Amber earns her first real dollar. */
  hqBreakdowns: HqBreakdowns;
  /** Real owner-only action items across every marketplace (TaskBounty, SporeAgent, MoltJobs, Dealwork) — not just the government/grants lane. */
  hqOwnerSteps: HqOwnerStep[];
  /**
   * The ONE owner action queue, as HQ consolidated it.
   *
   * This page used to render two owner lists of different shapes — the raw
   * per-marketplace steps and the government lane's own actions — neither
   * ranked by what clearing the item would unlock. HQ now does the
   * consolidation, deduplication, ranking and filtering, and this is the
   * result. Two places computing "what is waiting on the owner" can disagree,
   * and the one that disagrees is always the one the owner is looking at.
   */
  ownerActionQueue: OwnerActionQueue | null;
  /** The fastest route to the first real dollar, or an honest nothing. */
  shortestPath: ShortestPath | null;
  /**
   * The end-to-end funnel per source: scouts assigned to money received.
   *
   * Computed by HQ from the scout network and the earnings ledger together.
   * Everything above it on this page is activity; this is the one that says
   * whether any of it reached a dollar and where it stopped when it did not.
   */
  yieldReport: YieldReport | null;
  /** The five contract-value lanes, advertised held apart from obtainable. */
  laneReport: LaneReport | null;
  /**
   * Which specialty the market is paying for, and whether to learn it.
   *
   * BUILD requires four independent conditions. The engine this replaces
   * ranked on advertised value and recommended $54,000 of competitions
   * Amber cannot enter.
   */
  growthReport: GrowthReport | null;
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
    hqEconomics: extractHqEconomics(snapshot),
    hqBreakdowns: extractHqBreakdowns(snapshot),
    hqOwnerSteps: extractHqOwnerSteps(snapshot),
    ownerActionQueue: extractOwnerActionQueue(snapshot),
    shortestPath: extractShortestPath(snapshot),
    yieldReport: extractYieldReport(snapshot),
    laneReport: extractLaneReport(snapshot),
    growthReport: extractGrowthReport(snapshot),
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
    hqEconomics: emptyHqEconomics(),
    hqBreakdowns: emptyHqBreakdowns(),
    hqOwnerSteps: [],
    ownerActionQueue: null,
    shortestPath: null,
    yieldReport: null,
    laneReport: null,
    growthReport: null,
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
