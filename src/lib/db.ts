import { neon } from "@neondatabase/serverless";

// ---------------------------------------------------------------------------
// Database access.
//
// Postgres (Neon) holds anything that must not be forgeable: who a user is,
// how many tokens they hold, and every movement of those tokens. None of it
// can live in the browser — a balance in localStorage is a balance the user
// can edit.
//
// The app runs without a database. Every call here reports "not configured"
// rather than throwing, so the product degrades the way the rest of it does:
// features that need accounts say so, everything else keeps working.
// ---------------------------------------------------------------------------

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

type Row = Record<string, unknown>;

/** Tagged-template query. Parameters are bound, never interpolated. */
export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/**
 * Schema. Created on demand and safe to run repeatedly, so there is no separate
 * migration step to forget on a fresh deploy.
 *
 * Money-adjacent decisions worth stating:
 * - Balances are NOT stored as a mutable number. The ledger is the truth and
 *   the balance is its sum, so a bug can never silently desync a balance from
 *   the transactions that produced it.
 * - Every ledger row carries a `ref` unique per source event, so a Stripe
 *   webhook delivered twice credits tokens once.
 */
let ensured = false;

export async function ensureSchema(): Promise<boolean> {
  const q = sql();
  if (!q) return false;
  if (ensured) return true;

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
      delta      INTEGER NOT NULL,
      reason     TEXT NOT NULL,
      ref        TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

  // One credit per external event, enforced by the database rather than by
  // remembering to check first.
  await q`CREATE UNIQUE INDEX IF NOT EXISTS token_ledger_ref_key ON token_ledger (ref) WHERE ref IS NOT NULL`;
  await q`CREATE INDEX IF NOT EXISTS token_ledger_user_idx ON token_ledger (user_id, created_at DESC)`;

  // Finished work. Previously this existed only in the browser that made it,
  // so clearing site data or switching device lost everything a customer had
  // paid for. media_url points at durable storage when it is configured.
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
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await q`CREATE INDEX IF NOT EXISTS creations_user_idx ON creations (user_id, created_at DESC)`;

  await q`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    )`;
  await q`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`;

  ensured = true;
  return true;
}

export type { Row };
