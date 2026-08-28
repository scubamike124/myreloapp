// ---------------------------------------------------------------------------
// Stage 6 — cutting the commercial, in the browser.
//
// Concatenating video normally means ffmpeg on a server with a filesystem, and
// this app is built to run on Cloudflare Workers, which has neither. Memory
// Film already solved it the other way round: draw to a canvas, record the
// canvas. That path is reused here, so assembly costs nothing to run and adds
// no infrastructure.
//
// It does more than concatenate. Most shots arrive as stills, because a still
// costs four cents against sixty for the same shot as generated video, and the
// movement is put back here — a push-in, a pan, a rack focus are arithmetic on
// a source rectangle, and arithmetic does not hallucinate a sixth finger. The
// moves are not decoration chosen at random: each one is the move the board
// already specified for that shot and the validator already checked belonged to
// that beat.
//
// What comes back is silent. The board's voiceover and music are written and
// shown, but nothing here speaks them — text-to-speech is a separate provider
// and a separate decision.
// ---------------------------------------------------------------------------

export type Clip = {
  /** Empty for a presenter segment — that footage comes from the narration. */
  url: string;
  /**
   * "still"     — a generated frame, given a camera move here.
   * "video"     — a generated clip, played as shot.
   * "presenter" — cut back to the person speaking, taken from the narration.
   */
  kind: "still" | "video" | "presenter";
  /** How long this shot holds in the cut. */
  seconds: number;
  onScreenText: string;
  /** The spoken line, burned in as a caption while this shot is on screen. */
  caption?: string;
  /**
   * A standing label at the top of frame — "Demo · Sunny Grove Juice Bar".
   *
   * When an advert for Reelo shows commercials Reelo made, the viewer is
   * entitled to know whose business each one is for. Work made for a real
   * customer is named; work made for an invented one is marked as a demo, so
   * nobody mistakes a fictional juice bar for a reference. It sits at the top,
   * away from the caption, and stays up for the whole shot.
   */
  tag?: string;
  /** One of the DNA's camera moves. Drives the move applied to a still. */
  cameraMove: string;
  transitionOut: string;
  /**
   * True when the shot is the product's own interface.
   *
   * Two things follow. The brand badge is suppressed, because Reelo's UI
   * already carries the Reelo logo in its own header and a second one lands on
   * top of the page's headline. And the grade is eased off, because the
   * interface is near-black already.
   */
  productUi?: boolean;
  /**
   * Where to start inside the source clip, in seconds.
   *
   * A screen recording does not always have its subject at the front: the
   * storyboard capture opens on the finished video and only scrolls down to the
   * board a few seconds in, so playing it from zero put "Writes the script"
   * across a Download button. An in-point is the edit-suite answer — use the
   * part of the take that shows the thing.
   */
  startAt?: number;
};

export type Brand = {
  name: string;
  /** Hex. Drives the logo badge and the call to action. */
  color: string;
};

export type AssembleOptions = {
  clips: Clip[];
  /**
   * The closing card. By default it hangs over the last shot; with `plate` it
   * takes the whole frame and draws the brand lockup, which is what an advert
   * for the product itself needs to end on.
   */
  endCard: { line: string; cta: string; plate?: boolean; name?: string };
  width: number;
  height: number;
  brandColor?: string;
  /**
   * A presenter clip that speaks the whole script. Its audio runs under the
   * entire commercial and its picture is cut to whenever a clip is a
   * "presenter" segment.
   *
   * This is what makes the format work: one element plays start to finish, so
   * the voice never breaks across a cut and the lip-sync cannot drift — the
   * presenter's playhead IS the commercial's clock. Silence, a separate
   * voiceover file and a lip-sync problem all disappear at once.
   */
  narrationUrl?: string;
  /**
   * Lay a music bed under the whole film, at a level that sits beneath the
   * voice rather than competing with it.
   *
   * Synthesised here rather than mixed from a track on purpose: a commercial a
   * customer sells needs music they are licensed to use, and a bed we generate
   * ourselves carries no licence at all. It is deliberately plain — a slow
   * chord and a soft pulse — because the job is to remove silence, not to be
   * noticed.
   */
  music?: boolean;
  /** Burn each shot's spoken line in as a caption. */
  captions?: boolean;
  /** Draws a logo badge through the film and colours the end card. */
  brand?: Brand;
  onProgress?: (fraction: number) => void;
};

// --- Camera moves ----------------------------------------------------------
//
// Expressed as a start and end state so any of them can run over any duration.
// Offsets are fractions of the frame, so they hold at any output size.

type Move = {
  scale: [number, number];
  x?: [number, number];
  y?: [number, number];
  /** Radians. Only the orbit uses it, and only barely. */
  rotate?: [number, number];
  blur?: [number, number];
  /** Handheld is the one move that should not be smooth. */
  handheld?: boolean;
  /** Whip pans accelerate; everything else eases gently. */
  fast?: boolean;
};

