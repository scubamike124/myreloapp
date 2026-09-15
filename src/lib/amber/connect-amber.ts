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

  if (tokens.length === 0) {
    return {
      at,
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

  if (lastStatus === 401 || lastStatus === 403) {
    return {
      at,
      outcome: "NO_HQ_CREDENTIAL",
      message: "Amber HQ rejected Relo's credential, so Relo could not ask her to connect.",
      whatToDo: "Relo and Amber HQ are holding different values for CRON_SECRET. Set them to the same value.",
      hqStatus: null,
    };
  }
  return {
    at,
    outcome: "HQ_UNREACHABLE",
    message: `Relo could not reach Amber HQ${lastError ? ` (${lastError})` : ""}.`,
    whatToDo: "Check that amber-hq-web is running on Railway.",
    hqStatus: null,
  };
}
