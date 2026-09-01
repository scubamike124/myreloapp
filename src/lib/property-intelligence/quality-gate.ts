import {
  MIN_FACT_FIELDS_FOR_SALE,
  MIN_OFFER_CONFIDENCE,
  MIN_OFFER_MATCH_SCORE,
} from "./constants";

export type QualityInput = {
  exists: boolean;
  california: boolean;
  hasSource: boolean;
  hasFact: boolean;
  duplicate: boolean;
  previewPass: boolean;
  identifyingLocked: boolean;
  confidence: number;
  stale: boolean;
  meaningful?: boolean;
  factCount?: number;
  priceKnown?: boolean;
  opportunityScoreSet?: boolean;
  matchScore?: number;
  classified?: boolean;
  conflictsReviewed?: boolean;
  /** Required for $299. Spec/Buy Box match is never enough. */
  hasInvestmentThesis?: boolean;
};

export function qualityGate(input: QualityInput): { offerable: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.exists) reasons.push("INSUFFICIENT DATA — property does not appear to exist");
  if (!input.california) reasons.push("COMPLIANCE ISSUE — not California");
  if (!input.hasSource) reasons.push("SOURCE UNRELIABLE — no retained source");
  if (!input.hasFact) reasons.push("RESEARCH PACKAGE NOT WORTH $299 — no confirmed/source-reported fact");
  if (input.duplicate) reasons.push("DUPLICATE");
  if (!input.previewPass) reasons.push("COMPLIANCE ISSUE — reverse-identification risk");
  if (!input.identifyingLocked) reasons.push("COMPLIANCE ISSUE — identifying information not locked");
  if (input.stale) reasons.push("STALE LISTING — re-verify before offering $299 package");
  if (input.classified === false) reasons.push("INSUFFICIENT DATA — facts not classified");
  if (input.conflictsReviewed === false) reasons.push("DATA CONFLICT — unresolved");
  if (input.opportunityScoreSet === false) reasons.push("RESEARCH PACKAGE NOT WORTH $299 — opportunity score missing");
  if (input.priceKnown === false) reasons.push("RESEARCH PACKAGE NOT WORTH $299 — no asking or assessed value");
  if ((input.factCount ?? 0) < MIN_FACT_FIELDS_FOR_SALE) {
    reasons.push("RESEARCH PACKAGE NOT WORTH $299 — too few classified facts");
  }
  if (input.meaningful === false) reasons.push("NO MEANINGFUL OPPORTUNITY — placeholder/public-record stub");
  if (input.confidence < MIN_OFFER_CONFIDENCE) reasons.push("LOW CONFIDENCE");
  if (input.matchScore != null && input.matchScore < MIN_OFFER_MATCH_SCORE) {
    reasons.push("POOR MATCH — Buy Box overlap below offer threshold");
  }
  if (input.hasInvestmentThesis === false) {
    reasons.push(
      "NO WORTHWHILE OPPORTUNITY THESIS — matching the Buy Box, state, or property type is not a $299 opportunity",
    );
  }
  return { offerable: reasons.length === 0, reasons };
}
