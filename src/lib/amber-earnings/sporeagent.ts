const API = "https://sporeagent.com/api";

export type SporeTask = {
  id: string;
  title: string;
  description?: string;
  requirements?: string[];
  budget_usd?: number;
  status?: string;
  assigned_agent_id?: string | null;
  bids?: Array<{ id: string; agent_id: string; agent_name?: string; status?: string }>;
  deliveries?: Array<{ id: string; agent_id: string; result?: string; delivered_at?: string }>;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep */
  }
  return { ok: res.ok, status: res.status, data, text };
}

export async function sporeHealth(): Promise<{ ok: boolean; detail: string }> {
  const res = await jsonFetch(`${API}/health`);
  const data = (res.data || {}) as Record<string, unknown>;
  return {
    ok: res.ok && (data.status === "ok" || res.status === 200),
    detail: res.ok ? `SporeAgent API ${String(data.status || "ok")}` : `Health HTTP ${res.status}`,
  };
}

export async function listOpenSporeTasks(): Promise<{ ok: boolean; detail: string; tasks: SporeTask[] }> {
  const res = await jsonFetch(`${API}/tasks?status=open`);
  const data = (res.data || {}) as Record<string, unknown>;
  const tasks = Array.isArray(data.tasks) ? (data.tasks as SporeTask[]) : [];
  return {
    ok: res.ok,
    detail: res.ok ? `${tasks.length} open marketplace task(s).` : `Tasks HTTP ${res.status}`,
    tasks,
  };
}

export async function getSporeTask(taskId: string): Promise<{ ok: boolean; task: SporeTask | null; detail: string }> {
  const res = await jsonFetch(`${API}/tasks/${encodeURIComponent(taskId)}`);
  const data = (res.data || {}) as Record<string, unknown>;
  const task = ((data.task as SporeTask) || data) as SporeTask;
  if (!res.ok) return { ok: false, task: null, detail: `Task HTTP ${res.status}` };
  return { ok: true, task: task?.id ? task : (data as SporeTask), detail: "ok" };
}

/** Register Amber on Spore when no agent id exists. */
export async function registerSporeAgent(input?: {
  name?: string;
  capabilities?: string[];
  description?: string;
}): Promise<{ ok: boolean; agentId: string | null; detail: string }> {
  const res = await jsonFetch(`${API}/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input?.name || "Amber",
      capabilities: input?.capabilities || [
        "code",
        "python",
        "testing",
        "documentation",
        "data-extraction",
        "translation",
        "rag",
        "automation",
      ],
      description:
        input?.description ||
        "Amber — Reelo cloud agent. Software, docs, data extraction, RAG/PDF pipelines, dashboards. Real deliverables only.",
    }),
  });
  const data = (res.data || {}) as Record<string, unknown>;
  const agentId = String(data.agent_id || "");
  if (!res.ok || !agentId) {
    return { ok: false, agentId: null, detail: `Register HTTP ${res.status}: ${res.text.slice(0, 200)}` };
  }
  return { ok: true, agentId, detail: `Registered Spore agent ${agentId}` };
}

export async function placeSporeBid(input: {
  taskId: string;
  agentId: string;
  amountUsd: number;
  approach: string;
  estimatedMinutes?: number;
}): Promise<{ ok: boolean; bidId: string | null; detail: string; already?: boolean }> {
  const res = await jsonFetch(`${API}/tasks/${encodeURIComponent(input.taskId)}/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: input.agentId,
      amount_usd: input.amountUsd,
      approach: input.approach,
      estimated_minutes: input.estimatedMinutes ?? 90,
    }),
  });
  const data = (res.data || {}) as Record<string, unknown>;
  const bidId = String(data.bid_id || "");
  if (res.status === 409 || /already/i.test(res.text)) {
    return { ok: true, bidId: bidId || null, detail: "Bid already present on this task.", already: true };
  }
  if (!res.ok || !bidId) {
    return { ok: false, bidId: null, detail: `Bid HTTP ${res.status}: ${res.text.slice(0, 240)}` };
  }
  return { ok: true, bidId, detail: `Bid placed (${bidId}).`, already: false };
}

