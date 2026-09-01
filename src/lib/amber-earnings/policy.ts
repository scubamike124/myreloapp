/**
 * Capability and quality rules.
 * Separates: (1) can Amber produce this kind of work, (2) are required inputs present,
 * (3) is the marketplace pipeline ready to accept/submit.
 * Never bid on work we cannot complete or verify end-to-end.
 */

export type WorkCapability = {
  /** Amber's tools/agents can produce this class of deliverable. */
  ok: boolean;
  reasons: string[];
  /** Exact missing skills / infra (empty when skill fit is OK). */
  missingCapabilities: string[];
  /** Customer/source inputs still needed before a verified delivery. */
  missingInputs: string[];
  computeUsd: number;
  successProbability: number;
  category: string;
};

const GREENFIELD_BUILD =
  /\b(build|create|write|generate|implement|develop|scaffold|make)\b/i;
const HAS_SOURCE_HINT =
  /\b(github|gitlab|repo|repository|gist|attached|provided|openapi|swagger|spec|pdf|csv|url|http|endpoint list|source code|contract)\b/i;

/** Families Amber can actually deliver with coding agents + Worker/cloud tooling. */
const CAPABLE_FAMILIES: Array<{
  id: string;
  match: RegExp;
  computeUsd: number;
  successProbability: number;
  needsInputHint?: RegExp;
  inputLabel?: string;
}> = [
  {
    id: "etl_pipeline",
    match: /\b(etl|data pipeline|postgresql|postgres|rest apis? to)\b/i,
    computeUsd: 3.5,
    successProbability: 0.55,
    needsInputHint: /\b(api|endpoint|schema|url|docs)\b/i,
    inputLabel: "Source API docs / schemas for the feeds",
  },
  {
    id: "web_data_extraction",
    match: /\b(scrape|scraping|crawl|product listings?|structure .+ listings?)\b/i,
    computeUsd: 3.5,
    successProbability: 0.55,
    needsInputHint: /\b(https?:\/\/|www\.|site|store|url)\b/i,
    inputLabel: "Target site URL and confirmation the site allows automated extraction",
  },
  {
    id: "api_test_generation",
    match: /\b(pytest|test suite|unit tests?|integration tests?|fastapi.+test|rest api.+test)\b/i,
    computeUsd: 2.5,
    successProbability: 0.62,
    needsInputHint: /\b(openapi|swagger|github|repo|endpoint|spec|attached)\b/i,
    inputLabel: "API under test (OpenAPI, repo, or endpoint list)",
  },
  {
    id: "technical_translation",
    match: /\b(translat\w+|multilingual|en to|localization|localisation)\b/i,
    computeUsd: 2,
    successProbability: 0.7,
    needsInputHint: /\b(pdf|markdown|doc|attached|url|github|pages?)\b/i,
    inputLabel: "Source documents to translate",
  },
  {
    id: "rag_pdf_pipeline",
    match: /\b(rag|embeddings?|langchain|vector store|semantic search|pdf research)\b/i,
    computeUsd: 4,
    successProbability: 0.5,
    needsInputHint: /\b(pdf|corpus|dataset|url|s3|drive|github|attached)\b/i,
    inputLabel: "PDF corpus or downloadable document set",
  },
  {
    id: "react_dashboard",
    match: /\b(react|websocket|frontend|wcag)\b/i,
    computeUsd: 3.5,
    successProbability: 0.55,
  },
  {
    id: "csv_dashboard",
    match: /\b(csv|data-viz|sales dashboard|interactive .+ dashboard|heatmap)\b/i,
    computeUsd: 2.5,
    successProbability: 0.65,
    needsInputHint: /\b(csv|dataset|spreadsheet|attached|url|sample)\b/i,
    inputLabel: "CSV / dataset (or a sample schema in the brief)",
  },
  {
    id: "fastapi_service",
    match: /\b(fastapi|microservice|jwt|rate limiting|openapi)\b/i,
    computeUsd: 3,
    successProbability: 0.6,
  },
  {
    id: "api_documentation",
    match: /\b(api documentation|document \d+|openapi docs|developer documentation)\b/i,
    computeUsd: 2,
    successProbability: 0.68,
    needsInputHint: /\b(endpoint|openapi|swagger|repo|github|spec)\b/i,
    inputLabel: "API surface to document (spec or repo)",
  },
  {
    id: "code_security_review",
    match: /\b(sql injection|xss|csrf|code review|express\.?js.*vulnerabilit)\b/i,
    computeUsd: 2.5,
    successProbability: 0.5,
    needsInputHint: /\b(github|repo|gist|attached|source)\b/i,
    inputLabel: "Source repository or attached codebase",
  },
  {
    id: "general_software",
    match: /\b(python|typescript|javascript|script|normalize|json|automation|data-extraction|charts?)\b/i,
    computeUsd: 1.5,
    successProbability: 0.55,
  },
];

