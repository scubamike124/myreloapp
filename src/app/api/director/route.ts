import {
  PayloadTooLarge,
  UnsafeUrlError,
  assertSafeUrl,
  clientId,
  createDailyLimiter,
  readJsonLimited,
} from "@/lib/api-guard";
import { scrapePage } from "@/lib/scrape";
import { direct } from "@/lib/director/direct";
import { readBusiness } from "@/lib/director/intel";
import { ModelError } from "@/lib/director/gemini";
import type { Direction } from "@/lib/director/types";

// ---------------------------------------------------------------------------
// Commercial Director — brief, storyboard and creative review. No renders.
//
// The stage that was missing. Website Commercial went from a scraped page
// straight to a spokesperson reading a script, so there was no point at which
// anything decided what the commercial should be — and no point at which a bad
// idea could be caught before it was paid for.
//
// This route is that point. It costs no tokens, because it produces no video:
// the whole argument for putting it in front of the render is that rejecting a
// direction should be free. What it returns is a board a person can read and
// judge, plus every direction that was tried and thrown out on the way there.
//
// Charging starts again downstream, when a board the customer has approved is
// actually shot.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BODY = 64 * 1024;

// Free, so the cap is what stops it being expensive: each attempt is four
// Gemini calls, and a run may make two attempts.
const limiter = createDailyLimiter(Number(process.env.DIRECTOR_DAILY_LIMIT ?? 12));

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/** Directions come back from the client on a retry, so they are re-validated. */
function readTried(v: unknown): Direction[] {
  return (Array.isArray(v) ? v : []).slice(0, 8).map((d: Record<string, unknown>) => ({
    angle: str(d?.angle, 60),
    visualSystem: str(d?.visualSystem, 60),
    openingShot: str(d?.openingShot, 80),
    // Carried back so a retry knows which images are spent, not just which shot
    // sizes. An older client omits it; an empty subject skips the opening-image
    // check rather than failing the retry.
    openingSubject: str(d?.openingSubject, 240),
    structure: str(d?.structure, 300),
  })).filter((d) => d.angle && d.visualSystem);
}

export type DirectorSyncInput = { url: string; about: string };
export type DirectorSyncResult = Awaited<ReturnType<typeof runDirector>>;

/** Command Center variant of Commercial Director — generates a board for
 *  review, same logic as the POST handler below. No `tried`/`directives`
 *  history support here (that's for the customer's interactive retry flow);
 *  each Command Center call is a fresh attempt. */
export async function generateDirectionSync(input: DirectorSyncInput): Promise<DirectorSyncResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set on the server.");
  if (!input.url && !input.about) throw new Error("Give the business's website, or describe what they do.");

  let siteText = "";
  if (input.url) {
    const safe = await assertSafeUrl(input.url);
    siteText = await scrapePage(safe, 7000);
  }
  if (!siteText && !input.about) {
    throw new Error("That page could not be read. Try another address, or describe the business instead.");
  }

  return runDirector(key, siteText, input.url, input.about);
}

async function runDirector(key: string, siteText: string, rawUrl: string, told: string) {
  const intel = await readBusiness({ key, siteText, source: rawUrl || "(described by the owner)", told });
  const result = await direct({ key, intel, tried: [], priorDirectives: [], maxAttempts: 2 });
  return { ok: true as const, intel, best: result.best, attempts: result.attempts, settled: result.settled };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "The director is unavailable — GEMINI_API_KEY is not set." }, { status: 503 });
  }

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return Response.json(
      { error: `You've reached today's limit of ${limiter.limit} directions. Try again tomorrow.` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    limiter.refund(id);
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ error: tooBig ? "That request is too large." : "Invalid request." }, { status: tooBig ? 413 : 400 });
  }

  const rawUrl = str(body.url, 500);
  const told = str(body.about, 1200);
  const tried = readTried(body.tried);
  const priorDirectives = (Array.isArray(body.directives) ? body.directives : []).slice(0, 8).map((x) => str(x, 300));
  const maxAttempts = Math.min(3, Math.max(1, Number(body.attempts) || 2));

  if (!rawUrl && !told) {
    limiter.refund(id);
    return Response.json({ error: "Paste the business's website, or describe what they do." }, { status: 400 });
  }

  // A site that will not load is not fatal — a description alone is enough to
  // direct from, and the intel stage marks the result as unsourced so nothing
  // downstream is allowed to assert a credential it cannot point at.
  let siteText = "";
  if (rawUrl) {
    try {
      const safe = await assertSafeUrl(rawUrl);
      siteText = await scrapePage(safe, 7000);
    } catch (e) {
      if (e instanceof UnsafeUrlError) {
        limiter.refund(id);
        return Response.json({ error: e.message }, { status: 400 });
      }
      siteText = "";
    }
  }

  if (!siteText && !told) {
    limiter.refund(id);
    return Response.json(
      { error: "That page could not be read. Try another address, or describe the business instead." },
      { status: 502 },
    );
  }

  try {
    const intel = await readBusiness({ key, siteText, source: rawUrl || "(described by the owner)", told });
    const result = await direct({ key, intel, tried, priorDirectives, maxAttempts });

    return Response.json(
      {
        ok: true,
        intel,
        // The chosen board, and everything rejected on the way to it. Showing
        // the rejects is the point: it is visible proof that a direction was
        // discarded for free rather than rendered and paid for.
        best: result.best,
        attempts: result.attempts,
        settled: result.settled,
        // Handed back so the next request diverges from everything tried so far,
        // across requests and not just within one.
        tried: [...tried, ...result.attempts.map((a) => a.direction)],
        remainingToday,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    limiter.refund(id);
    // Provider messages already carry their own full stop, so append one only
    // when it is missing rather than shipping "try again later..".
    const detail = e instanceof ModelError ? e.message.replace(/\.\s*$/, "") : "";
    const message = detail ? `The director stalled — ${detail}.` : "The director could not finish.";
    return Response.json({ error: message }, { status: 502 });
  }
}
