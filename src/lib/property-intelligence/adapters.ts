import { evaluatePropertyLocation } from "./compliance";
import { canonicalKey, normalizeAddress } from "./california";
import type { CountyParcelLayer } from "./ca-county-layers";

export type IngestedProperty = {
  apn: string;
  addressRaw: string;
  city: string;
  county: string;
  zip: string;
  state: string;
  lat: number | null;
  lon: number | null;
  propertyType: string;
  assessedCents: number | null;
  askingCents: number | null;
  ownershipYears: number | null;
  absentee: boolean;
  vacant?: boolean;
  taxDelinquent?: boolean;
  foreclosure?: boolean;
  auction?: boolean;
  fsbo?: boolean;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  yearBuilt?: number | null;
  zoning?: string;
  units?: number | null;
  sourceLastUpdated?: string | null;
  sourceSlug: string;
  sourceUrl: string;
  payload: Record<string, unknown>;
};

export async function fetchSfAssessor(offset: number, limit = 40): Promise<{ rows: IngestedProperty[]; nextOffset: number; error?: string }> {
  const url = `https://data.sfgov.org/resource/wv5m-vpq2.json?$limit=${limit}&$offset=${offset}&$order=parcel_number`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return { rows: [], nextOffset: offset, error: `SF Assessor HTTP ${res.status}` };
  const json = (await res.json()) as Array<Record<string, unknown>>;
  const rows: IngestedProperty[] = [];
  for (const o of json) {
    const zip = String(o.zip_code || o.zip || "").replace(/\D/g, "").slice(0, 5);
    const loc = evaluatePropertyLocation({ state: "CA", zip, address: String(o.property_location || "San Francisco") });
    if (!loc.allow) continue;
    const land = Number(o.assessed_land_value || 0);
    const imp = Number(o.assessed_improvement_value || 0);
    const assessed = Math.round((land + imp) * 100);
    const sales = o.current_sales_date ? new Date(String(o.current_sales_date)) : null;
    const years = sales && !Number.isNaN(sales.getTime()) ? (Date.now() - sales.getTime()) / (365.25 * 86400000) : null;
    const addr = normalizeAddress(String(o.property_location || ""));
    const apn = String(o.parcel_number || "");
    const geom = o.the_geom as { coordinates?: number[] } | undefined;
    const n = (v: unknown) => {
      const x = Number(v);
      return Number.isFinite(x) && x > 0 ? x : null;
    };
    rows.push({
      apn,
      addressRaw: addr,
      city: "San Francisco",
      county: "San Francisco",
      zip,
      state: "CA",
      lat: geom?.coordinates?.[1] ?? null,
      lon: geom?.coordinates?.[0] ?? null,
      propertyType: String(o.use_definition || o.property_class_code_definition || ""),
      assessedCents: assessed > 0 ? assessed : null,
      askingCents: null,
      ownershipYears: years,
      absentee: false,
      beds: n(o.number_of_bedrooms),
      baths: n(o.number_of_bathrooms),
      sqft: n(o.property_area),
      yearBuilt: n(o.year_property_built),
      zoning: String(o.zoning_code || ""),
      units: n(o.number_of_units),
      sourceLastUpdated: String(o.data_loaded_at || o.data_as_of || ""),
      sourceSlug: "sfgov_assessor",
      sourceUrl: "https://data.sfgov.org/resource/wv5m-vpq2.json",
      payload: o,
    });
  }
  return { rows, nextOffset: offset + json.length };
}

const LA_COUNTY_PARCEL_QUERY =
  "https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0/query";

