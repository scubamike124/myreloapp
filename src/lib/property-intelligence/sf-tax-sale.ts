import { inflateRawSync, inflateSync } from "node:zlib";
import { evaluatePropertyLocation } from "./compliance";
import { normalizeAddress, readableSitusAddress } from "./california";
import type { IngestedProperty } from "./adapters";

export const SF_TAX_SALE_URL =
  "https://sftreasurer.org/file/2026-public-and-sealed-bid-auction-publication/download?attachment=";

export const SF_TAX_SALE_SLUG = "sfttc_tax_sale";

type PdfRun = { x: number; y: number; text: string };

export type SfTaxSaleParcel = {
  apn: string;
  block: string;
  lot: string;
  situs: string;
  minimumBidCents: number | null;
  saleKind: "public_auction" | "sealed_bid";
};

function decodeParen(raw: string): string {
  return raw.replace(/\\([()\\])/g, "$1");
}

function decodeTjArray(body: string): string {
  const parts: string[] = [];
  const re = /\(((?:\\.|[^\\)])*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) parts.push(decodeParen(m[1]));
  return parts.join("");
}

export function inflatePdfStreams(buf: Uint8Array): string {
  const latin = Buffer.from(buf).toString("latin1");
  const chunks: string[] = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin))) {
    const raw = Buffer.from(m[1], "latin1");
    for (const fn of [inflateSync, inflateRawSync]) {
      try {
        chunks.push(fn(raw).toString("latin1"));
        break;
      } catch {
        /* try next inflater */
      }
    }
  }
  return chunks.join("\n");
}

