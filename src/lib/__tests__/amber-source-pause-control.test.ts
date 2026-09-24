import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * The owner's "Resume <source>" control for Amber's enforced containment
 * pauses. Lifting a pause is an owner action, so the control must:
 *   - only ever lift SOURCE-scoped pauses (never global / bidding),
 *   - refuse malformed source names before calling Amber,
 *   - keep the bridge secret on the server,
 *   - never report success Amber did not confirm.
 */

const BRIDGE = "https://hq.amberoneai.com/api/internal/reelo-organization-bridge";

type Sent = { url: string; headers: Record<string, string>; body: Record<string, unknown> };

function stubBridge(reply: { status?: number; body: unknown }) {
  const sent: Sent[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    sent.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { sent, restore: () => { globalThis.fetch = real; } };
}

const load = () => import("../amber/organization-bridge.ts");

const MOLT_PAUSE = {
  scope: "source:moltjobs",
  reason: "containment: 5 consecutive failures",
  pausedAt: "2026-09-19T04:00:00.000Z",
  pausedBy: "automatic",
};

describe("control-plane pause bridge wrappers", () => {
  const prevSecret = process.env.REELO_ORG_BRIDGE_SECRET;
  const prevUrl = process.env.AMBER_ORG_BRIDGE_URL;
  let restore: (() => void) | null = null;

  beforeEach(() => {
    process.env.REELO_ORG_BRIDGE_SECRET = "test-secret";
    delete process.env.AMBER_ORG_BRIDGE_URL;
  });
  afterEach(() => {
    if (prevSecret === undefined) delete process.env.REELO_ORG_BRIDGE_SECRET;
    else process.env.REELO_ORG_BRIDGE_SECRET = prevSecret;
    if (prevUrl !== undefined) process.env.AMBER_ORG_BRIDGE_URL = prevUrl;
    restore?.();
    restore = null;
  });

  it("lists pauses with action list_pauses", async () => {
    const stub = stubBridge({ body: { ok: true, pauses: [MOLT_PAUSE] } });
    restore = stub.restore;
    const { listControlPlanePauses } = await load();

    const out = await listControlPlanePauses();
    assert.deepEqual(out.pauses, [MOLT_PAUSE]);
    assert.equal(stub.sent.length, 1);
    assert.equal(stub.sent[0].url, BRIDGE);
    assert.deepEqual(stub.sent[0].body, { action: "list_pauses" });
    assert.equal(stub.sent[0].headers["x-bridge-secret"], "test-secret");
  });

  it("resumes with action resume, scope source, and the source as value", async () => {
    const stub = stubBridge({ body: { ok: true, action: "resume", pauses: [] } });
    restore = stub.restore;
    const { resumeSourcePause } = await load();

    const out = await resumeSourcePause("moltjobs");
    assert.deepEqual(out.pauses, []);
    assert.deepEqual(stub.sent[0].body, { action: "resume", scope: "source", value: "moltjobs" });
  });

  it("refuses a malformed source name without calling Amber", async () => {
    const stub = stubBridge({ body: { ok: true, pauses: [] } });
    restore = stub.restore;
    const { resumeSourcePause } = await load();

    for (const bad of ["", "../global", "a b", "-leading", "x".repeat(65), "source:moltjobs"]) {
      await assert.rejects(resumeSourcePause(bad), /Invalid source name/, `should refuse ${JSON.stringify(bad)}`);
    }
    assert.equal(stub.sent.length, 0);
  });

  it("surfaces Amber's error when its store is unreadable", async () => {
    const stub = stubBridge({ status: 500, body: { ok: false, error: "control-plane store unreadable" } });
    restore = stub.restore;
    const { resumeSourcePause } = await load();
    await assert.rejects(resumeSourcePause("moltjobs"), /control-plane store unreadable/);
  });

  it("treats a reply with no pause list as a failure, not an empty list", async () => {
    const stub = stubBridge({ body: { ok: true, action: "resume" } });
    restore = stub.restore;
    const { resumeSourcePause, listControlPlanePauses } = await load();
    await assert.rejects(resumeSourcePause("moltjobs"), /without a pause list/);
    await assert.rejects(listControlPlanePauses(), /without a pause list/);
  });
});

describe("admin route: source pause control", () => {
  const route = fs.readFileSync("src/app/api/admin/amber-organization/route.ts", "utf8");
  const bridge = fs.readFileSync("src/lib/amber/organization-bridge.ts", "utf8");

  const caseBody = (name: string) => {
    const start = route.indexOf(`case "${name}"`);
    assert.ok(start >= 0, `route must handle ${name}`);
    const next = route.indexOf("case ", start + 5);
    const end = next >= 0 ? next : route.indexOf("default:", start);
    return route.slice(start, end);
  };

  it("resume_source validates the source name and returns 400 otherwise", () => {
    const body = caseBody("resume_source");
    assert.match(body, /\/\^\[a-z0-9\]\[a-z0-9\._-\]\{0,63\}\$\/i\.test\(source\)/);
    assert.match(body, /status: 400/);
    assert.match(body, /resumeSourcePause\(source\)/);
  });

  it("resume_source can only ever send scope source", () => {
    const body = caseBody("resume_source");
    assert.doesNotMatch(body, /callAmberBridge|scope:/, "the route must not choose a scope itself");
    const wrapper = bridge.slice(bridge.indexOf("export async function resumeSourcePause"));
    const wrapperBody = wrapper.slice(0, wrapper.indexOf("\n}\n"));
    assert.match(wrapperBody, /scope: "source"/);
    assert.equal((wrapperBody.match(/scope:/g) ?? []).length, 1);
  });

  it("exposes no pause action and no other-scope resume", () => {
    assert.doesNotMatch(route, /case "pause_source"|case "resume_global"|case "resume_bidding"|"list_pauses"|action: "resume"/);
  });

  it("never references the bridge secret", () => {
    assert.doesNotMatch(route, /REELO_ORG_BRIDGE_SECRET\b(?! is not set)/, "route may only name the secret in its 'not set' message");
    assert.doesNotMatch(route, /x-bridge-secret|process\.env/);
  });
});
