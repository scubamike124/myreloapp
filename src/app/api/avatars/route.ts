import { NextResponse } from "next/server";
import { CATALOG, search, studioFor, COUNTS } from "@/lib/avatar-catalog";

export const runtime = "nodejs";

// Unified avatar endpoint across providers. The older /api/heygen-avatars
// stays as-is because AI Avatar Studio still uses it.
//
// GET /api/avatars?primary=&filter=&q=&gender=&premium=any|only|exclude
//                 &source=&offset=0&limit=200
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;

    const id = (sp.get("id") ?? "").trim();
    if (id) {
      const found = CATALOG.find((a) => a.avatarId === id);
      if (!found) return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
      return NextResponse.json({ ok: true, avatar: { ...found, ...studioFor(found) } });
    }

    const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);
    const limit = Math.min(400, Math.max(1, Number(sp.get("limit") ?? 200) || 200));
    const premiumRaw = sp.get("premium") ?? "any";

    const list = search({
      primary: (sp.get("primary") ?? "").trim() || undefined,
      filter: (sp.get("filter") ?? "").trim() || undefined,
      q: (sp.get("q") ?? "").trim().toLowerCase() || undefined,
      gender: (sp.get("gender") ?? "").trim().toLowerCase() || undefined,
      premium: premiumRaw === "only" || premiumRaw === "exclude" ? premiumRaw : "any",
      source: (sp.get("source") ?? "").trim() || undefined,
    });

    const page = list.slice(offset, offset + limit).map((a) => {
      const studio = studioFor(a);
      return {
        avatarId: a.avatarId,
        name: a.name,
        gender: a.gender,
        premium: a.premium,
        image: a.image,
        video: a.video,
        source: a.source,
        tags: a.tags ?? [],
        href: studio.href,
        studio: studio.label,
      };
    });

    return NextResponse.json(
      { ok: true, total: list.length, catalog: COUNTS, offset, limit, avatars: page },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load avatars." }, { status: 502 });
  }
}
