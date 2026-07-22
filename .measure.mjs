import { readFileSync } from "node:fs";
const K = readFileSync(".env.local","utf8").match(/^HEYGEN_API_KEY=(.+)$/m)?.[1]?.trim();
const quota = async () => (await (await fetch("https://api.heygen.com/v2/user/remaining_quota",{headers:{"X-Api-Key":K}})).json())?.data?.remaining_quota;

const before = await quota();
console.log("credits before:", before);

// ~30 seconds of speech at a natural pace (~2.7 words/sec => ~80 words).
const script = "Welcome to Reelo, the fastest way to turn your ideas into finished video. "
  + "Upload a photo, paste a website, or just describe what you want, and our AI writes the script, "
  + "picks the voice, and renders the whole thing for you. No editing software, no timeline, no camera crew. "
  + "Thousands of avatars are ready to present your message in any language you need. "
  + "Start creating today and see your first video in minutes.";
console.log("script words:", script.split(/\s+/).length);

const t0 = Date.now();
const start = await fetch("http://localhost:3000/api/heygen-video", {
  method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ script }),
});
const s = await start.json();
if (!start.ok || !s.ok) { console.log("start failed:", JSON.stringify(s).slice(0,200)); process.exit(1); }
console.log("started, video id:", s.videoId);

let status = "";
for (let i = 0; i < 180; i++) {
  await new Promise(r => setTimeout(r, 5000));
  const r = await fetch(`http://localhost:3000/api/heygen-video?video_id=${s.videoId}`);
  const d = await r.json();
  status = d.status;
  if (status === "completed") { console.log("completed in", Math.round((Date.now()-t0)/1000)+"s"); break; }
  if (status === "failed") { console.log("FAILED:", JSON.stringify(d.error).slice(0,200)); break; }
}
const after = await quota();
console.log("credits after:", after);
console.log("credits used:", before - after);
