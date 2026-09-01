/**
 * Owner/admin audit — unique properties, pipeline lists, Buy Box evidence.
 * Never used by the client unlock payload.
 */
import { ensureSchema, sqlAsync } from "@/lib/db";
import {
  describeBuyBoxRequirements,
  evaluateBuyBoxRequirements,
  matchBuyBox,
  requirementMatchPercent,
  type BuyBox,
  type MatchProperty,
  type RequirementRow,
} from "./matching";
import { MIN_OFFER_CONFIDENCE, MIN_OFFER_MATCH_SCORE, SELLER_SOLICITATION_ENABLED } from "./constants";
import { detectDuplicateProperties } from "./identity";
import { readableSitusAddress } from "./california";
import { extractDealEvidence } from "./deal-evidence";
import { evaluateOpportunityThesis } from "./opportunity-thesis";
import { enforceOpportunityThesisOnLiveOffers } from "./opportunity";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export const PIPELINE_STAGES = [
  "scanned",
  "first_pass_rejected",
  "deep_research",
  "qualified",
  "offered",
  "paid",
  "released",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export { detectDuplicateProperties, isReeloOwner } from "./identity";

export function na(v: unknown): string {
  if (v == null) return "Not available";
  if (typeof v === "number" && !Number.isFinite(v)) return "Not available";
  const s = String(v).trim();
  if (!s || s === "UNKNOWN" || s === "null" || s === "undefined") return "Not available";
  return s;
}

export function moneyCents(v: unknown): string {
  if (v == null || v === "") return "Not available";
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "Not available";
  return `$${Math.round(n / 100).toLocaleString("en-US")}`;
}

function toMatchInput(p: Record<string, unknown>): MatchProperty {
  return {
    city: String(p.city || ""),
    county: String(p.county || ""),
    zip: String(p.zip || ""),
    state: String(p.state || "CA"),
    assessedCents: p.assessed_cents == null || p.assessed_cents === "" ? null : Number(p.assessed_cents),
    askingCents: p.asking_cents == null || p.asking_cents === "" ? null : Number(p.asking_cents),
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

function urlsFromPayload(payload: Record<string, unknown>): string[] {
  const out: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === "string" && /^https:\/\//i.test(v) && /photo|image|img|jpg|jpeg|png|webp/i.test(v)) {
      out.push(v);
    } else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(visit);
  };
  visit(payload.photos ?? payload.photo ?? payload.images ?? payload.image);
  return [...new Set(out)].slice(0, 12);
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
const CONTACT_KEY_HINT =
  /^(email|e_?mail|phone|tel|telephone|mobile|cell|fax|contact|agent|broker|owner|seller|mailing|taxpayer)/i;

/** Owner/admin only — never invent contact data; never send to client portal. */
export type AdminPropertyContacts = {
  fullAddress: string;
  phones: string[];
  emails: string[];
  listingAgent: string;
  listingAgentPhone: string;
  listingAgentEmail: string;
  broker: string;
  ownerName: string;
  mailingAddress: string;
  otherContacts: string[];
};

export function extractAdminPropertyContacts(
  property: Record<string, unknown>,
  payload: Record<string, unknown> = {},
): AdminPropertyContacts {
  const phones = new Set<string>();
  const emails = new Set<string>();
  const other: string[] = [];

  const pushPhone = (raw: unknown) => {
    const s = String(raw || "").trim();
    if (!s) return;
    const matches = s.match(PHONE_RE) || (/\d{7,}/.test(s.replace(/\D/g, "")) ? [s] : []);
    for (const m of matches) {
      const digits = m.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) continue;
      phones.add(m.trim());
    }
  };
  const pushEmail = (raw: unknown) => {
    const s = String(raw || "").trim().toLowerCase();
    if (!s) return;
    const matches = s.match(EMAIL_RE) || (s.includes("@") ? [s] : []);
    for (const m of matches) emails.add(m.trim().toLowerCase());
  };

  const walk = (node: unknown, keyPath: string, depth: number) => {
    if (depth > 6 || node == null) return;
    if (typeof node === "string" || typeof node === "number") {
      const key = keyPath.split(".").pop() || "";
      if (CONTACT_KEY_HINT.test(key) || /email/i.test(key)) pushEmail(node);
      if (CONTACT_KEY_HINT.test(key) || /phone|tel|mobile|cell|fax/i.test(key)) pushPhone(node);
      if (CONTACT_KEY_HINT.test(key) && typeof node === "string" && node.trim() && !node.includes("@") && !PHONE_RE.test(node)) {
        const label = `${key}: ${node.trim()}`;
        if (!other.includes(label) && other.length < 12) other.push(label);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.slice(0, 40).forEach((v, i) => walk(v, `${keyPath}[${i}]`, depth + 1));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (/photo|image|geometry|shape|polygon|blob|html|css/i.test(k)) continue;
        walk(v, keyPath ? `${keyPath}.${k}` : k, depth + 1);
      }
    }
  };

  walk(payload, "", 0);
  try {
    const analysis =
      typeof property.analysis_json === "string"
        ? (JSON.parse(String(property.analysis_json || "{}")) as unknown)
        : property.analysis_json;
    if (analysis && typeof analysis === "object") walk(analysis, "analysis", 0);
  } catch {
    /* ignore */
  }

  const street = readableSitusAddress(String(property.address_raw || "")) || String(property.address_raw || "").trim();
  const addrParts = [street, property.city, property.state || "CA", property.zip]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  const fullAddress = addrParts.length ? addrParts.join(", ") : "Not available";

  return {
    fullAddress,
    phones: [...phones].slice(0, 8),
    emails: [...emails].slice(0, 8),
    listingAgent: na(payload.agent || payload.agent_name || payload.listing_agent || payload.broker),
    listingAgentPhone: na(payload.agent_phone || payload.listing_agent_phone || payload.agentPhone),
    listingAgentEmail: na(payload.agent_email || payload.listing_agent_email || payload.agentEmail),
    broker: na(payload.brokerage || payload.broker_name || payload.broker),
    ownerName: na(payload.owner_name || payload.owner || payload.taxpayer_name || payload.ownerName),
    mailingAddress: na(
      payload.mailing_address || payload.mail_address || payload.owner_mailing_address || payload.mailingAddress,
    ),
    otherContacts: other,
  };
}

async function loadMergedPayloads(q: Sql, propertyIds: string[]): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  const ids = [...new Set(propertyIds.map(String).filter(Boolean))].slice(0, 400);
  if (!ids.length) return map;
  // Per-id fetches stay compatible with sqlite / TCP wrappers (no array IN helper).
  const chunkSize = 20;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (id) => {
        const rows = (await q`
          SELECT payload_json FROM pi_property_sources WHERE property_id = ${id}
        `) as { payload_json: string }[];
        let merged: Record<string, unknown> = {};
        for (const row of rows) {
          try {
            merged = { ...merged, ...(JSON.parse(String(row.payload_json || "{}")) as Record<string, unknown>) };
          } catch {
            /* ignore malformed payload */
          }
        }
        if (Object.keys(merged).length) map.set(id, merged);
      }),
    );
  }
  return map;
}

