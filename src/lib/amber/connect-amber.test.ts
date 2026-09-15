/**
 * The CONNECT AMBER button, and specifically the provisioning path.
 *
 * Live evidence these tests are written against (2026-09-15, production):
 *   - The cron credential was rejected: Relo and HQ hold different values.
 *   - The dev bridge authenticated and Amber answered NO_CLOUDFLARE_TOKEN.
 * So the button's real job is not "ask Amber to install it" — it is to notice
 * she cannot, and provision the credential instead.
 *
 * The invariants worth protecting are narrow and all about the credential:
 * it is never returned to the caller, it is stored before it is transmitted,
 * pressing twice does not mint a second one, and CONNECTED is claimed only
 * after a real authenticated call over the bridge succeeds.
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { connectAmber, type BridgeSecretStore } from "./connect-amber.ts";

const GENERATED = "r".repeat(64);
const DEV_SECRET = "dev-bridge-secret";
const CRON_SECRET = "cron-secret";

type Call = { url: string; body: Record<string, unknown>; headers: Record<string, string> };

/**
 * A fake HQ. `plan` maps an action to the reply it gives; anything unplanned
 * answers the way a deployment that is behind really does.
 */
function hq(plan: Record<string, { status?: number; body: Record<string, unknown> }>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    calls.push({ url: String(url), body, headers: (init?.headers ?? {}) as Record<string, string> });
    // The cron/dev connect call carries no action; everything else names one.
    const key = typeof body.action === "string" ? body.action : "connect_relo_bridge";
    const planned = plan[key];
    if (!planned) {
      return new Response(JSON.stringify({ ok: false, error: `Unknown action: ${key}` }), { status: 400 });
    }
    return new Response(JSON.stringify(planned.body), { status: planned.status ?? 200 });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

/** Amber answering the way production answered: bridge up, no Cloudflare token. */
const NO_CF = { ok: false, result: { status: "NO_CLOUDFLARE_TOKEN", detail: "Amber holds no Cloudflare API token." } };
const STORED = { ok: true, stored: true, secretLength: 64 };
const VERIFIED = { ok: true, version: { commit: "abc123" } };

/** An in-memory stand-in for Relo's encrypted row. */
function fakeStore(opts: { canStore?: boolean; initial?: string | null } = {}) {
  const state = { value: opts.initial ?? null, writes: 0 } as { value: string | null; writes: number };
  const store: BridgeSecretStore = {
    generateBridgeSecret: () => GENERATED,
    loadStoredBridgeSecret: async () => state.value,
    storeBridgeSecret: async (secret) => {
      if (opts.canStore === false) return { ok: false, reason: "This host has no encryption key" };
      state.writes += 1;
      state.value = secret;
      return { ok: true };
    },
  };
  return { state, store };
}

function connect(fetchImpl: typeof fetch, store: BridgeSecretStore) {
  return connectAmber({ fetchImpl, store, now: () => Date.parse("2026-09-15T18:00:00.000Z") });
}

const ENV = { ...process.env };
beforeEach(() => {
  process.env.AMBER_HQ_URL = "https://hq.example";
  process.env.AMBER_ORG_BRIDGE_URL = "https://hq.example";
  process.env.REELO_DEV_BRIDGE_SECRET = DEV_SECRET;
  process.env.CRON_SECRET = CRON_SECRET;
  delete process.env.AMBER_HQ_CRON_SECRET;
  delete process.env.AMBER_BUILDER_SECRET;
  delete process.env.SOCIAL_TOKEN_SECRET;
  delete process.env.AMBER_DEV_BRIDGE_URL;
});
afterEach(() => {
  process.env = { ...ENV };
});

describe("provisioning, when Amber cannot write Relo's side", () => {
  const working = () =>
    hq({
      connect_relo_bridge: { status: 200, body: NO_CF },
      store_org_bridge_secret: { body: STORED },
      deployed_version: { body: VERIFIED },
    });

  it("provisions and reports CONNECTED after the bridge actually answers", async () => {
    const { state, store } = fakeStore();
    const h = working();

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "CONNECTED");
    assert.equal(r.channel, "dev-bridge");
    assert.equal(r.hqStatus, "PROVISIONED_BY_RELO");
    assert.equal(state.value, GENERATED, "Relo kept its own copy");
  });

  it("never returns either credential to the caller", async () => {
    const { store } = fakeStore();
    const r = await connect(working().fetchImpl, store);
    const serialized = JSON.stringify(r);

    for (const secret of [GENERATED, DEV_SECRET, CRON_SECRET]) {
      assert.ok(!serialized.includes(secret), `${secret} must never appear in the result`);
    }
  });

  it("stores its copy BEFORE transmitting, so a host that cannot encrypt never sends the value", async () => {
    const { store } = fakeStore({ canStore: false });
    const h = hq({
      connect_relo_bridge: { status: 200, body: NO_CF },
      store_org_bridge_secret: { body: STORED },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.match(r.whatToDo ?? "", /encryption key/);
    assert.equal(
      h.calls.filter((c) => c.body.action === "store_org_bridge_secret").length,
      0,
      "the credential was never transmitted",
    );
  });

  it("reuses the stored credential instead of minting a second one", async () => {
    const existing = "e".repeat(64);
    const { state, store } = fakeStore({ initial: existing });
    const h = working();

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "CONNECTED");
    assert.equal(state.writes, 0, "nothing was rewritten");
    const sent = h.calls.find((c) => c.body.action === "store_org_bridge_secret");
    assert.equal(sent?.body.secret, existing, "Amber was handed the credential Relo already holds");
  });

  it("does not claim CONNECTED when Amber stored it but the bridge still rejects it", async () => {
    const { store } = fakeStore();
    const h = hq({
      connect_relo_bridge: { status: 200, body: NO_CF },
      store_org_bridge_secret: { body: STORED },
      deployed_version: { status: 401, body: { ok: false, error: "Unauthorized" } },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.match(r.message, /still rejected it/);
  });

  it("verifies against the telemetry bridge with the value it read back", async () => {
    const { store } = fakeStore();
    const h = working();

    await connect(h.fetchImpl, store);

    const verify = h.calls.find((c) => c.body.action === "deployed_version");
    assert.ok(verify, "a real bridge call was made");
    assert.equal(verify.headers["x-bridge-secret"], GENERATED);
    assert.match(verify.url, /reelo-organization-bridge$/, "the telemetry bridge, not the dev bridge");
  });

  it("names the cause when Amber says the value will not open her bridge", async () => {
    /**
     * The production failure of 2026-09-15: Amber answered {stored: true} and
     * her bridge rejected the same value one call later, because her auth path
     * read it through an env-first resolver that never consulted the row.
     * "Stored" was true and useless; willAuthenticate is the fact that matters.
     */
    const { store } = fakeStore();
    const h = hq({
      connect_relo_bridge: { status: 200, body: NO_CF },
      store_org_bridge_secret: { body: { ok: true, stored: true, willAuthenticate: false, envVarSet: true } },
      deployed_version: { body: VERIFIED },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.match(r.whatToDo ?? "", /set in her own environment/);
    assert.equal(
      h.calls.filter((c) => c.body.action === "deployed_version").length,
      0,
      "no point verifying a value Amber already said will not work",
    );
  });

  it("still proves it over the bridge when Amber's deploy does not report that signal", async () => {
    // An older HQ omits willAuthenticate. The verification decides, as before.
    const { store } = fakeStore();
    const h = hq({
      connect_relo_bridge: { status: 200, body: NO_CF },
      store_org_bridge_secret: { body: { ok: true, stored: true } },
      deployed_version: { body: VERIFIED },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "CONNECTED");
    assert.equal(h.calls.filter((c) => c.body.action === "deployed_version").length, 1);
  });

  it("says the deploy is behind rather than blaming the owner", async () => {
    const { store } = fakeStore();
    const h = hq({ connect_relo_bridge: { status: 200, body: NO_CF } });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "HQ_NOT_DEPLOYED_YET");
    assert.match(r.whatToDo ?? "", /Nothing to do/);
  });
});

describe("the channels before provisioning", () => {
  it("does not provision when Amber installed it herself", async () => {
    const { state, store } = fakeStore();
    const h = hq({
      connect_relo_bridge: { body: { ok: true, result: { status: "SECRET_INSTALLED", detail: "Installed." } } },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "CONNECTED");
    assert.equal(r.channel, "cron");
    assert.equal(state.writes, 0, "no credential was generated when none was needed");
    assert.equal(h.calls.filter((c) => c.body.action === "store_org_bridge_secret").length, 0);
  });

  it("does not provision over a dev bridge that is itself rejected", async () => {
    // A credential that cannot authenticate cannot carry another credential.
    // Attempting it would replace an accurate report with a confusing second
    // failure, so the honest "every credential was rejected" survives.
    const { state, store } = fakeStore();
    const h = hq({
      connect_relo_bridge: { status: 401, body: { ok: false, error: "Unauthorized" } },
      store_org_bridge_secret: { status: 401, body: { ok: false, error: "Unauthorized" } },
    });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "NO_HQ_CREDENTIAL");
    assert.match(r.message, /rejected every credential Relo holds/);
    assert.equal(state.writes, 0);
    assert.equal(h.calls.filter((c) => c.body.action === "store_org_bridge_secret").length, 0);
  });

  it("cannot provision at all without a dev bridge credential", async () => {
    delete process.env.REELO_DEV_BRIDGE_SECRET;
    const { state, store } = fakeStore();
    const h = hq({ connect_relo_bridge: { status: 200, body: NO_CF } });

    const r = await connect(h.fetchImpl, store);

    assert.equal(r.outcome, "NEEDS_OWNER_ATTENTION");
    assert.equal(r.channel, "cron");
    assert.equal(r.hqStatus, "NO_CLOUDFLARE_TOKEN");
    assert.equal(state.writes, 0);
  });
});
