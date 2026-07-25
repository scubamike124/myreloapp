import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import postgres from "postgres";
import type { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isCloudflareWorkers, isEphemeralFilesystem } from "@/lib/runtime-platform";

// node:sqlite is loaded lazily, never at module top. It is a value import only
// where SQLite is actually used (a host with a real disk). On Vercel — where
// SQLite is never used, and where the runtime may not expose node:sqlite at all
// — a static top-level import would throw at cold start and take down every
// route that touches the database. The type import above is erased at build and
// costs nothing at runtime.
const nodeRequire = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Database access, over three drivers.
//
//   SQLite   — a file on disk, via node:sqlite (built into Node, no package).
//   Neon     — @neondatabase/serverless (HTTP / WebSocket). Neon hosts only.
//   Postgres — postgres.js over TCP/TLS for Supabase and other providers
//              (Workers-compatible; prepare:false for transaction poolers).
//              Required when DATABASE_URL is not Neon: Neon's HTTP driver
//              returns CF 530/1016 against supabase.co.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;
export type PostgresTransport = "neon-http" | "neon-websocket" | "pg-tcp" | "sqlite" | "none";

let neonConfigured = false;

function configureNeonRuntime() {
  if (neonConfigured) return;
  neonConfigured = true;
  // Reuse HTTP connections across queries in one isolate.
  neonConfig.fetchConnectionCache = true;
  // Workers expose the global WebSocket constructor for Neon Pool fallback.
  if (typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  }
}

/**
 * Neon + some CF setups choke on channel_binding=require over the HTTP driver.
 * Strip it and ensure sslmode=require.
 */
export function sanitizePostgresUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.searchParams.delete("channel_binding");
    if (!u.searchParams.get("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return raw.replace(/([?&])channel_binding=require&?/gi, "$1").replace(/[?&]$/, "");
  }
}

function rawPostgresUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

function postgresUrl(): string | undefined {
  const raw = rawPostgresUrl();
  return raw ? sanitizePostgresUrl(raw) : undefined;
}

function hyperdriveFromEnv(env: unknown): string | undefined {
  const hd = (env as { HYPERDRIVE?: { connectionString?: string } } | undefined)?.HYPERDRIVE;
  return hd?.connectionString || undefined;
}

/**
 * Resolve Hyperdrive once per request. Must be captured before next/headers
 * cookies() in auth routes — that can drop OpenNext ALS mid-request.
 */
export const hyperdriveUrl = cache(async (): Promise<string | undefined> => {
  try {
    const fromSync = hyperdriveFromEnv(getCloudflareContext()?.env);
    if (fromSync) return fromSync;
  } catch {
    /* sync context unavailable */
  }
  try {
    const ctx = await getCloudflareContext({ async: true });
    return hyperdriveFromEnv(ctx?.env);
  } catch {
    return undefined;
  }
});

export async function hyperdriveBound(): Promise<boolean> {
  return Boolean(await hyperdriveUrl());
}

async function resolveEffectivePostgres(): Promise<{ url: string; viaHyperdrive: boolean } | null> {
  const hd = await hyperdriveUrl();
  if (hd) return { url: hd, viaHyperdrive: true };
  const raw = postgresUrl();
  if (!raw) return null;
  // Direct Supabase TCP from Workers fails (IPv6-only / connection reset).
  if (isCloudflareWorkers() && usesPgTcp()) return null;
  return { url: raw, viaHyperdrive: false };
}

export function isNeonHostname(host: string | null | undefined): boolean {
  return Boolean(host && /\.neon\.tech$/i.test(host));
}

/** True when we must use node-postgres TCP instead of the Neon serverless driver. */
export function usesPgTcp(): boolean {
  const url = postgresUrl();
  if (!url) return false;
  try {
    return !isNeonHostname(new URL(url).hostname);
  } catch {
    return !/\.neon\.tech/i.test(url);
  }
}

