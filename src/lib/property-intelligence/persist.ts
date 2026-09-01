import { randomUUID } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { SOURCE_CATALOG } from "./sources";
import { canonicalKey, normalizeAddress } from "./california";
import { analyzeProperty } from "./analysis";
import { runDeepResearch } from "./deep-research";
import { evaluatePropertyLocation } from "./compliance";
import { matchBuyBox, type BuyBox } from "./matching";
import type { IngestedProperty } from "./adapters";
import { fetchSfAssessorByApn } from "./adapters";
import { allCaliforniaCounties, countiesWithPublicLayers } from "./ca-county-layers";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export async function audit(userId: string, action: string, extra: Record<string, unknown> = {}) {
  const q = await db();
  if (!q) return;
  await q`
    INSERT INTO pi_audit (id, user_id, action, reason, source_slug, result, compliance, payload_json, created_at)
    VALUES (
      ${randomUUID()}, ${userId}, ${action}, ${String(extra.reason || "")}, ${String(extra.source || "")},
      ${String(extra.result || "")}, ${String(extra.compliance || "")}, ${JSON.stringify(extra)}, ${new Date().toISOString()}
    )
  `;
}

export async function openNeedsMike(userId: string, title: string, detail: string, kind: string) {
  const q = await db();
  if (!q) return;
  const existing = (await q`
    SELECT id FROM pi_needs_mike WHERE user_id = ${userId} AND title = ${title} AND status = 'open' LIMIT 1
  `) as { id: string }[];
  if (existing[0]) return;
  await q`
    INSERT INTO pi_needs_mike (id, user_id, title, detail, kind, status, created_at)
    VALUES (${randomUUID()}, ${userId}, ${title}, ${detail}, ${kind}, 'open', ${new Date().toISOString()})
  `;
}

