import { randomUUID } from "node:crypto";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { audit } from "./persist";
import { criteriaFingerprint, matchBuyBox, type BuyBox } from "./matching";
import { evaluatePropertyLocation } from "./compliance";
import { buildConfidentialPreview, reverseIdentificationTest } from "./preview";
import { qualityGate } from "./quality-gate";
import { runDeepResearch } from "./deep-research";
import {
  AGREEMENT_VERSION,
  MIN_OFFER_MATCH_SCORE,
  PREVIEW_VERSION,
  REPORT_VERSION,
  UNLOCK_PRICE_CENTS,
} from "./constants";
import { evaluateOpportunityThesis } from "./opportunity-thesis";
import { proposedSuccessFeeCents } from "./success-fees";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export async function ensureClient(userId: string, name: string, email: string) {
  const q = await db();
  if (!q) return null;
  const now = new Date().toISOString();
  const existing = (await q`SELECT id FROM pi_clients WHERE user_id = ${userId} LIMIT 1`) as { id: string }[];
  if (existing[0]) return existing[0].id;
  const id = randomUUID();
  await q`
    INSERT INTO pi_clients (id, user_id, name, email, created_at, updated_at)
    VALUES (${id}, ${userId}, ${name}, ${email}, ${now}, ${now})
    ON CONFLICT (user_id) DO NOTHING
  `;
  const row = (await q`SELECT id FROM pi_clients WHERE user_id = ${userId} LIMIT 1`) as { id: string }[];
  return row[0]?.id || id;
}

function parseBox(raw: unknown): BuyBox {
  try {
    return JSON.parse(String(raw || "{}")) as BuyBox;
  } catch {
    return {};
  }
}

/** Collapse identical requirement-sets per client. Keeps the oldest row. */
export async function collapseDuplicateClientBuyBoxes(userId?: string) {
  const q = await db();
  if (!q) return { merged: 0 };
  const rows = (
    userId
      ? await q`SELECT id, user_id, criteria_json, created_at FROM pi_client_buy_boxes WHERE user_id = ${userId} ORDER BY created_at ASC`
      : await q`SELECT id, user_id, criteria_json, created_at FROM pi_client_buy_boxes ORDER BY created_at ASC`
  ) as { id: string; user_id: string; criteria_json: string; created_at: string }[];
  const keep = new Map<string, string>();
  const drop: string[] = [];
  for (const row of rows) {
    const key = `${row.user_id}::${criteriaFingerprint(parseBox(row.criteria_json))}`;
    const keeper = keep.get(key);
    if (!keeper) {
      keep.set(key, row.id);
      continue;
    }
    drop.push(row.id);
    await q`UPDATE pi_opportunities SET buy_box_id = ${keeper} WHERE buy_box_id = ${row.id}`;
  }
  for (const id of drop) {
    await q`DELETE FROM pi_client_buy_boxes WHERE id = ${id}`;
  }
  return { merged: drop.length };
}

export async function saveClientBuyBox(userId: string, box: BuyBox, boxId?: string) {
  const q = await db();
  if (!q) return { ok: false as const, error: "no db" };
  const clientId = await ensureClient(userId, "", "");
  if (!clientId) return { ok: false as const, error: "no client" };
  const now = new Date().toISOString();
  const existing = (await q`
    SELECT id, criteria_json, created_at FROM pi_client_buy_boxes WHERE user_id = ${userId} ORDER BY created_at ASC
  `) as { id: string; criteria_json: string; created_at: string }[];
  const fp = criteriaFingerprint(box);
  const hit = existing.find((row) => criteriaFingerprint(parseBox(row.criteria_json)) === fp);
  // Never mint a second row for the same client + same requirements.
  const id = hit?.id || boxId || randomUUID();
  const paused = box.paused ? 1 : 0;
  const name = String(box.label || "Buy Box").slice(0, 80) || "Buy Box";
  await q`
    INSERT INTO pi_client_buy_boxes (id, client_id, user_id, name, criteria_json, paused, created_at, updated_at)
    VALUES (${id}, ${clientId}, ${userId}, ${name}, ${JSON.stringify(box)}, ${paused}, ${now}, ${now})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, criteria_json = EXCLUDED.criteria_json, paused = EXCLUDED.paused, updated_at = EXCLUDED.updated_at
  `;
  return { ok: true as const, id };
}

