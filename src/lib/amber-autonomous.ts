import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { currentUser } from "@/lib/accounts";
import { ensureSchema, sqlAsync } from "@/lib/db";

/**
 * Amber Autonomous Marketing Employee — admin-only feature flag.
 * OFF by default. Normal customers never get access until public release.
 */

const FLAG_KEY = "amber_autonomous_enabled";
const STOP_KEY = "amber_emergency_stop";
const AUTO_GEN_KEY = "amber_auto_generate";
const CONTINUOUS_KEY = "amber_continuous_cycle";
const LEARNING_MODE_KEY = "amber_learning_mode";
const LEARNING_WORKSPACES_KEY = "amber_learning_workspaces";
const NOTIFY_KEY = "amber_notify_prefs";

export type AmberNotifyPrefs = {
  weeklyReport: boolean;
  verificationHolds: boolean;
  publishFailures: boolean;
  missionComplete: boolean;
  ownerInterventionsOnly: boolean;
};

export type AmberAccess = {
  allowed: boolean;
  reason: string;
  flagEnabled: boolean;
  emergencyStop: boolean;
  isSuperAdmin: boolean;
  isAllowlistedTester: boolean;
  userId: string | null;
  email: string | null;
};

function allowlistEmails(): Set<string> {
  const raw = process.env.AMBER_ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function envKillSwitchOff(): boolean {
  const v = (process.env.AMBER_AUTONOMOUS_ENABLED || "").trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return true;
  return false;
}

async function getSetting(key: string): Promise<string | null> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) return null;
  try {
    const rows = (await q`SELECT value FROM app_settings WHERE key = ${key} LIMIT 1`) as { value: string }[];
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function setSetting(key: string, value: string): Promise<void> {
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) throw new Error("Storage unavailable.");
  const now = new Date().toISOString();
  await q`DELETE FROM app_settings WHERE key = ${key}`;
  await q`INSERT INTO app_settings (key, value, updated_at) VALUES (${key}, ${value}, ${now})`;
}

export async function getAmberAutonomousFlag(): Promise<boolean> {
  if (envKillSwitchOff()) return false;
  const v = (process.env.AMBER_AUTONOMOUS_ENABLED || "").trim().toLowerCase();
  if (v === "true" || v === "1" || v === "on") return true;
  return (await getSetting(FLAG_KEY)) === "true";
}

export async function setAmberAutonomousFlag(enabled: boolean, actor: string): Promise<void> {
  await setSetting(FLAG_KEY, enabled ? "true" : "false");
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "flag_toggle",
    title: enabled ? "Amber Autonomous Mode enabled" : "Amber Autonomous Mode disabled",
    detail: { enabled },
  });
}

export async function getAmberEmergencyStop(): Promise<boolean> {
  return (await getSetting(STOP_KEY)) === "true";
}

export async function setAmberEmergencyStop(stopped: boolean, actor: string): Promise<void> {
  await setSetting(STOP_KEY, stopped ? "true" : "false");
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "emergency_stop",
    title: stopped ? "Amber emergency stop ON" : "Amber emergency stop cleared",
    detail: { stopped },
  });
}

export async function getAmberAutoGenerate(): Promise<boolean> {
  return (await getSetting(AUTO_GEN_KEY)) === "true";
}

export async function setAmberAutoGenerate(enabled: boolean, actor: string): Promise<void> {
  await setSetting(AUTO_GEN_KEY, enabled ? "true" : "false");
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "auto_generate_toggle",
    title: enabled ? "Amber auto-generate ON" : "Amber auto-generate OFF",
    detail: { enabled },
  });
}

export async function getAmberContinuousCycle(): Promise<boolean> {
  return (await getSetting(CONTINUOUS_KEY)) === "true";
}

export async function setAmberContinuousCycle(enabled: boolean, actor: string): Promise<void> {
  await setSetting(CONTINUOUS_KEY, enabled ? "true" : "false");
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "continuous_cycle_toggle",
    title: enabled ? "Amber continuous weekly cycle ON" : "Amber continuous weekly cycle OFF",
    detail: { enabled, note: "With Learning Mode + selected workspaces, cron/admin can run cycles automatically." },
  });
}

/** Real-world learning mode — admin workspaces only; not public launch. */
export async function getAmberLearningMode(): Promise<boolean> {
  return (await getSetting(LEARNING_MODE_KEY)) === "true";
}

export async function setAmberLearningMode(enabled: boolean, actor: string): Promise<void> {
  await setSetting(LEARNING_MODE_KEY, enabled ? "true" : "false");
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "learning_mode_toggle",
    title: enabled ? "Amber Learning Mode ON (admin workspaces)" : "Amber Learning Mode OFF",
    detail: { enabled, note: "Not customer-facing. Isolated per workspace." },
  });
}

