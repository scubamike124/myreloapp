// ---------------------------------------------------------------------------
// Amber Organization bridge — POST /api/internal/reelo-organization-bridge
// on Amber HQ. Lets Reelo's Business Center -> "Amber's AI Earnings" admin
// page read and control Amber's own 20-division organization (divisions,
// agents, tasks, budgets, emergency stop) without exposing Amber HQ's own
// cron-secret-based auth to a browser.
//
// Same optional/never-throws shape as amber/dev-bridge.ts and
// amber/youtube-bridge.ts: an unset secret means this is simply unavailable,
// not an error -- REELO_ORG_BRIDGE_SECRET must be set to the same value as
// Amber HQ's REELO_ORG_BRIDGE_SECRET (Railway, service amber-hq-web) before
// this page can show anything real.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://hq.amberoneai.com";

function config(): { baseUrl: string; secret: string } | null {
  const baseUrl = (process.env.AMBER_ORG_BRIDGE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const secret = process.env.REELO_ORG_BRIDGE_SECRET ?? "";
  if (!secret) return null;
  return { baseUrl, secret };
}

export function amberOrgBridgeConfigured(): boolean {
  return config() !== null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Amber's organization bridge is not configured (REELO_ORG_BRIDGE_SECRET unset).");

  const res = await fetch(`${cfg.baseUrl}/api/internal/reelo-organization-bridge`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bridge-secret": cfg.secret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Amber's organization bridge call failed (${res.status}).`);
  }
  return data as T;
}

export type DivisionBlueprintView = {
  id: string;
  name: string;
  mission: string;
  revenueObjective: string;
  verificationRequirements: string;
};

export type DivisionView = {
  id: string;
  status: string;
  dailyBudgetUsd: number | null;
  maxSingleSpendUsd: number | null;
  maxCumulativeSpendUsd: number | null;
  pausedAt: string | null;
  pauseReason: string | null;
  blueprint: DivisionBlueprintView;
};

export type AgentView = {
  id: string;
  divisionId: string;
  key: string;
  displayName: string;
  status: string;
  mission: string;
  successRate: number;
  pausedAt: string | null;
  pauseReason: string | null;
};

export type TaskView = {
  id: string;
  agentId: string;
  divisionId: string;
  title: string;
  status: string;
  externalRef: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type OrganizationOverview = {
  divisions: DivisionView[];
  agents: AgentView[];
  recentTasks: TaskView[];
};

export async function fetchOrganizationOverview(): Promise<OrganizationOverview> {
  return call<OrganizationOverview>({ action: "overview" });
}

export async function pauseDivision(divisionId: string, reason: string): Promise<{ division: DivisionView }> {
  return call({ action: "pause_division", divisionId, reason });
}

export async function resumeDivision(divisionId: string): Promise<{ division: DivisionView }> {
  return call({ action: "resume_division", divisionId });
}

export async function setDivisionBudget(
  divisionId: string,
  budget: { dailyBudgetUsd?: number | null; maxSingleSpendUsd?: number | null; maxCumulativeSpendUsd?: number | null },
): Promise<{ division: DivisionView }> {
  return call({ action: "set_division_budget", divisionId, ...budget });
}

export async function pauseAgent(agentId: string, reason: string): Promise<{ agent: AgentView }> {
  return call({ action: "pause_agent", agentId, reason });
}

export async function resumeAgent(agentId: string): Promise<{ agent: AgentView }> {
  return call({ action: "resume_agent", agentId });
}

export type EmergencyStopResult = { divisionsPaused: number; agentsPaused: number };
export async function emergencyStopAll(): Promise<EmergencyStopResult> {
  return call<EmergencyStopResult>({ action: "emergency_stop" });
}

export type ResumeFromEmergencyStopResult = { divisionsResumed: number; agentsResumed: number };
export async function resumeFromEmergencyStop(): Promise<ResumeFromEmergencyStopResult> {
  return call<ResumeFromEmergencyStopResult>({ action: "resume_from_emergency_stop" });
}

// ---------------------------------------------------------------------------
// International API Command Center
//
// Reads the API inventory Amber HQ already maintains rather than keeping a
// second copy here. One system of record per function: Reelo renders, Amber
// HQ owns.
// ---------------------------------------------------------------------------

export type ApiCountryRow = {
  country: string;
  name: string;
  /** APIs whose primary market is this country — the number shown beside it. */
  apis: number;
  /** Served without being owned. Reach, kept apart from inventory. */
  alsoServes: number;
  live: number;
  draft: number;
};

export type ApiCommandCenterSnapshot = {
  generatedAt: string;
  totals: {
    totalApis: number;
    live: number;
    draft: number;
    hidden: number;
    countriesWithApis: number;
    unassigned: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  /**
   * Null means unmeasured, not zero.
   *
   * The catalogue records no payment or customer data, and rendering 0 would
   * assert the business has earned nothing when the true statement is that
   * nothing measures it. The UI must show those differently.
   */
  revenue: {
    verifiedLifetimeUsd: number | null;
    verified30DayUsd: number | null;
    customers: number | null;
    note: string;
  };
  countries: ApiCountryRow[];
};

export type CountryApiDetail = {
  productId: string;
  name: string;
  purpose: string | null;
  category: string | null;
  status: string;
  pricingDisplay: string | null;
  docsUrl: string | null;
  launchDate: string | null;
  origin: { title: string; sourceUrl: string; effectiveDate?: string; verifiedAt: string } | null;
  serves: string[];
  updatedAt: string;
};

export async function fetchApiCommandCenter(): Promise<ApiCommandCenterSnapshot> {
  const data = await call<{ snapshot: ApiCommandCenterSnapshot }>({ action: "api_command_center" });
  return data.snapshot;
}

export async function fetchCountryApis(
  country: string,
): Promise<{ country: { code: string; name: string }; apis: CountryApiDetail[]; alsoServing: CountryApiDetail[] }> {
  return call({ action: "api_country_detail", country });
}

// ---------------------------------------------------------------------------
// Division -> Agent -> Task drill-down (§ scouts-under-Amber workforce). One
// row per real task an org-layer agent actually ran; "no child worker" is
// real information about an agent with nothing qualified routed to it yet,
// not a gap in this view (see workforce-drilldown.ts's own header on Amber HQ).
// ---------------------------------------------------------------------------

export type AgentTaskSummary = {
  id: string;
  status: string;
  title: string;
  source: string | null;
  country: string | null;
  externalRef: string;
  createdAt: string;
  completedAt: string | null;
  lastResult: string;
};

export type AgentDrilldownView = {
  agent: AgentView;
  activeWorkers: number;
  concurrencyCap: number;
  recentTasks: AgentTaskSummary[];
  lastActionAt: string | null;
  neverAssignedWork: boolean;
  wiringStatus: "connected" | "dormant_unwired";
  wiringNote: string;
};

export type DivisionDrilldownView = { divisionId: string; status: string; agents: AgentDrilldownView[] };

export async function fetchWorkforceDrilldown(): Promise<DivisionDrilldownView[]> {
  const data = await call<{ drilldown: DivisionDrilldownView[] }>({ action: "workforce_drilldown" });
  return data.drilldown;
}

// ---------------------------------------------------------------------------
// The 100,000-real-child-worker hierarchy under the 5,120 scouts (owner
// directive, 2026-09-13/14). See amberai's src/lib/scout-network/
// child-workforce.ts for the full real design this surfaces.
// ---------------------------------------------------------------------------

export type ChildWorkforceRole = "research" | "qualify" | "monitor" | "status_tracking";
export type ChildWorkerStatusView = "ACTIVE" | "IDLE" | "BLOCKED" | "FAILED";

export type ChildWorkforceHierarchy = {
  at: string;
  total: number;
  everRun: number;
  neverRun: number;
  byStatus: Record<ChildWorkerStatusView, number>;
  byRole: Record<ChildWorkforceRole, number>;
  bySource: Record<string, number>;
  statusTrackingTotal: number;
  statusTrackingByStatus: Record<ChildWorkerStatusView, number>;
  sample: Array<{
    id: string;
    role: ChildWorkforceRole;
    source: string;
    status?: ChildWorkerStatusView;
    lastTaskAt?: string;
    lastResult?: string;
    runsCompleted?: number;
    runsFailed?: number;
    runsEmpty?: number;
    runsProductive?: number;
  }>;
};

export type ChildWorkforceRoleBucket = Record<ChildWorkforceRole, { dispatched: number; productive: number }>;

export type ChildWorkforceWindow = {
  windowHours: number;
  since: string;
  ticksInWindow: number;
  dispatched: number;
  productive: number;
  empty: number;
  failed: number;
  blocked: number;
  byRole: ChildWorkforceRoleBucket;
  bySource: Record<string, { dispatched: number; productive: number }>;
  byCategory: Record<string, { dispatched: number; productive: number }>;
  byGeography: Record<string, { dispatched: number; productive: number }>;
  monitor: { searched: number; uniqueNew: number; duplicates: number; qualified: number; rejected: number };
};

export type ChildWorkforceReport = {
  hierarchy: ChildWorkforceHierarchy;
  windows: { last1h: ChildWorkforceWindow; last24h: ChildWorkforceWindow; last7d: ChildWorkforceWindow };
  statusTracking: Array<{ id: string; scoutId: string; source: string; status: ChildWorkerStatusView; lastTaskAt: string; lastResult: string; lastOpportunityId: string }>;
  tickSchedule: { cronExpr: string; detail: string };
};

export async function fetchChildWorkforceReport(): Promise<ChildWorkforceReport> {
  return call<ChildWorkforceReport>({ action: "child_workforce_report" });
}
