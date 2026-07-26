import { randomUUID } from "node:crypto";
import { logAmberAction } from "@/lib/amber-autonomous";
import type { Sql } from "@/lib/workspace-api";

export const DEFAULT_DEPARTMENTS = [
  { slug: "marketing", label: "Marketing" },
  { slug: "social", label: "Social" },
  { slug: "content", label: "Content" },
  { slug: "brand", label: "Brand" },
  { slug: "customer_comms", label: "Customer Comms" },
  { slug: "analytics", label: "Analytics" },
  { slug: "research", label: "Research" },
] as const;

export async function ensureDepartments(q: Sql, userId: string): Promise<Record<string, unknown>[]> {
  const now = new Date().toISOString();
  const existing = (await q`
    SELECT slug FROM amber_departments WHERE user_id = ${userId}
  `) as { slug: string }[];
  const have = new Set(existing.map((e) => e.slug));
  for (const d of DEFAULT_DEPARTMENTS) {
    if (have.has(d.slug)) continue;
    await q`
      INSERT INTO amber_departments (id, user_id, slug, label, status, priorities, health_score, updated_at)
      VALUES (
        ${randomUUID()}, ${userId}, ${d.slug}, ${d.label}, ${"active"}, ${"[]"}, ${0}, ${now}
      )`;
  }
  return listDepartments(q, userId);
}

export async function listDepartments(q: Sql, userId: string): Promise<Record<string, unknown>[]> {
  const rows = (await q`
    SELECT id, slug, label, status, priorities, health_score AS "healthScore", updated_at AS "updatedAt"
    FROM amber_departments WHERE user_id = ${userId} ORDER BY label ASC
  `) as Record<string, unknown>[];
  return rows.map((r) => {
    let priorities: unknown[] = [];
    try {
      priorities = typeof r.priorities === "string" ? JSON.parse(String(r.priorities)) : (r.priorities as unknown[]) || [];
    } catch {
      priorities = [];
    }
    return { ...r, priorities };
  });
}

export async function setDepartmentPriority(
  q: Sql,
  userId: string,
  slug: string,
  priorities: string[],
  healthScore?: number,
): Promise<void> {
  const now = new Date().toISOString();
  await q`
    UPDATE amber_departments
    SET priorities = ${JSON.stringify(priorities.slice(0, 12))},
        health_score = ${healthScore ?? 0},
        updated_at = ${now}
    WHERE user_id = ${userId} AND slug = ${slug}`;
}

export async function pauseDepartment(q: Sql, userId: string, slug: string, paused: boolean): Promise<void> {
  await q`
    UPDATE amber_departments
    SET status = ${paused ? "paused" : "active"}, updated_at = ${new Date().toISOString()}
    WHERE user_id = ${userId} AND slug = ${slug}`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "department_status",
    title: `${slug} ${paused ? "paused" : "active"}`,
    detail: { slug, paused },
  });
}

export async function applyBriefPriorities(
  q: Sql,
  userId: string,
  priorities: string[],
  actorEmail?: string | null,
): Promise<Record<string, unknown>[]> {
  const depts = await ensureDepartments(q, userId);
  const marketing = priorities.slice(0, 4);
  const content = priorities.filter((_, i) => i % 2 === 0).slice(0, 3);
  const social = priorities.slice(0, 3);
  await setDepartmentPriority(q, userId, "marketing", marketing, 70);
  await setDepartmentPriority(q, userId, "content", content.length ? content : marketing, 65);
  await setDepartmentPriority(q, userId, "social", social.length ? social : marketing, 60);
  await setDepartmentPriority(q, userId, "analytics", ["Honest Reelo outcome review"], 55);
  await setDepartmentPriority(q, userId, "research", ["BI + seasonal notes"], 50);
  await logAmberAction({
    actorUserId: userId,
    actorEmail: actorEmail ?? null,
    kind: "department_priorities",
    title: "Department priorities updated from executive brief",
    detail: { priorities: marketing },
  });
  return listDepartments(q, userId);
}
