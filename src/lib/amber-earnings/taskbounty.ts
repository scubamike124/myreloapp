const SITE = "https://www.task-bounty.com";
const API = `${SITE}/api/v1`;

export type TaskBountyListing = {
  id?: string;
  task_id?: string;
  title?: string;
  bounty_cents?: number;
  reward?: number;
  description?: string;
  language?: string;
  complexity_tag?: string;
  github_repo_url?: string;
  github_issue_url?: string;
};

async function jsonFetch(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  return { ok: res.ok, status: res.status, data, text };
}

export async function listOpenBounties(): Promise<{ ok: boolean; detail: string; items: TaskBountyListing[] }> {
  const a = await jsonFetch(`${API}/tasks`);
  const b = await jsonFetch(`${API}/bounties.json`);
  const items: TaskBountyListing[] = [];
  const pull = (raw: unknown) => {
    if (Array.isArray(raw)) return raw as TaskBountyListing[];
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.data)) return o.data as TaskBountyListing[];
      if (Array.isArray(o.bounties)) return o.bounties as TaskBountyListing[];
      if (Array.isArray(o.tasks)) return o.tasks as TaskBountyListing[];
    }
    return [];
  };
  items.push(...pull(a.data), ...pull(b.data));
  const uniq = new Map<string, TaskBountyListing>();
  for (const it of items) {
    const id = String(it.id || it.task_id || it.title || "");
    if (id) uniq.set(id, it);
  }
  const ok = a.ok || b.ok;
  return {
    ok,
    detail: ok
      ? `Live board: ${uniq.size} open bounty(s).`
      : `TaskBounty list failed (tasks ${a.status}, bounties.json ${b.status}).`,
    items: [...uniq.values()],
  };
}

export async function startDeviceLogin(clientName = "Amber"): Promise<{
  ok: boolean;
  userCode?: string;
  verificationUri?: string;
  verificationUriComplete?: string;
  expiresIn?: number;
  interval?: number;
  deviceCode?: string;
  detail: string;
}> {
  const res = await jsonFetch(`${SITE}/api/mcp/device/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_name: clientName }),
  });
  const data = (res.data || {}) as Record<string, unknown>;
  if (!res.ok || !data.device_code) {
    return { ok: false, detail: `Device login start failed HTTP ${res.status}.` };
  }
  return {
    ok: true,
    userCode: String(data.user_code || ""),
    verificationUri: String(data.verification_uri || `${SITE}/link`),
    verificationUriComplete: String(data.verification_uri_complete || ""),
    expiresIn: Number(data.expires_in || 900),
    interval: Number(data.interval || 5),
    deviceCode: String(data.device_code),
    detail: "Device login started.",
  };
}

export async function pollDeviceLogin(deviceCode: string): Promise<{
  pending: boolean;
  accessToken?: string;
  detail: string;
}> {
  const res = await jsonFetch(`${SITE}/api/mcp/device/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_code: deviceCode }),
  });
  const data = (res.data || {}) as Record<string, unknown>;
  if (res.ok && typeof data.access_token === "string") {
    return { pending: false, accessToken: data.access_token, detail: "Approved." };
  }
  const err = String(data.error || "");
  if (err === "authorization_pending" || err === "slow_down") {
    return { pending: true, detail: err };
  }
  return { pending: false, detail: err || `HTTP ${res.status}` };
}

export function payoutUsdFromListing(item: TaskBountyListing): number {
  if (typeof item.bounty_cents === "number") return item.bounty_cents / 100;
  if (typeof item.reward === "number") return item.reward;
  return 0;
}

/** Confirms a stored key is accepted. Never logs or returns the key. */
export async function verifyTaskBountyKey(key: string): Promise<{ ok: boolean; detail: string }> {
  const res = await jsonFetch(`${API}/solver/payout-method`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.status === 401 || res.status === 403) {
    return { ok: false, detail: "TaskBounty rejected the stored key — reconnect from Amber Earnings." };
  }
  return { ok: true, detail: "TaskBounty key accepted. Worker can claim when a bounty passes the gates." };
}