function withAdminContacts(
  row: Record<string, unknown>,
  property: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const contacts = extractAdminPropertyContacts(property, payload);
  return {
    ...row,
    fullAddress: contacts.fullAddress,
    phones: contacts.phones.length ? contacts.phones : ["Not available"],
    emails: contacts.emails.length ? contacts.emails : ["Not available"],
    listingAgent: contacts.listingAgent,
    listingAgentPhone: contacts.listingAgentPhone,
    listingAgentEmail: contacts.listingAgentEmail,
    broker: contacts.broker,
    ownerName: contacts.ownerName,
    mailingAddress: contacts.mailingAddress,
    otherContacts: contacts.otherContacts,
    adminOnlyContacts: true,
  };
}

export async function buildPipelineCounts() {
  const empty = {
    scanned: 0,
    firstPassRejected: 0,
    deepResearchQualified: 0,
    qualified299: 0,
    offered: 0,
    paid: 0,
    released: 0,
    buyBoxes: 0,
    clients: 0,
    outreachSent: 0,
    duplicateQualifiedRows: 0,
  };
  const q = await db();
  if (!q) return empty;

  const scanned = (await q`SELECT COUNT(DISTINCT canonical_key) AS n FROM pi_properties`) as { n: number }[];
  const deep = (await q`SELECT COUNT(DISTINCT property_id) AS n FROM pi_research_packages WHERE quality_ok = 1`) as { n: number }[];
  const first = (await q`
    SELECT COUNT(DISTINCT p.canonical_key) AS n
    FROM pi_properties p
    WHERE p.id NOT IN (SELECT property_id FROM pi_research_packages WHERE quality_ok = 1)
  `) as { n: number }[];
  const qualified = (await q`
    SELECT COUNT(DISTINCT property_id) AS n
    FROM pi_opportunities
    WHERE quality_ok = 1 AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
  `) as { n: number }[];
  const qualifiedRows = (await q`
    SELECT COUNT(*) AS n
    FROM pi_opportunities
    WHERE quality_ok = 1 AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
  `) as { n: number }[];
  const paid = (await q`
    SELECT COUNT(DISTINCT property_id) AS n FROM pi_opportunities WHERE status IN ('PAID','UNLOCKED','DISCLOSED')
  `) as { n: number }[];
  const released = (await q`
    SELECT COUNT(DISTINCT property_id) AS n FROM pi_opportunities WHERE status IN ('UNLOCKED','DISCLOSED')
  `) as { n: number }[];
  const boxes = (await q`SELECT COUNT(*) AS n FROM pi_client_buy_boxes WHERE paused = 0`) as { n: number }[];
  const clients = (await q`SELECT COUNT(*) AS n FROM pi_clients`) as { n: number }[];
  const outreach = (await q`SELECT COUNT(*) AS n FROM pi_outreach WHERE status = 'sent'`) as { n: number }[];

  const qDistinct = Number(qualified[0]?.n || 0);
  const qRows = Number(qualifiedRows[0]?.n || 0);

  return {
    scanned: Number(scanned[0]?.n || 0),
    firstPassRejected: Number(first[0]?.n || 0),
    deepResearchQualified: Number(deep[0]?.n || 0),
    qualified299: qDistinct,
    offered: qDistinct,
    paid: Number(paid[0]?.n || 0),
    released: Number(released[0]?.n || 0),
    buyBoxes: Number(boxes[0]?.n || 0),
    clients: Number(clients[0]?.n || 0),
    outreachSent: Number(outreach[0]?.n || 0),
    duplicateQualifiedRows: Math.max(0, qRows - qDistinct),
  };
}

