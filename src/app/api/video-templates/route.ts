import { NextResponse } from "next/server";
import {
  buildTemplatePlan,
  getTemplate,
  listTemplates,
  recommendedTemplatesForBusiness,
  templateFilterOptions,
} from "@/lib/reelo-templates";
import { recommendForBusiness } from "@/lib/business-detect";

export const runtime = "nodejs";

/** GET /api/video-templates?industry=&goal=&platform=&style=&q=&id=&recommend=&analyze=1 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const id = (sp.get("id") || "").trim();
    if (id) {
      const t = getTemplate(id);
      if (!t) {
        return NextResponse.json({ ok: false, error: "TEMPLATE_NOT_FOUND", id }, { status: 404 });
      }
      return NextResponse.json({ ok: true, template: t, filters: templateFilterOptions() });
    }

    if (sp.get("analyze") === "1") {
      const rec = recommendForBusiness({
        businessName: sp.get("businessName") || undefined,
        productOrService: sp.get("product") || undefined,
        website: sp.get("website") || undefined,
        industryHint: sp.get("industry") || undefined,
        audienceHint: sp.get("audience") || undefined,
      });
      return NextResponse.json({ ok: true, ...rec, filters: templateFilterOptions() });
    }

    const recommend = (sp.get("recommend") || "").trim();
    if (recommend) {
      const ids = recommendedTemplatesForBusiness(recommend);
      const templates = ids.map((i) => getTemplate(i)).filter(Boolean);
      return NextResponse.json({ ok: true, recommendFor: recommend, templates, filters: templateFilterOptions() });
    }

    const templates = listTemplates({
      industry: sp.get("industry") || undefined,
      goal: sp.get("goal") || undefined,
      platform: sp.get("platform") || undefined,
      style: sp.get("style") || undefined,
      lengthSec: sp.get("length") ? Number(sp.get("length")) : undefined,
      q: sp.get("q") || undefined,
    });

    return NextResponse.json({
      ok: true,
      total: templates.length,
      templates,
      filters: templateFilterOptions(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to list templates" },
      { status: 500 },
    );
  }
}

/** POST /api/video-templates — directed plan, or { action: "analyze" } for BI */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      templateId?: string;
      businessName?: string;
      productOrService?: string;
      website?: string;
      logoUrl?: string;
      brandColors?: string[];
      cta?: string;
      audience?: string;
      language?: string;
      aspectRatio?: "9:16" | "16:9" | "1:1";
      lengthSec?: number;
      industry?: string;
      tone?: string;
      avatarIdOverride?: string | null;
    };

    if (body.action === "analyze") {
      const rec = recommendForBusiness({
        businessName: body.businessName,
        productOrService: body.productOrService,
        website: body.website,
        industryHint: body.industry,
        audienceHint: body.audience,
        ctaHint: body.cta,
        toneHint: body.tone,
      });
      return NextResponse.json({ ok: true, ...rec });
    }

    const templateId = (body.templateId || "").trim();
    if (!templateId) {
      return NextResponse.json({ ok: false, error: "templateId required" }, { status: 400 });
    }

    const plan = buildTemplatePlan(templateId, {
      businessName: body.businessName || "",
      productOrService: body.productOrService || "",
      website: body.website,
      logoUrl: body.logoUrl,
      brandColors: body.brandColors,
      cta: body.cta || "",
      audience: body.audience || "",
      language: body.language || "en",
      aspectRatio: body.aspectRatio,
      lengthSec: body.lengthSec,
      industry: body.industry,
      tone: body.tone,
      avatarIdOverride: body.avatarIdOverride,
    });

    return NextResponse.json({ ok: true, ...plan });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Plan failed";
    const status = msg.startsWith("BRIEF_") || msg.startsWith("TEMPLATE_") ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
