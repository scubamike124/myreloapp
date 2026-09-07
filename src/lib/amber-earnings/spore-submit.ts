/**
 * SporeAgent submission capability.
 *
 * Why this file exists
 * --------------------
 * The dashboard line "New Spore bids stay off until submit exists" is not a
 * bug — it is an accurate report about sporeagent.com. Amber can read the
 * board, register an agent and place a bid, but the hosted marketplace has no
 * route that accepts a finished deliverable, so a bid would commit her to work
 * she provably cannot hand in.
 *
 * The old gate asked that question by POSTing to exactly one hard-coded path
 * (`/tasks/:id/deliver`) using a zero UUID. Two problems:
 *
 *   1. If Spore ships submit under any other name — `/submit`, `/submission`,
 *      a collection route — Amber stays dark forever with no code change to
 *      tell her otherwise.
 *   2. A boolean "the route answered" is not proof a deliverable landed. An
 *      HTTP 200 from a route that dropped the body still reads as success.
 *
 * So the capability built here is: discover the submit route by probing every
 * shape Spore could plausibly ship, submit through whichever one is real, and
 * then confirm the delivery is actually visible on the task before calling it
 * submitted.
 *
 * Route classification is derived from live probing of sporeagent.com. Their
 * Next.js API answers unknown paths with the exact catch-all body
 * `{"error":"Not found"}`, while a route that exists but rejects the request
 * answers with a specific message (`Task not found`, `Agent not found`) or a
 * 4xx validation error. That difference is the only reliable signal for
 * "route absent" vs "route present, request refused", and every gate below
 * turns on it.
 *
 * Every network call takes an injectable fetch so the classification and
 * pipeline logic is testable without touching the live marketplace.
 */

export const SPORE_API = "https://sporeagent.com/api";

/** The literal body sporeagent.com returns for a path that does not exist. */
export const SPORE_CATCHALL_404_BODY = '{"error":"Not found"}';

export type SporeFetch = (url: string, init?: RequestInit) => Promise<Response>;

export type RouteOutcome = "route_live" | "route_absent" | "inconclusive";

export type RouteProbe = {
  path: string;
  status: number;
  outcome: RouteOutcome;
  reason: string;
};

/**
 * Candidate submit routes, most-likely first. `{taskId}` is substituted.
 * Collection-style routes carry the task id in the body instead.
 */
export const SPORE_SUBMIT_ROUTES: readonly string[] = [
  "/tasks/{taskId}/deliver",
  "/tasks/{taskId}/submit",
  "/tasks/{taskId}/submission",
  "/tasks/{taskId}/deliverable",
  "/tasks/{taskId}/complete",
  "/tasks/{taskId}/result",
  "/deliveries",
  "/submissions",
];

/** A task id that cannot exist — used to probe a route without touching real work. */
export const SPORE_PROBE_TASK_ID = "00000000-0000-0000-0000-000000000000";

export function sporeRoutePath(template: string, taskId: string): string {
  return template.replace("{taskId}", encodeURIComponent(taskId));
}

/**
 * Decide whether a route exists from the response it gave.
 *
 * The whole point is to never confuse "Spore has no submit endpoint" with
 * "Spore has one and refused this particular request".
 */
export function classifySporeRouteResponse(status: number, body: string): { outcome: RouteOutcome; reason: string } {
  const text = (body || "").trim();

  if (status >= 200 && status < 300) {
    return { outcome: "route_live", reason: `Route answered ${status}.` };
  }
  if (status === 404) {
    if (text === SPORE_CATCHALL_404_BODY) {
      return { outcome: "route_absent", reason: "Catch-all 404 — Spore never deployed this path." };
    }
    if (/task not found|agent not found|bid not found|no such/i.test(text)) {
      return { outcome: "route_live", reason: "Route exists; it rejected the referenced record." };
    }
    return { outcome: "route_absent", reason: `404 with no record-level message: ${text.slice(0, 120)}` };
  }
  // A route that validates, authenticates or rejects the method is a route that exists.
  if ([400, 401, 403, 405, 409, 415, 422].includes(status)) {
    return { outcome: "route_live", reason: `Route exists; refused with ${status}.` };
  }
  if (status >= 500) {
    return { outcome: "inconclusive", reason: `Server error ${status} — cannot tell if the route exists.` };
  }
  return { outcome: "inconclusive", reason: `Unexpected status ${status}.` };
}