/** Safe metadata for /api/health — never includes password. */
export function postgresPublicMeta(): {
  configured: boolean;
  host: string | null;
  database: string | null;
  pooled: boolean;
  hadChannelBinding: boolean;
  provider: "neon" | "supabase" | "postgres" | "none";
  driver: "neon-serverless" | "postgres-js" | "none";
  hint: string | null;
} {
  const raw = rawPostgresUrl();
  if (!raw) {
    return {
      configured: false,
      host: null,
      database: null,
      pooled: false,
      hadChannelBinding: false,
      provider: "none",
      driver: "none",
      hint: null,
    };
  }
  const hadChannelBinding = /channel_binding=require/i.test(raw);
  try {
    const u = new URL(sanitizePostgresUrl(raw));
    const host = u.hostname;
    const neon = isNeonHostname(host);
    const supabase = /supabase\.co$/i.test(host) || /pooler\.supabase\.com$/i.test(host);
    const pooled =
      host.includes("-pooler") || /pooler\.supabase\.com$/i.test(host) || u.port === "6543";
    let hint: string | null = null;
    if (supabase && !pooled) {
      hint =
        "Supabase direct db.*.supabase.co is often IPv6-only. Prefer the Session/Transaction pooler URL (*.pooler.supabase.com:6543) on Workers.";
    } else if (!neon && !supabase) {
      hint = "Non-Neon host: using node-postgres TCP/TLS (not Neon HTTP).";
    }
    return {
      configured: true,
      host,
      database: u.pathname.replace(/^\//, "") || null,
      pooled,
      hadChannelBinding,
      provider: neon ? "neon" : supabase ? "supabase" : "postgres",
      driver: neon ? "neon-serverless" : "postgres-js",
      hint,
    };
  } catch {
    return {
      configured: true,
      host: "unparseable",
      database: null,
      pooled: false,
      hadChannelBinding,
      provider: "postgres",
      driver: "postgres-js",
      hint: "DATABASE_URL could not be parsed.",
    };
  }
}

function sqliteAllowed(): boolean {
  if (postgresUrl()) return false;
  if (process.env.DISABLE_SQLITE === "1") return false;
  if (isEphemeralFilesystem()) return false;
  return true;
}

function sqliteFile(): string {
  return process.env.SQLITE_PATH || path.join(process.cwd(), ".data", "reelo.db");
}

export type Driver = "postgres" | "sqlite" | "none";

export function driver(): Driver {
  if (postgresUrl()) return "postgres";
  if (sqliteAllowed()) return "sqlite";
  return "none";
}

export function dbConfigured(): boolean {
  return driver() !== "none";
}

// --- SQLite -----------------------------------------------------------------

let sqliteDb: DatabaseSync | null = null;

function openSqlite(): DatabaseSync | null {
  if (sqliteDb) return sqliteDb;
  try {
    const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");
    const file = sqliteFile();
    mkdirSync(path.dirname(file), { recursive: true });
    sqliteDb = new DatabaseSync(file);
    sqliteDb.exec("PRAGMA journal_mode = WAL");
    sqliteDb.exec("PRAGMA foreign_keys = ON");
    return sqliteDb;
  } catch {
    return null;
  }
}

function sqliteSql(db: DatabaseSync): Sql {
  return async (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? "?" : ""), "");
    const params = values.map((v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === "number" || typeof v === "bigint" || typeof v === "string") return v;
      return String(v);
    });
    const stmt = db.prepare(text);
    if (/^\s*(select|with)/i.test(text) || /returning/i.test(text)) {
      return stmt.all(...(params as never[])) as Row[];
    }
    stmt.run(...(params as never[]));
    return [];
  };
}

// --- Neon HTTP + WebSocket -------------------------------------------------
//
// Production symptom: neon() HTTP from this Worker returns Cloudflare
// "HTTP status 530 / error code 1016" (Origin DNS). The WebSocket Pool path
// reaches Neon directly and does not use that broken HTTP hop.
// On Cloudflare Workers we therefore prefer WebSocket; HTTP remains available
// as a fallback (and as the default off-Workers).

let cachedHttp: Sql | null = null;
let cachedPool: Pool | null = null;

function preferNeonWebSocket(): boolean {
  if (process.env.NEON_USE_WEBSOCKET === "1") return true;
  if (process.env.NEON_USE_WEBSOCKET === "0") return false;
  return isCloudflareWorkers();
}

