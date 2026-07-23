// ---------------------------------------------------------------------------
// Google Veo — start a render, and check on it once.
//
// Shared by the two tools that animate a still image (Talking/Dancing Photo and
// Product Commercial). It used to be duplicated in both routes, each blocking a
// single request for up to five minutes while polling. That is the pattern that
// cannot run on Cloudflare Workers — and is fragile anywhere, since a dropped
// connection loses the whole job.
//
// So the loop is gone. `startVeo` kicks the job off and returns its operation
// handle; `checkVeo` reports on it once and returns the finished video when it
// is ready. A route's POST starts the job and returns the handle immediately;
// its GET calls checkVeo, so the client polls in short requests. Same pattern
// the HeyGen tools already use.
// ---------------------------------------------------------------------------

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const VEO_MODEL = "veo-3.1-fast-generate-preview";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Clip length, in seconds. Veo bills per second, so this is a direct cost lever. */
export const VIDEO_SECONDS = Number(process.env.VIDEO_SECONDS ?? 6);

/**
 * The operation handle comes back to us from the client on every poll, so it
 * must be validated before being placed in a fetch URL — it is never allowed to
 * be an arbitrary address. A real Veo handle looks like
 * "models/veo-.../operations/abc123" or "operations/abc123".
 */
export function isVeoOperation(op: string): boolean {
  return (
    typeof op === "string" &&
    op.length < 400 &&
    /^(models\/[A-Za-z0-9._-]+\/)?operations\/[A-Za-z0-9._-]+$/.test(op) &&
    !op.includes("..")
  );
}

/**
 * Start a render and return its operation handle. The prompt is passed through
 * verbatim — the caller composes the full text (style included) — so both tools
 * keep their own wording.
 */
export async function startVeo(
  key: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  tries = 3,
): Promise<string> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(`${BASE}/models/${VEO_MODEL}:predictLongRunning?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt, image: { bytesBase64Encoded: imageBase64, mimeType } }],
        // 6s instead of the 8s default is a 25% saving and a natural short-form
        // length. durationSeconds accepts 5-8.
        parameters: { aspectRatio: "9:16", durationSeconds: VIDEO_SECONDS },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    if (res.ok && data.name) return data.name as string;
    const msg = data?.error?.message || `Veo start failed (${res.status}).`;
    if ((res.status === 429 || /quota|rate limit|resource has been exhausted/i.test(msg)) && attempt < tries) {
      await sleep(20_000);
      continue;
    }
    throw new Error(msg);
  }
  throw new Error("Veo start failed.");
}

export type VeoStatus =
  | { status: "processing" }
  | { status: "completed"; videoUrl: string }
  | { status: "failed"; error: string };

/**
 * Check a render once. Returns "processing" while it runs, and — the moment it
 * is done — fetches the finished clip and returns it as a data URL, so the
 * status route hands the client a ready-to-play video in a single response.
 */
export async function checkVeo(key: string, op: string): Promise<VeoStatus> {
  const res = await fetch(`${BASE}/${op}?key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(30_000) });
  const data = await res.json();
  if (!res.ok) return { status: "failed", error: data?.error?.message || `Status check failed (${res.status}).` };
  if (!data.done) return { status: "processing" };
  if (data.error) return { status: "failed", error: data.error.message || "Generation failed." };

  const uri = data?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) return { status: "failed", error: "Veo returned no video." };

  const r = await fetch(`${uri}&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(90_000) });
  if (!r.ok) return { status: "failed", error: "Could not download the finished video." };
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: "completed", videoUrl: `data:video/mp4;base64,${buf.toString("base64")}` };
}
