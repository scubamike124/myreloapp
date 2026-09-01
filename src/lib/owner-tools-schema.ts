/**
 * Additive DDL for Relo owner tools restored from pre-PR64 work:
 * Amber Earnings, Property Intelligence, Google Sign-In / OWNER role.
 *
 * Soft-fails every statement so auth never breaks on existing production DBs.
 */

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

async function exec(q: Sql, text: string): Promise<void> {
  const strings = Object.assign([text], { raw: [text] }) as TemplateStringsArray;
  await q(strings);
}

async function tryExec(q: Sql, label: string, text: string): Promise<void> {
  try {
    await exec(q, text);
  } catch (err) {
    console.error(`[owner-tools-schema] "${label}" skipped:`, err instanceof Error ? err.message : err);
  }
}

export async function ensureOwnerToolsSchema(q: Sql, pg: boolean): Promise<void> {
  const NOW = pg ? "TIMESTAMPTZ NOT NULL DEFAULT now()" : "TEXT NOT NULL DEFAULT (datetime('now'))";

  // —— Roles / Google Sign-In ——
  await tryExec(q, "users_role", `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'`);
  await tryExec(q, "users_google_sub", `ALTER TABLE users ADD COLUMN google_sub TEXT`);
  await tryExec(
    q,
    "users_auth_provider",
    `ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'`,
  );
  await tryExec(
    q,
    "users_google_sub_uq",
    `CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_uq ON users (google_sub) WHERE google_sub IS NOT NULL`,
  );
  await tryExec(
    q,
    "users_one_owner",
    `CREATE UNIQUE INDEX IF NOT EXISTS users_one_owner ON users (role) WHERE role = 'OWNER'`,
  );
  await tryExec(
    q,
    "platform_meta",
    `CREATE TABLE IF NOT EXISTS platform_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at ${NOW}
    )`,
  );

  // —— Amber Earnings ——
  await tryExec(
    q,
    "amber_earnings",
    `CREATE TABLE IF NOT EXISTS amber_earnings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state_json TEXT NOT NULL DEFAULT '{}',
      taskbounty_api_key TEXT,
      spore_agent_id TEXT,
      moltjobs_api_key TEXT,
      workprotocol_api_key TEXT,
      workprotocol_agent_id TEXT,
      device_code TEXT,
      updated_at ${NOW}
    )`,
  );
  await tryExec(
    q,
    "amber_earnings_platforms",
    `CREATE TABLE IF NOT EXISTS amber_earnings_platforms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      website TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'discovered',
      connected INTEGER NOT NULL DEFAULT 0,
      automation_allowed TEXT NOT NULL DEFAULT 'unknown',
      access_methods TEXT NOT NULL DEFAULT '',
      available_jobs INTEGER NOT NULL DEFAULT 0,
      active_jobs INTEGER NOT NULL DEFAULT 0,
      completed_jobs INTEGER NOT NULL DEFAULT 0,
      revenue_cents INTEGER NOT NULL DEFAULT 0,
      expenses_cents INTEGER NOT NULL DEFAULT 0,
      pending_payout_cents INTEGER NOT NULL DEFAULT 0,
      last_scan_at TEXT,
      last_job_at TEXT,
      reputation TEXT NOT NULL DEFAULT '',
      attention TEXT NOT NULL DEFAULT '',
      research_json TEXT NOT NULL DEFAULT '{}',
      score_json TEXT NOT NULL DEFAULT '{}',
      reject_reason TEXT NOT NULL DEFAULT '',
      reject_category TEXT NOT NULL DEFAULT '',
      paused INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, slug)
    )`,
  );
  await tryExec(
    q,
    "amber_earnings_jobs",
    `CREATE TABLE IF NOT EXISTS amber_earnings_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform_slug TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      customer TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      payout_cents INTEGER NOT NULL DEFAULT 0,
      estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
      expected_profit_cents INTEGER NOT NULL DEFAULT 0,
      actual_cost_cents INTEGER NOT NULL DEFAULT 0,
      actual_profit_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      worker TEXT NOT NULL DEFAULT 'cloud',
      discovered_at TEXT NOT NULL,
      started_at TEXT,
      work_notes TEXT NOT NULL DEFAULT '',
      tests_notes TEXT NOT NULL DEFAULT '',
      submission TEXT NOT NULL DEFAULT '',
      acceptance TEXT NOT NULL DEFAULT '',
      payment_status TEXT NOT NULL DEFAULT 'none',
      error TEXT NOT NULL DEFAULT '',
      reject_reason TEXT NOT NULL DEFAULT '',
      reject_category TEXT NOT NULL DEFAULT '',
      log_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, platform_slug, external_id)
    )`,
  );
  await tryExec(
    q,
    "amber_earnings_ledger",
    `CREATE TABLE IF NOT EXISTS amber_earnings_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform_slug TEXT NOT NULL DEFAULT '',
      job_id TEXT,
      kind TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      confirmed INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT '',
      occurred_at TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    )`,
  );
  await tryExec(
    q,
    "amber_earnings_approvals",
    `CREATE TABLE IF NOT EXISTS amber_earnings_approvals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      action_url TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      resolved_at TEXT
    )`,
  );
  await tryExec(
    q,
    "amber_earnings_locks",
    `CREATE TABLE IF NOT EXISTS amber_earnings_locks (
      lock_key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`,
  );

  for (const col of ["moltjobs_api_key", "workprotocol_api_key", "workprotocol_agent_id"]) {
    await tryExec(
      q,
      `amber_earnings_${col}`,
      `ALTER TABLE amber_earnings ADD COLUMN ${pg ? "IF NOT EXISTS " : ""}${col} TEXT`,
    );
  }

  // —— Property Intelligence (core tables) ——
  await tryExec(
    q,
    "pi_config",
    `CREATE TABLE IF NOT EXISTS pi_config (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      pause_all INTEGER NOT NULL DEFAULT 0,
      pause_property_scanning INTEGER NOT NULL DEFAULT 0,
      pause_investor_discovery INTEGER NOT NULL DEFAULT 0,
      pause_outreach INTEGER NOT NULL DEFAULT 0,
      finder_fee_collection_enabled INTEGER NOT NULL DEFAULT 0,
      attorney_approved INTEGER NOT NULL DEFAULT 0,
      business_postal_address TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT 'Amber Property Intelligence',
      state_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_sources",
    `CREATE TABLE IF NOT EXISTS pi_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT '',
      public_private TEXT NOT NULL DEFAULT 'public',
      api_available INTEGER NOT NULL DEFAULT 0,
      feed_available INTEGER NOT NULL DEFAULT 0,
      permitted_automation TEXT NOT NULL,
      scraping_status TEXT NOT NULL,
      attribution TEXT NOT NULL DEFAULT '',
      commercial_use TEXT NOT NULL DEFAULT '',
      refresh_limit TEXT NOT NULL DEFAULT '',
      rate_limit TEXT NOT NULL DEFAULT '',
      last_terms_review TEXT NOT NULL DEFAULT '',
      reliability INTEGER NOT NULL DEFAULT 50,
      active INTEGER NOT NULL DEFAULT 1,
      last_scan_at TEXT,
      last_success_at TEXT,
      records_collected INTEGER NOT NULL DEFAULT 0,
      last_error TEXT NOT NULL DEFAULT '',
      UNIQUE (user_id, slug)
    )`,
  );
  await tryExec(
    q,
    "pi_properties",
    `CREATE TABLE IF NOT EXISTS pi_properties (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      canonical_key TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'CA',
      zip TEXT NOT NULL DEFAULT '',
      apn TEXT NOT NULL DEFAULT '',
      lat REAL,
      lng REAL,
      assessed_cents INTEGER NOT NULL DEFAULT 0,
      market_cents INTEGER NOT NULL DEFAULT 0,
      deal_score INTEGER NOT NULL DEFAULT 0,
      data_confidence INTEGER NOT NULL DEFAULT 0,
      rejected INTEGER NOT NULL DEFAULT 0,
      reject_reason TEXT NOT NULL DEFAULT '',
      retrieved_at TEXT NOT NULL,
      beds REAL,
      baths REAL,
      sqft INTEGER,
      year_built INTEGER,
      zoning TEXT,
      units REAL,
      first_seen TEXT,
      last_scanned TEXT,
      last_verified TEXT,
      last_changed TEXT,
      research_status TEXT,
      opportunity_score INTEGER,
      classification_json TEXT,
      conflict_json TEXT,
      UNIQUE (user_id, canonical_key)
    )`,
  );
  await tryExec(
    q,
    "pi_property_sources",
    `CREATE TABLE IF NOT EXISTS pi_property_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      source_slug TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      collected_at TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}'
    )`,
  );
  await tryExec(
    q,
    "pi_investors",
    `CREATE TABLE IF NOT EXISTS pi_investors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      zip TEXT NOT NULL DEFAULT '',
      criteria_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_matches",
    `CREATE TABLE IF NOT EXISTS pi_matches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      investor_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_alerts",
    `CREATE TABLE IF NOT EXISTS pi_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_needs_mike",
    `CREATE TABLE IF NOT EXISTS pi_needs_mike (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'action',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_introductions",
    `CREATE TABLE IF NOT EXISTS pi_introductions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT,
      investor_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_finder_fees",
    `CREATE TABLE IF NOT EXISTS pi_finder_fees (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_opportunities",
    `CREATE TABLE IF NOT EXISTS pi_opportunities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      thesis_json TEXT NOT NULL DEFAULT '{}',
      quality_ok INTEGER NOT NULL DEFAULT 0,
      unlocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_research_packages",
    `CREATE TABLE IF NOT EXISTS pi_research_packages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL,
      report_json TEXT NOT NULL DEFAULT '{}',
      fact_count INTEGER NOT NULL DEFAULT 0,
      meaningful INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_client_buy_boxes",
    `CREATE TABLE IF NOT EXISTS pi_client_buy_boxes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      criteria_json TEXT NOT NULL DEFAULT '{}',
      paused INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_payments",
    `CREATE TABLE IF NOT EXISTS pi_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_unlock_acks",
    `CREATE TABLE IF NOT EXISTS pi_unlock_acks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, opportunity_id)
    )`,
  );
  await tryExec(
    q,
    "pi_disclosures",
    `CREATE TABLE IF NOT EXISTS pi_disclosures (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      stripe_session_id TEXT,
      disclosed_at TEXT NOT NULL,
      report_version TEXT NOT NULL DEFAULT '1.0',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_audit",
    `CREATE TABLE IF NOT EXISTS pi_audit (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      source_slug TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      compliance TEXT NOT NULL DEFAULT '',
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_rejections",
    `CREATE TABLE IF NOT EXISTS pi_rejections (
      id TEXT PRIMARY KEY,
      property_id TEXT,
      reason TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_match_history",
    `CREATE TABLE IF NOT EXISTS pi_match_history (
      id TEXT PRIMARY KEY,
      client_user_id TEXT NOT NULL,
      opportunity_id TEXT,
      property_id TEXT,
      event TEXT NOT NULL,
      match_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await tryExec(
    q,
    "pi_success_fee_ledger",
    `CREATE TABLE IF NOT EXISTS pi_success_fee_ledger (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      client_user_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      purchase_price_cents INTEGER,
      fee_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
      collection_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
}
