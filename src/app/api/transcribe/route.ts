import { asRecord, asString, errorMessage, geminiParts } from "@/lib/json";
import { clientId, createDailyLimiter } from "@/lib/api-guard";

// ---------------------------------------------------------------------------
// Speech-to-text for Amber's composer.
//
// This exists because the browser's own Web Speech API proved unusable: it is
// Chrome-only, it silently ships audio to a Google service we do not control,
// and when that service is unreachable it fails with an opaque "network" error
// and no recourse. Recording locally and transcribing through Gemini uses the
// key this app already has, works in every browser that can record audio, and
// fails in ways we can actually explain.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** ~2 minutes of Opus. Long enough for any composer message, small enough to
 *  bound memory when several requests land at once. */
const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/flac",
]);

const DAILY = Number(process.env.TRANSCRIBE_DAILY_LIMIT ?? 100);
const limiter = createDailyLimiter(Number.isFinite(DAILY) ? DAILY : 100);

/** Strip codec parameters: "audio/webm;codecs=opus" -> "audio/webm". */
function baseType(raw: string): string {
  return raw.split(";")[0].trim().toLowerCase();
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Voice input is unavailable — GEMINI_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  const id = clientId(req);
  if (limiter.consume(id) === null) {
    return Response.json(
      { error: "You've hit today's voice-input limit. Type your message instead." },
      { status: 429 },
    );
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    limiter.refund(id);
    return Response.json({ error: "That recording is too long. Keep it under about two minutes." }, { status: 413 });
  }

  const mime = baseType(req.headers.get("content-type") ?? "");
  if (!ALLOWED_TYPES.has(mime)) {
    limiter.refund(id);
    return Response.json({ error: "Unsupported audio format." }, { status: 415 });
  }

  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.byteLength === 0) {
    limiter.refund(id);
    return Response.json({ error: "No audio was recorded. Check your microphone and try again." }, { status: 400 });
  }
  if (buf.byteLength > MAX_BYTES) {
    limiter.refund(id);
    return Response.json({ error: "That recording is too long. Keep it under about two minutes." }, { status: 413 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Transcribe this audio verbatim. Return ONLY the transcription with no commentary, " +
                  "labels, or quotation marks. If there is no intelligible speech, return an empty string.",
              },
              { inline_data: { mime_type: mime, data: Buffer.from(buf).toString("base64") } },
            ],
          },
        ],
        // Transcription is not a creative task, and thinking tokens are billed
        // against maxOutputTokens — left on, they can consume the whole budget
        // and truncate a long transcript before it is written.
        generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    limiter.refund(id);
    return Response.json({ error: "Couldn't reach the transcription service. Try again." }, { status: 502 });
  }

  if (!upstream.ok) {
    limiter.refund(id);
    let msg = `Transcription failed (${upstream.status}).`;
    try {
      const data = asRecord(await upstream.json());
      const m = errorMessage(data, "");
      if (m) msg = m;
    } catch {
      /* keep the generic message */
    }
    return Response.json({ error: msg }, { status: 502 });
  }

  let text = "";
  try {
    const data = asRecord(await upstream.json());
    const parts = geminiParts(data);
    text = parts.map((p) => asString(asRecord(p).text)).join("");
  } catch {
    limiter.refund(id);
    return Response.json({ error: "Transcription came back unreadable. Try again." }, { status: 502 });
  }

  text = text.trim();
  if (!text) {
    return Response.json({ ok: true, text: "", detail: "No speech was detected in that recording." });
  }

  return Response.json({ ok: true, text }, { headers: { "Cache-Control": "no-store" } });
}
