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

describe("Connect Amber — one press, no secrets in the owner's hands", () => {
  let mod: typeof import("../amber/connect-amber.ts");
  const prev = { ...process.env };
  let restore: (() => void) | null = null;

  before(async () => { mod = await import("../amber/connect-amber.ts"); });
  afterEach(() => {
    restore?.(); restore = null;
    for (const k of ["AMBER_HQ_CRON_SECRET", "CRON_SECRET", "AMBER_BUILDER_SECRET", "SOCIAL_TOKEN_SECRET"]) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function hq(respond: (init?: RequestInit) => Response) {
    const real = globalThis.fetch;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => respond(init)) as typeof fetch;
    return () => { globalThis.fetch = real; };
  }

  it("reports CONNECTED and never returns a secret", async () => {
    process.env.CRON_SECRET = "hq-cron-value";
    restore = hq(() => new Response(JSON.stringify({
      ok: true,
      result: { status: "SECRET_GENERATED_AND_INSTALLED", detail: "Amber generated a new bridge secret and installed it on Relo's Worker.", secretLength: 64 },
    }), { status: 200 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "CONNECTED");
    assert.equal(r.hqStatus, "SECRET_GENERATED_AND_INSTALLED");
    assert.ok(!JSON.stringify(r).includes("hq-cron-value"), "the credential never comes back to the browser");
  });

  it("sends the credential to HQ but never asks the browser for one", async () => {
    process.env.CRON_SECRET = "hq-cron-value";
    let sawHeader = false;
    restore = hq((init) => {
      sawHeader = new Headers(init?.headers ?? {}).get("x-cron-secret") === "hq-cron-value";
      return new Response(JSON.stringify({ ok: true, result: { status: "SECRET_INSTALLED", detail: "done" } }), { status: 200 });
    });
    await mod.connectAmber();
    assert.equal(sawHeader, true, "authenticated server-to-server");
  });

  it("says NEEDS OWNER ATTENTION, in plain English, when Amber cannot finish", async () => {
    process.env.CRON_SECRET = "hq-cron-value";
    restore = hq(() => new Response(JSON.stringify({
      ok: false,
      result: { status: "NO_CLOUDFLARE_TOKEN", detail: "Amber holds a bridge secret but no Cloudflare API token." },
    }), { status: 200 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.match(r.message, /no Cloudflare API token/);
    assert.match(r.whatToDo ?? "", /CLOUDFLARE_API_TOKEN to Amber's vault/);
  });

  it("names the Workers permission when Cloudflare refused", async () => {
    process.env.CRON_SECRET = "x";
    restore = hq(() => new Response(JSON.stringify({
      ok: false, result: { status: "CLOUDFLARE_REJECTED", detail: "Cloudflare refused the write (403)." },
    }), { status: 200 }));
    const r = await mod.connectAmber();
    assert.match(r.whatToDo ?? "", /Workers Scripts: Edit/);
  });

  it("tries every credential Relo holds before giving up", async () => {
    process.env.AMBER_HQ_CRON_SECRET = "first-wrong";
    process.env.CRON_SECRET = "second-right";
    const seen: string[] = [];
    restore = hq((init) => {
      const t = new Headers(init?.headers ?? {}).get("x-cron-secret") ?? "";
      seen.push(t);
      if (t === "second-right") {
        return new Response(JSON.stringify({ ok: true, result: { status: "SECRET_INSTALLED", detail: "done" } }), { status: 200 });
      }
      return new Response("{}", { status: 401 });
    });

    const r = await mod.connectAmber();
    assert.deepEqual(seen, ["first-wrong", "second-right"], "a 401 moves on rather than giving up");
    assert.equal(r.outcome, "CONNECTED");
  });

  it("explains itself when Relo holds no HQ credential at all", async () => {
    for (const k of ["AMBER_HQ_CRON_SECRET", "CRON_SECRET", "AMBER_BUILDER_SECRET", "SOCIAL_TOKEN_SECRET"]) delete process.env[k];
    const r = await mod.connectAmber();
    assert.equal(r.outcome, "NO_HQ_CREDENTIAL");
    assert.match(r.whatToDo ?? "", /same credential the Amber Earnings page needs/);
  });

  it("reports HQ unreachable rather than blaming the credential", async () => {
    process.env.CRON_SECRET = "x";
    const real = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("fetch failed"); }) as typeof fetch;
    restore = () => { globalThis.fetch = real; };
    const r = await mod.connectAmber();
    assert.equal(r.outcome, "HQ_UNREACHABLE");
    assert.match(r.whatToDo ?? "", /amber-hq-web is running/);
  });
});

describe("the Connect Amber button and its route", () => {
  const route = fs.readFileSync("src/app/api/admin/amber-connect/route.ts", "utf8");
  const ui = fs.readFileSync("src/components/admin/AmberOperationsDashboard.tsx", "utf8");

  it("is POST-only and admin-guarded", () => {
    assert.match(route, /export async function POST/);
    assert.ok(!/export async function GET/.test(route), "a GET that writes can be fired by a prefetch");
    assert.match(route, /verifySessionToken/);
    assert.match(route, /ADMIN_COOKIE/);
  });

  it("accepts no secret from the browser and returns none to it", () => {
    assert.ok(!/req\.json\(\)/.test(route), "the browser supplies nothing");
    assert.ok(!route.includes("REELO_ORG_BRIDGE_SECRET"), "the route never handles the secret");
  });

  it("shows exactly the three states the owner asked for", () => {
    assert.match(ui, /CONNECTING…/);
    assert.match(ui, /CONNECT AMBER/);
    assert.match(ui, /NEEDS OWNER ATTENTION/);
  });

  it("re-reads the telemetry after connecting, so the page proves it", () => {
    assert.match(ui, /if \(json\.ok\) await onConnected\(\);/);
    assert.match(ui, /<ConnectAmberButton onConnected=\{refresh\}/);
  });
});

describe("Connect Amber is reachable from the page the owner signs in to", () => {
  const route = fs.readFileSync("src/app/api/amber-earnings/route.ts", "utf8");
  const panel = fs.readFileSync("src/components/business/AmberEarningsPanel.tsx", "utf8");

  it("is gated by the SAME privilege check as every other HQ control action", () => {
    // /business-center is not covered by the admin middleware (matcher is
    // "/admin/:path*"), so this route's own check is the only thing standing
    // between a signed-in non-owner and a production configuration change.
    const block = route.slice(route.indexOf('body.action === "connect-amber"'));
    const guard = block.indexOf("privilegedOr401()");
    const work = block.indexOf("connectAmber()");
    assert.ok(guard !== -1, "the action must call privilegedOr401");
    assert.ok(work !== -1 && guard < work, "privilege is checked BEFORE anything happens");
    assert.match(route, /requireAdminAccess/);
  });

  it("accepts no secret from the browser and returns none", () => {
    const block = route.slice(
      route.indexOf('body.action === "connect-amber"'),
      route.indexOf("hqControl.has(body.action)"),
    );
    assert.ok(!block.includes("REELO_ORG_BRIDGE_SECRET"), "the route never handles the secret");
    assert.ok(!/body\.secret|body\.token/.test(block), "nothing credential-shaped is read from the request");
  });

  it("shows the owner the three states, on the Earnings page", () => {
    assert.match(panel, /CONNECT AMBER/);
    assert.match(panel, /CONNECTING…/);
    assert.match(panel, /NEEDS OWNER ATTENTION/);
    assert.match(panel, /act\("connect-amber"\)/, "the button posts the action");
  });

  it("is hidden until the owner is actually signed in", () => {
    // A button that 401s is worse than no button: it reads as a broken system
    // rather than as "you are not signed in".
    const banner = panel.slice(panel.indexOf("Amber Operations connection") - 400);
    assert.match(banner, /!needSignIn \? \(/);
  });
});


describe("the button tries every channel Relo has, not just the one that failed", () => {
  let mod: typeof import("../amber/connect-amber.ts");
  const prev = { ...process.env };
  let restore: (() => void) | null = null;
  const KEYS = ["AMBER_HQ_CRON_SECRET", "CRON_SECRET", "AMBER_BUILDER_SECRET", "SOCIAL_TOKEN_SECRET", "REELO_DEV_BRIDGE_SECRET"];

  before(async () => { mod = await import("../amber/connect-amber.ts"); });
  afterEach(() => {
    restore?.(); restore = null;
    for (const k of KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function hq(handler: (url: string, init?: RequestInit) => Response) {
    const real = globalThis.fetch;
    globalThis.fetch = (async (u: unknown, init?: RequestInit) => handler(String(u), init)) as typeof fetch;
    return () => { globalThis.fetch = real; };
  }

  it("falls back to the dev bridge when the cron credential is rejected", async () => {
    // The exact production failure of 2026-09-15: CRON_SECRET mismatched.
    process.env.CRON_SECRET = "relo-cron-value";
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    const tried: string[] = [];
    restore = hq((url, init) => {
      tried.push(url.includes("reelo-dev-bridge") ? "dev-bridge" : "cron");
      if (url.includes("reelo-dev-bridge")) {
        assert.equal(new Headers(init?.headers ?? {}).get("x-bridge-secret"), "dev-bridge-value");
        return new Response(JSON.stringify({
          ok: true,
          result: { status: "SECRET_INSTALLED", detail: "Amber installed her bridge secret on Relo's Worker.", cronRepair: "SYNCED_TO_RELO" },
        }), { status: 200 });
      }
      return new Response("{}", { status: 401 });
    });

    const r = await mod.connectAmber();
    assert.deepEqual(tried, ["cron", "dev-bridge"], "cron first, then the second door");
    assert.equal(r.outcome, "CONNECTED");
    assert.equal(r.channel, "dev-bridge");
    assert.match(r.message, /repaired the credential mismatch/, "and it says the HQ feed is fixed too");
  });

  it("never returns a credential, on either channel", async () => {
    process.env.CRON_SECRET = "relo-cron-value";
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq((url) =>
      url.includes("reelo-dev-bridge")
        ? new Response(JSON.stringify({ ok: true, result: { status: "SECRET_INSTALLED", detail: "done" } }), { status: 200 })
        : new Response("{}", { status: 401 }));

    const r = await mod.connectAmber();
    const serialized = JSON.stringify(r);
    assert.ok(!serialized.includes("relo-cron-value"));
    assert.ok(!serialized.includes("dev-bridge-value"));
  });

  it("does not try the dev bridge when the cron credential already worked", async () => {
    process.env.CRON_SECRET = "relo-cron-value";
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    const tried: string[] = [];
    restore = hq((url) => {
      tried.push(url.includes("reelo-dev-bridge") ? "dev-bridge" : "cron");
      return new Response(JSON.stringify({ ok: true, result: { status: "SECRET_INSTALLED", detail: "done" } }), { status: 200 });
    });

    const r = await mod.connectAmber();
    assert.deepEqual(tried, ["cron"], "no unnecessary second call");
    assert.equal(r.channel, "cron");
  });

  it("reports honestly when BOTH channels are rejected", async () => {
    process.env.CRON_SECRET = "relo-cron-value";
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq(() => new Response("{}", { status: 401 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "NO_HQ_CREDENTIAL");
    assert.equal(r.channel, null);
    assert.match(r.message, /rejected every credential Relo holds/);
    assert.match(r.whatToDo ?? "", /dev bridge could not stand in/);
  });

  it("still tries the dev bridge when Relo has no cron credential at all", async () => {
    for (const k of ["AMBER_HQ_CRON_SECRET", "CRON_SECRET", "AMBER_BUILDER_SECRET", "SOCIAL_TOKEN_SECRET"]) delete process.env[k];
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq(() => new Response(JSON.stringify({ ok: true, result: { status: "SECRET_INSTALLED", detail: "done" } }), { status: 200 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "CONNECTED");
    assert.equal(r.channel, "dev-bridge");
  });
});


describe("the button says what Amber actually said", () => {
  let mod: typeof import("../amber/connect-amber.ts");
  const prev = { ...process.env };
  let restore: (() => void) | null = null;
  const KEYS = ["AMBER_HQ_CRON_SECRET", "CRON_SECRET", "AMBER_BUILDER_SECRET", "SOCIAL_TOKEN_SECRET", "REELO_DEV_BRIDGE_SECRET"];

  before(async () => { mod = await import("../amber/connect-amber.ts"); });
  afterEach(() => {
    restore?.(); restore = null;
    for (const k of KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  function hq(handler: (url: string) => Response) {
    const real = globalThis.fetch;
    globalThis.fetch = (async (u: unknown) => handler(String(u))) as typeof fetch;
    return () => { globalThis.fetch = real; };
  }

  it("names the deploy lag instead of blaming the owner", async () => {
    /**
     * The exact production response of 2026-09-15: HQ authenticated Relo and
     * answered {ok:false, error:"Unknown action: connect_relo_bridge"} with a
     * 400, because its deploy had not caught up. The old code read
     * result.detail, found nothing, and rendered the generic "Amber could not
     * complete the connection" — throwing away the one sentence that
     * explained it, and implying the owner had something to fix.
     */
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq(() => new Response(JSON.stringify({ ok: false, error: "Unknown action: connect_relo_bridge" }), { status: 400 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "HQ_NOT_DEPLOYED_YET");
    assert.match(r.message, /reached Amber and she answered/);
    assert.match(r.whatToDo ?? "", /Nothing to do/, "this one resolves itself");
  });

  it("carries HQ's own error through when there is no result object", async () => {
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq(() => new Response(JSON.stringify({ ok: false, error: "Vault is unreadable right now." }), { status: 500 }));

    const r = await mod.connectAmber();
    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.match(r.message, /Vault is unreadable right now/, "Amber's own words, not a generic sentence");
  });

  it("still prefers a real result detail over the bare error", async () => {
    process.env.REELO_DEV_BRIDGE_SECRET = "dev-bridge-value";
    restore = hq(() => new Response(JSON.stringify({
      ok: false,
      error: "generic",
      result: { status: "NO_CLOUDFLARE_TOKEN", detail: "Amber holds a bridge secret but no Cloudflare API token." },
    }), { status: 200 }));

    const r = await mod.connectAmber();
    assert.match(r.message, /no Cloudflare API token/);
    assert.match(r.whatToDo ?? "", /CLOUDFLARE_API_TOKEN to Amber's vault/);
  });

  it("names the deploy lag on the cron channel too", async () => {
    process.env.CRON_SECRET = "relo-cron-value";
    restore = hq(() => new Response(JSON.stringify({ ok: false, error: "Unknown action" }), { status: 400 }));
    const r = await mod.connectAmber();
    assert.equal(r.outcome, "HQ_NOT_DEPLOYED_YET");
    assert.equal(r.channel, "cron");
  });
});

describe("'still deploying' is not shown as the owner's problem", () => {
  for (const file of [
    "src/components/business/AmberEarningsPanel.tsx",
    "src/components/admin/AmberOperationsDashboard.tsx",
  ]) {
    it(`${file} distinguishes it from NEEDS OWNER ATTENTION`, () => {
      const src = fs.readFileSync(file, "utf8");
      assert.match(src, /HQ_NOT_DEPLOYED_YET/);
      assert.match(src, /ALMOST — AMBER IS STILL DEPLOYING/);
    });
  }
});
