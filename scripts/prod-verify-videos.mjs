#!/usr/bin/env node
/**
 * Production verification for Reelo video playback / audio bug class.
 * Usage: node scripts/prod-verify-videos.mjs
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const PROD = process.env.PROD_URL || "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-prod-verify");
mkdirSync(OUT, { recursive: true });

const results = [];

function log(...a) {
  console.log(...a);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function ffprobe(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const lines = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  const codecs = lines.map((l) => {
    const [codec, type] = l.split(",");
    // csv order from ffprobe may be codec_name,codec_type OR type,name depending on version
    if (type === "audio" || type === "video") return { codec, type };
    if (codec === "audio" || codec === "video") return { codec: type, type: codec };
    return { raw: l };
  });
  // Normalize: our ffprobe printed "h264,video" / "aac,audio"
  const norm = lines.map((l) => {
    const parts = l.split(",");
    if (parts[1] === "video" || parts[1] === "audio") return { name: parts[0], type: parts[1] };
    if (parts[0] === "video" || parts[0] === "audio") return { name: parts[1], type: parts[0] };
    return { name: l, type: "unknown" };
  });
  return {
    ok: r.status === 0,
    stderr: (r.stderr || "").trim(),
    streams: norm,
    hasVideo: norm.some((s) => s.type === "video"),
    hasAudio: norm.some((s) => s.type === "audio"),
  };
}

function looksLikeMp4(buf) {
  if (buf.length < 12) return false;
  // error JSON
  const head = buf.slice(0, 40).toString("utf8");
  if (head.trim().startsWith("{")) return { ok: false, reason: `json_error:${head}` };
  // ftyp box
  const ascii = buf.slice(4, 8).toString("ascii");
  if (ascii === "ftyp") return { ok: true };
  return { ok: false, reason: `not_mp4_head:${ascii}` };
}

async function download(url, file) {
  const absolute = url.startsWith("http") ? url : `${PROD}${url}`;
  const res = await fetch(absolute, {
    headers: {
      "User-Agent": "Mozilla/5.0 ReeloProdVerify/1.0",
      Accept: "*/*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(180_000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return { status: res.status, bytes: buf.length, contentType: res.headers.get("content-type"), buf, absolute };
}

async function pollHeygen(videoId, label, maxTries = 60) {
  for (let i = 1; i <= maxTries; i++) {
    const res = await fetch(`${PROD}/api/heygen-video?video_id=${encodeURIComponent(videoId)}`);
    const data = await res.json();
    log(`[${label}] poll ${i}/${maxTries} status=${data.status} durable=${data.durable} url=${(data.videoUrl || "").slice(0, 80)}`);
    if (data.status === "completed" && data.videoUrl) return data;
    if (data.status === "failed") throw new Error(JSON.stringify(data.error || data));
    await sleep(10_000);
  }
  throw new Error(`${label}: timeout waiting for HeyGen`);
}

async function verifyDownloaded(label, videoUrl, providerUrl) {
  // Prefer browser-path simulation: fetch provider bytes (Node has no CORS),
  // POST /api/media/ingest, then play from same-origin /api/media/c/...
  const ingestSource = providerUrl || videoUrl;
  let ingested = null;
  if (ingestSource && /^https?:\/\//i.test(ingestSource)) {
    try {
      const dl0 = await download(ingestSource, join(OUT, `${label}-source.mp4`));
      const shape0 = looksLikeMp4(dl0.buf);
      if (shape0.ok && dl0.bytes > 20_000) {
        const ing = await fetch(`${PROD}/api/media/ingest`, {
          method: "POST",
          headers: { "Content-Type": "video/mp4" },
          body: dl0.buf,
        });
        const ingData = await ing.json().catch(() => ({}));
        if (ing.ok && ingData.url) {
          ingested = { url: ingData.url, backend: ingData.backend, bytes: ingData.bytes };
          log(`[${label}] ingested → ${ingData.url} backend=${ingData.backend}`);
        } else {
          log(`[${label}] ingest failed: ${ing.status} ${JSON.stringify(ingData)}`);
        }
      }
    } catch (e) {
      log(`[${label}] ingest path error: ${e.message}`);
    }
  }

  const playUrl = ingested?.url || videoUrl;
  const file = join(OUT, `${label}.mp4`);
  const dl = await download(playUrl, file);
  const shape = looksLikeMp4(dl.buf);
  const probe = shape.ok ? ffprobe(file) : { ok: false, hasVideo: false, hasAudio: false, streams: [], stderr: shape.reason };

  // If playback URL failed, try provider directly
  let fallback = null;
  if ((!shape.ok || !probe.hasVideo) && providerUrl) {
    const f2 = join(OUT, `${label}-provider.mp4`);
    const dl2 = await download(providerUrl, f2);
    const shape2 = looksLikeMp4(dl2.buf);
    const probe2 = shape2.ok ? ffprobe(f2) : { ok: false, hasVideo: false, hasAudio: false, streams: [], stderr: shape2.reason };
    fallback = { dl: dl2, shape: shape2, probe: probe2 };
  }

  const used = fallback && fallback.probe.hasVideo ? fallback : { dl, shape, probe };
  const isProxyError = typeof playUrl === "string" && playUrl.includes("/api/media/remote") && !shape.ok;
  const pass =
    used.shape.ok &&
    used.probe.hasVideo &&
    used.probe.hasAudio &&
    used.dl.bytes > 50_000 &&
    !isProxyError;

  return {
    label,
    pass,
    playbackUrl: playUrl,
    providerUrl: providerUrl || null,
    ingested,
    http: used.dl.status,
    bytes: used.dl.bytes,
    contentType: used.dl.contentType,
    isRealMp4: used.shape.ok,
    hasVideo: used.probe.hasVideo,
    hasAudio: used.probe.hasAudio,
    streams: used.probe.streams,
    usedProviderFallback: Boolean(fallback && fallback.probe.hasVideo),
    notes: [
      isProxyError ? "playback URL was broken media/remote error JSON" : null,
      !used.probe.hasAudio ? "NO AUDIO TRACK" : null,
      used.dl.bytes < 50_000 ? "file too small" : null,
      ingested ? `ingest_backend=${ingested.backend}` : "ingest_not_used",
    ].filter(Boolean),
  };
}

