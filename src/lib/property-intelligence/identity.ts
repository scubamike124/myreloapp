import { sqlAsync, ensureSchema, dbConfigured } from "@/lib/db";

/** Pure identity helpers — no database for email compare; async for DB role. */

export function isReeloOwnerEmail(email: string | null | undefined): boolean {
  const owner = (process.env.REELO_OWNER_EMAIL || "scubamike124@gmail.com").toLowerCase();
  return String(email || "").trim().toLowerCase() === owner;
}

/** @deprecated Prefer DB role via isReeloOwnerByUserId / currentUser().role === 'OWNER' */
export function isReeloOwner(email: string | null | undefined): boolean {
  return isReeloOwnerEmail(email);
}

/** Authoritative Owner check from persisted users.role. */
export async function isReeloOwnerByUserId(userId: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return false;
  const rows = (await q`SELECT role FROM users WHERE id = ${userId} LIMIT 1`) as { role: string }[];
  return rows[0]?.role === "OWNER";
}

export function detectDuplicateProperties(
  rows: Array<{ propertyId: string; canonicalKey?: string; apn?: string; county?: string }>,
) {
  const byId = new Set<string>();
  const byCanonical = new Map<string, Set<string>>();
  const byApn = new Map<string, Set<string>>();
  for (const r of rows) {
    const id = String(r.propertyId);
    byId.add(id);
    const ck = String(r.canonicalKey || "").trim();
    if (ck) {
      const set = byCanonical.get(ck) || new Set();
      set.add(id);
      byCanonical.set(ck, set);
    }
    const apn = String(r.apn || "").replace(/[^A-Z0-9]/gi, "");
    if (apn) {
      const k = `${String(r.county || "").toLowerCase()}:${apn}`;
      const set = byApn.get(k) || new Set();
      set.add(id);
      byApn.set(k, set);
    }
  }
  return {
    uniquePropertyIds: byId.size,
    canonicalCollisions: [...byCanonical.values()].filter((s) => s.size > 1).map((s) => [...s]),
    apnCollisions: [...byApn.values()].filter((s) => s.size > 1).map((s) => [...s]),
  };
}
