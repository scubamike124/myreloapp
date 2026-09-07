/**
 * SporeAgent submission capability.
 *
 * The dashboard line "New Spore bids stay off until submit exists" is a report
 * about sporeagent.com, not a bug in this repo: their hosted API has no route
 * that accepts a deliverable. These tests pin the three things that has to
 * mean, all of them exercised against injected responses copied verbatim from
 * live probes of sporeagent.com, so the suite never touches the marketplace:
 *
 *   1. Route discovery can tell "Spore never shipped this path" (their exact
 *      catch-all body) apart from "the path exists and refused this request".
 *      Everything else is built on that one distinction.
 *   2. Bidding turns on only when a submit route is live AND a bid has been
 *      seen reaching Spore. Either one alone is not enough: a bid here cannot
 *      be withdrawn, so bidding without a submit route commits Amber to work
 *      she has no way to hand in.
 *   3. Amber flips herself on with no code change the moment Spore ships
 *      submit under any of the plausible names — the previous single
 *      hard-coded `/deliver` probe would have left her dark forever.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifySporeBidResponse,
  classifySporeRouteResponse,
  proveSporeBidReaches,
  resolveSporeSubmitRoute,
  sporeSubmitPayload,
  submitSporeWork,
  SPORE_CATCHALL_404_BODY,
  SPORE_SUBMIT_ROUTES,
} from "../amber-earnings/spore-submit.ts";
import { assessSporeCapability } from "../amber-earnings/execution-capability.ts";

const API = "https://spore.test/api";

/** Minimal Response stand-in — the module only reads `.status`, `.ok`, `.text()`. */
function reply(status: number, body: string): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
  } as unknown as Response;
}

type Handler = (url: string, init?: RequestInit) => Response;

function fetcher(handler: Handler) {
  const calls: Array<{ url: string; method: string; body: string }> = [];
  const impl = async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method || "GET", body: String(init?.body || "") });
    return handler(url, init);
  };
  return { impl, calls };
}

const DASHBOARD_TASK = {
  title: "Create interactive sales dashboard from CSV data",
  description: "Build interactive dashboard with charts from CSV.",
  requirements: ["data-viz", "charts", "html"],
};

describe("Spore route classification", () => {
  it("treats Spore's exact catch-all body as proof the route was never deployed", () => {
    const c = classifySporeRouteResponse(404, SPORE_CATCHALL_404_BODY);
    assert.equal(c.outcome, "route_absent");
  });

  it("treats a record-level 404 as proof the route DOES exist", () => {
    // A handler that looked the task up is a handler that got deployed.
    assert.equal(classifySporeRouteResponse(404, '{"error":"Task not found"}').outcome, "route_live");
    assert.equal(classifySporeRouteResponse(404, '{"error":"Agent not found"}').outcome, "route_live");
  });

  it("treats validation, auth and method refusals as a live route", () => {
    for (const status of [400, 401, 403, 405, 409, 422]) {
      assert.equal(
        classifySporeRouteResponse(status, '{"error":"agent_id is required"}').outcome,
        "route_live",
        `HTTP ${status} means a handler ran`,
      );
    }
  });

  it("never reports a route as absent because Spore had a server error", () => {
    // Calling 5xx "absent" would latch bidding off on a transient outage.
    assert.equal(classifySporeRouteResponse(500, "upstream boom").outcome, "inconclusive");
    assert.equal(classifySporeRouteResponse(502, "").outcome, "inconclusive");
  });
});

