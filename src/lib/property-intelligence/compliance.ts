import { UNLOCK_PRICE_CENTS, UNLOCK_PRICE_USD } from "./constants";

export const CA_PILOT_REJECT =
  "Amber Property Intelligence is currently available for California properties only.";

export const BROKERAGE_FLAG = "BROKERAGE BOUNDARY — HUMAN/PROFESSIONAL REQUIRED";

export const FINDER_FEE_COLLECTION_ENABLED_DEFAULT = false;

export const ESTIMATE_DISCLAIMER =
  "Estimates require independent verification. Automated valuation is not an appraisal. Automated lien research is not a title search. Automated repair estimates are not a contractor inspection. Public records are not guaranteed current.";

export const TITLE_DISCLAIMER =
  "Automated/public-record research identified the following items. This is not a title search. Obtain a professional title report before relying on lien or ownership information.";

const BROKERAGE_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\bnegotiat(e|ion|ing)\b/i, label: "negotiation" },
  { re: /\b(counter)?offer\b/i, label: "offer" },
  { re: /\brepresent (the )?(buyer|seller)\b/i, label: "representation" },
  { re: /\bprepare (a |the )?purchase contract\b/i, label: "contract prep" },
  { re: /\b(handle|conduct) (escrow|closing)\b/i, label: "escrow/closing" },
  { re: /\brecommend (what )?price\b/i, label: "price recommendation" },
  { re: /\bsend (a |the )?\$?\d[\d,]* (thousand|k)?\s*(offer|bid)\b/i, label: "sending an offer" },
  { re: /\bnegotiate this seller\b/i, label: "seller negotiation" },
  { re: /\breal-?estate (broker|agent)\b/i, label: "broker/agent claim" },
];

const SETTLEMENT_KICKBACK =
  /\b(referral payment|kickback).*(mortgage|title|escrow|inspector|settlement)|\b(mortgage|title|escrow).*(referral payment|kickback)/i;

const SCRAPE_PROHIBITED = /\bscrape\b.*\b(zillow|redfin|realtor|homes\.com|loopnet)\b|\beven if (its|their) rules prohibit/i;

export type ComplianceDecision = {
  allow: boolean;
  code:
    | "ALLOW"
    | "ALLOW_ESTIMATE"
    | "REJECT_CALIFORNIA_PILOT"
    | "REJECT_BROKERAGE"
    | "REJECT_SETTLEMENT_KICKBACK"
    | "REJECT_PROHIBITED_SCRAPE"
    | "REJECT_PRICE_CHANGE"
    | "REJECT_BULK_DISCLOSURE"
    | "REJECT_SELLER_SOLICITATION"
    | "REJECT_SUCCESS_FEE_COLLECTION"
    | "REJECT_IDENTIFYING_LEAK"
    | "REJECT";
  flag: string | null;
  message: string;
};

export function evaluatePropertyLocation(input: {
  state?: string | null;
  zip?: string | null;
  address?: string | null;
}): ComplianceDecision {
  const state = String(input.state || "").trim().toUpperCase();
  const zip = String(input.zip || "").replace(/\D/g, "").slice(0, 5);
  const addr = String(input.address || "");
  const mentionsOtherState = /\b(TX|TEXAS|NY|FL|FLORIDA|AZ|NV|WA|OR|CO|GA|IL|OH|PA|NC|NJ)\b/i.test(
    `${state} ${addr}`,
  );
  const caZip = zip.length === 5 && Number(zip) >= 90001 && Number(zip) <= 96162;
  const caState = !state || state === "CA" || state === "CALIFORNIA";
  if (mentionsOtherState && state !== "CA" && state !== "CALIFORNIA") {
    return {
      allow: false,
      code: "REJECT_CALIFORNIA_PILOT",
      flag: null,
      message: CA_PILOT_REJECT,
    };
  }
  if (state && state !== "CA" && state !== "CALIFORNIA") {
    return {
      allow: false,
      code: "REJECT_CALIFORNIA_PILOT",
      flag: null,
      message: CA_PILOT_REJECT,
    };
  }
  if (zip && !caZip) {
    return {
      allow: false,
      code: "REJECT_CALIFORNIA_PILOT",
      flag: null,
      message: CA_PILOT_REJECT,
    };
  }
  if (!caState) {
    return {
      allow: false,
      code: "REJECT_CALIFORNIA_PILOT",
      flag: null,
      message: CA_PILOT_REJECT,
    };
  }
  return { allow: true, code: "ALLOW", flag: null, message: "California pilot location accepted." };
}