/** Hard capability gaps — do not soften these. */
function hardCapabilityGaps(blob: string): string[] {
  const missing: string[] = [];
  if (/\b(fine-?tune|resnet|gpu training|pytorch training|train (a |the )?model|custom dataset.{0,40}(images?|gpu))\b/i.test(blob)) {
    missing.push("GPU model-training infrastructure (fine-tune / ResNet / PyTorch training jobs)");
  }
  if (/\b(computer-?vision training|image classifier on custom dataset)\b/i.test(blob)) {
    missing.push("Supervised CV training pipeline with owner GPU budget");
  }
  if (/\b(solidity|erc-?20|smart contract|blockchain)\b/i.test(blob) && /\b(audit|security|vulnerabilit)\b/i.test(blob)) {
    missing.push(
      "Verified Solidity security-audit toolchain + formal verification workflow (specialized; Amber will not claim without contract source and a reproducible audit method)",
    );
  }
  if (/\b(penetration|pen-?test|red team|exploit live)\b/i.test(blob)) {
    missing.push("Authorized live penetration-testing scope and tooling");
  }
  if (/\b(public post|followers|#ad|#sponsored|tracked link|instagram|tiktok|twitter|x\.com|linkedin post|proof of publication)\b/i.test(blob)) {
    missing.push("Human social account (Amber will not impersonate a person or buy engagement)");
  }
  if (/\b(cold email|spam|mass mail)\b/i.test(blob)) {
    missing.push("Mike-approved mass/cold outreach campaign");
  }
  // Routine "contact the buyer" / job messaging is pre-authorized (see buyerCommsPolicy).
  return missing;
}

function classifyCapable(blob: string): (typeof CAPABLE_FAMILIES)[number] | null {
  for (const fam of CAPABLE_FAMILIES) {
    if (fam.match.test(blob)) return fam;
  }
  return null;
}

function assessWorkCapability(input: {
  title: string;
  description: string;
  requirements?: string[];
}): WorkCapability {
  const req = (input.requirements || []).map((r) => r.toLowerCase());
  const blob = `${input.title}\n${input.description}\n${req.join(" ")}`;
  const missingCapabilities = hardCapabilityGaps(blob);
  const missingInputs: string[] = [];
  const reasons: string[] = [];

  if (missingCapabilities.length) {
    return {
      ok: false,
      reasons: missingCapabilities.map((m) => `Missing capability: ${m}`),
      missingCapabilities,
      missingInputs,
      computeUsd: 5,
      successProbability: 0.08,
      category: "out_of_scope",
    };
  }

  // Solidity / chain work without the "audit" path already caught — still block bare chain build claims.
  if (/\b(solidity|erc-?20|blockchain)\b/i.test(blob) && !/\b(document|explain|summary)\b/i.test(blob)) {
    missingCapabilities.push("Blockchain/Solidity delivery with verifiable on-chain test harness");
    return {
      ok: false,
      reasons: ["Missing capability: Blockchain/Solidity delivery with verifiable on-chain test harness"],
      missingCapabilities,
      missingInputs,
      computeUsd: 4,
      successProbability: 0.1,
      category: "out_of_scope",
    };
  }

  const fam = classifyCapable(blob);
  if (!fam) {
    if (input.description.trim().length < 24 && input.title.trim().length < 12) {
      return {
        ok: false,
        reasons: ["Listing has no brief Amber can deliver against."],
        missingCapabilities: ["Sufficient job brief"],
        missingInputs: ["Clear deliverable description"],
        computeUsd: 1,
        successProbability: 0.1,
        category: "underspecified",
      };
    }
    return {
      ok: false,
      reasons: [
        "No matching Amber work family for this listing (not in software, data extraction, docs/translation, RAG/PDF, dashboards, ETL, or code review).",
      ],
      missingCapabilities: ["Mapped work family for this listing"],
      missingInputs,
      computeUsd: 2,
      successProbability: 0.15,
      category: "unknown",
    };
  }

  reasons.push(`Matches Amber work family: ${fam.id.replace(/_/g, " ")}.`);

  // Greenfield builds from a clear brief are OK without an attached repo.
  const greenfield = GREENFIELD_BUILD.test(input.title) || GREENFIELD_BUILD.test(input.description);
  if (fam.needsInputHint && fam.inputLabel) {
    const hasHint = fam.needsInputHint.test(blob) || HAS_SOURCE_HINT.test(blob);
    if (!hasHint && !greenfield) {
      missingInputs.push(fam.inputLabel);
    } else if (!hasHint && greenfield) {
      // Still note preferred inputs, but do not fail skill fit for a build-from-brief.
      missingInputs.push(`Preferred (not blocking skill fit): ${fam.inputLabel}`);
    }
  }

  // Security / audit style still needs source even if family matched code review.
  if (fam.id === "code_security_review" && !HAS_SOURCE_HINT.test(blob)) {
    missingInputs.push("Source repository or attached codebase to review");
  }

  // Blocking inputs = required before claiming perform-complete; preferred notes don't block skill.
  const blockingInputs = missingInputs.filter((m) => !m.startsWith("Preferred"));
  const ok = true; // skill family matched and hard gaps cleared
  if (blockingInputs.length) {
    reasons.push(`Skill fit OK, but delivery still needs: ${blockingInputs.join("; ")}.`);
  } else {
    reasons.push("Skill fit OK — Amber can produce this class of deliverable with coding agents / cloud tooling.");
  }

  return {
    ok,
    reasons,
    missingCapabilities: [],
    missingInputs,
    computeUsd: fam.computeUsd,
    successProbability: Math.max(0.2, fam.successProbability - (blockingInputs.length ? 0.12 : 0)),
    category: fam.id,
  };
}

export function sporeCanComplete(input: {
  title: string;
  description: string;
  requirements: string[];
}): { ok: boolean; reasons: string[]; computeUsd: number; successProbability: number; missingCapabilities: string[]; missingInputs: string[]; category: string } {
  const w = assessWorkCapability(input);
  return {
    ok: w.ok,
    reasons: w.reasons,
    computeUsd: w.computeUsd,
    successProbability: w.successProbability,
    missingCapabilities: w.missingCapabilities,
    missingInputs: w.missingInputs,
    category: w.category,
  };
}

export function taskBountyCanComplete(input: {
  language?: string;
  title: string;
  complexity?: string;
}): { ok: boolean; reasons: string[]; computeUsd: number; successProbability: number; missingCapabilities: string[]; missingInputs: string[] } {
  const lang = (input.language || "").toLowerCase();
  const reasons: string[] = [];
  const missingCapabilities: string[] = [];
  const supported = ["typescript", "javascript", "python", "ts", "js"];
  if (lang && !supported.some((s) => lang.includes(s))) {
    const msg = `Language "${input.language}" is outside Amber's verified solver set (TypeScript / JavaScript / Python).`;
    reasons.push(msg);
    missingCapabilities.push(`Verified solver for ${input.language}`);
  }
  const hard = hardCapabilityGaps(`${input.title}`);
  missingCapabilities.push(...hard);
  reasons.push(...hard.map((m) => `Missing capability: ${m}`));
  const computeUsd = input.complexity === "small" ? 1.25 : 3.5;
  const successProbability = input.complexity === "small" ? 0.45 : 0.28;
  if (reasons.length) {
    return {
      ok: false,
      reasons,
      computeUsd,
      successProbability: Math.min(successProbability, 0.2),
      missingCapabilities,
      missingInputs: input.title ? [] : ["Bounty title / issue body"],
    };
  }
  return {
    ok: true,
    reasons: ["Language/complexity within Amber's TaskBounty solver set."],
    computeUsd,
    successProbability,
    missingCapabilities: [],
    missingInputs: [],
  };
}

export function moltCanComplete(input: {
  title: string;
  description: string;
}): { ok: boolean; reasons: string[]; computeUsd: number; successProbability: number; missingCapabilities: string[]; missingInputs: string[]; category: string } {
  const w = assessWorkCapability({
    title: input.title,
    description: input.description,
    requirements: [],
  });
  return {
    ok: w.ok,
    reasons: w.reasons,
    computeUsd: w.computeUsd,
    successProbability: w.successProbability,
    missingCapabilities: w.missingCapabilities,
    missingInputs: w.missingInputs,
    category: w.category,
  };
}

/** Same skill families as MoltJobs — WorkProtocol also uses claim → deliver. */
export function workProtocolCanComplete(input: {
  title: string;
  description: string;
}): ReturnType<typeof moltCanComplete> {
  return moltCanComplete(input);
}