function titleCity(raw: string): string {
  return String(raw || "")
    .replace(/\s+CA\s*$/i, "")
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** Official LA County Assessor parcel roll (public GIS, no key). Assessed dollars → cents. No owner names stored. */
export async function fetchLaCountyParcels(
  offset: number,
  limit = 12,
): Promise<{ rows: IngestedProperty[]; nextOffset: number; error?: string }> {
  const params = new URLSearchParams({
    where: "Roll_LandValue>0 AND AIN IS NOT NULL",
    outFields: "AIN,SitusFullAddress,SitusCity,SitusZIP,UseType,Roll_Year,Roll_LandValue,Roll_ImpValue,UseCode",
    returnGeometry: "false",
    resultRecordCount: String(Math.min(25, Math.max(1, limit))),
    resultOffset: String(Math.max(0, offset)),
    f: "json",
  });
  const url = `${LA_COUNTY_PARCEL_QUERY}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return { rows: [], nextOffset: offset, error: `LA County Assessor HTTP ${res.status}` };
  const json = (await res.json()) as { error?: { message?: string }; features?: Array<{ attributes?: Record<string, unknown> }> };
  if (json.error?.message) return { rows: [], nextOffset: offset, error: `LA County Assessor: ${json.error.message}` };
  const rows: IngestedProperty[] = [];
  for (const f of json.features || []) {
    const o = f.attributes || {};
    const apn = String(o.AIN || "").replace(/\D/g, "");
    if (apn.length < 8) continue;
    const zip = String(o.SitusZIP || "").replace(/\D/g, "").slice(0, 5);
    const city = titleCity(String(o.SitusCity || "Los Angeles"));
    const addr = normalizeAddress(String(o.SitusFullAddress || ""));
    const loc = evaluatePropertyLocation({ state: "CA", zip, address: addr || `${city} Los Angeles County California` });
    if (!loc.allow) continue;
    const land = Number(o.Roll_LandValue || 0);
    const imp = Number(o.Roll_ImpValue || 0);
    const assessed = Math.round((land + imp) * 100);
    rows.push({
      apn,
      addressRaw: addr || `APN ${apn}`,
      city: city || "Los Angeles",
      county: "Los Angeles",
      zip,
      state: "CA",
      lat: null,
      lon: null,
      propertyType: String(o.UseType || ""),
      assessedCents: assessed > 0 ? assessed : null,
      askingCents: null,
      ownershipYears: null,
      absentee: false,
      zoning: String(o.UseCode || ""),
      sourceLastUpdated: String(o.Roll_Year || ""),
      sourceSlug: "lacounty_assessor",
      sourceUrl: LA_COUNTY_PARCEL_QUERY,
      payload: o,
    });
  }
  return { rows, nextOffset: offset + (json.features?.length || 0) };
}

export async function fetchSfAssessorByApn(apn: string): Promise<IngestedProperty | null> {
  const id = String(apn || "").replace(/[^A-Za-z0-9]/g, "");
  if (!id) return null;
  const url = `https://data.sfgov.org/resource/wv5m-vpq2.json?parcel_number=${encodeURIComponent(id)}&$limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;
  const json = (await res.json()) as Array<Record<string, unknown>>;
  const o = json[0];
  if (!o) return null;
  const loc = evaluatePropertyLocation({ state: "CA", zip: "", address: String(o.property_location || "San Francisco") });
  if (!loc.allow) return null;
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : null;
  };
  const land = Number(o.assessed_land_value || 0);
  const imp = Number(o.assessed_improvement_value || 0);
  const assessed = Math.round((land + imp) * 100);
  const sales = o.current_sales_date ? new Date(String(o.current_sales_date)) : null;
  const years = sales && !Number.isNaN(sales.getTime()) ? (Date.now() - sales.getTime()) / (365.25 * 86400000) : null;
  const geom = o.the_geom as { coordinates?: number[] } | undefined;
  return {
    apn: String(o.parcel_number || id),
    addressRaw: normalizeAddress(String(o.property_location || "")),
    city: "San Francisco",
    county: "San Francisco",
    zip: String(o.zip_code || "").replace(/\D/g, "").slice(0, 5),
    state: "CA",
    lat: geom?.coordinates?.[1] ?? null,
    lon: geom?.coordinates?.[0] ?? null,
    propertyType: String(o.use_definition || o.property_class_code_definition || ""),
    assessedCents: assessed > 0 ? assessed : null,
    askingCents: null,
    ownershipYears: years,
    absentee: false,
    beds: n(o.number_of_bedrooms),
    baths: n(o.number_of_bathrooms),
    sqft: n(o.property_area),
    yearBuilt: n(o.year_property_built),
    zoning: String(o.zoning_code || ""),
    units: n(o.number_of_units),
    sourceLastUpdated: String(o.data_loaded_at || o.data_as_of || ""),
    sourceSlug: "sfgov_assessor",
    sourceUrl: "https://data.sfgov.org/resource/wv5m-vpq2.json",
    payload: o,
  };
}