export function evaluateAction(text: string): ComplianceDecision {
  const raw = String(text || "").trim();
  if (!raw) return { allow: false, code: "REJECT", flag: null, message: "Empty action." };

  if (/change (the )?\$?299|waive (the )?(payment|unlock)|discount the research|free second property|unlock price (?!299)/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_PRICE_CHANGE",
      flag: null,
      message: `REJECT — unlock price is locked at $${UNLOCK_PRICE_USD}. Amber cannot change prices.`,
    };
  }

  if (/bulk (unlock|disclosure)|unlock (all|every|ten|10) propert|one payment.{0,40}(multiple|all) propert|bundle propert/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_BULK_DISCLOSURE",
      flag: null,
      message: "REJECT — ONE PROPERTY = ONE $299 UNLOCK. No bulk disclosure.",
    };
  }

  if (/reveal (the )?(address|apn|parcel)|send (me )?(the )?address before|identify the property without pay/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_IDENTIFYING_LEAK",
      flag: null,
      message: "REJECT — NO $299 PAYMENT = NO IDENTIFYING PROPERTY INFORMATION.",
    };
  }

  if (/solicit (the )?(seller|owner)|contact (the )?(property )?owner on behalf|cause a transaction with the seller/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_SELLER_SOLICITATION",
      flag: BROKERAGE_FLAG,
      message: "REJECT — SELLER_SOLICITATION_ENABLED is FALSE. Seller contact remains disabled pending compliance validation.",
    };
  }

  if (/collect (the )?success fee|debit escrow|enforce (the )?success fee|order escrow to pay/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_SUCCESS_FEE_COLLECTION",
      flag: null,
      message: "REJECT — SUCCESS_FEE_ENABLED is FALSE. Success-fee collection stays disabled until legally validated.",
    };
  }

  if (/find me propert(y|ies) in texas|\bin texas\b/i.test(raw) && !/\bcalifornia\b/i.test(raw)) {
    return { allow: false, code: "REJECT_CALIFORNIA_PILOT", flag: null, message: CA_PILOT_REJECT };
  }

  if (SCRAPE_PROHIBITED.test(raw)) {
    return {
      allow: false,
      code: "REJECT_PROHIBITED_SCRAPE",
      flag: null,
      message: "REJECT — automated collection is prohibited for that site. Use permitted APIs/feeds only.",
    };
  }

  if (SETTLEMENT_KICKBACK.test(raw) || /recommend your mortgage company and collect a referral/i.test(raw)) {
    return {
      allow: false,
      code: "REJECT_SETTLEMENT_KICKBACK",
      flag: BROKERAGE_FLAG,
      message: "REJECT — Amber must not receive compensation for referring consumers to settlement-service providers where prohibited.",
    };
  }

  for (const p of BROKERAGE_PATTERNS) {
    if (p.re.test(raw)) {
      return {
        allow: false,
        code: "REJECT_BROKERAGE",
        flag: BROKERAGE_FLAG,
        message: `REJECT — ${BROKERAGE_FLAG} (${p.label}).`,
      };
    }
  }

  if (/tax-?default|tax defaulted|permitted california tax/i.test(raw)) {
    return {
      allow: true,
      code: "ALLOW",
      flag: null,
      message: "ALLOW — permitted public/tax-default research within California.",
    };
  }

  if (/rental economics|cap rate|estimated rent|estimated (roi|cash flow)/i.test(raw)) {
    return {
      allow: true,
      code: "ALLOW_ESTIMATE",
      flag: null,
      message: `ALLOW WITH ESTIMATE DISCLOSURE — ${ESTIMATE_DISCLAIMER}`,
    };
  }

  return { allow: true, code: "ALLOW", flag: null, message: "ALLOW — research/finder activity." };
}

/** Finder-fee auto-collection is locked off until attorney approval + owner enable. */
export function finderFeeCollectionAllowed(cfg: {
  finder_fee_collection_enabled: boolean;
  attorney_approved: boolean;
}): boolean {
  if (!FINDER_FEE_COLLECTION_ENABLED_DEFAULT && !cfg.finder_fee_collection_enabled) return false;
  if (!cfg.attorney_approved) return false;
  if (!cfg.finder_fee_collection_enabled) return false;
  return false;
}

export function assertUnlockPriceCents(cents: number): ComplianceDecision {
  if (cents !== UNLOCK_PRICE_CENTS) {
    return {
      allow: false,
      code: "REJECT_PRICE_CHANGE",
      flag: null,
      message: `REJECT — unlock amount must be exactly ${UNLOCK_PRICE_CENTS} cents ($${UNLOCK_PRICE_USD}).`,
    };
  }
  return { allow: true, code: "ALLOW", flag: null, message: "Unlock price matches locked $299." };
}

export function sellerSolicitationAllowed(): boolean {
  return false;
}

export function successFeeDemandAllowed(): boolean {
  return false;
}
