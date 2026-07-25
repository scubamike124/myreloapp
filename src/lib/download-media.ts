/**
 * Download a same-origin or data: media URL as a file.
 * Cross-origin <a download> is ignored by browsers — that was part of the
 * "playback/download broken" production bug for HeyGen CDN links.
 */
export async function downloadMedia(url: string, filename: string): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      return;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
