import { evaluatePropertyLocation } from "./compliance";
import { MIN_OFFER_MATCH_SCORE } from "./constants";

export type BuyBox = {
  label?: string;
  investmentPurpose?: string;
  maxBudgetCents?: number;
  minBudgetCents?: number;
  targetCities?: string[];
  targetCounties?: string[];
  zips?: string[];
  desiredState?: string;
  propertyType?: string;
  minBeds?: number;
  minBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minEstCapRate?: number;
  minEstReturn?: number;
  cashBuyer?: boolean;
  foreclosureInterest?: boolean;
  taxDefaultInterest?: boolean;
  auctionInterest?: boolean;
  vacantInterest?: boolean;
  absenteeInterest?: boolean;
  fixerAcceptable?: boolean;
  dealBreakers?: string[];
  paused?: boolean;
  notes?: string;
};

export type MatchProperty = {
  city: string;
  county: string;
  zip: string;
  state: string;
  assessedCents: number | null;
  askingCents?: number | null;
  propertyType: string;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  taxDelinquent: boolean;
  foreclosure: boolean;
  auction: boolean;
  vacant: boolean;
  absentee: boolean;
};

export function parseCsvList(raw: string | undefined): string[] {
  return String(raw || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function hasSpecificCriteria(box: BuyBox): boolean {
  return Boolean(
    box.targetCounties?.length ||
      box.targetCities?.length ||
      box.zips?.length ||
      box.propertyType ||
      box.maxBudgetCents != null ||
      box.minBudgetCents != null ||
      box.minBeds != null ||
      box.minBaths != null ||
      box.minSqft != null ||
      box.taxDefaultInterest ||
      box.foreclosureInterest ||
      box.auctionInterest,
  );
}

/** Stable identity of *requirements* — label/notes/paused do not count. */
export function criteriaFingerprint(box: BuyBox): string {
  const normList = (v: string[] | undefined) =>
    [...(v || [])].map((s) => s.toLowerCase().trim()).filter(Boolean).sort();
  return JSON.stringify({
    desiredState: String(box.desiredState || "CA").toUpperCase(),
    targetCounties: normList(box.targetCounties),
    targetCities: normList(box.targetCities),
    zips: [...(box.zips || [])].map((z) => z.replace(/\D/g, "").slice(0, 5)).filter(Boolean).sort(),
    propertyType: String(box.propertyType || "").toLowerCase().trim(),
    minBudgetCents: box.minBudgetCents ?? null,
    maxBudgetCents: box.maxBudgetCents ?? null,
    minBeds: box.minBeds ?? null,
    minBaths: box.minBaths ?? null,
    minSqft: box.minSqft ?? null,
    maxSqft: box.maxSqft ?? null,
    taxDefaultInterest: Boolean(box.taxDefaultInterest),
    foreclosureInterest: Boolean(box.foreclosureInterest),
    auctionInterest: Boolean(box.auctionInterest),
    vacantInterest: Boolean(box.vacantInterest),
    absenteeInterest: Boolean(box.absenteeInterest),
    fixerAcceptable: box.fixerAcceptable === false ? false : true,
    dealBreakers: normList(box.dealBreakers),
    investmentPurpose: String(box.investmentPurpose || "").toLowerCase().trim(),
    minEstCapRate: box.minEstCapRate ?? null,
    minEstReturn: box.minEstReturn ?? null,
    cashBuyer: Boolean(box.cashBuyer),
  });
}

function moneyOrNa(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "Not available";
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function describeBuyBoxRequirements(box: BuyBox): Record<string, string> {
  const counties = (box.targetCounties || []).filter(Boolean);
  const cities = (box.targetCities || []).filter(Boolean);
  const zips = (box.zips || []).filter(Boolean);
  const location = [
    String(box.desiredState || "CA").toUpperCase(),
    counties.length ? `counties: ${counties.join(", ")}` : "",
    cities.length ? `cities: ${cities.join(", ")}` : "",
    zips.length ? `ZIP ${zips.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const distress = [
    box.taxDefaultInterest ? "tax-default" : "",
    box.foreclosureInterest ? "foreclosure" : "",
    box.auctionInterest ? "auction" : "",
    box.vacantInterest ? "vacant" : "",
    box.absenteeInterest ? "absentee" : "",
  ].filter(Boolean);
  return {
    completeRequirements: summarizeBuyBox(box),
    location: location || "Not available",
    propertyType: box.propertyType || "Not available",
    priceRange:
      box.minBudgetCents != null || box.maxBudgetCents != null
        ? `${moneyOrNa(box.minBudgetCents)} – ${moneyOrNa(box.maxBudgetCents)}`
        : "Not available",
    bedsBaths:
      box.minBeds != null || box.minBaths != null
        ? `${box.minBeds != null ? `${box.minBeds}+ beds` : "beds not set"} · ${box.minBaths != null ? `${box.minBaths}+ baths` : "baths not set"}`
        : "Not available",
    squareFootage:
      box.minSqft != null || box.maxSqft != null
        ? `${box.minSqft != null ? `${box.minSqft}+` : "any"} – ${box.maxSqft != null ? String(box.maxSqft) : "any"} sqft`
        : "Not available",
    investmentCriteria: box.investmentPurpose || (distress.length ? distress.join(", ") : "Not available"),
    dealBreakers: (box.dealBreakers || []).length ? (box.dealBreakers || []).join(", ") : "Not available",
    notes: box.notes || "Not available",
    other: [
      box.cashBuyer ? "cash buyer" : "",
      box.fixerAcceptable === false ? "fixer not acceptable" : "",
      box.minEstCapRate != null ? `min cap rate ${box.minEstCapRate}` : "",
      box.minEstReturn != null ? `min return ${box.minEstReturn}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Not available",
  };
}

export function summarizeBuyBox(box: BuyBox): string {
  const parts: string[] = [];
  if (box.label) parts.push(box.label);
  if (box.targetCounties?.length) parts.push(box.targetCounties.join("/"));
  if (box.targetCities?.length) parts.push(box.targetCities.join("/"));
  if (box.zips?.length) parts.push(`ZIP ${box.zips.join(", ")}`);
  if (box.propertyType) parts.push(box.propertyType);
  if (box.minBudgetCents != null || box.maxBudgetCents != null) {
    const lo = box.minBudgetCents != null ? `$${(box.minBudgetCents / 100).toLocaleString("en-US")}` : "any";
    const hi = box.maxBudgetCents != null ? `$${(box.maxBudgetCents / 100).toLocaleString("en-US")}` : "any";
    parts.push(`budget ${lo}–${hi}`);
  }
  if (box.minBeds != null) parts.push(`${box.minBeds}+ beds`);
  if (box.minBaths != null) parts.push(`${box.minBaths}+ baths`);
  if (box.taxDefaultInterest) parts.push("tax-default");
  if (box.foreclosureInterest) parts.push("foreclosure");
  if (box.auctionInterest) parts.push("auction");
  if (box.vacantInterest) parts.push("vacant");
  if (box.absenteeInterest) parts.push("absentee");
  if (!parts.length) return "Incomplete — add county, city, ZIP, type, budget, or distress. Amber will not invent criteria.";
  if (!hasSpecificCriteria(box)) return `${parts.join(" · ")} — too broad to offer a $299 property`;
  return parts.join(" · ");
}

export function propertyTypeFits(
  boxType: string | undefined,
  propertyType: string | undefined,
): { unknown: boolean; ok: boolean } {
  if (!boxType) return { unknown: false, ok: true };
  const b = boxType.toLowerCase();
  const p = String(propertyType || "").toLowerCase().trim();
  if (!p || p === "unknown") return { unknown: true, ok: false };
  const residential =
    b.includes("residential") &&
    /(single family|sres|sfr|condo|condominium|dwelling|apartment|multi-family|multifamily|residential)/.test(p);
  return { unknown: false, ok: p.includes(b) || b.includes(p) || residential };
}

export function matchBuyBox(box: BuyBox, property: MatchProperty): { ok: boolean; score: number; why: string } {
  if (box.paused) return { ok: false, score: 0, why: "Buy Box paused." };
  const loc = evaluatePropertyLocation({
    state: property.state,
    zip: property.zip,
    address: `${property.city} ${property.county}`,
  });
  if (!loc.allow) return { ok: false, score: 0, why: loc.message };

  if (box.dealBreakers?.length) {
    const hay = `${property.propertyType} ${property.city} ${property.county}`.toLowerCase();
    for (const raw of box.dealBreakers) {
      const d = raw.trim().toUpperCase();
      if (d === "NO HOA" && /\bhoa\b/.test(hay)) {
        return { ok: false, score: 0, why: "REJECT MATCH — deal breaker: confirmed HOA." };
      }
    }
  }

  const reasons: string[] = [];
  let score = 0;
  const desired = String(box.desiredState || "CA").toUpperCase();
  if (desired === "CA" || desired === "CALIFORNIA" || !box.desiredState) {
    score += 20;
    reasons.push("California");
  }

  const cityOk =
    !box.targetCities?.length || box.targetCities.some((c) => c.toLowerCase() === property.city.toLowerCase());
  const countyOk =
    !box.targetCounties?.length ||
    box.targetCounties.some((c) => c.toLowerCase() === property.county.toLowerCase());
  const zipOk = !box.zips?.length || box.zips.includes(property.zip.slice(0, 5));
  if (!cityOk || !countyOk || !zipOk) {
    return { ok: false, score: 0, why: "Does not match investor geography." };
  }
  if (box.targetCounties?.length && countyOk) {
    score += 40;
    reasons.push("county match");
  }
  if (box.targetCities?.length && cityOk) {
    score += 15;
    reasons.push("city match");
  }
  if ((box.targetCounties?.length || box.targetCities?.length) && countyOk && cityOk) {
    score += 15;
    reasons.push("specific geography beyond statewide");
  }
  if (box.zips?.length && zipOk) {
    score += 10;
    reasons.push("ZIP match");
  }

  if (box.propertyType) {
    const fit = propertyTypeFits(box.propertyType, property.propertyType);
    if (fit.unknown) {
      reasons.push("property type not on collected record");
    } else if (!fit.ok) {
      return { ok: false, score: 0, why: "Property type does not match Buy Box." };
    } else {
      score += 15;
      reasons.push("property-type match");
    }
  }

  const price = property.askingCents ?? property.assessedCents;
  if (box.maxBudgetCents != null && price != null && price > box.maxBudgetCents) {
    return { ok: false, score: 0, why: "PRICE OUTSIDE BUY BOX (assessed/asking vs maximum — not a bid)." };
  }
  if (box.minBudgetCents != null && price != null && price < box.minBudgetCents) {
    score -= 8;
  }
  if (box.maxBudgetCents != null || box.minBudgetCents != null) {
    if (price != null) {
      score += 15;
      reasons.push("budget band match");
    }
  }

  if (box.minBeds != null) {
    if (property.beds == null || property.beds < box.minBeds) {
      return { ok: false, score: 0, why: "Bedroom count does not match Buy Box." };
    }
    score += 8;
    reasons.push("bedroom match");
  }
  if (box.minBaths != null) {
    if (property.baths == null || property.baths < box.minBaths) {
      return { ok: false, score: 0, why: "Bathroom count does not match Buy Box." };
    }
    score += 6;
    reasons.push("bathroom match");
  }
  if (box.minSqft != null) {
    if (property.sqft == null || property.sqft < box.minSqft) {
      return { ok: false, score: 0, why: "Building area does not match Buy Box." };
    }
    score += 4;
    reasons.push("minimum area match");
  }
  if (box.maxSqft != null && property.sqft != null && property.sqft > box.maxSqft) {
    return { ok: false, score: 0, why: "Building area above Buy Box maximum." };
  }

  if (box.taxDefaultInterest && property.taxDelinquent) {
    score += 12;
    reasons.push("tax-default interest match");
  }
  if (box.foreclosureInterest && property.foreclosure) {
    score += 12;
    reasons.push("foreclosure interest match");
  }
  if (box.auctionInterest && property.auction) {
    score += 8;
    reasons.push("auction interest match");
  }
  if (box.vacantInterest && property.vacant) {
    score += 6;
    reasons.push("vacant interest match");
  }
  if (box.absenteeInterest && property.absentee) {
    score += 6;
    reasons.push("absentee-owner interest match");
  }

  score = Math.max(0, Math.min(99, score));
  if (!hasSpecificCriteria(box)) {
    return {
      ok: false,
      score,
      why: "Buy Box is California-only with no county, type, budget, or distress filters — too broad to offer a $299 property.",
    };
  }
  return {
    ok: score >= 40,
    score,
    why: reasons.length ? reasons.join("; ") : "Limited Buy Box overlap.",
  };
}

export { MIN_OFFER_MATCH_SCORE };

export type RequirementStatus = "pass" | "fail" | "unknown";

export type RequirementRow = {
  id: string;
  requirement: string;
  expected: string;
  actual: string;
  status: RequirementStatus;
};

function money(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "Not available";
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function num(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "Not available";
  return String(v);
}

/**
 * One row per Buy Box requirement the client actually set.
 * Missing property facts are Unknown — never invented as a pass.
 */
export function evaluateBuyBoxRequirements(box: BuyBox, property: MatchProperty): RequirementRow[] {
  const rows: RequirementRow[] = [];
  const push = (row: RequirementRow) => rows.push(row);

  if (box.desiredState || true) {
    const expected = String(box.desiredState || "CA").toUpperCase();
    const actual = String(property.state || "").toUpperCase();
    push({
      id: "state",
      requirement: "State",
      expected: expected === "CALIFORNIA" ? "CA" : expected,
      actual: actual || "Not available",
      status: actual === "CA" || actual === "CALIFORNIA" ? "pass" : actual ? "fail" : "unknown",
    });
  }

  if (box.targetCounties?.length) {
    const actual = property.county || "";
    const ok = box.targetCounties.some((c) => c.toLowerCase() === actual.toLowerCase());
    push({
      id: "county",
      requirement: "County",
      expected: box.targetCounties.join(", "),
      actual: actual || "Not available",
      status: !actual ? "unknown" : ok ? "pass" : "fail",
    });
  }
  if (box.targetCities?.length) {
    const actual = property.city || "";
    const ok = box.targetCities.some((c) => c.toLowerCase() === actual.toLowerCase());
    push({
      id: "city",
      requirement: "City",
      expected: box.targetCities.join(", "),
      actual: actual || "Not available",
      status: !actual ? "unknown" : ok ? "pass" : "fail",
    });
  }
  if (box.zips?.length) {
    const actual = (property.zip || "").slice(0, 5);
    const ok = box.zips.includes(actual);
    push({
      id: "zip",
      requirement: "ZIP",
      expected: box.zips.join(", "),
      actual: actual || "Not available",
      status: !actual ? "unknown" : ok ? "pass" : "fail",
    });
  }
  if (box.propertyType) {
    const fit = propertyTypeFits(box.propertyType, property.propertyType);
    push({
      id: "type",
      requirement: "Property type",
      expected: box.propertyType,
      actual: property.propertyType || "Not available",
      status: fit.unknown ? "unknown" : fit.ok ? "pass" : "fail",
    });
  }

  const price = property.askingCents ?? property.assessedCents;
  if (box.minBudgetCents != null || box.maxBudgetCents != null) {
    const lo = box.minBudgetCents != null ? money(box.minBudgetCents) : "any";
    const hi = box.maxBudgetCents != null ? money(box.maxBudgetCents) : "any";
    let status: RequirementStatus = "unknown";
    if (price != null) {
      const over = box.maxBudgetCents != null && price > box.maxBudgetCents;
      const under = box.minBudgetCents != null && price < box.minBudgetCents;
      status = over ? "fail" : under ? "fail" : "pass";
    }
    push({
      id: "budget",
      requirement: "Budget (asking or assessed)",
      expected: `${lo} – ${hi}`,
      actual: money(price),
      status,
    });
  }
  if (box.minBeds != null) {
    push({
      id: "beds",
      requirement: "Minimum bedrooms",
      expected: `${box.minBeds}+`,
      actual: num(property.beds ?? null),
      status: property.beds == null ? "unknown" : property.beds >= box.minBeds ? "pass" : "fail",
    });
  }
  if (box.minBaths != null) {
    push({
      id: "baths",
      requirement: "Minimum bathrooms",
      expected: `${box.minBaths}+`,
      actual: num(property.baths ?? null),
      status: property.baths == null ? "unknown" : property.baths >= box.minBaths ? "pass" : "fail",
    });
  }
  if (box.minSqft != null) {
    push({
      id: "minsqft",
      requirement: "Minimum square footage",
      expected: `${box.minSqft}+`,
      actual: num(property.sqft ?? null),
      status: property.sqft == null ? "unknown" : property.sqft >= box.minSqft ? "pass" : "fail",
    });
  }
  if (box.maxSqft != null) {
    push({
      id: "maxsqft",
      requirement: "Maximum square footage",
      expected: `≤ ${box.maxSqft}`,
      actual: num(property.sqft ?? null),
      status: property.sqft == null ? "unknown" : property.sqft <= box.maxSqft ? "pass" : "fail",
    });
  }
  if (box.taxDefaultInterest) {
    push({
      id: "tax",
      requirement: "Tax-default interest",
      expected: "Public tax-delinquent indicator",
      actual: property.taxDelinquent ? "Yes (source-reported)" : "No / not indicated",
      status: property.taxDelinquent ? "pass" : "unknown",
    });
  }
  if (box.foreclosureInterest) {
    push({
      id: "fc",
      requirement: "Foreclosure interest",
      expected: "Foreclosure indicator",
      actual: property.foreclosure ? "Yes (source-reported)" : "No / not indicated",
      status: property.foreclosure ? "pass" : "unknown",
    });
  }
  if (box.auctionInterest) {
    push({
      id: "auction",
      requirement: "Auction interest",
      expected: "Auction indicator",
      actual: property.auction ? "Yes (source-reported)" : "No / not indicated",
      status: property.auction ? "pass" : "unknown",
    });
  }
  if (box.vacantInterest) {
    push({
      id: "vacant",
      requirement: "Vacant interest",
      expected: "Vacant indicator",
      actual: property.vacant ? "Yes (source-reported)" : "No / not indicated",
      status: property.vacant ? "pass" : "unknown",
    });
  }
  if (box.absenteeInterest) {
    push({
      id: "absentee",
      requirement: "Absentee-owner interest",
      expected: "Absentee indicator",
      actual: property.absentee ? "Yes (source-reported)" : "No / not indicated",
      status: property.absentee ? "pass" : "unknown",
    });
  }

  return rows;
}

export function requirementMatchPercent(rows: RequirementRow[]): number {
  if (!rows.length) return 0;
  const fail = rows.filter((r) => r.status === "fail").length;
  const pass = rows.filter((r) => r.status === "pass").length;
  const known = pass + fail;
  if (!known) return 0;
  return Math.round((pass / rows.length) * 100);
}
