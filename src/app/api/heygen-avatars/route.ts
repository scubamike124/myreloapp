import { NextResponse } from "next/server";
import snapshot from "@/data/heygen-avatars.json";
import { CATEGORIES, getCategory, matches } from "@/lib/avatar-categories";

export const runtime = "nodejs";

// HeyGen's /v2/avatars takes ~65s and returns ~520KB, which is far too slow to
// sit in the request path — a cold serverless instance would make the user wait
// a full minute. So the catalog ships with the deploy as a snapshot (instant),
// and we only hit HeyGen when explicitly refreshed. Regenerate the snapshot with:
//   npm run refresh:avatars
type Avatar = { avatarId: string; name: string; gender: string; premium: boolean; image: string; video: string };

const SNAPSHOT = snapshot as Avatar[];

// Live-refresh cache: only populated when ?refresh=1 is used, then reused.
let live: { at: number; avatars: Avatar[] } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

async function fetchLive(key: string): Promise<Avatar[]> {
  if (live && Date.now() - live.at < TTL_MS) return live.avatars;
  const res = await fetch("https://api.heygen.com/v2/avatars", {
    headers: { "X-Api-Key": key },
    signal: AbortSignal.timeout(90000),
    next: { revalidate: 60 * 60 * 24 }, // persists across cold starts
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to load avatars.");
  const raw = (data?.data?.avatars ?? []) as Array<Record<string, unknown>>;
  const avatars: Avatar[] = raw
    .map((a) => ({
      avatarId: String(a.avatar_id ?? ""),
      name: String(a.avatar_name ?? "Avatar"),
      gender: String(a.gender ?? ""),
      premium: Boolean(a.premium),
      image: String(a.preview_image_url ?? ""),
      video: String(a.preview_video_url ?? ""),
    }))
    .filter((a) => a.avatarId && a.image);
  live = { at: Date.now(), avatars };
  return avatars;
}

// GET /api/heygen-avatars?q=&offset=0&limit=48&gender=&includePremium=1&refresh=1
// Serves the bundled snapshot instantly; ?refresh=1 pulls a fresh catalog.
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const q = (sp.get("q") ?? "").trim().toLowerCase();
    const gender = (sp.get("gender") ?? "").trim().toLowerCase();
    const includePremium = sp.get("includePremium") === "1";
    const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);
    const limit = Math.min(96, Math.max(1, Number(sp.get("limit") ?? 48) || 48));

    // Single-avatar lookup, so /avatars can deep-link a choice into the studio
    // (?avatar=<id>) and the studio can restore it without paging the catalog.
    const id = (sp.get("id") ?? "").trim();
    if (id) {
      const found = SNAPSHOT.find((a) => a.avatarId === id);
      if (!found) return NextResponse.json({ error: "Avatar not found." }, { status: 404 });
      return NextResponse.json(
        { ok: true, avatar: found },
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
      );
    }

    let list: Avatar[] = SNAPSHOT;
    let source = "snapshot";
    if (sp.get("refresh") === "1") {
      const key = process.env.HEYGEN_API_KEY;
      if (!key) return NextResponse.json({ error: "HEYGEN_API_KEY is not set." }, { status: 500 });
      try {
        list = await fetchLive(key);
        source = "live";
      } catch {
        /* HeyGen slow/down — fall back to the snapshot rather than failing */
      }
    }

    const totalAll = list.length;

    // Category filter. "all" is everything; "other" is whatever matches no
    // category, so no avatar is unreachable from the UI.
    const category = (sp.get("category") ?? "").trim();
    if (category && category !== "all") {
      if (category === "other") {
        list = list.filter((a) => !CATEGORIES.some((c) => matches(a, c)));
      } else {
        const cat = getCategory(category);
        if (!cat) return NextResponse.json({ error: "Unknown category." }, { status: 404 });
        list = list.filter((a) => matches(a, cat));
      }
    }

    if (!includePremium) list = list.filter((a) => !a.premium); // trial-safe by default
    if (gender) list = list.filter((a) => a.gender.toLowerCase() === gender);
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));

    const total = list.length;
    const page = list.slice(offset, offset + limit);
    // Public catalog data — let the CDN serve repeat queries.
    return NextResponse.json(
      { ok: true, source, total, totalAll, offset, limit, avatars: page },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load avatars." }, { status: 502 });
  }
}