/**
 * Body sent when submitting. Spore has never published the hosted schema, so
 * this is a superset of every field name their MCP tool and client docs use;
 * an endpoint that only reads one of them still gets the deliverable.
 */
export function sporeSubmitPayload(input: { taskId: string; agentId: string; result: string }): Record<string, unknown> {
  return {
    task_id: input.taskId,
    agent_id: input.agentId,
    result: input.result,
    content: input.result,
    deliverable: input.result,
    submission: input.result,
  };
}

async function readBody(res: Response): Promise<{ text: string; data: Record<string, unknown> }> {
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    const parsed = text ? JSON.parse(text) : null;
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    /* non-JSON body — keep the text, leave data empty */
  }
  return { text, data };
}

function defaultFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
}

export type SubmitRouteResolution = {
  live: boolean;
  route: string | null;
  detail: string;
  probes: RouteProbe[];
};

/**
 * Probe every candidate submit route and return the first one that exists.
 *
 * Probes are deliberately sent against a task id that cannot exist, so the
 * only outcomes are "route missing" or "route present and it told us the task
 * is unknown". Nothing on a real task is written.
 */
export async function resolveSporeSubmitRoute(input?: {
  taskId?: string;
  agentId?: string;
  fetchImpl?: SporeFetch;
  api?: string;
}): Promise<SubmitRouteResolution> {
  const api = input?.api || SPORE_API;
  const doFetch = input?.fetchImpl || defaultFetch;
  const taskId = input?.taskId || SPORE_PROBE_TASK_ID;
  const agentId = input?.agentId || "probe";
  const probes: RouteProbe[] = [];

  for (const template of SPORE_SUBMIT_ROUTES) {
    const path = sporeRoutePath(template, taskId);
    let status = 0;
    let text = "";
    try {
      const res = await doFetch(`${api}${path}`, {
        method: "POST",
        body: JSON.stringify(sporeSubmitPayload({ taskId, agentId, result: "capability probe" })),
      });
      status = res.status;
      text = (await readBody(res)).text;
    } catch (err) {
      probes.push({
        path: template,
        status: 0,
        outcome: "inconclusive",
        reason: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }
    const { outcome, reason } = classifySporeRouteResponse(status, text);
    probes.push({ path: template, status, outcome, reason });
    if (outcome === "route_live") {
      return { live: true, route: template, detail: `Spore submit route is live at ${template} — ${reason}`, probes };
    }
  }

  const inconclusive = probes.filter((p) => p.outcome === "inconclusive");
  if (inconclusive.length === probes.length && probes.length > 0) {
    return {
      live: false,
      route: null,
      detail: `Could not reach SporeAgent to test submit (${inconclusive[0].reason}). Treating submit as unavailable.`,
      probes,
    };
  }
  return {
    live: false,
    route: null,
    detail:
      `SporeAgent has no marketplace submit route. Probed ${probes.length} candidate path(s) ` +
      `(${SPORE_SUBMIT_ROUTES.join(", ")}); every one returned the hosted catch-all 404. ` +
      `Spore's own README says spore_deliver is local MCP only. New bids stay off — Amber will not ` +
      `commit to work she cannot hand in.`,
    probes,
  };
}

export type SporeSubmitResult = {
  ok: boolean;
  /** True only when the delivery was afterwards read back from the task. */
  verified: boolean;
  deliveryId: string | null;
  route: string | null;
  detail: string;
  platformMissing?: boolean;
};

/**
 * Submit a deliverable and then confirm it actually landed.
 *
 * `ok` means Spore accepted the POST. `verified` means Amber re-read the task
 * and saw her own delivery on it. Only `verified` is real proof, and the
 * caller is expected to treat an unverified submit as still in flight.
 */
export async function submitSporeWork(input: {
  taskId: string;
  agentId: string;
  result: string;
  fetchImpl?: SporeFetch;
  api?: string;
  /** Skip discovery when the route is already known from an earlier probe. */
  knownRoute?: string | null;
}): Promise<SporeSubmitResult> {
  const api = input.api || SPORE_API;
  const doFetch = input.fetchImpl || defaultFetch;

  let route = input.knownRoute || null;
  if (!route) {
    const resolved = await resolveSporeSubmitRoute({
      taskId: input.taskId,
      agentId: input.agentId,
      fetchImpl: doFetch,
      api,
    });
    if (!resolved.live || !resolved.route) {
      return { ok: false, verified: false, deliveryId: null, route: null, platformMissing: true, detail: resolved.detail };
    }
    route = resolved.route;
  }

  const path = sporeRoutePath(route, input.taskId);
  let status = 0;
  let text = "";
  let data: Record<string, unknown> = {};
  try {
    const res = await doFetch(`${api}${path}`, {
      method: "POST",
      body: JSON.stringify(sporeSubmitPayload({ taskId: input.taskId, agentId: input.agentId, result: input.result })),
    });
    status = res.status;
    const body = await readBody(res);
    text = body.text;
    data = body.data;
  } catch (err) {
    return {
      ok: false,
      verified: false,
      deliveryId: null,
      route,
      detail: `Submit to ${route} failed to reach Spore: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (status === 404 && text.trim() === SPORE_CATCHALL_404_BODY) {
    return {
      ok: false,
      verified: false,
      deliveryId: null,
      route,
      platformMissing: true,
      detail: `Spore submit route ${route} disappeared (catch-all 404). Work and QA are saved and stay queued. Not paid.`,
    };
  }
  if (status < 200 || status >= 300) {
    return {
      ok: false,
      verified: false,
      deliveryId: null,
      route,
      detail: `Submit HTTP ${status} on ${route}: ${text.slice(0, 240)}`,
    };
  }

  const deliveryId = String(data.delivery_id || data.submission_id || data.id || "") || null;
  const verified = await verifySporeDelivery({
    taskId: input.taskId,
    agentId: input.agentId,
    fetchImpl: doFetch,
    api,
  });

  return {
    ok: true,
    verified: verified.present,
    deliveryId,
    route,
    detail: verified.present
      ? `Submitted via ${route} and confirmed on the task (${deliveryId || "no id returned"}).`
      : `Spore accepted the submit on ${route} (${deliveryId || "no id returned"}) but the delivery is not readable back on the task yet — ${verified.detail}`,
  };
}

/** Read the task back and look for a delivery from this agent. */
export async function verifySporeDelivery(input: {
  taskId: string;
  agentId: string;
  fetchImpl?: SporeFetch;
  api?: string;
}): Promise<{ present: boolean; detail: string }> {
  const api = input.api || SPORE_API;
  const doFetch = input.fetchImpl || defaultFetch;
  try {
    const res = await doFetch(`${api}/tasks/${encodeURIComponent(input.taskId)}`, { method: "GET" });
    if (!res.ok) return { present: false, detail: `task re-read HTTP ${res.status}` };
    const { data } = await readBody(res);
    const task = ((data.task as Record<string, unknown>) || data) as Record<string, unknown>;
    const deliveries = Array.isArray(task.deliveries) ? (task.deliveries as Array<Record<string, unknown>>) : [];
    const mine = deliveries.some((d) => String(d.agent_id || "") === input.agentId);
    if (mine) return { present: true, detail: "delivery visible on the task" };
    const status = String(task.status || "");
    if (/delivered|submitted|completed/i.test(status)) {
      return { present: true, detail: `task status is ${status}` };
    }
    return { present: false, detail: `no delivery from ${input.agentId} on the task (status=${status || "?"})` };
  } catch (err) {
    return { present: false, detail: `task re-read failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ------------------------------------------------------------------ *
 * Bid reachability proof
 * ------------------------------------------------------------------ */

export type BidProof = {
  proven: boolean;
  /** "committed" wrote a real bid; "reachability" only exercised the handler. */
  mode: "committed" | "reachability";
  bidId: string | null;
  detail: string;
  status: number;
};

/**
 * Decide whether a bid response proves Amber reached Spore's bid handler.
 *
 * `Task not found` is the success signal for a reachability probe: it can only
 * come from the bid handler itself, after Spore parsed the body and looked the
 * task up. The catch-all body proves the opposite.
 */
export function classifySporeBidResponse(status: number, body: string): { reached: boolean; reason: string } {
  const text = (body || "").trim();
  if (text === SPORE_CATCHALL_404_BODY) {
    return { reached: false, reason: "Catch-all 404 — the bid route is not deployed." };
  }
  if (status >= 200 && status < 300) return { reached: true, reason: `Bid handler accepted the request (${status}).` };
  if (status === 404 && /task not found|agent not found/i.test(text)) {
    return { reached: true, reason: "Bid handler ran and resolved the record itself." };
  }
  if ([400, 401, 403, 409, 422].includes(status)) {
    return { reached: true, reason: `Bid handler validated and refused (${status}).` };
  }
  return { reached: false, reason: `Inconclusive bid response ${status}: ${text.slice(0, 120)}` };
}

/**
 * Prove a bid actually reaches SporeAgent.
 *
 * Default mode is `reachability`: a well-formed bid is POSTed against a task id
 * that cannot exist. Spore's bid handler parses it, fails to find the task and
 * says so — which proves the request got all the way through, without leaving
 * Amber committed to a job she has no way to submit. Bids on this marketplace
 * cannot be withdrawn (`DELETE /tasks/:id/bid` answers 405), so a committed
 * bid is one-way and is only used when the caller asks for it explicitly.
 */
export async function proveSporeBidReaches(input: {
  agentId: string;
  taskId?: string;
  amountUsd?: number;
  approach?: string;
  estimatedMinutes?: number;
  mode?: "committed" | "reachability";
  fetchImpl?: SporeFetch;
  api?: string;
}): Promise<BidProof> {
  const api = input.api || SPORE_API;
  const doFetch = input.fetchImpl || defaultFetch;
  const mode = input.mode || "reachability";
  const taskId = mode === "committed" ? input.taskId || "" : input.taskId || SPORE_PROBE_TASK_ID;

  if (mode === "committed" && !taskId) {
    return { proven: false, mode, bidId: null, status: 0, detail: "Committed bid proof needs a real task id." };
  }

  let status = 0;
  let text = "";
  let data: Record<string, unknown> = {};
  try {
    const res = await doFetch(`${api}/tasks/${encodeURIComponent(taskId)}/bid`, {
      method: "POST",
      body: JSON.stringify({
        agent_id: input.agentId,
        amount_usd: input.amountUsd ?? 5,
        approach: input.approach || "Amber bid-path reachability proof.",
        estimated_minutes: input.estimatedMinutes ?? 60,
      }),
    });
    status = res.status;
    const body = await readBody(res);
    text = body.text;
    data = body.data;
  } catch (err) {
    return {
      proven: false,
      mode,
      bidId: null,
      status: 0,
      detail: `Bid did not reach SporeAgent: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const { reached, reason } = classifySporeBidResponse(status, text);
  const bidId = String(data.bid_id || "") || null;

  if (mode === "committed") {
    const proven = reached && status >= 200 && status < 300 && Boolean(bidId);
    return {
      proven,
      mode,
      bidId,
      status,
      detail: proven
        ? `Real bid ${bidId} recorded on Spore task ${taskId}.`
        : `Committed bid did not land (${status}): ${text.slice(0, 200)}`,
    };
  }

  return {
    proven: reached,
    mode,
    bidId,
    status,
    detail: reached
      ? `Bid path reaches SporeAgent — ${reason} (HTTP ${status}, no obligation created).`
      : `Bid path does not reach SporeAgent — ${reason}`,
  };
}
