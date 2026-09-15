import { describe, it, before, beforeEach, afterEach } from "node:test";
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
      ["amber_activity", "amber_ecosystem", "amber_revenue", "child_workforce_report", "overview", "owner_dashboard", "owner_escalations", "scout_execution_audit", "shared_fetch_report", "unique_funnel"],
      "only read-only reports — no control action",
    );
    for (const control of ["pause", "resume", "emergency_stop", "set_division_budget", "pause_division", "pause_agent"]) {
      assert.ok(!actions.includes(control), `must not call the control action ${control}`);
    }
  });

  it("never returns the bridge secret to the browser", () => {
    assert.ok(!src.includes("REELO_ORG_BRIDGE_SECRET"), "the route must not read or echo the secret");
  });
});


describe("Amber's reports, as the owner sees them", () => {
  let mod: typeof import("../amber/operations-telemetry.ts");
  before(async () => { mod = await import("../amber/operations-telemetry.ts"); });

  const ok = (data: unknown) => ({ ok: true as const, data });

  it("reads Amber's open asks, with what she tried and what she needs", () => {
    const { open, resolved } = mod.escalationsFrom(ok({
      open: [{
        id: "AMBER-015::freelancer", status: "OPEN", urgency: "CRITICAL",
        title: "Freelancer bids cannot be submitted",
        whatHappened: "Freelancer bids cannot be submitted",
        whatIsAffected: "Revenue — money cannot move until this is cleared.",
        whyAmberCannotFix: "Owner must authorize Freelancer OAuth from their own account.",
        whatWeNeedFromYou: ["Sign in to Freelancer and authorize Amber."],
        revenueBlocked: true, firstSeenAt: "2026-09-15T10:00:00.000Z", lastSeenAt: "2026-09-15T12:00:00.000Z",
        seenInAudits: 3,
        repairAttempts: [{ at: "2026-09-15T10:00:00.000Z", whatAmberDid: "retried the bid", result: "still 401", worked: false }],
        technical: { rule: "AMBER-015", evidence: "401 on 4 of 4" },
      }],
      resolved: [{ id: "x", status: "RESOLVED", title: "Tick had stalled", whatHappened: "Tick had stalled", resolvedBy: "Amber repaired it: restarted the tick", resolvedAt: "2026-09-15T11:00:00.000Z" }],
    }));

    assert.equal(open.length, 1);
    assert.equal(open[0].revenueBlocked, true);
    assert.equal(open[0].repairAttempts[0].worked, false);
    assert.deepEqual(open[0].whatWeNeedFromYou, ["Sign in to Freelancer and authorize Amber."]);
    assert.equal(resolved[0].status, "RESOLVED");
    assert.match(resolved[0].resolvedBy ?? "", /Amber repaired it/);
  });

  it("survives a malformed or partial escalation instead of blanking the page", () => {
    const { open } = mod.escalationsFrom(ok({ open: [{ title: "Half a record" }, null, 42, { nothing: true }] }));
    assert.equal(open.length, 1, "the one usable record renders; the junk is dropped");
    assert.equal(open[0].status, "OPEN");
    assert.equal(open[0].whatIsAffected, "Not stated.");
    assert.deepEqual(open[0].whatWeNeedFromYou, []);
  });

  it("returns nothing — not an error — when Amber could not be asked", () => {
    const dead = { ok: false as const, error: "bridge down" };
    assert.deepEqual(mod.escalationsFrom(dead), { open: [], resolved: [] });
    assert.deepEqual(mod.activityFrom(dead), []);
  });

  it("reads Amber's summarized activity", () => {
    const events = mod.activityFrom(ok({ events: [
      { id: "a", kind: "repair_completed", level: "good", headline: "Amber fixed something herself", detail: "restarted the tick", firstAt: "2026-09-15T10:00:00.000Z", lastAt: "2026-09-15T10:00:00.000Z", occurrences: 1 },
      { id: "b", kind: "source_failing", level: "bad", headline: "MoltJobs is not answering", detail: "nothing returned", firstAt: "2026-09-15T08:00:00.000Z", lastAt: "2026-09-15T12:00:00.000Z", occurrences: 24 },
    ] }));
    assert.equal(events.length, 2);
    assert.equal(events[1].occurrences, 24, "a recurring condition carries its count, not 24 rows");
  });

  it("counts managers from execution evidence, and says when it could not", async () => {
    const prev = process.env.REELO_ORG_BRIDGE_SECRET;
    process.env.REELO_ORG_BRIDGE_SECRET = "test-secret";
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      const action = JSON.parse(String(init?.body ?? "{}")).action as string;
      if (action === "amber_ecosystem") {
        return new Response(JSON.stringify({ ok: true, live: { managers: { total: 20, withWork: 18 },
          managerHealth: [{ worked: 3 }, { worked: 0 }, { worked: 7 }] } }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;
    try {
      const s = (await mod.fetchAmberOperations()).summary;
      assert.equal(s.managersRegistered, 20);
      assert.equal(s.managersOperating, 2, "two managers have a real run record — not the 18 with work assigned");
      assert.equal(s.managersBasis, "execution evidence");
    } finally {
      globalThis.fetch = realFetch;
      if (prev === undefined) delete process.env.REELO_ORG_BRIDGE_SECRET;
      else process.env.REELO_ORG_BRIDGE_SECRET = prev;
    }
  });
});

describe("the dashboard puts problems where the owner cannot miss them", () => {
  const src = fs.readFileSync("src/components/admin/AmberOperationsDashboard.tsx", "utf8");

  it("renders Needs your attention ABOVE the summary", () => {
    const attention = src.indexOf("<NeedsOwnerAttention");
    const rightNow = src.indexOf('Right now</h2>');
    assert.ok(attention !== -1 && rightNow !== -1 && attention < rightNow, "attention comes first");
  });

  it("shows plain English, with technical detail behind a disclosure", () => {
    assert.match(src, /Amber can&apos;t fix it because:/);
    assert.match(src, /What Amber needs you to do/);
    assert.match(src, /Amber already tried:/);
    assert.match(src, /technical detail/);
  });

  it("says CONNECTION LOST rather than showing an empty, reassuring page", () => {
    assert.match(src, /CONNECTION LOST/);
    assert.match(src, /not the same as/);
  });
});


describe("the live connector diagnoses which link is broken", () => {
  let mod: typeof import("../amber/operations-telemetry.ts");
  const prevSecret = process.env.REELO_ORG_BRIDGE_SECRET;
  let restore: (() => void) | null = null;

  before(async () => { mod = await import("../amber/operations-telemetry.ts"); });
  afterEach(() => {
    restore?.(); restore = null;
    if (prevSecret === undefined) delete process.env.REELO_ORG_BRIDGE_SECRET;
    else process.env.REELO_ORG_BRIDGE_SECRET = prevSecret;
  });

  /** Replace fetch with a canned bridge response. Returns a restore fn. */
  function bridge(respond: () => Response) {
    const real = globalThis.fetch;
    globalThis.fetch = (async () => respond()) as typeof fetch;
    return () => { globalThis.fetch = real; };
  }

  it("names Relo as the broken link when the secret is missing there", async () => {
    delete process.env.REELO_ORG_BRIDGE_SECRET;
    const c = (await mod.fetchAmberOperations()).connection;
    assert.equal(c.live, false);
    assert.equal(c.reloSecretPresent, false);
    assert.match(c.brokenLink ?? "", /Relo's server does not have REELO_ORG_BRIDGE_SECRET/);
    assert.match(c.fixHint ?? "", /same value Amber HQ holds/);
  });

  it("distinguishes a REJECTED credential from a missing one", async () => {
    // Both hosts up, both holding secrets — different ones. This needs a
    // different fix from "unset", and used to render identically.
    process.env.REELO_ORG_BRIDGE_SECRET = "relo-value";
    restore = bridge(() => new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 }));

    const c = (await mod.fetchAmberOperations()).connection;
    assert.equal(c.reloSecretPresent, true, "Relo has a secret");
    assert.equal(c.hqReachable, true, "HQ answered — it is up");
    assert.equal(c.hqAuthAccepted, false, "but it rejected the credential");
    assert.match(c.brokenLink ?? "", /different secrets/);
  });

  it("reports HQ unreachable when nothing answers at all", async () => {
    process.env.REELO_ORG_BRIDGE_SECRET = "relo-value";
    const real = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("fetch failed"); }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };

    const c = (await mod.fetchAmberOperations()).connection;
    assert.equal(c.hqReachable, false);
    assert.match(c.brokenLink ?? "", /could not reach Amber HQ/);
  });

  it("reports LIVE with no broken link once HQ answers", async () => {
    process.env.REELO_ORG_BRIDGE_SECRET = "relo-value";
    restore = bridge(() => new Response(JSON.stringify({ ok: true, dashboard: { scouts: { registered: 5120, executed: 12 } } }), { status: 200 }));

    const ops = await mod.fetchAmberOperations();
    assert.equal(ops.connection.live, true);
    assert.equal(ops.connection.hqAuthAccepted, true);
    assert.equal(ops.connection.brokenLink, null);
    assert.equal(ops.summary.scoutsWorking, 12, "and real numbers arrive");
  });

  it("caps how many calls are in flight, for the Workers 6-connection limit", async () => {
    process.env.REELO_ORG_BRIDGE_SECRET = "relo-value";
    let inFlight = 0;
    let peak = 0;
    const real = globalThis.fetch;
    globalThis.fetch = (async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };

    await mod.fetchAmberOperations();
    assert.ok(peak <= 6, `peak concurrency ${peak} must stay under the Workers cap of 6`);
    assert.ok(peak > 1, "but still parallel — ten serial calls would be far too slow");
  });
});


