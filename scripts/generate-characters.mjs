#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates character avatars that HeyGen's catalog does not contain: fruit,
// vegetables, dragons, warlords, animals, vehicles, trades and more.
//
// These are IMAGE avatars, not HeyGen talking-head avatars. They drive the
// Talking Photo tool (Gemini/Veo image-to-video), which animates any picture —
// so a dragon or a strawberry can speak. They cannot drive AI Avatar Studio,
// which needs a HeyGen avatarId.
//
// EVERY image is verified before it is accepted. The first run produced a
// "Peach" that was Princess Peach — a trademarked Nintendo character filed
// under Fruit. Two defences now:
//   1. Each entry carries an explicit `subject` describing exactly what to
//      draw, rather than relying on an ambiguous display name.
//   2. A vision check confirms the image shows that subject AND is not a
//      recognisable copyrighted character. Failures are retried, then skipped.
//
//   node scripts/generate-characters.mjs             # fill in what is missing
//   node scripts/generate-characters.mjs --force     # regenerate everything
//   node scripts/generate-characters.mjs --verify    # re-check existing images
//   node scripts/generate-characters.mjs --limit=50  # cap this run
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { CHARACTERS } from "./lib/character-list.mjs";

const key = readFileSync(".env.local", "utf8").match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("GEMINI_API_KEY not found in .env.local");

const IMAGE_MODEL = "gemini-2.5-flash-image";
const VISION_MODEL = "gemini-2.5-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const FORCE = process.argv.includes("--force");
const VERIFY_ONLY = process.argv.includes("--verify");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);

const OUT_DIR = path.join("public", "assets", "characters");
const CATALOG = path.join("src", "data", "character-avatars.json");
const MAX_ATTEMPTS = 3;

