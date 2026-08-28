// ---------------------------------------------------------------------------
// The Command Center's one system account.
//
// Several real, pre-existing customer features (engine_jobs production queue,
// scheduled_posts, social_accounts) are keyed to a signed-in customer
// (currentUser(), @/lib/accounts) — there is no such session behind the admin
// password gate (@/lib/admin-auth, a separate single-session system). Rather
// than duplicate this account-creation logic in every Command Center module
// that needs one of those features, it lives here once.
//
// This is the same "Reelo acting on its own behalf" pattern engine_runs
// already uses for the autonomous commercial engine that markets Reelo's own
// features (see its comment in db.ts: "these runs belong to Reelo, not to a
// customer") — Command Center productions, schedules and social connections
// are Reelo's own operational use of Reelo, not customer impersonation.
// ---------------------------------------------------------------------------

import { randomBytes } from "node:crypto";
import { dbConfigured, ensureSchema, sqlAsync } from "@/lib/db";

export const ADMIN_USER_ID = "command-center-system";
const ADMIN_USER_EMAIL = "command-center@reelo.internal";

/**
 * Idempotently ensures the Command Center's system user row exists. The
 * password hash is a random value nobody has or needs: this account is never
 * reachable through the real login flow (a made-up @reelo.internal address),
 * it only anchors foreign keys on the features above.
 */
export async function ensureAdminSystemUser(): Promise<string | null> {
  if (!dbConfigured()) return null;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return null;

  const existing = (await q`SELECT id FROM users WHERE id = ${ADMIN_USER_ID}`) as unknown as { id: string }[];
  if (existing.length > 0) return ADMIN_USER_ID;

  await q`
    INSERT INTO users (id, email, password_hash, name)
    VALUES (${ADMIN_USER_ID}, ${ADMIN_USER_EMAIL}, ${randomBytes(32).toString("hex")}, 'Command Center')
    ON CONFLICT (id) DO NOTHING`;
  return ADMIN_USER_ID;
}
