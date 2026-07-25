/**
 * Re-run adult storybook generation; save page PNGs without Puppeteer setContent
 * (huge data-URI HTML times out).
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

const PHOTO_PATH = "/assets/dancing-grandpa.jpg"; // older man — matches adult romance scenario

const submitted = {
  characterName: "Walter",
  idea: "An older gentleman looking for a nice woman",
  theme: "Wizard",
  languageCode: "en",
  pages: 4,
  debug: true,
  photoSource: PHOTO_PATH,
};

const photoRes = await fetch(`${PROD}${PHOTO_PATH}`);
const photoBuf = Buffer.from(await photoRes.arrayBuffer());
const body = {
  photo: photoBuf.toString("base64"),
  mimeType: "image/jpeg",
  characterName: submitted.characterName,
  childName: submitted.characterName,
  idea: submitted.idea,
  theme: submitted.theme,
  languageCode: submitted.languageCode,
  pages: submitted.pages,
  debug: true,
};

console.log("generating…");
const res = await fetch(`${PROD}/api/storybook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(420_000),
});
const data = await res.json();
if (!res.ok || !data.ok) {
  console.error(data);
  process.exit(2);
}

writeFileSync(
  join(OUT, "meta.json"),
  JSON.stringify(
    {
      submittedForm: { ...submitted, photoBytes: photoBuf.length },
      submittedEcho: data.submitted,
      debug: data.debug,
      title: data.title,
      dedication: data.dedication,
      pageTexts: data.pages.map((p) => p.text),
      illustrated: data.illustrated,
    },
    null,
    2,
  ),
);
writeFileSync(join(OUT, "STORY_PROMPT.txt"), data.debug?.storyPrompt || "");
writeFileSync(join(OUT, "IMAGE_PROMPT_STRUCTURE.txt"), data.debug?.imagePromptStructure || "");

for (let i = 0; i < data.pages.length; i++) {
  const img = data.pages[i].image;
  if (!img?.startsWith("data:")) {
    console.log("missing image page", i + 1);
    continue;
  }
  const b64 = img.slice(img.indexOf(",") + 1);
  const file = join(OUT, `page-${i + 1}.png`);
  writeFileSync(file, Buffer.from(b64, "base64"));
  console.log("wrote", file, Buffer.from(b64, "base64").length);
}

// Screenshot each saved PNG via file:// so we get "page shots" for the user.
if (chrome) {
  const browser = await launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--allow-file-access-from-files"],
    defaultViewport: { width: 900, height: 1100 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);
  for (let i = 1; i <= data.pages.length; i++) {
    const png = join(OUT, `page-${i}.png`).replace(/\\/g, "/");
    const text = data.pages[i - 1].text.replace(/</g, "&lt;");
    const html = `<!DOCTYPE html><html><body style="margin:0;background:#0e0709;color:#fff;font-family:Georgia,serif">
      <img src="file:///${png}" style="width:100%;display:block;aspect-ratio:1;object-fit:cover"/>
      <div style="padding:20px"><div style="opacity:.4;font-size:11px;letter-spacing:.08em">PAGE ${i}</div>
      <p style="font-size:18px;line-height:1.55">${text}</p></div></body></html>`;
    await page.setContent(html, { waitUntil: "load", timeout: 120_000 });
    await page.screenshot({ path: join(OUT, `page-${i}-shot.png`), fullPage: true });
    console.log("shot page", i);
  }
  // Composite strip
  const all = data.pages
    .map((_, i) => {
      const png = join(OUT, `page-${i + 1}.png`).replace(/\\/g, "/");
      return `<div style="break-inside:avoid;margin-bottom:24px;background:#1a1214;border-radius:12px;overflow:hidden">
        <img src="file:///${png}" style="width:100%;aspect-ratio:1;object-fit:cover;display:block"/>
        <div style="padding:14px"><b>Page ${i + 1}</b><p>${data.pages[i].text.replace(/</g, "&lt;")}</p></div></div>`;
    })
    .join("");
  await page.setViewport({ width: 720, height: 900 });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#111;color:#eee;font-family:Georgia,serif">
    <h1>${data.title}</h1><p style="opacity:.7">${data.dedication}</p>
    <p style="font-size:13px;opacity:.5">Submitted: ${submitted.idea} · ${submitted.theme}</p>${all}</body></html>`,
    { waitUntil: "load", timeout: 120_000 },
  );
  await page.screenshot({ path: join(OUT, "book-full.png"), fullPage: true });
  await browser.close();
}

const pass = data.illustrated === 4 && /woman|compan|heart|yearn|connection/i.test(data.pages.map((p) => p.text).join(" "));
writeFileSync(
  join(OUT, "EVIDENCE.json"),
  JSON.stringify(
    {
      pass,
      title: data.title,
      dedication: data.dedication,
      illustrated: data.illustrated,
      submittedForm: submitted,
      submittedEcho: data.submitted,
      storyPrompt: data.debug?.storyPrompt,
      imagePromptStructure: data.debug?.imagePromptStructure,
      pageTexts: data.pages.map((p) => p.text),
      files: ["page-1.png", "page-2.png", "page-3.png", "page-4.png", "page-1-shot.png", "page-2-shot.png", "page-3-shot.png", "page-4-shot.png", "book-full.png"],
    },
    null,
    2,
  ),
);
console.log("OUT=" + OUT);
console.log("pass=" + pass);
process.exit(pass ? 0 : 2);
