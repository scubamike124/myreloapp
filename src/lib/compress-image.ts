/**
 * Resize + JPEG-compress a photo in the browser before base64 upload.
 * Large phone photos often exceed JSON body limits once base64-encoded (~+33%).
 * iPhone HEIC/Live Photos are rejected with a clear message (browsers can't decode them reliably).
 */
import { assertPhotoFileOk, photoTooLargeMessage, isLikelyHeic } from "@/lib/upload-limits";

export async function compressImageForUpload(
  file: Blob,
  opts: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<{ base64: string; mimeType: string }> {
  assertPhotoFileOk(file);

  if (isLikelyHeic(file)) {
    throw new Error(
      "iPhone HEIC / Live Photos aren't supported yet. In Photos, tap Share → Options → Most Compatible (or Save as JPEG), then upload the JPG.",
    );
  }

  // Veo / Gemini image tools are happier with smaller payloads — default tight.
  const maxEdge = opts.maxEdge ?? 1280;
  const quality = opts.quality ?? 0.82;
  const maxBytes = opts.maxBytes ?? 3.5 * 1024 * 1024;

  try {
    const bitmap = await decodeToBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      if (file.size > maxBytes) throw new Error(photoTooLargeMessage(file.size));
      return { base64: await blobToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    let q = quality;
    let blob: Blob | null = await canvasToBlob(canvas, "image/jpeg", q);
    while (blob && blob.size > maxBytes && q > 0.4) {
      q -= 0.08;
      blob = await canvasToBlob(canvas, "image/jpeg", q);
    }
    // Still too big? shrink the canvas further.
    if (blob && blob.size > maxBytes) {
      const scale2 = 0.7;
      const c2 = document.createElement("canvas");
      c2.width = Math.max(1, Math.round(w * scale2));
      c2.height = Math.max(1, Math.round(h * scale2));
      const ctx2 = c2.getContext("2d");
      if (ctx2) {
        ctx2.drawImage(canvas, 0, 0, c2.width, c2.height);
        blob = await canvasToBlob(c2, "image/jpeg", 0.72);
      }
    }
    if (!blob || blob.size > maxBytes) {
      throw new Error(
        `That photo is still too large after compressing. Please upload a smaller JPG or PNG (under about 8MB, ideally under 3MB).`,
      );
    }
    return { base64: await blobToBase64(blob), mimeType: "image/jpeg" };
  } catch (e) {
    if (e instanceof Error && (/too large|HEIC|Live Photos|compatible/i.test(e.message))) throw e;
    // Last resort: HTMLImageElement decode (helps some phone JPG/WebP cases).
    try {
      const viaImg = await compressViaImageElement(file, maxEdge, quality, maxBytes);
      if (viaImg) return viaImg;
    } catch {
      /* fall through */
    }
    throw new Error(
      `Could not read that photo. Please use a JPG or PNG under about 8MB (not HEIC). On iPhone: Share → Options → Most Compatible.`,
    );
  }
}

type BitmapLike = { width: number; height: number; close?: () => void } & CanvasImageSource;

async function decodeToBitmap(file: Blob): Promise<BitmapLike> {
  if (typeof createImageBitmap === "function") {
    try {
      // Prefer EXIF-oriented decode so phone portraits aren't sideways for Veo.
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        /* fall through to <img> */
      }
    }
  }
  return loadAsImage(file);
}

function loadAsImage(file: Blob): Promise<HTMLImageElement & { close?: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode that image."));
    };
    img.src = url;
  });
}

async function compressViaImageElement(
  file: Blob,
  maxEdge: number,
  quality: number,
  maxBytes: number,
): Promise<{ base64: string; mimeType: string } | null> {
  const img = await loadAsImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  let q = quality;
  let blob = await canvasToBlob(canvas, "image/jpeg", q);
  while (blob && blob.size > maxBytes && q > 0.4) {
    q -= 0.08;
    blob = await canvasToBlob(canvas, "image/jpeg", q);
  }
  if (!blob || blob.size > maxBytes) return null;
  return { base64: await blobToBase64(blob), mimeType: "image/jpeg" };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Could not read the photo."));
    r.readAsDataURL(blob);
  });
}
