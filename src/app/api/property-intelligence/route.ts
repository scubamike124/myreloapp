import { NextResponse } from "next/server";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { requireAdminAccess } from "@/lib/roles";
import { evaluateAction } from "@/lib/property-intelligence/compliance";
import {
  buildDashboard,
  patchConfig,
  recordIntroduction,
  runMatching,
  saveBuyBox,
  seedConfigAndSources,
  setSourceActive,
  suppressEmail,
} from "@/lib/property-intelligence/persist";
import { runPropertyIntelligenceTick } from "@/lib/property-intelligence/tick";
import { adminCommerceKpis, collapseDuplicateClientBuyBoxes, runOpportunityPipeline } from "@/lib/property-intelligence/opportunity";
import { stripeSecretMode } from "@/lib/stripe/client";
import {
  PIPELINE_STAGES,
  buildPipelineCounts,
  getOwnerBuyBoxDetail,
  getOwnerPropertyDetail,
  listPipelineStage,
  verifyQualifiedOpportunities,
  type PipelineStage,
} from "@/lib/property-intelligence/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerAuditDenied() {
  return NextResponse.json(
    { error: "Identifying property records are limited to the owner/admin audit view." },
    { status: 403 },
  );
}

async function dashboardFor(userId: string, owner: boolean) {
    await collapseDuplicateClientBuyBoxes();
    const dash = await buildDashboard(userId);
  const commerce = await adminCommerceKpis(userId);
  const pipeline = await buildPipelineCounts();
  return {
    ...dash,
    kpis: {
      ...dash.kpis,
      ...commerce,
      propertiesScannedLifetime: pipeline.scanned,
      firstPassRejected: pipeline.firstPassRejected,
      deepResearchQualified: pipeline.deepResearchQualified,
      qualifiedOpportunities: pipeline.qualified299,
      outreachSent: pipeline.outreachSent,
      totalClients: pipeline.clients,
      clientLibraryBuyBoxes: pipeline.buyBoxes,
      activeBuyBoxes: pipeline.buyBoxes,
    },
    auditPipeline: pipeline,
    ownerAudit: owner,
    stripeMode: stripeSecretMode(),
  };
}

async function userOr401() {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return {
      user: null as null,
      res: NextResponse.json(
        { error: access.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: access.status },
      ),
    };
  }
  if (access.user) return { user: access.user, res: null };
  // Admin-password break-glass: resolve configured owner row for PI workspace.
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return { user: null, res: NextResponse.json({ error: "Accounts unavailable." }, { status: 503 }) };
  }
  const ownerEmail = (process.env.OWNER_EMAIL || "scubamike124@gmail.com").trim().toLowerCase();
  const rows = (await q`
    SELECT id, email, name, COALESCE(role, 'USER') AS role
    FROM users WHERE lower(email) = ${ownerEmail} LIMIT 1
  `) as { id: string; email: string; name: string | null; role: string }[];
  if (!rows[0]) {
    return { user: null, res: NextResponse.json({ error: "Owner account not found." }, { status: 403 }) };
  }
  return {
    user: {
      id: rows[0].id,
      email: rows[0].email,
      name: rows[0].name,
      role: rows[0].role === "OWNER" || rows[0].role === "ADMIN" ? rows[0].role : "OWNER",
    },
    res: null,
  };
}

export async function GET(req: Request) {
  const { user, res } = await userOr401();
  if (!user) return res;
  await seedConfigAndSources(user.id);
  const owner = user.role === "OWNER";
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "";

  if (view === "audit-list") {
    if (!owner) return ownerAuditDenied();
    const stage = url.searchParams.get("stage") as PipelineStage;
    if (!PIPELINE_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Unknown pipeline stage." }, { status: 400 });
    }
    const limit = Number(url.searchParams.get("limit") || 200);
    const offset = Number(url.searchParams.get("offset") || 0);
    const list = await listPipelineStage(stage, limit, offset);
    return NextResponse.json({ ok: true, ownerAudit: true, ...list });
  }

  if (view === "audit-property") {
    if (!owner) return ownerAuditDenied();
    const propertyId = String(url.searchParams.get("propertyId") || "").trim();
    if (!propertyId) return NextResponse.json({ error: "propertyId required." }, { status: 400 });
    const buyBoxId = String(url.searchParams.get("buyBoxId") || "").trim();
    const detail = await getOwnerPropertyDetail(propertyId, buyBoxId || undefined);
    if ("error" in detail && detail.error) {
      return NextResponse.json({ ok: false, ...detail }, { status: detail.error === "Property not found." ? 404 : 503 });
    }
    return NextResponse.json({ ok: true, ownerAudit: true, property: detail });
  }

  if (view === "audit-buy-box") {
    if (!owner) return ownerAuditDenied();
    const buyBoxId = String(url.searchParams.get("buyBoxId") || "").trim();
    if (!buyBoxId) return NextResponse.json({ error: "buyBoxId required." }, { status: 400 });
    const detail = await getOwnerBuyBoxDetail(buyBoxId);
    if ("error" in detail && detail.error) {
      return NextResponse.json({ ok: false, ...detail }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ownerAudit: true, buyBox: detail });
  }

  if (view === "audit-verify") {
    if (!owner) return ownerAuditDenied();
    const report = await verifyQualifiedOpportunities();
    return NextResponse.json({ ok: true, ownerAudit: true, report });
  }

  return NextResponse.json({ ok: true, dashboard: await dashboardFor(user.id, owner) });
}

export async function POST(req: Request) {
  const { user, res } = await userOr401();
  if (!user) return res;
  const owner = user.role === "OWNER";
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "evaluate") {
    return NextResponse.json({ ok: true, decision: evaluateAction(String(body.text || "")) });
  }

  if (action === "pause-all" || action === "resume-all") {
    await patchConfig(user.id, { pause_all: action === "pause-all" });
  } else if (action === "pause-property" || action === "resume-property") {
    await patchConfig(user.id, { pause_property_scanning: action === "pause-property" });
  } else if (action === "pause-investors" || action === "resume-investors") {
    await patchConfig(user.id, { pause_investor_discovery: action === "pause-investors" });
  } else if (action === "pause-outreach" || action === "resume-outreach") {
    await patchConfig(user.id, { pause_outreach: action === "pause-outreach" });
  } else if (action === "scan" || action === "tick") {
    await runPropertyIntelligenceTick(user.id);
  } else if (action === "match") {
    await runMatching(user.id);
    await runOpportunityPipeline(user.id);
  } else if (action === "save-buy-box") {
    await saveBuyBox(user.id, String(body.investorId || ""), (body.box || {}) as never);
  } else if (action === "introduce") {
    const gate = evaluateAction("introduce parties only — no negotiation");
    if (!gate.allow) return NextResponse.json({ error: gate.message, decision: gate }, { status: 403 });
    await recordIntroduction(user.id, String(body.investorId || ""), String(body.propertyId || ""), String(body.contact || ""));
  } else if (action === "opt-out") {
    await suppressEmail(user.id, String(body.email || ""));
  } else if (action === "disable-source" || action === "enable-source") {
    const r = await setSourceActive(user.id, String(body.slug || ""), action === "enable-source");
    if (!r.ok) return NextResponse.json({ error: r.error, dashboard: await dashboardFor(user.id, owner) }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, dashboard: await dashboardFor(user.id, owner) });
}