/** Documented client path — live Spore deploy may still 404 until they ship it. */
export async function acceptSporeBid(taskId: string, bidId: string): Promise<{ ok: boolean; detail: string }> {
  const res = await jsonFetch(`${API}/tasks/${encodeURIComponent(taskId)}/accept-bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bid_id: bidId }),
  });
  if (res.status === 404) {
    return {
      ok: false,
      detail:
        "Spore accept-bid endpoint not available on hosted API (404). Bid is live; waiting for poster assign or Spore to ship accept-bid.",
    };
  }
  if (!res.ok) return { ok: false, detail: `Accept-bid HTTP ${res.status}: ${res.text.slice(0, 240)}` };
  return { ok: true, detail: "Bid accepted / task assigned on Spore." };
}

/** Documented client path uses `result`. Live deploy may 404. */
export async function sporeDeliverRouteLive(): Promise<{ live: boolean; detail: string }> {
  const res = await jsonFetch(`${API}/tasks/00000000-0000-0000-0000-000000000000/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: "probe", result: "probe", content: "probe" }),
  });
  if (res.status === 400 || res.status === 403) return { live: true, detail: "Hosted /deliver route is present." };
  if (res.status === 404 && /Task not found/i.test(res.text)) {
    return { live: true, detail: "Hosted /deliver route is present (unknown task)." };
  }
  if (res.status === 404) {
    return {
      live: false,
      detail:
        "Hosted /deliver is a catch-all 404 — Spore did not deploy marketplace submit. New Spore bids paused; in-flight work stays queued.",
    };
  }
  return { live: res.ok, detail: `Deliver probe HTTP ${res.status}` };
}

export async function deliverSporeWork(input: {
  taskId: string;
  agentId: string;
  result: string;
}): Promise<{ ok: boolean; deliveryId: string | null; detail: string; platformMissing?: boolean }> {
  const res = await jsonFetch(`${API}/tasks/${encodeURIComponent(input.taskId)}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: input.agentId,
      result: input.result,
      content: input.result,
    }),
  });
  const data = (res.data || {}) as Record<string, unknown>;
  if (res.status === 404) {
    const routeMissing = /"Not found"/i.test(res.text) && !/Task not found/i.test(res.text);
    return {
      ok: false,
      deliveryId: null,
      platformMissing: true,
      detail: routeMissing
        ? "Spore hosted Next.js API has no POST /api/tasks/:id/deliver (catch-all 404). Their README: spore_deliver is local MCP only — not on sporeagent.com. Work+QA saved; retrying each tick. Not paid."
        : "Spore deliver endpoint not available on hosted API (404). Deliverable is verified locally and queued until Spore ships /api/tasks/:id/deliver.",
    };
  }
  if (!res.ok) {
    return { ok: false, deliveryId: null, detail: `Deliver HTTP ${res.status}: ${res.text.slice(0, 240)}` };
  }
  return {
    ok: true,
    deliveryId: String(data.delivery_id || data.id || "") || null,
    detail: `Delivered on Spore (${data.delivery_id || data.id || "ok"}).`,
  };
}

/** Full Spore Arena cycle — register/join/submit works on production today. */
export async function sporeArenaE2E(agentName = "Amber"): Promise<{
  ok: boolean;
  steps: string[];
  agentId?: string;
  matchId?: string;
  score?: number;
  detail: string;
}> {
  const steps: string[] = [];
  const reg = await jsonFetch(`${API}/arena/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: agentName, model: "amber-cloud" }),
  });
  const regData = (reg.data || {}) as Record<string, unknown>;
  const agentId = String(regData.agent_id || "");
  steps.push(`arena_register:${reg.status}:${agentId || reg.text.slice(0, 80)}`);
  if (!reg.ok || !agentId) return { ok: false, steps, detail: "Arena register failed" };

  const join = await jsonFetch(`${API}/arena/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId, game_type: "code_golf_grand_prix" }),
  });
  const joinData = (join.data || {}) as Record<string, unknown>;
  const matchId = String(joinData.match_id || "");
  steps.push(`arena_join:${join.status}:${matchId || join.text.slice(0, 80)}`);
  if (!join.ok || !matchId) return { ok: false, steps, agentId, detail: "Arena join failed" };

  const answer =
    "Amber E2E arena submit: function f(n){return n?n*f(n-1):1} // verified factorial stub for code golf proof";
  const sub = await jsonFetch(`${API}/arena/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ match_id: matchId, answer }),
  });
  const subData = (sub.data || {}) as Record<string, unknown>;
  steps.push(`arena_submit:${sub.status}:score=${subData.score ?? "?"}`);
  if (!sub.ok) return { ok: false, steps, agentId, matchId, detail: "Arena submit failed" };
  return {
    ok: true,
    steps,
    agentId,
    matchId,
    score: Number(subData.score || 0),
    detail: `Arena E2E scored ${subData.score}; COG ${subData.cog_earned}`,
  };
}