export async function listClientBuyBoxes(userId: string) {
  const q = await db();
  if (!q) return [];
  return (await q`SELECT * FROM pi_client_buy_boxes WHERE user_id = ${userId} ORDER BY updated_at DESC`) as Record<string, unknown>[];
}

export async function pauseClientBuyBox(userId: string, boxId: string, paused: boolean) {
  const q = await db();
  if (!q) return;
  const now = new Date().toISOString();
  await q`UPDATE pi_client_buy_boxes SET paused = ${paused ? 1 : 0}, updated_at = ${now} WHERE id = ${boxId} AND user_id = ${userId}`;
}

export async function deleteClientBuyBox(userId: string, boxId: string) {
  const q = await db();
  if (!q) return;
  await q`DELETE FROM pi_client_buy_boxes WHERE id = ${boxId} AND user_id = ${userId}`;
}

function propertyToMatchInput(p: Record<string, unknown>) {
  return {
    city: String(p.city || ""),
    county: String(p.county || ""),
    zip: String(p.zip || ""),
    state: String(p.state || "CA"),
    assessedCents: p.assessed_cents == null ? null : Number(p.assessed_cents),
    askingCents: p.asking_cents == null ? null : Number(p.asking_cents),
    propertyType: String(p.property_type || ""),
    beds: p.beds == null || p.beds === "" ? null : Number(p.beds),
    baths: p.baths == null || p.baths === "" ? null : Number(p.baths),
    sqft: p.sqft == null || p.sqft === "" ? null : Number(p.sqft),
    taxDelinquent: Boolean(Number(p.tax_delinquent)),
    foreclosure: Boolean(Number(p.foreclosure)),
    auction: Boolean(Number(p.auction)),
    vacant: Boolean(Number(p.vacant)),
    absentee: Boolean(Number(p.absentee)),
  };
}

function mergeSourcePayloads(rows: Record<string, unknown>[] | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of rows || []) {
    try {
      const raw = s.payload_json;
      const parsed =
        typeof raw === "string"
          ? (JSON.parse(raw) as Record<string, unknown>)
          : raw && typeof raw === "object"
            ? (raw as Record<string, unknown>)
            : {};
      Object.assign(out, parsed);
    } catch {
      /* ignore malformed source payload */
    }
  }
  return out;
}

function thesisFromResearch(
  box: BuyBox,
  p: Record<string, unknown>,
  h: {
    taxDelinquent: boolean;
    foreclosure: boolean;
    auction: boolean;
    vacant: boolean;
    absentee: boolean;
    askingCents: number | null;
    assessedCents: number | null;
  },
  sources: Record<string, unknown>[],
  matchWhy: string,
) {
  return evaluateOpportunityThesis({
    box,
    taxDelinquent: h.taxDelinquent,
    foreclosure: h.foreclosure,
    auction: h.auction,
    vacant: h.vacant,
    absentee: h.absentee,
    askingCents: h.askingCents,
    assessedCents: h.assessedCents,
    daysOnMarket: p.days_on_market == null || p.days_on_market === "" ? null : Number(p.days_on_market),
    payload: mergeSourcePayloads(sources),
    sourceSlugs: (sources || []).map((s) => String(s.source_slug || "")),
    matchWhy,
  });
}

function attachClientThesis(preview: Record<string, unknown>, thesis: ReturnType<typeof evaluateOpportunityThesis>) {
  const labeled: Record<string, unknown> = {
    ...preview,
    headline: thesis.offerable
      ? "Amber found verified circumstances — not just a filter match — that may make this a worthwhile $299 research unlock."
      : preview.headline,
    whyThisMayBeAGoodDeal: thesis.client,
  };
  const rid = reverseIdentificationTest(labeled);
  if (rid.pass) return labeled;
  return {
    ...preview,
    headline: "Amber found verified circumstances that may make this a worthwhile $299 research unlock.",
    whyThisMayBeAGoodDeal: {
      ...thesis.client,
      sources: "Permitted public-record source (named sources withheld until unlock).",
    },
  };
}

