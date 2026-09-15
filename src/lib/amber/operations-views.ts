/**
 * Pure shaping of Amber's escalation and activity payloads into what the
 * Operations dashboard renders.
 *
 * Why this is its own module rather than part of operations-telemetry.ts:
 * the dashboard is a client component, and these two functions are the only
 * things it needs. Importing them from the telemetry module dragged that
 * module's whole graph -- the bridge client, and through it Relo's database
 * driver -- into the browser bundle, which fails to build on node-only
 * imports. Pure view logic and credentialed I/O do not belong in one file.
 *
 * Everything here is defensive: Amber HQ is a separately-deployed service, so
 * a field that is missing must render as missing, never crash the page whose
 * job is to tell the owner what is wrong.
 */
import type { Section } from "./operations-telemetry.ts";

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
/** Read a dotted path, returning null rather than throwing on any gap. */
function at(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const seg of path.split(".")) {
    const r = rec(cur);
    if (!r) return null;
    cur = r[seg];
  }
  return cur ?? null;
}

export type RepairAttemptView = { at: string; whatAmberDid: string; result: string | null; worked: boolean };

export type OwnerEscalationView = {
  id: string;
  status: "OPEN" | "RESOLVED";
  urgency: "CRITICAL" | "IMPORTANT" | "MINOR";
  title: string;
  whatHappened: string;
  whatIsAffected: string;
  whyAmberCannotFix: string;
  whatWeNeedFromYou: string[];
  revenueBlocked: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  seenInAudits: number;
  repairAttempts: RepairAttemptView[];
  resolvedAt?: string;
  resolvedBy?: string;
  technical?: { rule?: string; severity?: string; evidence?: string; lastAction?: string };
};

export type ActivityEventView = {
  id: string;
  kind: string;
  level: "good" | "bad" | "info";
  headline: string;
  detail: string;
  firstAt: string;
  lastAt: string;
  occurrences: number;
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function toEscalation(raw: unknown): OwnerEscalationView | null {
  const r = rec(raw);
  if (!r) return null;
  const title = str(r.title) || str(r.whatHappened);
  if (!title) return null;
  const urgency = r.urgency === "CRITICAL" || r.urgency === "IMPORTANT" || r.urgency === "MINOR" ? r.urgency : "MINOR";
  return {
    id: str(r.id, title),
    status: r.status === "RESOLVED" ? "RESOLVED" : "OPEN",
    urgency,
    title,
    whatHappened: str(r.whatHappened, title),
    whatIsAffected: str(r.whatIsAffected, "Not stated."),
    whyAmberCannotFix: str(r.whyAmberCannotFix, "Not stated."),
    whatWeNeedFromYou: strList(r.whatWeNeedFromYou),
    revenueBlocked: r.revenueBlocked === true,
    firstSeenAt: str(r.firstSeenAt),
    lastSeenAt: str(r.lastSeenAt),
    seenInAudits: num(r.seenInAudits) ?? 1,
    repairAttempts: Array.isArray(r.repairAttempts)
      ? r.repairAttempts.flatMap((a) => {
          const ar = rec(a);
          if (!ar) return [];
          return [{ at: str(ar.at), whatAmberDid: str(ar.whatAmberDid), result: typeof ar.result === "string" ? ar.result : null, worked: ar.worked === true }];
        })
      : [],
    resolvedAt: typeof r.resolvedAt === "string" ? r.resolvedAt : undefined,
    resolvedBy: typeof r.resolvedBy === "string" ? r.resolvedBy : undefined,
    technical: rec(r.technical) as OwnerEscalationView["technical"],
  };
}

/** Amber's open asks and her recently closed ones. */
export function escalationsFrom(section: Section): { open: OwnerEscalationView[]; resolved: OwnerEscalationView[] } {
  if (!section.ok) return { open: [], resolved: [] };
  const openRaw = at(section.data, "open");
  const resolvedRaw = at(section.data, "resolved");
  return {
    open: (Array.isArray(openRaw) ? openRaw : []).map(toEscalation).filter((x): x is OwnerEscalationView => x !== null),
    resolved: (Array.isArray(resolvedRaw) ? resolvedRaw : []).map(toEscalation).filter((x): x is OwnerEscalationView => x !== null),
  };
}

/** Amber's summarized report of important events. */
export function activityFrom(section: Section): ActivityEventView[] {
  if (!section.ok) return [];
  const raw = at(section.data, "events");
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e) => {
    const r = rec(e);
    const headline = str(r?.headline);
    if (!r || !headline) return [];
    const level = r.level === "good" || r.level === "bad" ? r.level : "info";
    return [{
      id: str(r.id, headline),
      kind: str(r.kind, "info"),
      level,
      headline,
      detail: str(r.detail),
      firstAt: str(r.firstAt),
      lastAt: str(r.lastAt),
      occurrences: num(r.occurrences) ?? 1,
    }];
  });
}