describe("submit route discovery", () => {
  it("reports submit unavailable when every candidate path is a catch-all 404 — today's real Spore", async () => {
    const f = fetcher(() => reply(404, SPORE_CATCHALL_404_BODY));
    const res = await resolveSporeSubmitRoute({ api: API, fetchImpl: f.impl });

    assert.equal(res.live, false);
    assert.equal(res.route, null);
    assert.equal(f.calls.length, SPORE_SUBMIT_ROUTES.length, "must actually try every candidate before giving up");
    assert.ok(res.probes.every((p) => p.outcome === "route_absent"));
    assert.match(res.detail, /no marketplace submit route/i);
  });

  it("probes only against a task id that cannot exist, so discovery writes nothing real", async () => {
    const f = fetcher(() => reply(404, SPORE_CATCHALL_404_BODY));
    await resolveSporeSubmitRoute({ api: API, fetchImpl: f.impl });

    for (const call of f.calls) {
      assert.ok(
        !/\/tasks\/(?!00000000-0000-0000-0000-000000000000)[0-9a-f]{8}-/i.test(call.url),
        `discovery must not POST at a real task id: ${call.url}`,
      );
    }
  });

  it("finds submit under a name other than /deliver — the case the old single-path probe could never see", async () => {
    const f = fetcher((url) =>
      url.includes("/submit")
        ? reply(404, '{"error":"Task not found"}')
        : reply(404, SPORE_CATCHALL_404_BODY),
    );
    const res = await resolveSporeSubmitRoute({ api: API, fetchImpl: f.impl });

    assert.equal(res.live, true);
    assert.equal(res.route, "/tasks/{taskId}/submit");
  });

  it("stops at the first live route instead of probing the rest", async () => {
    const f = fetcher(() => reply(400, '{"error":"result is required"}'));
    const res = await resolveSporeSubmitRoute({ api: API, fetchImpl: f.impl });

    assert.equal(res.live, true);
    assert.equal(res.route, SPORE_SUBMIT_ROUTES[0]);
    assert.equal(f.calls.length, 1);
  });

  it("does not claim submit is live when Spore is simply unreachable", async () => {
    const f = fetcher(() => {
      throw new Error("ECONNREFUSED");
    });
    const res = await resolveSporeSubmitRoute({ api: API, fetchImpl: f.impl });

    assert.equal(res.live, false);
    assert.match(res.detail, /could not reach/i);
  });
});

describe("submitting a deliverable", () => {
  it("refuses to submit at all while no route exists, and flags it as a platform gap", async () => {
    const f = fetcher(() => reply(404, SPORE_CATCHALL_404_BODY));
    const res = await submitSporeWork({
      taskId: "task-1",
      agentId: "amber-1",
      result: "# deliverable",
      api: API,
      fetchImpl: f.impl,
    });

    assert.equal(res.ok, false);
    assert.equal(res.verified, false);
    assert.equal(res.platformMissing, true, "queued work must be attributed to Spore, not to a failure of Amber's");
  });

  it("submits through the discovered route and confirms the delivery on the task", async () => {
    const f = fetcher((url, init) => {
      if (init?.method === "POST" && url.includes("/deliver")) {
        return reply(201, '{"delivery_id":"d-99"}');
      }
      return reply(200, '{"id":"task-1","status":"delivered","deliveries":[{"id":"d-99","agent_id":"amber-1"}]}');
    });
    const res = await submitSporeWork({
      taskId: "task-1",
      agentId: "amber-1",
      result: "# deliverable",
      api: API,
      fetchImpl: f.impl,
      knownRoute: "/tasks/{taskId}/deliver",
    });

    assert.equal(res.ok, true);
    assert.equal(res.verified, true, "a delivery readable back on the task is the only real proof");
    assert.equal(res.deliveryId, "d-99");
  });

  it("does not call an accepted POST 'verified' when the delivery is not readable back", async () => {
    // A 200 from an endpoint that dropped the body must not read as success.
    const f = fetcher((url, init) =>
      init?.method === "POST" && url.includes("/deliver")
        ? reply(200, "{}")
        : reply(200, '{"id":"task-1","status":"open","deliveries":[]}'),
    );
    const res = await submitSporeWork({
      taskId: "task-1",
      agentId: "amber-1",
      result: "# deliverable",
      api: API,
      fetchImpl: f.impl,
      knownRoute: "/tasks/{taskId}/deliver",
    });

    assert.equal(res.ok, true);
    assert.equal(res.verified, false);
    assert.match(res.detail, /not readable back/i);
  });

  it("only counts a delivery belonging to Amber, not another agent's", async () => {
    const f = fetcher((url, init) =>
      init?.method === "POST"
        ? reply(201, '{"delivery_id":"d-1"}')
        : reply(200, '{"id":"task-1","status":"open","deliveries":[{"id":"d-1","agent_id":"someone-else"}]}'),
    );
    const res = await submitSporeWork({
      taskId: "task-1",
      agentId: "amber-1",
      result: "x",
      api: API,
      fetchImpl: f.impl,
      knownRoute: "/tasks/{taskId}/deliver",
    });

    assert.equal(res.verified, false);
  });

  it("sends the deliverable under every field name Spore might read", () => {
    const body = sporeSubmitPayload({ taskId: "t", agentId: "a", result: "PAYLOAD" });
    for (const key of ["result", "content", "deliverable", "submission"]) {
      assert.equal(body[key], "PAYLOAD", `${key} must carry the deliverable`);
    }
    assert.equal(body.task_id, "t");
    assert.equal(body.agent_id, "a");
  });
});