const MOVES: Record<string, Move> = {
  // Never completely dead: a still held perfectly static for three seconds
  // reads as a slideshow, not as a locked-off shot on a tripod.
  "locked off": { scale: [1.0, 1.03] },
  "slow push in": { scale: [1.0, 1.14] },
  "pull back reveal": { scale: [1.18, 1.0] },
  "tracking follow": { scale: [1.1, 1.1], x: [-0.05, 0.05] },
  "handheld drift": { scale: [1.07, 1.07], handheld: true },
  "slow pan": { scale: [1.1, 1.1], x: [-0.07, 0.07] },
  "whip pan": { scale: [1.08, 1.08], x: [-0.22, 0.22], fast: true },
  "crane down": { scale: [1.12, 1.06], y: [-0.07, 0.05] },
  "rack focus": { scale: [1.04, 1.06], blur: [7, 0] },
  orbit: { scale: [1.12, 1.12], x: [-0.04, 0.04], rotate: [-0.012, 0.012] },
  "tilt up": { scale: [1.1, 1.1], y: [0.07, -0.07] },

  // --- interface moves -----------------------------------------------------
  //
  // A web page shot at 9:16 puts its content in the top half and leaves the
  // rest empty — not letterboxing, just a page that does not fill a phone. A
  // move that starts at 1.0 therefore frames a lot of nothing. These start
  // already punched in and biased upward (a positive y offset draws the source
  // lower, which reveals the TOP of it), so the frame is full of interface
  // from the first frame to the last.
  "ui push": { scale: [1.34, 1.5], y: [0.1, 0.05] },
  "ui hold": { scale: [1.38, 1.44], y: [0.08, 0.08] },
  "ui reveal": { scale: [1.52, 1.32], y: [0.03, 0.1] },
  "ui pan": { scale: [1.42, 1.42], x: [-0.05, 0.05], y: [0.08, 0.08] },
  // Tighter still, for a screen whose lower edge carries something the shot has
  // no business showing — a status line, a disclaimer, a row of controls. The
  // moves above bottom out at about 0.80 of the source height; this one stays
  // above 0.76 for its whole travel, so the foot of the page never enters shot.
  "ui close": { scale: [1.52, 1.62], y: [0.11, 0.11] },
  // For a screen that is already full of text.
  //
  // The moves above were built for the landing page, which leaves its lower
  // half empty and needs punching into. A dense two-column panel fills the
  // frame on its own, and at 1.42 the crop takes 21% off EACH side — enough to
  // slice "THE CUSTOMER" down to "CUSTOMER" and cut the Search button in half.
  // These start at exactly full frame, so no word is ever cropped, and take
  // their motion from the page scrolling underneath. Paired so consecutive
  // shots can breathe in opposite directions.
  "ui read": { scale: [1.0, 1.06] },
  "ui settle": { scale: [1.06, 1.0] },
};

const DEFAULT_MOVE: Move = MOVES["slow push in"];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

/** How long a dissolve runs, when the board asked for one. */
const DISSOLVE_SECONDS = 0.45;

/**
 * Frames per second, and the bitrate to carry them.
 *
 * 60fps because the feeds reward it and a push-in across a screen recording
 * shows every dropped frame; 20Mbps because at 8 the type in a UI screenshot
 * turns to mush the moment the camera moves.
 */
export const FPS = 60;
export const BITRATE = 20_000_000;

/**
 * TikTok's furniture eats the edges of the frame: the caption and handle sit
 * across the bottom fifth, the buttons down the right, and the top carries the
 * status bar and follow row. Anything that must be read lives inside this.
 */
export const SAFE = { top: 0.11, bottom: 0.2, side: 0.06 } as const;

function drawStill(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, t: number, moveName: string) {
  const move = MOVES[moveName] ?? DEFAULT_MOVE;
  const e = move.fast ? easeInOutQuint(t) : easeInOutSine(t);

  let scale = lerp(move.scale[0], move.scale[1], e);
  let dx = move.x ? lerp(move.x[0], move.x[1], e) * w : 0;
  let dy = move.y ? lerp(move.y[0], move.y[1], e) * h : 0;

  if (move.handheld) {
    // Two out-of-phase sines rather than random noise: a real operator's drift
    // wanders, it does not jitter, and randomness per frame reads as a shake.
    const p = t * Math.PI * 2;
    dx += Math.sin(p * 1.3) * w * 0.012;
    dy += Math.cos(p * 0.9) * h * 0.010;
    scale += Math.sin(p * 0.7) * 0.004;
  }

  const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight) * scale;
  const dw = img.naturalWidth * cover;
  const dh = img.naturalHeight * cover;

  ctx.save();
  if (move.blur) {
    const b = lerp(move.blur[0], move.blur[1], e);
    if (b > 0.05) ctx.filter = `blur(${b.toFixed(2)}px)`;
  }
  if (move.rotate) {
    const r = lerp(move.rotate[0], move.rotate[1], e);
    ctx.translate(w / 2, h / 2);
    ctx.rotate(r);
    ctx.translate(-w / 2, -h / 2);
  }
  ctx.drawImage(img, (w - dw) / 2 + dx, (h - dh) / 2 + dy, dw, dh);
  ctx.restore();
}

/**
 * Video, with the same camera moves the stills get.
 *
 * Screen recordings play flat: the browser renders exactly what it was told and
 * the frame never moves. A slow push across a UI is what turns a screen capture
 * into a shot, and it is the cheapest energy available in an edit — the
 * footage is already paid for.
 */