/** Authorized admin test workspace user IDs — never mix BI/learning between them. */
export async function getAmberLearningWorkspaces(): Promise<string[]> {
  const raw = await getSetting(LEARNING_WORKSPACES_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String).filter(Boolean).slice(0, 50) : [];
  } catch {
    return [];
  }
}

export async function setAmberLearningWorkspaces(userIds: string[], actor: string): Promise<string[]> {
  const next = [...new Set(userIds.map(String).filter(Boolean))].slice(0, 50);
  await setSetting(LEARNING_WORKSPACES_KEY, JSON.stringify(next));
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "learning_workspaces",
    title: `Learning workspaces updated (${next.length})`,
    detail: { userIds: next },
  });
  return next;
}

export async function getAmberNotifyPrefs(): Promise<AmberNotifyPrefs> {
  const raw = await getSetting(NOTIFY_KEY);
  const defaults: AmberNotifyPrefs = {
    weeklyReport: true,
    verificationHolds: true,
    publishFailures: true,
    missionComplete: true,
    ownerInterventionsOnly: true,
  };
  if (!raw) return defaults;
  try {
    const p = JSON.parse(raw) as Partial<AmberNotifyPrefs>;
    return { ...defaults, ...p };
  } catch {
    return defaults;
  }
}

export async function setAmberNotifyPrefs(prefs: Partial<AmberNotifyPrefs>, actor: string): Promise<AmberNotifyPrefs> {
  const current = await getAmberNotifyPrefs();
  const next = { ...current, ...prefs };
  await setSetting(NOTIFY_KEY, JSON.stringify(next));
  await logAmberAction({
    actorUserId: null,
    actorEmail: actor,
    kind: "notify_prefs",
    title: "Amber notification preferences updated",
    detail: next as unknown as Record<string, unknown>,
  });
  return next;
}

export async function isSuperAdminSession(): Promise<boolean> {
  try {
    const store = await cookies();
    return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
  } catch {
    return false;
  }
}

export async function resolveAmberAccess(): Promise<AmberAccess> {
  const flagEnabled = await getAmberAutonomousFlag();
  const emergencyStop = await getAmberEmergencyStop();
  const isSuperAdmin = await isSuperAdminSession();
  const user = await currentUser();
  const email = user?.email?.toLowerCase() ?? null;
  const isAllowlistedTester = Boolean(email && allowlistEmails().has(email));

  const base = {
    flagEnabled,
    emergencyStop,
    isSuperAdmin,
    isAllowlistedTester,
    userId: user?.id ?? null,
    email,
  };

  if (!flagEnabled) {
    return {
      ...base,
      allowed: false,
      reason: "Amber Autonomous Mode is OFF. Super Admin can enable it in Admin → Amber.",
    };
  }

  if (emergencyStop) {
    return {
      ...base,
      allowed: false,
      reason: "Amber emergency stop is ON. Clear it in Admin → Amber Control before running operations.",
    };
  }

  if (isSuperAdmin || isAllowlistedTester) {
    return {
      ...base,
      allowed: true,
      reason: isSuperAdmin ? "super_admin" : "allowlisted_tester",
    };
  }

  return {
    ...base,
    allowed: false,
    reason: "Amber Autonomous Mode is admin-only. Not available for customer accounts.",
  };
}

/** Super Admin may view dashboard even when stop/flag blocks ops. */
export async function requireAmberAutonomous(): Promise<
  | { ok: true; access: AmberAccess }
  | { ok: false; response: Response }
> {
  const access = await resolveAmberAccess();
  if (!access.allowed) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: access.emergencyStop ? "amber_emergency_stop" : "amber_admin_only",
          message: access.reason,
          flagEnabled: access.flagEnabled,
          emergencyStop: access.emergencyStop,
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true, access };
}

export async function logAmberAction(input: {
  actorUserId: string | null;
  actorEmail: string | null;
  kind: string;
  title: string;
  detail?: Record<string, unknown>;
  href?: string | null;
}): Promise<void> {
  try {
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) return;
    const id = randomUUID();
    const now = new Date().toISOString();
    await q`
      INSERT INTO amber_action_logs (id, actor_user_id, actor_email, kind, title, detail, href, created_at)
      VALUES (
        ${id},
        ${input.actorUserId},
        ${input.actorEmail},
        ${input.kind.slice(0, 80)},
        ${input.title.slice(0, 200)},
        ${JSON.stringify(input.detail ?? {})},
        ${input.href ?? null},
        ${now}
      )`;
  } catch {
    /* logging must never break the action */
  }
}
