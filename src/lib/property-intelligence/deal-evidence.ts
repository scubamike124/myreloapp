function na(v: unknown): string {
  if (v == null) return "Not available";
  const s = String(v).trim();
  if (!s || s === "UNKNOWN" || s === "null" || s === "undefined") return "Not available";
  return s;
}

function moneyCents(v: unknown): string {
  if (v == null || v === "") return "Not available";
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "Not available";
  return `$${Math.round(n / 100).toLocaleString("en-US")}`;
}

export type DealEvidence = {
  verdict: string;
  headline: string;
  askingPrice: string;
  askingPriceNote: string;
  marketValue: string;
  assessedTotal: string;
  assessedNote: string;
  problemFound: string;
  taxLienOnRecord: string;
  taxLienAmount: string;
  taxLienAmountField: string;
  foreclosure: string;
  auction: string;
  vacant: string;
  absentee: string;
  assessedLand: string;
  assessedImprovement: string;
  lastRecordedSale: string;
  neighborhood: string;
  units: string;
  yearBuilt: string;
  whyAmberOffered: string;
  pickReasons: string[];
  foundFacts: Array<{ label: string; value: string }>;
  missingForDistressDeal: string[];
};

function dollarsFromAssessor(v: unknown): string {
  if (v == null || v === "") return "Not available";
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return "Not available";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function flatten(payload: Record<string, unknown>, out: Record<string, unknown> = {}, prefix = ""): Record<string, unknown> {
  for (const [k, v] of Object.entries(payload || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && k !== "the_geom" && k !== "geometry") {
      flatten(v as Record<string, unknown>, out, key);
    } else out[key] = v;
  }
  return out;
}

const PAYLOAD_LABELS: Record<string, string> = {
  property_location: "Assessor situs as stored",
  parcel_number: "Parcel / APN",
  use_definition: "Use definition",
  property_class_code_definition: "Property class",
  year_property_built: "Year built (assessor)",
  number_of_units: "Units",
  number_of_bedrooms: "Bedrooms (assessor)",
  number_of_bathrooms: "Bathrooms (assessor)",
  number_of_rooms: "Rooms",
  number_of_stories: "Stories",
  property_area: "Building area (sq ft)",
  lot_area: "Lot area",
  lot_depth: "Lot depth",
  lot_frontage: "Lot frontage",
  basement_area: "Basement area",
  zoning_code: "Zoning",
  construction_type: "Construction type",
  assessed_land_value: "Assessed land ($)",
  assessed_improvement_value: "Assessed improvement ($)",
  assessed_fixtures_value: "Assessed fixtures ($)",
  assessed_personal_property_value: "Assessed personal property ($)",
  homeowner_exemption_value: "Homeowner exemption ($)",
  misc_exemption_value: "Misc exemption ($)",
  current_sales_date: "Last recorded sale date",
  closed_roll_year: "Assessor roll year",
  assessor_neighborhood: "Neighborhood",
  analysis_neighborhood: "Analysis neighborhood",
  exemption_code_definition: "Exemption",
  percent_of_ownership: "Percent of ownership",
  block: "Block",
  lot: "Lot",
  data_as_of: "Assessor data as of",
  data_loaded_at: "Assessor data loaded",
  status_code: "Assessor status code",
  tax_rate_area_code: "Tax rate area code",
  use_code: "Use code",
  property_class_code: "Property class code",
};

function formatFactValue(key: string, v: unknown): string {
  if (v == null || v === "") return "Not available";
  if (typeof v === "object") {
    if (key === "the_geom" && v && typeof v === "object" && "coordinates" in (v as object)) {
      const c = (v as { coordinates?: number[] }).coordinates;
      if (Array.isArray(c) && c.length >= 2) return `lon ${c[0]}, lat ${c[1]}`;
    }
    return "Not available";
  }
  if (/value|area|frontage|depth/i.test(key) && Number.isFinite(Number(v))) {
    if (/value/i.test(key)) return dollarsFromAssessor(v);
    return String(Number(v));
  }
  if (/date|_at|sales/i.test(key)) {
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime()) && String(v).length > 8) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return String(v);
}

export function foundFactsFromPayload(payload: Record<string, unknown>): Array<{ label: string; value: string }> {
  const skip = new Set(["the_geom", "geometry", "row_id", "supervisor_district", "supervisor_district_2012", "volume_number", "assessor_neighborhood_code", "assessor_neighborhood_district"]);
  const out: Array<{ label: string; value: string }> = [];
  const used = new Set<string>();
  for (const [key, label] of Object.entries(PAYLOAD_LABELS)) {
    if (payload[key] == null || payload[key] === "") continue;
    const value = formatFactValue(key, payload[key]);
    if (value === "Not available") continue;
    out.push({ label, value });
    used.add(key);
  }
  for (const [key, v] of Object.entries(payload)) {
    if (used.has(key) || skip.has(key)) continue;
    if (v == null || v === "" || typeof v === "object") continue;
    out.push({ label: key.replace(/_/g, " "), value: formatFactValue(key, v) });
  }
  return out;
}