function neonHttp(): Sql {
  configureNeonRuntime();
  const url = postgresUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");
  if (!cachedHttp) cachedHttp = neon(url) as unknown as Sql;
  return cachedHttp;
}

function neonPool(): Pool {
  configureNeonRuntime();
  const url = postgresUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");
  if (!cachedPool) cachedPool = new Pool({ connectionString: url, max: 5 });
  return cachedPool;
}

function isNeonEdgeDnsFailure(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /HTTP status 530|error code:\s*1016|Origin DNS/i.test(msg);
}

/** Parameterized query over Neon WebSockets. */
async function neonWsQuery(text: string, params: unknown[]): Promise<Row[]> {
  const result = await neonPool().query(text, params);
  return (result.rows ?? []) as Row[];
}

function templateToPg(strings: TemplateStringsArray, values: unknown[]): { text: string; params: unknown[] } {
  let text = "";
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }
  return { text, params };
}

function neonWsSql(): Sql {
  return async (strings, ...values) => {
    const { text, params } = templateToPg(strings, values);
    return await neonWsQuery(text, params);
  };
}

function neonResilientSql(): Sql {
  if (preferNeonWebSocket()) {
    const ws = neonWsSql();
    return async (strings, ...values) => {
      try {
        return await ws(strings, ...values);
      } catch (wsErr) {
        // Last resort: HTTP (rarely helps when WS is preferred for 530, but
        // covers misconfigured WebSocket environments).
        try {
          return await neonHttp()(strings, ...values);
        } catch (httpErr) {
          const wsMsg = wsErr instanceof Error ? wsErr.message : String(wsErr);
          const httpMsg = httpErr instanceof Error ? httpErr.message : String(httpErr);
          throw new Error(`Neon WebSocket failed (${wsMsg}); HTTP also failed (${httpMsg})`);
        }
      }
    };
  }

  const http = neonHttp();
  return async (strings, ...values) => {
    try {
      return await http(strings, ...values);
    } catch (e) {
      if (!isNeonEdgeDnsFailure(e)) throw e;
      const { text, params } = templateToPg(strings, values);
      return await neonWsQuery(text, params);
    }
  };
}

// --- Generic Postgres (Supabase / Hyperdrive) via postgres.js --------------

async function pgTcpQuery(text: string, params: unknown[], viaHyperdrive = false): Promise<Row[]> {
  const resolved = viaHyperdrive
    ? { url: (await hyperdriveUrl()) || "", viaHyperdrive: true }
    : await resolveEffectivePostgres();
  const url = resolved?.url || postgresUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");
  const useHd = Boolean(resolved?.viaHyperdrive || viaHyperdrive);
  // One client per query — Workers cannot reuse TCP across requests.
  // prepare:false is required for transaction poolers (port 6543).
  // Hyperdrive: Worker→proxy usually without client TLS.
  const sql = postgres(url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
    prepare: false,
    ssl: useHd ? false : "require",
  });
  try {
    const rows = await sql.unsafe(text, params as never[]);
    return rows as unknown as Row[];
  } finally {
    try {
      await sql.end({ timeout: 5 });
    } catch {
      /* ignore */
    }
  }
}

function pgTcpSql(viaHyperdrive = false): Sql {
  return async (strings, ...values) => {
    const { text, params } = templateToPg(strings, values);
    return await pgTcpQuery(text, params, viaHyperdrive);
  };
}

/**
 * Per-request SQL resolver. Prefer Hyperdrive on Workers (required for Supabase).
 */
export const sqlAsync = cache(async (): Promise<Sql | null> => {
  const resolved = await resolveEffectivePostgres();
  if (resolved) {
    if (!resolved.viaHyperdrive) {
      try {
        if (isNeonHostname(new URL(resolved.url).hostname)) return neonResilientSql();
      } catch {
        /* fall through */
      }
    }
    return pgTcpSql(resolved.viaHyperdrive);
  }
  const db = openSqlite();
  return db ? sqliteSql(db) : null;
});

