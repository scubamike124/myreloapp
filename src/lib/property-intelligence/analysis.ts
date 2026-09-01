export type FieldKind = "FACT" | "ESTIMATE" | "UNKNOWN" | "REQUIRES_PROFESSIONAL_VERIFICATION";

export type AnalysisField = {
  label: string;
  kind: FieldKind;
  value: string;
  note?: string;
};

export function moneyApprox(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "UNKNOWN";
  return `approximately $${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function analyzeProperty(input: {
  askingCents: number | null;
  assessedCents: number | null;
  estMarketCents: number | null;
  estRentCents: number | null;
  ownershipYears: number | null;
  absentee: boolean;
  vacant: boolean;
  taxDelinquent: boolean;
  foreclosure: boolean;
  auction: boolean;
  fsbo: boolean;
  sourceReliability: number;
  fieldsPresent: number;
  fieldsTotal: number;
}): {
  fields: AnalysisField[];
  dealScore: number;
  dataConfidence: number;
  why: string;
  distress: string[];
} {
  const fields: AnalysisField[] = [
    {
      label: "Asking / acquisition price",
      kind: input.askingCents != null ? "FACT" : "UNKNOWN",
      value: input.askingCents != null ? moneyApprox(input.askingCents) : "UNKNOWN",
    },
    {
      label: "Assessed value",
      kind: input.assessedCents != null ? "FACT" : "UNKNOWN",
      value: input.assessedCents != null ? moneyApprox(input.assessedCents) : "UNKNOWN",
      note: "Assessor roll — not a market appraisal.",
    },
    {
      label: "Estimated market value",
      kind: input.estMarketCents != null ? "ESTIMATE" : "UNKNOWN",
      value: input.estMarketCents != null ? moneyApprox(input.estMarketCents) : "UNKNOWN",
      note: "Automated valuation is not an appraisal.",
    },
    {
      label: "Estimated rent",
      kind: input.estRentCents != null ? "ESTIMATE" : "UNKNOWN",
      value: input.estRentCents != null ? moneyApprox(input.estRentCents) : "UNKNOWN",
      note: "Requires independent rent verification.",
    },
  ];

  let estEquity: number | null = null;
  if (input.estMarketCents != null && input.assessedCents != null) {
    estEquity = Math.max(0, input.estMarketCents - input.assessedCents);
    fields.push({
      label: "Estimated equity",
      kind: "ESTIMATE",
      value: moneyApprox(estEquity),
      note: "Estimated equity based on identified property records. Actual value, debt, liens and title must be independently verified.",
    });
  } else {
    fields.push({
      label: "Estimated equity",
      kind: "UNKNOWN",
      value: "UNKNOWN",
      note: "Not enough permitted data to estimate equity.",
    });
  }

  const distress: string[] = [];
  if (input.taxDelinquent) distress.push("tax delinquency indicator");
  if (input.foreclosure) distress.push("foreclosure/default indicator");
  if (input.auction) distress.push("auction status");
  if (input.vacant) distress.push("vacant-property indicator");
  if (input.absentee) distress.push("absentee-owner indicator");
  if (input.fsbo) distress.push("FSBO");
  if (input.ownershipYears != null && input.ownershipYears >= 15) distress.push("long ownership");

  let deal = 40;
  const positives: string[] = [];
  const risks: string[] = [];
  if (estEquity != null && input.estMarketCents && estEquity / input.estMarketCents >= 0.35) {
    deal += 18;
    positives.push("material estimated equity vs assessed basis");
  }
  if (distress.length >= 2) {
    deal += 14;
    positives.push(`combined distress signals (${distress.join(", ")})`);
  } else if (distress.length === 1) {
    deal += 6;
    positives.push(distress[0]);
  }
  if (input.fsbo) {
    deal += 5;
    positives.push("FSBO (no traditional listing assumed)");
  }
  if (input.foreclosure || input.taxDelinquent) {
    risks.push("lien/title risk — not a title search");
    deal += 4;
  }
  if (input.fieldsPresent < 4) {
    deal -= 8;
    risks.push("thin permitted data");
  }
  deal = Math.max(1, Math.min(99, deal));

  const conf = Math.max(
    8,
    Math.min(95, Math.round((input.fieldsPresent / Math.max(1, input.fieldsTotal)) * 55 + input.sourceReliability * 0.4)),
  );

  const why = [
    `Amber Deal Score: ${deal}/100`,
    "WHY AMBER FLAGGED THIS PROPERTY",
    positives.length ? `Positive: ${positives.join("; ")}.` : "Positive: limited positive signals from permitted records.",
    risks.length ? `Risks: ${risks.join("; ")}.` : "Risks: standard public-record lag and incomplete debt data.",
    "Data Confidence is scored separately from deal attractiveness.",
  ].join(" ");

  return { fields, dealScore: deal, dataConfidence: conf, why, distress };
}
