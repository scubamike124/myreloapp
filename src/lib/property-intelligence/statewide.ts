import type { IngestedProperty } from "./adapters";
import { fetchCountyParcelLayer } from "./adapters";
import { planStatewideScan, type CountyParcelLayer } from "./ca-county-layers";
import {
  markSourceScan,
  sourceActive,
  sourceCursor,
  upsertProperty,
} from "./persist";

const STATEWIDE_SLUG = "ca_statewide_parcels";

export async function listActiveBuyBoxCounties(userId: string): Promise<string[]> {
  const { sqlAsync, ensureSchema } = await import("@/lib/db");
  if (!(await ensureSchema())) return [];
  const q = await sqlAsync();
  if (!q) return [];
  const rows = (await q`SELECT criteria_json FROM pi_client_buy_boxes WHERE paused = 0`) as { criteria_json: string }[];
  const out: string[] = [];
  for (const r of rows) {
    try {
      const box = JSON.parse(String(r.criteria_json || "{}")) as { targetCounties?: string[] };
      for (const c of box.targetCounties || []) {
        if (c && !out.includes(c)) out.push(c);
      }
    } catch {
      /* ignore */
    }
  }
  void userId;
  return out;
}

export async function runStatewideCountyDiscovery(
  userId: string,
  opts?: { maxLayers?: number; deadlineMs?: number },
): Promise<{ notes: string[]; ingested: number; countiesAttempted: string[]; countiesFailed: string[] }> {
  const notes: string[] = [];
  const countiesAttempted: string[] = [];
  const countiesFailed: string[] = [];
  let ingested = 0;
  const deadline = Number(opts?.deadlineMs || 0);

  if (!(await sourceActive(userId, STATEWIDE_SLUG))) {
    notes.push("Statewide parcel source disabled — other California sources still run independently.");
    return { notes, ingested, countiesAttempted, countiesFailed };
  }

  const cur = await sourceCursor(userId, STATEWIDE_SLUG);
  const rotationIndex = Number(cur.rotation || 0);
  const offsets = (cur.offsets && typeof cur.offsets === "object" ? cur.offsets : {}) as Record<string, number>;
  const buyBoxCounties = await listActiveBuyBoxCounties(userId).catch(() => [] as string[]);
  const plan = planStatewideScan({
    buyBoxCounties,
    rotationIndex,
    maxLayers: opts?.maxLayers ?? 4,
  });
  notes.push(...plan.notes);
  if (buyBoxCounties.length) {
    notes.push(`Buy Box priority counties: ${buyBoxCounties.join(", ")} (priority only — not the search territory).`);
  }

  for (const layer of plan.scan) {
    if (deadline && Date.now() > deadline - 3_000) {
      notes.push(`${layer.county}: skipped this tick — Worker time budget; rotation continues next cron.`);
      continue;
    }
    countiesAttempted.push(layer.county);
    const offset = Number(offsets[layer.county] || 0);
    try {
      const batch = await fetchCountyParcelLayer(layer, offset, 6);
      if (batch.error) {
        countiesFailed.push(layer.county);
        notes.push(`${layer.county}: ${batch.error} — continuing other California counties.`);
        continue;
      }
      let n = 0;
      for (const row of batch.rows) {
        try {
          const r = await upsertProperty(userId, row, layer.reliability);
          if (r.ok) n += 1;
        } catch (err) {
          notes.push(`${layer.county} upsert skip: ${err instanceof Error ? err.message : "error"}`);
        }
      }
      offsets[layer.county] = batch.nextOffset;
      ingested += n;
      notes.push(`${layer.county}: ingested ${n} public-record parcels${layer.layerUrl.includes("water.ca.gov") ? " (DWR statewide assessor identity)" : ""}.`);
    } catch (e) {
      countiesFailed.push(layer.county);
      notes.push(`${layer.county}: ${e instanceof Error ? e.message : "scan failed"} — continuing statewide.`);
    }
  }

  await markSourceScan(
    userId,
    STATEWIDE_SLUG,
    countiesFailed.length < plan.scan.length || plan.scan.length === 0,
    ingested,
    countiesFailed.length ? `${countiesFailed.join(", ")} failed this tick` : "",
    { rotation: plan.nextRotation, offsets, lastCounties: countiesAttempted },
  );
  return { notes, ingested, countiesAttempted, countiesFailed };
}

export type { CountyParcelLayer };