export async function listPipelineStage(stage: PipelineStage, limit = 200, offset = 0) {
  const q = await db();
  if (!q) return { stage, total: 0, rows: [] as Record<string, unknown>[] };
  const lim = Math.min(400, Math.max(1, limit));
  const off = Math.max(0, offset);

  if (stage === "scanned") {
    const total = (await q`SELECT COUNT(DISTINCT canonical_key) AS n FROM pi_properties`) as { n: number }[];
    const rows = (await q`
      SELECT p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
        p.property_type, p.asking_cents, p.assessed_cents, p.tax_delinquent, p.deal_score, p.data_confidence,
        p.opportunity_score, p.research_status, p.rejected, p.reject_reason, p.retrieved_at, p.updated_at,
        p.last_scanned, p.last_verified, p.score_why
      FROM pi_properties p
      INNER JOIN (
        SELECT canonical_key, MAX(updated_at) AS u FROM pi_properties GROUP BY canonical_key
      ) latest ON latest.canonical_key = p.canonical_key AND latest.u = p.updated_at
      ORDER BY p.updated_at DESC
      LIMIT ${lim} OFFSET ${off}
    `) as Record<string, unknown>[];
    return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
  }

  if (stage === "first_pass_rejected") {
    const total = (await q`
      SELECT COUNT(DISTINCT p.canonical_key) AS n FROM pi_properties p
      WHERE p.id NOT IN (SELECT property_id FROM pi_research_packages WHERE quality_ok = 1)
    `) as { n: number }[];
    const rows = (await q`
      SELECT p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
        p.property_type, p.asking_cents, p.assessed_cents, p.tax_delinquent, p.deal_score, p.data_confidence,
        p.opportunity_score, p.research_status, p.rejected, p.reject_reason, p.retrieved_at, p.updated_at,
        p.last_scanned, p.last_verified, p.score_why,
        r.reason AS latest_reject_reason, r.detail AS latest_reject_detail
      FROM pi_properties p
      LEFT JOIN LATERAL (
        SELECT reason, detail FROM pi_rejections WHERE property_id = p.id ORDER BY created_at DESC LIMIT 1
      ) r ON TRUE
      WHERE p.id NOT IN (SELECT property_id FROM pi_research_packages WHERE quality_ok = 1)
      ORDER BY p.updated_at DESC
      LIMIT ${lim} OFFSET ${off}
    `) as Record<string, unknown>[];
    return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
  }

  if (stage === "deep_research") {
    const total = (await q`SELECT COUNT(DISTINCT property_id) AS n FROM pi_research_packages WHERE quality_ok = 1`) as { n: number }[];
    const rows = (await q`
      SELECT p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
        p.property_type, p.asking_cents, p.assessed_cents, p.tax_delinquent, p.deal_score, p.data_confidence,
        p.opportunity_score, p.research_status, p.rejected, p.reject_reason, p.retrieved_at, p.updated_at,
        p.last_scanned, p.last_verified, p.score_why,
        pkg.opportunity_score AS pkg_score, pkg.data_confidence AS pkg_confidence, pkg.status AS pkg_status
      FROM pi_research_packages pkg
      JOIN pi_properties p ON p.id = pkg.property_id
      WHERE pkg.quality_ok = 1
      ORDER BY pkg.updated_at DESC
      LIMIT ${lim} OFFSET ${off}
    `) as Record<string, unknown>[];
    return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
  }

  if (stage === "qualified" || stage === "offered") {
    const total = (await q`
      SELECT COUNT(DISTINCT property_id) AS n FROM pi_opportunities
      WHERE quality_ok = 1 AND status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
    `) as { n: number }[];
    const rows = (await q`
      SELECT DISTINCT ON (o.property_id)
        p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
        p.property_type, p.asking_cents, p.assessed_cents, p.tax_delinquent, p.deal_score, p.data_confidence,
        p.opportunity_score, p.research_status, p.rejected, p.reject_reason, p.retrieved_at, p.updated_at,
        p.last_scanned, p.last_verified, p.score_why,
        o.id AS opportunity_id, o.status AS opportunity_status, o.match_score, o.match_why,
        o.buy_box_id, o.client_user_id, o.created_at AS offered_at
      FROM pi_opportunities o
      JOIN pi_properties p ON p.id = o.property_id
      WHERE o.quality_ok = 1 AND o.status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
      ORDER BY o.property_id, o.updated_at DESC
      LIMIT ${lim} OFFSET ${off}
    `) as Record<string, unknown>[];
    return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
  }

  if (stage === "paid") {
    const total = (await q`
      SELECT COUNT(DISTINCT property_id) AS n FROM pi_opportunities WHERE status IN ('PAID','UNLOCKED','DISCLOSED')
    `) as { n: number }[];
    const rows = (await q`
      SELECT DISTINCT ON (o.property_id)
        p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
        p.property_type, p.asking_cents, p.assessed_cents, p.tax_delinquent, p.deal_score, p.data_confidence,
        o.id AS opportunity_id, o.status AS opportunity_status, o.unlocked_at
      FROM pi_opportunities o
      JOIN pi_properties p ON p.id = o.property_id
      WHERE o.status IN ('PAID','UNLOCKED','DISCLOSED')
      ORDER BY o.property_id, o.updated_at DESC
      LIMIT ${lim} OFFSET ${off}
    `) as Record<string, unknown>[];
    return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
  }

  const total = (await q`
    SELECT COUNT(DISTINCT property_id) AS n FROM pi_opportunities WHERE status IN ('UNLOCKED','DISCLOSED')
  `) as { n: number }[];
  const rows = (await q`
    SELECT DISTINCT ON (o.property_id)
      p.id, p.canonical_key, p.apn, p.address_raw, p.city, p.county, p.zip, p.state,
      p.property_type, o.id AS opportunity_id, o.status AS opportunity_status, o.disclosed_at
    FROM pi_opportunities o
    JOIN pi_properties p ON p.id = o.property_id
    WHERE o.status IN ('UNLOCKED','DISCLOSED')
    ORDER BY o.property_id, o.updated_at DESC
    LIMIT ${lim} OFFSET ${off}
  `) as Record<string, unknown>[];
  return { stage, total: Number(total[0]?.n || 0), rows: compactRows(rows) };
}