export async function runOpportunityPipeline(operatorUserId: string, opts?: { deadlineMs?: number }): Promise<{ created: number; rejected: number; notes: string[]; qualified: number; rejectReasons: string[] }> {
  const q = await db();
  const notes: string[] = [];
  if (!q) return { created: 0, rejected: 0, notes: ["no db"], qualified: 0, rejectReasons: [] };
  const now = new Date().toISOString();
  const deadline = Number(opts?.deadlineMs || 0);
  const props = (await q`
    SELECT * FROM pi_properties WHERE rejected = 0 AND state = 'CA' ORDER BY opportunity_score DESC NULLS LAST, deal_score DESC LIMIT 200
  `) as Record<string, unknown>[];
  const boxes = (await q`SELECT * FROM pi_client_buy_boxes WHERE paused = 0`) as Record<string, unknown>[];
  const sourceRows = (await q`SELECT property_id, source_slug, payload_json FROM pi_property_sources`) as Record<string, unknown>[];
  const sourcesByProp = new Map<string, Record<string, unknown>[]>();
  for (const s of sourceRows) {
    const id = String(s.property_id);
    const list = sourcesByProp.get(id) || [];
    list.push(s);
    sourcesByProp.set(id, list);
  }
  let created = 0;
  let rejected = 0;
  let qualified = 0;
  const rejectReasons: string[] = [];
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentRejects = (await q`
    SELECT DISTINCT property_id FROM pi_rejections WHERE created_at >= ${dayAgo}
  `) as { property_id: string }[];
  const alreadyRejected = new Set(recentRejects.map((r) => String(r.property_id)));
  async function recordRejection(propertyId: string, reason: string, detail: string) {
    rejected += 1;
    if (!q) return;
    if (alreadyRejected.has(propertyId)) return;
    alreadyRejected.add(propertyId);
    await q`
      INSERT INTO pi_rejections (id, property_id, reason, detail, created_at)
      VALUES (${randomUUID()}, ${propertyId}, ${reason}, ${detail}, ${now})
    `;
  }

  for (const p of props) {
    try {
    if (deadline && Date.now() > deadline) {
      notes.push("Opportunity pipeline stopped at Worker time budget — remaining properties next tick.");
      break;
    }
    const deep = runDeepResearch(p, sourcesByProp.get(String(p.id)) || []);
    const h = deep.hydrated;
    const loc = evaluatePropertyLocation({ state: "CA", zip: h.zip, address: `${h.city} ${h.county} ${h.addressRaw}` });
    const preview = buildConfidentialPreview({
      propertyType: h.propertyType,
      assessedCents: h.assessedCents,
      askingCents: h.askingCents,
      taxDelinquent: h.taxDelinquent,
      foreclosure: h.foreclosure,
      auction: h.auction,
      dataConfidence: deep.dataConfidence,
      matchingCount: boxes.length,
      beds: h.beds,
      baths: h.baths,
      opportunityScore: deep.opportunityScore,
    });
    const rid = reverseIdentificationTest(preview);
    if (!rid.pass) {
      preview.bedroomBathCategory = "bedroom/bath class UNKNOWN until unlocked research";
      const rid2 = reverseIdentificationTest(preview);
      if (!rid2.pass) {
        await recordRejection(String(p.id), "COMPLIANCE ISSUE", "REVERSE_IDENTIFICATION_RISK");
        continue;
      }
    }
    const researchGate = qualityGate({
      exists: Boolean(h.apn && h.addressRaw && !/^APN /i.test(h.addressRaw)),
      california: loc.allow,
      hasSource: deep.sourceCount > 0,
      hasFact: deep.factCount > 0,
      duplicate: false,
      previewPass: true,
      identifyingLocked: true,
      confidence: deep.dataConfidence,
      stale: !deep.freshnessOk,
      meaningful: deep.meaningful,
      factCount: deep.factCount,
      priceKnown: h.assessedCents != null || h.askingCents != null,
      opportunityScoreSet: true,
      classified: true,
      conflictsReviewed: true,
    });
    try {
      await q`
      INSERT INTO pi_research_packages (
        id, property_id, operator_user_id, status, opportunity_score, data_confidence,
        preview_json, reverse_id_risk, quality_ok, report_version, retrieved_at, created_at, updated_at,
        report_json, fact_count, meaningful
      ) VALUES (
        ${String(p.id)}, ${String(p.id)}, ${String(p.user_id)}, ${researchGate.offerable ? "QUALIFIED" : "NOT_OFFERABLE"},
        ${deep.opportunityScore}, ${deep.dataConfidence}, ${JSON.stringify(preview)},
        ${"PASS"}, ${researchGate.offerable ? 1 : 0}, ${REPORT_VERSION}, ${now}, ${now}, ${now},
        ${JSON.stringify({ fields: deep.fields, why: deep.why, conflicts: deep.conflicts })},
        ${deep.factCount}, ${deep.meaningful ? 1 : 0}
      )
      ON CONFLICT (id) DO UPDATE SET
        opportunity_score = EXCLUDED.opportunity_score,
        data_confidence = EXCLUDED.data_confidence,
        preview_json = EXCLUDED.preview_json,
        quality_ok = EXCLUDED.quality_ok,
        status = EXCLUDED.status,
        report_json = EXCLUDED.report_json,
        fact_count = EXCLUDED.fact_count,
        meaningful = EXCLUDED.meaningful,
        updated_at = EXCLUDED.updated_at
    `;
    } catch (err) {
      notes.push(`research package skip: ${err instanceof Error ? err.message : "error"}`);
      continue;
    }
    if (!researchGate.offerable) {
      const why = researchGate.reasons.join("; ");
      if (rejectReasons.length < 8 && !rejectReasons.includes(why)) rejectReasons.push(why);
      await recordRejection(
        String(p.id),
        researchGate.reasons[0] || "RESEARCH PACKAGE NOT WORTH $299",
        researchGate.reasons.join("; "),
      );
      await q`
        UPDATE pi_opportunities SET status = ${"INTERNAL_NOT_OFFERABLE"}, quality_ok = 0, updated_at = ${now}
        WHERE property_id = ${String(p.id)} AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
      `;
      continue;
    }
    qualified += 1;

    const thesesOut: unknown[] = [];
    if (!boxes.length) {
      notes.push("No-client opportunity library updated.");
      continue;
    }

    for (const b of boxes) {
      let box: BuyBox = {};
      try {
        box = JSON.parse(String(b.criteria_json || "{}")) as BuyBox;
      } catch {
        continue;
      }
      const m = matchBuyBox(box, propertyToMatchInput({ ...p, ...{
        beds: h.beds, baths: h.baths, sqft: h.sqft, assessed_cents: h.assessedCents, asking_cents: h.askingCents,
        property_type: h.propertyType, city: h.city, county: h.county, zip: h.zip, tax_delinquent: h.taxDelinquent ? 1 : 0,
        foreclosure: h.foreclosure ? 1 : 0, auction: h.auction ? 1 : 0, vacant: h.vacant ? 1 : 0, absentee: h.absentee ? 1 : 0,
      } }));
      const sources = sourcesByProp.get(String(p.id)) || [];
      const thesis = thesisFromResearch(box, p, h, sources, m.why);
      thesesOut.push({
        buyBoxId: String(b.id),
        offerable: thesis.offerable,
        rejectReason: thesis.rejectReason,
        owner: thesis.owner,
      });
      const offerGate = qualityGate({
        exists: true,
        california: true,
        hasSource: true,
        hasFact: true,
        duplicate: false,
        previewPass: true,
        identifyingLocked: true,
        confidence: deep.dataConfidence,
        stale: !deep.freshnessOk,
        meaningful: deep.meaningful,
        factCount: deep.factCount,
        priceKnown: true,
        opportunityScoreSet: true,
        classified: true,
        conflictsReviewed: true,
        matchScore: m.score,
        hasInvestmentThesis: thesis.offerable,
      });
      const clientUserId = String(b.user_id);
      const existing = (await q`
        SELECT id, status FROM pi_opportunities WHERE client_user_id = ${clientUserId} AND property_id = ${String(p.id)} LIMIT 1
      `) as { id: string; status: string }[];
      const paid = existing[0] && ["PAID", "UNLOCKED", "DISCLOSED"].includes(String(existing[0].status));
      if (paid) continue;
      if (!m.ok || !offerGate.offerable || m.score < MIN_OFFER_MATCH_SCORE) {
        if (existing[0]) {
          await q`
            UPDATE pi_opportunities SET status = ${"INTERNAL_NOT_OFFERABLE"}, quality_ok = 0, updated_at = ${now}
            WHERE id = ${existing[0].id} AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
          `;
        }
        if (!thesis.offerable) {
          if (rejectReasons.length < 8 && !rejectReasons.includes(thesis.rejectReason)) rejectReasons.push(thesis.rejectReason);
          await recordRejection(String(p.id), "NO WORTHWHILE OPPORTUNITY THESIS", thesis.rejectReason);
        }
        continue;
      }
      const labeled = attachClientThesis(
        {
          ...preview,
          opportunityLabel: `Opportunity`,
          matchingOpportunitiesAvailable: 0,
        },
        thesis,
      );
      const ownerMatchWhy = `THESIS PASS: ${thesis.signals.filter((s) => s.kind === "FACT").map((s) => s.label).join("; ") || "verified"} | spec: ${m.why}`;
      if (existing[0]) {
        await q`
          UPDATE pi_opportunities SET
            status = ${"PREVIEW_AVAILABLE"},
            match_score = ${m.score},
            match_why = ${ownerMatchWhy},
            preview_json = ${JSON.stringify(labeled)},
            quality_ok = 1,
            updated_at = ${now}
          WHERE id = ${existing[0].id}
        `;
        continue;
      }
      const oppId = randomUUID();
      const nPrior = (await q`SELECT COUNT(*) AS n FROM pi_opportunities WHERE client_user_id = ${clientUserId} AND quality_ok = 1`) as { n: number }[];
      const ordinal = Number(nPrior[0]?.n || 0) + 1;
      labeled.opportunityLabel = `Opportunity #${ordinal}`;
      labeled.matchingOpportunitiesAvailable = ordinal;
      try {
        await q`
        INSERT INTO pi_opportunities (
          id, operator_user_id, client_user_id, property_id, buy_box_id, status, match_score, match_why,
          preview_json, preview_version, agreement_version, success_fee_tier_cents, created_at, updated_at, quality_ok
        ) VALUES (
          ${oppId}, ${String(p.user_id)}, ${clientUserId}, ${String(p.id)}, ${String(b.id)}, ${"PREVIEW_AVAILABLE"},
          ${m.score}, ${ownerMatchWhy}, ${JSON.stringify(labeled)}, ${PREVIEW_VERSION}, ${AGREEMENT_VERSION},
          ${proposedSuccessFeeCents(Number(h.assessedCents || 0))}, ${now}, ${now}, ${1}
        )
      `;
        await q`
        INSERT INTO pi_match_history (id, client_user_id, opportunity_id, property_id, event, match_score, created_at)
        VALUES (${randomUUID()}, ${clientUserId}, ${oppId}, ${String(p.id)}, ${"offered"}, ${m.score}, ${now})
      `;
        await q`
        INSERT INTO pi_alerts (id, user_id, investor_id, property_id, title, body, created_at)
        VALUES (
          ${randomUUID()}, ${clientUserId}, ${""}, ${""},
          ${"Private research opportunity available"},
          ${"Amber found a California opportunity with a verified investment thesis — not just a filter match. Unlock price: $299 for that Opportunity ID only."},
          ${now}
        )
      `;
        created += 1;
      } catch (err) {
        notes.push(`opportunity insert skip: ${err instanceof Error ? err.message : "error"}`);
      }
    }
    if (thesesOut.length) {
      await q`
        UPDATE pi_research_packages SET
          report_json = ${JSON.stringify({ fields: deep.fields, why: deep.why, conflicts: deep.conflicts, opportunityTheses: thesesOut })},
          updated_at = ${now}
        WHERE id = ${String(p.id)}
      `;
    }
    } catch (err) {
      notes.push(`property skip: ${err instanceof Error ? err.message : "error"}`);
    }
  }
  const enforced = await enforceOpportunityThesisOnLiveOffers();
  notes.push(`thesis-enforce demoted=${enforced.demoted} refreshed=${enforced.refreshed}`);
  await audit(operatorUserId, "opportunity_pipeline", { result: `created=${created} rejected=${rejected} qualified=${qualified} demoted=${enforced.demoted}` });
  return { created, rejected, notes, qualified, rejectReasons };
}
export async function enforceOpportunityThesisOnLiveOffers(): Promise<{ demoted: number; refreshed: number }> {
  const q = await db();
  if (!q) return { demoted: 0, refreshed: 0 };
  const now = new Date().toISOString();
  const live = (await q`
    SELECT id, client_user_id, property_id, buy_box_id, match_why, status
    FROM pi_opportunities
    WHERE quality_ok = 1 AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
  `) as Record<string, unknown>[];
  if (!live.length) return { demoted: 0, refreshed: 0 };

  let demoted = 0;
  let refreshed = 0;
  for (const o of live) {
    const pid = String(o.property_id);
    const props = (await q`SELECT * FROM pi_properties WHERE id = ${pid} LIMIT 1`) as Record<string, unknown>[];
    const p = props[0];
    if (!p) continue;
    let box: BuyBox = {};
    const br = (await q`SELECT criteria_json FROM pi_client_buy_boxes WHERE id = ${String(o.buy_box_id || "")} LIMIT 1`) as Record<string, unknown>[];
    try {
      box = JSON.parse(String(br[0]?.criteria_json || "{}")) as BuyBox;
    } catch {
      box = {};
    }
    const sources = (await q`
      SELECT property_id, source_slug, payload_json FROM pi_property_sources WHERE property_id = ${pid}
    `) as Record<string, unknown>[];
    const deep = runDeepResearch(p, sources);
    const h = deep.hydrated;
    const m = matchBuyBox(
      box,
      propertyToMatchInput({
        ...p,
        beds: h.beds,
        baths: h.baths,
        sqft: h.sqft,
        assessed_cents: h.assessedCents,
        asking_cents: h.askingCents,
        property_type: h.propertyType,
        city: h.city,
        county: h.county,
        zip: h.zip,
        tax_delinquent: h.taxDelinquent ? 1 : 0,
        foreclosure: h.foreclosure ? 1 : 0,
        auction: h.auction ? 1 : 0,
        vacant: h.vacant ? 1 : 0,
        absentee: h.absentee ? 1 : 0,
      }),
    );
    const thesis = thesisFromResearch(box, p, h, sources, m.why);
    if (!thesis.offerable) {
      await q`
        UPDATE pi_opportunities SET status = ${"INTERNAL_NOT_OFFERABLE"}, quality_ok = 0, updated_at = ${now}
        WHERE id = ${String(o.id)} AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
      `;
      await q`
        INSERT INTO pi_rejections (id, property_id, reason, detail, created_at)
        VALUES (${randomUUID()}, ${pid}, ${"NO WORTHWHILE OPPORTUNITY THESIS"}, ${thesis.rejectReason}, ${now})
      `;
      demoted += 1;
      continue;
    }
    const preview = buildConfidentialPreview({
      propertyType: h.propertyType,
      assessedCents: h.assessedCents,
      askingCents: h.askingCents,
      taxDelinquent: h.taxDelinquent,
      foreclosure: h.foreclosure,
      auction: h.auction,
      dataConfidence: deep.dataConfidence,
      beds: h.beds,
      baths: h.baths,
      opportunityScore: deep.opportunityScore,
    });
    const labeled = attachClientThesis(preview, thesis);
    await q`
      UPDATE pi_opportunities SET
        match_why = ${`THESIS PASS: ${thesis.signals.filter((s) => s.kind === "FACT").map((s) => s.label).join("; ") || "verified"} | spec: ${m.why}`},
        preview_json = ${JSON.stringify(labeled)},
        updated_at = ${now}
      WHERE id = ${String(o.id)}
    `;
    refreshed += 1;
  }
  return { demoted, refreshed };
}

