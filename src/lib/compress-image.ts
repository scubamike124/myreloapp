/**
 * Resize + JPEG-compress a photo in the browser before base64 upload.
 * Large phone photos often exceed JSON body limits once base64-encoded (~+33%).
 */
import { assertPhotoFileOk, photoTooLargeMessage } from "@/lib/upload-limits";

export async function compressImageForUpload(
  file: Blob,
  opts: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<{ base64: string; mimeType: string }> {
  assertPhotoFileOk(file);

  // Veo / Gemini image tools are happier with smaller payloads — default tight.
  const maxEdge = opts.maxEdge ?? 1280;
  const quality = opts.quality ?? 0.82;
  const maxBytes = opts.maxBytes ?? 3.5 * 1024 * 1024;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      if (file.size > maxBytes) throw new Error(photoTooLargeMessage(file.size));
      return { base64: await blobToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

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
    if (e instanceof Error && /too large/i.test(e.message)) throw e;
    // HEIC / exotic formats: try original only if small enough.
    if (file.size > maxBytes) {
      throw new Error(
        `Could not process that photo format. Please convert to JPG or PNG under about 8MB and try again.`,
      );
    }
    return { base64: await blobToBase64(file), mimeType: file.type || "image/jpeg" };
  }
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