function compactRows(rows: Record<string, unknown>[]) {
  return rows.map((p) => {
    const raw = na(p.address_raw);
    const street = readableSitusAddress(String(p.address_raw || "")) || raw;
    return {
    id: String(p.id),
    canonicalKey: na(p.canonical_key),
    address: street,
    addressRaw: raw,
    city: na(p.city),
    county: na(p.county),
    zip: na(p.zip),
    propertyType: na(p.property_type),
    asking: moneyCents(p.asking_cents),
    assessed: moneyCents(p.assessed_cents),
    dealScore: p.deal_score == null ? "Not available" : Number(p.deal_score),
    dataConfidence: p.data_confidence == null ? "Not available" : Number(p.data_confidence),
    opportunityScore: p.opportunity_score == null || p.opportunity_score === "" ? "Not available" : Number(p.opportunity_score),
    rejectReason: na(p.latest_reject_reason || p.reject_reason),
    rejectDetail: na(p.latest_reject_detail),
    matchScore: p.match_score == null ? "Not available" : Number(p.match_score),
    matchWhy: na(p.match_why),
    opportunityStatus: na(p.opportunity_status),
    opportunityId: p.opportunity_id ? String(p.opportunity_id) : undefined,
    retrievedAt: na(p.retrieved_at),
    lastVerified: na(p.last_verified || p.last_scanned || p.updated_at),
    taxDelinquent: p.tax_delinquent == null || p.tax_delinquent === "" ? "Not available" : Number(p.tax_delinquent) ? "Yes" : "No / not indicated",
  };
  });
}