export function lockedClientOpportunity(row: Record<string, unknown>) {
  let preview: Record<string, unknown> = {};
  try {
    preview = JSON.parse(String(row.preview_json || "{}")) as Record<string, unknown>;
  } catch {
    preview = {};
  }
  const why = preview.whyThisMayBeAGoodDeal;
  const whyObj = why && typeof why === "object" ? (why as Record<string, unknown>) : null;
  return {
    opportunityId: String(row.id),
    status: String(row.status),
    matchScore: Number(row.match_score || 0),
    matchWhy: String(
      whyObj?.plainEnglish ||
        "Filter match is never the reason for a $299 offer. See Why this may be a good deal.",
    ),
    unlockPriceUsd: 299,
    preview,
    locked: true,
  };
}

export function unlockedClientReport(row: Record<string, unknown>, property: Record<string, unknown>) {
  let classified: unknown[] = [];
  try {
    classified = JSON.parse(String(property.classification_json || property.analysis_json || "[]")) as unknown[];
  } catch {
    classified = [];
  }
  return {
    opportunityId: String(row.id),
    status: String(row.status),
    matchScore: Number(row.match_score || 0),
    unlockPriceUsd: 299,
    locked: false,
    reportVersion: REPORT_VERSION,
    property: {
      address: String(property.address_raw || "UNKNOWN"),
      city: String(property.city || "UNKNOWN"),
      county: String(property.county || "UNKNOWN"),
      zip: String(property.zip || "UNKNOWN"),
      apn: String(property.apn || "UNKNOWN"),
      propertyType: String(property.property_type || "UNKNOWN"),
      asking: property.asking_cents == null ? "UNKNOWN" : `approximately $${(Number(property.asking_cents) / 100).toLocaleString("en-US")}`,
      assessed: property.assessed_cents == null ? "UNKNOWN" : `approximately $${(Number(property.assessed_cents) / 100).toLocaleString("en-US")}`,
      taxDelinquent: Boolean(Number(property.tax_delinquent)),
      foreclosure: Boolean(Number(property.foreclosure)),
      dealScore: Number(property.opportunity_score || property.deal_score || 0),
      dataConfidence: Number(property.data_confidence || 0),
      why: String(property.score_why || ""),
      beds: property.beds == null ? "UNKNOWN" : String(property.beds),
      baths: property.baths == null ? "UNKNOWN" : String(property.baths),
      sqft: property.sqft == null ? "UNKNOWN" : String(property.sqft),
      yearBuilt: property.year_built == null ? "UNKNOWN" : String(property.year_built),
      zoning: String(property.zoning || "UNKNOWN"),
      classified,
      classificationNote:
        "FACT vs ESTIMATE vs UNKNOWN. Automated valuation is not an appraisal. This is not a title search. Independently verify before relying.",
    },
    disclosedAt: String(row.unlocked_at || ""),
  };
}

