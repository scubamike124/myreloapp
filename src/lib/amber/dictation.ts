/** Shared microphone helpers — used by Amber Dock and Amber Fixes. */

export function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator?.mediaDevices?.getUserMedia)
  );
}

export function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

export function micPermissionError(name: string | undefined): string {
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access is blocked. Click the lock or camera icon at the left of your browser's address bar, allow the microphone, then try again.";
  }
  if (name === "NotFoundError") {
    return "No microphone was found. Plug one in, enable it in your system settings, and try again.";
  }
  if (name === "NotReadableError") {
    return "Your microphone is busy in another app. Close that app, then try again.";
  }
  return "Couldn't open your microphone. Check that this page is https (or localhost) and that no other app has exclusive access.";
}

export function micUnsupportedMessage(): string {
  return "Voice input needs a microphone and a secure page (https or localhost). This browser or address can't record.";
}
