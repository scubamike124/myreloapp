import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 400;

const MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });

  let imageBase64: string, mimeType: string, prompt: string;
  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType || "image/jpeg";
    prompt = (body.prompt || "").trim();
    if (!imageBase64) throw new Error("no image");
    if (!prompt) prompt = "Create a high-quality stylized avatar portrait of this person, preserving their likeness.";
  } catch {
    return NextResponse.json({ error: "Please upload a photo first." }, { status: 400 });
  }

  try {
    const reqBody = JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }] });
    let data: Record<string, unknown> | null = null;
    let lastErr = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: reqBody,
          signal: AbortSignal.timeout(170000), // ~3 min per attempt
        });
        const json = await res.json();
        if (res.ok) { data = json; break; }
        lastErr = json?.error?.message || `Image error ${res.status}`;
        if (res.status >= 500 || res.status === 429) { await sleep(4000); continue; }
        return NextResponse.json({ error: lastErr }, { status: 502 });
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt < 3) { await sleep(4000); continue; }
      }
    }
    if (!data) return NextResponse.json({ error: `Image model timed out. ${lastErr}`.trim() }, { status: 504 });

    type ImgPart = { inlineData?: { data: string; mimeType?: string }; inline_data?: { data: string; mimeType?: string } };
    const parts = ((data as { candidates?: { content?: { parts?: ImgPart[] } }[] })?.candidates?.[0]?.content?.parts) ?? [];
    const imgPart = parts.find((p) => p.inlineData || p.inline_data);
    const out = imgPart?.inlineData || imgPart?.inline_data;
    if (!out?.data) return NextResponse.json({ error: "The model did not return an image. Try another photo." }, { status: 502 });

    const buf = Buffer.from(out.data, "base64");
    const outDir = path.join(process.cwd(), "public", "generated");
    await mkdir(outDir, { recursive: true });
    const ext = (out.mimeType || "image/png").includes("jpeg") ? "jpg" : "png";
    const id = `avatar-${Date.now().toString(36)}`;
    await writeFile(path.join(outDir, `${id}.${ext}`), buf);

    return NextResponse.json({ ok: true, imageUrl: `/generated/${id}.${ext}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Image generation failed." }, { status: 502 });
  }
}
