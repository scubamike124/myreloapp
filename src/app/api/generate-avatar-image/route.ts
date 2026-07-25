import { asRecord, errorMessage } from "@/lib/json";
import { NextResponse } from "next/server";
import { PayloadTooLarge, clientId, createDailyLimiter, readJsonLimited } from "@/lib/api-guard";
import { chargeFor, refundCharge } from "@/lib/charge";
import { IMAGE_TOOLS } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 300;

const limiter = createDailyLimiter(Number(process.env.IMAGE_DAILY_LIMIT ?? 20));
const MAX_BODY = 24 * 1024 * 1024;

const MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const IMAGE_ACTIONS = new Set([...IMAGE_TOOLS]);

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });

  const id = clientId(req);
  const remainingToday = limiter.consume(id);
  if (remainingToday === null) {
    return NextResponse.json(
      { error: `Daily limit reached — up to ${limiter.limit} images per day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  let imageBase64: string;
  let mimeType: string;
  let prompt: string;
  let action: string;
  try {
    const body = (await readJsonLimited(req, MAX_BODY)) as Record<string, unknown>;
    imageBase64 = String(body.imageBase64 ?? "");
    mimeType = String(body.mimeType || "image/jpeg");
    prompt = String(body.prompt ?? "").trim();
    action = String(body.action ?? "custom-avatar-creator").trim();
    if (!IMAGE_ACTIONS.has(action)) action = "custom-avatar-creator";

    if (action === "thumbnail-maker") {
      if (!prompt) throw new Error("no prompt");
      // Photo optional for thumbnails.
    } else if (!imageBase64) {
      throw new Error("no image");
    }

    if (!prompt) {
      if (action === "background-remover") {
        prompt = "Remove the background cleanly. Keep the subject sharp with natural edges.";
      } else {
        prompt = "Create a high-quality stylized avatar portrait of this person, preserving their likeness.";
      }
    }
  } catch (e) {
    limiter.refund(id);
    if (e instanceof PayloadTooLarge) {
      return NextResponse.json(
        { error: "That photo is too large. Try a smaller image (under ~8MB), or use a clearer headshot." },
        { status: 413 },
      );
    }
    const msg = e instanceof Error ? e.message : "";
    if (msg === "no prompt") {
      return NextResponse.json({ error: "Describe the thumbnail topic or title first." }, { status: 400 });
    }
    return NextResponse.json({ error: "Please upload a photo first." }, { status: 400 });
  }

  const charged = await chargeFor(action);
  if (!charged.ok) {
    limiter.refund(id);
    return NextResponse.json(
      { error: charged.error, needed: charged.needed, balance: charged.balance },
      { status: 402 },
    );
  }

  try {
    const parts: unknown[] = [{ text: prompt }];
    if (imageBase64) parts.push({ inlineData: { mimeType, data: imageBase64 } });
    const reqBody = JSON.stringify({ contents: [{ parts }] });
    let data: Record<string, unknown> | null = null;
    let lastErr = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: reqBody,
          signal: AbortSignal.timeout(170000),
        });
        const json = asRecord(await res.json());
        if (res.ok) {
          data = json;
          break;
        }
        lastErr = errorMessage(json, `Image error ${res.status}`);
        if (res.status >= 500 || res.status === 429) {
          await sleep(4000);
          continue;
        }
        {
          limiter.refund(id);
          await refundCharge(charged.charge);
          return NextResponse.json({ error: lastErr }, { status: 502 });
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt < 3) {
          await sleep(4000);
          continue;
        }
      }
    }
    if (!data) {
      limiter.refund(id);
      await refundCharge(charged.charge);
      return NextResponse.json({ error: `Image model timed out. ${lastErr}`.trim() }, { status: 504 });
    }

    type ImgPart = { inlineData?: { data: string; mimeType?: string }; inline_data?: { data: string; mimeType?: string } };
    const outParts = ((data as { candidates?: { content?: { parts?: ImgPart[] } }[] })?.candidates?.[0]?.content?.parts) ?? [];
    const imgPart = outParts.find((p) => p.inlineData || p.inline_data);
    const out = imgPart?.inlineData || imgPart?.inline_data;
    if (!out?.data) {
      limiter.refund(id);
      await refundCharge(charged.charge);
      return NextResponse.json({ error: "The model did not return an image. Try another photo or prompt." }, { status: 502 });
    }

    const outMimeType = out.mimeType || "image/png";
    return NextResponse.json({
      ok: true,
      remainingToday,
      tokensCharged: charged.charge.charged,
      balance: charged.charge.balance,
      imageUrl: `data:${outMimeType};base64,${out.data}`,
    });
  } catch (e) {
    limiter.refund(id);
    await refundCharge(charged.charge);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Image generation failed." }, { status: 502 });
  }
}