async function testAvatarStudio() {
  const label = "ai-avatar-studio";
  log(`\n=== ${label} ===`);
  const start = await fetch(`${PROD}/api/heygen-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script: "Hi, this is a production audio check for Reelo Avatar Studio.",
      avatarId: "Abigail_expressive_2024112501",
      voiceId: "f8c69e517f424cafaecde32dde57096b",
      action: "ai-avatar-studio",
    }),
  }).then((r) => r.json());
  if (!start.ok || !start.videoId) throw new Error(`start failed: ${JSON.stringify(start)}`);
  log(`[${label}] started ${start.videoId}`);
  const done = await pollHeygen(start.videoId, label);
  const verify = await verifyDownloaded(label, done.videoUrl, done.providerUrl);
  verify.durable = done.durable;
  verify.expectAudio = true;
  // Lip sync: cannot fully automate; record duration presence as soft check
  verify.duration = done.duration ?? null;
  verify.lipSync = done.duration ? "duration_reported_manual_review" : "manual_review_required";
  results.push(verify);
  return verify;
}

async function testWebsiteCommercial() {
  const label = "website-commercial";
  log(`\n=== ${label} ===`);
  const start = await fetch(`${PROD}/api/heygen-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script: "Welcome to our shop. Quality products, fast shipping, and friendly support every day.",
      action: "website-commercial",
    }),
  }).then((r) => r.json());
  if (!start.ok || !start.videoId) throw new Error(`start failed: ${JSON.stringify(start)}`);
  const done = await pollHeygen(start.videoId, label);
  const verify = await verifyDownloaded(label, done.videoUrl, done.providerUrl);
  verify.durable = done.durable;
  verify.expectAudio = true;
  verify.lipSync = "manual_review_required";
  results.push(verify);
  return verify;
}

/** Tiny 64x64 JPEG for Veo tools */
function tinyJpegBase64() {
  // Minimal valid JPEG (1x1 pixel) — Veo may reject; prefer a real small face photo if present
  const local = join(OUT, "face.jpg");
  if (existsSync(local)) return readFileSync(local).toString("base64");
  // 1x1 red jpeg
  const b = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEhIQEBAQDxAQEBAQEA8QDxAQFRUWFhURExUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EADkQAAIBAwMDAgUCBQUBAAAAAAECAwAEERIhMQVBEyJRYXEygZGhBRQVQsHR8FJicoLhFv/EABkBAAMBAQEAAAAAAAAAAAAAAAECAwQABf/EACARAAICAQUBAQEAAAAAAAAAAAABAhEDEiExBBMiQWFx/9oADAMBAAIRAxEAPwD3+iiigD//2Q==",
    "base64",
  );
  return b.toString("base64");
}

async function pollVeo(pollPath, label, maxTries = 90) {
  const url = pollPath.startsWith("http") ? pollPath : `${PROD}${pollPath}`;
  for (let i = 1; i <= maxTries; i++) {
    const res = await fetch(url);
    const data = await res.json();
    log(`[${label}] veo poll ${i} status=${data.status} err=${data.error || ""}`);
    if (data.status === "completed" && data.videoUrl) return data;
    if (data.status === "failed") throw new Error(data.error || "veo failed");
    await sleep(8_000);
  }
  throw new Error(`${label}: veo timeout`);
}