export async function clientPortalPayload(userId: string) {
  const q = await db();
  if (!q) return { opportunities: [], unlocked: [], buyBoxes: [], agreements: [], payments: [], alerts: [], library: { discoveryIndependent: true, activeBoxes: 0 } };
  await ensureClient(userId, "", "");
  await enforceOpportunityThesisOnLiveOffers();
  const boxes = await listClientBuyBoxes(userId);
  const opps = (await q`SELECT * FROM pi_opportunities WHERE client_user_id = ${userId} ORDER BY created_at DESC LIMIT 80`) as Record<string, unknown>[];
  const agreements = (await q`SELECT id, agreement_version, signed_at, signer_name FROM pi_agreements WHERE user_id = ${userId} ORDER BY signed_at DESC LIMIT 10`) as Record<string, unknown>[];
  const payments = (await q`SELECT id, opportunity_id, amount_cents, status, paid_at FROM pi_payments WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`) as Record<string, unknown>[];
  const alerts = (await q`SELECT id, title, body, created_at FROM pi_alerts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 15`) as Record<string, unknown>[];
  const locked = [];
  const unlocked = [];
  for (const o of opps) {
    const paid = ["PAID", "UNLOCKED", "DISCLOSED"].includes(String(o.status));
    if (!paid) {
      const sellable =
        Number(o.quality_ok) === 1 &&
        ["PREVIEW_AVAILABLE", "AGREEMENT_ACCEPTED", "PAYMENT_REQUIRED"].includes(String(o.status)) &&
        Number(o.match_score || 0) >= MIN_OFFER_MATCH_SCORE;
      if (sellable) locked.push(lockedClientOpportunity(o));
      continue;
    }
    const prop = (await q`SELECT * FROM pi_properties WHERE id = ${String(o.property_id)} LIMIT 1`) as Record<string, unknown>[];
    unlocked.push(unlockedClientReport(o, prop[0] || {}));
  }
  return {
    opportunities: locked,
    unlocked,
    buyBoxes: boxes.map((b) => ({
      id: b.id,
      name: b.name || "Buy Box",
      paused: Boolean(Number(b.paused)),
      criteria: JSON.parse(String(b.criteria_json || "{}")),
      updatedAt: b.updated_at,
    })),
    library: {
      discoveryIndependent: true,
      activeBoxes: boxes.filter((b) => !Number(b.paused)).length,
    },
    agreements,
    payments: payments.map((p) => ({
      id: p.id,
      opportunityId: p.opportunity_id,
      amountUsd: Number(p.amount_cents || 0) / 100,
      status: p.status,
      paidAt: p.paid_at,
    })),
    alerts,
  };
}