export function sql(): Sql | null {
  const url = postgresUrl();
  if (url) {
    // Sync path cannot read Hyperdrive. On Workers + non-Neon, callers must use sqlAsync().
    if (isCloudflareWorkers() && usesPgTcp()) return null;
    return usesPgTcp() ? pgTcpSql(false) : neonResilientSql();
  }
  const db = openSqlite();
  return db ? sqliteSql(db) : null;
}

/** Live connectivity check for /api/health. */
export async function pingDatabase(): Promise<{
  ok: boolean;
  transport?: "http" | "websocket" | "pg-tcp" | "sqlite";
  preferWebSocket?: boolean;
  error?: string;
  userTable?: boolean;
  userCount?: number;
}> {
  const d = driver();
  if (d === "none") return { ok: false, error: "No DATABASE_URL / SQLite." };

  if (d === "sqlite") {
    try {
      const q = sql();
      if (!q) return { ok: false, error: "SQLite open failed." };
      await q`SELECT 1 AS ok`;
      return { ok: true, transport: "sqlite" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "SQLite ping failed." };
    }
  }

  async function countUsers(run: (text: string, params: unknown[]) => Promise<Row[]>): Promise<{
    userTable: boolean;
    userCount?: number;
  }> {
    try {
      const rows = (await run("SELECT COUNT(*)::int AS n FROM users", [])) as { n: number }[];
      return { userTable: true, userCount: Number(rows[0]?.n ?? 0) };
    } catch {
      return { userTable: false };
    }
  }

  // Non-Neon (e.g. Supabase): prefer Hyperdrive on Workers.
  if (usesPgTcp() || isCloudflareWorkers()) {
    try {
      const hd = await hyperdriveUrl();
      if (hd) {
        await pgTcpQuery("SELECT 1 AS ok", [], true);
        const users = await countUsers((text, params) => pgTcpQuery(text, params, true));
        return { ok: true, transport: "pg-tcp", preferWebSocket: false, ...users };
      }
      await pgTcpQuery("SELECT 1 AS ok", []);
      const users = await countUsers(pgTcpQuery);
      return { ok: true, transport: "pg-tcp", ...users };
    } catch (e) {
      const meta = postgresPublicMeta();
      const hdBound = Boolean(await hyperdriveUrl().catch(() => undefined));
      const base = e instanceof Error ? e.message : "postgres-js ping failed.";
      const hint = hdBound
        ? "Hyperdrive bound but query failed."
        : meta.hint || "Workers need a Hyperdrive binding for Supabase.";
      return {
        ok: false,
        transport: "pg-tcp",
        error: `${base} — ${hint}`,
      };
    }
  }

  const preferWs = preferNeonWebSocket();

  if (preferWs) {
    try {
      await neonWsQuery("SELECT 1 AS ok", []);
      const users = await countUsers(neonWsQuery);
      return { ok: true, transport: "websocket", preferWebSocket: true, ...users };
    } catch (wsErr) {
      try {
        const http = neonHttp();
        await http`SELECT 1 AS ok`;
        let userTable = false;
        let userCount: number | undefined;
        try {
          const rows = (await http`SELECT COUNT(*)::int AS n FROM users`) as { n: number }[];
          userTable = true;
          userCount = Number(rows[0]?.n ?? 0);
        } catch {
          userTable = false;
        }
        return { ok: true, transport: "http", preferWebSocket: true, userTable, userCount };
      } catch (httpErr) {
        return {
          ok: false,
          preferWebSocket: true,
          error: `WS: ${wsErr instanceof Error ? wsErr.message : String(wsErr)}; HTTP: ${httpErr instanceof Error ? httpErr.message : String(httpErr)}`,
        };
      }
    }
  }

  try {
    const http = neonHttp();
    await http`SELECT 1 AS ok`;
    let userTable = false;
    let userCount: number | undefined;
    try {
      const rows = (await http`SELECT COUNT(*)::int AS n FROM users`) as { n: number }[];
      userTable = true;
      userCount = Number(rows[0]?.n ?? 0);
    } catch {
      userTable = false;
    }
    return { ok: true, transport: "http", preferWebSocket: false, userTable, userCount };
  } catch (httpErr) {
    if (!isNeonEdgeDnsFailure(httpErr)) {
      return { ok: false, preferWebSocket: false, error: httpErr instanceof Error ? httpErr.message : "HTTP ping failed." };
    }
    try {
      await neonWsQuery("SELECT 1 AS ok", []);
      const users = await countUsers(neonWsQuery);
      return { ok: true, transport: "websocket", preferWebSocket: false, ...users };
    } catch (wsErr) {
      return {
        ok: false,
        preferWebSocket: false,
        error: `HTTP: ${httpErr instanceof Error ? httpErr.message : "fail"}; WS: ${wsErr instanceof Error ? wsErr.message : "fail"}`,
      };
    }
  }
}

