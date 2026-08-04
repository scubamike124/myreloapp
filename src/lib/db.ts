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
/** Workspace tables added after core auth — always safe IF NOT EXISTS. */
async function ensureWorkspaceTables(q: Sql): Promise<void> {
  // Prefer postgres DDL whenever the live transport is TCP/Neon — `driver()` can
  // report sqlite during CF builds when DATABASE_URL is stripped but Hyperdrive is live.
  const pg = driver() === "postgres" || Boolean(process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE) || Boolean(process.env.CF_HYPERDRIVE);
  if (pg) {
    await q`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token      TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens (user_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS publish_items (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creation_id TEXT,
        title       TEXT NOT NULL,
        caption     TEXT NOT NULL DEFAULT '',
        platforms   TEXT NOT NULL DEFAULT '[]',
        status      TEXT NOT NULL DEFAULT 'draft',
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS publish_items_user_idx ON publish_items (user_id, updated_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS schedule_items (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creation_id  TEXT,
        title        TEXT NOT NULL,
        platforms    TEXT NOT NULL DEFAULT '[]',
        scheduled_at TIMESTAMPTZ NOT NULL,
        status       TEXT NOT NULL DEFAULT 'planned',
        notes        TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS schedule_items_user_idx ON schedule_items (user_id, scheduled_at)`;

    await q`
      CREATE TABLE IF NOT EXISTS team_members (
        id             TEXT PRIMARY KEY,
        owner_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_email   TEXT NOT NULL,
        member_user_id TEXT,
        role           TEXT NOT NULL DEFAULT 'member',
        status         TEXT NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS team_members_owner_idx ON team_members (owner_user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS notifications (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        href       TEXT,
        read_at    TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS workspace_settings (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        timezone     TEXT NOT NULL DEFAULT 'UTC',
        notify_email BOOLEAN NOT NULL DEFAULT false,
        notify_inapp BOOLEAN NOT NULL DEFAULT true,
        prefs        TEXT NOT NULL DEFAULT '{}',
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS brand_kits (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        brand_name   TEXT,
        colors       TEXT,
        heading_font TEXT,
        body_font    TEXT,
        logo_url     TEXT,
        extra        TEXT,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    const alterExtra = async (text: string) => {
      const strings = Object.assign([text], { raw: [text] }) as TemplateStringsArray;
      await q(strings);
    };
    try {
      await alterExtra(`ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS extra TEXT`);
    } catch {
      try {
        await alterExtra(`ALTER TABLE brand_kits ADD COLUMN extra TEXT`);
      } catch {
        /* already present or unsupported */
      }
    }

    await q`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id                 TEXT PRIMARY KEY,
        user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider           TEXT NOT NULL,
        external_id        TEXT NOT NULL,
        handle             TEXT NOT NULL DEFAULT '',
        display_name       TEXT NOT NULL DEFAULT '',
        scopes             TEXT NOT NULL DEFAULT '',
        access_token_enc   TEXT,
        refresh_token_enc  TEXT,
        expires_at         TIMESTAMPTZ,
        status             TEXT NOT NULL DEFAULT 'connected',
        meta               TEXT NOT NULL DEFAULT '{}',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_user_provider_ext ON social_accounts (user_id, provider, external_id)`;
    await q`CREATE INDEX IF NOT EXISTS social_accounts_user_idx ON social_accounts (user_id, provider)`;

    await q`
      CREATE TABLE IF NOT EXISTS business_profiles (
        user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        company              TEXT NOT NULL DEFAULT '',
        industry             TEXT NOT NULL DEFAULT '',
        location             TEXT NOT NULL DEFAULT '',
        audience             TEXT NOT NULL DEFAULT '',
        style                TEXT NOT NULL DEFAULT '',
        goals                TEXT NOT NULL DEFAULT '',
        approval_mode        TEXT NOT NULL DEFAULT 'require',
        onboarding_complete  BOOLEAN NOT NULL DEFAULT false,
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS schedule_account_targets (
        schedule_item_id TEXT NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
        social_account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
        PRIMARY KEY (schedule_item_id, social_account_id)
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS publish_account_targets (
        publish_item_id   TEXT NOT NULL REFERENCES publish_items(id) ON DELETE CASCADE,
        social_account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
        PRIMARY KEY (publish_item_id, social_account_id)
      )`;

    for (const ddl of [
      `ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft'`,
      `ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS amber_placed BOOLEAN DEFAULT false`,
      `ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT ''`,
      `ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS hashtags TEXT DEFAULT ''`,
      `ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS publish_result TEXT`,
      `ALTER TABLE publish_items ADD COLUMN IF NOT EXISTS schedule_id TEXT`,
      `ALTER TABLE publish_items ADD COLUMN IF NOT EXISTS account_ids TEXT DEFAULT '[]'`,
      `ALTER TABLE publish_items ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft'`,
      `ALTER TABLE publish_items ADD COLUMN IF NOT EXISTS publish_result TEXT`,
    ]) {
      try {
        await alterExtra(ddl);
      } catch {
        try {
          await alterExtra(ddl.replace(" IF NOT EXISTS", ""));
        } catch {
          /* present */
        }
      }
    }

    await q`
      CREATE TABLE IF NOT EXISTS app_settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_action_logs (
        id             TEXT PRIMARY KEY,
        actor_user_id  TEXT,
        actor_email    TEXT,
        kind           TEXT NOT NULL,
        title          TEXT NOT NULL,
        detail         TEXT NOT NULL DEFAULT '{}',
        href           TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_action_logs_created_idx ON amber_action_logs (created_at DESC)`;

    try {
      await alterExtra(`ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS brand_rules TEXT DEFAULT ''`);
    } catch {
      try {
        await alterExtra(`ALTER TABLE business_profiles ADD COLUMN brand_rules TEXT DEFAULT ''`);
      } catch {
        /* present */
      }
    }

    for (const ddl of [
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS competitors TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS service_areas TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS seasonal_trends TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS products TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS services TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS marketing_objectives TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS intelligence TEXT DEFAULT '{}'`,
    ]) {
      try {
        await alterExtra(ddl);
      } catch {
        try {
          await alterExtra(ddl.replace(" IF NOT EXISTS", ""));
        } catch {
          /* present */
        }
      }
    }

    await q`
      CREATE TABLE IF NOT EXISTS amber_infra_emails (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email      TEXT NOT NULL,
        role       TEXT NOT NULL DEFAULT 'other',
        notes      TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_infra_emails_user_idx ON amber_infra_emails (user_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_service_links (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'planned',
        meta       TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_service_links_user_idx ON amber_service_links (user_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_account_map (
        social_account_id TEXT PRIMARY KEY REFERENCES social_accounts(id) ON DELETE CASCADE,
        user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        infra_role        TEXT NOT NULL DEFAULT 'social',
        notes             TEXT NOT NULL DEFAULT ''
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_weeks (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_start TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'running',
        strategy   TEXT NOT NULL DEFAULT '{}',
        report     TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_weeks_user_idx ON amber_weeks (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_tasks (
        id         TEXT PRIMARY KEY,
        week_id    TEXT NOT NULL REFERENCES amber_weeks(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        payload    TEXT NOT NULL DEFAULT '{}',
        status     TEXT NOT NULL DEFAULT 'planned',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_tasks_week_idx ON amber_tasks (week_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_content_requests (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_id      TEXT,
        parent_id    TEXT,
        title        TEXT NOT NULL,
        script       TEXT NOT NULL DEFAULT '',
        platforms    TEXT NOT NULL DEFAULT '[]',
        tool_slug    TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'planned',
        creation_id  TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_content_requests_user_idx ON amber_content_requests (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_learning (
        user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        patterns   TEXT NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_missions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal       TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'draft',
        strategy   TEXT NOT NULL DEFAULT '{}',
        report     TEXT NOT NULL DEFAULT '{}',
        week_id    TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_missions_user_idx ON amber_missions (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_productions (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_id      TEXT,
        week_id         TEXT,
        parent_id       TEXT,
        title           TEXT NOT NULL,
        script          TEXT NOT NULL DEFAULT '',
        platforms       TEXT NOT NULL DEFAULT '[]',
        tool_slug       TEXT NOT NULL DEFAULT 'shorts-20',
        status          TEXT NOT NULL DEFAULT 'planned',
        review_status   TEXT NOT NULL DEFAULT 'pending',
        review_notes    TEXT NOT NULL DEFAULT '',
        creation_id     TEXT,
        caption         TEXT NOT NULL DEFAULT '',
        hashtags        TEXT NOT NULL DEFAULT '',
        schedule_id     TEXT,
        publish_id      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_productions_user_idx ON amber_productions (user_id, created_at DESC)`;
    await q`CREATE INDEX IF NOT EXISTS amber_productions_mission_idx ON amber_productions (mission_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_reports (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_id    TEXT,
        mission_id TEXT,
        period     TEXT NOT NULL,
        summary    TEXT NOT NULL DEFAULT '',
        body       TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_reports_user_idx ON amber_reports (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_verification_holds (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider     TEXT NOT NULL,
        step         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'paused',
        explanation  TEXT NOT NULL DEFAULT '',
        resume_hint  TEXT NOT NULL DEFAULT '',
        meta         TEXT NOT NULL DEFAULT '{}',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at  TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_verification_holds_user_idx ON amber_verification_holds (user_id, status)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_performance (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        ref_id     TEXT,
        metrics    TEXT NOT NULL DEFAULT '{}',
        note       TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_performance_user_idx ON amber_performance (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_campaigns (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_id   TEXT,
        title        TEXT NOT NULL,
        objective    TEXT NOT NULL DEFAULT '',
        audience     TEXT NOT NULL DEFAULT '',
        strategy     TEXT NOT NULL DEFAULT '{}',
        package      TEXT NOT NULL DEFAULT '{}',
        status       TEXT NOT NULL DEFAULT 'draft',
        decision_log TEXT NOT NULL DEFAULT '[]',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_campaigns_user_idx ON amber_campaigns (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_decisions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        priority   INTEGER NOT NULL DEFAULT 50,
        title      TEXT NOT NULL,
        rationale  TEXT NOT NULL DEFAULT '',
        action     TEXT NOT NULL DEFAULT '',
        status     TEXT NOT NULL DEFAULT 'open',
        meta       TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_decisions_user_idx ON amber_decisions (user_id, priority ASC, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_agent_jobs (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent        TEXT NOT NULL,
        title        TEXT NOT NULL,
        brief        TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'queued',
        result       TEXT NOT NULL DEFAULT '{}',
        campaign_id  TEXT,
        department   TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_agent_jobs_user_idx ON amber_agent_jobs (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_ops_metrics (
        id         TEXT PRIMARY KEY,
        kind       TEXT NOT NULL,
        workspace_user_id TEXT,
        cycle_id   TEXT,
        metrics    TEXT NOT NULL DEFAULT '{}',
        note       TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_ops_metrics_created_idx ON amber_ops_metrics (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_cycle_runs (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status          TEXT NOT NULL DEFAULT 'running',
        goal            TEXT NOT NULL DEFAULT '',
        steps           TEXT NOT NULL DEFAULT '[]',
        decisions       TEXT NOT NULL DEFAULT '[]',
        learning_delta  TEXT NOT NULL DEFAULT '{}',
        report_id       TEXT,
        mission_id      TEXT,
        campaign_id     TEXT,
        owner_asks      TEXT NOT NULL DEFAULT '[]',
        duration_ms     INTEGER NOT NULL DEFAULT 0,
        error           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at    TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_cycle_runs_user_idx ON amber_cycle_runs (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_executive_briefs (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period           TEXT NOT NULL,
        goals_snapshot   TEXT NOT NULL DEFAULT '{}',
        health_snapshot  TEXT NOT NULL DEFAULT '{}',
        recommendations  TEXT NOT NULL DEFAULT '[]',
        narrative        TEXT NOT NULL DEFAULT '',
        confidence       DOUBLE PRECISION NOT NULL DEFAULT 0,
        cycle_id         TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_executive_briefs_user_idx ON amber_executive_briefs (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_departments (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug         TEXT NOT NULL,
        label        TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'active',
        priorities   TEXT NOT NULL DEFAULT '[]',
        health_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, slug)
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_departments_user_idx ON amber_departments (user_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_memory (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        weight     DOUBLE PRECISION NOT NULL DEFAULT 1,
        evidence   TEXT NOT NULL DEFAULT '[]',
        cycle_id   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_memory_user_idx ON amber_memory (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_objectives (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal             TEXT NOT NULL,
        status           TEXT NOT NULL DEFAULT 'active',
        success_metrics  TEXT NOT NULL DEFAULT '[]',
        plan             TEXT NOT NULL DEFAULT '{}',
        deadline         TEXT,
        mission_id       TEXT,
        campaign_id      TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_objectives_user_idx ON amber_objectives (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_health_snapshots (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scores     TEXT NOT NULL DEFAULT '{}',
        notes      TEXT NOT NULL DEFAULT '',
        cycle_id   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_health_snapshots_user_idx ON amber_health_snapshots (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_improvements (
        id                TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area              TEXT NOT NULL,
        recommendation    TEXT NOT NULL,
        expected_impact   TEXT NOT NULL DEFAULT '',
        effort            TEXT NOT NULL DEFAULT 'medium',
        status            TEXT NOT NULL DEFAULT 'open',
        evidence          TEXT NOT NULL DEFAULT '[]',
        explanation       TEXT NOT NULL DEFAULT '{}',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_improvements_user_idx ON amber_improvements (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_orchestration_runs (
        id                  TEXT PRIMARY KEY,
        user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cycle_id            TEXT,
        objective_id        TEXT,
        executive_brief_id  TEXT,
        campaign_id         TEXT,
        mission_id          TEXT,
        report_id           TEXT,
        department_jobs     TEXT NOT NULL DEFAULT '[]',
        status              TEXT NOT NULL DEFAULT 'running',
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at        TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_orchestration_runs_user_idx ON amber_orchestration_runs (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_ops_alerts (
        id              TEXT PRIMARY KEY,
        severity        TEXT NOT NULL DEFAULT 'warning',
        kind            TEXT NOT NULL,
        title           TEXT NOT NULL,
        detail          TEXT NOT NULL DEFAULT '',
        workspace_user_id TEXT,
        status          TEXT NOT NULL DEFAULT 'open',
        recommended     TEXT NOT NULL DEFAULT '',
        meta            TEXT NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at     TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_ops_alerts_created_idx ON amber_ops_alerts (created_at DESC)`;
    await q`CREATE INDEX IF NOT EXISTS amber_ops_alerts_status_idx ON amber_ops_alerts (status, severity)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_recovery_events (
        id              TEXT PRIMARY KEY,
        workspace_user_id TEXT,
        action          TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'started',
        detail          TEXT NOT NULL DEFAULT '{}',
        actor_email     TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at    TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_recovery_events_created_idx ON amber_recovery_events (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_readiness_snapshots (
        id           TEXT PRIMARY KEY,
        score        INTEGER NOT NULL DEFAULT 0,
        breakdown    TEXT NOT NULL DEFAULT '{}',
        explanations TEXT NOT NULL DEFAULT '{}',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_readiness_snapshots_created_idx ON amber_readiness_snapshots (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_ops_checkpoints (
        id           TEXT PRIMARY KEY,
        cycle_id     TEXT NOT NULL,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        step         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'ok',
        detail       TEXT NOT NULL DEFAULT '{}',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_ops_checkpoints_cycle_idx ON amber_ops_checkpoints (cycle_id, created_at ASC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_strategic_plans (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        horizon     TEXT NOT NULL DEFAULT 'quarterly',
        status      TEXT NOT NULL DEFAULT 'active',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_strategic_plans_user_idx ON amber_strategic_plans (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_initiatives (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id       TEXT,
        objective_id  TEXT,
        title         TEXT NOT NULL,
        department    TEXT NOT NULL DEFAULT 'marketing',
        status        TEXT NOT NULL DEFAULT 'active',
        priority      INTEGER NOT NULL DEFAULT 50,
        progress      DOUBLE PRECISION NOT NULL DEFAULT 0,
        body          TEXT NOT NULL DEFAULT '{}',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_initiatives_user_idx ON amber_initiatives (user_id, status, priority ASC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_projects (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        initiative_id  TEXT,
        title          TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'active',
        progress       DOUBLE PRECISION NOT NULL DEFAULT 0,
        deadline       TEXT,
        body           TEXT NOT NULL DEFAULT '{}',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_projects_user_idx ON amber_projects (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_exec_tasks (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id    TEXT,
        title         TEXT NOT NULL,
        agent         TEXT NOT NULL DEFAULT '',
        department    TEXT NOT NULL DEFAULT 'marketing',
        status        TEXT NOT NULL DEFAULT 'queued',
        depends_on    TEXT NOT NULL DEFAULT '[]',
        quality       DOUBLE PRECISION NOT NULL DEFAULT 0,
        body          TEXT NOT NULL DEFAULT '{}',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_exec_tasks_user_idx ON amber_exec_tasks (user_id, status, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_kpis (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug        TEXT NOT NULL,
        label       TEXT NOT NULL,
        value       DOUBLE PRECISION NOT NULL DEFAULT 0,
        target      DOUBLE PRECISION NOT NULL DEFAULT 0,
        unit        TEXT NOT NULL DEFAULT '',
        trend       TEXT NOT NULL DEFAULT 'flat',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_kpis_user_idx ON amber_kpis (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_risks (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        severity    TEXT NOT NULL DEFAULT 'medium',
        title       TEXT NOT NULL,
        detail      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'open',
        recommended TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_risks_user_idx ON amber_risks (user_id, status, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_approvals (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind        TEXT NOT NULL,
        title       TEXT NOT NULL,
        detail      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'pending',
        impact      TEXT NOT NULL DEFAULT 'high',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ,
        resolved_by TEXT
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_approvals_user_idx ON amber_approvals (user_id, status, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_exec_briefings (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period      TEXT NOT NULL,
        kind        TEXT NOT NULL DEFAULT 'weekly',
        summary     TEXT NOT NULL DEFAULT '',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_exec_briefings_user_idx ON amber_exec_briefings (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_optimizations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area        TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        expected_impact TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'open',
        evidence    TEXT NOT NULL DEFAULT '[]',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_optimizations_user_idx ON amber_optimizations (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_organizations (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'active',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_enterprise_workspaces (
        id              TEXT PRIMARY KEY,
        org_id          TEXT,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label           TEXT NOT NULL DEFAULT '',
        status          TEXT NOT NULL DEFAULT 'active',
        readiness_score INTEGER NOT NULL DEFAULT 0,
        health_score    INTEGER NOT NULL DEFAULT 0,
        meta            TEXT NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id)
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_enterprise_workspaces_org_idx ON amber_enterprise_workspaces (org_id)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_kg_nodes (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        ref_id      TEXT,
        title       TEXT NOT NULL,
        body        TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_kg_nodes_user_idx ON amber_kg_nodes (user_id, kind)`;
    await q`CREATE INDEX IF NOT EXISTS amber_kg_nodes_kind_idx ON amber_kg_nodes (kind, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_kg_edges (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        from_node   TEXT NOT NULL,
        to_node     TEXT NOT NULL,
        relation    TEXT NOT NULL,
        weight      DOUBLE PRECISION NOT NULL DEFAULT 1,
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_kg_edges_from_idx ON amber_kg_edges (from_node)`;
    await q`CREATE INDEX IF NOT EXISTS amber_kg_edges_to_idx ON amber_kg_edges (to_node)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_forecasts (
        id          TEXT PRIMARY KEY,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        title       TEXT NOT NULL,
        confidence  DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        prediction  TEXT NOT NULL DEFAULT '',
        mitigation  TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_forecasts_created_idx ON amber_forecasts (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_benchmarks (
        id          TEXT PRIMARY KEY,
        scope       TEXT NOT NULL,
        metric      TEXT NOT NULL,
        subject_a   TEXT NOT NULL,
        subject_b   TEXT NOT NULL,
        value_a     DOUBLE PRECISION NOT NULL DEFAULT 0,
        value_b     DOUBLE PRECISION NOT NULL DEFAULT 0,
        winner      TEXT NOT NULL DEFAULT '',
        note        TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_benchmarks_created_idx ON amber_benchmarks (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_resource_allocations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT,
        resource    TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        weight      DOUBLE PRECISION NOT NULL DEFAULT 1,
        reason      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'active',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_resource_allocations_user_idx ON amber_resource_allocations (user_id, created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_governance_policies (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        slug        TEXT NOT NULL,
        title       TEXT NOT NULL,
        rule        TEXT NOT NULL DEFAULT '',
        threshold   DOUBLE PRECISION NOT NULL DEFAULT 0,
        enforced    BOOLEAN NOT NULL DEFAULT true,
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_governance_policies_slug_idx ON amber_governance_policies (slug)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_business_reviews (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        period      TEXT NOT NULL,
        summary     TEXT NOT NULL DEFAULT '',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_business_reviews_created_idx ON amber_business_reviews (created_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS amber_decision_intel (
        id              TEXT PRIMARY KEY,
        user_id         TEXT,
        title           TEXT NOT NULL,
        evidence        TEXT NOT NULL DEFAULT '[]',
        confidence      DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        expected_impact TEXT NOT NULL DEFAULT '',
        alternatives    TEXT NOT NULL DEFAULT '[]',
        decision        TEXT NOT NULL DEFAULT '',
        outcome         TEXT NOT NULL DEFAULT '',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS amber_decision_intel_user_idx ON amber_decision_intel (user_id, created_at DESC)`;

    for (const ddl of [
      `ALTER TABLE amber_productions ADD COLUMN IF NOT EXISTS campaign_id TEXT`,
      `ALTER TABLE amber_productions ADD COLUMN IF NOT EXISTS quality_score DOUBLE PRECISION DEFAULT 0`,
      `ALTER TABLE amber_productions ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS ideal_customer TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS growth_history TEXT DEFAULT ''`,
      `ALTER TABLE amber_agent_jobs ADD COLUMN IF NOT EXISTS department TEXT DEFAULT ''`,
    ]) {
      try {
        await alterExtra(ddl);
      } catch {
        try {
          await alterExtra(ddl.replace(" IF NOT EXISTS", ""));
        } catch {
          /* present */
        }
      }
    }

    /*
     * Storybook.
     *
     * Until now a finished storybook existed only in the browser tab that
     * generated it — StoryMaker's own UI said so: "Episodes live in this page
     * only." That is why there is no library, no sequel and no reused
     * character: nothing was ever written down.
     *
     * Four tables rather than one JSON blob, because each is read on its own.
     * A library lists stories without loading illustrations; a sequel reads the
     * series memory without loading the previous manuscripts; the movie
     * pipeline updates one artifact's status while the others are still
     * rendering.
     */
    await q`
      CREATE TABLE IF NOT EXISTS story_characters (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name             TEXT NOT NULL,
        age_band         TEXT,
        face             TEXT NOT NULL DEFAULT '',
        hair             TEXT NOT NULL DEFAULT '',
        clothing         TEXT NOT NULL DEFAULT '',
        body_proportions TEXT,
        animation_style  TEXT,
        expressions      TEXT NOT NULL DEFAULT '[]',
        personality      TEXT NOT NULL DEFAULT '[]',
        voice            TEXT NOT NULL DEFAULT '{}',
        version          INTEGER NOT NULL DEFAULT 1,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS story_characters_user_idx ON story_characters (user_id, updated_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS story_series (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id TEXT,
        title        TEXT NOT NULL,
        memory       TEXT NOT NULL DEFAULT '{}',
        episodes     INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS story_series_user_idx ON story_series (user_id, updated_at DESC)`;

    await q`
      CREATE TABLE IF NOT EXISTS stories (
        id                TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id      TEXT,
        series_id         TEXT,
        episode           INTEGER NOT NULL DEFAULT 1,
        title             TEXT NOT NULL,
        dedication        TEXT NOT NULL DEFAULT '',
        category          TEXT NOT NULL DEFAULT '',
        theme             TEXT NOT NULL DEFAULT '',
        language_code     TEXT NOT NULL DEFAULT 'en',
        request           TEXT NOT NULL DEFAULT '',
        pages             TEXT NOT NULL DEFAULT '[]',
        character_version INTEGER NOT NULL DEFAULT 1,
        product           TEXT NOT NULL DEFAULT 'ebook',
        favorite          BOOLEAN NOT NULL DEFAULT false,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS stories_user_idx ON stories (user_id, created_at DESC)`;
    await q`CREATE INDEX IF NOT EXISTS stories_series_idx ON stories (series_id, episode)`;
    // For databases that already created `stories` before favourites existed.
    try {
      await alterExtra(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false`);
    } catch {
      /* already present */
    }

    await q`
      CREATE TABLE IF NOT EXISTS story_artifacts (
        id         TEXT PRIMARY KEY,
        story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending',
        url        TEXT,
        detail     TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await q`CREATE UNIQUE INDEX IF NOT EXISTS story_artifacts_story_kind ON story_artifacts (story_id, kind)`;
  } else {
    const exec = async (text: string) => {
      const strings = Object.assign([text], { raw: [text] }) as TemplateStringsArray;
      await q(strings);
    };
    await exec(`
      CREATE TABLE IF NOT EXISTS publish_items (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creation_id TEXT,
        title       TEXT NOT NULL,
        caption     TEXT NOT NULL DEFAULT '',
        platforms   TEXT NOT NULL DEFAULT '[]',
        status      TEXT NOT NULL DEFAULT 'draft',
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS publish_items_user_idx ON publish_items (user_id, updated_at DESC)`);
    await exec(`
      CREATE TABLE IF NOT EXISTS schedule_items (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creation_id  TEXT,
        title        TEXT NOT NULL,
        platforms    TEXT NOT NULL DEFAULT '[]',
        scheduled_at TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'planned',
        notes        TEXT NOT NULL DEFAULT '',
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS schedule_items_user_idx ON schedule_items (user_id, scheduled_at)`);
    await exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id             TEXT PRIMARY KEY,
        owner_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_email   TEXT NOT NULL,
        member_user_id TEXT,
        role           TEXT NOT NULL DEFAULT 'member',
        status         TEXT NOT NULL DEFAULT 'pending',
        created_at     TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS team_members_owner_idx ON team_members (owner_user_id, created_at DESC)`);
    await exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        href       TEXT,
        read_at    TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC)`);
    await exec(`
      CREATE TABLE IF NOT EXISTS workspace_settings (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        timezone     TEXT NOT NULL DEFAULT 'UTC',
        notify_email INTEGER NOT NULL DEFAULT 0,
        notify_inapp INTEGER NOT NULL DEFAULT 1,
        prefs        TEXT NOT NULL DEFAULT '{}',
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`
      CREATE TABLE IF NOT EXISTS brand_kits (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        brand_name   TEXT,
        colors       TEXT,
        heading_font TEXT,
        body_font    TEXT,
        logo_url     TEXT,
        extra        TEXT,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    try {
      await exec(`ALTER TABLE brand_kits ADD COLUMN extra TEXT`);
    } catch {
      /* already present */
    }

    await exec(`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id                 TEXT PRIMARY KEY,
        user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider           TEXT NOT NULL,
        external_id        TEXT NOT NULL,
        handle             TEXT NOT NULL DEFAULT '',
        display_name       TEXT NOT NULL DEFAULT '',
        scopes             TEXT NOT NULL DEFAULT '',
        access_token_enc   TEXT,
        refresh_token_enc  TEXT,
        expires_at         TEXT,
        status             TEXT NOT NULL DEFAULT 'connected',
        meta               TEXT NOT NULL DEFAULT '{}',
        created_at         TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (user_id, provider, external_id)
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS social_accounts_user_idx ON social_accounts (user_id, provider)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS business_profiles (
        user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        company              TEXT NOT NULL DEFAULT '',
        industry             TEXT NOT NULL DEFAULT '',
        location             TEXT NOT NULL DEFAULT '',
        audience             TEXT NOT NULL DEFAULT '',
        style                TEXT NOT NULL DEFAULT '',
        goals                TEXT NOT NULL DEFAULT '',
        approval_mode        TEXT NOT NULL DEFAULT 'require',
        onboarding_complete  INTEGER NOT NULL DEFAULT 0,
        updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS schedule_account_targets (
        schedule_item_id TEXT NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
        social_account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
        PRIMARY KEY (schedule_item_id, social_account_id)
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS publish_account_targets (
        publish_item_id   TEXT NOT NULL REFERENCES publish_items(id) ON DELETE CASCADE,
        social_account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
        PRIMARY KEY (publish_item_id, social_account_id)
      )`);

    for (const col of [
      `ALTER TABLE schedule_items ADD COLUMN approval_status TEXT DEFAULT 'draft'`,
      `ALTER TABLE schedule_items ADD COLUMN amber_placed INTEGER DEFAULT 0`,
      `ALTER TABLE schedule_items ADD COLUMN caption TEXT DEFAULT ''`,
      `ALTER TABLE schedule_items ADD COLUMN hashtags TEXT DEFAULT ''`,
      `ALTER TABLE schedule_items ADD COLUMN publish_result TEXT`,
      `ALTER TABLE publish_items ADD COLUMN schedule_id TEXT`,
      `ALTER TABLE publish_items ADD COLUMN account_ids TEXT DEFAULT '[]'`,
      `ALTER TABLE publish_items ADD COLUMN approval_status TEXT DEFAULT 'draft'`,
      `ALTER TABLE publish_items ADD COLUMN publish_result TEXT`,
    ]) {
      try {
        await exec(col);
      } catch {
        /* present */
      }
    }

    await exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`
      CREATE TABLE IF NOT EXISTS amber_action_logs (
        id             TEXT PRIMARY KEY,
        actor_user_id  TEXT,
        actor_email    TEXT,
        kind           TEXT NOT NULL,
        title          TEXT NOT NULL,
        detail         TEXT NOT NULL DEFAULT '{}',
        href           TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_action_logs_created_idx ON amber_action_logs (created_at DESC)`);

    try {
      await exec(`ALTER TABLE business_profiles ADD COLUMN brand_rules TEXT DEFAULT ''`);
    } catch {
      /* present */
    }
    for (const col of [
      `ALTER TABLE business_profiles ADD COLUMN competitors TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN service_areas TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN seasonal_trends TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN products TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN services TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN marketing_objectives TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN intelligence TEXT DEFAULT '{}'`,
    ]) {
      try {
        await exec(col);
      } catch {
        /* present */
      }
    }

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_infra_emails (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        email      TEXT NOT NULL,
        role       TEXT NOT NULL DEFAULT 'other',
        notes      TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_infra_emails_user_idx ON amber_infra_emails (user_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_service_links (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        service    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'planned',
        meta       TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_service_links_user_idx ON amber_service_links (user_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_account_map (
        social_account_id TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL,
        infra_role        TEXT NOT NULL DEFAULT 'social',
        notes             TEXT NOT NULL DEFAULT ''
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_weeks (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        week_start TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'running',
        strategy   TEXT NOT NULL DEFAULT '{}',
        report     TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_weeks_user_idx ON amber_weeks (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_tasks (
        id         TEXT PRIMARY KEY,
        week_id    TEXT NOT NULL,
        kind       TEXT NOT NULL,
        payload    TEXT NOT NULL DEFAULT '{}',
        status     TEXT NOT NULL DEFAULT 'planned',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_tasks_week_idx ON amber_tasks (week_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_content_requests (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        week_id      TEXT,
        parent_id    TEXT,
        title        TEXT NOT NULL,
        script       TEXT NOT NULL DEFAULT '',
        platforms    TEXT NOT NULL DEFAULT '[]',
        tool_slug    TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'planned',
        creation_id  TEXT,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_content_requests_user_idx ON amber_content_requests (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_learning (
        user_id    TEXT PRIMARY KEY,
        patterns   TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_missions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        goal       TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'draft',
        strategy   TEXT NOT NULL DEFAULT '{}',
        report     TEXT NOT NULL DEFAULT '{}',
        week_id    TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_missions_user_idx ON amber_missions (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_productions (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL,
        mission_id      TEXT,
        week_id         TEXT,
        parent_id       TEXT,
        title           TEXT NOT NULL,
        script          TEXT NOT NULL DEFAULT '',
        platforms       TEXT NOT NULL DEFAULT '[]',
        tool_slug       TEXT NOT NULL DEFAULT 'shorts-20',
        status          TEXT NOT NULL DEFAULT 'planned',
        review_status   TEXT NOT NULL DEFAULT 'pending',
        review_notes    TEXT NOT NULL DEFAULT '',
        creation_id     TEXT,
        caption         TEXT NOT NULL DEFAULT '',
        hashtags        TEXT NOT NULL DEFAULT '',
        schedule_id     TEXT,
        publish_id      TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_productions_user_idx ON amber_productions (user_id, created_at DESC)`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_productions_mission_idx ON amber_productions (mission_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_reports (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        week_id    TEXT,
        mission_id TEXT,
        period     TEXT NOT NULL,
        summary    TEXT NOT NULL DEFAULT '',
        body       TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_reports_user_idx ON amber_reports (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_verification_holds (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        provider     TEXT NOT NULL,
        step         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'paused',
        explanation  TEXT NOT NULL DEFAULT '',
        resume_hint  TEXT NOT NULL DEFAULT '',
        meta         TEXT NOT NULL DEFAULT '{}',
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at  TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_verification_holds_user_idx ON amber_verification_holds (user_id, status)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_performance (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        kind       TEXT NOT NULL,
        ref_id     TEXT,
        metrics    TEXT NOT NULL DEFAULT '{}',
        note       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_performance_user_idx ON amber_performance (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_campaigns (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        mission_id   TEXT,
        title        TEXT NOT NULL,
        objective    TEXT NOT NULL DEFAULT '',
        audience     TEXT NOT NULL DEFAULT '',
        strategy     TEXT NOT NULL DEFAULT '{}',
        package      TEXT NOT NULL DEFAULT '{}',
        status       TEXT NOT NULL DEFAULT 'draft',
        decision_log TEXT NOT NULL DEFAULT '[]',
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_campaigns_user_idx ON amber_campaigns (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_decisions (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        kind       TEXT NOT NULL,
        priority   INTEGER NOT NULL DEFAULT 50,
        title      TEXT NOT NULL,
        rationale  TEXT NOT NULL DEFAULT '',
        action     TEXT NOT NULL DEFAULT '',
        status     TEXT NOT NULL DEFAULT 'open',
        meta       TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_decisions_user_idx ON amber_decisions (user_id, priority ASC, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_agent_jobs (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        agent        TEXT NOT NULL,
        title        TEXT NOT NULL,
        brief        TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'queued',
        result       TEXT NOT NULL DEFAULT '{}',
        campaign_id  TEXT,
        department   TEXT NOT NULL DEFAULT '',
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_agent_jobs_user_idx ON amber_agent_jobs (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_ops_metrics (
        id         TEXT PRIMARY KEY,
        kind       TEXT NOT NULL,
        workspace_user_id TEXT,
        cycle_id   TEXT,
        metrics    TEXT NOT NULL DEFAULT '{}',
        note       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_ops_metrics_created_idx ON amber_ops_metrics (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_cycle_runs (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'running',
        goal            TEXT NOT NULL DEFAULT '',
        steps           TEXT NOT NULL DEFAULT '[]',
        decisions       TEXT NOT NULL DEFAULT '[]',
        learning_delta  TEXT NOT NULL DEFAULT '{}',
        report_id       TEXT,
        mission_id      TEXT,
        campaign_id     TEXT,
        owner_asks      TEXT NOT NULL DEFAULT '[]',
        duration_ms     INTEGER NOT NULL DEFAULT 0,
        error           TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at    TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_cycle_runs_user_idx ON amber_cycle_runs (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_executive_briefs (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL,
        period           TEXT NOT NULL,
        goals_snapshot   TEXT NOT NULL DEFAULT '{}',
        health_snapshot  TEXT NOT NULL DEFAULT '{}',
        recommendations  TEXT NOT NULL DEFAULT '[]',
        narrative        TEXT NOT NULL DEFAULT '',
        confidence       REAL NOT NULL DEFAULT 0,
        cycle_id         TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_executive_briefs_user_idx ON amber_executive_briefs (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_departments (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL,
        slug         TEXT NOT NULL,
        label        TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'active',
        priorities   TEXT NOT NULL DEFAULT '[]',
        health_score REAL NOT NULL DEFAULT 0,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (user_id, slug)
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_departments_user_idx ON amber_departments (user_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_memory (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        kind       TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        weight     REAL NOT NULL DEFAULT 1,
        evidence   TEXT NOT NULL DEFAULT '[]',
        cycle_id   TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_memory_user_idx ON amber_memory (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_objectives (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL,
        goal             TEXT NOT NULL,
        status           TEXT NOT NULL DEFAULT 'active',
        success_metrics  TEXT NOT NULL DEFAULT '[]',
        plan             TEXT NOT NULL DEFAULT '{}',
        deadline         TEXT,
        mission_id       TEXT,
        campaign_id      TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_objectives_user_idx ON amber_objectives (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_health_snapshots (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        scores     TEXT NOT NULL DEFAULT '{}',
        notes      TEXT NOT NULL DEFAULT '',
        cycle_id   TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_health_snapshots_user_idx ON amber_health_snapshots (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_improvements (
        id                TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL,
        area              TEXT NOT NULL,
        recommendation    TEXT NOT NULL,
        expected_impact   TEXT NOT NULL DEFAULT '',
        effort            TEXT NOT NULL DEFAULT 'medium',
        status            TEXT NOT NULL DEFAULT 'open',
        evidence          TEXT NOT NULL DEFAULT '[]',
        explanation       TEXT NOT NULL DEFAULT '{}',
        created_at        TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_improvements_user_idx ON amber_improvements (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_orchestration_runs (
        id                  TEXT PRIMARY KEY,
        user_id             TEXT NOT NULL,
        cycle_id            TEXT,
        objective_id        TEXT,
        executive_brief_id  TEXT,
        campaign_id         TEXT,
        mission_id          TEXT,
        report_id           TEXT,
        department_jobs     TEXT NOT NULL DEFAULT '[]',
        status              TEXT NOT NULL DEFAULT 'running',
        created_at          TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at        TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_orchestration_runs_user_idx ON amber_orchestration_runs (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_ops_alerts (
        id              TEXT PRIMARY KEY,
        severity        TEXT NOT NULL DEFAULT 'warning',
        kind            TEXT NOT NULL,
        title           TEXT NOT NULL,
        detail          TEXT NOT NULL DEFAULT '',
        workspace_user_id TEXT,
        status          TEXT NOT NULL DEFAULT 'open',
        recommended     TEXT NOT NULL DEFAULT '',
        meta            TEXT NOT NULL DEFAULT '{}',
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at     TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_ops_alerts_created_idx ON amber_ops_alerts (created_at DESC)`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_ops_alerts_status_idx ON amber_ops_alerts (status, severity)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_recovery_events (
        id              TEXT PRIMARY KEY,
        workspace_user_id TEXT,
        action          TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'started',
        detail          TEXT NOT NULL DEFAULT '{}',
        actor_email     TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at    TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_recovery_events_created_idx ON amber_recovery_events (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_readiness_snapshots (
        id           TEXT PRIMARY KEY,
        score        INTEGER NOT NULL DEFAULT 0,
        breakdown    TEXT NOT NULL DEFAULT '{}',
        explanations TEXT NOT NULL DEFAULT '{}',
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_readiness_snapshots_created_idx ON amber_readiness_snapshots (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_ops_checkpoints (
        id           TEXT PRIMARY KEY,
        cycle_id     TEXT NOT NULL,
        user_id      TEXT NOT NULL,
        step         TEXT NOT NULL,
        status       TEXT NOT NULL DEFAULT 'ok',
        detail       TEXT NOT NULL DEFAULT '{}',
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_ops_checkpoints_cycle_idx ON amber_ops_checkpoints (cycle_id, created_at ASC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_strategic_plans (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        title       TEXT NOT NULL,
        horizon     TEXT NOT NULL DEFAULT 'quarterly',
        status      TEXT NOT NULL DEFAULT 'active',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_strategic_plans_user_idx ON amber_strategic_plans (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_initiatives (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        plan_id       TEXT,
        objective_id  TEXT,
        title         TEXT NOT NULL,
        department    TEXT NOT NULL DEFAULT 'marketing',
        status        TEXT NOT NULL DEFAULT 'active',
        priority      INTEGER NOT NULL DEFAULT 50,
        progress      REAL NOT NULL DEFAULT 0,
        body          TEXT NOT NULL DEFAULT '{}',
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_initiatives_user_idx ON amber_initiatives (user_id, status, priority ASC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_projects (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL,
        initiative_id  TEXT,
        title          TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'active',
        progress       REAL NOT NULL DEFAULT 0,
        deadline       TEXT,
        body           TEXT NOT NULL DEFAULT '{}',
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_projects_user_idx ON amber_projects (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_exec_tasks (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        project_id    TEXT,
        title         TEXT NOT NULL,
        agent         TEXT NOT NULL DEFAULT '',
        department    TEXT NOT NULL DEFAULT 'marketing',
        status        TEXT NOT NULL DEFAULT 'queued',
        depends_on    TEXT NOT NULL DEFAULT '[]',
        quality       REAL NOT NULL DEFAULT 0,
        body          TEXT NOT NULL DEFAULT '{}',
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_exec_tasks_user_idx ON amber_exec_tasks (user_id, status, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_kpis (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        slug        TEXT NOT NULL,
        label       TEXT NOT NULL,
        value       REAL NOT NULL DEFAULT 0,
        target      REAL NOT NULL DEFAULT 0,
        unit        TEXT NOT NULL DEFAULT '',
        trend       TEXT NOT NULL DEFAULT 'flat',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_kpis_user_idx ON amber_kpis (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_risks (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        severity    TEXT NOT NULL DEFAULT 'medium',
        title       TEXT NOT NULL,
        detail      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'open',
        recommended TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_risks_user_idx ON amber_risks (user_id, status, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_approvals (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        kind        TEXT NOT NULL,
        title       TEXT NOT NULL,
        detail      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'pending',
        impact      TEXT NOT NULL DEFAULT 'high',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at TEXT,
        resolved_by TEXT
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_approvals_user_idx ON amber_approvals (user_id, status, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_exec_briefings (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        period      TEXT NOT NULL,
        kind        TEXT NOT NULL DEFAULT 'weekly',
        summary     TEXT NOT NULL DEFAULT '',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_exec_briefings_user_idx ON amber_exec_briefings (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_optimizations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        area        TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        expected_impact TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'open',
        evidence    TEXT NOT NULL DEFAULT '[]',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_optimizations_user_idx ON amber_optimizations (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_organizations (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'active',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_enterprise_workspaces (
        id              TEXT PRIMARY KEY,
        org_id          TEXT,
        user_id         TEXT NOT NULL UNIQUE,
        label           TEXT NOT NULL DEFAULT '',
        status          TEXT NOT NULL DEFAULT 'active',
        readiness_score INTEGER NOT NULL DEFAULT 0,
        health_score    INTEGER NOT NULL DEFAULT 0,
        meta            TEXT NOT NULL DEFAULT '{}',
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_enterprise_workspaces_org_idx ON amber_enterprise_workspaces (org_id)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_kg_nodes (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        ref_id      TEXT,
        title       TEXT NOT NULL,
        body        TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_kg_nodes_user_idx ON amber_kg_nodes (user_id, kind)`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_kg_nodes_kind_idx ON amber_kg_nodes (kind, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_kg_edges (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        from_node   TEXT NOT NULL,
        to_node     TEXT NOT NULL,
        relation    TEXT NOT NULL,
        weight      REAL NOT NULL DEFAULT 1,
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_kg_edges_from_idx ON amber_kg_edges (from_node)`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_kg_edges_to_idx ON amber_kg_edges (to_node)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_forecasts (
        id          TEXT PRIMARY KEY,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        title       TEXT NOT NULL,
        confidence  REAL NOT NULL DEFAULT 0.5,
        prediction  TEXT NOT NULL DEFAULT '',
        mitigation  TEXT NOT NULL DEFAULT '',
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_forecasts_created_idx ON amber_forecasts (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_benchmarks (
        id          TEXT PRIMARY KEY,
        scope       TEXT NOT NULL,
        metric      TEXT NOT NULL,
        subject_a   TEXT NOT NULL,
        subject_b   TEXT NOT NULL,
        value_a     REAL NOT NULL DEFAULT 0,
        value_b     REAL NOT NULL DEFAULT 0,
        winner      TEXT NOT NULL DEFAULT '',
        note        TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_benchmarks_created_idx ON amber_benchmarks (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_resource_allocations (
        id          TEXT PRIMARY KEY,
        user_id     TEXT,
        resource    TEXT NOT NULL,
        assigned_to TEXT NOT NULL,
        weight      REAL NOT NULL DEFAULT 1,
        reason      TEXT NOT NULL DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'active',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_resource_allocations_user_idx ON amber_resource_allocations (user_id, created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_governance_policies (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        slug        TEXT NOT NULL,
        title       TEXT NOT NULL,
        rule        TEXT NOT NULL DEFAULT '',
        threshold   REAL NOT NULL DEFAULT 0,
        enforced    INTEGER NOT NULL DEFAULT 1,
        meta        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_governance_policies_slug_idx ON amber_governance_policies (slug)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_business_reviews (
        id          TEXT PRIMARY KEY,
        org_id      TEXT,
        user_id     TEXT,
        kind        TEXT NOT NULL,
        period      TEXT NOT NULL,
        summary     TEXT NOT NULL DEFAULT '',
        body        TEXT NOT NULL DEFAULT '{}',
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_business_reviews_created_idx ON amber_business_reviews (created_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS amber_decision_intel (
        id              TEXT PRIMARY KEY,
        user_id         TEXT,
        title           TEXT NOT NULL,
        evidence        TEXT NOT NULL DEFAULT '[]',
        confidence      REAL NOT NULL DEFAULT 0.5,
        expected_impact TEXT NOT NULL DEFAULT '',
        alternatives    TEXT NOT NULL DEFAULT '[]',
        decision        TEXT NOT NULL DEFAULT '',
        outcome         TEXT NOT NULL DEFAULT '',
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS amber_decision_intel_user_idx ON amber_decision_intel (user_id, created_at DESC)`);

    for (const col of [
      `ALTER TABLE amber_productions ADD COLUMN campaign_id TEXT`,
      `ALTER TABLE amber_productions ADD COLUMN quality_score REAL DEFAULT 0`,
      `ALTER TABLE amber_productions ADD COLUMN retry_count INTEGER DEFAULT 0`,
      `ALTER TABLE business_profiles ADD COLUMN ideal_customer TEXT DEFAULT ''`,
      `ALTER TABLE business_profiles ADD COLUMN growth_history TEXT DEFAULT ''`,
      `ALTER TABLE amber_agent_jobs ADD COLUMN department TEXT DEFAULT ''`,
    ]) {
      try {
        await exec(col);
      } catch {
        /* present */
      }
    }

    // Storybook — see the note on the postgres side for why these are four
    // tables. Same columns, sqlite spellings.
    await exec(`
      CREATE TABLE IF NOT EXISTS story_characters (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name             TEXT NOT NULL,
        age_band         TEXT,
        face             TEXT NOT NULL DEFAULT '',
        hair             TEXT NOT NULL DEFAULT '',
        clothing         TEXT NOT NULL DEFAULT '',
        body_proportions TEXT,
        animation_style  TEXT,
        expressions      TEXT NOT NULL DEFAULT '[]',
        personality      TEXT NOT NULL DEFAULT '[]',
        voice            TEXT NOT NULL DEFAULT '{}',
        version          INTEGER NOT NULL DEFAULT 1,
        created_at       TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS story_characters_user_idx ON story_characters (user_id, updated_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS story_series (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id TEXT,
        title        TEXT NOT NULL,
        memory       TEXT NOT NULL DEFAULT '{}',
        episodes     INTEGER NOT NULL DEFAULT 0,
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS story_series_user_idx ON story_series (user_id, updated_at DESC)`);

    await exec(`
      CREATE TABLE IF NOT EXISTS stories (
        id                TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id      TEXT,
        series_id         TEXT,
        episode           INTEGER NOT NULL DEFAULT 1,
        title             TEXT NOT NULL,
        dedication        TEXT NOT NULL DEFAULT '',
        category          TEXT NOT NULL DEFAULT '',
        theme             TEXT NOT NULL DEFAULT '',
        language_code     TEXT NOT NULL DEFAULT 'en',
        request           TEXT NOT NULL DEFAULT '',
        pages             TEXT NOT NULL DEFAULT '[]',
        character_version INTEGER NOT NULL DEFAULT 1,
        product           TEXT NOT NULL DEFAULT 'ebook',
        favorite          INTEGER NOT NULL DEFAULT 0,
        created_at        TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE INDEX IF NOT EXISTS stories_user_idx ON stories (user_id, created_at DESC)`);
    await exec(`CREATE INDEX IF NOT EXISTS stories_series_idx ON stories (series_id, episode)`);
    try {
      await exec(`ALTER TABLE stories ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0`);
    } catch {
      /* already present */
    }

    await exec(`
      CREATE TABLE IF NOT EXISTS story_artifacts (
        id         TEXT PRIMARY KEY,
        story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        kind       TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending',
        url        TEXT,
        detail     TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS story_artifacts_story_kind ON story_artifacts (story_id, kind)`);
  }
}

export async function ensureSchema(): Promise<boolean> {
  const q = await sqlAsync();
  if (!q) return false;
  if (ensured) return true;

  const pg = driver() === "postgres";

  // Production DBs already have core tables. Probe first so signup/login never
  // re-run a long DDL chain — then still ensure workspace tables exist.
  try {
    await q`SELECT 1 FROM users LIMIT 1`;
    await ensureWorkspaceTables(q);
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
        extra        TEXT,
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
        extra        TEXT,
        updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
  }

  await ensureWorkspaceTables(q);
  ensured = true;
  return true;
}

export type { Row };
