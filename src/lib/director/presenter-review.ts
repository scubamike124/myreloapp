// ---------------------------------------------------------------------------
// Does the presenter hold up?
//
// The brief's standard is one sentence: if someone watches without being told
// it is AI, they should believe a real spokesperson was filmed. That is a
// judgement about a picture, so it is made by looking at the picture — a frame
// pulled from the finished take, shown to a model that is asked the same
// question a viewer would answer in the first second.
//
// Kept apart from the commercial's own review on purpose. That one asks whether
// the ADVERT works; this asks whether the PERSON is convincing. A brilliant
// script fronted by something that looks generated fails on this axis alone,
// and the fix is different too: recast, rather than rewrite.
//
// The scores are gated hard because the brief asks for that, and because the
// failure they catch is not subtle — a floating cutout, a white void, a face
// that does not sit in its own light.
// ---------------------------------------------------------------------------

import { askJson, num, str, strList, type JsonSchema } from "./gemini";

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    looksFilmed: { type: "boolean" },
    faceRealism: { type: "number" },
    lighting: { type: "number" },
    backgroundRealism: { type: "number" },
    framing: { type: "number" },
    wardrobe: { type: "number" },
    tells: { type: "array", items: { type: "string" } },
    verdict: { type: "string" },
  },
  required: ["looksFilmed", "faceRealism", "lighting", "backgroundRealism", "framing", "wardrobe", "tells", "verdict"],
};

export type PresenterReview = {
  looksFilmed: boolean;
  scores: { faceRealism: number; lighting: number; backgroundRealism: number; framing: number; wardrobe: number };
  overall: number;
  pass: boolean;
  tells: string[];
  verdict: string;
};

/** Every category must clear this. The brief asks for 9; nothing here rounds up. */
const FLOOR = 9;

export async function reviewPresenter(opts: {
  key: string;
  /** A JPEG frame from the rendered take, base64, no data: prefix. */
  frameBase64: string;
  mimeType?: string;
  /** What the business is, so wardrobe can be judged against it. */
  category: string;
}): Promise<PresenterReview> {
  const { key, frameBase64, mimeType = "image/jpeg", category } = opts;

  const prompt =
    `The image is a single frame from a commercial for ${category}. The person on screen is the\n` +
    `spokesperson. You have not been told how it was made.\n\n` +
    `Answer as someone scrolling past, not as a reviewer being kind.\n\n` +
    `- looksFilmed: would you believe a real person was filmed for this? If anything says "AI avatar",\n` +
    `  the answer is false. Be strict — this is the whole question.\n` +
    `- faceRealism (0-10): skin, eyes, hairline, the edges of the face. Any waxiness or smearing?\n` +
    `- lighting (0-10): does the light on the person match the light in the room behind them? A subject\n` +
    `  lit differently from their background is the clearest sign of a composite.\n` +
    `- backgroundRealism (0-10): is there a real place behind them, with depth? Score 0 for a plain\n` +
    `  white or black backdrop, a transparent void, or a person visibly cut out and pasted on.\n` +
    `- framing (0-10): a chest-up or waist-up medium shot scores high. Full body with a small distant\n` +
    `  face, or a head cropped awkwardly, scores low.\n` +
    `- wardrobe (0-10): would this person plausibly work at ${category}, dressed like that?\n` +
    `- tells: up to 4 specific things that give away it was generated. Empty if genuinely none.\n` +
    `- verdict: one sentence — would you trust this spokesperson?`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    temperature: 0.3,
    maxOutputTokens: 1024,
    images: [{ mimeType, base64: frameBase64 }],
  });

  const scores = {
    faceRealism: num(raw.faceRealism, 0, 10, 0),
    lighting: num(raw.lighting, 0, 10, 0),
    backgroundRealism: num(raw.backgroundRealism, 0, 10, 0),
    framing: num(raw.framing, 0, 10, 0),
    wardrobe: num(raw.wardrobe, 0, 10, 0),
  };
  const values = Object.values(scores);
  const overall = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const looksFilmed = raw.looksFilmed === true;

  return {
    looksFilmed,
    scores,
    overall,
    // Both gates: the belief question and every floor. A presenter that scores
    // well on parts while reading as generated overall has still failed.
    pass: looksFilmed && values.every((v) => v >= FLOOR),
    tells: strList(raw.tells, 4, 200),
    verdict: str(raw.verdict, 300),
  };
}

/** Why a presenter was rejected, in one line, for the recast log. */
export function whyRecast(review: PresenterReview, presenterName: string): string {
  if (!review.looksFilmed) return `${presenterName} read as an AI avatar${review.tells[0] ? ` (${review.tells[0]})` : ""}`;
  const weakest = (Object.entries(review.scores) as [string, number][]).sort((a, b) => a[1] - b[1])[0];
  return `${presenterName} scored ${weakest[1]}/10 on ${weakest[0]}`;
}
