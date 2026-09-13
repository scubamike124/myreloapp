/**
 * Minimal, dependency-free CSV parsing shared by every MotorBridge parser.
 * Handles quoted fields (including embedded commas and escaped quotes) —
 * enough for the diagnostic/telemetry export shapes these parsers target,
 * not a general-purpose RFC 4180 implementation.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

/** Rows keyed by header, with headers normalized (trimmed, case-preserved) for lookup by parsers below. */
export function parseCsvWithHeader(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const raw = parseCsv(text);
  if (raw.length === 0) return { headers: [], rows: [] };
  const headers = raw[0].map((h) => h.trim());
  const rows = raw.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = (cells[idx] ?? "").trim();
    });
    return record;
  });
  return { headers, rows };
}

/** Case/spacing-insensitive column lookup — real-world exports vary "Coolant Temp" vs "coolant_temp" vs "CoolantTemp(C)". */
export function findColumn(headers: string[], candidates: string[]): string | null {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalize(h) }));
  for (const candidate of candidates) {
    const nc = normalize(candidate);
    const hit = normalizedHeaders.find((h) => h.norm === nc || h.norm.startsWith(nc));
    if (hit) return hit.original;
  }
  return null;
}

export function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value.replace(/[^\d.eE+-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
