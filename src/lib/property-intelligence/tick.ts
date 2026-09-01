import { fetchLaInvestors, fetchSbTaxDefault, fetchSfAssessor } from "./adapters";
import { fetchSfTaxSale, SF_TAX_SALE_SLUG } from "./sf-tax-sale";
import { SOURCE_CATALOG } from "./sources";
import { runStatewideCountyDiscovery } from "./statewide";
import { allCaliforniaCounties, countiesWithPublicLayers } from "./ca-county-layers";
import {
  audit,
  listUsersWithPi,
  loadConfig,
  markSourceScan,
  runDeepResearchPass,
  runMatching,
  seedConfigAndSources,
  sourceActive,
  sourceCursor,
  upsertInvestor,
  upsertProperty,
} from "./persist";

/** Cloudflare Worker HTTP/cron wall budget. Discovery must yield so matching still runs. */
export const PI_TICK_BUDGET_MS = 28_000;

async function isolated(label: string, notes: string[], fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    notes.push(`${label}: ${e instanceof Error ? e.message : "failed"} — continuing other California sources.`);
  }
}

export async function runPropertyIntelligenceTick(userId: string): Promise<{ notes: string[] }> {
  const notes: string[] = [];
  const deadline = Date.now() + PI_TICK_BUDGET_MS;
  const remaining = () => deadline - Date.now();
  await seedConfigAndSources(userId);
  const cfg = await loadConfig(userId);
  if (!cfg) {
    notes.push("No config row.");
    return { notes };
  }
  if (Number(cfg.pause_all)) {
    notes.push("PAUSE ALL — no external activity.");
    await audit(userId, "tick_paused", { reason: "pause_all" });
    return { notes };
  }

  notes.push(
    `California search territory is all ${allCaliforniaCounties().length} counties. ${countiesWithPublicLayers().length} public parcel layers this build (county GIS where published, DWR statewide assessor identity for the rest). A blocked county does not stop the pipeline.`,
  );

  if (Number(cfg.pause_property_scanning)) {
    notes.push("Property scanning paused.");
  } else {
    await isolated("Statewide county parcels", notes, async () => {
      if (remaining() < 4_000) {
        notes.push("Statewide scan deferred this tick — Worker time budget; matching still runs.");
        return;
      }
      const r = await runStatewideCountyDiscovery(userId, {
        maxLayers: remaining() > 12_000 ? 4 : 2,
        deadlineMs: deadline,
      });
      notes.push(...r.notes);
    });

    await isolated("SF Assessor", notes, async () => {
      if (remaining() < 3_000) {
        notes.push("SF Assessor deferred this tick — Worker time budget.");
        return;
      }
      if (!(await sourceActive(userId, "sfgov_assessor"))) {
        notes.push("SF Assessor disabled — continuing other California counties.");
        return;
      }
      const cur = await sourceCursor(userId, "sfgov_assessor");
      const offset = Number(cur.offset || 0);
      const batch = await fetchSfAssessor(offset, 6);
      if (batch.error) {
        await markSourceScan(userId, "sfgov_assessor", false, 0, batch.error, { offset });
        notes.push(`${batch.error} — continuing statewide.`);
        return;
      }
      let n = 0;
      const rel = SOURCE_CATALOG.find((s) => s.slug === "sfgov_assessor")?.reliability || 80;
      for (const row of batch.rows) {
        try {
          const r = await upsertProperty(userId, row, rel);
          if (r.ok) n += 1;
        } catch (err) {
          notes.push(`SF upsert skip: ${err instanceof Error ? err.message : "error"}`);
        }
      }
      await markSourceScan(userId, "sfgov_assessor", true, n, "", { offset: batch.nextOffset });
      notes.push(`San Francisco: ingested ${n} parcels (city-county; not the statewide territory).`);
    });

    await isolated("SB tax-default overlay", notes, async () => {
      if (remaining() < 4_000) {
        notes.push("SB tax-default deferred this tick — Worker time budget.");
        return;
      }
      if (!(await sourceActive(userId, "sbcounty_tax_default"))) return;
      const cur = await sourceCursor(userId, "sbcounty_tax_default");
      const offset = Number(cur.offset || 0);
      const batch = await fetchSbTaxDefault(offset, 8);
      if (batch.error) {
        await markSourceScan(userId, "sbcounty_tax_default", false, 0, batch.error, { offset });
        notes.push(`${batch.error} — San Bernardino is one overlay, not the search territory. Continuing.`);
        return;
      }
      let n = 0;
      const rel = SOURCE_CATALOG.find((s) => s.slug === "sbcounty_tax_default")?.reliability || 86;
      for (const row of batch.rows) {
        try {
          const r = await upsertProperty(userId, row, rel);
          if (r.ok) n += 1;
        } catch (err) {
          notes.push(`SB tax-default upsert skip: ${err instanceof Error ? err.message : "error"}`);
        }
      }
      await markSourceScan(userId, "sbcounty_tax_default", true, n, "", { offset: batch.nextOffset });
      notes.push(`San Bernardino tax-default overlay: ingested ${n} (distress signal only; not statewide territory).`);
    });

    await isolated("SF tax-sale publication", notes, async () => {
      if (remaining() < 4_000) {
        notes.push("SF tax-sale deferred this tick — Worker time budget.");
        return;
      }
      if (!(await sourceActive(userId, SF_TAX_SALE_SLUG))) return;
      const batch = await fetchSfTaxSale();
      if (batch.error) {
        await markSourceScan(userId, SF_TAX_SALE_SLUG, false, 0, batch.error, {});
        notes.push(`${batch.error} — continuing other California sources.`);
        return;
      }
      let n = 0;
      const rel = SOURCE_CATALOG.find((s) => s.slug === SF_TAX_SALE_SLUG)?.reliability || 92;
      for (const row of batch.rows) {
        try {
          const r = await upsertProperty(userId, row, rel);
          if (r.ok) n += 1;
        } catch (err) {
          notes.push(`SF tax-sale upsert skip: ${err instanceof Error ? err.message : "error"}`);
        }
      }
      await markSourceScan(userId, SF_TAX_SALE_SLUG, true, n, "", { count: n });
      notes.push(`San Francisco tax-sale notice: ingested ${n} tax-defaulted auction parcels (official TTC publication; assessee names not stored).`);
    });
  }

  if (!Number(cfg.pause_investor_discovery) && remaining() > 4_000 && (await sourceActive(userId, "lacity_business"))) {
    await isolated("LA business licenses", notes, async () => {
      const cur = await sourceCursor(userId, "lacity_business");
      const offset = Number(cur.offset || 0);
      const batch = await fetchLaInvestors(offset, 15);
      if (batch.error) {
        await markSourceScan(userId, "lacity_business", false, 0, batch.error, { offset });
        notes.push(batch.error);
        return;
      }
      let n = 0;
      for (const row of batch.rows) {
        try {
          await upsertInvestor(userId, { ...row, sourceSlug: "lacity_business" });
          n += 1;
        } catch (err) {
          notes.push(`LA investor upsert skip: ${err instanceof Error ? err.message : "error"}`);
        }
      }
      await markSourceScan(userId, "lacity_business", true, n, "", { offset: batch.nextOffset });
      notes.push(`LA business licenses: ${n} CA real-estate prospects (no invented emails).`);
    });
  }

  if (!Number(cfg.pause_outreach)) {
    notes.push("Outreach drafts only — no cold-call/SMS. Email send requires MAIL_FROM + postal address + non-suppressed recipient.");
  }

  const matched = await runMatching(userId);
  notes.push(`Matching pass: ${matched.matches} stored matches (quality over quantity; top 8 per Buy Box).`);
  try {
    if (remaining() < 2_000) {
      notes.push("Deep research deferred this tick — Worker time budget.");
    } else {
      const deep = await runDeepResearchPass(remaining() > 8_000 ? 6 : 3);
      notes.push(`Deep research: ${deep.researched} reviewed, ${deep.qualified} meaningful packages.`);
    }
  } catch (e) {
    notes.push(`Deep research: ${e instanceof Error ? e.message : "failed"}`);
  }
  try {
    const { runOpportunityPipeline } = await import("./opportunity");
    const opp = await runOpportunityPipeline(userId, { deadlineMs: deadline });
    notes.push(`Opportunity pipeline: created ${opp.created}, rejected ${opp.rejected}.`);
  } catch (e) {
    notes.push(`Opportunity pipeline: ${e instanceof Error ? e.message : "failed"}`);
  }
  if (remaining() < 0) {
    notes.push("Tick used the full Worker time budget and still finished matching/offers.");
  }
  await audit(userId, "tick", { result: notes.join(" | ") });
  return { notes };
}

export async function runAllPropertyIntelligenceTicks(): Promise<{ users: number; notes: string[] }> {
  const ids = await listUsersWithPi();
  const notes: string[] = [];
  for (const id of ids) {
    const r = await runPropertyIntelligenceTick(id);
    notes.push(...r.notes);
  }
  return { users: ids.length, notes: notes.slice(0, 20) };
}