describe("HQ's own health is provable without any credential", () => {
  let mod: typeof import("../amber/operations-telemetry.ts");
  const prevSecret = process.env.REELO_ORG_BRIDGE_SECRET;
  let restore: (() => void) | null = null;

  before(async () => { mod = await import("../amber/operations-telemetry.ts"); });
  afterEach(() => {
    restore?.(); restore = null;
    if (prevSecret === undefined) delete process.env.REELO_ORG_BRIDGE_SECRET;
    else process.env.REELO_ORG_BRIDGE_SECRET = prevSecret;
  });

  it("reports HQ up and its commit even while the bridge is dark", async () => {
    // The case that matters most: no secret anywhere, and the owner still
    // needs to know whether Amber HQ is even running before touching anything.
    delete process.env.REELO_ORG_BRIDGE_SECRET;
    const real = globalThis.fetch;
    let sentAuthHeader = false;
    globalThis.fetch = (async (u: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers ?? {});
      if (headers.has("x-bridge-secret")) sentAuthHeader = true;
      assert.match(String(u), /\/api\/health\/public$/, "only the public endpoint is called");
      return new Response(JSON.stringify({ ok: true, version: { commitShort: "7fe148e", commit: "7fe148eb49" } }), { status: 200 });
    }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };

    const ops = await mod.fetchAmberOperations();
    assert.equal(ops.connection.hqServiceUp, true, "HQ is provably alive");
    assert.equal(ops.connection.hqServiceCommit, "7fe148e");
    assert.equal(ops.connection.reloSecretPresent, false, "and the missing secret is still named");
    assert.equal(sentAuthHeader, false, "no credential was used for this probe");
  });

  it("separates 'HQ is down' from 'HQ is up but the bridge failed'", async () => {
    process.env.REELO_ORG_BRIDGE_SECRET = "relo-value";
    const real = globalThis.fetch;
    globalThis.fetch = (async (u: string | URL | Request) => {
      // Health answers; the bridge does not.
      if (/\/api\/health\/public$/.test(String(u))) {
        return new Response(JSON.stringify({ ok: true, version: { commitShort: "abc1234" } }), { status: 200 });
      }
      throw new Error("fetch failed");
    }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };

    const c = (await mod.fetchAmberOperations()).connection;
    assert.equal(c.hqServiceUp, true);
    assert.match(c.brokenLink ?? "", /Amber HQ is up, but its bridge endpoint/);
    assert.match(c.fixHint ?? "", /the bridge route itself is failing/);
  });

  it("reports HQ unknown when even the public endpoint cannot be reached", async () => {
    delete process.env.REELO_ORG_BRIDGE_SECRET;
    const real = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("fetch failed"); }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };

    const c = (await mod.fetchAmberOperations()).connection;
    assert.equal(c.hqServiceUp, null, "unknown, not false — we could not ask");
  });
});
