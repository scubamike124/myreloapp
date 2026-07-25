/**
 * Resize + JPEG-compress a photo in the browser before base64 upload.
 * Large phone photos often exceed JSON body limits once base64-encoded (~+33%).
 */
export async function compressImageForUpload(
  file: Blob,
  opts: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<{ base64: string; mimeType: string }> {
  const maxEdge = opts.maxEdge ?? 1536;
  const quality = opts.quality ?? 0.85;
  const maxBytes = opts.maxBytes ?? 6 * 1024 * 1024;

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
      return { base64: await blobToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    let q = quality;
    let blob: Blob | null = await canvasToBlob(canvas, "image/jpeg", q);
    while (blob && blob.size > maxBytes && q > 0.45) {
      q -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", q);
    }
    if (!blob) {
      return { base64: await blobToBase64(file), mimeType: file.type || "image/jpeg" };
    }
    return { base64: await blobToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    // HEIC / exotic formats: send original bytes (API may still accept JPEG/PNG).
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
