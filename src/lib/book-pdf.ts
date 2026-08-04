/**
 * Turn a finished storybook into a PDF the reader actually receives.
 *
 * The "Save as PDF" button called `window.print()`. On a desktop that opens a
 * print dialog where PDF is one destination among many; on a phone it usually
 * just offers printers. The button promised a file and delivered a print job,
 * which is what the owner reported.
 *
 * ## Why every page is drawn to a canvas
 *
 * Reelo writes books in 33 languages, including Arabic, Hebrew, Urdu, Hindi,
 * Bengali, Chinese, Japanese, Korean, Thai, Greek, Russian and Ukrainian.
 *
 * A PDF's built-in fonts (Helvetica, Times, Courier) are Latin-1 only. Writing
 * this text with them would produce blank boxes or mojibake for a third of the
 * supported languages — and a silently mangled children's book is worse than
 * the print dialog it replaced. Embedding a font that covers every one of those
 * scripts means shipping tens of megabytes to a phone.
 *
 * So the text is never handed to the PDF's font system. Each page is rendered
 * on a `<canvas>` with the browser's own text engine — the same one that is
 * already displaying the book correctly on screen, with the platform's fonts
 * and shaping for every script — and the finished canvas goes into the PDF as
 * an image.
 *
 * The trade is that the text is not selectable in the resulting file. For an
 * illustrated picture book that is the right way round: fidelity in every
 * language matters more than selectable text, and this is the only client-side
 * option that gets Arabic and Japanese right.
 *
 * ## Why client-side at all
 *
 * The app deploys to Cloudflare Workers (`opennextjs-cloudflare`), which cannot
 * run a headless browser, and `puppeteer-core` is a devDependency. Rendering
 * server-side would need Cloudflare's Browser Rendering add-on — a billing
 * decision, not a code change. Everything needed is already in the page: the
 * illustrations arrive as `data:` URLs, so there is nothing to fetch and no
 * cross-origin problem.
 */

export type BookPage = { text: string; image: string };

export type BookForPdf = {
  title: string;
  dedication: string;
  language: { code: string; name: string; endonym: string; rtl: boolean };
  pages: BookPage[];
};

/**
 * A4 at 150dpi, portrait. Big enough that the illustration still looks like a
 * picture book when printed, small enough that a twelve-page book does not
 * become a file nobody can email.
 */
const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 96;

const CREAM = "#fdfaf3";
const INK = "#241c16";
const SOFT_INK = "#6b5d52";

/**
 * Wrap text to a width, in a way that works for languages without spaces.
 *
 * Word wrapping alone breaks Chinese, Japanese and Thai, which have no spaces —
 * the whole paragraph becomes one "word" and runs off the page. So a token that
 * is itself too wide is broken character by character.
 */
export function wrapToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  const pushWrapped = (token: string) => {
    let current = "";
    for (const char of Array.from(token)) {
      if (ctx.measureText(current + char).width <= maxWidth || !current) current += char;
      else {
        lines.push(current);
        current = char;
      }
    }
    if (current) lines.push(current);
  };

  for (const paragraph of text.split(/\n+/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) continue;

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // A single token wider than the page — CJK paragraphs, or a very long
      // word — is broken by character rather than allowed to overflow.
      if (ctx.measureText(word).width > maxWidth) {
        pushWrapped(word);
        line = "";
      } else {
        line = word;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}

function newPageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not create a canvas to draw the book on.");
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = "top";
  return { canvas, ctx };
}

/** The font stack the book is displayed with, so the PDF matches the screen. */
const FONT_STACK =
  '"Georgia","Iowan Old Style","Palatino Linotype","Noto Serif","Noto Sans","Segoe UI",system-ui,sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    // The illustrations are data: URLs, so this never crosses an origin. Set
    // anyway so a future switch to hosted images fails visibly rather than
    // tainting the canvas and breaking the export silently.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, book: BookForPdf): void {
  const rtl = book.language?.rtl === true;
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;

  const centre = PAGE_W / 2;
  ctx.font = `bold 76px ${FONT_STACK}`;
  const titleLines = wrapToWidth(ctx, book.title || "Storybook", PAGE_W - MARGIN * 2);
  let y = PAGE_H * 0.32;
  for (const line of titleLines.slice(0, 4)) {
    ctx.fillText(line, centre, y);
    y += 92;
  }

  if (book.dedication) {
    ctx.font = `italic 34px ${FONT_STACK}`;
    ctx.fillStyle = SOFT_INK;
    y += 40;
    for (const line of wrapToWidth(ctx, book.dedication, PAGE_W - MARGIN * 3).slice(0, 4)) {
      ctx.fillText(line, centre, y);
      y += 48;
    }
  }

  ctx.font = `28px ${FONT_STACK}`;
  ctx.fillStyle = SOFT_INK;
  ctx.fillText("Made with Reelo", centre, PAGE_H - MARGIN - 28);
}

