#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates character avatars that HeyGen's catalog does not contain: fruit,
// vegetables, dragons, warlords, fantasy and other non-human characters.
//
// These are IMAGE avatars, not HeyGen talking-head avatars. They drive the
// Talking Photo tool (Gemini/Veo image-to-video), which animates any picture —
// so a dragon or a strawberry can speak. They cannot drive AI Avatar Studio,
// which needs a HeyGen avatarId.
//
//   node scripts/generate-characters.mjs            # generate missing only
//   node scripts/generate-characters.mjs --force    # regenerate everything
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const key = readFileSync(".env.local", "utf8").match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("GEMINI_API_KEY not found in .env.local");

const MODEL = "gemini-2.5-flash-image";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const FORCE = process.argv.includes("--force");
const OUT_DIR = path.join("public", "assets", "characters");
const CATALOG = path.join("src", "data", "character-avatars.json");

// Consistent house style so 500 of these still look like one library.
const STYLE =
  "Premium 3D character render, head-and-shoulders bust, centred, facing camera, " +
  "expressive friendly face with clear eyes and mouth suitable for lip-sync animation, " +
  "cinematic studio lighting with warm red and orange rim light, deep near-black background, " +
  "high detail, sharp, polished, professional quality, square 1:1 composition, " +
  "no text, no words, no watermark, no logo, no border.";