export async function fetchLaInvestors(offset: number, limit = 25): Promise<{
  rows: Array<{ name: string; business: string; city: string; zip: string; sourceUrl: string; payload: Record<string, unknown> }>;
  nextOffset: number;
  error?: string;
}> {
  const where = encodeURIComponent("starts_with(naics,'531')");
  const url = `https://data.lacity.org/resource/6rrh-rzua.json?$limit=${limit}&$offset=${offset}&$where=${where}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return { rows: [], nextOffset: offset, error: `LA business HTTP ${res.status}` };
  const json = (await res.json()) as Array<Record<string, unknown>>;
  const rows = json
    .map((o) => {
      const zip = String(o.zip_code || "").replace(/\D/g, "").slice(0, 5);
      const loc = evaluatePropertyLocation({ state: "CA", zip, address: String(o.street_address || "") });
      if (!loc.allow) return null;
      const name = String(o.business_name || "").trim();
      if (!name) return null;
      return {
        name,
        business: String(o.primary_naics_description || "Real estate"),
        city: String(o.city || "LOS ANGELES"),
        zip,
        sourceUrl: url,
        payload: o,
      };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  return { rows, nextOffset: offset + json.length };
}

const SB_TAX_DEFAULT_CSVS = [
  "https://county-reports.com/ca-sanbernardino/Defaulted-Bills-5-Years-or-Newer-Bill-Installments.csv",
  "https://county-reports.com/ca-sanbernardino/Defaulted-Bills-5-Yrs-Old-Bill-Installments.csv",
];

const SB_FETCH_HEADERS: Record<string, string> = {
  Accept: "text/csv",
  "Accept-Encoding": "identity",
  "User-Agent": "AmberPropertyIntelligence/1.0 (+https://www.myreelo.com)",
  Referer: "https://opendata.sbcountyatc.gov/",
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function sbRangeHonored(res: Response): boolean {
  return res.status === 206 || Boolean(res.headers.get("content-range"));
}

async function fetchSbCsvSlice(url: string, start: number, end: number): Promise<Response> {
  return fetch(url, {
    headers: { ...SB_FETCH_HEADERS, Range: `bytes=${start}-${end}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
}

/** Official San Bernardino County Treasurer-Tax Collector open-data feed (ranged CSV, not website scraping). */
export async function fetchSbTaxDefault(
  byteOffset: number,
  uniqueLimit = 30,
): Promise<{ rows: IngestedProperty[]; nextOffset: number; error?: string }> {
  const start = Math.max(0, byteOffset);
  const end = start + 28_000;
  let res: Response | null = null;
  let lastStatus = 0;
  for (const url of SB_TAX_DEFAULT_CSVS) {
    try {
      const next = await fetchSbCsvSlice(url, start, end);
      lastStatus = next.status;
      if (next.status === 206 || next.status === 200) {
        res = next;
        break;
      }
      try {
        await next.body?.cancel();
      } catch {
        /* ignore */
      }
    } catch {
      /* try next official CSV host path */
    }
  }
  if (!res) {
    return {
      rows: [],
      nextOffset: start,
      error:
        lastStatus === 403
          ? "SB tax-default host blocked this Worker (HTTP 403). San Francisco tax-sale and other California sources still run."
          : lastStatus
            ? `SB tax-default HTTP ${lastStatus}`
            : "SB tax-default host unreachable",
    };
  }
  const len = Number(res.headers.get("content-length") || 0);
  if (!sbRangeHonored(res) && res.status === 200 && len > 80_000) {
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    return {
      rows: [],
      nextOffset: start,
      error: "SB tax-default Range request not honored (file is 54MB). Will not download the full CSV.",
    };
  }
  if (!res.ok && res.status !== 206) {
    return {
      rows: [],
      nextOffset: start,
      error:
        lastStatus === 403
          ? "SB tax-default host blocked this Worker (HTTP 403). San Francisco tax-sale and other California sources still run."
          : `SB tax-default HTTP ${lastStatus}`,
    };
  }
  const text = await res.text();
  const rawLines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!rawLines.length) return { rows: [], nextOffset: start };
  const lines = start === 0 ? rawLines.slice(1) : rawLines.slice(1);
  const complete = lines.slice(0, -1);
  const seen = new Set<string>();
  const rows: IngestedProperty[] = [];
  for (const line of complete) {
    const cols = parseCsvLine(line);
    const apn = String(cols[3] || "").replace(/\D/g, "");
    if (apn.length < 8 || seen.has(apn)) continue;
    seen.add(apn);
    const tra = String(cols[8] || "").replace(/\s+CITY$/i, "").trim();
    const city = tra || "UNKNOWN";
    const loc = evaluatePropertyLocation({
      state: "CA",
      zip: "",
      address: `${city} San Bernardino County California`,
    });
    if (!loc.allow) continue;
    rows.push({
      apn,
      addressRaw: `APN ${apn}`,
      city,
      county: "San Bernardino",
      zip: "",
      state: "CA",
      lat: null,
      lon: null,
      propertyType: "",
      assessedCents: null,
      askingCents: null,
      ownershipYears: null,
      absentee: false,
      taxDelinquent: true,
      sourceSlug: "sbcounty_tax_default",
      sourceUrl: "https://opendata.sbcountyatc.gov/",
      payload: {
        accountNumber: apn,
        traName: cols[8],
        taxDefaultDate: cols[19],
        taxDefaultNumber: cols[18],
        billBalance: cols[11],
        redemptionStatus: cols[20],
        kind: "FACT",
        note: "County tax-default open data. Not a title search. Bill type is not a land-use class.",
      },
    });
    if (rows.length >= uniqueLimit) break;
  }
  return { rows, nextOffset: end + 1 };
}

