import { asArray, asRecord, asString, errorMessage, geminiParts } from "@/lib/json";
import { NextResponse } from "next/server";
import { PayloadTooLarge, clientId, createDailyLimiter, readJsonLimited } from "@/lib/api-guard";
import { chargeFor, refundCharge } from "@/lib/charge";

export const runtime = "nodejs";
export const maxDuration = 120;

const limiter = createDailyLimiter(Number(process.env.SUBTITLES_DAILY_LIMIT ?? 40));
const MAX_BODY = 12 * 1024 * 1024;
const MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

type Cue = { start: number; end: number; text: string };

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function formatTs(seconds: number, vtt: boolean): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  const sep = vtt ? "." : ",";
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}${sep}${String(ms).padStart(3, "0")}`;
}

function toSrt(cues: Cue[]): string {
  return cues
    .map((c, i) => `${i + 1}\n${formatTs(c.start, false)} --> ${formatTs(c.end, false)}\n${c.text}\n`)
    .join("\n");
}

function toVtt(cues: Cue[]): string {
  return (
    "WEBVTT\n\n" +
    cues.map((c) => `${formatTs(c.start, true)} --> ${formatTs(c.end, true)}\n${c.text}\n`).join("\n")
  );
}

function parseCues(raw: unknown): Cue[] {
  const list = asArray(raw);
  const out: Cue[] = [];
  for (const item of list) {
    const row = asRecord(item);
    const text = asString(row.text).trim();
    const start = Number(row.start);
    const end = Number(row.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    out.push({ start, end, text: text.slice(0, 220) });
  }
  return out.slice(0, 400);
}

/** Split a plain script into timed cues when the model returns nothing usable. */
function fallbackCues(script: string): Cue[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const cues: Cue[] = [];
  const wps = 2.4;
  let i = 0;
  let t = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + 8).join(" ");
    const dur = Math.max(1.2, chunk.split(/\s+/).length / wps);
    cues.push({ start: t, end: t + dur, text: chunk });
    t += dur + 0.15;
    i += 8;
  }
  return cues;
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set on the server." }, { status: 503 });
  }

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily subtitle limit reached — up to ${limiter.limit} runs per day.` },
      { status: 429 },
    );
  }

  let script: string;
  let format: "SRT" | "VTT";
  let audioBase64 = "";
  let mimeType = "";
  try {
    const body = (await readJsonLimited(req, MAX_BODY)) as Record<string, unknown>;
    script = String(body.script ?? "").trim().slice(0, 20_000);
    format = String(body.format ?? "SRT").toUpperCase() === "VTT" ? "VTT" : "SRT";
    audioBase64 = String(body.audioBase64 ?? "");
    mimeType = String(body.mimeType || "audio/mpeg");
    if (!script && !audioBase64) throw new Error("empty");
  } catch (e) {
    limiter.refund(id);
    if (e instanceof PayloadTooLarge) {
      return NextResponse.json({ error: "That file is too large. Try a shorter clip or paste the script." }, { status: 413 });
    }
    return NextResponse.json(
      { error: "Paste a script or upload a short audio/video clip first." },
      { status: 400 },
    );
  }

  const charged = await chargeFor("auto-subtitles");
  if (!charged.ok) {
    limiter.refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  const prompt = `You create subtitle cues for short-form video.

${script ? `Spoken script / transcript:\n"""${script}"""\n` : "Transcribe the attached audio/video and build cues from speech.\n"}
Return ONLY a JSON object (no markdown) with key "cues": an array of objects.
Each cue: { "start": number (seconds), "end": number (seconds), "text": string }.
Rules:
- Cues must cover the full spoken content in order.
- Each cue 1–12 words; natural phrase breaks.
- start/end must be increasing; end > start; no overlaps.
- Prefer ~2–3 seconds per cue for spoken delivery pace.
- Do not invent marketing copy that was not spoken.`;

  try {
    const parts: unknown[] = [{ text: prompt }];
    if (audioBase64) {
      parts.push({ inlineData: { mimeType, data: audioBase64 } });
    }

    const upstream = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const json = asRecord(await upstream.json());
    if (!upstream.ok) {
      limiter.refund(id);
      await refundCharge(charged.charge);
      return NextResponse.json({ error: errorMessage(json, `Subtitle error ${upstream.status}`) }, { status: 502 });
    }

    const text = geminiParts(json)
      .map((p) => asString(asRecord(p).text))
      .join("")
      .trim();

    let cues: Cue[] = [];
    try {
      const parsed = asRecord(JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")));
      cues = parseCues(parsed.cues);
    } catch {
      cues = [];
    }

    if (!cues.length && script) cues = fallbackCues(script);
    if (!cues.length) {
      limiter.refund(id);
      await refundCharge(charged.charge);
      return NextResponse.json(
        { error: "Could not build subtitles from that input. Paste a clearer script and try again." },
        { status: 502 },
      );
    }

    const content = format === "VTT" ? toVtt(cues) : toSrt(cues);
    return NextResponse.json({
      ok: true,
      format,
      content,
      cues,
      remainingToday,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
    });
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Subtitle generation failed." },
      { status: 502 },
    );
  }
}