/** Pull (x,y,text) runs. Owner-name column is dropped later by x position, not by reading names. */
export function extractPdfTextRuns(content: string): PdfRun[] {
  const tms: Array<{ index: number; x: number; y: number }> = [];
  const tm = /([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+Tm/g;
  let m: RegExpExecArray | null;
  while ((m = tm.exec(content))) {
    tms.push({ index: m.index + m[0].length, x: Number(m[5]), y: Number(m[6]) });
  }
  const runs: PdfRun[] = [];
  for (let i = 0; i < tms.length; i++) {
    const cur = tms[i];
    const end = i + 1 < tms.length ? tms[i + 1].index : Math.min(content.length, cur.index + 160);
    const rest = content.slice(cur.index, end);
    const tj = rest.match(/\(((?:\\.|[^\\)])*)\)\s*Tj/);
    const arr = rest.match(/\[([\s\S]*?)\]\s*TJ/);
    const tjAt = tj ? rest.indexOf(tj[0]) : Number.POSITIVE_INFINITY;
    const arrAt = arr ? rest.indexOf(arr[0]) : Number.POSITIVE_INFINITY;
    let text = "";
    if (tj && tjAt <= arrAt) text = decodeParen(tj[1]);
    else if (arr) text = decodeTjArray(arr[1]);
    text = text.replace(/\s+/g, " ").trim();
    if (text) runs.push({ x: cur.x, y: cur.y, text });
  }
  return runs;
}

function parseMoneyCents(raw: string): number | null {
  const m = raw.replace(/,/g, "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function isHeaderRow(texts: string[]): boolean {
  const hay = texts.join(" ").toUpperCase();
  return (
    /\bVOL\b/.test(hay) ||
    /CURRENT ASSESSEE/.test(hay) ||
    /MINIMUM BID/.test(hay) ||
    /PARCEL NUMBERING/.test(hay) ||
    /NOTICE OF /.test(hay)
  );
}

/**
 * Official SF TTC auction notice layout: VOL / BLOCK / LOT / SITUS / ASSESSEE / MIN BID.
 * Assessee column (x ≈ 138–214) is never stored.
 */
export function parseSfTaxSaleRuns(runs: PdfRun[]): SfTaxSaleParcel[] {
  const seenRun = new Set<string>();
  const unique: PdfRun[] = [];
  for (const r of runs) {
    const k = `${Math.round(r.x * 10)}:${Math.round(r.y * 10)}:${r.text}`;
    if (seenRun.has(k)) continue;
    seenRun.add(k);
    unique.push(r);
  }
  const byY = new Map<number, PdfRun[]>();
  for (const r of unique) {
    const key = Math.round(r.y);
    const list = byY.get(key) || [];
    list.push(r);
    byY.set(key, list);
  }
  const rows = [...byY.entries()].sort((a, b) => b[0] - a[0]);
  let saleKind: SfTaxSaleParcel["saleKind"] = "public_auction";
  const out: SfTaxSaleParcel[] = [];
  const seen = new Set<string>();
  for (const [, group] of rows) {
    const texts = group.map((g) => g.text);
    const hay = texts.join(" ").toUpperCase();
    if (/SEALED BID/.test(hay)) saleKind = "sealed_bid";
    if (isHeaderRow(texts)) continue;
    let vol = "";
    let block = "";
    let lot = "";
    const situsParts: string[] = [];
    let money = "";
    for (const g of group) {
      if (g.x >= 137 && g.x < 215) continue;
      if (g.x >= 215) {
        money += g.text;
        continue;
      }
      if (g.x < 25) vol += g.text;
      else if (g.x < 49) block += g.text;
      else if (g.x < 69) lot += g.text;
      else situsParts.push(g.text);
    }
    const situs = readableSitusAddress(situsParts.join(" ").replace(/\s+/g, " ").trim());
    const blockNorm = block.replace(/\s+/g, "").toUpperCase();
    const lotNorm = lot.replace(/\s+/g, "").toUpperCase();
    if (!/^\d{3,4}[A-Z]?$/.test(blockNorm) || !/^\d{3,4}[A-Z]?$/.test(lotNorm)) continue;
    if (!situs || !money) continue;
    const apn = `${blockNorm}${lotNorm}`;
    if (seen.has(apn)) continue;
    seen.add(apn);
    void vol;
    out.push({
      apn,
      block: blockNorm,
      lot: lotNorm,
      situs,
      minimumBidCents: parseMoneyCents(money),
      saleKind,
    });
  }
  return out;
}

export function parseSfTaxSalePdf(buf: Uint8Array): SfTaxSaleParcel[] {
  return parseSfTaxSaleRuns(extractPdfTextRuns(inflatePdfStreams(buf)));
}

function toIngested(row: SfTaxSaleParcel): IngestedProperty | null {
  const loc = evaluatePropertyLocation({
    state: "CA",
    zip: "",
    address: row.situs || "San Francisco California",
  });
  if (!loc.allow) return null;
  return {
    apn: row.apn,
    addressRaw: normalizeAddress(row.situs) || `APN ${row.apn}`,
    city: "San Francisco",
    county: "San Francisco",
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
    auction: true,
    sourceSlug: SF_TAX_SALE_SLUG,
    sourceUrl: SF_TAX_SALE_URL,
    payload: {
      kind: "FACT",
      publication: "City and County of San Francisco Tax Collector notice of tax-defaulted property auction (2026).",
      block: row.block,
      lot: row.lot,
      situs: row.situs,
      saleKind: row.saleKind,
      minimumBidCents: row.minimumBidCents,
      note: "Official tax-sale publication. Not a title search. Owner/assessee names are not stored.",
    },
  };
}

export async function fetchSfTaxSale(): Promise<{ rows: IngestedProperty[]; error?: string }> {
  let res: Response;
  try {
    res = await fetch(SF_TAX_SALE_URL, {
      headers: { Accept: "application/pdf" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (e) {
    return { rows: [], error: `SF tax-sale publication unreachable (${e instanceof Error ? e.message : "error"})` };
  }
  if (!res.ok) return { rows: [], error: `SF tax-sale publication HTTP ${res.status}` };
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length < 1000 || buf.length > 4_000_000) {
    return { rows: [], error: `SF tax-sale publication unexpected size (${buf.length} bytes)` };
  }
  const parsed = parseSfTaxSalePdf(buf);
  const rows = parsed.map(toIngested).filter((r): r is IngestedProperty => Boolean(r));
  if (!rows.length) return { rows: [], error: "SF tax-sale publication parsed with no parcel rows" };
  return { rows };
}