export async function getOwnerPropertyDetail(propertyId: string, focusBuyBoxId?: string) {
  await enforceOpportunityThesisOnLiveOffers();
  const q = await db();
  if (!q) return { error: "Database unavailable." };
  const props = (await q`SELECT * FROM pi_properties WHERE id = ${propertyId} LIMIT 1`) as Record<string, unknown>[];
  const p = props[0];
  if (!p) return { error: "Property not found." };

  const sources = (await q`
    SELECT source_slug, source_url, collected_at, payload_json FROM pi_property_sources WHERE property_id = ${propertyId}
  `) as Record<string, unknown>[];
  const pkg = ((await q`SELECT * FROM pi_research_packages WHERE property_id = ${propertyId} LIMIT 1`) as Record<string, unknown>[])[0];
  const opps = (await q`
    SELECT * FROM pi_opportunities WHERE property_id = ${propertyId} ORDER BY updated_at DESC
  `) as Record<string, unknown>[];
  const rejects = (await q`
    SELECT reason, detail, created_at FROM pi_rejections WHERE property_id = ${propertyId} ORDER BY created_at DESC LIMIT 8
  `) as Record<string, unknown>[];

  let payload: Record<string, unknown> = {};
  const photos: string[] = [];
  for (const s of sources) {
    try {
      const parsed = JSON.parse(String(s.payload_json || "{}")) as Record<string, unknown>;
      payload = { ...payload, ...parsed };
      photos.push(...urlsFromPayload(parsed));
    } catch {
      /* ignore malformed payload */
    }
  }

  const listingUrl = na(
    sources.find((s) => String(s.source_url || "").startsWith("http"))?.source_url || payload.listing_url || payload.url,
  );
  const listingId = na(payload.listing_id || payload.mls || payload.parcel_number || p.apn);

  const whyBlocks: Array<{
    buyBoxId: string;
    buyBoxName: string;
    clientUserId: string;
    matchScore: number;
    matchWhy: string;
    opportunityStatus: string;
    requirements: RequirementRow[];
    requirementMatchPct: number;
    overall: ReturnType<typeof matchBuyBox>;
    buyBox: BuyBox;
  }> = [];

  const input = toMatchInput(p);
  const seenBoxes = new Set<string>();
  const pushBox = (
    boxId: string,
    boxName: string,
    clientUserId: string,
    box: BuyBox,
    opportunityStatus: string,
    storedScore?: unknown,
    storedWhy?: unknown,
  ) => {
    if (!boxId || seenBoxes.has(boxId)) return;
    seenBoxes.add(boxId);
    const overall = matchBuyBox(box, input);
    const requirements = evaluateBuyBoxRequirements(box, input);
    whyBlocks.push({
      buyBoxId: boxId,
      buyBoxName: boxName,
      clientUserId,
      matchScore: Number(storedScore || overall.score),
      matchWhy: String(storedWhy || overall.why),
      opportunityStatus,
      requirements,
      requirementMatchPct: requirementMatchPercent(requirements),
      overall,
      buyBox: box,
    });
  };

  for (const o of opps) {
    const boxId = String(o.buy_box_id || "");
    let box: BuyBox = {};
    let boxName = "Unknown Buy Box";
    let clientUserId = String(o.client_user_id || "");
    if (boxId) {
      const br = (await q`SELECT * FROM pi_client_buy_boxes WHERE id = ${boxId} LIMIT 1`) as Record<string, unknown>[];
      if (br[0]) {
        boxName = String(br[0].name || boxName);
        clientUserId = String(br[0].user_id || clientUserId);
        try {
          box = JSON.parse(String(br[0].criteria_json || "{}")) as BuyBox;
        } catch {
          box = {};
        }
      }
    }
    pushBox(boxId || "Not available", boxName, clientUserId, box, String(o.status), o.match_score, o.match_why);
  }

  const libraryBoxes = (await q`SELECT * FROM pi_client_buy_boxes`) as Record<string, unknown>[];
  for (const br of libraryBoxes) {
    const boxId = String(br.id);
    if (seenBoxes.has(boxId)) continue;
    let box: BuyBox = {};
    try {
      box = JSON.parse(String(br.criteria_json || "{}")) as BuyBox;
    } catch {
      box = {};
    }
    const overall = matchBuyBox(box, input);
    const include = (focusBuyBoxId && boxId === focusBuyBoxId) || overall.ok;
    if (!include) continue;
    pushBox(boxId, String(br.name || "Buy Box"), String(br.user_id || ""), box, "library-match");
  }

  if (focusBuyBoxId) {
    whyBlocks.sort((a, b) => (a.buyBoxId === focusBuyBoxId ? -1 : b.buyBoxId === focusBuyBoxId ? 1 : 0));
  }

  const warnings: string[] = [];
  if (!sources.length) warnings.push("No retained source row — cannot independently follow a listing URL.");
  if (na(p.apn) === "Not available") warnings.push("APN not available.");
  if (na(p.address_raw) === "Not available") warnings.push("Street address not available.");
  if (Number(p.data_confidence || 0) < MIN_OFFER_CONFIDENCE) {
    warnings.push(`Data confidence ${p.data_confidence} is below the ${MIN_OFFER_CONFIDENCE} offer threshold.`);
  }
  for (const w of whyBlocks) {
    if (w.matchScore < MIN_OFFER_MATCH_SCORE) {
      warnings.push(`Match score ${w.matchScore} is below the ${MIN_OFFER_MATCH_SCORE} offer threshold for ${w.buyBoxName}.`);
    }
    if (w.requirements.some((r) => r.status === "fail")) warnings.push(`${w.buyBoxName} has failed Buy Box requirement(s).`);
    if (w.requirements.some((r) => r.status === "unknown")) {
      warnings.push(`${w.buyBoxName} has unknown facts for one or more requirements.`);
    }
  }

  const qualifiedOpp = opps.find(
    (o) =>
      Number(o.quality_ok) === 1 &&
      ["PREVIEW_AVAILABLE", "AGREEMENT_ACCEPTED", "PAYMENT_REQUIRED"].includes(String(o.status)),
  );

  const contacts = extractAdminPropertyContacts(p, payload);
  const deal = extractDealEvidence(p, payload);
  const sourceSlugs = sources.map((s) => String(s.source_slug || "")).filter(Boolean);
  const focusBlock = whyBlocks[0];
  const opportunityThesis = focusBlock
    ? evaluateOpportunityThesis({
        box: focusBlock.buyBox,
        taxDelinquent: Boolean(Number(p.tax_delinquent)),
        foreclosure: Boolean(Number(p.foreclosure)),
        auction: Boolean(Number(p.auction)),
        vacant: Boolean(Number(p.vacant)),
        absentee: Boolean(Number(p.absentee)),
        askingCents: p.asking_cents == null || p.asking_cents === "" ? null : Number(p.asking_cents),
        assessedCents: p.assessed_cents == null || p.assessed_cents === "" ? null : Number(p.assessed_cents),
        daysOnMarket: p.days_on_market == null || p.days_on_market === "" ? null : Number(p.days_on_market),
        payload,
        sourceSlugs,
        matchWhy: focusBlock.matchWhy,
      })
    : null;
  if (opportunityThesis && !opportunityThesis.offerable) {
    warnings.push("NO WORTHWHILE OPPORTUNITY THESIS — this parcel must not be in the $299 client pipeline.");
  }

  return {
    ownerAudit: true,
    dealEvidence: deal,
    opportunityThesis,
    /** Admin/owner audit only — never included in client portal payloads. */
    contacts: {
      adminOnly: true,
      fullAddress: contacts.fullAddress,
      phones: contacts.phones.length ? contacts.phones : ["Not available"],
      emails: contacts.emails.length ? contacts.emails : ["Not available"],
      listingAgent: contacts.listingAgent,
      listingAgentPhone: contacts.listingAgentPhone,
      listingAgentEmail: contacts.listingAgentEmail,
      broker: contacts.broker,
      ownerName: contacts.ownerName,
      mailingAddress: contacts.mailingAddress,
      otherContacts: contacts.otherContacts.length ? contacts.otherContacts : ["Not available"],
      note: "Shown only on the owner Property Intelligence site. Clients never receive this block from Buy Box or locked previews.",
    },
    identity: {
      propertyId: String(p.id),
      canonicalKey: na(p.canonical_key),
      address: readableSitusAddress(String(p.address_raw || "")) || na(p.address_raw),
      addressRaw: na(p.address_raw),
      city: na(p.city),
      state: na(p.state),
      zip: na(p.zip),
      county: na(p.county),
      listingUrl,
      sourceWebsite: sources.map((s) => na(s.source_slug)).filter((s) => s !== "Not available"),
      listingId,
      apn: na(p.apn),
      dateDiscovered: na(p.first_seen || p.retrieved_at),
      lastVerified: na(p.last_verified || p.last_scanned || p.updated_at),
    },
    facts: {
      propertyType: na(p.property_type),
      askingPrice: moneyCents(p.asking_cents),
      assessedValue: moneyCents(p.assessed_cents),
      estimatedMarket: moneyCents(p.est_market_cents),
      bedrooms: na(p.beds),
      bathrooms: na(p.baths),
      squareFootage: na(p.sqft),
      lotSize: na(payload.lot_size || payload.lot_area || payload.lot_sqft),
      yearBuilt: na(p.year_built),
      daysOnMarket: na(p.days_on_market),
      listingStatus: na(payload.status || payload.listing_status || p.research_status),
      listingAgent: contacts.listingAgent,
      listingAgentPhone: contacts.listingAgentPhone,
      listingAgentEmail: contacts.listingAgentEmail,
      broker: contacts.broker,
      ownerName: contacts.ownerName,
      mailingAddress: contacts.mailingAddress,
      phones: contacts.phones.length ? contacts.phones : ["Not available"],
      emails: contacts.emails.length ? contacts.emails : ["Not available"],
      photos: photos.length ? photos : [],
      photosNote: photos.length ? undefined : "Not available",
      priceHistory: na(payload.price_history),
      taxInformation: Number(p.tax_delinquent)
        ? "Tax-delinquent indicator present (public/source-reported). Not a title search."
        : "Not available",
      taxDelinquent: Number(p.tax_delinquent) ? "Yes" : "No / not indicated",
      foreclosure: Number(p.foreclosure) ? "Yes" : "No / not indicated",
      auction: Number(p.auction) ? "Yes" : "No / not indicated",
      vacant: Number(p.vacant) ? "Yes" : "No / not indicated",
      absentee: Number(p.absentee) ? "Yes" : "No / not indicated",
      zoning: na(p.zoning),
      units: na(p.units),
    },
    pipeline: {
      researchStatus: na(p.research_status),
      packageStatus: na(pkg?.status),
      packageQualityOk: pkg ? Number(pkg.quality_ok) === 1 : false,
      opportunityStatuses: opps.map((o) => String(o.status)),
      currentlyQualified299: Boolean(qualifiedOpp),
    },
    whyAmberQualified: {
      foundAt: na(p.first_seen || p.retrieved_at),
      lastVerified: na(p.last_verified || p.last_scanned || p.updated_at),
      sourcesChecked: sources.map((s) => ({
        slug: na(s.source_slug),
        url: na(s.source_url),
        collectedAt: na(s.collected_at),
      })),
      highConfidenceScore: pkg ? Number(pkg.data_confidence) : Number(p.data_confidence || 0),
      opportunityScore: pkg ? Number(pkg.opportunity_score) : Number(p.opportunity_score || p.deal_score || 0),
      scoreWhy: na(p.score_why),
      buyBoxes: whyBlocks.map(({ buyBox: _omit, ...rest }) => rest),
      client: whyBlocks[0]
        ? { userId: whyBlocks[0].clientUserId, buyBoxId: whyBlocks[0].buyBoxId, buyBoxName: whyBlocks[0].buyBoxName }
        : { userId: "Not available", buyBoxId: "Not available", buyBoxName: "Not available" },
      belief: qualifiedOpp
        ? opportunityThesis?.offerable
          ? opportunityThesis.owner.plainEnglish
          : "This property is currently flagged $299 but has no worthwhile opportunity thesis — it should be demoted."
        : opportunityThesis?.rejectReason || "This property is not currently a qualified $299 opportunity.",
      warnings,
      rejections: rejects.map((r) => ({
        reason: na(r.reason),
        detail: na(r.detail),
        at: na(r.created_at),
      })),
    },
  };
}