function attr(o: Record<string, unknown>, key?: string): string {
  if (!key) return "";
  const v = o[key];
  if (v == null) return "";
  return String(v).trim();
}

function dollarsToCents(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 100_000_000) return Math.round(n);
  return Math.round(n * 100);
}

/** Generic CA county ArcGIS query. Explicit outFields only — never owner/mailing names. Isolated per county. */
export async function fetchCountyParcelLayer(
  layer: CountyParcelLayer,
  offset: number,
  limit = 8,
): Promise<{ rows: IngestedProperty[]; nextOffset: number; error?: string }> {
  const params = new URLSearchParams({
    where: layer.where || "1=1",
    outFields: layer.outFields.join(","),
    returnGeometry: "false",
    resultRecordCount: String(Math.min(15, Math.max(1, limit))),
    resultOffset: String(Math.max(0, offset)),
    f: "json",
  });
  const url = `${layer.layerUrl.replace(/\/$/, "")}/query?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
  }     catch {
    return { rows: [], nextOffset: offset, error: `${layer.county} GIS timeout/unreachable` };
  }
  if (!res.ok) return { rows: [], nextOffset: offset, error: `${layer.county} GIS HTTP ${res.status}` };
  const json = (await res.json()) as { error?: { message?: string }; features?: Array<{ attributes?: Record<string, unknown> }> };
  if (json.error?.message) return { rows: [], nextOffset: offset, error: `${layer.county}: ${json.error.message}` };
  const rows: IngestedProperty[] = [];
  for (const f of json.features || []) {
    const o = f.attributes || {};
    const apn = attr(o, layer.map.apn).replace(/[^A-Za-z0-9]/g, "");
    if (apn.length < 5) continue;
    const address = (layer.map.address || []).map((k) => attr(o, k)).filter(Boolean).join(" ");
    const city = titleCity(attr(o, layer.map.city));
    const zip = attr(o, layer.map.zip).replace(/\D/g, "").slice(0, 5);
    const loc = evaluatePropertyLocation({
      state: "CA",
      zip,
      address: address || `${city} ${layer.county} County California`,
    });
    if (!loc.allow) continue;
    const land = dollarsToCents(o[layer.map.land || ""]);
    const imp = dollarsToCents(o[layer.map.imp || ""]);
    const assessedDirect = dollarsToCents(o[layer.map.assessed || ""]);
    const assessed =
      assessedDirect ||
      (land != null || imp != null ? (land || 0) + (imp || 0) : null);
    const yearRaw = attr(o, layer.map.yearBuilt);
    const rollYear = attr(o, layer.map.rollYear);
    const yearBuilt = yearRaw.length === 4 && Number(yearRaw) > 1800 && Number(yearRaw) < 2100 ? Number(yearRaw) : null;
    const asOf = rollYear || (yearRaw.length === 4 ? yearRaw : "");
    rows.push({
      apn,
      addressRaw: normalizeAddress(address) || `APN ${apn}`,
      city: city || layer.county,
      county: layer.county,
      zip,
      state: "CA",
      lat: null,
      lon: null,
      propertyType: attr(o, layer.map.propertyType),
      assessedCents: assessed && assessed > 0 ? assessed : null,
      askingCents: null,
      ownershipYears: null,
      absentee: false,
      zoning: attr(o, layer.map.zoning),
      yearBuilt,
      sourceLastUpdated: asOf || null,
      sourceSlug: "ca_statewide_parcels",
      sourceUrl: layer.layerUrl,
      payload: {
        county: layer.county,
        provider: layer.layerUrl.includes("water.ca.gov") ? "dwr_statewide" : "county_gis",
        apn,
        address,
        city,
        zip,
        propertyType: attr(o, layer.map.propertyType),
        zoning: attr(o, layer.map.zoning),
        land,
        imp,
        assessed,
        yearBuilt,
        rollYear,
      },
    });
  }
  return { rows, nextOffset: offset + (json.features?.length || 0) };
}

export { canonicalKey, normalizeAddress };
