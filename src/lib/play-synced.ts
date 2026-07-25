/**
 * Start playback from t=0 with audio unlocked.
 * Resets the media clock so A/V stay aligned after muted buffering / overlays.
 */
export async function playSyncedWithSound(video: HTMLVideoElement): Promise<void> {
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    /* some browsers throw if not loaded yet */
  }
  video.muted = false;
  video.volume = 1;
  // Wait a frame so the seek applies before play (avoids audible lead-in).
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await video.play();
}
