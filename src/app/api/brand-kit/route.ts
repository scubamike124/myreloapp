import { dbConfigured, ensureSchema, sql } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { store } from "@/lib/storage";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// A customer's brand kit: their colours, fonts and logo.
//
// One row per account. Saving is the whole feature — the Business Center card
// promised "store your logos, colors, fonts and brand assets" and stored
// nothing, so the card led nowhere at all.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY = 8 * 1024 * 1024; // a logo, base64-encoded

const HEX = /^#[0-9a-f]{6}$/i;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

type Kit = {
  brandName: string;
  colors: string[];
  headingFont: string;
  bodyFont: string;
  logoUrl: string | null;
};

const BLANK: Kit = {
  brandName: "",
  colors: ["#ff3645", "#c4101c", "#0a0607", "#ffffff"],
  headingFont: "",
  bodyFont: "",
  logoUrl: null,
};

export async function GET() {
  if (!dbConfigured()) return Response.json({ ok: true, configured: false, signedIn: false, kit: BLANK });
  const user = await currentUser();
  if (!user) return Response.json({ ok: true, configured: true, signedIn: false, kit: BLANK });

  const q = sql();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: true, configured: false, signedIn: true, kit: BLANK });
  }

  const rows = (await q`
    SELECT brand_name AS "brandName", colors, heading_font AS "headingFont",
           body_font AS "bodyFont", logo_url AS "logoUrl"
    FROM brand_kits WHERE user_id = ${user.id}
  `) as { brandName: string | null; colors: string | null; headingFont: string | null; bodyFont: string | null; logoUrl: string | null }[];

  const row = rows[0];
  if (!row) return Response.json({ ok: true, configured: true, signedIn: true, kit: BLANK });

  let colors: string[] = BLANK.colors;
  try {
    const parsed = JSON.parse(row.colors ?? "[]");
    if (Array.isArray(parsed) && parsed.length) colors = parsed.filter((c) => typeof c === "string" && HEX.test(c));
  } catch {
    /* a corrupt palette falls back to the default rather than 500ing */
  }

  return Response.json({
    ok: true,
    configured: true,
    signedIn: true,
    kit: {
      brandName: row.brandName ?? "",
      colors: colors.length ? colors : BLANK.colors,
      headingFont: row.headingFont ?? "",
      bodyFont: row.bodyFont ?? "",
      logoUrl: row.logoUrl,
    },
  });
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

  const q = sql();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  const brandName = str(body.brandName, 80);
  const headingFont = str(body.headingFont, 60);
  const bodyFont = str(body.bodyFont, 60);
  // Only real hex colours are stored, so nothing arbitrary reaches a style
  // attribute when the palette is rendered back.
  const colors = (Array.isArray(body.colors) ? body.colors : [])
    .slice(0, 12)
    .map((c) => str(c, 7))
    .filter((c) => HEX.test(c));

  // A new logo arrives as a data URL; an unchanged one arrives as the URL we
  // already stored, which must not be re-uploaded.
  let logoUrl = str(body.logoUrl, 2000) || null;
  if (logoUrl?.startsWith("data:")) {
    const stored = await store(logoUrl, randomUUID(), "image");
    logoUrl = stored?.url ?? null;
    if (!logoUrl) {
      return Response.json({ ok: false, error: "Couldn't save that logo. Try a smaller file." }, { status: 502 });
    }
  }

  const now = new Date().toISOString();
  // No ON CONFLICT: the two dialects spell the upsert differently and this is
  // one row per user, so a delete-then-insert is both portable and correct.
  await q`DELETE FROM brand_kits WHERE user_id = ${user.id}`;
  await q`
    INSERT INTO brand_kits (user_id, brand_name, colors, heading_font, body_font, logo_url, updated_at)
    VALUES (${user.id}, ${brandName}, ${JSON.stringify(colors)}, ${headingFont}, ${bodyFont}, ${logoUrl}, ${now})`;

  return Response.json({
    ok: true,
    kit: { brandName, colors, headingFont, bodyFont, logoUrl },
    savedAt: now,
  });
}
