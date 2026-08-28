// ---------------------------------------------------------------------------
// Command Center scheduling & social — a thin, additive layer over the real,
// pre-existing scheduled_posts / social_accounts tables and their route logic
// (src/app/api/schedule/route.ts, src/app/api/social/route.ts), which this
// file only calls, never edits. Same system-account pattern as
// admin-jobs.ts — see src/lib/ai/admin-account.ts.
//
// Publishing itself is deliberately not here, on purpose, following the
// existing product's own explicit design boundary (see the comment atop
// api/schedule/route.ts): a queue that pretends to publish is worse than one
// that admits it's waiting. A post sits at "queued" until a real OAuth
// connection exists for that channel — same honesty rule Amber already
// follows for customers ("never claim a post was published").
// ---------------------------------------------------------------------------

import { ensureAdminSystemUser } from "@/lib/ai/admin-account";
import { queuePostFor, listScheduledPostsFor, cancelScheduledPostFor, type ScheduledPost } from "@/app/api/schedule/route";
import { listConnectedAccountsFor } from "@/lib/social/store";

export type SchedulePostArgs = { caption: string; mediaId: string | null; platforms: string[]; scheduledAt: string };

export async function scheduleAdminPost(args: SchedulePostArgs) {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false as const, error: "No database configured." };
  return queuePostFor({ userId, ...args });
}

export async function listAdminScheduledPosts(): Promise<{ ok: true; posts: ScheduledPost[] } | { ok: false; error: string }> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };
  return { ok: true, posts: await listScheduledPostsFor(userId) };
}

export async function cancelAdminScheduledPost(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };
  return cancelScheduledPostFor(userId, id);
}

export async function checkAdminSocialAccounts(): Promise<{ ok: true; accounts: { platform: string; handle: string | null; connectedAt: string }[] } | { ok: false; error: string }> {
  const userId = await ensureAdminSystemUser();
  if (!userId) return { ok: false, error: "No database configured." };
  const accounts = await listConnectedAccountsFor(userId);
  return { ok: true, accounts };
}