function drawVideo(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, w: number, h: number, t = 0, moveName = "locked off") {
  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  const move = MOVES[moveName] ?? MOVES["locked off"];
  const e = move.fast ? easeInOutQuint(t) : easeInOutSine(t);

  const scale = lerp(move.scale[0], move.scale[1], e);
  const dx = move.x ? lerp(move.x[0], move.x[1], e) * w : 0;
  const dy = move.y ? lerp(move.y[0], move.y[1], e) * h : 0;

  const cover = Math.max(w / vw, h / vh) * scale;
  const dw = vw * cover;
  const dh = vh * cover;
  ctx.drawImage(video, (w - dw) / 2 + dx, (h - dh) / 2 + dy, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Burnt-in text, drawn over a scrim so it stays legible against any frame.
 * Drawn here rather than asked of the image model on purpose: generated
 * lettering is misspelled, cannot use the brand's colour, and is most of what
 * makes generated video look generated.
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  opts: { size: number; bottom: number; color: string },
) {
  if (!text) return;
  ctx.font = `700 ${opts.size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines = wrap(ctx, text, w * 0.82);
  const lineHeight = opts.size * 1.2;
  const baseY = h - opts.bottom - lines.length * lineHeight + lineHeight;

  const grad = ctx.createLinearGradient(0, baseY - lineHeight * 1.5, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, baseY - lineHeight * 1.5, w, h - (baseY - lineHeight * 1.5));

  ctx.fillStyle = opts.color;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, baseY + i * lineHeight));
}

/**
 * The closing card: what the business stands for, and the one thing to do next.
 *
 * Laid out as a single measured block with one scrim behind both lines, rather
 * than two independent captions that each think they own the bottom of the
 * frame. Measured first, drawn second — the two-pass shape is what keeps the
 * scrim the right height when the line wraps.
 */
/**
 * The standing label at the top of a showcase shot.
 *
 * Drawn as a pill so it reads as a label rather than as part of the commercial
 * underneath it, and kept inside the top safe area so the feeds' own furniture
 * does not sit on top of it.
 */
function drawTag(ctx: CanvasRenderingContext2D, text: string, w: number, h: number) {
  if (!text) return;
  const size = Math.round(h * 0.021);
  ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const padX = Math.round(size * 0.95);
  const padY = Math.round(size * 0.62);
  const textWidth = ctx.measureText(text).width;
  const boxW = Math.round(textWidth + padX * 2);
  const boxH = Math.round(size + padY * 2);
  const x = Math.round(w * SAFE.side);
  const y = Math.round(h * SAFE.top);

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, Math.round(size * 0.07));
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillText(text, x + padX, y + boxH / 2 + size * 0.04);
}

/**
 * The closing plate: the mark, the address, and the one instruction.
 *
 * A commercial that ends on the last frame of its own content ends on nothing —
 * the viewer has just been shown what the product makes and is given nowhere to
 * go. This paints the full frame instead of hanging text off the bottom of
 * somebody's face, and it draws Reelo's actual lockup rather than the word set
 * in whatever font the canvas defaults to: the rounded square with the 135°
 * red gradient and its glow, the wordmark beside it, exactly as the header
 * renders them.
 */
function drawBrandPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  brandColor: string,
  copy: { name: string; cta: string; site: string },
) {
  // The app's own backdrop, so the plate reads as part of the product.
  ctx.fillStyle = "#0B0A10";
  ctx.fillRect(0, 0, w, h);

  // A soft bloom behind the mark, matching the header's box-shadow.
  const bloom = ctx.createRadialGradient(w / 2, h * 0.38, 0, w / 2, h * 0.38, w * 0.6);
  bloom.addColorStop(0, "rgba(225,29,42,0.22)");
  bloom.addColorStop(1, "rgba(225,29,42,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);

  const mark = Math.round(w * 0.2);
  const radius = Math.round(mark * 0.28);
  const markX = Math.round(w / 2 - mark / 2);
  const markY = Math.round(h * 0.3);

  ctx.save();
  ctx.shadowColor = "rgba(225,29,42,0.55)";
  ctx.shadowBlur = Math.round(mark * 0.55);
  const g = ctx.createLinearGradient(markX, markY, markX + mark, markY + mark);
  g.addColorStop(0, "#ff3645");
  g.addColorStop(1, "#b3121d");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(markX, markY, mark, mark, radius);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(mark * 0.56)}px "Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillText("R", w / 2, markY + mark / 2 + mark * 0.02);

  ctx.textBaseline = "alphabetic";
  const nameSize = Math.round(h * 0.062);
  ctx.font = `700 ${nameSize}px "Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = "#ffffff";
  let y = markY + mark + Math.round(nameSize * 1.25);
  ctx.fillText(copy.name, w / 2, y);

  const ctaSize = Math.round(h * 0.034);
  ctx.font = `600 ${ctaSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  y += Math.round(ctaSize * 2.1);
  for (const line of wrap(ctx, copy.cta, w * 0.8)) {
    ctx.fillText(line, w / 2, y);
    y += Math.round(ctaSize * 1.32);
  }

  const siteSize = Math.round(h * 0.042);
  ctx.font = `700 ${siteSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = brandColor;
  ctx.fillText(copy.site, w / 2, y + Math.round(siteSize * 1.5));
}

function drawEndCard(
  ctx: CanvasRenderingContext2D,
  endCard: { line: string; cta: string; plate?: boolean; name?: string },
  w: number,
  h: number,
  brandColor: string,
) {
  if (endCard.plate) {
    drawBrandPlate(ctx, w, h, brandColor, {
      name: endCard.name ?? "Reelo",
      cta: endCard.line,
      site: endCard.cta,
    });
    return;
  }
  const lineSize = Math.round(h * 0.045);
  const ctaSize = Math.round(h * 0.032);
  const maxWidth = w * 0.82;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 ${lineSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const lines = endCard.line ? wrap(ctx, endCard.line, maxWidth) : [];
  ctx.font = `700 ${ctaSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const ctas = endCard.cta ? wrap(ctx, endCard.cta, maxWidth) : [];
  if (lines.length === 0 && ctas.length === 0) return;

  const lineHeight = lineSize * 1.18;
  const ctaHeight = ctaSize * 1.25;
  const gap = lines.length && ctas.length ? lineSize * 0.55 : 0;
  const blockHeight = lines.length * lineHeight + gap + ctas.length * ctaHeight;

  const bottom = Math.round(h * SAFE.bottom);
  const top = h - bottom - blockHeight;

  const grad = ctx.createLinearGradient(0, top - lineHeight * 1.6, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.6)");
  grad.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, top - lineHeight * 1.6, w, h - (top - lineHeight * 1.6));

  let y = top + lineSize;
  ctx.font = `700 ${lineSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = "#ffffff";
  for (const line of lines) {
    ctx.fillText(line, w / 2, y);
    y += lineHeight;
  }

  y += gap;
  ctx.font = `700 ${ctaSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = brandColor;
  for (const line of ctas) {
    ctx.fillText(line, w / 2, y);
    y += ctaHeight;
  }
}

type Source =
  | { kind: "still"; el: HTMLImageElement; clip: Clip }
  | { kind: "video"; el: HTMLVideoElement; clip: Clip };

function loadStill(url: string, host: HTMLElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("A frame could not be loaded."));
    img.src = url;
    host.appendChild(img);
  });
}

function loadVideo(url: string, host: HTMLElement, opts: { muted?: boolean } = {}): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    // Without this a cross-origin clip taints the canvas and MediaRecorder
    // throws on the first frame, with an error that names no clip. It is also
    // what lets the Web Audio graph read the presenter's voice at all.
    video.crossOrigin = "anonymous";
    video.src = url;
    // The presenter stays unmuted so its audio reaches the recording; b-roll
    // clips stay muted so their ambience does not fight the voice.
    video.muted = opts.muted !== false;
    video.playsInline = true;
    video.preload = "auto";
    host.appendChild(video);
    const ready = () => resolve(video);
    video.addEventListener("loadeddata", ready, { once: true });
    video.addEventListener("canplaythrough", ready, { once: true });
    video.addEventListener("error", () => reject(new Error("A shot could not be loaded.")), { once: true });
  });
}

/**
 * A small JPEG of each shot, for the critic to look at.
 *
 * Downscaled here rather than on the server because the originals are 768x1344
 * PNGs at about 1.5MB each — a dozen of those base64-encoded is over 20MB and
 * the model request would be refused outright. At 512 wide and quality 0.7 the
 * whole commercial fits in well under a megabyte, and nothing being judged
 * (composition, lighting, whether a hand has six fingers) needs more.
 */
export async function thumbnails(clips: Clip[], width = 512): Promise<{ base64: string; mimeType: string }[]> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0";
  document.body.appendChild(host);

  try {
    const out: { base64: string; mimeType: string }[] = [];
    for (const clip of clips) {
      // A presenter segment has no file of its own — it is a window onto the
      // narration — so there is nothing here to thumbnail.
      if (!clip.url) continue;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      if (clip.kind === "video") {
        const video = await loadVideo(clip.url, host);
        // A frame from partway in, not frame zero — the first frame of a
        // generated clip is often the least settled one.
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
          video.currentTime = Math.min(1, (video.duration || 2) / 2);
          setTimeout(resolve, 3000);
        });
        canvas.width = width;
        canvas.height = Math.round((width * (video.videoHeight || 16)) / (video.videoWidth || 9));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        const img = await loadStill(clip.url, host);
        canvas.width = width;
        canvas.height = Math.round((width * img.naturalHeight) / img.naturalWidth);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      out.push({ base64: canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? "", mimeType: "image/jpeg" });
    }
    return out.filter((t) => t.base64);
  } finally {
    host.remove();
  }
}

/**
 * Route the presenter's audio into the recording.
 *
 * A canvas stream carries picture only, so without this the commercial comes
 * out silent however much sound the source has. The element is deliberately
 * NOT muted and NOT connected to the speakers: muting it would silence the
 * graph too, and connecting it would play the advert out loud on the machine
 * that is making it.
 */
async function makeAudio(video: HTMLVideoElement | null, into: MediaStream): Promise<{ ctx: AudioContext; destination: MediaStreamAudioDestinationNode } | null> {
  return openAudio(video, into);
}

async function openAudio(video: HTMLVideoElement | null, into: MediaStream) {
  try {
    const ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // A context created outside a user gesture starts suspended, and a
    // suspended context feeds the recorder pure silence — a commercial that
    // looks right and plays mute, with nothing in the console to explain it.
    if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
    const destination = ctx.createMediaStreamDestination();
    if (video) ctx.createMediaElementSource(video).connect(destination);
    for (const track of destination.stream.getAudioTracks()) into.addTrack(track);
    return { ctx, destination };
  } catch {
    return null;
  }
}

/**
 * A music bed, synthesised.
 *
 * Three detuned oscillators holding a slow minor-ninth chord through a gentle
 * low-pass, plus a soft pulse on the root every two seconds. It is not a track
 * and is not trying to be — it is the difference between a commercial that
 * sounds finished and one that sounds like a screen recording.
 *
 * Kept at a fixed low gain against the voice. Music that has to be turned down
 * later was mixed wrong.
 */
function startMusicBed(ctx: AudioContext, destination: MediaStreamAudioDestinationNode, seconds: number): void {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  // Under the voice by design: narration sits around 0.04 mean, so this is a
  // bed rather than a duet.
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.055, now + 1.2);
  master.gain.setValueAtTime(0.055, now + Math.max(2, seconds - 1.5));
  master.gain.linearRampToValueAtTime(0, now + Math.max(2.5, seconds));

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.Q.value = 0.6;
  filter.connect(master);
  master.connect(destination);

  // A minor ninth: warm and unresolved, which is what a bed wants — a major
  // chord announces itself and starts competing with the script.
  for (const [freq, detune, gain] of [
    [110, -4, 0.5],
    [164.81, 3, 0.35],
    [246.94, -2, 0.22],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(filter);
    osc.start(now);
    osc.stop(now + seconds + 0.5);
  }

  // A soft pulse so the bed has a pulse rather than being a drone.
  const pulse = ctx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 55;
  const pulseGain = ctx.createGain();
  pulseGain.gain.setValueAtTime(0, now);
  for (let t = 0.5; t < seconds; t += 2) {
    pulseGain.gain.setValueAtTime(0, now + t);
    pulseGain.gain.linearRampToValueAtTime(0.5, now + t + 0.08);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + t + 1.1);
  }
  pulse.connect(pulseGain).connect(filter);
  pulse.start(now);
  pulse.stop(now + seconds + 0.5);

  // A sparse arpeggio over the top, and a filter that opens across the film.
  //
  // A held chord alone reads as a hold-music loop; a moving figure and a
  // brightening filter give the track somewhere to go, which is what makes a
  // thirty-second cut feel like it is building towards the call to action
  // rather than just ending when the words run out.
  filter.frequency.linearRampToValueAtTime(2200, now + Math.max(3, seconds * 0.85));

  const arp = [659.25, 987.77, 880, 1318.5]; // E5 B5 A5 E6 — inside the chord
  const arpGain = ctx.createGain();
  arpGain.gain.value = 0.09;
  arpGain.connect(filter);
  for (let i = 0, t = 1.2; t < seconds - 0.4; i++, t += 0.5) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = arp[i % arp.length];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.exponentialRampToValueAtTime(0.5, now + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.46);
    osc.connect(g).connect(arpGain);
    osc.start(now + t);
    osc.stop(now + t + 0.5);
  }
}

/**
 * Sound design: the clicks, whooshes and impacts that separate a commercial
 * from a screen recording.
 *
 * Synthesised for the same reason the music is — a sample pack carries a
 * licence, and a sine with an envelope does not. Each cut gets a whoosh, the
 * first shot gets a click because the first shot is somebody clicking, and the
 * end card lands on a low impact.
 */
function scheduleWhoosh(ctx: AudioContext, out: AudioNode, at: number) {
  // Filtered noise sweeping upward: the shape of a transition.
  const length = Math.floor(ctx.sampleRate * 0.32);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(420, at);
  band.frequency.exponentialRampToValueAtTime(2600, at + 0.3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.10, at + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
  src.connect(band).connect(gain).connect(out);
  src.start(at);
  src.stop(at + 0.35);
}

function scheduleClick(ctx: AudioContext, out: AudioNode, at: number) {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(2200, at);
  osc.frequency.exponentialRampToValueAtTime(900, at + 0.03);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.07, at + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + 0.06);
}

function scheduleImpact(ctx: AudioContext, out: AudioNode, at: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, at);
  osc.frequency.exponentialRampToValueAtTime(38, at + 0.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + 1);
}

/**
 * A cinematic grade, applied in the cut.
 *
 * Screen recordings are flat by nature — a browser renders exactly what it is
 * told and nothing more. A vignette and a warm-to-cool falloff give the frame
 * depth and keep the eye centred, which is most of what separates "footage" from
 * "a shot".
 */
function drawGrade(ctx: CanvasRenderingContext2D, w: number, h: number, brandColor: string, strength = 1) {
  if (strength <= 0.02) return;

  // Vignette, at a fraction of what it was. The first cut graded Reelo's own
  // near-black interface darker still and cost the UI its detail — a vignette
  // is meant to hold the eye centre-frame, not to bury the product.
  const vig = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.34, w / 2, h * 0.5, Math.max(w, h) * 0.74);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, `rgba(0,0,0,${(0.2 * strength).toFixed(3)})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // A whisper of brand colour in the corner, so neutral footage still carries
  // the palette.
  const glow = ctx.createRadialGradient(w * 0.88, h * 0.08, 0, w * 0.88, h * 0.08, w * 0.7);
  glow.addColorStop(0, `${brandColor}${strength > 0.6 ? "1e" : "12"}`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

/**
 * The brand badge: the logo mark and the name, small, top-left, all the way
 * through. A commercial that only shows who made it at the very end has spent
 * twenty-five seconds being anonymous.
 */
function drawBadge(ctx: CanvasRenderingContext2D, brand: Brand, w: number, h: number) {
  const pad = Math.round(w * SAFE.side);
  const size = Math.round(h * 0.032);
  const radius = size * 0.28;
  const y = Math.round(h * SAFE.top * 0.62);

  ctx.save();
  ctx.globalAlpha = 0.96;
  // Rounded square in the brand colour, with the initial knocked out in white.
  ctx.beginPath();
  ctx.roundRect(pad, y, size, size, radius);
  ctx.fillStyle = brand.color;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(size * 0.62)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(brand.name.charAt(0).toUpperCase(), pad + size / 2, y + size / 2 + size * 0.02);

  ctx.textAlign = "left";
  ctx.font = `800 ${Math.round(size * 0.72)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.fillText(brand.name, pad + size * 1.28, y + size / 2 + size * 0.02);
  ctx.restore();
}

/**
 * Captions, burned in.
 *
 * Most of a vertical feed is watched on mute, and the platforms all reward
 * captions. Drawn here because HeyGen returns a sidecar .srt and nothing that
 * burns it into the picture.
 */
function drawCaption(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, lift = 0) {
  if (!text) return;
  const size = Math.round(h * 0.031);
  ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines = wrap(ctx, text, w * (1 - SAFE.side * 2) * 0.94).slice(0, 3);
  const lineHeight = size * 1.28;
  // Lifted clear of TikTok's caption row and buttons — anything below this is
  // covered by the platform on at least one feed. `lift` raises it further over
  // interface shots, where the lower third is the product's own buttons: the
  // first cut put "Writes the script" straight across a Download button.
  const bottom = Math.round(h * (SAFE.bottom + lift));
  const top = h - bottom - lines.length * lineHeight;

  lines.forEach((line, i) => {
    const y = top + (i + 1) * lineHeight;
    const width = ctx.measureText(line).width;
    // A pill behind each line rather than one block: it tracks the text, so
    // short lines do not sit on a wide empty bar.
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.roundRect(w / 2 - width / 2 - size * 0.42, y - size * 0.95, width + size * 0.84, lineHeight * 0.96, size * 0.34);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, w / 2, y);
  });
}

/**
 * What to record into.
 *
 * MP4 first. The recorder's traditional output is WebM, and a WebM lands on a
 * Windows desktop as a file the built-in player will open with picture and no
 * sound, because it cannot decode Opus — which looks exactly like the audio
 * having failed. H.264 and AAC in an MP4 play everywhere and are what every
 * social platform wants uploaded. WebM stays as the fallback for browsers whose
 * recorder cannot write MP4.
 */
function pickRecordingType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ].find((type) => MediaRecorder.isTypeSupported(type));
}

/** The file extension for a recording, from the type it was recorded as. */
export function extensionFor(blob: Blob): "mp4" | "webm" {
  return blob.type.includes("mp4") ? "mp4" : "webm";
}

/**
 * Render the cut as a frame sequence instead of recording it.
 *
 * MediaRecorder is a real-time VBR encoder and it treats videoBitsPerSecond as
 * a hint: asked for 20Mbps over screen recordings it spent 2.3, because the
 * content compresses well and it had no reason to spend more. You cannot get
 * that detail back by transcoding afterwards — the bits are already gone.
 *
 * So for a master, the frames are drawn deterministically at a fixed step and
 * handed out one at a time, and a real encoder makes the file. Nothing is
 * real-time, every source is seeked to an exact position, and the result is
 * limited by the source footage rather than by an encoder in a hurry.
 *
 * The audio is NOT produced here. It comes from the recorded pass, which
 * already mixes voice, bed and effects correctly, and is muxed on afterwards —
 * the two agree because both run the same timeline arithmetic.
 */
export async function exportFrames(
  opts: AssembleOptions & { fps?: number; quality?: number },
  onFrame: (dataUrl: string, index: number, total: number) => Promise<void> | void,
): Promise<{ frames: number; seconds: number; fps: number }> {
  const { clips, endCard, width: w, height: h, narrationUrl, captions, brand } = opts;
  const brandColor = opts.brandColor ?? brand?.color ?? "#ff3645";
  const fps = opts.fps ?? FPS;
  const quality = opts.quality ?? 0.95;
  if (clips.length === 0) throw new Error("There are no shots to cut together.");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0";
  document.body.appendChild(host);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    host.remove();
    throw new Error("This browser cannot render the commercial.");
  }

  /** Park a video on an exact frame. Real-time playback cannot be trusted to
   *  land where the timeline says it should. */
  const seek = (video: HTMLVideoElement, t: number) =>
    new Promise<void>((resolve) => {
      const done = () => resolve();
      video.addEventListener("seeked", done, { once: true });
      video.currentTime = Math.max(0, Math.min(t, (video.duration || t) - 0.02));
      setTimeout(done, 900);
    });

  try {
    const narration = narrationUrl ? await loadVideo(narrationUrl, host, { muted: true }) : null;
    const sources: (Source | null)[] = [];
    for (const clip of clips) {
      sources.push(
        clip.kind === "presenter"
          ? narration
            ? { kind: "video", el: narration, clip }
            : null
          : clip.kind === "video"
            ? { kind: "video", el: await loadVideo(clip.url, host), clip }
            // A still with no file is a deliberate blank — the closing brand
            // plate paints itself and wants nothing behind it. Without this,
            // loadStill("") rejects with an error that names no clip.
            : clip.url
              ? { kind: "still", el: await loadStill(clip.url, host), clip }
              : null,
      );
    }

    const planned = clips.reduce((n, c) => n + c.seconds, 0);
    const spoken = narration?.duration;
    const scale = spoken && Number.isFinite(spoken) && planned > 0 && spoken > planned ? spoken / planned : 1;

    const starts: number[] = [];
    let acc = 0;
    for (const c of clips) {
      starts.push(acc);
      acc += c.seconds * scale;
    }
    const total = acc;
    const frameCount = Math.floor(total * fps);

    for (let f = 0; f < frameCount; f++) {
      const now = f / fps;
      let index = starts.findIndex((s, i) => now >= s && now < s + clips[i].seconds * scale);
      if (index < 0) index = clips.length - 1;
      const clip = clips[index];
      const source = sources[index];
      const held = clip.seconds * scale;
      const localT = (now - starts[index]) / held;

      // The presenter's playhead is the global clock, so lip-sync survives
      // being rendered out of real time.
      if (source?.kind === "video") {
        await seek(
          source.el,
          source.el === narration
            ? now
            : Math.min((clip.startAt ?? 0) + (now - starts[index]), (source.el.duration || 0) - 0.05),
        );
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      if (source) {
        if (source.kind === "still") drawStill(ctx, source.el, w, h, Math.min(1, Math.max(0, localT)), clip.cameraMove);
        else if (clip.kind === "presenter") drawVideo(ctx, source.el, w, h);
        else drawVideo(ctx, source.el, w, h, Math.min(1, Math.max(0, localT)), clip.cameraMove);
      }

      drawGrade(ctx, w, h, brandColor, clip.productUi ? 0.35 : 1);

      if (clip.tag) drawTag(ctx, clip.tag, w, h);
      if (index === clips.length - 1) drawEndCard(ctx, endCard, w, h, brandColor);
      else if (captions && clip.caption) drawCaption(ctx, clip.caption, w, h, clip.productUi ? 0.14 : 0);

      if (brand && !clip.productUi) drawBadge(ctx, brand, w, h);

      await onFrame(canvas.toDataURL("image/jpeg", quality), f, frameCount);
    }

    return { frames: frameCount, seconds: total, fps };
  } finally {
    host.remove();
  }
}

export async function assemble(opts: AssembleOptions): Promise<Blob> {
  const { clips, endCard, width: w, height: h, narrationUrl, music, captions, brand, onProgress } = opts;
  const brandColor = opts.brandColor ?? brand?.color ?? "#ff3645";
  if (clips.length === 0) throw new Error("There are no shots to cut together.");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0";
  document.body.appendChild(host);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    host.remove();
    throw new Error("This browser cannot render the commercial.");
  }

  try {
    // The presenter is loaded once and shared by every segment that cuts back
    // to them, because it is one continuous take and one continuous voice.
    const narration = narrationUrl ? await loadVideo(narrationUrl, host, { muted: false }) : null;

    const sources: (Source | null)[] = [];
    for (const [i, clip] of clips.entries()) {
      sources.push(
        clip.kind === "presenter"
          ? narration
            ? { kind: "video", el: narration, clip }
            : null
          : clip.kind === "video"
            ? { kind: "video", el: await loadVideo(clip.url, host), clip }
            // A still with no file is a deliberate blank — the closing brand
            // plate paints itself and wants nothing behind it. Without this,
            // loadStill("") rejects with an error that names no clip.
            : clip.url
              ? { kind: "still", el: await loadStill(clip.url, host), clip }
              : null,
      );
      onProgress?.(((i + 1) / clips.length) * 0.25);
    }

    const stream = canvas.captureStream(FPS);
    // One audio graph for both the voice and the bed, so they arrive on a
    // single track already mixed rather than as two the recorder has to align.
    const audio = narration || music ? await makeAudio(narration, stream) : null;
    const mimeType = pickRecordingType();
    if (!mimeType) throw new Error("This browser cannot record video. Try Chrome or Edge.");

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: BITRATE, audioBitsPerSecond: 192_000 });
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    const finished = new Promise<Blob>((resolve) => {
      // Typed as it was actually recorded, not as a guess — the extension the
      // customer downloads is derived from this.
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
    });

    // When there is a presenter, the commercial is exactly as long as they
    // speak for. The board was written to 30 seconds but the read comes out at
    // whatever it comes out at, and a cut that outlasts the voice ends on
    // silence while one that stops short cuts the last word off. So the shot
    // lengths are scaled to the take, keeping the proportions the board chose.
    const planned = clips.reduce((n, c) => n + c.seconds, 0);
    const spoken = narration?.duration;
    // Stretch the cut to fit a longer read, never squeeze it to fit a shorter
    // one. A voice that outruns the picture gets cut off mid-word; a picture
    // that outlasts the voice just holds the end card while the music finishes,
    // which is how commercials have always ended.
    const scale = spoken && Number.isFinite(spoken) && planned > 0 && spoken > planned ? spoken / planned : 1;

    // Segment boundaries up front, so the render is one clock rather than a
    // chain of per-shot timers whose drift accumulates across ten shots.
    const starts: number[] = [];
    let acc = 0;
    for (const c of clips) {
      starts.push(acc);
      acc += c.seconds * scale;
    }
    const total = acc;

    const paint = (source: Source | null, localT: number, alpha = 1) => {
      if (!source) return;
      ctx.globalAlpha = alpha;
      if (source.kind === "still") drawStill(ctx, source.el, w, h, Math.min(1, Math.max(0, localT)), source.clip.cameraMove);
      // The presenter is left alone — a push-in on a talking head reads as a
      // mistake, not a move.
      else if (source.clip.kind === "presenter") drawVideo(ctx, source.el, w, h);
      else drawVideo(ctx, source.el, w, h, Math.min(1, Math.max(0, localT)), source.clip.cameraMove);
      ctx.globalAlpha = 1;
    };

    recorder.start();

    // The bed starts with the recording, not with the first cut, so the film
    // never opens on a beat of silence.
    if (music && audio) {
      startMusicBed(audio.ctx, audio.destination, total + 0.5);

      // Sound design, scheduled against the cut rather than sprinkled: a click
      // on the opening shot because the opening shot is somebody clicking, a
      // whoosh on every transition, and a low impact when the end card lands.
      const t = audio.ctx.currentTime;
      scheduleClick(audio.ctx, audio.destination, t + 0.85);
      for (let i = 1; i < clips.length; i++) {
        scheduleWhoosh(audio.ctx, audio.destination, t + starts[i] - 0.12);
      }
      scheduleImpact(audio.ctx, audio.destination, t + starts[clips.length - 1]);
    }

    // The presenter runs from the first frame to the last, whether or not they
    // are on screen. Their voice is the spine of the commercial, so it must
    // never be paused for a cutaway — only hidden behind one.
    if (narration) {
      narration.currentTime = 0;
      await narration.play().catch(() => undefined);
    }

    const t0 = performance.now();
    let playing = -1;

    await new Promise<void>((resolve) => {
      const frame = () => {
        const now = (performance.now() - t0) / 1000;
        if (now >= total) return resolve();

        let index = starts.findIndex((s, i) => now >= s && now < s + clips[i].seconds * scale);
        if (index < 0) index = clips.length - 1;

        const source = sources[index];
        const clip = clips[index];
        const held = clip.seconds * scale;
        const localT = (now - starts[index]) / held;

        // Start a b-roll clip exactly when its segment does. The presenter is
        // never touched here — it is already running and must stay running.
        if (index !== playing) {
          const previous = playing >= 0 ? sources[playing] : null;
          if (previous?.kind === "video" && previous.el !== narration) previous.el.pause();
          if (source?.kind === "video" && source.el !== narration) {
            source.el.currentTime = clip.startAt ?? 0;
            void source.el.play().catch(() => undefined);
          }
          playing = index;
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        paint(source, localT);

        // A dissolve is drawn by fading the next shot in over this one, which
        // is why the timeline is a single clock: both shots have to be on
        // screen at the same instant.
        const next = sources[index + 1];
        if (next && clip.transitionOut === "dissolve") {
          const into = held - (now - starts[index]);
          if (into < DISSOLVE_SECONDS) paint(next, 0, 1 - into / DISSOLVE_SECONDS);
        }

        // Graded before any type goes down, so the vignette darkens the footage
        // and not the captions. Eased right off over the interface, which is
        // already dark and is the thing the viewer came to look at.
        drawGrade(ctx, w, h, brandColor, clip.productUi ? 0.35 : 1);

        // The end card rides the final shot rather than adding time after it,
        // so the cut runs to the length the board was written and validated at.
        //
        // It replaces that shot's caption rather than joining it. Drawing both
        // put three blocks of text in the same corner of the frame, each with
        // its own scrim, overlapping into an unreadable mess — which is what
        // the first cut of this actually looked like.
        if (clip.tag) drawTag(ctx, clip.tag, w, h);
        if (index === clips.length - 1) {
          drawEndCard(ctx, endCard, w, h, brandColor);
        } else if (captions && clip.caption) {
          // Captions win over the board's on-screen text: two blocks of type in
          // the same corner is the mess the end card already taught us about.
          drawCaption(ctx, clip.caption, w, h, clip.productUi ? 0.14 : 0);
        } else if (clip.onScreenText) {
          drawText(ctx, clip.onScreenText, w, h, { size: Math.round(h * 0.038), bottom: Math.round(h * 0.12), color: "#ffffff" });
        }

        // The badge rides every frame EXCEPT the product's own interface, where
        // Reelo's header already shows the logo and ours collided with the
        // page's headline.
        if (brand && !clip.productUi) drawBadge(ctx, brand, w, h);

        onProgress?.(0.25 + (now / total) * 0.75);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });

    recorder.stop();
    narration?.pause();
    void audio?.ctx.close().catch(() => undefined);
    return await finished;
  } finally {
    host.remove();
  }
}
