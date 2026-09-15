/**
 * The Connect Amber button, server side.
 *
 * ------------------------- WHAT PRESSING IT DOES -------------------------
 * Relo tries, in order, three ways to get one shared telemetry credential
 * present on both hosts. It stops at the first that works:
 *
 *   1. Ask Amber over the HQ cron credential to install it herself.
 *   2. Ask her the same thing over the dev bridge, if the cron one is refused.
 *   3. Provision it: Relo generates the value, keeps its own encrypted copy,
 *      and hands it to Amber over the dev bridge.
 *
 * (1) and (2) need Amber to hold a Cloudflare API token, because they write a
 * Worker secret. Production answered NO_CLOUDFLARE_TOKEN on 2026-09-15, which
 * is why (3) exists — see provisionBridgeSecret below for the full reasoning.
 *
 * The owner's browser is never given a secret, never asked for one, and never
 * sees one in a response. Every field below is a status word or plain English.
 * -------------------------------------------------------------------------
 *
 * AUTHENTICATION, and why this is not circular. Establishing the org bridge
 * obviously cannot authenticate WITH the org bridge. It uses the HQ cron
 * credential Relo already holds -- the same one `hq-nationwide.ts` uses for
 * the Amber Earnings page. So if that page reaches HQ today, this button does
 * too, and if it does not, both fail for one reason rather than two.
 */
import { hqBaseUrl, hqSecretCandidates, hqAuthHeaders } from "../amber-earnings/hq-nationwide.ts";
import { amberOrgBridgeBaseUrl } from "./organization-bridge.ts";

/** What the owner is shown on the button. Never a value, never a log line. */
export type ConnectOutcome =
  | "CONNECTED"
  | "NEEDS_OWNER_ATTENTION"
  | "NO_HQ_CREDENTIAL"
  | "HQ_UNREACHABLE"
  /** Amber answered, but her deploy does not yet carry the connector. */
  | "HQ_NOT_DEPLOYED_YET";

export type ConnectAmberResult = {
  at: string;
  outcome: ConnectOutcome;
  /** Which authenticated channel actually reached Amber. Never a credential. */
  channel: "cron" | "dev-bridge" | null;
  /** One sentence, in the owner's language. */
  message: string;
  /** What to do about it, when there is something to do. */
  whatToDo: string | null;
  /** HQ's own status word, carried through for the record. Never a secret. */
  hqStatus: string | null;
};

const TIMEOUT_MS = 30_000;

/**
 * What Amber actually said, when she said something other than a result.
 *
 * Measured in production, 2026-09-15: the dev bridge answered
 * `{ok:false, error:"Unknown action: connect_relo_bridge"}` with HTTP 400 —
 * HQ had authenticated Relo but had not yet deployed the connector. This code
 * read `result.detail`, found nothing, and rendered "Amber could not complete
 * the connection", which threw away the one sentence that explained it.
 *
 * So HQ's own `error` is carried through, and the deploy case is named, since
 * it resolves itself in minutes and needs no action at all.
 */
function hqSaid(body: { error?: unknown; result?: { detail?: string } } | null): string {
  const detail = typeof body?.result?.detail === "string" ? body.result.detail : "";
  if (detail) return detail;
  return typeof body?.error === "string" ? body.error : "";
}

/** HQ recognising the request but not the action means the deploy is behind. */
function looksUndeployed(said: string): boolean {
  return /unknown action/i.test(said);
}

/** The two ways Amber's own Cloudflare path can fail. Both mean: provision instead. */
function cloudflareIsBlocked(hqStatus: string | null): boolean {
  return hqStatus === "NO_CLOUDFLARE_TOKEN" || hqStatus === "CLOUDFLARE_REJECTED";
}

function devBridgeUrl(): string {
  return `${(process.env.AMBER_DEV_BRIDGE_URL || hqBaseUrl()).replace(/\/$/, "")}/api/internal/reelo-dev-bridge`;
}

/**
 * Relo's side of the credential, injectable so tests never touch a database
 * and never need a real encryption key to exercise the refusal paths.
 */
export type BridgeSecretStore = {
  generateBridgeSecret: () => string;
  loadStoredBridgeSecret: () => Promise<string | null>;
  storeBridgeSecret: (secret: string) => Promise<{ ok: boolean; reason?: string }>;
};

