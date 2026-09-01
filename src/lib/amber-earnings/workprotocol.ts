/**
 * WorkProtocol client — discover → claim → deliver → payment tracking.
 * Base: https://workprotocol.ai  Auth: Bearer wp_agent_…
 * Never invents escrow release; books revenue only on verified payout.
 */

export type WorkProtocolJob = {
  id: string;
  title: string;
  description: string;
  category: string;
  paymentUsd: number;
  paymentCurrency: string;
  status: string;
  acceptanceCriteria: unknown;
  deadline: string | null;
  requirements: Record<string, unknown> | null;
};

const BASE = "https://workprotocol.ai";

function authHeaders(apiKey: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function jsonFetch(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { ok: res.ok, status: res.status, data, text };
}

function mapJob(row: Record<string, unknown>): WorkProtocolJob | null {
  const id = String(row.id || "");
  if (!id) return null;
  return {
    id,
    title: String(row.title || "Untitled"),
    description: String(row.description || "").slice(0, 4000),
    category: String(row.category || "custom"),
    paymentUsd: Number(row.paymentAmount || row.payment_amount || 0),
    paymentCurrency: String(row.paymentCurrency || "USDC"),
    status: String(row.status || ""),
    acceptanceCriteria: row.acceptanceCriteria ?? null,
    deadline: row.deadline ? String(row.deadline) : null,
    requirements: (row.requirements as Record<string, unknown>) || null,
  };
}

export async function listOpenWorkProtocolJobs(): Promise<{
  ok: boolean;
  detail: string;
  jobs: WorkProtocolJob[];
}> {
  try {
    const res = await jsonFetch(`${BASE}/api/jobs?status=open&limit=50`);
    const body = res.data as { jobs?: unknown[] };
    const raw = Array.isArray(body.jobs) ? body.jobs : [];
    const jobs = raw
      .map((r) => mapJob(r as Record<string, unknown>))
      .filter((j): j is WorkProtocolJob => Boolean(j));
    return {
      ok: res.ok,
      detail: res.ok ? `Live board: ${jobs.length} open job(s).` : `WorkProtocol HTTP ${res.status}`,
      jobs,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "WorkProtocol fetch failed", jobs: [] };
  }
}

export async function registerWorkProtocolAgent(input?: {
  name?: string;
  description?: string;
  walletAddress?: string | null;
}): Promise<{ ok: boolean; agentId: string | null; apiKey: string | null; detail: string }> {
  const body: Record<string, unknown> = {
    name: input?.name || "Amber",
    description:
      input?.description ||
      "Amber — Reelo cloud agent. Software, docs, data extraction, research, dashboards. Real deliverables only. No watch-video or engagement farms.",
    capabilities: {
      categories: ["code", "content", "data", "research"],
      languages: ["typescript", "python", "javascript"],
      maxJobValue: 500,
    },
    pricing: { minimumJobValue: 5, acceptedCurrencies: ["USDC", "USD"] },
  };
  if (input?.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(input.walletAddress)) {
    body.walletAddress = input.walletAddress;
  }
  const res = await jsonFetch(`${BASE}/api/agents/register`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Live shape (201): { message, agent: { id, ... }, apiKey } — key is top-level, shown once.
  const root = res.data as {
    agent?: Record<string, unknown>;
    apiKey?: string;
    api_key?: string;
    error?: string;
    message?: string;
  };
  const agent = root.agent || {};
  const agentId = String(agent.id || "");
  const apiKey = String(root.apiKey || root.api_key || agent.apiKey || agent.api_key || "");
  if (!res.ok || !agentId || !apiKey) {
    return {
      ok: false,
      agentId: agentId || null,
      apiKey: null,
      detail: `Register HTTP ${res.status}: ${(root.error || root.message || res.text).slice(0, 200)}`,
    };
  }
  return { ok: true, agentId, apiKey, detail: `Registered WorkProtocol agent ${agentId}` };
}

export async function verifyWorkProtocolKey(
  apiKey: string,
  agentId: string | null,
): Promise<{ ok: boolean; detail: string; agentId: string | null }> {
  if (!apiKey) return { ok: false, detail: "WorkProtocol API key missing", agentId: null };
  if (!apiKey.startsWith("wp_")) {
    return { ok: false, detail: "WorkProtocol keys start with wp_agent_.", agentId };
  }
  if (agentId) {
    const res = await jsonFetch(`${BASE}/api/agents/${encodeURIComponent(agentId)}`);
    if (res.ok) {
      return { ok: true, detail: `WorkProtocol agent ${agentId} reachable.`, agentId };
    }
    return {
      ok: true,
      detail: `WorkProtocol key on file; agent probe HTTP ${res.status}.`,
      agentId,
    };
  }
  return { ok: true, detail: "WorkProtocol key on file (agent id missing).", agentId: null };
}

export async function claimWorkProtocolJob(
  apiKey: string,
  agentId: string,
  jobId: string,
): Promise<{ ok: boolean; claimId: string | null; detail: string }> {
  const res = await jsonFetch(`${BASE}/api/jobs/${encodeURIComponent(jobId)}/claim`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ agentId }),
  });
  const data = res.data as {
    claim?: { id?: string };
    id?: string;
    error?: string;
    message?: string;
  };
  const claimId = String(
    data.claim?.id ||
      (data as { data?: { claim?: { id?: string }; id?: string } }).data?.claim?.id ||
      (data as { data?: { id?: string } }).data?.id ||
      data.id ||
      "",
  );
  if (res.status === 409) {
    return { ok: false, claimId: null, detail: `Already claimed: ${(data.error || data.message || "").slice(0, 160)}` };
  }
  if (!res.ok || !claimId) {
    return {
      ok: false,
      claimId: null,
      detail: `Claim HTTP ${res.status}: ${(data.error || data.message || res.text).slice(0, 200)}`,
    };
  }
  return { ok: true, claimId, detail: `Claimed (${claimId}).` };
}

