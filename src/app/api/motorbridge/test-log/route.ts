import { NextResponse } from "next/server";
import { clientId, createDailyLimiter, readJsonLimited } from "@/lib/api-guard";
import { normalizeUpload } from "@/lib/motorbridge/normalize";
import { saveUpload } from "@/lib/motorbridge/persist";
import { CONNECTOR_CATALOG } from "@/lib/motorbridge/connectors";

export const runtime = "nodejs";

// Free, no-account "Test My Log" self-serve preview (§3, §34). Capped per IP
// per day since every request runs a real parse — cheap, but not free, and
// this endpoint takes no credential at all.
const limiter = createDailyLimiter(Number(process.env.MOTORBRIDGE_TEST_LOG_DAILY_LIMIT ?? 20));

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB — generous for a CSV log, small enough to bound memory per anonymous request.

export async function POST(req: Request) {
  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${limiter.limit} free test uploads per day. Try again tomorrow, or start a trial.` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await readJsonLimited(req, MAX_UPLOAD_BYTES)) as Record<string, unknown>;
  } catch {
    limiter.refund(id);
    return NextResponse.json({ error: "Could not read the request body, or it was too large." }, { status: 400 });
  }

  const connectorSlug = String(body.connectorSlug ?? "");
  const fileText = String(body.fileText ?? "");
  if (!connectorSlug || !fileText.trim()) {
    limiter.refund(id);
    return NextResponse.json({ error: "connectorSlug and fileText are both required." }, { status: 400 });
  }

  const outcome = normalizeUpload({
    connectorSlug,
    fileText,
    originLabel: typeof body.originLabel === "string" && body.originLabel ? body.originLabel : "Test My Log upload",
  });

  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error }, { status: 200 });
  }

  // Best-effort persistence for the compatibility dashboard's real counts
  // (§43) — never blocks the response the customer is waiting on.
  saveUpload(outcome.record, { userId: null, isTrial: true }).catch(() => {});

  return NextResponse.json({
    ok: true,
    record: outcome.record,
    remainingToday,
  });
}

/** Lets the customer-facing page list only what's actually wired, without hardcoding it twice. */
export async function GET() {
  return NextResponse.json({
    connectors: CONNECTOR_CATALOG.map((c) => ({
      slug: c.slug,
      name: c.name,
      formatBasis: c.formatBasis,
      legalAccessStatus: c.legalAccessStatus,
      maturity: c.maturity,
    })),
  });
}
