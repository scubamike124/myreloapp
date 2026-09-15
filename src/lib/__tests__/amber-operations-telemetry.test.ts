import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * The Amber Operations dashboard is the owner's single source of truth, so
 * the two ways a status page lies are what these tests exist to prevent:
 *
 *   1. Reporting REGISTERED agents as working.
 *   2. Printing 0 for a number production was never asked for.
 *
 * Both produce a confident screen that is wrong, and the second is worse:
 * "nothing ran" and "we could not ask" call for opposite responses.
 */

const BRIDGE = "https://hq.amberoneai.com/api/internal/reelo-organization-bridge";

type Handler = (action: string) => { status?: number; body: unknown };

/** Stand in for Amber HQ so the rules are tested, not the network. */
function withBridge(handler: Handler) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), BRIDGE, "telemetry must only ever call the bridge");
    const action = JSON.parse(String(init?.body ?? "{}")).action as string;
    const { status = 200, body } = handler(action);
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return () => { globalThis.fetch = realFetch; };
}

async function load() {
  return import("../amber/operations-telemetry.ts");
}

describe("Amber operations telemetry", () => {
  const prevSecret = process.env.REELO_ORG_BRIDGE_SECRET;
  let restore: (() => void) | null = null;

  beforeEach(() => { process.env.REELO_ORG_BRIDGE_SECRET = "test-secret"; });
  afterEach(() => {
    if (prevSecret === undefined) delete process.env.REELO_ORG_BRIDGE_SECRET;
    else process.env.REELO_ORG_BRIDGE_SECRET = prevSecret;
    restore?.();
    restore = null;
  });

  it("reports NOT MEASURED, never zero, when the bridge is not configured", async () => {
    delete process.env.REELO_ORG_BRIDGE_SECRET;
    const { fetchAmberOperations } = await load();
    const ops = await fetchAmberOperations();

    assert.equal(ops.configured, false);
    const s = ops.summary;
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === "string") continue;
      assert.equal(v, null, `${k} must be null (NOT MEASURED), never 0`);
    }
    assert.equal(s.amberStatus, "UNKNOWN");
    assert.equal(s.pipeline, "UNKNOWN");
    assert.match(ops.sections.ownerDashboard.ok ? "" : ops.sections.ownerDashboard.error, /REELO_ORG_BRIDGE_SECRET/);
  });

  it("counts a scout as working only from its execution record, never from the registry", async () => {
    restore = withBridge((action) => {
      if (action === "owner_dashboard") {
        return { body: { ok: true, hqBuild: { commit: "abc123def", commitShort: "abc123d" },
          dashboard: { scouts: { registered: 5120, executed: 4, idle: 0, blocked: 0, failed: 0, scheduled: 5116 } } } };
      }
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const s = (await fetchAmberOperations()).summary;

    assert.equal(s.scoutsRegistered, 5120);
    assert.equal(s.scoutsWorking, 4, "working is the executed count, not the roster");
    assert.notEqual(s.scoutsWorking, s.scoutsRegistered);
  });

  it("counts external checks as real upstream requests, excluding reuses", async () => {
    restore = withBridge((action) => {
      if (action === "shared_fetch_report") {
        return { body: { ok: true, report: { totals: { fetches: 11, reuses: 39, costUsd: 0.007 }, requestsAvoided: 39, byEndpoint: [] },
          records: [
            { url: "https://api.sam.gov/opportunities/v2/search" },
            { url: "https://www.find-tender.service.gov.uk/api/1.0/x" },
            { url: "https://api.sam.gov/opportunities/v2/other" },
            { url: "(legacy connector: government-bundle)" },
          ] } };
      }
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const s = (await fetchAmberOperations()).summary;

    assert.equal(s.externalChecksToday, 11, "fetches only — a reuse is a request never made");
    assert.equal(s.duplicateFetchesPrevented, 39);
    assert.equal(s.uniqueSourcesToday, 3, "two sam.gov keys are ONE source; the legacy row is its own");
    assert.equal(s.pipeline, "WORKING");
  });

  it("calls the pipeline NOT WORKING when no real external request was made", async () => {
    restore = withBridge((action) => {
      if (action === "shared_fetch_report") {
        // The sandbox case: workers busy with internal audits, zero upstream.
        return { body: { ok: true, report: { totals: { fetches: 0, reuses: 0, costUsd: 0 }, byEndpoint: [] }, records: [] } };
      }
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const s = (await fetchAmberOperations()).summary;

    assert.equal(s.pipeline, "NOT WORKING");
    assert.match(s.pipelineReason, /internal only/);
  });

  it("keeps a failed report as a failure instead of turning it into zero", async () => {
    restore = withBridge((action) => {
      if (action === "child_workforce_report") return { status: 500, body: { ok: false, error: "boom" } };
      if (action === "owner_dashboard") {
        return { body: { ok: true, dashboard: { scouts: { registered: 5120, executed: 7 } } } };
      }
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const ops = await fetchAmberOperations();

    assert.equal(ops.sections.workforce.ok, false, "the failure is preserved");
    assert.ok(ops.unavailable.includes("workforce"), "and named, so the gap is never silent");
    assert.equal(ops.summary.workersWorking, null, "worker figures read NOT MEASURED");
    assert.equal(ops.summary.scoutsWorking, 7, "the reports that DID answer still report");
  });

  it("reports STOPPED when production has not ticked, and says how long", async () => {
    const stale = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    restore = withBridge((action) => {
      if (action === "owner_dashboard") return { body: { ok: true, dashboard: { lastTickAt: stale, scouts: {} } } };
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const s = (await fetchAmberOperations()).summary;

    assert.equal(s.amberStatus, "STOPPED");
    assert.match(s.amberStatusReason, /not ticking/);
  });

  it("reports RUNNING on a recent tick", async () => {
    const fresh = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    restore = withBridge((action) => {
      if (action === "owner_dashboard") return { body: { ok: true, dashboard: { lastTickAt: fresh, scouts: {} } } };
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    assert.equal((await fetchAmberOperations()).summary.amberStatus, "RUNNING");
  });

  it("surfaces the deployed commit so the screen is attributable to a build", async () => {
    restore = withBridge((action) => {
      if (action === "owner_dashboard") {
        return { body: { ok: true, hqBuild: { commit: "7fe148eb490d2555192985605bccd0187d2cecee", commitShort: "7fe148e", startedAt: "2026-09-15T13:30:00.000Z" }, dashboard: {} } };
      }
      return { body: { ok: true } };
    });
    const { fetchAmberOperations } = await load();
    const ops = await fetchAmberOperations();
    assert.equal(ops.hqCommitShort, "7fe148e");
    assert.equal(ops.hqCommit, "7fe148eb490d2555192985605bccd0187d2cecee");
  });
});

describe("the operations route is guarded and read-only", () => {
  const src = fs.readFileSync("src/app/api/admin/amber-operations/route.ts", "utf8");

  it("verifies the admin session before reaching Amber HQ", () => {
    assert.match(src, /verifySessionToken/);
    assert.match(src, /ADMIN_COOKIE/);
    const guard = src.indexOf("const denied = await requireAdmin()");
    const call = src.indexOf("fetchAmberOperations()");
    assert.ok(guard !== -1 && call !== -1 && guard < call, "auth must precede any bridge request");
  });

  it("is GET-only, so there is no write verb to reach a control action through", () => {
    assert.ok(!/export async function (POST|PATCH|PUT|DELETE)/.test(src), "GET only");
    assert.match(src, /export async function GET/);
  });

  it("the telemetry client calls only reporting actions, never a control action", () => {
    // Asserted on the client rather than the route, because the route calls no
    // bridge action directly -- the client is where an action string could be
    // added, and where a control action would actually take effect. Matched on
    // the action-literal form so prose in a comment cannot pass or fail it.
    const client = fs.readFileSync("src/lib/amber/operations-telemetry.ts", "utf8");
    const actions = [...client.matchAll(/action:\s*"([a-z_]+)"/g)].map((m) => m[1]);
    assert.deepEqual(
      [...actions].sort(),
      ["amber_revenue", "child_workforce_report", "overview", "owner_dashboard", "scout_execution_audit", "shared_fetch_report", "unique_funnel"],
      "only the seven read-only reports",
    );
    for (const control of ["pause", "resume", "emergency_stop", "set_division_budget", "pause_division", "pause_agent"]) {
      assert.ok(!actions.includes(control), `must not call the control action ${control}`);
    }
  });

  it("never returns the bridge secret to the browser", () => {
    assert.ok(!src.includes("REELO_ORG_BRIDGE_SECRET"), "the route must not read or echo the secret");
  });
});