export async function recordMasterAgreement(userId: string, signerName: string, signature: string) {
  const q = await db();
  if (!q) return { ok: false as const };
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_agreements (id, user_id, agreement_version, signer_name, signature, signed_at, created_at)
    VALUES (${randomUUID()}, ${userId}, ${AGREEMENT_VERSION}, ${signerName}, ${signature}, ${now}, ${now})
  `;
  return { ok: true as const, signedAt: now, agreementVersion: AGREEMENT_VERSION };
}

export async function hasMasterAgreement(userId: string): Promise<boolean> {
  const q = await db();
  if (!q) return false;
  const rows = (await q`SELECT id FROM pi_agreements WHERE user_id = ${userId} AND agreement_version = ${AGREEMENT_VERSION} LIMIT 1`) as { id: string }[];
  return Boolean(rows[0]);
}

export async function recordUnlockAck(userId: string, opportunityId: string) {
  const q = await db();
  if (!q) return { ok: false as const };
  const now = new Date().toISOString();
  await q`
    INSERT INTO pi_unlock_acks (id, user_id, opportunity_id, agreement_version, accepted_at)
    VALUES (${randomUUID()}, ${userId}, ${opportunityId}, ${AGREEMENT_VERSION}, ${now})
  `;
  await q`UPDATE pi_opportunities SET status = 'PAYMENT_REQUIRED', updated_at = ${now} WHERE id = ${opportunityId} AND client_user_id = ${userId} AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED')`;
  return { ok: true as const };
}