/** Only report a lien/tax-due amount when the source actually stored one. Never invent. */
export function findReportedLienAmount(payload: Record<string, unknown>): { amount: string; field: string } {
  const flat = flatten(payload);
  for (const [k, v] of Object.entries(flat)) {
    if (!/(lien|delinq|unpaid.?tax|tax.?due|amount.?due|default.?amount|tax.?amount)/i.test(k)) continue;
    if (/area|code|district|neighborhood|rate.?area|definition/i.test(k)) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return { amount: dollarsFromAssessor(v), field: k };
  }
  return { amount: "Not collected", field: "" };
}

export function extractDealEvidence(property: Record<string, unknown>, payload: Record<string, unknown> = {}): DealEvidence {
  const tax = Boolean(Number(property.tax_delinquent));
  const fc = Boolean(Number(property.foreclosure));
  const auction = Boolean(Number(property.auction));
  const vacant = Boolean(Number(property.vacant));
  const absentee = Boolean(Number(property.absentee));
  const lien = findReportedLienAmount(payload);
  const land = dollarsFromAssessor(payload.assessed_land_value ?? payload.Roll_LandValue);
  const imp = dollarsFromAssessor(payload.assessed_improvement_value ?? payload.Roll_ImpValue);
  const assessedTotal =
    land !== "Not available" && imp !== "Not available"
      ? dollarsFromAssessor(Number(payload.assessed_land_value || 0) + Number(payload.assessed_improvement_value || 0))
      : moneyCents(property.assessed_cents);
  const saleRaw = payload.current_sales_date || payload.sale_date || payload.last_sale_date;
  let lastSale = "Not available";
  if (saleRaw) {
    const d = new Date(String(saleRaw));
    lastSale = Number.isNaN(d.getTime()) ? na(saleRaw) : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  const asking = moneyCents(property.asking_cents);
  const problems: string[] = [];
  if (tax) problems.push("Tax-default / tax-lien indicator present");
  if (lien.amount !== "Not collected") problems.push(`Source reported unpaid tax/lien ${lien.amount}`);
  if (fc) problems.push("Foreclosure indicator present");
  if (auction) problems.push("Auction indicator present");
  if (vacant) problems.push("Vacant indicator present");
  if (absentee) problems.push("Absentee-owner indicator present");
  const problemFound = problems.length ? problems.join("; ") : "None found in the sources Amber collected. No tax lien, foreclosure, or auction flag on this record.";

  const missing: string[] = [];
  if (asking === "Not available") missing.push("Asking / list price — no MLS or listing source was used.");
  missing.push("Market / comparable sale value — Amber does not invent an AVM price.");
  if (!tax) missing.push("Tax-default / tax-lien indicator.");
  if (lien.amount === "Not collected") missing.push("Unpaid tax or lien dollar amount.");
  if (!fc) missing.push("Foreclosure record.");
  if (!auction) missing.push("Auction record.");

  const verdict =
    asking === "Not available" && !tax && !fc
      ? "NOT a proven good buy. Amber matched this parcel to a client Buy Box. She does not have an asking price or a market value, so she cannot show that it is cheap."
      : tax
        ? "Possible distress signal (tax-default indicator). Still not a proven bargain without asking price and a title search."
        : "Buy Box match. Asking price and market value must be verified independently.";

  const headline =
    asking === "Not available"
      ? `Asking price: Not available. Assessor tax roll total: ${assessedTotal}. That roll number is not the sale price and is not proof of a deal.`
      : `Asking price: ${asking}. Assessor tax roll: ${assessedTotal}. Compare those yourself — Amber does not certify a bargain.`;

  const pickReasons = [
    "The parcel was in scope for a saved client Buy Box (location / type / budget). That is why Amber researched it — not why it would be worth $299.",
    "A public-record source had a real parcel identity (address + APN + property type and/or assessed value).",
    "Research completeness is not an investment thesis. $299 requires a separate evidence-backed 'why this may be a good deal' answer.",
  ];
  if (tax) pickReasons.push("A tax-default indicator was present on the property record.");

  return {
    verdict,
    headline,
    askingPrice: asking,
    askingPriceNote: "Not collected from any listing site. Amber will not invent a list price.",
    marketValue: "Not available",
    assessedTotal,
    assessedNote: "County assessor tax roll (land + building). This is used for property tax. It is not an appraisal and not what a buyer would pay today.",
    problemFound,
    taxLienOnRecord: tax ? "Yes — tax-default/lien indicator present" : "No / not indicated",
    taxLienAmount: lien.amount,
    taxLienAmountField: lien.field || "Not available",
    foreclosure: fc ? "Yes" : "No / not indicated",
    auction: auction ? "Yes" : "No / not indicated",
    vacant: vacant ? "Yes" : "No / not indicated",
    absentee: absentee ? "Yes" : "No / not indicated",
    assessedLand: land,
    assessedImprovement: imp,
    lastRecordedSale: lastSale,
    neighborhood: na(payload.assessor_neighborhood || payload.neighborhood),
    units: na(property.units ?? payload.number_of_units),
    yearBuilt: na(property.year_built ?? payload.year_property_built),
    whyAmberOffered:
      "Buy Box match and a complete public-record package are research-qualification only. A $299 client offer requires a verified opportunity thesis (distress, listing discount, auction, vacancy, or similar collected evidence). Spec-only fit is never enough.",
    pickReasons,
    foundFacts: foundFactsFromPayload(payload),
    missingForDistressDeal: missing,
  };
}
