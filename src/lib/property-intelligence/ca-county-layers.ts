import { CA_COUNTIES } from "./california";

/**
 * Statewide California parcel discovery registry — all 58 counties.
 * Prefer each county's public GIS when we have a verified no-key layer.
 * Remaining counties use DWR GIS Atlas assessor identity (address/APN only).
 * Owner / mailing / taxpayer name fields are never requested.
 */

export type CountyFieldMap = {
  apn: string;
  address?: string[];
  city?: string;
  zip?: string;
  propertyType?: string;
  zoning?: string;
  land?: string;
  imp?: string;
  assessed?: string;
  yearBuilt?: string;
  rollYear?: string;
};

export type CountyParcelLayer = {
  county: (typeof CA_COUNTIES)[number];
  layerUrl: string;
  where: string;
  outFields: string[];
  map: CountyFieldMap;
  reliability: number;
};

function fields(map: CountyFieldMap): string[] {
  const out = new Set<string>([map.apn]);
  for (const a of map.address || []) out.add(a);
  for (const k of [map.city, map.zip, map.propertyType, map.zoning, map.land, map.imp, map.assessed, map.yearBuilt, map.rollYear]) {
    if (k) out.add(k);
  }
  return [...out];
}

/** California DWR GIS Atlas — assessor parcels for all 58 counties. Identity/address only; no owner or tax fields. */
export const DWR_STATEWIDE_PARCEL_URL =
  "https://gis.water.ca.gov/arcgis/rest/services/Planning/i15_Parcels_Assessor_Lightbox/MapServer/0";

function dwrLayer(county: (typeof CA_COUNTIES)[number]): CountyParcelLayer {
  return {
    county,
    layerUrl: DWR_STATEWIDE_PARCEL_URL,
    where: `COUNTYNAME='${county.toUpperCase()}' AND PARCEL_APN IS NOT NULL`,
    map: {
      apn: "PARCEL_APN",
      address: ["SITE_ADDR"],
      city: "SITE_CITY",
      zip: "SITE_ZIP",
    },
    outFields: [],
    reliability: 72,
  };
}

const NATIVE_LAYERS: CountyParcelLayer[] = [
  {
    county: "Alameda",
    layerUrl: "https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/Parcels/FeatureServer/0",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["SitusAddress"],
      city: "SitusCity",
      zip: "SitusZip",
      propertyType: "UseCode",
      land: "Land",
      imp: "Imps",
    },
    outFields: [],
    reliability: 80,
  },
  {
    county: "Contra Costa",
    layerUrl: "https://gis.cccounty.us/arcgis/rest/services/CCMAP/Assessment_Parcels_ArcPro/MapServer/0",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["S_STR_NBR", "S_STR_NM", "S_STR_SUF"],
      city: "S_CTY_ABBR",
      zip: "S_ZIP",
      propertyType: "USE_CODE",
      land: "LAND_VALUE",
      imp: "IMP_VAL",
    },
    outFields: [],
    reliability: 78,
  },
  {
    county: "Los Angeles",
    layerUrl: "https://public.gis.lacounty.gov/public/rest/services/LACounty_Cache/LACounty_Parcel/MapServer/0",
    where: "Roll_LandValue>0 AND AIN IS NOT NULL",
    map: {
      apn: "AIN",
      address: ["SitusFullAddress"],
      city: "SitusCity",
      zip: "SitusZIP",
      propertyType: "UseType",
      zoning: "UseCode",
      land: "Roll_LandValue",
      imp: "Roll_ImpValue",
      rollYear: "Roll_Year",
    },
    outFields: [],
    reliability: 80,
  },
  {
    county: "Orange",
    layerUrl: "https://www.ocgis.com/arcpub/rest/services/Map_Layers/Parcels/MapServer/0",
    where: "ASSESSMENT_NO IS NOT NULL",
    map: {
      apn: "ASSESSMENT_NO",
      address: ["SITE_ADDRESS"],
      yearBuilt: "YEAR_BUILT",
    },
    outFields: [],
    reliability: 76,
  },
  {
    county: "Sacramento",
    layerUrl: "https://services1.arcgis.com/5NARefyPVtAeuJPU/arcgis/rest/services/Parcels/FeatureServer/0",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["STREET_NBR", "STREET_NAM"],
      city: "CITY",
      zip: "ZIP",
      propertyType: "LANDUSE",
    },
    outFields: [],
    reliability: 76,
  },
  {
    county: "San Bernardino",
    layerUrl: "https://services.arcgis.com/aA3snZwJfFkVyDuP/arcgis/rest/services/Parcels_for_San_Bernardino_County/FeatureServer/0",
    where: "ParcelNumber IS NOT NULL",
    map: {
      apn: "ParcelNumber",
      zoning: "Zoning",
    },
    outFields: [],
    reliability: 70,
  },
  {
    county: "San Diego",
    layerUrl: "https://webmaps.sandiego.gov/arcgis/rest/services/GeocoderMerged/MapServer/1",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["SITUS_ADDRESS"],
      city: "SITUS_JURIS",
      land: "ASR_LAND",
      imp: "ASR_IMPR",
      assessed: "ASR_TOTAL",
    },
    outFields: [],
    reliability: 78,
  },
  {
    county: "Santa Clara",
    layerUrl: "https://services8.arcgis.com/fpjs8A5Vtkshblnd/arcgis/rest/services/Santa_Clara_County_Parcels/FeatureServer/0",
    where: "apn IS NOT NULL",
    map: {
      apn: "apn",
      address: ["situs_hous", "situs_stre", "situs_st_1"],
      city: "situs_city",
      zip: "situs_zip_",
    },
    outFields: [],
    reliability: 72,
  },
  {
    county: "Sonoma",
    layerUrl: "https://socogis.sonomacounty.ca.gov/map/rest/services/OWTSPublic/Cities_GIS_Parcel_Base/FeatureServer/0",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["SitusFormatted1"],
      city: "SitusCity",
    },
    outFields: [],
    reliability: 74,
  },
  {
    county: "Ventura",
    layerUrl: "https://maps.ventura.org/arcgis/rest/services/SDs/Parcels/MapServer/0",
    where: "APN IS NOT NULL",
    map: {
      apn: "APN",
      address: ["SITUS"],
      zoning: "ZONE",
      land: "L_V",
      imp: "I_V",
    },
    outFields: [],
    reliability: 77,
  },
];