export async function seedConfigAndSources(userId: string) {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_config (user_id, pause_all, pause_property_scanning, pause_investor_discovery, pause_outreach,
      finder_fee_collection_enabled, attorney_approved, business_postal_address, company_name, state_json, updated_at)
    VALUES (${userId}, 0, 0, 0, 0, 0, 0, '', 'Amber Property Intelligence', '{}', ${now})
    ON CONFLICT (user_id) DO NOTHING
  `;
  for (const s of SOURCE_CATALOG) {
    const id = randomUUID();
    await q`
      INSERT INTO pi_sources (
        id, user_id, slug, name, url, source_type, data_type, public_private, api_available, feed_available,
        permitted_automation, scraping_status, attribution, commercial_use, refresh_limit, rate_limit,
        last_terms_review, reliability, active, records_collected, last_error, cursor_json
      ) VALUES (
        ${id}, ${userId}, ${s.slug}, ${s.name}, ${s.url}, ${s.sourceType}, ${s.dataType}, ${s.publicPrivate},
        ${s.apiAvailable ? 1 : 0}, ${s.feedAvailable ? 1 : 0}, ${s.permittedAutomation}, ${s.scrapingStatus},
        ${s.attribution}, ${s.commercialUse}, ${s.refreshLimit}, ${s.rateLimit}, ${s.lastTermsReview},
        ${s.reliability}, ${s.defaultActive ? 1 : 0}, 0, '', '{}'
      )
      ON CONFLICT (user_id, slug) DO UPDATE SET
        name = EXCLUDED.name, url = EXCLUDED.url, permitted_automation = EXCLUDED.permitted_automation,
        scraping_status = EXCLUDED.scraping_status, attribution = EXCLUDED.attribution
    `;
    if (s.needsMike && !s.defaultActive) {
      await openNeedsMike(userId, `OWNER REVIEW — ${s.name}`, s.needsMike, "terms");
    }
  }
}

export async function loadConfig(userId: string) {
  const q = await db();
  if (!q) return null;
  const rows = (await q`SELECT * FROM pi_config WHERE user_id = ${userId}`) as Record<string, unknown>[];
  return rows[0] || null;
}

export async function patchConfig(userId: string, patch: Record<string, unknown>) {
  const q = await db();
  if (!q) return;
  const cur = await loadConfig(userId);
  if (!cur) return;
  const now = new Date().toISOString();
  const pauseAll = patch.pause_all !== undefined ? (patch.pause_all ? 1 : 0) : Number(cur.pause_all);
  const pauseScan =
    patch.pause_property_scanning !== undefined ? (patch.pause_property_scanning ? 1 : 0) : Number(cur.pause_property_scanning);
  const pauseInv =
    patch.pause_investor_discovery !== undefined ? (patch.pause_investor_discovery ? 1 : 0) : Number(cur.pause_investor_discovery);
  const pauseOut = patch.pause_outreach !== undefined ? (patch.pause_outreach ? 1 : 0) : Number(cur.pause_outreach);
  await q`
    UPDATE pi_config SET
      pause_all = ${pauseAll},
      pause_property_scanning = ${pauseScan},
      pause_investor_discovery = ${pauseInv},
      pause_outreach = ${pauseOut},
      updated_at = ${now}
    WHERE user_id = ${userId}
  `;
}

export async function upsertProperty(userId: string, row: IngestedProperty, reliability: number) {
  const loc = evaluatePropertyLocation({ state: row.state, zip: row.zip, address: row.addressRaw });
  if (!loc.allow) {
    await audit(userId, "reject_non_ca", { reason: loc.message, source: row.sourceSlug });
    return { ok: false as const, reason: loc.message };
  }
  const q = await db();
  if (!q) return { ok: false as const, reason: "no db" };
  const addr = normalizeAddress(row.addressRaw);
  const key = canonicalKey({ apn: row.apn, county: row.county, addressNorm: addr });
  const taxDelinquent = Boolean(row.taxDelinquent);
  const foreclosure = Boolean(row.foreclosure);
  const auction = Boolean(row.auction);
  const vacant = Boolean(row.vacant);
  const analysis = analyzeProperty({
    askingCents: row.askingCents,
    assessedCents: row.assessedCents,
    estMarketCents: null,
    estRentCents: null,
    ownershipYears: row.ownershipYears,
    absentee: row.absentee,
    vacant,
    taxDelinquent,
    foreclosure,
    auction,
    fsbo: Boolean(row.fsbo),
    sourceReliability: reliability,
    fieldsPresent: [row.apn, addr, row.assessedCents, row.propertyType, taxDelinquent || null].filter(Boolean).length,
    fieldsTotal: 12,
  });
  const now = new Date().toISOString();
  const existing = (await q`
    SELECT id, assessed_cents FROM pi_properties WHERE user_id = ${userId} AND canonical_key = ${key}
  `) as { id: string; assessed_cents: number | null }[];
  const id = existing[0]?.id || randomUUID();
  const changed =
    existing[0] &&
    row.assessedCents != null &&
    existing[0].assessed_cents != null &&
    Number(existing[0].assessed_cents) !== row.assessedCents;
  const firstSeen = existing[0] ? null : now;
  await q`
    INSERT INTO pi_properties (
      id, user_id, canonical_key, apn, address_norm, address_raw, city, county, zip, state, lat, lon,
      property_type, asking_cents, assessed_cents, est_market_cents, deal_score, data_confidence, score_why,
      analysis_json, distress_json, rejected, reject_reason, retrieved_at, updated_at, ownership_years, absentee,
      vacant, tax_delinquent, foreclosure, auction, fsbo,
      beds, baths, sqft, year_built, zoning, units, first_seen, last_scanned, research_status
    ) VALUES (
      ${id}, ${userId}, ${key}, ${row.apn}, ${addr}, ${row.addressRaw}, ${row.city}, ${row.county}, ${row.zip}, 'CA',
      ${row.lat}, ${row.lon}, ${row.propertyType}, ${row.askingCents}, ${row.assessedCents}, ${null},
      ${analysis.dealScore}, ${analysis.dataConfidence}, ${analysis.why}, ${JSON.stringify(analysis.fields)},
      ${JSON.stringify(analysis.distress)}, 0, '', ${now}, ${now}, ${row.ownershipYears}, ${row.absentee ? 1 : 0},
      ${vacant ? 1 : 0}, ${taxDelinquent ? 1 : 0}, ${foreclosure ? 1 : 0}, ${auction ? 1 : 0}, ${row.fsbo ? 1 : 0},
      ${row.beds ?? null}, ${row.baths ?? null}, ${row.sqft ?? null}, ${row.yearBuilt ?? null}, ${row.zoning || ""},
      ${row.units ?? null}, ${firstSeen || now}, ${now}, ${"FIRST_PASS"}
    )
    ON CONFLICT (user_id, canonical_key) DO UPDATE SET
      address_raw = CASE
        WHEN pi_properties.address_raw LIKE 'APN %' AND EXCLUDED.address_raw NOT LIKE 'APN %' THEN EXCLUDED.address_raw
        ELSE pi_properties.address_raw
      END,
      property_type = CASE
        WHEN (pi_properties.property_type IS NULL OR pi_properties.property_type = '') AND EXCLUDED.property_type <> '' THEN EXCLUDED.property_type
        ELSE pi_properties.property_type
      END,
      assessed_cents = COALESCE(EXCLUDED.assessed_cents, pi_properties.assessed_cents),
      tax_delinquent = CASE WHEN EXCLUDED.tax_delinquent = 1 THEN 1 ELSE pi_properties.tax_delinquent END,
      foreclosure = CASE WHEN EXCLUDED.foreclosure = 1 THEN 1 ELSE pi_properties.foreclosure END,
      auction = CASE WHEN EXCLUDED.auction = 1 THEN 1 ELSE pi_properties.auction END,
      vacant = CASE WHEN EXCLUDED.vacant = 1 THEN 1 ELSE pi_properties.vacant END,
      absentee = CASE WHEN EXCLUDED.absentee = 1 THEN 1 ELSE pi_properties.absentee END,
      beds = COALESCE(EXCLUDED.beds, pi_properties.beds),
      baths = COALESCE(EXCLUDED.baths, pi_properties.baths),
      sqft = COALESCE(EXCLUDED.sqft, pi_properties.sqft),
      year_built = COALESCE(EXCLUDED.year_built, pi_properties.year_built),
      zoning = CASE WHEN EXCLUDED.zoning <> '' THEN EXCLUDED.zoning ELSE pi_properties.zoning END,
      units = COALESCE(EXCLUDED.units, pi_properties.units),
      last_scanned = EXCLUDED.last_scanned,
      first_seen = COALESCE(pi_properties.first_seen, EXCLUDED.first_seen),
      last_changed = CASE WHEN ${changed ? 1 : 0} = 1 THEN ${now} ELSE pi_properties.last_changed END,
      updated_at = EXCLUDED.updated_at
  `;
  await q`
    INSERT INTO pi_property_sources (id, user_id, property_id, source_slug, source_url, collected_at, payload_json)
    VALUES (${randomUUID()}, ${userId}, ${id}, ${row.sourceSlug}, ${row.sourceUrl}, ${now}, ${JSON.stringify(row.payload)})
    ON CONFLICT (property_id, source_slug) DO UPDATE SET collected_at = EXCLUDED.collected_at, payload_json = EXCLUDED.payload_json
  `;
  const deep = await applyDeepResearch(id);
  return { ok: true as const, id, dealScore: deep?.opportunityScore ?? analysis.dealScore };
}

export async function applyDeepResearch(propertyId: string) {
  const q = await db();
  if (!q) return null;
  const props = (await q`SELECT * FROM pi_properties WHERE id = ${propertyId} LIMIT 1`) as Record<string, unknown>[];
  const p = props[0];
  if (!p) return null;
  const sources = (await q`SELECT source_slug, payload_json FROM pi_property_sources WHERE property_id = ${propertyId}`) as Record<string, unknown>[];
  const county = String(p.county || "").toLowerCase();
  const thin = sources.length === 0 || !String(p.beds || "") || !p.assessed_cents;
  if (thin && county.includes("francisco")) {
    const live = await fetchSfAssessorByApn(String(p.apn || "")).catch(() => null);
    if (live) {
      await q`
        INSERT INTO pi_property_sources (id, user_id, property_id, source_slug, source_url, collected_at, payload_json)
        VALUES (${randomUUID()}, ${String(p.user_id)}, ${propertyId}, ${"sfgov_assessor"}, ${live.sourceUrl}, ${new Date().toISOString()}, ${JSON.stringify(live.payload)})
        ON CONFLICT (property_id, source_slug) DO UPDATE SET collected_at = EXCLUDED.collected_at, payload_json = EXCLUDED.payload_json
      `;
      sources.push({ source_slug: "sfgov_assessor", payload_json: JSON.stringify(live.payload) });
    }
  }
  const deep = runDeepResearch(p, sources);
  const h = deep.hydrated;
  const now = deep.lastVerified;
  const status = deep.meaningful && deep.freshnessOk ? "RESEARCHED" : "INTERNAL";
  await q`
    UPDATE pi_properties SET
      beds = ${h.beds},
      baths = ${h.baths},
      sqft = ${h.sqft},
      year_built = ${h.yearBuilt},
      zoning = ${h.zoning},
      units = ${h.units},
      assessed_cents = COALESCE(${h.assessedCents}, assessed_cents),
      property_type = CASE WHEN ${h.propertyType} <> '' THEN ${h.propertyType} ELSE property_type END,
      data_confidence = ${deep.dataConfidence},
      deal_score = ${deep.opportunityScore},
      opportunity_score = ${deep.opportunityScore},
      score_why = ${deep.why},
      analysis_json = ${JSON.stringify(deep.fields)},
      classification_json = ${JSON.stringify(deep.fields)},
      conflict_json = ${JSON.stringify(deep.conflicts)},
      last_verified = ${now},
      research_status = ${status},
      updated_at = ${now}
    WHERE id = ${propertyId}
  `;
  return deep;
}

export async function runDeepResearchPass(limit = 12): Promise<{ researched: number; qualified: number }> {
  const q = await db();
  if (!q) return { researched: 0, qualified: 0 };
  const cap = Math.min(20, Math.max(1, limit));
  const rows = (await q`
    SELECT id FROM pi_properties WHERE rejected = 0 AND state = 'CA'
    ORDER BY tax_delinquent DESC, foreclosure DESC, updated_at DESC
    LIMIT ${cap}
  `) as { id: string }[];
  let researched = 0;
  let qualified = 0;
  for (const r of rows) {
    const d = await applyDeepResearch(r.id);
    if (!d) continue;
    researched += 1;
    if (d.meaningful && d.freshnessOk) qualified += 1;
  }
  return { researched, qualified };
}

export async function upsertInvestor(
  userId: string,
  row: { name: string; business: string; city: string; zip: string; sourceSlug: string },
) {
  const q = await db();
  if (!q) return;
  const loc = evaluatePropertyLocation({ state: "CA", zip: row.zip, address: row.city });
  if (!loc.allow) return;
  const existing = (await q`
    SELECT id FROM pi_investors WHERE user_id = ${userId} AND name = ${row.name} AND zip = ${row.zip} LIMIT 1
  `) as { id: string }[];
  if (existing[0]) return;
  const now = new Date().toISOString();
  const professional = /llc|inc|holdings|capital|properties|invest|realty|management/i.test(`${row.name} ${row.business}`);
  await q`
    INSERT INTO pi_investors (
      id, user_id, name, business, email, phone, city, county, zip, source_slug, qualification, opt_out, notes, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${userId}, ${row.name}, ${row.business}, '', '', ${row.city}, 'Los Angeles', ${row.zip},
      ${row.sourceSlug}, ${professional ? "qualified" : "discovered"}, 0,
      'Public business-license record. Contact not invented.', ${now}, ${now}
    )
  `;
}

export async function listUsersWithPi(): Promise<string[]> {
  const q = await db();
  if (!q) return [];
  const fromConfig = (await q`SELECT user_id FROM pi_config`) as { user_id: string }[];
  if (fromConfig.length) return fromConfig.map((r) => r.user_id);
  const users = (await q`SELECT id FROM users LIMIT 25`) as { id: string }[];
  return users.map((u) => u.id);
}

export type Dashboard = {
  amberStatus: string;
  lastScan: string | null;
  kpis: Record<string, number>;
  sources: Record<string, unknown>[];
  properties: Record<string, unknown>[];
  clientBuyBoxes?: Record<string, unknown>[];
  investors: Record<string, unknown>[];
  matches: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  needsMike: Record<string, unknown>[];
  introductions: Record<string, unknown>[];
  finderFees: Record<string, unknown>[];
  config: Record<string, unknown> | null;
  disclaimer: string;
  statewideCoverage?: {
    targetCounties: number;
    layersThisBuild: number;
    lastCounties: string[];
    countiesTouched: string[];
  };
};

export async function buildDashboard(userId: string): Promise<Dashboard> {
  const q = await db();
  const empty: Dashboard = {
    amberStatus: "NO_DB",
    lastScan: null,
    kpis: {},
    sources: [],
    properties: [],
    clientBuyBoxes: [],
    investors: [],
    matches: [],
    alerts: [],
    needsMike: [],
    introductions: [],
    finderFees: [],
    config: null,
    disclaimer: "",
  };
  if (!q) return empty;
  await seedConfigAndSources(userId);
  const cfg = await loadConfig(userId);
  const sources = (await q`SELECT * FROM pi_sources WHERE user_id = ${userId} ORDER BY name`) as Record<string, unknown>[];
  const properties = (await q`SELECT * FROM pi_properties WHERE user_id = ${userId} AND rejected = 0 ORDER BY deal_score DESC LIMIT 80`) as Record<string, unknown>[];
  const investors = (await q`SELECT * FROM pi_investors WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 80`) as Record<string, unknown>[];
  const matches = (await q`SELECT * FROM pi_matches WHERE user_id = ${userId} ORDER BY score DESC LIMIT 40`) as Record<string, unknown>[];
  const alerts = (await q`SELECT * FROM pi_alerts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`) as Record<string, unknown>[];
  const needsMike = (await q`SELECT * FROM pi_needs_mike WHERE user_id = ${userId} AND status = 'open' ORDER BY created_at DESC`) as Record<string, unknown>[];
  const introductions = (await q`SELECT * FROM pi_introductions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`) as Record<string, unknown>[];
  const finderFees = (await q`SELECT * FROM pi_finder_fees WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`) as Record<string, unknown>[];

  const nProp = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND rejected = 0`) as { n: number }[];
  const today = new Date().toISOString().slice(0, 10);
  const nToday = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND rejected = 0 AND retrieved_at >= ${today}`) as { n: number }[];
  const nNew = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND rejected = 0 AND deal_score >= 55`) as { n: number }[];
  const nStrong = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND deal_score >= 70`) as { n: number }[];
  const nHigh = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND data_confidence >= 70`) as { n: number }[];
  const nMeaningful = (await q`SELECT COUNT(*) AS n FROM pi_research_packages WHERE quality_ok = 1`) as { n: number }[];
  const nInternal = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE rejected = 0 AND (research_status IS NULL OR research_status <> 'RESEARCHED')`) as { n: number }[];
  const nOffered = (await q`SELECT COUNT(*) AS n FROM pi_opportunities WHERE quality_ok = 1 AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')`) as { n: number }[];
  const nRejected = (await q`SELECT COUNT(*) AS n FROM pi_rejections`) as { n: number }[];
  const nDistress = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND rejected = 0 AND (tax_delinquent = 1 OR foreclosure = 1 OR auction = 1 OR vacant = 1 OR absentee = 1)`) as { n: number }[];
  const nTax = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND tax_delinquent = 1`) as { n: number }[];
  const nFc = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND foreclosure = 1`) as { n: number }[];
  const nAuc = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE user_id = ${userId} AND auction = 1`) as { n: number }[];
  const nInv = (await q`SELECT COUNT(*) AS n FROM pi_investors WHERE user_id = ${userId}`) as { n: number }[];
  const nQual = (await q`SELECT COUNT(*) AS n FROM pi_investors WHERE user_id = ${userId} AND qualification = 'qualified'`) as { n: number }[];
  const nBoxes = (await q`SELECT COUNT(*) AS n FROM pi_buy_boxes WHERE user_id = ${userId}`) as { n: number }[];
  const nClientBoxes = (await q`SELECT COUNT(*) AS n FROM pi_client_buy_boxes WHERE paused = 0`) as { n: number }[];
  const clientBuyBoxes = (await q`
    SELECT id, user_id, name, criteria_json, paused, created_at, updated_at FROM pi_client_buy_boxes ORDER BY updated_at DESC LIMIT 40
  `) as Record<string, unknown>[];
  const nMatch = (await q`SELECT COUNT(*) AS n FROM pi_matches WHERE user_id = ${userId}`) as { n: number }[];
  const nDelivered = (await q`SELECT COUNT(*) AS n FROM pi_matches WHERE user_id = ${userId} AND delivered = 1`) as { n: number }[];
  const nOut = (await q`SELECT COUNT(*) AS n FROM pi_outreach WHERE user_id = ${userId} AND status = 'sent'`) as { n: number }[];
  const nResp = (await q`SELECT COUNT(*) AS n FROM pi_outreach WHERE user_id = ${userId} AND status IN ('replied','interested')`) as { n: number }[];
  const nInterested = (await q`SELECT COUNT(*) AS n FROM pi_investors WHERE user_id = ${userId} AND qualification IN ('interested','active')`) as { n: number }[];
  const nActiveInv = (await q`SELECT COUNT(*) AS n FROM pi_investors WHERE user_id = ${userId} AND qualification = 'active'`) as { n: number }[];
  const nIntroReq = (await q`SELECT COUNT(*) AS n FROM pi_introductions WHERE user_id = ${userId}`) as { n: number }[];
  const last = sources.map((s) => String(s.last_scan_at || "")).filter(Boolean).sort().reverse()[0] || null;
  const potentialCents = finderFees.reduce((a, f) => a + Number(f.potential_cents || 0), 0);
  const pendingCents = finderFees.reduce((a, f) => a + Number(f.pending_cents || 0), 0);
  const collectedCents = finderFees.reduce((a, f) => a + Number(f.collected_cents || 0), 0);
  const statewideSrc = sources.find((s) => String(s.slug) === "ca_statewide_parcels");
  let lastCounties: string[] = [];
  let countiesTouched: string[] = [];
  try {
    const cur = JSON.parse(String(statewideSrc?.cursor_json || "{}")) as {
      lastCounties?: string[];
      offsets?: Record<string, number>;
    };
    lastCounties = Array.isArray(cur.lastCounties) ? cur.lastCounties.filter(Boolean) : [];
    countiesTouched = Object.keys(cur.offsets || {}).filter(Boolean);
  } catch {
    lastCounties = [];
  }

  return {
    amberStatus: Number(cfg?.pause_all) ? "PAUSED" : "RUNNING",
    lastScan: last,
    kpis: {
      propertiesScannedToday: Number(nToday[0]?.n || 0),
      propertiesScannedLifetime: Number(nProp[0]?.n || 0),
      newOpportunities: Number(nNew[0]?.n || 0),
      strongOpportunities: Number(nStrong[0]?.n || 0),
      highConfidence: Number(nHigh[0]?.n || 0),
      firstPassCandidates: Number(nInternal[0]?.n || 0),
      deepResearchQualified: Number(nMeaningful[0]?.n || 0),
      qualifiedOpportunities: Number(nOffered[0]?.n || 0),
      rejectedProperties: Number(nRejected[0]?.n || 0),
      distressedProperties: Number(nDistress[0]?.n || 0),
      taxDefaultOpportunities: Number(nTax[0]?.n || 0),
      foreclosureOpportunities: Number(nFc[0]?.n || 0),
      auctionOpportunities: Number(nAuc[0]?.n || 0),
      prospectsDiscovered: Number(nInv[0]?.n || 0),
      prospectsQualified: Number(nQual[0]?.n || 0),
      outreachSent: Number(nOut[0]?.n || 0),
      responses: Number(nResp[0]?.n || 0),
      interestedInvestors: Number(nInterested[0]?.n || 0),
      activeInvestors: Number(nActiveInv[0]?.n || 0),
      buyBoxes: Number(nBoxes[0]?.n || 0),
      clientLibraryBuyBoxes: Number(nClientBoxes[0]?.n || 0),
      matchesGenerated: Number(nMatch[0]?.n || 0),
      opportunitiesDelivered: Number(nDelivered[0]?.n || 0),
      introductionsRequested: Number(nIntroReq[0]?.n || 0),
      introductionsCompleted: introductions.filter((i) => i.status === "completed").length,
      dealsBeingPursued: introductions.filter((i) => i.status === "pursuing" || i.status === "completed").length,
      potentialFinderFeesUsd: potentialCents / 100,
      pendingFinderFeesUsd: pendingCents / 100,
      collectedFinderFeesUsd: collectedCents / 100,
      operatingExpensesUsd: 0,
      netProfitUsd: 0,
      californiaCountiesTarget: allCaliforniaCounties().length,
      californiaCountiesWithLayers: countiesWithPublicLayers().length,
      californiaCountiesTouched: countiesTouched.length,
    },
    sources,
    properties,
    clientBuyBoxes,
    investors,
    matches,
    alerts,
    needsMike,
    introductions,
    finderFees,
    config: cfg,
    statewideCoverage: {
      targetCounties: allCaliforniaCounties().length,
      layersThisBuild: countiesWithPublicLayers().length,
      lastCounties,
      countiesTouched,
    },
    disclaimer:
      "Estimates require independent verification. Automated valuation is not an appraisal. This is not a title search. Amber is not a real-estate broker or agent.",
  };
}

