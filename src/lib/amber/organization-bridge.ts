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
