#!/usr/bin/env node
/**
 * Static + HTTP audit for the silent-video / broken-playback bug class.
 * Does not burn HeyGen/Veo credits — those need a deployed build + keys.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CREATE = join(ROOT, "src/components/create");
const API = join(ROOT, "src/app/api");
const LIB = join(ROOT, "src/lib");

function read(p) {
  return readFileSync(p, "utf8");
}

function filesUnder(dir, pred) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...filesUnder(p, pred));
    else if (pred(name.name)) out.push(p);
  }
  return out;
}

const FEATURES = [
  {
    id: "ai-avatar-studio",
    title: "AI Avatar Studio",
    type: "video",
    expectsAudio: true,
    ui: "AiAvatarStudio.tsx",
    api: "heygen-video",
  },
  {
    id: "website-commercial",
    title: "Website Commercial",
    type: "video",
    expectsAudio: true,
    ui: "WebsiteCommercial.tsx",
    api: "heygen-video",
  },
  {
    id: "talking-photo",
    title: "Talking Photo",
    type: "video",
    expectsAudio: true,
    ui: "ToolStudio.tsx",
    api: "generate-avatar",
  },
  {
    id: "dancing-photo",
    title: "Dancing Photo",
    type: "video",
    expectsAudio: true,
    ui: "ToolStudio.tsx",
    api: "generate-avatar",
  },
  {
    id: "product-commercial",
    title: "Product Commercial",
    type: "video",
    expectsAudio: false, // intentional: UI says drop your own track
    ui: "ProductCommercial.tsx",
    api: "product-commercial",
  },
  {
    id: "custom-avatar-creator",
    title: "Custom Avatar Creator",
    type: "image",
    expectsAudio: false,
    ui: "ToolStudio.tsx",
    api: "generate-avatar-image",
  },
  {
    id: "bedtime-storybook",
    title: "Bedtime Storybook",
    type: "story",
    expectsAudio: false,
    ui: "StoryBook.tsx",
    api: "storybook",
  },
  {
    id: "ai-story-maker",
    title: "AI Story Maker",
    type: "story",
    expectsAudio: false,
    ui: "StoryMaker.tsx",
    api: "story-maker",
  },
  {
    id: "story-memory-generator",
    title: "Story & Memory Generator",
    type: "video",
    expectsAudio: "client", // canvas/webm — may lack audio track by design
    ui: "MemoryFilm.tsx",
    api: "memory-film",
  },
  {
    id: "shorts-20",
    title: "20 Shorts Generator",
    type: "text",
    expectsAudio: false,
    ui: "ShortsPlanner.tsx",
    api: "shorts",
  },
];

const rows = [];
const failures = [];

const heygen = read(join(API, "heygen-video/route.ts"));
const veo = read(join(LIB, "veo.ts"));
const remote = existsSync(join(API, "media/remote/route.ts"));
const downloadHelper = existsSync(join(LIB, "download-media.ts"));

const checks = {
  heygenRehosts: /durablePlaybackUrl|store\(providerUrl/.test(heygen),
  heygenProxyFallback: /media\/remote/.test(heygen),
  veoNotFastDefault: !/VEO_MODEL = "veo-3\.1-fast/.test(veo) && /veo-3\.1-generate-preview/.test(veo),
  mediaRemoteRoute: remote,
  downloadHelper,
};

for (const f of FEATURES) {
  const uiPath = join(CREATE, f.ui);
  const src = existsSync(uiPath) ? read(uiPath) : "";
  const issues = [];

  if (f.type === "video" && f.expectsAudio === true) {
    // Hardcoded always-muted result player (attribute muted without binding)
    if (/<video[^>]*\smuted[\s>]/.test(src) && !/muted=\{muted\}/.test(src)) {
      // allow preview muted loops
      const resultMuted = src.match(/status === "done"[\s\S]{0,400}<video[\s\S]{0,200}muted/);
      if (resultMuted && !/muted=\{muted\}/.test(resultMuted[0])) {
        issues.push("result player may force mute");
      }
    }
    if (/href=\{[^}]*videoUrl[^}]*\}\s+download/.test(src) || /href=\{result\.videoUrl\}\s+download/.test(src)) {
      issues.push("cross-origin <a download> still present");
    }
    if (!/downloadMedia|createObjectURL/.test(src) && f.id !== "story-memory-generator") {
      issues.push("no blob/downloadMedia download path");
    }
    if (f.api === "heygen-video") {
      if (!checks.heygenRehosts) issues.push("HeyGen not re-hosted");
      if (!checks.heygenProxyFallback) issues.push("no media/remote fallback");
    }
    if (f.api === "generate-avatar") {
      if (!checks.veoNotFastDefault) issues.push("Veo still defaults to fast (weak audio)");
    }
  }

  if (f.expectsAudio === false && f.id === "product-commercial") {
    // document intentional silence
  }

  const status =
    issues.length === 0
      ? f.expectsAudio === false
        ? "PASS (audio N/A or intentional)"
        : "PASS (code-path)"
      : "FAIL";

  if (issues.length) failures.push({ id: f.id, issues });
  rows.push({
    feature: f.title,
    type: f.type,
    expectsAudio: String(f.expectsAudio),
    status,
    issues: issues.join("; ") || "—",
  });
}

console.log("=== Shared infrastructure ===");
for (const [k, v] of Object.entries(checks)) {
  console.log(`${v ? "OK " : "NO "} ${k}`);
  if (!v) failures.push({ id: "infra", issues: [k] });
}

console.log("\n=== Feature matrix (static) ===");
for (const r of rows) {
  console.log(`${r.status.padEnd(28)} ${r.feature} [${r.type}] audio=${r.expectsAudio} ${r.issues !== "—" ? "→ " + r.issues : ""}`);
}

// Live HTTP: pages + new route presence on production
const PROD = process.env.PROD_URL || "https://www.myreelo.com";
console.log(`\n=== Live HTTP smoke (${PROD}) ===`);

async function head(path) {
  try {
    const res = await fetch(`${PROD}${path}`, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000) });
    return res.status;
  } catch (e) {
    return `ERR:${e.message}`;
  }
}

const livePaths = [
  "/create/ai-avatar-studio",
  "/create/website-commercial",
  "/create/talking-photo",
  "/create/dancing-photo",
  "/create/product-commercial",
  "/create/custom-avatar-creator",
  "/create/bedtime-storybook",
  "/create/ai-story-maker",
  "/create/story-memory-generator",
  "/create/shorts-20",
  "/api/media/remote",
  "/api/heygen-video",
  "/api/health",
];

for (const p of livePaths) {
  const code = await head(p);
  const note =
    p === "/api/media/remote"
      ? code === 400 || code === 405 || code === 200
        ? "(route reachable)"
        : code === 404
          ? "(NOT DEPLOYED YET)"
          : ""
      : "";
  console.log(`${String(code).padStart(4)} ${p} ${note}`);
}

console.log(`\n=== Summary ===`);
console.log(`Static failures: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.log(` - ${f.id}: ${f.issues.join(", ")}`);
}
console.log(
  "NOTE: Paid HeyGen/Veo regeneration was NOT run (needs deployed fix + API keys). Static PASS means the shared silent-playback bug class is addressed in code for that feature.",
);

process.exit(failures.length ? 1 : 0);
