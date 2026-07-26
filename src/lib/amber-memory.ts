import { randomUUID } from "node:crypto";
import { logAmberAction } from "@/lib/amber-autonomous";
import type { Sql } from "@/lib/workspace-api";

export type MemoryKind =
  | "decision"
  | "preference"
  | "win"
  | "loss"
  | "seasonal"
  | "customer"
  | "campaign"
  | "lesson";

export async function remember(
  q: Sql,
  userId: string,
  input: {
    kind: MemoryKind;
    title: string;
    body?: string;
    weight?: number;
    evidence?: unknown[];
    cycleId?: string | null;
    actorEmail?: string | null;
  },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_memory (id, user_id, kind, title, body, weight, evidence, cycle_id, created_at)
    VALUES (
      ${id}, ${userId}, ${input.kind.slice(0, 40)}, ${input.title.slice(0, 200)},
      ${(input.body || "").slice(0, 4000)}, ${Number(input.weight) || 1},
      ${JSON.stringify(input.evidence || [])}, ${input.cycleId ?? null},
      ${new Date().toISOString()}
    )`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: input.actorEmail ?? null,
    kind: "memory_write",
    title: `Memory (${input.kind}): ${input.title.slice(0, 80)}`,
    detail: { id, kind: input.kind },
  });
  return id;
}

export async function recall(
  q: Sql,
  userId: string,
  opts?: { kinds?: MemoryKind[]; limit?: number },
): Promise<Record<string, unknown>[]> {
  const limit = Math.min(80, Math.max(1, opts?.limit ?? 30));
  const rows = (await q`
    SELECT id, kind, title, body, weight, evidence, cycle_id AS "cycleId", created_at AS "createdAt"
    FROM amber_memory WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit}
  `) as Record<string, unknown>[];
  const kinds = opts?.kinds;
  const filtered = kinds?.length ? rows.filter((r) => kinds.includes(String(r.kind) as MemoryKind)) : rows;
  return filtered.map((r) => {
    let evidence: unknown[] = [];
    try {
      evidence = typeof r.evidence === "string" ? JSON.parse(String(r.evidence)) : (r.evidence as unknown[]) || [];
    } catch {
      evidence = [];
    }
    return { ...r, evidence };
  });
}

export function memoryPromptBlock(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "(no company memory yet)";
  return rows
    .slice(0, 20)
    .map((r) => `- [${r.kind}] ${r.title}: ${String(r.body || "").slice(0, 160)}`)
    .join("\n");
}

export async function writeCycleMemories(
  q: Sql,
  userId: string,
  input: {
    goal: string;
    stepsOk: number;
    stepsFailed: number;
    reportSummary: string;
    cycleId: string;
    actorEmail?: string | null;
  },
): Promise<string[]> {
  const ids: string[] = [];
  if (input.stepsFailed === 0) {
    ids.push(
      await remember(q, userId, {
        kind: "win",
        title: `Cycle succeeded: ${input.goal.slice(0, 100)}`,
        body: input.reportSummary.slice(0, 800),
        cycleId: input.cycleId,
        actorEmail: input.actorEmail,
        evidence: [`stepsOk:${input.stepsOk}`],
      }),
    );
  } else {
    ids.push(
      await remember(q, userId, {
        kind: "loss",
        title: `Cycle had ${input.stepsFailed} failed step(s)`,
        body: `Goal: ${input.goal}. ${input.reportSummary}`.slice(0, 800),
        cycleId: input.cycleId,
        actorEmail: input.actorEmail,
      }),
    );
  }
  ids.push(
    await remember(q, userId, {
      kind: "lesson",
      title: "Weekly cycle lesson",
      body: input.reportSummary.slice(0, 1000) || `Completed cycle toward: ${input.goal}`,
      cycleId: input.cycleId,
      actorEmail: input.actorEmail,
    }),
  );
  return ids;
}