export async function verifyQualifiedOpportunities() {
  const q = await db();
  const counts = await buildPipelineCounts();
  if (!q) {
    return {
      counts,
      unique: false,
      uniquePropertyIds: 0,
      opportunityRows: 0,
      properties: [] as unknown[],
      notes: ["Database unavailable — cannot verify."],
      buyBoxesVsClients: { buyBoxes: 0, clients: 0, legitimate: false, why: "no db" },
      outreach: { sent: 0, why: "no db" },
    };
  }

  const opps = (await q`
    SELECT o.*, p.canonical_key, p.address_raw, p.city, p.county, p.zip, p.apn, p.property_type,
      p.asking_cents, p.assessed_cents, p.beds, p.baths, p.sqft, p.tax_delinquent, p.foreclosure,
      p.auction, p.vacant, p.absentee, p.data_confidence, p.opportunity_score, p.state
    FROM pi_opportunities o
    JOIN pi_properties p ON p.id = o.property_id
    WHERE o.quality_ok = 1 AND o.status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
    ORDER BY o.created_at
  `) as Record<string, unknown>[];

  const byProperty = new Map<string, Record<string, unknown>[]>();
  for (const o of opps) {
    const pid = String(o.property_id);
    const list = byProperty.get(pid) || [];
    list.push(o);
    byProperty.set(pid, list);
  }

  const properties = [];
  for (const [propertyId, rows] of byProperty) {
    const o = rows[0];
    let box: BuyBox = {};
    let boxName = "Not available";
    const boxId = String(o.buy_box_id || "");
    if (boxId) {
      const br = (await q`SELECT name, criteria_json FROM pi_client_buy_boxes WHERE id = ${boxId} LIMIT 1`) as Record<
        string,
        unknown
      >[];
      if (br[0]) {
        boxName = String(br[0].name || boxName);
        try {
          box = JSON.parse(String(br[0].criteria_json || "{}")) as BuyBox;
        } catch {
          box = {};
        }
      }
    }
    const input = toMatchInput(o);
    const reqs = evaluateBuyBoxRequirements(box, input);
    const overall = matchBuyBox(box, input);
    const fails = reqs.filter((r) => r.status === "fail");
    properties.push({
      propertyId,
      canonicalKey: na(o.canonical_key),
      address: na(o.address_raw),
      city: na(o.city),
      county: na(o.county),
      zip: na(o.zip),
      opportunityCount: rows.length,
      buyBoxName: boxName,
      matchScore: Number(o.match_score || 0),
      dataConfidence: Number(o.data_confidence || 0),
      requirementFails: fails.map((f) => f.requirement),
      meetsClientRequirements: fails.length === 0 && overall.ok && Number(o.match_score || 0) >= MIN_OFFER_MATCH_SCORE,
      overallWhy: overall.why,
    });
  }

  const dup = detectDuplicateProperties(
    [...byProperty.values()].map((rows) => ({
      propertyId: String(rows[0].property_id),
      canonicalKey: String(rows[0].canonical_key || ""),
      apn: String(rows[0].apn || ""),
      county: String(rows[0].county || ""),
    })),
  );

  const notes: string[] = [];
  if (opps.length !== byProperty.size) {
    notes.push(
      `Opportunity rows (${opps.length}) exceed unique property_id (${byProperty.size}). Extra rows are the same property offered more than once (e.g. multiple Buy Boxes), not extra buildings.`,
    );
  }
  if (dup.apnCollisions.length) {
    notes.push(`${dup.apnCollisions.length} APN cluster(s) map to more than one property_id — possible unmerged duplicates.`);
  }
  if (dup.canonicalCollisions.length) {
    notes.push(`canonical_key collision across property ids: ${dup.canonicalCollisions.length}.`);
  }

  const boxes = Number(counts.buyBoxes);
  const clientsN = Number(counts.clients);
  notes.push(
    boxes > clientsN
      ? `${boxes} active Buy Boxes belong to ${clientsN} client(s). Multiple requirement sets per client is allowed (Client & Buy Box Library).`
      : `${boxes} Buy Box(es) and ${clientsN} client(s).`,
  );

  const outreachWhy = SELLER_SOLICITATION_ENABLED
    ? "Seller solicitation is enabled in constants; check pause_outreach and pi_outreach.status."
    : "Outreach is 0 because Version 1 does not autonomously solicit sellers (SELLER_SOLICITATION_ENABLED=false). $299 unlocks are client-initiated, not outbound investor emails.";

  return {
    counts,
    unique: byProperty.size === properties.length && dup.apnCollisions.length === 0 && dup.canonicalCollisions.length === 0,
    uniquePropertyIds: byProperty.size,
    opportunityRows: opps.length,
    properties,
    notes,
    buyBoxesVsClients: {
      buyBoxes: boxes,
      clients: clientsN,
      legitimate: boxes >= 1 && clientsN >= 1 && boxes >= clientsN,
      why: "pi_clients is one row per signed-in library owner (UNIQUE user_id). pi_client_buy_boxes allows many saved requirement sets per owner.",
    },
    outreach: { sent: counts.outreachSent, why: outreachWhy },
  };
}

