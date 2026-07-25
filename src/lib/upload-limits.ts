/** Shared photo upload limits + client-facing copy. */

export const PHOTO_MAX_FILE_MB = 8;
export const PHOTO_MAX_FILE_BYTES = PHOTO_MAX_FILE_MB * 1024 * 1024;

/** Shown under every photo upload so clients know before they hit an error. */
export const PHOTO_SIZE_HINT =
  `Use a JPG or PNG under about ${PHOTO_MAX_FILE_MB}MB. Large phone photos are auto-shrunk — if upload still fails, pick a smaller picture.`;

/** Veo photo tools (talking / dancing) cannot exceed 8 seconds. */
export const VEO_MAX_SECONDS = 8;

export const VEO_LIMIT_HINT =
  `Photo videos are limited to about ${VEO_MAX_SECONDS} seconds by the AI provider. For longer talking videos (up to ~30s), open AI Avatar Studio and pick an avatar.`;

export function photoTooLargeMessage(bytes?: number): string {
  const size = typeof bytes === "number" ? ` (${(bytes / (1024 * 1024)).toFixed(1)}MB)` : "";
  return `That photo is too large${size}. Please upload a smaller JPG or PNG under about ${PHOTO_MAX_FILE_MB}MB.`;
}

/** Reject obviously huge files before we base64 them (base64 adds ~33%). */
export function assertPhotoFileOk(file: Blob): void {
  // Allow a bit over — we compress — but refuse monster files that will OOM / hang.
  if (file.size > PHOTO_MAX_FILE_BYTES * 2.5) {
    throw new Error(photoTooLargeMessage(file.size));
  }
}
