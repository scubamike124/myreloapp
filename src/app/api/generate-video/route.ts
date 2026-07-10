import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";

// ffmpeg-static's bundled path breaks under Turbopack (resolves to \ROOT\...).
// Fall back to the real node_modules location using the runtime cwd.
function resolveFfmpeg(): string | null {
  if (ffmpegStatic && existsSync(ffmpegStatic)) return ffmpegStatic;
  const bin = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const direct = path.join(process.cwd(), "node_modules", "ffmpeg-static", bin);
  return existsSync(direct) ? direct : null;
}

export const runtime = "nodejs";
export const maxDuration = 800;

const execFileP = promisify(execFile);

// Fast model has a much larger quota than the full preview model; cinematic look
// comes mostly from the prompt + style directive + negative prompt below.
const VEO_MODEL = "veo-3.1-fast-generate-preview";
const CLIP_COUNT = 1; // single 8-second cinematic clip (cheapest — least Veo quota)
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Appended to every shot so the whole spot shares one polished, filmic look.
const CINEMATIC_STYLE =
  "Cinematic commercial, shot on ARRI Alexa cinema camera, anamorphic lens flares, shallow depth of field, dramatic volumetric lighting, rich teal-and-red cinematic color grade, subtle film grain, slow deliberate camera motion, high production value, photorealistic, 24fps, 4k.";
const NEGATIVE_PROMPT =
  "text, captions, subtitles, watermark, logo artifacts, distorted faces, extra fingers, low quality, blurry, cartoon, illustration, cgi look, oversaturated, jittery motion, warped geometry.";

function normalizeUrl(raw: string) {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return new URL(u).toString();
}

async function scrape(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; ReeloBot/1.0)" }, signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "";
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `TITLE: ${title}\nDESCRIPTION: ${desc}\nCONTENT: ${body}`.slice(0, 6000);
  } catch {
    return "(Could not fetch the page — infer from the domain.)";
  }
}

// Ask Gemini for cinematic per-shot Veo prompts.
async function sceneprompts(key: string, url: string, siteText: string): Promise<{ brand: string; scenes: string[] }> {
  const prompt = `You are an award-winning commercial film director. Based on this website, design a ${CLIP_COUNT}-shot, ~30-second HIGH-END CINEMATIC brand commercial with a clear arc: hook → product/benefit → emotion → payoff.
Return JSON: { "brand": string, "scenes": string[] } with exactly ${CLIP_COUNT} scene strings.
Each scene = one vivid ~8-second CINEMATIC shot for an AI video model. Specify: camera movement (e.g. slow dolly-in, crane, tracking), lens/framing, subject & action, lighting, and mood. Keep a consistent premium, filmic tone across all shots so they cut together as one commercial. Photoreal, live-action, under 55 words each.
CRITICAL for the video model: do NOT write the real company name, product names, trademarks, logos, or any real/celebrity person in the scene text. Describe only GENERIC subjects, environments, hands, objects, and mood (the brand identity comes from tone & color, not literal names or logos). This avoids content blocks.
Website: ${url}
--- CONTENT ---
${siteText}`;
  const res = await fetch(`${BASE}/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: { type: "object", properties: { brand: { type: "string" }, scenes: { type: "array", items: { type: "string" } } }, required: ["brand", "scenes"] },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Scene planning failed.");
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
  const scenes: string[] = Array.isArray(parsed.scenes) ? parsed.scenes.slice(0, CLIP_COUNT) : [];
  while (scenes.length < CLIP_COUNT) scenes.push(`Cinematic branded product shot, dramatic lighting, slow camera push-in, premium mood.`);
  return { brand: parsed.brand || "Your Brand", scenes };
}

// Start one Veo job → return operation name.
async function startVeo(key: string, prompt: string, tries = 3): Promise<string> {
  const fullPrompt = `${prompt}\n\nStyle: ${CINEMATIC_STYLE}`;
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(`${BASE}/models/${VEO_MODEL}:predictLongRunning?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { aspectRatio: "16:9", negativePrompt: NEGATIVE_PROMPT } }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (res.ok && data.name) return data.name as string;
    const msg = data?.error?.message || `Veo start failed (${res.status}).`;
    const retryable = res.status === 429 || /quota|rate limit|resource has been exhausted/i.test(msg);
    if (retryable && attempt < tries) {
      await sleep(20000); // back off, then retry
      continue;
    }
    throw new Error(msg);
  }
  throw new Error("Veo start failed.");
}

// Poll a Veo operation → return the file download URI.
async function awaitVeo(key: string, op: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    await sleep(8000);
    const res = await fetch(`${BASE}/${op}?key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(30000) });
    const data = await res.json();
    if (data.done) {
      if (data.error) throw new Error(data.error.message || "Veo generation failed.");
      const uri = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error("Veo returned no video.");
      return uri;
    }
  }
  throw new Error("Veo timed out.");
}

// Full clip lifecycle with a retry on transient/internal Veo errors.
async function generateClip(key: string, prompt: string, tries = 2): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const op = await startVeo(key, prompt);
      return await awaitVeo(key, op);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const transient = /internal|try again|unavailable|deadline|500|503/i.test(msg);
      if (transient && attempt < tries) {
        await sleep(15000);
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Clip generation failed.");
}

// Diagnostic: confirm ffmpeg is spawnable in this runtime (no Veo spend).
export async function GET() {
  const bin = resolveFfmpeg();
  if (!bin) return NextResponse.json({ ok: false, error: "ffmpeg not found", cwd: process.cwd() });
  try {
    const { stdout } = await execFileP(bin, ["-version"]);
    return NextResponse.json({ ok: true, ffmpeg: bin, version: stdout.split("\n")[0] });
  } catch (e) {
    return NextResponse.json({ ok: false, ffmpeg: bin, error: e instanceof Error ? e.message : String(e) });
  }
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not set in .env.local" }, { status: 500 });
  const ffmpegBin = resolveFfmpeg();
  if (!ffmpegBin) return NextResponse.json({ error: "ffmpeg binary not found." }, { status: 500 });

  let url: string;
  try {
    url = normalizeUrl((await req.json()).url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  try {
    // 1. plan scenes
    const siteText = await scrape(url);
    const { brand, scenes } = await sceneprompts(key, url, siteText);

    // 2 + 3. generate clips ONE AT A TIME (avoids per-minute quota) and download each.
    const tmpDir = path.join("/tmp", `reelo-${Date.now().toString(36)}`);
    await mkdir(tmpDir, { recursive: true });
    const files: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const uri = await generateClip(key, scenes[i]);
      const r = await fetch(`${uri}&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(90000) }); // undici follows the 302
      const buf = Buffer.from(await r.arrayBuffer());
      const fp = path.join(tmpDir, `clip${i}.mp4`);
      await writeFile(fp, buf);
      files.push(fp);
    }

    // 4. output — single clip: just copy it; multiple clips: ffmpeg concat.
    const outDir = path.join(process.cwd(), "public", "generated");
    await mkdir(outDir, { recursive: true });
    const id = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "commercial"}-${Date.now().toString(36)}`;
    const outPath = path.join(outDir, `${id}.mp4`);
    if (files.length === 1) {
      await copyFile(files[0], outPath);
    } else {
      const listPath = path.join(tmpDir, "list.txt");
      await writeFile(listPath, files.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
      await execFileP(ffmpegBin, ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
    }

    return NextResponse.json({ ok: true, brand, scenes, videoUrl: `/generated/${id}.mp4` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Video generation failed." }, { status: 502 });
  }
}