const FINAL_STATUSES = ["PREVIEW_AVAILABLE", "AGREEMENT_ACCEPTED", "PAYMENT_REQUIRED"];

function matchRow(p: Record<string, unknown>, extra: Record<string, unknown>) {
  return {
    ...compactRows([p])[0],
    ...extra,
  };
}

export async function getOwnerBuyBoxDetail(buyBoxId: string) {
  await enforceOpportunityThesisOnLiveOffers();
  const q = await db();
  if (!q) return { error: "Database unavailable." };
  const merged = { merged: 0 };
  const boxes = (await q`
    SELECT b.*, c.id AS pi_client_id, c.name AS client_name, c.email AS client_email, u.email AS user_email, u.name AS user_name
    FROM pi_client_buy_boxes b
    LEFT JOIN pi_clients c ON c.user_id = b.user_id
    LEFT JOIN users u ON u.id = b.user_id
    WHERE b.id = ${buyBoxId}
    LIMIT 1
  `) as Record<string, unknown>[];
  const b = boxes[0];
  if (!b) {
    return {
      error: "Buy Box not found. Identical duplicate copies were merged into the original requirement set — reopen Client & Buy Box Library.",
      merged: merged.merged,
    };
  }

  let box: BuyBox = {};
  try {
    box = JSON.parse(String(b.criteria_json || "{}")) as BuyBox;
  } catch {
    box = {};
  }
  const reqDisplay = describeBuyBoxRequirements(box);
  const counties = (box.targetCounties || []).map((c) => c.toLowerCase().trim()).filter(Boolean);
  const county = counties[0] || "";

  const extrasFor = (p: Record<string, unknown>) => {
    const input = toMatchInput(p);
    const overall = matchBuyBox(box, input);
    const requirements = evaluateBuyBoxRequirements(box, input);
    const thesis = evaluateOpportunityThesis({
      box,
      taxDelinquent: input.taxDelinquent,
      foreclosure: input.foreclosure,
      auction: input.auction,
      vacant: input.vacant,
      absentee: input.absentee,
      askingCents: input.askingCents,
      assessedCents: input.assessedCents,
      matchWhy: overall.why,
    });
    return {
      overall,
      extra: {
        matchScore: Number(p.match_score || overall.score),
        matchWhy: na(p.match_why || overall.why),
        requirementMatchPct: requirementMatchPercent(requirements),
        opportunityStatus: na(p.opportunity_status),
        passCount: requirements.filter((r) => r.status === "pass").length,
        failCount: requirements.filter((r) => r.status === "fail").length,
        unknownCount: requirements.filter((r) => r.status === "unknown").length,
        thesisOfferable: thesis.offerable,
        thesisReject: thesis.rejectReason || "Verified opportunity thesis present.",
      },
    };
  };

  const qualifiedProps: Array<{ prop: Record<string, unknown>; extra: Record<string, unknown> }> = [];
  const deepProps: Array<{ prop: Record<string, unknown>; extra: Record<string, unknown> }> = [];
  const rejectedProps: Array<{ prop: Record<string, unknown>; extra: Record<string, unknown> }> = [];

  const qualDb = (await q`
    SELECT p.*, o.match_score, o.match_why, o.status AS opportunity_status, o.quality_ok AS opp_quality
    FROM pi_opportunities o
    JOIN pi_properties p ON p.id = o.property_id
    WHERE o.buy_box_id = ${String(b.id)}
      AND o.quality_ok = 1
      AND o.status IN ('PREVIEW_AVAILABLE','AGREEMENT_ACCEPTED','PAYMENT_REQUIRED')
  `) as Record<string, unknown>[];
  for (const p of qualDb) {
    const { overall, extra } = extrasFor(p);
    if (overall.ok && Number(extra.matchScore) >= MIN_OFFER_MATCH_SCORE && extra.thesisOfferable) {
      qualifiedProps.push({ prop: p, extra });
    }
  }
  const skip = new Set(qualifiedProps.map((r) => String(r.prop.id)));

  const deepDb = (
    county
      ? await q`
          SELECT p.*, pkg.quality_ok AS pkg_ok
          FROM pi_properties p
          JOIN pi_research_packages pkg ON pkg.property_id = p.id
          WHERE pkg.quality_ok = 1 AND p.state = 'CA' AND lower(trim(p.county)) = ${county}
        `
      : await q`
          SELECT p.*, pkg.quality_ok AS pkg_ok
          FROM pi_properties p
          JOIN pi_research_packages pkg ON pkg.property_id = p.id
          WHERE pkg.quality_ok = 1 AND p.state = 'CA'
        `
  ) as Record<string, unknown>[];
  for (const p of deepDb) {
    const id = String(p.id);
    if (skip.has(id)) continue;
    const { overall, extra } = extrasFor(p);
    if (!overall.ok) continue;
    skip.add(id);
    deepProps.push({
      prop: p,
      extra: {
        ...extra,
        bucketReason: extra.thesisOfferable
          ? "Deep-research package exists and matches this Buy Box, but it is not a $299 offer yet."
          : "Rejected from $299 — no worthwhile opportunity thesis. Buy Box / geography / property-type match is not enough.",
      },
    });
  }

  const geoRows = (
    county
      ? await q`SELECT * FROM pi_properties p WHERE p.state = 'CA' AND lower(trim(p.county)) = ${county}`
      : await q`SELECT * FROM pi_properties p WHERE p.state = 'CA'`
  ) as Record<string, unknown>[];
  let rejectedCount = 0;
  for (const p of geoRows) {
    if (skip.has(String(p.id))) continue;
    rejectedCount += 1;
    if (rejectedProps.length >= 200) continue;
    const { overall, extra } = extrasFor(p);
    rejectedProps.push({
      prop: p,
      extra: {
        ...extra,
        rejectReason: na(p.reject_reason || overall.why),
        bucketReason: overall.ok
          ? "Matched geography but did not pass the $299 research quality gate."
          : overall.why,
      },
    });
  }

  const contactIds = [
    ...qualifiedProps.map((r) => String(r.prop.id)),
    ...deepProps.slice(0, 200).map((r) => String(r.prop.id)),
    ...rejectedProps.slice(0, 80).map((r) => String(r.prop.id)),
  ];
  const payloads = await loadMergedPayloads(q, contactIds);

  const toAdminRow = (item: { prop: Record<string, unknown>; extra: Record<string, unknown> }) =>
    withAdminContacts(matchRow(item.prop, item.extra), item.prop, payloads.get(String(item.prop.id)) || {});

  const qualified = qualifiedProps.map(toAdminRow);
  const deep = deepProps.slice(0, 200).map(toAdminRow);
  const rejected = rejectedProps.map(toAdminRow);

  const clientEmail = na(b.client_email) !== "Not available" ? na(b.client_email) : na(b.user_email);
  const clientName =
    na(b.client_name) !== "Not available"
      ? na(b.client_name)
      : na(b.user_name) !== "Not available"
        ? na(b.user_name)
        : String(b.user_id).slice(0, 8) + "…";

  return {
    ownerAudit: true,
    adminOnlyIdentifying: true,
    mergedDuplicates: merged.merged,
    buyBox: {
      id: String(b.id),
      name: na(b.name),
      status: Number(b.paused) ? "paused" : "active",
      clientUserId: String(b.user_id),
      clientId: na(b.pi_client_id),
      clientName,
      clientEmail,
      createdAt: na(b.created_at),
      updatedAt: na(b.updated_at),
      requirements: reqDisplay,
    },
    matched: {
      qualified: { count: qualified.length, rows: qualified },
      deepResearch: { count: deep.length, rows: deep },
      rejected: { count: rejectedCount, rows: rejected },
    },
  };
}