const NATIVE_BY_COUNTY = new Map(NATIVE_LAYERS.map((l) => [l.county, l]));
const LAYERS: CountyParcelLayer[] = CA_COUNTIES.map((county) => NATIVE_BY_COUNTY.get(county) || dwrLayer(county));

for (const layer of LAYERS) {
  layer.outFields = fields(layer.map);
}

const LAYER_BY_COUNTY = new Map(LAYERS.map((l) => [l.county.toLowerCase(), l]));

export function allCaliforniaCounties(): string[] {
  return [...CA_COUNTIES];
}

export function countyLayer(county: string): CountyParcelLayer | null {
  return LAYER_BY_COUNTY.get(String(county || "").toLowerCase()) || null;
}

export function countiesWithPublicLayers(): string[] {
  return LAYERS.map((l) => l.county);
}

export function normalizeCountyName(raw: string): string | null {
  const n = String(raw || "").trim().toLowerCase().replace(/\s+county$/i, "");
  if (!n) return null;
  return CA_COUNTIES.find((c) => c.toLowerCase() === n) || null;
}

/** Buy-box counties first (if they have a layer), then statewide rotation. Never stop at one county. */
export function planStatewideScan(input: {
  buyBoxCounties: string[];
  rotationIndex: number;
  maxLayers: number;
}): { scan: CountyParcelLayer[]; nextRotation: number; notes: string[] } {
  const max = Math.max(1, Math.min(10, input.maxLayers));
  const notes: string[] = [];
  const scan: CountyParcelLayer[] = [];
  const seen = new Set<string>();

  for (const raw of input.buyBoxCounties) {
    const name = normalizeCountyName(raw);
    if (!name || seen.has(name)) continue;
    const layer = countyLayer(name);
    if (!layer) {
      notes.push(`${name}: Buy Box priority, no public REST layer yet — continuing statewide.`);
      continue;
    }
    scan.push(layer);
    seen.add(name);
    if (scan.length >= Math.min(2, max)) break;
  }

  const all = allCaliforniaCounties();
  let i = ((input.rotationIndex % all.length) + all.length) % all.length;
  let walked = 0;
  while (scan.length < max && walked < all.length) {
    const name = all[i];
    i = (i + 1) % all.length;
    walked += 1;
    if (seen.has(name)) continue;
    const layer = countyLayer(name);
    if (!layer) continue;
    scan.push(layer);
    seen.add(name);
  }

  notes.push(
    `Statewide plan: ${scan.map((s) => s.county).join(", ") || "none"}. Search territory is all ${all.length} California counties (${countiesWithPublicLayers().length} public layers this build). This pass is a batch; cron rotates until every county is visited.`,
  );
  return { scan, nextRotation: i, notes };
}

export { LAYERS as COUNTY_PARCEL_LAYERS };
