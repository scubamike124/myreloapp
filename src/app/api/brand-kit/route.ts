import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { store } from "@/lib/storage";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// A customer's brand kit: their colours, fonts and logo — plus optional
// workspace extras (voice, business info, products, etc.) in `extra` JSON.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY = 8 * 1024 * 1024;

const HEX = /^#[0-9a-f]{6}$/i;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

export type BrandExtra = {
  voice: string;
  businessInfo: string;
  products: string;
  services: string;
  contactInfo: string;
  disclaimers: string;
};

const BLANK_EXTRA: BrandExtra = {
  voice: "",
  businessInfo: "",
  products: "",
  services: "",
  contactInfo: "",
  disclaimers: "",
};

type Kit = {
  brandName: string;
  colors: string[];
  headingFont: string;
  bodyFont: string;
  logoUrl: string | null;
  extra: BrandExtra;
};

const BLANK: Kit = {
  brandName: "",
  colors: ["#ff3645", "#c4101c", "#0a0607", "#ffffff"],
  headingFont: "",
  bodyFont: "",
  logoUrl: null,
  extra: { ...BLANK_EXTRA },
};

function parseExtra(raw: unknown): BrandExtra {
  if (typeof raw !== "string" || !raw) return { ...BLANK_EXTRA };
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      voice: str(p.voice, 4000),
      businessInfo: str(p.businessInfo, 4000),
      products: str(p.products, 4000),
      services: str(p.services, 4000),
      contactInfo: str(p.contactInfo, 2000),
      disclaimers: str(p.disclaimers, 4000),
    };
  } catch {
    return { ...BLANK_EXTRA };
  }
}

function normalizeExtra(v: unknown): BrandExtra {
  if (!v || typeof v !== "object") return { ...BLANK_EXTRA };
  const p = v as Record<string, unknown>;
  return {
    voice: str(p.voice, 4000),
    businessInfo: str(p.businessInfo, 4000),
    products: str(p.products, 4000),
    services: str(p.services, 4000),
    contactInfo: str(p.contactInfo, 2000),
    disclaimers: str(p.disclaimers, 4000),
  };
}

function rowToKit(row: {
  brandName: string | null;
  colors: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  logoUrl: string | null;
  extra?: string | null;
}): Kit {
  let colors: string[] = BLANK.colors;
  try {
    const parsed = JSON.parse(row.colors ?? "[]");
    if (Array.isArray(parsed) && parsed.length) colors = parsed.filter((c) => typeof c === "string" && HEX.test(c));
  } catch {
    /* corrupt palette */
  }
  return {
    brandName: row.brandName ?? "",
    colors: colors.length ? colors : BLANK.colors,
    headingFont: row.headingFont ?? "",
    bodyFont: row.bodyFont ?? "",
    logoUrl: row.logoUrl,
    extra: parseExtra(row.extra ?? null),
  };
}

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, signedIn: false, kit: BLANK });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, kit: BLANK });

  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, kit: BLANK });
  }

  try {
    let rows: {
      brandName: string | null;
      colors: string | null;
      headingFont: string | null;
      bodyFont: string | null;
      logoUrl: string | null;
      extra?: string | null;
    }[];
    try {
      rows = (await q`
        SELECT brand_name AS "brandName", colors, heading_font AS "headingFont",
               body_font AS "bodyFont", logo_url AS "logoUrl", extra
        FROM brand_kits WHERE user_id = ${user.id}
      `) as typeof rows;
    } catch {
      rows = (await q`
        SELECT brand_name AS "brandName", colors, heading_font AS "headingFont",
               body_font AS "bodyFont", logo_url AS "logoUrl"
        FROM brand_kits WHERE user_id = ${user.id}
      `) as typeof rows;
    }

    const row = rows[0];
    if (!row) return Response.json({ ok: true, configured: true, signedIn: true, kit: BLANK });
    return Response.json({ ok: true, configured: true, signedIn: true, kit: rowToKit(row) });
  } catch (e) {
    return Response.json({
      ok: false,
      configured: true,
      signedIn: true,
      kit: BLANK,
      error: e instanceof Error ? e.message : "Couldn't load brand kit.",
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return Response.json({ ok: false, error: "Accounts aren't set up yet." }, { status: 503 });
  }
  const user = await currentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Sign in to save your brand kit." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, MAX_BODY)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json(
      { error: tooBig ? "That logo is too large. Try one under about 5MB." : "Invalid request." },
      { status: tooBig ? 413 : 400 },
    );
  }

  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  const brandName = str(body.brandName, 80);
  const headingFont = str(body.headingFont, 60);
  const bodyFont = str(body.bodyFont, 60);
  const colors = (Array.isArray(body.colors) ? body.colors : [])
    .slice(0, 12)
    .map((c) => str(c, 7))
    .filter((c) => HEX.test(c));
  const extra = normalizeExtra(body.extra);

  let logoUrl = str(body.logoUrl, 2000) || null;
  if (logoUrl?.startsWith("data:")) {
    const stored = await store(logoUrl, randomUUID(), "image");
    logoUrl = stored?.url ?? null;
    if (!logoUrl) {
      return Response.json({ ok: false, error: "Couldn't save that logo. Try a smaller file." }, { status: 502 });
    }
  }

  const now = new Date().toISOString();
  try {
    await q`DELETE FROM brand_kits WHERE user_id = ${user.id}`;
    try {
      await q`
        INSERT INTO brand_kits (user_id, brand_name, colors, heading_font, body_font, logo_url, extra, updated_at)
        VALUES (
          ${user.id}, ${brandName}, ${JSON.stringify(colors)}, ${headingFont}, ${bodyFont},
          ${logoUrl}, ${JSON.stringify(extra)}, ${now}
        )`;
    } catch {
      // Column may not exist yet on older DBs — add it then retry once.
      try {
        const strings = Object.assign([`ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS extra TEXT`], {
          raw: [`ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS extra TEXT`],
        }) as TemplateStringsArray;
        await q(strings);
      } catch {
        try {
          const strings = Object.assign([`ALTER TABLE brand_kits ADD COLUMN extra TEXT`], {
            raw: [`ALTER TABLE brand_kits ADD COLUMN extra TEXT`],
          }) as TemplateStringsArray;
          await q(strings);
        } catch {
          /* present */
        }
      }
      await q`
        INSERT INTO brand_kits (user_id, brand_name, colors, heading_font, body_font, logo_url, extra, updated_at)
        VALUES (
          ${user.id}, ${brandName}, ${JSON.stringify(colors)}, ${headingFont}, ${bodyFont},
          ${logoUrl}, ${JSON.stringify(extra)}, ${now}
        )`;
    }

    return Response.json({
      ok: true,
      kit: { brandName, colors, headingFont, bodyFont, logoUrl, extra },
      savedAt: now,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't save brand kit." },
      { status: 500 },
    );
  }
}