// --- schema -----------------------------------------------------------------

let ensured = false;

/**
 * Created on demand and safe to run repeatedly, so a fresh machine or a fresh
 * deploy needs no migration step.
 */
export async function ensureSchema(): Promise<boolean> {
  const q = await sqlAsync();
  if (!q) return false;
  if (ensured) return true;

  const pg = driver() === "postgres";

  // Production DBs already have tables. Probe first so signup/login never
  // re-run a long DDL chain.
  try {
    await q`SELECT 1 FROM users LIMIT 1`;
    ensured = true;
    return true;
  } catch {
    /* tables missing — fall through to CREATE */
  }

  if (pg) {
    await q`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name          TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS token_ledger (
        id         BIGSERIAL PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delta      DOUBLE PRECISION NOT NULL,
        reason     TEXT NOT NULL,
        ref        TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    try {
      await q`
        ALTER TABLE token_ledger
        ALTER COLUMN delta TYPE DOUBLE PRECISION
        USING delta::double precision`;
    } catch {
      /* already DOUBLE PRECISION or table just created */
    }

    await q`CREATE UNIQUE INDEX IF NOT EXISTS token_ledger_ref_key ON token_ledger (ref) WHERE ref IS NOT NULL`;
    await q`CREATE INDEX IF NOT EXISTS token_ledger_user_idx ON token_ledger (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS creations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tool_slug   TEXT NOT NULL,
        tool_title  TEXT NOT NULL,
        title       TEXT NOT NULL,
        status      TEXT NOT NULL,
        kind        TEXT NOT NULL,
        media_url   TEXT,
        bytes       INTEGER,
        error       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at  TEXT
      )`;
    await q`CREATE INDEX IF NOT EXISTS creations_user_idx ON creations (user_id, created_at DESC)`;

    try {
      await q`ALTER TABLE creations ADD COLUMN expires_at TEXT`;
    } catch {
      /* already present */
    }

    await q`CREATE INDEX IF NOT EXISTS creations_expiry_idx ON creations (expires_at)`;

    await q`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL
      )`;
    await q`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS brand_kits (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        brand_name   TEXT,
        colors       TEXT,
        heading_font TEXT,
        body_font    TEXT,
        logo_url     TEXT,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
  } else {
    const exec = async (text: string) => {
      const strings = Object.assign([text], { raw: [text] }) as TemplateStringsArray;
      await q(strings);
    };

    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name          TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS token_ledger (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        delta      REAL NOT NULL,
        reason     TEXT NOT NULL,
        ref        TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS token_ledger_ref_key ON token_ledger (ref) WHERE ref IS NOT NULL`);
    await exec(`CREATE INDEX IF NOT EXISTS token_ledger_user_idx ON token_ledger (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS creations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tool_slug   TEXT NOT NULL,
        tool_title  TEXT NOT NULL,
        title       TEXT NOT NULL,
        status      TEXT NOT NULL,
        kind        TEXT NOT NULL,
        media_url   TEXT,
        bytes       INTEGER,
        error       TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at  TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS creations_user_idx ON creations (user_id, created_at DESC)`);

    try {
      await exec(`ALTER TABLE creations ADD COLUMN expires_at TEXT`);
    } catch {
      /* already present */
    }

    await exec(`CREATE INDEX IF NOT EXISTS creations_expiry_idx ON creations (expires_at)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS brand_kits (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        brand_name   TEXT,
        colors       TEXT,
        heading_font TEXT,
        body_font    TEXT,
        logo_url     TEXT,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
  }

  ensured = true;
  return true;
}

export type { Row };
