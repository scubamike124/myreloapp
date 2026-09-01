import { currentUser } from "@/lib/accounts";
import { ensureSchema, sqlAsync } from "@/lib/db";
import { readRawValue } from "@/lib/env-vault";
import { DEFAULT_LIMITS, type EarningsState, type MarketplaceId } from "./types";

type Sql = NonNullable<Awaited<ReturnType<typeof sqlAsync>>>;

type Row = {
  state_json: string | null;
  taskbounty_api_key: string | null;
  spore_agent_id: string | null;
  moltjobs_api_key: string | null;
  workprotocol_api_key: string | null;
  workprotocol_agent_id: string | null;
  device_code: string | null;
};

export function defaultState(): EarningsState {
  return {
    pausedAll: false,
    marketplaces: {
      taskbounty: { enabled: true, paused: false },
      sporeagent: { enabled: true, paused: false },
    },
    limits: { ...DEFAULT_LIMITS },
    spentTodayUsd: 0,
    spentTodayDate: new Date().toISOString().slice(0, 10),
    jobs: [],
    ticks: 0,
    lastTickNotes: [],
    ownerSteps: [],
    connections: {
      taskbounty: { ok: false, detail: "Not connected", hasApiKey: false },
      sporeagent: { ok: false, detail: "Not connected", agentId: null },
    },
    deviceAuth: null,
  };
}

function mergeState(parsed: Partial<EarningsState> | null): EarningsState {
  const base = defaultState();
  if (!parsed) return base;
  return {
    ...base,
    ...parsed,
    limits: { ...base.limits, ...parsed.limits },
    marketplaces: {
      taskbounty: { ...base.marketplaces.taskbounty, ...parsed.marketplaces?.taskbounty },
      sporeagent: { ...base.marketplaces.sporeagent, ...parsed.marketplaces?.sporeagent },
    },
    jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    ownerSteps: Array.isArray(parsed.ownerSteps) ? parsed.ownerSteps : [],
    connections: { ...base.connections, ...parsed.connections },
  };
}

async function db(): Promise<Sql | null> {
  if (!(await ensureSchema())) return null;
  return sqlAsync();
}

export async function envTaskBountyKey(): Promise<string | null> {
  const key = (await readRawValue("TASKBOUNTY_API_KEY")).trim();
  return key || null;
}

export async function envSporeAgentId(): Promise<string | null> {
  const id = (await readRawValue("SPOREAGENT_AGENT_ID")).trim();
  return id || null;
}

export async function envMoltJobsKey(): Promise<string | null> {
  const key = (await readRawValue("MOLTJOBS_API_KEY")).trim();
  return key || null;
}

export async function envWorkProtocolKey(): Promise<string | null> {
  const key = (await readRawValue("WORKPROTOCOL_API_KEY")).trim();
  return key || null;
}

export type EarningsRecord = {
  state: EarningsState;
  taskbountyApiKey: string | null;
  sporeAgentId: string | null;
  moltjobsApiKey: string | null;
  workprotocolApiKey: string | null;
  workprotocolAgentId: string | null;
  deviceCode: string | null;
};

