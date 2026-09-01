import { ASSESSOR_FRESHNESS_MONTHS, MIN_FACT_FIELDS_FOR_SALE, MIN_OFFER_CONFIDENCE } from "./constants";

export type ClassKind = "CONFIRMED_FACT" | "SOURCE_REPORTED_FACT" | "ESTIMATE" | "INFERENCE" | "UNKNOWN";

export type ClassifiedField = {
  key: string;
  label: string;
  kind: ClassKind;
  value: string;
  note?: string;
};

export type HydratedProperty = {
  apn: string;
  addressRaw: string;
  city: string;
  county: string;
  zip: string;
  propertyType: string;
  assessedCents: number | null;
  askingCents: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  zoning: string;
  units: number | null;
  ownershipYears: number | null;
  taxDelinquent: boolean;
  foreclosure: boolean;
  auction: boolean;
  vacant: boolean;
  absentee: boolean;
  sourceLastUpdated: string | null;
  closedRollYear: string | null;
};

export type DeepResearchResult = {
  hydrated: HydratedProperty;
  fields: ClassifiedField[];
  factCount: number;
  materialCount: number;
  dataConfidence: number;
  opportunityScore: number;
  conflicts: string[];
  freshnessOk: boolean;
  lastVerified: string;
  meaningful: boolean;
  why: string;
  sourceCount: number;
};