export async function findPaidUnlock(userId: string, propertyId: string) {
  const q = await db();
  if (!q) return null;
  const rows = (await q`
    SELECT * FROM pi_opportunities
    WHERE client_user_id = ${userId} AND property_id = ${propertyId} AND status IN ('PAID','UNLOCKED','DISCLOSED')
    LIMIT 1
  `) as Record<string, unknown>[];
  return rows[0] || null;
}

export async function getOpportunityForUser(userId: string, opportunityId: string) {
  const q = await db();
  if (!q) return null;
  const rows = (await q`SELECT * FROM pi_opportunities WHERE id = ${opportunityId} AND client_user_id = ${userId} LIMIT 1`) as Record<string, unknown>[];
  return rows[0] || null;
}

export async function adminCommerceKpis(userId: string) {
  const q = await db();
  if (!q) {
    return {
      totalClients: 0,
      activeBuyBoxes: 0,
      propertiesResearched: 0,
      californiaCountiesInLibrary: 0,
      lockedOpportunities: 0,
      unlocks299: 0,
      grossResearchRevenueUsd: 0,
      propertiesDisclosed: 0,
      potentialSuccessFeesUsd: 0,
      paidSuccessFeesUsd: 0,
      successFeeCollectionEnabled: false,
    };
  }
  const nClients = (await q`SELECT COUNT(*) AS n FROM pi_clients`) as { n: number }[];
  const nBoxes = (await q`SELECT COUNT(*) AS n FROM pi_client_buy_boxes WHERE paused = 0`) as { n: number }[];
  const nProp = (await q`SELECT COUNT(*) AS n FROM pi_properties WHERE rejected = 0`) as { n: number }[];
  const nCounties = (await q`SELECT COUNT(DISTINCT county) AS n FROM pi_properties WHERE rejected = 0 AND state = 'CA'`) as { n: number }[];
  const nLocked = (await q`SELECT COUNT(*) AS n FROM pi_opportunities WHERE status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')`) as { n: number }[];
  const nPaid = (await q`SELECT COUNT(*) AS n FROM pi_payments WHERE status = 'paid' AND amount_cents = ${UNLOCK_PRICE_CENTS}`) as { n: number }[];
  const nDisc = (await q`SELECT COUNT(*) AS n FROM pi_opportunities WHERE status IN ('UNLOCKED','DISCLOSED')`) as { n: number }[];
  const pot = (await q`SELECT COALESCE(SUM(success_fee_tier_cents),0) AS n FROM pi_opportunities WHERE status IN ('DISCLOSED','CLIENT_PURSUING','UNDER_CONTRACT')`) as { n: number }[];
  return {
    totalClients: Number(nClients[0]?.n || 0),
    activeBuyBoxes: Number(nBoxes[0]?.n || 0),
    propertiesResearched: Number(nProp[0]?.n || 0),
    californiaCountiesInLibrary: Number(nCounties[0]?.n || 0),
    lockedOpportunities: Number(nLocked[0]?.n || 0),
    unlocks299: Number(nPaid[0]?.n || 0),
    grossResearchRevenueUsd: (Number(nPaid[0]?.n || 0) * UNLOCK_PRICE_CENTS) / 100,
    propertiesDisclosed: Number(nDisc[0]?.n || 0),
    potentialSuccessFeesUsd: Number(pot[0]?.n || 0) / 100,
    paidSuccessFeesUsd: 0,
  };
}