function drawStoryPage(
  ctx: CanvasRenderingContext2D,
  page: BookPage,
  img: HTMLImageElement | null,
  pageNumber: number,
  rtl: boolean,
): void {
  ctx.direction = rtl ? "rtl" : "ltr";

  const boxSize = PAGE_W - MARGIN * 2;
  const imageTop = MARGIN;

  if (img) {
    // Square crop, centred — the illustrations are square and the page is not,
    // so cover rather than stretch. A stretched face is worse than a cropped one.
    const scale = Math.max(boxSize / img.width, boxSize / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(MARGIN, imageTop, boxSize, boxSize);
    ctx.clip();
    ctx.drawImage(img, MARGIN + (boxSize - w) / 2, imageTop + (boxSize - h) / 2, w, h);
    ctx.restore();
  } else {
    // A page whose illustration failed still belongs in the book — the story is
    // complete without it, and the app already tells the reader which pages
    // could not be drawn. An empty frame is honest; a missing page is not.
    ctx.fillStyle = "#efe7d9";
    ctx.fillRect(MARGIN, imageTop, boxSize, boxSize);
    ctx.fillStyle = SOFT_INK;
    ctx.textAlign = "center";
    ctx.font = `italic 30px ${FONT_STACK}`;
    ctx.fillText("(this page could not be illustrated)", PAGE_W / 2, imageTop + boxSize / 2 - 15);
  }

  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = INK;
  ctx.font = `36px ${FONT_STACK}`;
  const textX = rtl ? PAGE_W - MARGIN : MARGIN;
  let y = imageTop + boxSize + 64;
  for (const line of wrapToWidth(ctx, page.text || "", PAGE_W - MARGIN * 2)) {
    if (y > PAGE_H - MARGIN - 60) break;
    ctx.fillText(line, textX, y);
    y += 52;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = SOFT_INK;
  ctx.font = `26px ${FONT_STACK}`;
  ctx.fillText(String(pageNumber), PAGE_W / 2, PAGE_H - MARGIN - 10);
}

/**
 * Flatten a series of episodes into one book.
 *
 * A `Scene` is `{ text, image }` — the same shape as a `Page` — so the whole
 * renderer works unchanged and there is no second layout to keep in step.
 *
 * Episodes whose format is `video` are included too. Their scenes are the
 * storyboard, which is exactly what "save the series" means for something you
 * watch rather than read: the video itself lives at its own URL and does not
 * belong inside a PDF.
 */
export function seriesToBook(params: {
  characterName: string;
  language: BookForPdf["language"];
  episodes: {
    episodeNumber: number;
    title: string;
    synopsis: string;
    cliffhanger: string;
    format?: "ebook" | "video";
    scenes: BookPage[];
  }[];
}): BookForPdf {
  const pages: BookPage[] = [];
  for (const ep of params.episodes) {
    // A title card per episode, so a reader can tell where one ends and the
    // next begins — a flat run of scenes reads as one long muddle.
    pages.push({
      text: `Episode ${ep.episodeNumber} — ${ep.title}\n\n${ep.synopsis}`,
      image: "",
    });
    for (const scene of ep.scenes ?? []) pages.push(scene);
    if (ep.cliffhanger) pages.push({ text: ep.cliffhanger, image: "" });
  }

  return {
    title: params.characterName ? `${params.characterName} — the series` : "The series",
    dedication: `${params.episodes.length} episode${params.episodes.length === 1 ? "" : "s"}`,
    language: params.language,
    pages,
  };
}

/** A filename a person can find again, from a title in any script. */
export function pdfFilename(title: string): string {
  const cleaned = (title || "storybook")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return `${cleaned || "storybook"}.pdf`;
}

/**
 * Build the PDF and hand it to the browser as a download.
 *
 * `jspdf` is imported dynamically so it is fetched when someone exports a book
 * rather than by everyone who loads the page.
 */
export async function downloadBookPdf(book: BookForPdf): Promise<void> {
  if (!book?.pages?.length) throw new Error("There is no book to save yet.");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "px", format: [PAGE_W, PAGE_H], orientation: "portrait" });
  const rtl = book.language?.rtl === true;

  const cover = newPageCanvas();
  drawCover(cover.ctx, book);
  pdf.addImage(cover.canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, PAGE_W, PAGE_H);

  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i]!;
    const img = await loadImage(page.image);
    const { canvas, ctx } = newPageCanvas();
    drawStoryPage(ctx, page, img, i + 1, rtl);
    pdf.addPage([PAGE_W, PAGE_H], "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, PAGE_W, PAGE_H);
  }

  pdf.save(pdfFilename(book.title));
}