export async function deliverWorkProtocolJob(
  apiKey: string,
  jobId: string,
  claimId: string,
  deliverable: { type: string; url: string },
): Promise<{ ok: boolean; detail: string }> {
  const res = await jsonFetch(`${BASE}/api/jobs/${encodeURIComponent(jobId)}/deliver`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ claimId, deliverable }),
  });
  const data = res.data as { error?: string; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      detail: `Deliver HTTP ${res.status}: ${(data.error || data.message || res.text).slice(0, 220)}`,
    };
  }
  return { ok: true, detail: "Deliverable submitted to WorkProtocol." };
}

export async function getWorkProtocolJob(
  jobId: string,
): Promise<{ ok: boolean; job: WorkProtocolJob | null; status: string; detail: string }> {
  const res = await jsonFetch(`${BASE}/api/jobs/${encodeURIComponent(jobId)}`);
  const root = res.data as { job?: Record<string, unknown> } & Record<string, unknown>;
  const row = (root.job || root) as Record<string, unknown>;
  const job = mapJob(row);
  return {
    ok: res.ok && Boolean(job),
    job,
    status: String(row.status || job?.status || ""),
    detail: res.ok ? `status=${row.status || "?"}` : `Get job HTTP ${res.status}`,
  };
}

export async function getWorkProtocolEarnings(
  apiKey: string,
  agentId: string,
): Promise<{ ok: boolean; totalUsd: number; detail: string }> {
  const res = await jsonFetch(`${BASE}/api/agents/${encodeURIComponent(agentId)}/earnings`, {
    headers: authHeaders(apiKey),
  });
  const data = res.data as { totalEarned?: string | number; total?: string | number };
  const total = Number(data.totalEarned ?? data.total ?? 0);
  return {
    ok: res.ok,
    totalUsd: Number.isFinite(total) ? total : 0,
    detail: res.ok ? `Earnings total $${Number.isFinite(total) ? total : 0}` : `Earnings HTTP ${res.status}`,
  };
}

/** Hard rejects before claim. */
export function workProtocolJobReject(job: WorkProtocolJob): { category: string; reason: string } | null {
  if (job.paymentUsd < 5) {
    return { category: "poor_profitability", reason: `Payout $${job.paymentUsd} is below Amber's $5 minimum payout.` };
  }
  const blob = `${job.title} ${job.description}`.toLowerCase();
  if (/watch video|watch videos|click ads|install app|captcha farm|followers|#ad|engagement farm/.test(blob)) {
    return {
      category: "capability_mismatch",
      reason: "Watch-video / engagement / click-farm work is not allowed for Amber.",
    };
  }
  if (job.category === "design" && !/\b(html|css|svg|ui copy|wireframe text)\b/i.test(blob)) {
    return {
      category: "capability_mismatch",
      reason: "Visual/design-only jobs need human design tooling Amber does not claim.",
    };
  }
  if (job.deadline) {
    const t = Date.parse(job.deadline);
    if (Number.isFinite(t) && t < Date.now() + 60 * 60 * 1000) {
      return { category: "unacceptable_risk", reason: "Deadline is under 1 hour — Amber will not rush-claim." };
    }
  }
  return null;
}
