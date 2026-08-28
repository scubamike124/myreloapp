// ---------------------------------------------------------------------------
// Amber OS dev bridge — POST /api/internal/reelo-dev-bridge on Amber HQ.
// Lets the Command Center create and track real engineering work (Amber OS's
// existing coding-agent loop: claim → code → test → Blueprint Advisor →
// PR) and, only on an explicit owner approval, merge the resulting PR.
//
// Same optional/never-throws shape as amber/briefs.ts and amber/youtube-
// bridge.ts: an unset secret means this is simply unavailable, not an error.
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://hq.amberoneai.com";

function config(): { baseUrl: string; secret: string } | null {
  const baseUrl = (process.env.AMBER_DEV_BRIDGE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const secret = process.env.REELO_DEV_BRIDGE_SECRET ?? "";
  if (!secret) return null;
  return { baseUrl, secret };
}

export function amberDevBridgeConfigured(): boolean {
  return config() !== null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Amber's dev bridge is not configured (REELO_DEV_BRIDGE_SECRET unset).");

  const res = await fetch(`${cfg.baseUrl}/api/internal/reelo-dev-bridge`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bridge-secret": cfg.secret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Amber's dev bridge call failed (${res.status}).`);
  }
  return data as T;
}

export type StartDevTaskResult = { taskId: string; status: string };

export async function startDevTask(params: {
  title: string;
  description: string;
  acceptanceCriteria?: string;
}): Promise<StartDevTaskResult> {
  return call<StartDevTaskResult>({ action: "create_task", ...params });
}

export type DevTaskPrState = { url: string; number: number; state: string; merged: boolean } | null;

export type CheckDevTaskResult = {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  blockedReason: string | null;
  /** The real deploy outcome, once the background deploy started by
   *  approve_dev_task actually finishes (it does not block that call —
   *  a deploy takes minutes). Null until then. */
  deploymentNote: string | null;
  pr: DevTaskPrState;
  prLookupError?: string | null;
};

export async function checkDevTask(taskId: string): Promise<CheckDevTaskResult> {
  return call<CheckDevTaskResult>({ action: "check_task", taskId });
}

export type PendingApproval = { taskId: string; taskTitle: string; prUrl: string; prNumber: number };

export async function listPendingDevApprovals(): Promise<PendingApproval[]> {
  const result = await call<{ pending: PendingApproval[] }>({ action: "list_pending" });
  return result.pending;
}

export type ApproveDevTaskResult = {
  merged?: boolean;
  mergedSha?: string;
  repo?: string;
  /** Deploy runs in the background and is never finished by the time this
   *  call returns — { status: "in_progress" } is the only shape it takes
   *  here. Use check_dev_task's deploymentNote for the real, later outcome. */
  deploy?: { status: "in_progress" } | null;
  deployNote?: string;
  alreadyMerged?: boolean;
};

export async function approveDevTask(taskId: string): Promise<ApproveDevTaskResult> {
  return call<ApproveDevTaskResult>({ action: "approve", taskId });
}

export async function cancelDevTask(taskId: string): Promise<{ taskId: string; status: string }> {
  return call<{ taskId: string; status: string }>({ action: "cancel", taskId });
}
