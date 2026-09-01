import { PREVIEW_VERSION, UNLOCK_PRICE_USD } from "./constants";
import { bedBathPreviewBand } from "./deep-research";

export type ConfidentialPreview = {
  headline: string;
  generalCategory: string;
  approximatePriceBand: string;
  bedroomBathCategory: string;
  conditionCategory: string;
  investmentCategory: string;
  distressedCategory: string;
  approximateDiscountRange: string;
  researchConfidence: number;
  matchingOpportunitiesAvailable: number;
  opportunityLabel: string;
  unlockPriceUsd: number;
  previewVersion: string;
};

const CA_CITIES = [
  "san francisco","los angeles","oakland","san diego","sacramento","fresno","san jose","long beach",
  "anaheim","bakersfield","riverside","stockton","irvine","santa ana","chula vista","fremont","modesto",
  "fontana","moreno valley","huntington beach","glendale","santa clarita","ontario","rancho cucamonga",
  "oceanside","garden grove","santa rosa","elk grove","corona","lancaster","palmdale","salinas","hayward",
  "sunnyvale","escondido","pasadena","torrance","orange","fullerton","thousand oaks","visalia","simi valley",
  "concord","roseville","santa clara","vallejo","pomona","victorville","berkeley","el monte","downey",
  "inglewood","costa mesa","carlsbad","fairfield","temecula","clovis","murrieta","antioch","richmond",
  "ventura","daly city","west covina","san mateo","burbank","norwalk","el cajon","rialto","san marcos",
];

const CA_COUNTIES = [
  "alameda","alpine","amador","butte","calaveras","colusa","contra costa","del norte","el dorado","fresno",
  "glenn","humboldt","imperial","inyo","kern","kings","lake","lassen","los angeles","madera","marin",
  "mariposa","mendocino","merced","modoc","mono","monterey","napa","nevada","orange","placer","plumas",
  "riverside","sacramento","san benito","san bernardino","san diego","san francisco","san joaquin",
  "san luis obispo","san mateo","santa barbara","santa clara","santa cruz","shasta","sierra","siskiyou",
  "solano","sonoma","stanislaus","sutter","tehama","trinity","tulare","tuolumne","ventura","yolo","yuba",
];

const LEAK_KEYS = [
  "address","street","zip","zipcode","apn","parcel","lat","lon","latitude","longitude","map","owner",
  "mls","listingid","listing_id","zillow","redfin","realtor","auctionurl","photo","filename","city",
  "county","neighborhood","subdivision","brokerage","agent",
];

export function priceBandFromCents(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return "UNKNOWN";
  const usd = cents / 100;
  if (usd < 150000) return "under $150k class";
  if (usd < 250000) return "$150k–$250k class";
  if (usd < 400000) return "$250k–$400k class";
  if (usd < 600000) return "$400k–$600k class";
  if (usd < 900000) return "$600k–$900k class";
  if (usd < 1500000) return "$900k–$1.5m class";
  return "above $1.5m class";
}

export function buildConfidentialPreview(input: {
  opportunityOrdinal?: number;
  propertyType?: string;
  assessedCents?: number | null;
  askingCents?: number | null;
  taxDelinquent?: boolean;
  foreclosure?: boolean;
  auction?: boolean;
  dataConfidence?: number;
  matchingCount?: number;
  beds?: number | null;
  baths?: number | null;
  opportunityScore?: number;
}): ConfidentialPreview {
  const type = String(input.propertyType || "").toLowerCase();
  const generalCategory = /multi|2-4|apartment/.test(type)
    ? "California multifamily research opportunity"
    : /land|lot/.test(type)
      ? "California land research opportunity"
      : "California residential property opportunity";
  const distressed = input.taxDelinquent
    ? "tax-related public-record opportunity category"
    : input.foreclosure
      ? "foreclosure-indicator research category"
      : input.auction
        ? "auction-status research category"
        : "standard public-record research category";
  return {
    headline:
      "Amber has a confidential California research package. A $299 unlock is offered only when a verified opportunity thesis exists — matching your filters is not enough.",
    generalCategory,
    approximatePriceBand: priceBandFromCents(input.askingCents ?? input.assessedCents),
    bedroomBathCategory: bedBathPreviewBand(input.beds ?? null, input.baths ?? null),
    conditionCategory: "generalized condition UNKNOWN",
    investmentCategory: "public-record research / opportunity discovery",
    distressedCategory: distressed,
    approximateDiscountRange: "UNKNOWN — estimates require independent verification after unlock",
    researchConfidence: Math.max(0, Math.min(100, Math.round(Number(input.dataConfidence || 0)))),
    matchingOpportunitiesAvailable: Math.max(0, Number(input.matchingCount || 0)),
    opportunityLabel: `Opportunity #${Math.max(1, Number(input.opportunityOrdinal || 1))}`,
    unlockPriceUsd: UNLOCK_PRICE_USD,
    previewVersion: PREVIEW_VERSION,
  };
}