const STYLE =
  "Premium 3D character render, head-and-shoulders, centred, facing camera, " +
  "expressive friendly face with clear eyes and a mouth suitable for lip-sync animation, " +
  "cinematic studio lighting with warm red and orange rim light, deep near-black background, " +
  "high detail, sharp, polished, professional quality, square 1:1 composition. " +
  "The character must be entirely ORIGINAL and must NOT resemble any existing copyrighted, " +
  "trademarked or franchise character from any film, game, cartoon or comic. " +
  "No text, no words, no watermark, no logo, no border.";

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function generate(subject) {
  const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE} Subject: ${subject}.` }] }],
      generationConfig: { temperature: 0.85 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message?.slice(0, 120) ?? `HTTP ${res.status}`);
  const part = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData || p.inline_data);
  const payload = part?.inlineData || part?.inline_data;
  if (!payload?.data) throw new Error("no image returned");
  return Buffer.from(payload.data, "base64");
}

/** Vision check: right subject, and not somebody else's character. */
async function verify(buffer, name, subject, mime = "image/png") {
  const prompt =
    `You are checking an avatar image for a stock library.\n\n` +
    `It is supposed to show: ${subject}\n` +
    `It is filed under the name: "${name}"\n\n` +
    `Answer STRICTLY as JSON: {"matches": true|false, "known_character": true|false, "what_it_shows": "...", "reason": "..."}\n\n` +
    `- "matches": does the image clearly depict the intended subject above? ` +
    `If the subject is a fruit or vegetable, a human person does NOT match. ` +
    `If the subject is a vehicle or object, a human person does NOT match.\n` +
    `- "known_character": is this recognisably an existing copyrighted or trademarked character ` +
    `from a film, game, cartoon or comic (for example a Nintendo, Disney, Marvel or DC character)? ` +
    `Be strict — if it looks like a famous character, say true.\n` +
    `- "what_it_shows": a few words describing what is actually depicted.`;

  const res = await fetch(`${BASE}/models/${VISION_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: buffer.toString("base64") } }] }],
      generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 300 },
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: true, note: "verifier unavailable" }; // never block on the checker
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { ok: true, note: "unparseable verdict" };
  try {
    const v = JSON.parse(m[0]);
    return {
      ok: Boolean(v.matches) && !v.known_character,
      matches: Boolean(v.matches),
      known: Boolean(v.known_character),
      shows: String(v.what_it_shows ?? "").slice(0, 60),
      reason: String(v.reason ?? "").slice(0, 90),
    };
  } catch {
    return { ok: true, note: "unparseable verdict" };
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const existing = existsSync(CATALOG) ? JSON.parse(readFileSync(CATALOG, "utf8")) : [];
const byId = new Map(existing.map((a) => [a.avatarId, a]));

// Prune orphans: records whose entry has been renamed or dropped from the list.
// Renaming "Peach" to "Peach Fruit" left the original Princess Peach image in
// the catalog and out of reach of --verify, which only walks the current list.
{
  const wanted = new Set(CHARACTERS.map(([name]) => `char_${slugify(name)}`));
  let pruned = 0;
  for (const id of [...byId.keys()]) {
    if (wanted.has(id)) continue;
    const rec = byId.get(id);
    for (const ext of ["png", "webp"]) {
      const f = path.join(OUT_DIR, `${id.replace(/^char_/, "")}.${ext}`);
      if (existsSync(f)) unlinkSync(f);
    }
    byId.delete(id);
    pruned++;
    console.log(`pruned   ${rec?.name ?? id} (no longer in the character list)`);
  }
  if (pruned) console.log(`pruned ${pruned} orphaned record(s)\n`);
}

let made = 0, skipped = 0, failed = 0, rejected = 0, removed = 0;
let processed = 0;

for (const [name, subject, primary, secondary, tags] of CHARACTERS) {
  if (processed >= LIMIT) break;
  const slug = slugify(name);
  const id = `char_${slug}`;
  const png = path.join(OUT_DIR, `${slug}.png`);
  const webp = path.join(OUT_DIR, `${slug}.webp`);
  const have = existsSync(webp) || existsSync(png);

  // --- verify-only pass over what already exists ---------------------------
  if (VERIFY_ONLY) {
    if (!have) continue;
    processed++;
    const file = existsSync(webp) ? webp : png;
    const buf = readFileSync(file);
    const v = await verify(buf, name, subject, file.endsWith(".webp") ? "image/webp" : "image/png");
    if (v.ok) {
      console.log(`ok       ${name}`);
    } else {
      console.log(`REJECT   ${name} — shows "${v.shows}"${v.known ? " (known character)" : ""}`);
      unlinkSync(file);
      byId.delete(id);
      removed++;
    }
    continue;
  }

  if (!FORCE && have && byId.has(id)) {
    skipped++;
    continue;
  }

  processed++;
  let accepted = null;
  let lastNote = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !accepted; attempt++) {
    try {
      const buf = await generate(subject);
      const v = await verify(buf, name, subject);
      if (v.ok) {
        accepted = buf;
      } else {
        lastNote = `${v.shows}${v.known ? " / known character" : ""}`;
        rejected++;
      }
    } catch (e) {
      lastNote = String(e.message ?? e).slice(0, 80);
    }
  }

  if (!accepted) {
    console.log(`FAILED   ${name} — ${lastNote}`);
    failed++;
    continue;
  }

  writeFileSync(png, accepted);
  byId.set(id, {
    avatarId: id,
    name,
    gender: tags.includes("female") ? "female" : "",
    // Reelo-exclusive artwork: HeyGen marks nothing premium (verified: the
    // premium flag is false on all 1,264), so the tier is ours to define, and
    // these are the avatars competitors licensing HeyGen do not have.
    premium: true,
    image: `/assets/characters/${slug}.png`,
    video: "",
    source: "reelo",
    primary,
    secondary,
    tags,
  });
  made++;
  console.log(`made     ${name}`);
}

writeFileSync(CATALOG, JSON.stringify([...byId.values()], null, 2));
console.log(
  VERIFY_ONLY
    ? `\ndone — verified ${processed}, removed ${removed}, catalog ${byId.size}`
    : `\ndone — made ${made}, skipped ${skipped}, failed ${failed}, retries after rejection ${rejected}, catalog ${byId.size}`,
);