/**
 * ------------------------- THE PROVISIONING PATH -------------------------
 * Relo generates the shared credential, keeps its own encrypted copy, and
 * hands it to Amber over the dev bridge.
 *
 * Why this direction, and not the other one. Establishing the bridge needs a
 * single value present on both hosts. Amber cannot write Relo's side: a Worker
 * SECRET is writable only through Cloudflare, and production answered
 * NO_CLOUDFLARE_TOKEN on 2026-09-15 — she holds no token. Relo *can* write its
 * own side, because nothing requires Relo to READ the value from a Worker
 * secret; it reads env first and its own encrypted row second, exactly as
 * Amber reads env first and her vault second.
 *
 * The one new exposure is the transmission, and it is bounded: a single
 * authenticated server-to-server POST over a bridge that already permits
 * `create_task` — a strictly larger power than holding a telemetry credential.
 * The value never reaches a browser, never appears in a response, and is never
 * returned from this function.
 *
 * Ordering is deliberate. Relo stores its copy BEFORE transmitting, so a host
 * that cannot encrypt fails closed without the value having left it.
 * -------------------------------------------------------------------------
 */
async function provisionBridgeSecret(args: {
  at: string;
  doFetch: typeof fetch;
  devSecret: string;
  store?: BridgeSecretStore;
}): Promise<ConnectAmberResult> {
  const { at, doFetch, devSecret } = args;
  const fail = (message: string, whatToDo: string | null, hqStatus: string | null = null): ConnectAmberResult => ({
    at,
    channel: "dev-bridge",
    outcome: "NEEDS_OWNER_ATTENTION",
    message,
    whatToDo,
    hqStatus,
  });

  const { generateBridgeSecret, loadStoredBridgeSecret, storeBridgeSecret } =
    args.store ?? (await import("./bridge-secret-store.ts"));

  /**
   * Reuse before rotating. Pressing the button twice must not mint a second
   * credential and leave the first one live in Amber's vault.
   */
  const existing = await loadStoredBridgeSecret();
  const secret = existing ?? generateBridgeSecret();

  if (!existing) {
    const stored = await storeBridgeSecret(secret);
    if (!stored.ok) {
      return fail(
        "Relo could not store its own copy of the bridge credential, so it did not send one to Amber.",
        stored.reason ?? null,
      );
    }
  }

  type StoreReply = {
    ok?: boolean;
    error?: string;
    stored?: boolean;
    /** Amber's own check that this exact value opens her bridge. A boolean, never a value. */
    willAuthenticate?: boolean;
    /** Only sent when willAuthenticate is false, and only as a boolean. */
    envVarSet?: boolean;
  } | null;
  let body: StoreReply = null;
  try {
    const res = await doFetch(devBridgeUrl(), {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-secret": devSecret },
      body: JSON.stringify({ action: "store_org_bridge_secret", secret }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return fail(
        "Amber rejected Relo's dev-bridge credential, so Relo could not hand her the telemetry credential.",
        "Set REELO_DEV_BRIDGE_SECRET to the same value on both hosts.",
      );
    }
    body = (await res.json().catch(() => null)) as StoreReply;
  } catch (e) {
    return {
      at,
      channel: "dev-bridge",
      outcome: "HQ_UNREACHABLE",
      message: `Relo could not reach Amber HQ${e instanceof Error ? ` (${e.message})` : ""}.`,
      whatToDo: "Check that amber-hq-web is running on Railway.",
      hqStatus: null,
    };
  }

  if (!body?.ok) {
    const said = hqSaid(body);
    if (looksUndeployed(said)) {
      return {
        at,
        channel: "dev-bridge",
        outcome: "HQ_NOT_DEPLOYED_YET",
        message: "Reelo reached Amber and she answered — but her deployment does not carry this connector yet.",
        whatToDo: "Nothing to do. Wait a few minutes for Amber to finish deploying, then press again.",
        hqStatus: null,
      };
    }
    return fail(said || "Amber did not accept the telemetry credential.", null);
  }

  /**
   * Amber checks her own work before Relo trusts it.
   *
   * On 2026-09-15 she answered {stored: true} and her bridge rejected the very
   * same value one call later, because her auth path read the credential
   * through an env-first resolver that never consulted the row. "Stored" was
   * true and useless. `willAuthenticate` is the fact that matters, and saying
   * it here turns an opaque 401 into a named cause.
   *
   * Absent on an older deploy, in which case the verification below still
   * decides -- this narrows the message, it does not replace the proof.
   */
  if (body.willAuthenticate === false) {
    return fail(
      "Amber stored the credential, but it will not open her telemetry bridge.",
      body.envVarSet
        ? "Amber has REELO_ORG_BRIDGE_SECRET set in her own environment, and that value is taking precedence over the one Relo provisioned. Clearing it on Railway lets the provisioned credential take effect."
        : "Something in Amber's credential store is taking precedence over the row she just wrote.",
    );
  }

  /**
   * ---- Proof, not a 200. ----
   *
   * Amber answering "stored" proves her half. It does not prove Relo can read
   * its own row back, and it does not prove the two halves match. Only a real
   * authenticated call over the bridge proves the thing the button claims, so
   * CONNECTED is reported from that and nothing less.
   */
  const readBack = await loadStoredBridgeSecret();
  if (readBack !== secret) {
    return fail(
      "Amber accepted the credential, but Relo could not read its own copy back.",
      "Relo's encryption key (SOCIAL_TOKEN_SECRET or VAULT_MASTER_KEY) may have changed since the row was written.",
    );
  }

  try {
    const res = await doFetch(`${amberOrgBridgeBaseUrl()}/api/internal/reelo-organization-bridge`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-secret": readBack },
      body: JSON.stringify({ action: "deployed_version" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const verify = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !verify?.ok) {
      return fail(
        `Amber stored the credential, but the telemetry bridge still rejected it (HTTP ${res.status}).`,
        "Press again shortly. If it repeats, something in Amber's credential store is taking precedence over the row she just wrote.",
      );
    }
  } catch (e) {
    return fail(
      `Amber stored the credential, but Relo could not confirm the bridge${e instanceof Error ? ` (${e.message})` : ""}.`,
      "Press again shortly to re-check.",
    );
  }

  return {
    at,
    channel: "dev-bridge",
    outcome: "CONNECTED",
    message: "Amber is connected. Relo established the telemetry credential and confirmed it over the bridge.",
    whatToDo: null,
    hqStatus: "PROVISIONED_BY_RELO",
  };
}


export async function connectAmber(opts?: {
  fetchImpl?: typeof fetch;
  now?: () => number;
  store?: BridgeSecretStore;
}): Promise<ConnectAmberResult> {
  const at = new Date(opts?.now?.() ?? Date.now()).toISOString();
  const doFetch = opts?.fetchImpl ?? fetch;
  const tokens = hqSecretCandidates();
  const devSecret = (process.env.REELO_DEV_BRIDGE_SECRET ?? "").trim();

  if (tokens.length === 0 && !devSecret) {
    return {
      at,
      channel: null,
      outcome: "NO_HQ_CREDENTIAL",
      message: "Relo has no credential for Amber HQ, so it cannot ask Amber to connect.",
      whatToDo:
        "Set CRON_SECRET on Relo to the same value Amber HQ uses. This is the same credential the Amber Earnings page needs, so that page will be blank too.",
      hqStatus: null,
    };
  }

  const url = `${hqBaseUrl()}/api/internal/connect-relo-bridge`;
  let lastStatus = 0;
  let lastError = "";

  for (const token of tokens) {
    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: hqAuthHeaders(token),
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      lastStatus = res.status;

      // Try the next credential rather than giving up on the first rejection.
      if (res.status === 401 || res.status === 403) continue;

      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; result?: { status?: string; detail?: string } }
        | null;
      const hqStatus = body?.result?.status ?? null;
      const detail = body?.result?.detail ?? "";

      if (body?.ok) {
        return {
          at,
          channel: "cron",
          outcome: "CONNECTED",
          message: detail || "Amber established the connection.",
          whatToDo: null,
          hqStatus,
        };
      }

      /**
       * HQ answered and said it could not finish. Its `detail` is already
       * written for a person and already free of secrets -- see
       * relo-bridge-connect.ts -- so it is passed through rather than
       * replaced with a vaguer sentence of our own.
       */
      const said = hqSaid(body);
      if (looksUndeployed(said)) {
        return {
          at,
          channel: "cron",
          outcome: "HQ_NOT_DEPLOYED_YET",
          message: "Reelo reached Amber and she answered — but her deployment does not carry this connector yet.",
          whatToDo: "Nothing to do. Wait a few minutes for Amber to finish deploying, then press again.",
          hqStatus: null,
        };
      }
      /**
       * Amber's own Cloudflare path being blocked is not the end of the
       * attempt — it is the exact condition the provisioning path below
       * exists for. Fall through rather than reporting a dead end.
       */
      if (cloudflareIsBlocked(hqStatus) && devSecret) break;

      return {
        at,
        channel: "cron",
        outcome: "NEEDS_OWNER_ATTENTION",
        message: said || `Amber could not complete the connection (HTTP ${res.status}).`,
        whatToDo:
          hqStatus === "NO_CLOUDFLARE_TOKEN"
            ? "Add CLOUDFLARE_API_TOKEN to Amber's vault so she can set the value on Relo's Worker herself."
            : hqStatus === "CLOUDFLARE_REJECTED"
              ? "Amber's Cloudflare token needs the Workers Scripts: Edit permission."
              : "Open the details below, or ask Claude to look at Amber's connection report.",
        hqStatus,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "request failed";
    }
  }

  /**
   * ---- The cron credential did not work. Try the other channel. ----
   *
   * Measured in production, 2026-09-15: pressing this button returned a 401 —
   * Relo and HQ hold different CRON_SECRET values. But the cron secret is not
   * the only thing these two hosts share. The DEV bridge has its own secret
   * (REELO_DEV_BRIDGE_SECRET), and wherever it is configured it already
   * authenticates, so there is a second door to try before giving up.
   *
   * Reaching Amber over that channel also repairs the cron mismatch itself:
   * she copies her own CRON_SECRET onto Relo's Worker, which fixes the HQ feed
   * behind the Amber Earnings page at the same time.
   */
  if (devSecret) {
    /**
     * Provisioning runs over this bridge, so it is only worth attempting once
     * this bridge has proved it authenticates. A dev secret that is itself
     * rejected cannot carry a credential to Amber, and pretending otherwise
     * would replace an accurate "every credential was rejected" with a
     * confusing second failure.
     */
    let devAuthenticated = false;
    try {
      const res = await doFetch(devBridgeUrl(), {
        method: "POST",
        headers: { "content-type": "application/json", "x-bridge-secret": devSecret },
        body: JSON.stringify({ action: "connect_relo_bridge" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (res.status !== 401 && res.status !== 403) {
        devAuthenticated = true;
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string; result?: { status?: string; detail?: string; cronRepair?: string } }
          | null;
        const hqStatus = body?.result?.status ?? null;
        const detail = body?.result?.detail ?? "";
        const cronRepair = body?.result?.cronRepair;
        const said = hqSaid(body);

        if (body?.ok) {
          return {
            at,
            channel: "dev-bridge",
            outcome: "CONNECTED",
            message:
              (detail || "Amber established the connection.") +
              (cronRepair === "SYNCED_TO_RELO"
                ? " She also repaired the credential mismatch that was breaking the HQ feed on this page."
                : ""),
            whatToDo: null,
            hqStatus,
          };
        }
        if (looksUndeployed(said)) {
          return {
            at,
            channel: "dev-bridge",
            outcome: "HQ_NOT_DEPLOYED_YET",
            message:
              "Reelo reached Amber and she answered — but her deployment does not carry this connector yet.",
            whatToDo: "Nothing to do. Wait a few minutes for Amber to finish deploying, then press again.",
            hqStatus: null,
          };
        }
        /**
         * Production, 2026-09-15: this is the branch that actually fired —
         * the dev bridge authenticated and Amber answered NO_CLOUDFLARE_TOKEN.
         * So it is not a report; it is the handover to provisioning.
         */
        if (!cloudflareIsBlocked(hqStatus)) {
          return {
            at,
            channel: "dev-bridge",
            outcome: "NEEDS_OWNER_ATTENTION",
            message: said || "Amber could not complete the connection.",
            whatToDo: null,
            hqStatus,
          };
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "request failed";
    }

    /**
     * ---- Channel 3: Relo provisions the credential itself. ----
     * Reached when Amber could answer but could not write Relo's side.
     */
    if (devAuthenticated) return await provisionBridgeSecret({ at, doFetch, devSecret, store: opts?.store });
  }

  if (lastStatus === 401 || lastStatus === 403) {
    return {
      at,
      channel: null,
      outcome: "NO_HQ_CREDENTIAL",
      message: "Amber HQ rejected every credential Relo holds, so Relo could not ask her to connect.",
      whatToDo:
        "Relo and Amber HQ disagree on CRON_SECRET, and the dev bridge could not stand in for it. Set CRON_SECRET to the same value on both hosts.",
      hqStatus: null,
    };
  }
  return {
    at,
    channel: null,
    outcome: "HQ_UNREACHABLE",
    message: `Relo could not reach Amber HQ${lastError ? ` (${lastError})` : ""}.`,
    whatToDo: "Check that amber-hq-web is running on Railway.",
    hqStatus: null,
  };
}
