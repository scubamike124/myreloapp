import { cookies } from "next/headers";
import { sqlAsync, ensureSchema, dbConfigured } from "@/lib/db";
import { ADMIN_COOKIE, createSessionToken, verifySessionToken } from "@/lib/admin-auth";
import { SESSION_COOKIE, currentUser, type User, type UserRole } from "@/lib/accounts";
export { tryClaimFirstOwner, ownerAlreadyClaimed } from "@/lib/owner-claim";

/**
 * Roles are persisted on users.role in the database.
 * OWNER is claimed exactly once (first successful Google login).
 * ADMIN can be granted later by the Owner. Never trust the client for this.
 */

export function isPrivilegedRole(role: UserRole | string | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isOwnerRole(role: UserRole | string | null | undefined): boolean {
  return role === "OWNER";
}

/** True when this user has the DB OWNER role (complete access, no plan/token limits). */
export async function userHasOwnerRole(userId: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return false;
  const rows = (await q`SELECT role FROM users WHERE id = ${userId} LIMIT 1`) as { role: string }[];
  return rows[0]?.role === "OWNER";
}

export async function userHasAdminAccess(userId: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return false;
  const rows = (await q`SELECT role FROM users WHERE id = ${userId} LIMIT 1`) as { role: string }[];
  return isPrivilegedRole(rows[0]?.role);
}

/** Owner may promote another user to ADMIN (not OWNER). */
export async function promoteToAdmin(actorUserId: string, targetUserId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await userHasOwnerRole(actorUserId))) {
    return { error: "Only the Owner can promote administrators." };
  }
  if (actorUserId === targetUserId) return { error: "You already have Owner access." };

  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return { error: "Accounts unavailable." };

  const target = (await q`SELECT id, role FROM users WHERE id = ${targetUserId}`) as { id: string; role: string }[];
  if (!target[0]) return { error: "User not found." };
  if (target[0].role === "OWNER") return { error: "Cannot change the Owner role." };

  await q`UPDATE users SET role = 'ADMIN' WHERE id = ${targetUserId} AND role <> 'OWNER'`;
  return { ok: true };
}

export async function demoteToUser(actorUserId: string, targetUserId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await userHasOwnerRole(actorUserId))) {
    return { error: "Only the Owner can change administrator roles." };
  }
  if (actorUserId === targetUserId) return { error: "Cannot demote the Owner." };

  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return { error: "Accounts unavailable." };

  await q`UPDATE users SET role = 'USER' WHERE id = ${targetUserId} AND role = 'ADMIN'`;
  return { ok: true };
}

/**
 * Server gate for /api/admin/* and privileged pages.
 * Accepts break-glass ADMIN_PASSWORD session OR a signed-in Owner/Admin (DB role).
 */
export async function requireAdminAccess(): Promise<
  { ok: true; via: "admin_password" | "role"; user: User | null } | { ok: false; status: 401 | 403 }
> {
  const user = await currentUser().catch(() => null);
  if (user && isPrivilegedRole(user.role)) {
    return { ok: true, via: "role", user };
  }

  const store = await cookies();
  if (await verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return { ok: true, via: "admin_password", user };
  }

  if (!user) return { ok: false, status: 401 };
  return { ok: false, status: 403 };
}

/** Mint admin cookie when a privileged user signs in so Edge middleware can pass /admin. */
export async function attachAdminSessionIfPrivileged(role: UserRole): Promise<string | null> {
  if (!isPrivilegedRole(role)) return null;
  return createSessionToken();
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export { SESSION_COOKIE, ADMIN_COOKIE };
