import { NextResponse } from "next/server";
import { PayloadTooLarge, clientId, createDailyLimiter, readJsonLimited } from "@/lib/api-guard";
import { chargeFor, refundCharge, refundLater } from "@/lib/charge";
import { startVeo, checkVeo, isVeoOperation } from "@/lib/veo";

export const runtime = "nodejs";
export const maxDuration = 300;

// Every call here starts a paid Veo render, so it must be metered.
const limiter = createDailyLimiter(Number(process.env.VIDEO_DAILY_LIMIT ?? 5));
// Uploaded photos arrive base64-encoded in the JSON body.
const MAX_BODY = 12 * 1024 * 1024;

const STYLE = "Photoreal, natural expressive motion, cinematic lighting, smooth camera, high quality, 4k.";

/** Only the two Veo photo tools use this route; both cost the same. */
function toolAction(v: unknown): string {
  return v === "dancing-photo" ? "dancing-photo" : "talking-photo";
}

// ---------------------------------------------------------------------------
// POST — start a render and return its handle immediately (async).
//   Body:     { imageBase64, mimeType, prompt, action }
//   Response: { ok, status: "processing", operation, action, poll, ...charge }
//   Then poll GET /api/generate-avatar?op=<operation>&action=<action>.
//
// This used to await the whole 5-minute render in one request. It no longer
// does — the client polls the GET below — which is what lets it run on
// Cloudflare Workers later, and stops a dropped connection losing the job.
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${limiter.limit} videos per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  let imageBase64: string, mimeType: string, prompt: string, action: string;
  try {
    const body = (await readJsonLimited(req, MAX_BODY)) as Record<string, unknown>;
    imageBase64 = String(body.imageBase64 ?? "");
    mimeType = String(body.mimeType || "image/jpeg");
    prompt = String(body.prompt ?? "").trim();
    action = toolAction(body.action);
    if (!imageBase64) throw new Error("no image");
    if (!prompt) prompt = "The person in the photo comes to life with natural, expressive motion.";
  } catch (e) {
    limiter.refund(id); // nothing was rendered — don't charge the quota unit
    if (e instanceof PayloadTooLarge) {
      return NextResponse.json({ error: "That photo is too large. Try one under 10MB." }, { status: 413 });
    }
    return NextResponse.json({ error: "Please upload a photo first." }, { status: 400 });
  }

  // Charged after validation and before the paid render begins. Without a
  // database, or with nobody signed in, this takes nothing and the per-IP cap
  // above is still the limit.
  const charged = await chargeFor(action);
  if (!charged.ok) {
    limiter.refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  try {
    const operation = await startVeo(key, `${prompt}\n\n${STYLE}`, imageBase64, mimeType);
    return NextResponse.json({
      ok: true,
      status: "processing",
      operation,
      action,
      remainingToday,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      poll: `/api/generate-avatar?op=${encodeURIComponent(operation)}&action=${action}`,
    });
  } catch (e) {
    // The job never started, so refund now — there is no operation to poll and
    // therefore no GET that would refund it later.
    limiter.refund(id);
    await refundCharge(charged.charge);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// GET — poll a render. /api/generate-avatar?op=<operation>&action=<action>
//   Response: { status: "processing" }
//          or { status: "completed", videoUrl }
//          or { status: "failed", error }  (tokens refunded here)
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ status: "failed", error: "GEMINI_API_KEY is not set." }, { status: 500 });

  const sp = new URL(req.url).searchParams;
  const op = (sp.get("op") ?? "").trim();
  const action = toolAction(sp.get("action"));
  if (!isVeoOperation(op)) {
    return NextResponse.json({ status: "failed", error: "Invalid operation handle." }, { status: 400 });
  }

  let result;
  try {
    result = await checkVeo(key, op);
  } catch (e) {
    // A transient status-check error is not a failed render — tell the client to
    // keep polling rather than refunding and giving up.
    return NextResponse.json({ status: "processing", note: e instanceof Error ? e.message : "retrying" });
  }

  // The render failed for good. Refund the tokens, keyed on the operation so a
  // client polling every few seconds is refunded exactly once.
  if (result.status === "failed") {
    await refundLater(action, `veo:${op}`);
  }

  return NextResponse.json(result);
}
