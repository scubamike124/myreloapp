import { writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PROD = "https://www.myreelo.com";
const OUT = join(process.env.TEMP || "/tmp", "reelo-prod-verify");
mkdirSync(OUT, { recursive: true });

function ffprobe(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const streams = (r.stdout || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const p = l.split(",");
      return { name: p[0], type: p[1] };
    });
  return {
    streams,
    hasVideo: streams.some((s) => s.type === "video"),
    hasAudio: streams.some((s) => s.type === "audio"),
  };
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

const imgRes = await fetch(`${PROD}/assets/talking-selfie.jpg`);
const imageBase64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
console.log("image ready", imageBase64.length);

for (let attempt = 1; attempt <= 3; attempt++) {
  console.log("attempt", attempt);
  const start = await fetch(`${PROD}/api/generate-avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      mimeType: "image/jpeg",
      prompt:
        'The person looks into the camera and speaks clearly with audible dialogue, lip-syncing the words: "Hello from Reelo. This talking photo production test confirms audio and lip sync."',
      action: "talking-photo",
    }),
  }).then((r) => r.json());

  console.log("start", { ok: start.ok, error: start.error, poll: start.poll });
  if (!start.ok) continue;

  let done = null;
  for (let i = 1; i <= 90; i++) {
    await sleep(8000);
    const d = await fetch(`${PROD}${start.poll}`).then((r) => r.json());
    console.log("poll", i, d.status, d.error || "");
    if (d.status === "completed" && d.videoUrl) {
      done = d;
      break;
    }
    if (d.status === "failed") break;
  }
  if (!done) continue;

  const m = done.videoUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    console.log("unexpected url type");
    continue;
  }
  const buf = Buffer.from(m[2], "base64");
  const file = join(OUT, "talking-photo-retry.mp4");
  writeFileSync(file, buf);
  const probe = ffprobe(file);
  const head = buf.slice(4, 8).toString("ascii");
  const pass = head === "ftyp" && probe.hasVideo && probe.hasAudio && buf.length > 20000;
  console.log(JSON.stringify({ pass, bytes: buf.length, head, ...probe }, null, 2));
  if (pass) process.exit(0);
}

process.exit(2);
