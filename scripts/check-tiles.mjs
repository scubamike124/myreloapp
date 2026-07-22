// Vision pass over the generated tiles: any stray text, or a subject that does
// not match what the card claims, at a size too small to eyeball in the grid.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const key = process.env.GEMINI_API_KEY ?? env.match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const DIR = path.join("public", "assets", "tiles");

const files = readdirSync(DIR).filter((f) => f.endsWith(".webp"));
const bad = [];

for (const f of files) {
  const data = readFileSync(path.join(DIR, f)).toString("base64");
  const prompt =
    `This is artwork for a UI card called "${f.replace(/\.webp$/, "").replace(/-/g, " ")}".\n` +
    `Answer STRICTLY as JSON: {"has_text": true|false, "text_seen": "...", "matches_subject": true|false}\n` +
    `- "has_text": does the image contain ANY readable letters, words, numbers or a hex code? ` +
    `Abstract shapes and icon glyphs are not text. Be strict.\n` +
    `- "matches_subject": does the artwork plausibly illustrate that card name?`;
  try {
    const res = await fetch(`${BASE}/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/webp", data } }] }],
        generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 300 },
      }),
    });
    const j = await res.json();
    const t = (j?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const v = JSON.parse(t.match(/\{[\s\S]*\}/)[0]);
    if (v.has_text || !v.matches_subject) {
      bad.push(`${f.padEnd(26)} text=${v.has_text ? JSON.stringify(v.text_seen) : "no"} matches=${v.matches_subject}`);
    }
  } catch (e) {
    bad.push(`${f.padEnd(26)} check failed: ${e.message.slice(0, 60)}`);
  }
}

console.log(`checked ${files.length} tiles`);
console.log(bad.length ? "PROBLEMS:\n  " + bad.join("\n  ") : "  all clean — no text, all on-subject");
