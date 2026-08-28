// ---------------------------------------------------------------------------
// Stage 1 — what is actually true about this business.
//
// The old analyze route asked for a name, a category and a two-sentence
// summary, which is enough to write a sentence about a business and nowhere
// near enough to direct one. You cannot storyboard "a two-sentence summary":
// there is nothing in it to point a camera at.
//
// So this stage asks different questions. Who is the customer, in the specific.
// What does their week look like before this business exists. What rooms,
// vehicles, tools and surfaces does this business physically occupy — because
// those are the sets. And, separately and strictly, which claims the page
// genuinely made, because those are the only ones allowed on screen.
// ---------------------------------------------------------------------------

import type { BusinessIntel } from "./types";
import { askJson, str, strList, type JsonSchema } from "./gemini";

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string" },
    whatTheySell: { type: "string" },
    customer: { type: "string" },
    problem: { type: "string" },
    transformation: { type: "string" },
    differentiators: { type: "array", items: { type: "string" } },
    provenClaims: { type: "array", items: { type: "string" } },
    environments: { type: "array", items: { type: "string" } },
    objection: { type: "string" },
    tone: { type: "string" },
    palette: { type: "array", items: { type: "string" } },
  },
  required: [
    "name",
    "category",
    "whatTheySell",
    "customer",
    "problem",
    "transformation",
    "differentiators",
    "provenClaims",
    "environments",
    "objection",
    "tone",
    "palette",
  ],
};

export async function readBusiness(opts: {
  key: string;
  /** Page text from scrapePage, or "" when there was no readable site. */
  siteText: string;
  /** The URL or the customer's own description — whichever we were given. */
  source: string;
  /** Anything the customer typed about themselves, which outranks the scrape. */
  told: string;
}): Promise<BusinessIntel> {
  const { key, siteText, source, told } = opts;
  const sourced = Boolean(siteText.trim());

  const prompt =
    `You are a commercial director's researcher. Before anyone writes a script, you establish what is\n` +
    `physically true about this business — because a camera can only point at real things.\n\n` +
    `Source: ${source}\n` +
    (told ? `\nWhat the owner told us:\n${told}\n` : "") +
    (sourced ? `\nTheir website:\n${siteText}\n` : `\n(No readable website. Infer only what the name and any description support, and keep provenClaims empty.)\n`) +
    `\nAnswer these, concretely:\n` +
    `- name: the business name as they write it.\n` +
    `- category: the trade or sector, 2-4 words.\n` +
    `- whatTheySell: the actual thing a customer pays for. Not a mission statement.\n` +
    `- customer: one specific person. Their situation, not a demographic bracket.\n` +
    `  Good: "a landlord with a flat between tenants and a week to fix it".\n` +
    `  Bad: "homeowners aged 30-55".\n` +
    `- problem: what that person's week looks like before this business exists. Visible, not abstract.\n` +
    `- transformation: what is different afterwards, described as something you could film.\n` +
    `- differentiators: up to 4 things that genuinely separate them. Skip anything every rival also says.\n` +
    `- provenClaims: ONLY claims the source explicitly states — years trading, accreditations,\n` +
    `  guarantees, numbers, awards. Quote them close to verbatim. If the source states none, return an\n` +
    `  empty list. Never infer one. This list is the only thing allowed to be asserted on screen.\n` +
    `- environments: up to 5 real, filmable places this business exists in — the workshop floor, the\n` +
    `  van at 7am, the treatment room, the customer's kitchen mid-job. These become the sets.\n` +
    `- objection: the reason a customer who wants this still hesitates before calling.\n` +
    `- tone: how the brand sounds, 1-3 words.\n` +
    `- palette: up to 4 hex colours the brand appears to use, "#rrggbb". Empty if unknown.`;

  const raw = await askJson<Record<string, unknown>>({
    key,
    prompt,
    schema: SCHEMA,
    // Research, not invention. Low temperature keeps it on the page.
    temperature: 0.3,
    maxOutputTokens: 3072,
  });

  return {
    name: str(raw.name, 120) || "This business",
    category: str(raw.category, 60),
    whatTheySell: str(raw.whatTheySell, 300),
    customer: str(raw.customer, 300),
    problem: str(raw.problem, 400),
    transformation: str(raw.transformation, 400),
    differentiators: strList(raw.differentiators, 4, 180),
    // Unsourced runs get no proven claims at all, whatever the model returned —
    // there was no page to prove anything against.
    provenClaims: sourced ? strList(raw.provenClaims, 6, 220) : [],
    environments: strList(raw.environments, 5, 160),
    objection: str(raw.objection, 300),
    tone: str(raw.tone, 60),
    palette: strList(raw.palette, 4, 9).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)),
    sourced,
  };
}

/** The intel as prompt text, for the stages downstream of this one. */
export function intelBriefing(intel: BusinessIntel): string {
  return (
    `THE BUSINESS\n` +
    `  name: ${intel.name}\n` +
    `  category: ${intel.category}\n` +
    `  sells: ${intel.whatTheySell}\n` +
    `  customer: ${intel.customer}\n` +
    `  their problem: ${intel.problem}\n` +
    `  the transformation: ${intel.transformation}\n` +
    `  what sets them apart: ${intel.differentiators.join(" · ") || "(nothing stated)"}\n` +
    `  the hesitation to overcome: ${intel.objection}\n` +
    `  brand tone: ${intel.tone}\n` +
    `  filmable locations: ${intel.environments.join(" · ") || "(none identified — invent nothing exotic; keep to plain, plausible places for this trade)"}\n` +
    `  PROVEN CLAIMS (the only facts you may assert):\n` +
    (intel.provenClaims.length
      ? intel.provenClaims.map((c) => `    - ${c}`).join("\n")
      : `    (none — you may not put a single number, guarantee, award or credential on screen)`)
  );
}