export function reverseIdentificationTest(preview: ConfidentialPreview | Record<string, unknown>): {
  pass: boolean;
  risk: "PASS" | "FAIL" | "UNCERTAIN";
  reasons: string[];
} {
  const blob = JSON.stringify(preview).toLowerCase();
  const reasons: string[] = [];
  if (/\b\d{1,6}\s+[a-z]/.test(blob) && /\b(st|street|ave|avenue|blvd|rd|road|dr|drive|ln|lane|way|ct|court)\b/.test(blob)) {
    reasons.push("street-like pattern");
  }
  if (/\b9[0-6]\d{3}\b/.test(blob)) reasons.push("California ZIP-like number");
  if (/\bapn\b|\bparcel\b/.test(blob) && /\d{6,}/.test(blob)) reasons.push("parcel/APN pattern");
  if (/-?\d{1,3}\.\d{4,}/.test(blob)) reasons.push("coordinate-like number");
  if (/https?:\/\/|www\.|\.com\/|\.org\//.test(blob)) reasons.push("URL");
  if (/\b(zillow|redfin|realtor\.com|mls#|listing id)\b/.test(blob)) reasons.push("listing identifier");
  for (const city of CA_CITIES) {
    if (blob.includes(city)) {
      reasons.push("city name");
      break;
    }
  }
  for (const county of CA_COUNTIES) {
    if (new RegExp(`\\b${county}\\b`).test(blob) && county !== "orange") {
      reasons.push("county name");
      break;
    }
  }
  if (/\bowner\b.{0,40}\b(name|llc|inc|trust)\b/.test(blob)) reasons.push("owner identity");
  for (const key of LEAK_KEYS) {
    if (Object.prototype.hasOwnProperty.call(preview, key) && (preview as Record<string, unknown>)[key]) {
      reasons.push(`identifying key:${key}`);
    }
  }
  if (reasons.length) return { pass: false, risk: "FAIL", reasons };
  return { pass: true, risk: "PASS", reasons: [] };
}

/** Fields that must never appear on a locked client payload. */
export const FORBIDDEN_CLIENT_KEYS = [
  "address",
  "address_raw",
  "address_norm",
  "street",
  "city",
  "zip",
  "county",
  "apn",
  "lat",
  "lon",
  "latitude",
  "longitude",
  "owner",
  "owner_name",
  "mailing_address",
  "mailingAddress",
  "phone",
  "phones",
  "email",
  "emails",
  "agent_phone",
  "agent_email",
  "listing_agent_phone",
  "listing_agent_email",
  "listingAgentPhone",
  "listingAgentEmail",
  "fullAddress",
  "otherContacts",
  "contacts",
  "adminOnlyContacts",
  "mls",
  "listing_id",
  "source_url",
  "zillow",
  "redfin",
  "photo",
  "map",
  "property_id",
  "canonical_key",
  "payload_json",
  "analysis_json",
];

export function stripIdentifying(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (FORBIDDEN_CLIENT_KEYS.includes(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
}

export function payloadLeaksIdentity(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const rec = obj as Record<string, unknown>;
  for (const key of FORBIDDEN_CLIENT_KEYS) {
    if (rec[key] != null && rec[key] !== "") return true;
  }
  const blob = JSON.stringify(obj).toLowerCase();
  if (/\b(zillow\.com|redfin\.com|realtor\.com)\b/.test(blob)) return true;
  if (/\b\d{1,6}\s+[a-z].*\b(street|st|ave|blvd)\b/.test(blob)) return true;
  return false;
}
