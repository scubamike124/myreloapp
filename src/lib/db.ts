import { neon } from "@neondatabase/serverless";
import type { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { isEphemeralFilesystem } from "@/lib/runtime-platform";

// node:sqlite is loaded lazily, never at module top. It is a value import only
// where SQLite is actually used (a host with a real disk). On Vercel — where
// SQLite is never used, and where the runtime may not expose node:sqlite at all
// — a static top-level import would throw at cold start and take down every
// route that touches the database. The type import above is erased at build and
// costs nothing at runtime.
const nodeRequire = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Database access, over two drivers.
//
//   SQLite   — a file on disk, via node:sqlite (built into Node, no package).
//              Needs no account, no signup, no network. Used automatically
//              whenever there is no Postgres URL and the filesystem is
//              writable, which covers local development and any host with a
//              real disk (a VPS, Railway, Render, Fly).
//
//   Postgres — Neon or any Postgres, used whenever a connection string is
//              present. Required on Vercel, whose filesystem is read-only and
//              wiped between requests, so a SQLite file there would silently
//              lose every account written to it.
//
// Both are reached through the same tagged-template `sql()`, so nothing above
// this file knows or cares which is in use.
//
// The point of the SQLite path: everything — accounts, balances, the ledger,
// stored creations — can be built and tested today without signing up for
// anything. Moving to Postgres later is one environment variable.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

function postgresUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

/**
 * SQLite is only safe where the filesystem persists. Vercel sets VERCEL=1 and
 * gives each invocation a fresh read-only filesystem, so falling back to a file
 * there would look like it worked and lose the data.
 */
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
    // Loaded here, not at the top of the file — see the note by the imports.
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

/**
 * Bridge the tagged-template shape onto SQLite. Values become positional
 * parameters — they are never interpolated into the SQL, so the injection
 * safety of the Postgres path is preserved exactly.
 */
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
    // .all() throws on statements that return nothing, so writes use .run().
    if (/^\s*(select|with)/i.test(text) || /returning/i.test(text)) {
      return stmt.all(...(params as never[])) as Row[];
    }
    stmt.run(...(params as never[]));
    return [];
  };
}

export function sql(): Sql | null {
  const url = postgresUrl();
  if (url) return neon(url) as unknown as Sql;
  const db = openSqlite();
  return db ? sqliteSql(db) : null;
}

// --- schema -----------------------------------------------------------------

let ensured = false;

/**
 * Created on demand and safe to run repeatedly, so a fresh machine or a fresh
 * deploy needs no migration step.
 *
 * The two dialects differ in exactly three places — auto-increment, timestamp
 * defaults, and integer casts — so the DDL is written per driver rather than
 * pretending one string works for both.
 */
export async function ensureSchema(): Promise<boolean> {
  const q = sql();
  if (!q) return false;
  if (ensured) return true;

  const pg = driver() === "postgres";

  // Production DBs already have tables. Probe first so signup/login never
  // re-run a long DDL chain (which has failed over Neon HTTP from Workers).
  try {
    await q`SELECT 1 FROM users LIMIT 1`;
    ensured = true;
    return true;
  } catch {
    /* tables missing — fall through to CREATE */
  }

  // Neon only accepts real tagged templates (not sql(["…"])). Keep DDL as
  // literal templates per driver — there is no user input in these strings.
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
