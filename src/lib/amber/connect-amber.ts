/**
 * The Connect Amber button, server side.
 *
 * ------------------------- WHAT PRESSING IT DOES -------------------------
 * Relo asks Amber HQ to establish the telemetry bridge. Amber then does the
 * work herself, using credentials she already holds: her own bridge secret
 * (her environment and her encrypted vault) and her own Cloudflare API token.
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

/** What the owner is shown on the button. Never a value, never a log line. */
export type ConnectOutcome = "CONNECTED" | "NEEDS_OWNER_ATTENTION" | "NO_HQ_CREDENTIAL" | "HQ_UNREACHABLE";

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

export async function connectAmber(opts?: { fetchImpl?: typeof fetch; now?: () => number }): Promise<ConnectAmberResult> {
  const at = new Date(opts?.now?.() ?? Date.now()).toISOString();
  const doFetch = opts?.fetchImpl ?? fetch;
  const tokens = hqSecretCandidates();

  if (tokens.length === 0 && !process.env.REELO_DEV_BRIDGE_SECRET) {
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
        | { ok?: boolean; result?: { status?: string; detail?: string } }
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
      return {
        at,
        channel: "cron",
        outcome: "NEEDS_OWNER_ATTENTION",
        message: detail || `Amber could not complete the connection (HTTP ${res.status}).`,
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
  if (process.env.REELO_DEV_BRIDGE_SECRET) {
    const devUrl = `${(process.env.AMBER_DEV_BRIDGE_URL || hqBaseUrl()).replace(/\/$/, "")}/api/internal/reelo-dev-bridge`;
    try {
      const res = await doFetch(devUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "x-bridge-secret": process.env.REELO_DEV_BRIDGE_SECRET },
        body: JSON.stringify({ action: "connect_relo_bridge" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (res.status !== 401 && res.status !== 403) {
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; result?: { status?: string; detail?: string; cronRepair?: string } }
          | null;
        const hqStatus = body?.result?.status ?? null;
        const detail = body?.result?.detail ?? "";
        const cronRepair = body?.result?.cronRepair;

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
        return {
          at,
          channel: "dev-bridge",
          outcome: "NEEDS_OWNER_ATTENTION",
          message: detail || "Amber could not complete the connection.",
          whatToDo:
            hqStatus === "NO_CLOUDFLARE_TOKEN"
              ? "Add CLOUDFLARE_API_TOKEN to Amber's vault so she can set the value on Relo's Worker herself."
              : hqStatus === "CLOUDFLARE_REJECTED"
                ? "Amber's Cloudflare token needs the Workers Scripts: Edit permission."
                : null,
          hqStatus,
        };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "request failed";
    }
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