describe("proving a bid reaches SporeAgent", () => {
  it("accepts Spore's own 'Task not found' as proof the bid handler ran", async () => {
    // Verbatim from a live probe: the bid route answers this, the catch-all does not.
    const f = fetcher(() => reply(404, '{"error":"Task not found"}'));
    const proof = await proveSporeBidReaches({ agentId: "amber-1", api: API, fetchImpl: f.impl });

    assert.equal(proof.proven, true);
    assert.equal(proof.mode, "reachability");
  });

  it("leaves no bid behind when proving reachability", async () => {
    const f = fetcher(() => reply(404, '{"error":"Task not found"}'));
    await proveSporeBidReaches({ agentId: "amber-1", api: API, fetchImpl: f.impl });

    assert.equal(f.calls.length, 1);
    assert.ok(
      f.calls[0].url.includes("/tasks/00000000-0000-0000-0000-000000000000/bid"),
      "the reachability proof must bid at a task that cannot exist — Spore has no withdraw-bid route",
    );
  });

  it("rejects the catch-all 404 as proof of anything", async () => {
    const f = fetcher(() => reply(404, SPORE_CATCHALL_404_BODY));
    const proof = await proveSporeBidReaches({ agentId: "amber-1", api: API, fetchImpl: f.impl });

    assert.equal(proof.proven, false);
  });

  it("reports unproven, not proven, when the network fails", async () => {
    const f = fetcher(() => {
      throw new Error("ETIMEDOUT");
    });
    const proof = await proveSporeBidReaches({ agentId: "amber-1", api: API, fetchImpl: f.impl });

    assert.equal(proof.proven, false);
  });

  it("only counts a committed bid when Spore returns a bid id", async () => {
    const ok = fetcher(() => reply(201, '{"bid_id":"b-7","status":"submitted"}'));
    const proven = await proveSporeBidReaches({
      agentId: "amber-1",
      taskId: "real-task",
      mode: "committed",
      api: API,
      fetchImpl: ok.impl,
    });
    assert.equal(proven.proven, true);
    assert.equal(proven.bidId, "b-7");

    // A 200 with no bid id is not a recorded bid.
    const vague = fetcher(() => reply(200, "{}"));
    const notProven = await proveSporeBidReaches({
      agentId: "amber-1",
      taskId: "real-task",
      mode: "committed",
      api: API,
      fetchImpl: vague.impl,
    });
    assert.equal(notProven.proven, false);
  });

  it("classifies a 201 with a bid id as having reached Spore", () => {
    assert.equal(classifySporeBidResponse(201, '{"bid_id":"b-1"}').reached, true);
  });
});

describe("the bidding gate", () => {
  const base = { hasAgentId: true, boardOk: true, ...DASHBOARD_TASK };

  it("keeps bidding off in today's real state: work is performable, submit does not exist", () => {
    const check = assessSporeCapability({ ...base, submitLive: false, bidProven: true });

    assert.equal(check.canPerformAllWork, true, "the skill fit is genuinely there");
    assert.equal(check.canAcceptOrApply, false, "but bidding must stay off");
    assert.equal(check.canSubmit, false);
    assert.equal(check.readyToWork, false);
    assert.match(check.primaryBlocker, /deliver/i);
  });

  it("still refuses to bid when submit exists but no bid has been seen reaching Spore", () => {
    const check = assessSporeCapability({ ...base, submitLive: true, bidProven: false });

    assert.equal(check.canAcceptOrApply, false);
    assert.equal(check.readyToWork, false);
    assert.ok(
      check.pipelineBlockers.some((b) => /bid path unproven/i.test(b)),
      "the reason must name the unproven bid path",
    );
  });

  it("turns bidding on only when submit is live AND the bid path is proven", () => {
    const check = assessSporeCapability({ ...base, submitLive: true, bidProven: true });

    assert.equal(check.canAcceptOrApply, true);
    assert.equal(check.canSubmit, true);
    assert.equal(check.readyToWork, true);
    assert.deepEqual(check.pipelineBlockers, []);
  });

  it("treats an omitted proof as unproven rather than assuming the best", () => {
    const check = assessSporeCapability({ ...base, submitLive: true });
    assert.equal(check.canAcceptOrApply, false);
  });

  it("never bids on work Amber cannot do, even with both gates green", () => {
    const check = assessSporeCapability({
      hasAgentId: true,
      boardOk: true,
      title: "Security audit of Solidity ERC-20 token contract",
      description: "Full security audit. Check for reentrancy, overflow, access control.",
      requirements: ["security", "solidity", "blockchain"],
      submitLive: true,
      bidProven: true,
    });

    assert.equal(check.canPerformAllWork, false);
    assert.equal(check.canAcceptOrApply, false);
  });
});