export async function saveBuyBox(userId: string, investorId: string, box: BuyBox) {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_buy_boxes (id, user_id, investor_id, criteria_json, updated_at)
    VALUES (${randomUUID()}, ${userId}, ${investorId}, ${JSON.stringify(box)}, ${now})
    ON CONFLICT (investor_id) DO UPDATE SET criteria_json = EXCLUDED.criteria_json, updated_at = EXCLUDED.updated_at
  `;
}

export async function runMatching(userId: string) {
  const q = await db();
  if (!q) return { matches: 0 };
  const boxes = (await q`SELECT * FROM pi_buy_boxes WHERE user_id = ${userId}`) as Record<string, unknown>[];
  const props = (await q`SELECT * FROM pi_properties WHERE user_id = ${userId} AND rejected = 0 ORDER BY deal_score DESC LIMIT 400`) as Record<string, unknown>[];
  let n = 0;
  const now = new Date().toISOString();
  for (const b of boxes) {
    let box: BuyBox = {};
    try {
      box = JSON.parse(String(b.criteria_json || "{}")) as BuyBox;
    } catch {
      continue;
    }
    const hits: Array<{ propertyId: string; score: number; why: string }> = [];
    for (const p of props) {
      const r = matchBuyBox(box, {
        city: String(p.city),
        county: String(p.county),
        zip: String(p.zip),
        state: String(p.state || "CA"),
        assessedCents: p.assessed_cents == null ? null : Number(p.assessed_cents),
        propertyType: String(p.property_type || ""),
        beds: p.beds == null || p.beds === "" ? null : Number(p.beds),
        baths: p.baths == null || p.baths === "" ? null : Number(p.baths),
        sqft: p.sqft == null || p.sqft === "" ? null : Number(p.sqft),
        taxDelinquent: Boolean(Number(p.tax_delinquent)),
        foreclosure: Boolean(Number(p.foreclosure)),
        auction: Boolean(Number(p.auction)),
        vacant: Boolean(Number(p.vacant)),
        absentee: Boolean(Number(p.absentee)),
      });
      if (r.ok) hits.push({ propertyId: String(p.id), score: r.score + Number(p.deal_score || 0) / 5, why: r.why });
    }
    hits.sort((a, c) => c.score - a.score);
    for (const h of hits.slice(0, 8)) {
      await q`
        INSERT INTO pi_matches (id, user_id, investor_id, property_id, score, why, delivered, created_at)
        VALUES (${randomUUID()}, ${userId}, ${String(b.investor_id)}, ${h.propertyId}, ${Math.round(h.score)}, ${h.why}, 0, ${now})
        ON CONFLICT (investor_id, property_id) DO UPDATE SET score = EXCLUDED.score, why = EXCLUDED.why
      `;
      n += 1;
      const prop = props.find((p) => String(p.id) === h.propertyId);
      if (prop && Number(prop.deal_score) >= 70) {
        const exists = (await q`
          SELECT id FROM pi_alerts WHERE user_id = ${userId} AND investor_id = ${String(b.investor_id)} AND property_id = ${h.propertyId} LIMIT 1
        `) as { id: string }[];
        if (!exists[0]) {
          await q`
            INSERT INTO pi_alerts (id, user_id, investor_id, property_id, title, body, created_at)
            VALUES (
              ${randomUUID()}, ${userId}, ${String(b.investor_id)}, ${h.propertyId},
              ${"Strong California match"},
              ${`Deal Score ${prop.deal_score}/100. Data Confidence ${prop.data_confidence}/100. ${h.why}. ${String(prop.score_why || "")} Major risk: public records are not a title search. Verification required.`},
              ${now}
            )
          `;
        }
      }
    }
  }
  return { matches: n };
}

export async function recordIntroduction(userId: string, investorId: string, propertyId: string, contact: string) {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_introductions (id, user_id, investor_id, property_id, contact, finder_agreement_status, status, introduced_at, created_at)
    VALUES (${randomUUID()}, ${userId}, ${investorId}, ${propertyId}, ${contact}, 'none', 'completed', ${now}, ${now})
  `;
  await audit(userId, "introduction", {
    reason: "Introduction recorded. Amber exits negotiation.",
    compliance: "BROKERAGE BOUNDARY — HUMAN/PROFESSIONAL REQUIRED",
  });
}

