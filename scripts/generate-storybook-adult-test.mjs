/**
 * Generate a 4-page adult personalization test book against production
 * (or PROD_URL) and save evidence + page screenshots.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { launch } from "puppeteer-core";

const PROD = process.env.PROD_URL || "https://www.myreelo.com";
const OUT = join(process.env.USERPROFILE || ".", "Documents/New folder/reelo/proof/storybook-adult");
mkdirSync(OUT, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p));

const submitted = {
  characterName: "Walter",
  idea: "An older gentleman looking for a nice woman",
  theme: "Wizard",
  languageCode: "en",
  pages: 4,
  debug: true,
};

async function loadAdultPhotoBase64() {
  // Prefer a site asset that looks adult; fall back to talking selfie / avatar.
  for (const path of ["/assets/avatar-business.jpg", "/assets/dancing.jpg", "/assets/talking-selfie.jpg"]) {
    const res = await fetch(PROD + path);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      return { base64: buf.toString("base64"), mimeType: "image/jpeg", source: path, bytes: buf.length };
    }
  }
  throw new Error("No photo asset available");
}

const photo = await loadAdultPhotoBase64();
console.log("photo", photo.source, photo.bytes);

const body = {
  photo: photo.base64,
  mimeType: photo.mimeType,
  characterName: submitted.characterName,
  childName: submitted.characterName,
  idea: submitted.idea,
  theme: submitted.theme,
  languageCode: submitted.languageCode,
  pages: submitted.pages,
  debug: true,
};

console.log("submitting to", PROD + "/api/storybook");
const res = await fetch(`${PROD}/api/storybook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(300_000),
});
const data = await res.json();
writeFileSync(join(OUT, "raw-response.json"), JSON.stringify({
  status: res.status,
  submittedForm: { ...submitted, photoSource: photo.source, photoBytes: photo.bytes },
  ok: data.ok,
  title: data.title,
  dedication: data.dedication,
  submitted: data.submitted,
  debug: data.debug,
  pages: (data.pages || []).map((p, i) => ({
    i: i + 1,
    text: p.text,
    illustration: p.illustration,
    hasImage: Boolean(p.image),
    imageBytes: p.image ? Math.floor(p.image.length * 0.75) : 0,
  })),
}, null, 2));

if (!res.ok || !data.ok) {
  console.error("FAILED", res.status, data);
  process.exit(2);
}

// Save page images
for (let i = 0; i < (data.pages || []).length; i++) {
  const img = data.pages[i].image;
  if (!img?.startsWith("data:")) continue;
  const b64 = img.split(",")[1];
  writeFileSync(join(OUT, `page-${i + 1}.png`), Buffer.from(b64, "base64"));
}

writeFileSync(
  join(OUT, "STORY_PROMPT.txt"),
  data.debug?.storyPrompt || "(debug prompts not returned — production may strip debug; check deploy)",
);
writeFileSync(
  join(OUT, "IMAGE_PROMPT_STRUCTURE.txt"),
  data.debug?.imagePromptStructure || "(missing)",
);

const topicHit = JSON.stringify(data).toLowerCase().includes("gentleman") ||
  JSON.stringify(data.pages?.map((p) => p.text).join(" ")).toLowerCase().match(/woman|love|companion|heart|meet|romance|kind/);
const childWizardLeak = /child wizard|bedtime|ages? 3|first day at (a )?new school|dummy|stabiliser/i.test(
  JSON.stringify(data.pages?.map((p) => p.text).join("\n") || ""),
);

const evidence = {
  at: new Date().toISOString(),
  prod: PROD,
  submittedForm: { ...submitted, photoSource: photo.source },
  storyPrompt: data.debug?.storyPrompt || null,
  imagePromptStructure: data.debug?.imagePromptStructure || null,
  title: data.title,
  pageTexts: (data.pages || []).map((p) => p.text),
  illustrated: data.illustrated,
  topicReflected: Boolean(topicHit),
  avoidedGenericChildBedtime: !childWizardLeak,
  pass: Boolean(data.ok && data.illustrated >= 3 && topicHit && !childWizardLeak),
};
writeFileSync(join(OUT, "EVIDENCE.json"), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));

// Screenshots via Chrome: render a simple HTML book
if (chrome) {
  const html = `<!DOCTYPE html><html><body style="margin:0;font-family:Georgia,serif;background:#111;color:#eee;padding:24px">
  <h1>${escapeHtml(data.title || "")}</h1>
  <p style="opacity:.7">${escapeHtml(data.dedication || "")}</p>
  <p style="font-size:13px;opacity:.55">Submitted: ${escapeHtml(submitted.idea)} · ${escapeHtml(submitted.theme)}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
  ${(data.pages || [])
    .map(
      (p, i) => `<article style="background:#1a1214;border-radius:12px;overflow:hidden">
      <img src="${p.image || ""}" style="width:100%;aspect-ratio:1;object-fit:cover;background:#000"/>
      <div style="padding:12px"><div style="font-size:11px;opacity:.4">PAGE ${i + 1}</div>
      <p style="font-size:15px;line-height:1.5">${escapeHtml(p.text || "")}</p></div></article>`,
    )
    .join("")}
  </div></body></html>`;
  const browser = await launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox"],
    defaultViewport: { width: 1100, height: 1400 },
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.screenshot({ path: join(OUT, "book-full.png"), fullPage: true });
  for (let i = 0; i < (data.pages || []).length; i++) {
    const handle = await page.$(`article:nth-of-type(${i + 1})`);
    if (handle) await handle.screenshot({ path: join(OUT, `page-${i + 1}-shot.png`) });
  }
  await browser.close();
}

console.log("OUT=" + OUT);
process.exit(evidence.pass ? 0 : 2);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
