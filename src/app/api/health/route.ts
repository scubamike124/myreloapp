import { driver, pingDatabase, postgresPublicMeta, hyperdriveBound } from "@/lib/db";
import { storageDriver, storageDriverAsync, RETENTION_DAYS } from "@/lib/storage";
import { isCloudflareWorkers, isEphemeralFilesystem } from "@/lib/runtime-platform";
import { r2Available } from "@/lib/r2-storage";

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
  const storageLive = await storageDriverAsync();
  const r2Ready = await r2Available();
  const postgres = postgresPublicMeta();
  const hdBound = await hyperdriveBound();
  const dbPing = db === "none" ? { ok: false as const, error: "No database configured." } : await pingDatabase();

  // Which providers have a key present. Not whether the key is valid — that is
  // what the vault's Test button is for — only whether the slot is filled, so a
  // deploy can see at a glance what will and will not generate.
  const providers = {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    heygen: Boolean(process.env.HEYGEN_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
  };

  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const ingestBackend = blobConfigured
    ? "blob"
    : r2Ready
      ? "r2"
      : isCloudflareWorkers() || isEphemeralFilesystem()
        ? "cache-or-memory"
        : "disk";

  // Prefer the SHA baked in at OpenNext build time; fall back to CI env vars.
  const build =
    process.env.NEXT_PUBLIC_BUILD_SHA ||
    process.env.BUILD_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.CF_COMMIT_SHA ||
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    null;

  return Response.json(
    {
      ok: true,
      status: "up",
      // The two things that make a deploy real rather than a demo.
      accounts: db !== "none",
      persistsVideos: storageLive !== "none" || blobConfigured || r2Ready,
      database: db, // "postgres" | "sqlite" | "none"
      databaseLive: dbPing,
      postgres: {
        configured: postgres.configured,
        host: postgres.host,
        database: postgres.database,
        pooled: postgres.pooled,
        // True if the raw secret still had channel_binding=require (we strip it).
        hadChannelBinding: postgres.hadChannelBinding,
        provider: postgres.provider,
        driver: postgres.driver,
        hint: postgres.hint,
        hyperdriveBound: hdBound,
      },
      storage: storageLive, // "blob" | "disk" | "r2" | "none"
      r2Ready,
      // Browser → POST /api/media/ingest path (avoids Worker→HeyGen 403).
      mediaIngest: ingestBackend,
      retentionDays: RETENTION_DAYS,
      providers,
      platform: isCloudflareWorkers() ? "cloudflare-workers" : "node",
      ephemeralFilesystem: isEphemeralFilesystem(),
      env: process.env.NODE_ENV ?? "unknown",
      // Helps confirm which Git SHA Cloudflare actually shipped.
      build,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