export async function suppressEmail(userId: string, email: string) {
  const q = await db();
  if (!q) return;
  const addr = email.trim().toLowerCase();
  if (!addr.includes("@")) return;
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_suppression (id, user_id, email, reason, created_at)
    VALUES (${randomUUID()}, ${userId}, ${addr}, 'opt_out', ${now})
    ON CONFLICT (user_id, email) DO NOTHING
  `;
  await q`UPDATE pi_investors SET opt_out = 1, updated_at = ${now} WHERE user_id = ${userId} AND lower(email) = ${addr}`;
}

export async function setSourceActive(userId: string, slug: string, active: boolean) {
  const q = await db();
  if (!q) return { ok: false, error: "no db" };
  const pol = SOURCE_CATALOG.find((s) => s.slug === slug);
  if (pol && pol.scrapingStatus === "prohibited" && active) {
    return { ok: false, error: "Cannot enable a source whose automated collection is prohibited." };
  }
  await q`UPDATE pi_sources SET active = ${active ? 1 : 0} WHERE user_id = ${userId} AND slug = ${slug}`;
  return { ok: true };
}

export async function markSourceScan(userId: string, slug: string, ok: boolean, records: number, error: string, cursor: Record<string, unknown>) {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  if (ok) {
    await q`
      UPDATE pi_sources SET last_scan_at = ${now}, last_success_at = ${now}, last_error = '',
        records_collected = records_collected + ${records}, cursor_json = ${JSON.stringify(cursor)}
      WHERE user_id = ${userId} AND slug = ${slug}
    `;
  } else {
    await q`
      UPDATE pi_sources SET last_scan_at = ${now}, last_error = ${error}, cursor_json = ${JSON.stringify(cursor)}
      WHERE user_id = ${userId} AND slug = ${slug}
    `;
  }
}

export async function sourceCursor(userId: string, slug: string): Promise<Record<string, unknown>> {
  const q = await db();
  if (!q) return {};
  const rows = (await q`SELECT cursor_json FROM pi_sources WHERE user_id = ${userId} AND slug = ${slug}`) as { cursor_json: string }[];
  try {
    return JSON.parse(String(rows[0]?.cursor_json || "{}")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function sourceActive(userId: string, slug: string): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const rows = (await q`SELECT active, scraping_status FROM pi_sources WHERE user_id = ${userId} AND slug = ${slug}`) as {
    active: number;
    scraping_status: string;
  }[];
  if (!rows[0]) return false;
  if (rows[0].scraping_status === "prohibited") return false;
  return Number(rows[0].active) === 1;
}