function num(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function str(v: unknown): string {
  return String(v || "").trim();
}

function money(cents: number | null): string {
  if (cents == null) return "UNKNOWN";
  return `approximately $${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function extractFromSourcePayload(slug: string, payload: Record<string, unknown>): Partial<HydratedProperty> {
  if (slug === "sfgov_assessor") {
    const land = Number(payload.assessed_land_value || 0);
    const imp = Number(payload.assessed_improvement_value || 0);
    const assessed = Math.round((land + imp) * 100);
    const sales = payload.current_sales_date ? new Date(String(payload.current_sales_date)) : null;
    const years = sales && !Number.isNaN(sales.getTime()) ? (Date.now() - sales.getTime()) / (365.25 * 86400000) : null;
    const zip = String(payload.zip_code || payload.zip || "").replace(/\D/g, "").slice(0, 5);
    return {
      apn: str(payload.parcel_number),
      addressRaw: str(payload.property_location),
      city: "San Francisco",
      county: "San Francisco",
      zip,
      propertyType: str(payload.use_definition || payload.property_class_code_definition),
      assessedCents: assessed > 0 ? assessed : null,
      beds: num(payload.number_of_bedrooms),
      baths: num(payload.number_of_bathrooms),
      sqft: num(payload.property_area),
      yearBuilt: num(payload.year_property_built),
      zoning: str(payload.zoning_code),
      units: num(payload.number_of_units),
      ownershipYears: years,
      sourceLastUpdated: str(payload.data_loaded_at || payload.data_as_of) || null,
      closedRollYear: str(payload.closed_roll_year) || null,
    };
  }
  if (slug === "sbcounty_tax_default") {
    return {
      apn: str(payload.accountNumber).replace(/\D/g, "") || undefined,
      taxDelinquent: true,
      county: "San Bernardino",
    };
  }
  if (slug === "sfttc_tax_sale") {
    return {
      apn: str(payload.block) && str(payload.lot) ? `${str(payload.block)}${str(payload.lot)}` : undefined,
      addressRaw: str(payload.situs),
      city: "San Francisco",
      county: "San Francisco",
      taxDelinquent: true,
      auction: true,
    };
  }
  if (slug === "lacounty_assessor" || slug === "ca_statewide_parcels") {
    const land = Number(payload.land || payload.Roll_LandValue || 0);
    const imp = Number(payload.imp || payload.Roll_ImpValue || 0);
    const assessedDirect = Number(payload.assessed || 0);
    const assessed =
      assessedDirect > 0
        ? assessedDirect
        : Math.round((Number(payload.Roll_LandValue || 0) + Number(payload.Roll_ImpValue || 0)) * 100) || (land > 0 || imp > 0 ? land + imp : 0);
    const zip = String(payload.zip || payload.SitusZIP || "").replace(/\D/g, "").slice(0, 5);
    const city = str(payload.city || payload.SitusCity).replace(/\s+CA\s*$/i, "").trim();
    return {
      apn: str(payload.apn || payload.AIN).replace(/[^A-Za-z0-9]/g, "") || undefined,
      addressRaw: str(payload.address || payload.SitusFullAddress),
      city: city || str(payload.county) || "California",
      county: str(payload.county) || (slug === "lacounty_assessor" ? "Los Angeles" : ""),
      zip,
      propertyType: str(payload.propertyType || payload.UseType),
      assessedCents: assessed > 0 ? assessed : null,
      zoning: str(payload.zoning || payload.UseCode),
      yearBuilt: num(payload.yearBuilt),
      sourceLastUpdated: str(payload.yearBuilt || payload.Roll_Year) || null,
      closedRollYear: str(payload.Roll_Year) || null,
    };
  }
  return {};
}

export function mergeHydrated(base: HydratedProperty, patch: Partial<HydratedProperty>): HydratedProperty {
  return {
    apn: patch.apn || base.apn,
    addressRaw: patch.addressRaw && !/^APN /i.test(patch.addressRaw) ? patch.addressRaw : base.addressRaw || patch.addressRaw || "",
    city: patch.city && patch.city !== "UNKNOWN" ? patch.city : base.city,
    county: patch.county || base.county,
    zip: patch.zip || base.zip,
    propertyType: patch.propertyType && patch.propertyType !== "UNKNOWN" ? patch.propertyType : base.propertyType,
    assessedCents: patch.assessedCents ?? base.assessedCents,
    askingCents: patch.askingCents ?? base.askingCents,
    beds: patch.beds ?? base.beds,
    baths: patch.baths ?? base.baths,
    sqft: patch.sqft ?? base.sqft,
    yearBuilt: patch.yearBuilt ?? base.yearBuilt,
    zoning: patch.zoning || base.zoning,
    units: patch.units ?? base.units,
    ownershipYears: patch.ownershipYears ?? base.ownershipYears,
    taxDelinquent: Boolean(patch.taxDelinquent || base.taxDelinquent),
    foreclosure: Boolean(patch.foreclosure || base.foreclosure),
    auction: Boolean(patch.auction || base.auction),
    vacant: Boolean(patch.vacant || base.vacant),
    absentee: Boolean(patch.absentee || base.absentee),
    sourceLastUpdated: patch.sourceLastUpdated || base.sourceLastUpdated,
    closedRollYear: patch.closedRollYear || base.closedRollYear,
  };
}

export function hydrateFromSources(
  row: Record<string, unknown>,
  sources: Array<{ source_slug?: unknown; slug?: unknown; payload_json?: unknown }>,
): HydratedProperty {
  let h: HydratedProperty = {
    apn: str(row.apn),
    addressRaw: str(row.address_raw),
    city: str(row.city),
    county: str(row.county),
    zip: str(row.zip),
    propertyType: str(row.property_type),
    assessedCents: row.assessed_cents == null ? null : Number(row.assessed_cents),
    askingCents: row.asking_cents == null ? null : Number(row.asking_cents),
    beds: row.beds == null || row.beds === "" ? null : num(row.beds),
    baths: row.baths == null || row.baths === "" ? null : num(row.baths),
    sqft: row.sqft == null || row.sqft === "" ? null : num(row.sqft),
    yearBuilt: row.year_built == null || row.year_built === "" ? null : num(row.year_built),
    zoning: str(row.zoning),
    units: row.units == null || row.units === "" ? null : num(row.units),
    ownershipYears: row.ownership_years == null ? null : Number(row.ownership_years),
    taxDelinquent: Boolean(Number(row.tax_delinquent)),
    foreclosure: Boolean(Number(row.foreclosure)),
    auction: Boolean(Number(row.auction)),
    vacant: Boolean(Number(row.vacant)),
    absentee: Boolean(Number(row.absentee)),
    sourceLastUpdated: str(row.last_verified || row.retrieved_at) || null,
    closedRollYear: null,
  };
  for (const s of sources) {
    let payload: Record<string, unknown> = {};
    try {
      const raw = s.payload_json;
      payload = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : ((raw as Record<string, unknown>) || {});
      if (typeof payload.payload_json === "string") {
        payload = JSON.parse(payload.payload_json) as Record<string, unknown>;
      }
    } catch {
      payload = {};
    }
    const slug = str(s.source_slug || s.slug);
    const looksSf = Boolean(payload.parcel_number || payload.use_definition || payload.assessed_land_value);
    h = mergeHydrated(h, extractFromSourcePayload(looksSf ? "sfgov_assessor" : slug, payload));
  }
  return h;
}

export function detectConflicts(fields: ClassifiedField[]): string[] {
  return [];
}

function field(key: string, label: string, kind: ClassKind, value: string, note?: string): ClassifiedField {
  return { key, label, kind, value, note };
}

export function classifyHydrated(h: HydratedProperty, sourceCount: number): ClassifiedField[] {
  const gov = sourceCount > 0;
  const fact = (ok: boolean): ClassKind => (ok && gov ? "CONFIRMED_FACT" : ok ? "SOURCE_REPORTED_FACT" : "UNKNOWN");
  return [
    field("apn", "APN / parcel", fact(Boolean(h.apn)), h.apn || "UNKNOWN", "Internal only until unlock."),
    field("address", "Property address", fact(Boolean(h.addressRaw) && !/^APN /i.test(h.addressRaw)), h.addressRaw || "UNKNOWN"),
    field("type", "Property type", fact(Boolean(h.propertyType) && h.propertyType !== "UNKNOWN"), h.propertyType || "UNKNOWN"),
    field("asking", "Asking / acquisition price", h.askingCents != null ? "SOURCE_REPORTED_FACT" : "UNKNOWN", money(h.askingCents)),
    field(
      "assessed",
      "Assessed value",
      fact(h.assessedCents != null),
      money(h.assessedCents),
      "Assessor roll — not a market appraisal.",
    ),
    field("market", "Estimated market value", "UNKNOWN", "UNKNOWN", "No permitted comparable-sale AVM. Not invented."),
    field("rent", "Estimated rent", "UNKNOWN", "UNKNOWN", "HUD/Census rent not enabled until owner keys are accepted."),
    field("beds", "Bedrooms", fact(h.beds != null), h.beds != null ? String(h.beds) : "UNKNOWN"),
    field("baths", "Bathrooms", fact(h.baths != null), h.baths != null ? String(h.baths) : "UNKNOWN"),
    field("sqft", "Building area", fact(h.sqft != null), h.sqft != null ? `${Math.round(h.sqft)} sq ft` : "UNKNOWN"),
    field("year", "Year built", fact(h.yearBuilt != null), h.yearBuilt != null ? String(h.yearBuilt) : "UNKNOWN"),
    field("zoning", "Zoning", fact(Boolean(h.zoning) && h.zoning !== "NA"), h.zoning || "UNKNOWN"),
    field("tax", "Tax-default indicator", h.taxDelinquent ? "CONFIRMED_FACT" : "UNKNOWN", h.taxDelinquent ? "tax-defaulted (county open data)" : "UNKNOWN — not a title search"),
    field("foreclosure", "Foreclosure indicator", h.foreclosure ? "SOURCE_REPORTED_FACT" : "UNKNOWN", h.foreclosure ? "foreclosure indicator present" : "UNKNOWN"),
    field("ownership", "Ownership duration", h.ownershipYears != null ? "SOURCE_REPORTED_FACT" : "UNKNOWN", h.ownershipYears != null ? `approximately ${Math.round(h.ownershipYears)} years since recorded sale` : "UNKNOWN"),
  ];
}

export function researchConfidence(fields: ClassifiedField[]): { factCount: number; materialCount: number; confidence: number } {
  const completenessKeys = new Set(["apn", "type", "assessed", "beds", "baths", "sqft", "year", "zoning", "ownership"]);
  const material = fields.filter((f) => completenessKeys.has(f.key));
  const facts = material.filter((f) => f.kind === "CONFIRMED_FACT" || f.kind === "SOURCE_REPORTED_FACT");
  const extras = fields.filter(
    (f) => (f.key === "tax" || f.key === "foreclosure" || f.key === "asking") && (f.kind === "CONFIRMED_FACT" || f.kind === "SOURCE_REPORTED_FACT"),
  );
  const factCount = facts.length + extras.length;
  const confidence = Math.max(0, Math.min(99, Math.round((facts.length / Math.max(1, material.length)) * 100)));
  return { factCount, materialCount: material.length, confidence };
}

export function opportunityScore(h: HydratedProperty, factCount: number): { score: number; why: string } {
  let score = 20;
  const positives: string[] = [];
  const risks: string[] = ["Public records lag. Not a title search. Not an appraisal."];
  if (h.assessedCents != null) {
    score += 12;
    positives.push("assessor-roll value classified as fact");
  }
  if (h.beds != null && h.baths != null && h.sqft != null) {
    score += 14;
    positives.push("beds/baths/area from assessor");
  }
  if (h.yearBuilt != null) {
    score += 6;
    positives.push("year built from assessor");
  }
  if (h.zoning) {
    score += 4;
    positives.push("zoning code retained");
  }
  if (h.taxDelinquent) {
    score += 14;
    positives.push("tax-default indicator");
    risks.push("lien/title risk");
  }
  if (h.foreclosure || h.auction) {
    score += 10;
    positives.push("foreclosure/auction indicator");
  }
  if (h.ownershipYears != null && h.ownershipYears >= 15) {
    score += 6;
    positives.push("long recorded ownership");
  }
  if (factCount >= MIN_FACT_FIELDS_FOR_SALE) {
    score += 8;
    positives.push("research package has multiple classified facts");
  } else {
    score -= 20;
    risks.push("thin research — not worth $299 yet");
  }
  if (h.askingCents == null) {
    risks.push("no asking price from a permitted listing source");
  }
  score = Math.max(1, Math.min(99, score));
  const why = [
    `Opportunity Score ${score}/100 (not a guarantee of profit).`,
    positives.length ? `Support: ${positives.join("; ")}.` : "Support: limited.",
    `Risks: ${risks.join("; ")}.`,
  ].join(" ");
  return { score, why };
}

export function freshnessOk(h: HydratedProperty, now = new Date()): boolean {
  const raw = h.sourceLastUpdated || h.closedRollYear;
  if (!raw) return false;
  const d = raw.length === 4 ? new Date(`${raw}-06-30T00:00:00.000Z`) : new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  const months = (now.getTime() - d.getTime()) / (30.44 * 86400000);
  return months <= ASSESSOR_FRESHNESS_MONTHS;
}

export function isMeaningfulPackage(input: {
  factCount: number;
  confidence: number;
  priceKnown: boolean;
  identity: boolean;
  characteristics: boolean;
}): boolean {
  return (
    input.identity &&
    input.priceKnown &&
    input.characteristics &&
    input.factCount >= MIN_FACT_FIELDS_FOR_SALE &&
    input.confidence >= MIN_OFFER_CONFIDENCE
  );
}

export function runDeepResearch(
  row: Record<string, unknown>,
  sources: Array<{ source_slug?: unknown; slug?: unknown; payload_json?: unknown }>,
  now = new Date(),
): DeepResearchResult {
  const hydrated = hydrateFromSources(row, sources);
  const sourceCount = sources.length || (hydrated.apn ? 1 : 0);
  const fields = classifyHydrated(hydrated, sourceCount);
  const { factCount, materialCount, confidence } = researchConfidence(fields);
  const { score, why } = opportunityScore(hydrated, factCount);
  const identity = Boolean(hydrated.apn && hydrated.addressRaw && !/^APN /i.test(hydrated.addressRaw));
  const priceKnown = hydrated.assessedCents != null || hydrated.askingCents != null;
  const characteristics = [hydrated.beds, hydrated.baths, hydrated.sqft, hydrated.yearBuilt, hydrated.zoning].filter(
    (v) => v != null && v !== "",
  ).length >= 3;
  const fresh = freshnessOk(hydrated, now);
  const meaningful = isMeaningfulPackage({
    factCount,
    confidence,
    priceKnown,
    identity,
    characteristics,
  });
  return {
    hydrated,
    fields,
    factCount,
    materialCount,
    dataConfidence: confidence,
    opportunityScore: score,
    conflicts: detectConflicts(fields),
    freshnessOk: fresh,
    lastVerified: now.toISOString(),
    meaningful,
    why,
    sourceCount,
  };
}

export function bedBathPreviewBand(beds: number | null, baths: number | null): string {
  if (beds == null && baths == null) return "bedroom/bath class UNKNOWN until unlocked research";
  if (beds == null) return "bedroom class UNKNOWN; bath class recorded internally";
  if (beds <= 1) return "studio/1-bedroom class";
  if (beds === 2) return "2-bedroom class";
  if (beds <= 4) return "3–4 bedroom class";
  return "5+ bedroom class";
}
