export const CA_COUNTIES = [
  "Alameda","Alpine","Amador","Butte","Calaveras","Colusa","Contra Costa","Del Norte","El Dorado","Fresno",
  "Glenn","Humboldt","Imperial","Inyo","Kern","Kings","Lake","Lassen","Los Angeles","Madera","Marin",
  "Mariposa","Mendocino","Merced","Modoc","Mono","Monterey","Napa","Nevada","Orange","Placer","Plumas",
  "Riverside","Sacramento","San Benito","San Bernardino","San Diego","San Francisco","San Joaquin",
  "San Luis Obispo","San Mateo","Santa Barbara","Santa Clara","Santa Cruz","Shasta","Sierra","Siskiyou",
  "Solano","Sonoma","Stanislaus","Sutter","Tehama","Trinity","Tulare","Tuolumne","Ventura","Yolo","Yuba",
] as const;

export function normalizeAddress(raw: string): string {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ",")
    .trim()
    .toUpperCase();
}

/**
 * San Francisco assessor situs strings pad house numbers and glue unit onto the street type:
 * `0000 0704 NORTH POINT ST0000` → `704 NORTH POINT ST`
 * Does not invent a listing address — only reformats what the county stored.
 */
export function readableSitusAddress(raw: string): string {
  let s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  if (/^APN\s/i.test(s)) return s;
  s = s.replace(
    /\b(STREET|ST|AVENUE|AVE|AV|BOULEVARD|BLVD|ROAD|RD|DRIVE|DR|COURT|CT|LANE|LN|WAY|PLACE|PL|TERRACE|TER|HIGHWAY|HWY)\s*([0-9A-Z]{3,6})\b/gi,
    (_m, type: string, unit: string) => {
      const u = String(unit).replace(/^0+/, "");
      return u ? `${type} Unit ${u}` : String(type);
    },
  );
  s = s.replace(/^0{3,}\s+/, "");
  s = s.replace(/\b0+(\d+)/g, "$1");
  return s.replace(/\s+/g, " ").trim();
}

export function canonicalKey(input: { apn?: string; county?: string; addressNorm?: string }): string {
  const apn = String(input.apn || "").replace(/[^A-Z0-9]/gi, "");
  const county = String(input.county || "unknown").toLowerCase().replace(/\s+/g, "-");
  if (apn) return `ca:${county}:${apn}`;
  const addr = String(input.addressNorm || "unknown").replace(/[^A-Z0-9]/gi, "").slice(0, 48);
  return `ca:${county}:addr:${addr}`;
}
