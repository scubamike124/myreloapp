// Regenerates src/data/heygen-avatars.json from HeyGen's live catalog.
// The catalog endpoint is slow (~65s) so we snapshot it at build/dev time
// instead of fetching it in the request path. Run: npm run refresh:avatars
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "src", "data", "heygen-avatars.json");

async function keyFromEnv() {
  if (process.env.HEYGEN_API_KEY) return process.env.HEYGEN_API_KEY;
  // Fall back to .env.local so the script works without exporting the var.
  try {
    const env = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    return env.match(/^HEYGEN_API_KEY=(.+)$/m)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const key = await keyFromEnv();
if (!key) {
  console.error("HEYGEN_API_KEY not found (env or .env.local).");
  process.exit(1);
}

console.log("Fetching HeyGen avatar catalog (this takes ~60s)…");
const res = await fetch("https://api.heygen.com/v2/avatars", {
  headers: { "X-Api-Key": key },
  signal: AbortSignal.timeout(180000),
});
const data = await res.json();
if (!res.ok) {
  console.error("Failed:", data?.message || res.status);
  process.exit(1);
}

const avatars = (data?.data?.avatars ?? [])
  .filter((a) => a.avatar_id && a.preview_image_url)
  .map((a) => ({
    avatarId: a.avatar_id,
    name: a.avatar_name || "Avatar",
    gender: a.gender || "",
    premium: Boolean(a.premium),
    image: a.preview_image_url || "",
    video: a.preview_video_url || "",
  }));

await writeFile(OUT, JSON.stringify(avatars));
console.log(`Wrote ${avatars.length} avatars → ${path.relative(process.cwd(), OUT)}`);