export async function loadRecord(userId: string): Promise<EarningsRecord> {
  const q = await db();
  const envKey = await envTaskBountyKey();
  const envSpore = await envSporeAgentId();
  const envMolt = await envMoltJobsKey();
  const envWp = await envWorkProtocolKey();
  if (!q) {
    const state = defaultState();
    state.connections.taskbounty.hasApiKey = Boolean(envKey);
    state.connections.sporeagent.agentId = envSpore;
    return {
      state,
      taskbountyApiKey: envKey,
      sporeAgentId: envSpore,
      moltjobsApiKey: envMolt,
      workprotocolApiKey: envWp,
      workprotocolAgentId: null,
      deviceCode: null,
    };
  }

  let rows: Row[] = [];
  try {
    rows = (await q`
      SELECT state_json, taskbounty_api_key, spore_agent_id, moltjobs_api_key,
             workprotocol_api_key, workprotocol_agent_id, device_code
      FROM amber_earnings WHERE user_id = ${userId}
    `) as Row[];
  } catch {
    try {
      rows = (await q`
        SELECT state_json, taskbounty_api_key, spore_agent_id, moltjobs_api_key, device_code
        FROM amber_earnings WHERE user_id = ${userId}
      `) as Row[];
    } catch {
      rows = (await q`
        SELECT state_json, taskbounty_api_key, spore_agent_id, device_code
        FROM amber_earnings WHERE user_id = ${userId}
      `) as Row[];
    }
  }
  const row = rows[0];
  let parsed: Partial<EarningsState> | null = null;
  if (row?.state_json) {
    try {
      parsed = JSON.parse(row.state_json) as Partial<EarningsState>;
    } catch {
      parsed = null;
    }
  }
  const state = mergeState(parsed);
  if (state.deviceAuth && row?.device_code) {
    state.deviceAuth = { ...state.deviceAuth, deviceCode: row.device_code };
  }
  const taskbountyApiKey = row?.taskbounty_api_key || envKey;
  const sporeAgentId = row?.spore_agent_id || envSpore;
  const moltjobsApiKey = row?.moltjobs_api_key || envMolt;
  const workprotocolApiKey = row?.workprotocol_api_key || envWp;
  const workprotocolAgentId = row?.workprotocol_agent_id || null;
  state.connections.taskbounty.hasApiKey = Boolean(taskbountyApiKey);
  state.connections.sporeagent.agentId = sporeAgentId;
  return {
    state,
    taskbountyApiKey,
    sporeAgentId,
    moltjobsApiKey,
    workprotocolApiKey,
    workprotocolAgentId,
    deviceCode: row?.device_code || state.deviceAuth?.deviceCode || null,
  };
}

export async function saveRecord(userId: string, rec: EarningsRecord): Promise<void> {
  const q = await db();
  if (!q) throw new Error("Database is not available.");
  const publicState: EarningsState = {
    ...rec.state,
    deviceAuth: rec.state.deviceAuth
      ? { ...rec.state.deviceAuth, deviceCode: "" }
      : null,
  };
  const json = JSON.stringify(publicState);
  const now = new Date().toISOString();
  await q`
    INSERT INTO amber_earnings (
      user_id, state_json, taskbounty_api_key, spore_agent_id, moltjobs_api_key,
      workprotocol_api_key, workprotocol_agent_id, device_code, updated_at
    )
    VALUES (
      ${userId}, ${json}, ${rec.taskbountyApiKey}, ${rec.sporeAgentId}, ${rec.moltjobsApiKey},
      ${rec.workprotocolApiKey}, ${rec.workprotocolAgentId}, ${rec.deviceCode}, ${now}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      state_json = EXCLUDED.state_json,
      taskbounty_api_key = EXCLUDED.taskbounty_api_key,
      spore_agent_id = EXCLUDED.spore_agent_id,
      moltjobs_api_key = EXCLUDED.moltjobs_api_key,
      workprotocol_api_key = EXCLUDED.workprotocol_api_key,
      workprotocol_agent_id = EXCLUDED.workprotocol_agent_id,
      device_code = EXCLUDED.device_code,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function requireUserId(): Promise<string | null> {
  const user = await currentUser();
  return user?.id ?? null;
}

export function isMarketplaceRunnable(state: EarningsState, id: MarketplaceId): boolean {
  if (state.pausedAll) return false;
  const m = state.marketplaces[id];
  return Boolean(m?.enabled && !m.paused);
}

export function rollDailySpend(state: EarningsState): EarningsState {
  const today = new Date().toISOString().slice(0, 10);
  if (state.spentTodayDate === today) return state;
  return { ...state, spentTodayDate: today, spentTodayUsd: 0 };
}

export function remainingDailySpend(state: EarningsState): number {
  const rolled = rollDailySpend(state);
  return Math.max(0, rolled.limits.dailySpendUsd - rolled.spentTodayUsd);
}

export function upsertJob(state: EarningsState, job: import("./types").EarningsJob): EarningsState {
  const idx = state.jobs.findIndex((j) => j.id === job.id);
  const jobs = [...state.jobs];
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  return { ...state, jobs: jobs.slice(0, 400) };
}

export function activeCount(state: EarningsState): number {
  return state.jobs.filter((j) => j.status === "active" || j.status === "claimed" || j.status === "queued").length;
}

export async function listEarningsUserIds(): Promise<string[]> {
  const q = await db();
  if (!q) return [];
  const rows = (await q`SELECT user_id FROM amber_earnings`) as { user_id: string }[];
  const ids = rows.map((r) => r.user_id).filter(Boolean);
  if (ids.length) return ids;
  const users = (await q`SELECT id FROM users LIMIT 25`) as { id: string }[];
  return users.map((u) => u.id);
}