async function verifyDataOrUrl(label, videoUrl, expectAudio) {
  const file = join(OUT, `${label}.mp4`);
  let buf;
  if (videoUrl.startsWith("data:")) {
    const m = videoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error("bad data url");
    buf = Buffer.from(m[2], "base64");
    writeFileSync(file, buf);
  } else {
    const dl = await download(videoUrl, file);
    buf = dl.buf;
  }
  const shape = looksLikeMp4(buf);
  const probe = shape.ok ? ffprobe(file) : { hasVideo: false, hasAudio: false, streams: [], stderr: shape.reason };
  const pass = shape.ok && probe.hasVideo && (!expectAudio || probe.hasAudio) && buf.length > 20_000;
  const row = {
    label,
    pass,
    playbackUrl: videoUrl.startsWith("data:") ? "data:video/mp4;base64,…" : videoUrl,
    http: 200,
    bytes: buf.length,
    isRealMp4: shape.ok,
    hasVideo: probe.hasVideo,
    hasAudio: probe.hasAudio,
    streams: probe.streams,
    expectAudio,
    lipSync: expectAudio ? "manual_review_required" : "n/a",
    notes: [!probe.hasAudio && expectAudio ? "NO AUDIO TRACK" : null].filter(Boolean),
  };
  results.push(row);
  return row;
}

async function testTalkingPhoto() {
  const label = "talking-photo";
  log(`\n=== ${label} ===`);
  // Prefer a real downloaded avatar still if available from site assets
  let imageBase64 = tinyJpegBase64();
  try {
    const imgRes = await fetch(`${PROD}/assets/talking-selfie.jpg`);
    if (imgRes.ok) {
      imageBase64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
      log(`[${label}] using site talking-selfie.jpg (${imageBase64.length} b64 chars)`);
    }
  } catch {
    /* fallback tiny */
  }
  const start = await fetch(`${PROD}/api/generate-avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType: "image/jpeg",
      prompt:
        'The person in the photo speaks clearly and audibly, lip-syncing: "Hello from Reelo talking photo production test."',
      action: "talking-photo",
    }),
  }).then((r) => r.json());
  if (!start.ok) throw new Error(`talking start: ${JSON.stringify(start)}`);
  const done = await pollVeo(start.poll, label);
  return verifyDataOrUrl(label, done.videoUrl, true);
}

async function testDancingPhoto() {
  const label = "dancing-photo";
  log(`\n=== ${label} ===`);
  let imageBase64 = tinyJpegBase64();
  try {
    const imgRes = await fetch(`${PROD}/assets/dancing.jpg`);
    if (imgRes.ok) imageBase64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  } catch {
    /* */
  }
  const start = await fetch(`${PROD}/api/generate-avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType: "image/jpeg",
      prompt: "The person dances energetically to clear upbeat music with an audible soundtrack.",
      action: "dancing-photo",
    }),
  }).then((r) => r.json());
  if (!start.ok) throw new Error(`dancing start: ${JSON.stringify(start)}`);
  const done = await pollVeo(start.poll, label);
  return verifyDataOrUrl(label, done.videoUrl, true);
}

async function testProductCommercial() {
  const label = "product-commercial";
  log(`\n=== ${label} ===`);
  let imageBase64 = tinyJpegBase64();
  try {
    const imgRes = await fetch(`${PROD}/assets/product.jpg`);
    if (imgRes.ok) imageBase64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  } catch {
    /* */
  }
  const start = await fetch(`${PROD}/api/product-commercial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType: "image/jpeg",
      look: "Studio",
      music: "Upbeat",
    }),
  }).then((r) => r.json());
  if (!start.ok && start.status !== "processing") {
    // some routes return ok+poll
    if (!start.poll && !start.operation) throw new Error(`product start: ${JSON.stringify(start)}`);
  }
  const poll = start.poll || `/api/product-commercial?op=${encodeURIComponent(start.operation)}`;
  const done = await pollVeo(poll, label);
  // Soundtrack is requested in the Veo prompt — require an audio track.
  return verifyDataOrUrl(label, done.videoUrl, true);
}

async function main() {
  log(`PROD=${PROD}`);
  log(`OUT=${OUT}`);

  // Reuse in-flight avatar job if provided
  const existingAvatar = process.env.AVATAR_VIDEO_ID;
  if (existingAvatar) {
    const done = await pollHeygen(existingAvatar, "ai-avatar-studio");
    const verify = await verifyDownloaded("ai-avatar-studio", done.videoUrl, done.providerUrl);
    verify.durable = done.durable;
    verify.expectAudio = true;
    verify.lipSync = "manual_review_required";
    results.push(verify);
  } else {
    await testAvatarStudio();
  }

  await testWebsiteCommercial();

  // Veo tools — may fail on quota / model; capture as blockers
  for (const fn of [testTalkingPhoto, testDancingPhoto, testProductCommercial]) {
    try {
      await fn();
    } catch (e) {
      results.push({
        label: fn.name.replace("test", "").replace(/([A-Z])/g, (m) => "-" + m.toLowerCase()).replace(/^-/, ""),
        pass: false,
        notes: [`BLOCKER: ${e.message}`],
        expectAudio: true,
      });
    }
  }

  const report = {
    at: new Date().toISOString(),
    prod: PROD,
    results,
    passed: results.filter((r) => r.pass).map((r) => r.label),
    failed: results.filter((r) => !r.pass),
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  log("\n=== REPORT ===");
  log(JSON.stringify(report, null, 2));
  if (report.failed.length) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