/** name, slug, primary category, secondary categories, tags */
const CHARACTERS = [
  // --- fruit ---------------------------------------------------------------
  ["Apple", "fruit", ["food"], ["fruit", "healthy", "red"]],
  ["Banana", "fruit", ["food"], ["fruit", "yellow"]],
  ["Orange", "fruit", ["food"], ["fruit", "citrus"]],
  ["Strawberry", "fruit", ["food"], ["fruit", "berry", "red"]],
  ["Watermelon", "fruit", ["food"], ["fruit", "summer"]],
  ["Pineapple", "fruit", ["food"], ["fruit", "tropical"]],
  ["Grapes", "fruit", ["food"], ["fruit", "purple"]],
  ["Lemon", "fruit", ["food"], ["fruit", "citrus", "yellow"]],
  ["Peach", "fruit", ["food"], ["fruit"]],
  ["Cherry", "fruit", ["food"], ["fruit", "berry", "red"]],
  ["Mango", "fruit", ["food"], ["fruit", "tropical"]],
  ["Avocado", "fruit", ["food", "healthy"], ["fruit", "green", "healthy"]],
  // --- vegetables ----------------------------------------------------------
  ["Carrot", "vegetables", ["food"], ["vegetable", "orange", "healthy"]],
  ["Broccoli", "vegetables", ["food", "healthy"], ["vegetable", "green", "healthy"]],
  ["Tomato", "vegetables", ["food"], ["vegetable", "red"]],
  ["Corn", "vegetables", ["food"], ["vegetable", "yellow"]],
  ["Potato", "vegetables", ["food"], ["vegetable"]],
  ["Bell Pepper", "vegetables", ["food"], ["vegetable", "red"]],
  ["Eggplant", "vegetables", ["food"], ["vegetable", "purple"]],
  ["Mushroom", "vegetables", ["food"], ["vegetable"]],
  ["Pumpkin", "vegetables", ["food", "holiday"], ["vegetable", "orange", "halloween"]],
  ["Onion", "vegetables", ["food"], ["vegetable"]],
  // --- prepared food -------------------------------------------------------
  ["Pizza Slice", "food", ["food"], ["pizza", "fast-food"]],
  ["Hamburger", "food", ["food"], ["burger", "fast-food"]],
  ["French Fries", "food", ["food"], ["fries", "fast-food"]],
  ["Hot Dog", "food", ["food"], ["fast-food"]],
  ["Coffee Cup", "food", ["food"], ["coffee", "drink"]],
  ["Ice Cream Cone", "food", ["food"], ["dessert", "sweet"]],
  ["Birthday Cake", "food", ["food", "holiday"], ["dessert", "birthday", "sweet"]],
  ["Donut", "food", ["food"], ["dessert", "bakery", "sweet"]],
  // --- dragons & fantasy ---------------------------------------------------
  ["Red Dragon", "dragons", ["fantasy", "characters"], ["dragon", "fire", "red"]],
  ["Ice Dragon", "dragons", ["fantasy", "characters"], ["dragon", "ice", "blue"]],
  ["Golden Dragon", "dragons", ["fantasy", "characters"], ["dragon", "gold"]],
  ["Baby Dragon", "dragons", ["fantasy", "characters"], ["dragon", "cute"]],
  ["Warlord", "warriors", ["fantasy", "characters"], ["warlord", "armour", "battle"]],
  ["Barbarian Warlord", "warriors", ["fantasy", "characters"], ["warlord", "barbarian"]],
  ["Armoured Knight", "warriors", ["fantasy", "characters", "historical"], ["knight", "armour"]],
  ["Viking Warrior", "warriors", ["fantasy", "characters", "historical"], ["viking", "warrior"]],
  ["Samurai", "warriors", ["characters", "historical"], ["samurai", "warrior"]],
  ["Wizard", "fantasy", ["characters"], ["wizard", "magic"]],
  ["Sorceress", "fantasy", ["characters"], ["witch", "magic", "female"]],
  ["Witch", "fantasy", ["characters", "holiday"], ["witch", "halloween", "magic"]],
  ["Elf Archer", "fantasy", ["characters"], ["elf", "archer"]],
  ["Orc Chieftain", "fantasy", ["characters"], ["orc", "monster"]],
  ["Phoenix", "fantasy", ["characters"], ["phoenix", "fire", "bird"]],
  ["Mermaid", "fantasy", ["characters"], ["mermaid", "ocean"]],
  // --- classic characters --------------------------------------------------
  ["Pirate Captain", "characters", ["fantasy", "historical"], ["pirate"]],
  ["Cowboy", "characters", ["historical"], ["cowboy", "western"]],
  ["Superhero", "superheroes", ["characters"], ["superhero", "cape"]],
  ["Supervillain", "villains", ["characters"], ["villain"]],
  ["Friendly Robot", "robots", ["characters", "sci-fi"], ["robot", "sci-fi"]],
  ["Alien Visitor", "aliens", ["characters", "sci-fi"], ["alien", "sci-fi"]],
  ["Vampire", "monsters", ["characters", "holiday"], ["vampire", "halloween"]],
  ["Zombie", "monsters", ["characters", "holiday"], ["zombie", "halloween"]],
  ["Friendly Ghost", "monsters", ["characters", "holiday"], ["ghost", "halloween"]],
  ["King", "royalty", ["characters", "historical"], ["king", "crown"]],
  ["Queen", "royalty", ["characters", "historical"], ["queen", "crown", "female"]],
  ["Princess", "royalty", ["characters", "fantasy"], ["princess", "female"]],
  // --- animals -------------------------------------------------------------
  ["Golden Retriever", "animals", ["mascots"], ["dog", "pet", "friendly"]],
  ["Tabby Cat", "animals", ["mascots"], ["cat", "pet"]],
  ["Lion", "animals", ["mascots"], ["lion", "jungle"]],
  ["Brown Bear", "animals", ["mascots"], ["bear", "forest"]],
  ["Red Fox", "animals", ["mascots"], ["fox", "forest"]],
  ["Wise Owl", "animals", ["mascots"], ["owl", "bird"]],
  ["Dolphin", "animals", ["mascots"], ["dolphin", "ocean"]],
  ["Shark", "animals", ["mascots"], ["shark", "ocean"]],
  ["T-Rex", "dinosaurs", ["animals", "characters"], ["dinosaur", "t-rex"]],
  ["Triceratops", "dinosaurs", ["animals", "characters"], ["dinosaur"]],
  ["Farm Cow", "animals", ["mascots"], ["cow", "farm"]],
  ["Rooster", "animals", ["mascots"], ["rooster", "farm", "bird"]],
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

mkdirSync(OUT_DIR, { recursive: true });

const existing = existsSync(CATALOG) ? JSON.parse(readFileSync(CATALOG, "utf8")) : [];
const byId = new Map(existing.map((a) => [a.avatarId, a]));

let made = 0;
let skipped = 0;
let failed = 0;

for (const [name, primary, secondary, tags] of CHARACTERS) {
  const slug = slugify(name);
  const file = path.join(OUT_DIR, `${slug}.webp`);
  const id = `char_${slug}`;

  if (!FORCE && existsSync(file) && byId.has(id)) {
    skipped++;
    continue;
  }

  process.stdout.write(`${name} … `);
  try {
    const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${STYLE} Subject: a characterful ${name} avatar with a friendly expressive face.` }] }],
        generationConfig: { temperature: 0.8 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(`FAILED ${res.status} ${String(data?.error?.message ?? "").slice(0, 90)}`);
      failed++;
      continue;
    }
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData || p.inline_data);
    const payload = img?.inlineData || img?.inline_data;
    if (!payload?.data) {
      console.log("no image returned");
      failed++;
      continue;
    }
    writeFileSync(file.replace(/\.webp$/, ".png"), Buffer.from(payload.data, "base64"));
    byId.set(id, {
      avatarId: id,
      name,
      gender: tags.includes("female") ? "female" : "",
      premium: false,
      image: `/assets/characters/${slug}.webp`,
      video: "",
      source: "reelo",
      primary,
      secondary,
      tags,
    });
    made++;
    console.log("ok");
  } catch (e) {
    console.log("error:", String(e).slice(0, 80));
    failed++;
  }
}

writeFileSync(CATALOG, JSON.stringify([...byId.values()], null, 2));
console.log(`\ndone — generated ${made}, skipped ${skipped}, failed ${failed}, catalog ${byId.size}`);
