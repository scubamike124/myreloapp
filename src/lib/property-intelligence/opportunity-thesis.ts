import type { BuyBox } from "./matching";
import { summarizeBuyBox } from "./matching";
import { findReportedLienAmount } from "./deal-evidence";

export type ConfidenceKind = "FACT" | "ESTIMATE" | "UNKNOWN";

export type ThesisSignal = {
  id: string;
  label: string;
  kind: ConfidenceKind;
  evidence: string;
  source: string;
  whyItMatters: string;
};

export type WhyThisMayBeAGoodDeal = {
  whyFound: string;
  whatDiscovered: string;
  whyThoseFactsMatter: string;
  numbers: string;
  risks: string;
  sources: string;
  confidence: string;
  plainEnglish: string;
};

export type OpportunityThesis = {
  offerable: boolean;
  rejectReason: string;
  signals: ThesisSignal[];
  client: WhyThisMayBeAGoodDeal;
  owner: WhyThisMayBeAGoodDeal;
};

const SPEC_ONLY =
  /california|county match|city match|property-type|specific geography|bedroom|bathroom|budget|zip match|too broad/i;

function dollars(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return "Not available";
  return `approximately $${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function payloadFlag(payload: Record<string, unknown>, re: RegExp): unknown {
  for (const [k, v] of Object.entries(payload || {})) {
    if (re.test(k) && v != null && v !== "" && v !== false && v !== 0 && v !== "0" && v !== "false") return v;
  }
  return null;
}

function sourceList(slugs: string[]): string {
  const s = slugs.filter(Boolean);
  return s.length ? s.join(", ") : "retained public-record source";
}

/**
 * Hard gate: Buy Box match only is never enough for $299.
 * At least one FACT signal that is not specification-fit is required.
 * Never invents asking price, comps, lien amounts, returns, or motivation.
 */
export function evaluateOpportunityThesis(input: {
  box: BuyBox;
  taxDelinquent?: boolean;
  foreclosure?: boolean;
  auction?: boolean;
  vacant?: boolean;
  absentee?: boolean;
  askingCents?: number | null;
  assessedCents?: number | null;
  daysOnMarket?: number | null;
  payload?: Record<string, unknown>;
  sourceSlugs?: string[];
  matchWhy?: string;
}): OpportunityThesis {
  const payload = input.payload || {};
  const sources = sourceList(input.sourceSlugs || []);
  const lien = findReportedLienAmount(payload);
  const signals: ThesisSignal[] = [];

  if (input.taxDelinquent) {
    signals.push({
      id: "tax_default",
      label: "Tax-default / tax-delinquent indicator",
      kind: "FACT",
      evidence: "County or permitted public source marked this parcel tax-delinquent / tax-defaulted.",
      source: sources,
      whyItMatters:
        "Unpaid tax can create a motivated-seller or tax-sale path. The dollar amount still needs a title/tax search.",
    });
  }
  if (lien.amount !== "Not collected") {
    signals.push({
      id: "tax_lien_amount",
      label: "Reported unpaid tax / lien amount",
      kind: "FACT",
      evidence: `Source field reported ${lien.amount}.`,
      source: sources,
      whyItMatters: "A known unpaid amount is a concrete distress number — still not a title search.",
    });
  }
  if (input.foreclosure) {
    signals.push({
      id: "foreclosure",
      label: "Foreclosure indicator",
      kind: "FACT",
      evidence: "A foreclosure indicator is present on the collected record.",
      source: sources,
      whyItMatters: "Foreclosure timelines can create below-market purchase paths. Status can change quickly.",
    });
  }
  if (input.auction) {
    signals.push({
      id: "auction",
      label: "Auction status",
      kind: "FACT",
      evidence: "An auction indicator is present on the collected record.",
      source: sources,
      whyItMatters: "Auction inventory is time-limited and may clear below typical retail.",
    });
  }
  if (input.vacant) {
    signals.push({
      id: "vacant",
      label: "Vacancy indicator",
      kind: "FACT",
      evidence: "A vacancy indicator is present on the collected record.",
      source: sources,
      whyItMatters: "Vacant property can mean carrying cost pressure or a value-add path. Confirm on site.",
    });
  }
  if (input.absentee) {
    signals.push({
      id: "absentee",
      label: "Absentee-owner indicator",
      kind: "FACT",
      evidence: "An absentee-owner indicator is present on the collected record.",
      source: sources,
      whyItMatters: "Out-of-area owners sometimes sell more readily. This is an indicator, not proof of motivation.",
    });
  }

  const reo = payloadFlag(payload, /bank.?owned|\breo\b|real.?estate.?owned/i);
  if (reo) {
    signals.push({
      id: "reo",
      label: "Bank-owned / REO indicator",
      kind: "FACT",
      evidence: `Source reported ${String(reo)}.`,
      source: sources,
      whyItMatters: "REO sellers often have a defined disposition process that can differ from retail listings.",
    });
  }
  const probate = payloadFlag(payload, /probate|estate.?sale/i);
  if (probate) {
    signals.push({
      id: "probate",
      label: "Probate / estate indicator",
      kind: "FACT",
      evidence: `Source reported ${String(probate)}.`,
      source: sources,
      whyItMatters: "Estate sales can have different timelines and pricing than a typical owner-occupant listing.",
    });
  }
  const reduced = payloadFlag(payload, /price.?reduc|reduction|reduced.?price/i);
  if (reduced && input.askingCents != null) {
    signals.push({
      id: "price_reduction",
      label: "Price reduction",
      kind: "FACT",
      evidence: `Listing/source reported a reduction (${String(reduced)}). Asking/list ${dollars(input.askingCents)}.`,
      source: sources,
      whyItMatters: "A documented cut from the original ask can signal a seller adjusting to the market.",
    });
  }
  const dom = input.daysOnMarket ?? Number(payload.days_on_market ?? payload.dom ?? NaN);
  if (Number.isFinite(dom) && dom >= 90 && input.askingCents != null) {
    signals.push({
      id: "long_dom",
      label: "Unusually long time on market",
      kind: "FACT",
      evidence: `Source reported ${Math.round(dom)} days on market with an asking/list price of ${dollars(input.askingCents)}.`,
      source: sources,
      whyItMatters: "Long exposure with a known ask can mean room to negotiate. It can also mean a problem with the asset.",
    });
  }

  if (input.askingCents != null && input.assessedCents != null && input.askingCents > 0 && input.assessedCents > 0) {
    const spread = input.assessedCents - input.askingCents;
    if (spread > 0) {
      signals.push({
        id: "ask_vs_assessed",
        label: "Asking vs assessor roll (estimate only)",
        kind: "ESTIMATE",
        evidence: `Asking/list ${dollars(input.askingCents)}; assessor roll ${dollars(input.assessedCents)}. Spread is not a comparable sale.`,
        source: sources,
        whyItMatters:
          "A list price below tax-roll value is a clue, not proof of a bargain. Assessor roll is not market value.",
      });
    }
  }

  const factSignals = signals.filter((s) => s.kind === "FACT");
  const offerable = factSignals.length >= 1;
  const rejectReason = offerable
    ? ""
    : "NO WORTHWHILE OPPORTUNITY THESIS — Buy Box / geography / property-type match is not enough. Amber found no verified distress, listing discount, auction, vacancy, absentee, REO, probate, or other evidence-backed reason this would be a good deal for this client.";

  const boxSummary = summarizeBuyBox(input.box);
  const specWhy = String(input.matchWhy || "").trim();
  const specIsOnlyFit = !specWhy || SPEC_ONLY.test(specWhy) || /match/i.test(specWhy);
  const clientSources =
    "Permitted public-record source(s) Amber collected. Named sources are withheld until unlock because some names identify a county.";

  const whyFoundClient =
    "Amber investigated this parcel because it matched a requirement set you actually saved in your Buy Box (location, type, budget, or distress interest you entered). That is why it was researched — not by itself why it would be worth $299.";
  const whyFoundOwner = `Amber investigated this parcel because it fit a requirement you actually saved: ${boxSummary}. Match notes: ${specWhy || "none"}. Spec-only match: ${specIsOnlyFit ? "yes" : "no"}. That is why it was researched — not by itself why it would be worth $299.`;

  const whatDiscovered = offerable
    ? factSignals.map((s) => `${s.label}: ${s.evidence} [${s.kind}]`).join(" ")
    : "Amber collected public-record identity and assessor characteristics, but did not find a verified distress, discount, auction, vacancy, or similar circumstance that would make this a worthwhile opportunity.";

  const whyThoseFactsMatter = offerable
    ? factSignals.map((s) => s.whyItMatters).join(" ")
    : "Matching location or property type only says the parcel is in-scope. It does not say the client should pay for a research unlock.";

  const numbersParts = [
    `Asking/list price: ${dollars(input.askingCents ?? null)}.`,
    `Assessor tax-roll total: ${dollars(input.assessedCents ?? null)} (tax value, not an appraisal).`,
    `Comparable sales: Not available — Amber will not invent comps.`,
    `Estimated discount/equity spread: ${
      signals.some((s) => s.id === "ask_vs_assessed")
        ? signals.find((s) => s.id === "ask_vs_assessed")?.evidence
        : "Not available — no supported spread."
    }`,
    lien.amount !== "Not collected" ? `Reported unpaid tax/lien: ${lien.amount}.` : "Unpaid tax/lien amount: Not collected.",
  ];

  const risks = [
    "Public records lag and are not a title search.",
    "Assessor value is not market value and not an appraisal.",
    input.askingCents == null ? "No asking/list price from a listing source." : "",
    !input.taxDelinquent && lien.amount === "Not collected" ? "No verified tax-lien dollar amount." : "",
    "Condition, occupancy, and seller motivation are unconfirmed unless a source stated them.",
  ]
    .filter(Boolean)
    .join(" ");

  const confidence = offerable
    ? `Verified FACTS: ${factSignals.map((s) => s.label).join("; ") || "none"}. ESTIMATES: ${
        signals.filter((s) => s.kind === "ESTIMATE").map((s) => s.label).join("; ") || "none"
      }. UNKNOWN: asking price, market comps, and returns are not invented.`
    : "No FACT-level opportunity signal. Specification fit is not a verified investment thesis.";

  const plainEnglish = offerable
    ? [
        "Why this may be a good deal for you:",
        factSignals.map((s) => `${s.label} — ${s.whyItMatters}`).join(" "),
        "Amber is not promising a profit. These are the verified circumstances that earned this a $299 research offer.",
      ].join(" ")
    : "Amber cannot honestly tell you why this would be a good deal. It only matched your saved location/type filters. That is not enough to charge $299.";

  const client: WhyThisMayBeAGoodDeal = {
    whyFound: whyFoundClient,
    whatDiscovered,
    whyThoseFactsMatter,
    numbers: numbersParts.join(" "),
    risks,
    sources: clientSources,
    confidence,
    plainEnglish,
  };

  const owner: WhyThisMayBeAGoodDeal = {
    ...client,
    whyFound: whyFoundOwner,
    sources,
  };

  return { offerable, rejectReason, signals, client, owner };
}
