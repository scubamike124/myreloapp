import { driver } from "@/lib/db";
import { storageDriver, RETENTION_DAYS } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Liveness and readiness in one place.
//
// A host's health check hits this to know the app is up. It also answers the
// question that matters on a fresh deploy: is anything actually persisting, or
// is this an ephemeral filesystem where accounts and videos silently vanish?
//
//   database "none"  -> no accounts, no tokens (set a Postgres URL, or give
//                       SQLite a writable disk)
//   storage  "none"  -> finished videos keep only the provider's expiring link
//
// GET /api/health  -> 200 with the picture, always. It never reports "down"
// for a missing key, because the site still serves — it reports what is on.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = driver();
  const storage = storageDriver();

  // Which providers have a key present. Not whether the key is valid — that is
  // what the vault's Test button is for — only whether the slot is filled, so a
  // deploy can see at a glance what will and will not generate.
  const providers = {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    heygen: Boolean(process.env.HEYGEN_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
  };

  return Response.json(
    {
      ok: true,
      status: "up",
      // The two things that make a deploy real rather than a demo.
      accounts: db !== "none",
      persistsVideos: storage !== "none",
      database: db, // "postgres" | "sqlite" | "none"
      storage, // "blob" | "disk" | "none"
      retentionDays: RETENTION_DAYS,
      providers,
      env: process.env.NODE_ENV ?? "unknown",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
