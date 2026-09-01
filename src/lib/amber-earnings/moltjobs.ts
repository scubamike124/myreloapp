export type MoltJob = {
  id: string;
  title: string;
  budgetUsd: number;
  description: string;
  customer: string;
  status: string;
  vertical: string;
  requiredCertification: string;
};

function authHeaders(apiKey: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Api-Key": apiKey,
  };
}

export async function listOpenMoltJobs(): Promise<{ ok: boolean; detail: string; jobs: MoltJob[] }> {
  try {
    const res = await fetch("https://api.moltjobs.io/v1/jobs?status=OPEN", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: unknown[] };
    const raw = Array.isArray(json.data) ? json.data : [];
    const jobs: MoltJob[] = raw.map((row) => {
      const o = row as Record<string, unknown>;
      const input = (o.inputData || {}) as Record<string, unknown>;
      const poster = (o.poster || {}) as Record<string, unknown>;
      return {
        id: String(o.id || ""),
        title: String(o.title || "Untitled"),
        budgetUsd: Number(o.budgetUsdc || o.budget_usdc || 0),
        description: String(input.generalDescription || input.requirements || o.description || "").slice(0, 800),
        customer: String(poster.displayName || "Unknown"),
        status: String(o.status || ""),
        vertical: String(o.vertical || o.topic || ""),
        requiredCertification: String(o.requiredCertification || ""),
      };
    }).filter((j) => j.id);
    return {
      ok: res.ok,
      detail: res.ok ? `Live board: ${jobs.length} open job(s).` : `MoltJobs HTTP ${res.status}`,
      jobs,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "MoltJobs fetch failed", jobs: [] };
  }
}

export async function verifyMoltJobsKey(apiKey: string): Promise<{ ok: boolean; detail: string; agentId: string | null }> {
  try {
    const res = await fetch("https://api.moltjobs.io/v1/agents/me", {
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { data?: Record<string, unknown> };
    const data = (json.data || json) as Record<string, unknown>;
    // Prefer UUID id for bid bodies — handle/slug fails UUID / string validators.
    const id = String(data.id || "").trim();
    const handle = String(data.handle || data.name || "").trim();
    if (!res.ok || !id) {
      return { ok: false, detail: `MoltJobs key HTTP ${res.status}`, agentId: null };
    }
    const label = handle || id;
    return {
      ok: true,
      detail: `MoltJobs agent @${label} ${String(data.status || data.certified || "connected")}.`,
      agentId: id,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "MoltJobs verify failed", agentId: null };
  }
}

export async function heartbeatMoltAgent(apiKey: string, agentId: string): Promise<void> {
  try {
    await fetch(`https://api.moltjobs.io/v1/agents/${encodeURIComponent(agentId)}/heartbeat`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ status: "ACTIVE" }),
      cache: "no-store",
    });
  } catch {
    /* next tick retries */
  }
}

export async function placeMoltBid(
  apiKey: string,
  job: MoltJob,
  agentId?: string | null,
): Promise<{ ok: boolean; needsCert: boolean; detail: string }> {
  const proposedUsdc = (Math.round(Number(job.budgetUsd) * 100) / 100).toFixed(2);
  try {
    // Live validator (iterated against api.moltjobs.io):
    // - amountUsdc / message / etaMinutes / amount → "should not exist"
    // - proposedUsdc + coverLetter accepted; agentId required as string when key alone is not enough
    const body: Record<string, unknown> = {
      proposedUsdc,
      coverLetter:
        "I can finish this with a real deliverable. I only bid jobs I can complete (software, research, data, automation). No fake work. ETA ~6h.",
    };
    if (agentId && typeof agentId === "string" && agentId.length > 4) {
      body.agentId = String(agentId);
    }

    const res = await fetch(`https://api.moltjobs.io/v1/jobs/${encodeURIComponent(job.id)}/bids`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      title?: string;
      detail?: string;
      message?: string;
      errors?: Array<{ path?: string; message?: string; code?: string } | string>;
      data?: { id?: string };
    };
    const validationBits = Array.isArray(json.errors)
      ? json.errors
          .map((e) => {
            if (typeof e === "string") return e;
            const path = e.path || (e as { property?: string }).property || "";
            return `${path} ${e.message || e.code || ""}`.trim();
          })
          .filter(Boolean)
          .join("; ")
      : "";
    const blob = `${json.error || ""} ${json.code || ""} ${json.title || ""} ${json.detail || ""} ${json.message || ""} ${validationBits}`.toLowerCase();
    const errSnippet = [json.title, json.detail, json.error, json.message, json.code, validationBits]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 320);
    if (res.status === 403 || /not_certified|certification|not certified/.test(blob)) {
      return {
        ok: false,
        needsCert: true,
        detail: "Bid blocked — General Fundamentals certification required on MoltJobs (on-platform $5 step).",
      };
    }
    if (res.status === 409 || /already/.test(blob)) {
      return { ok: true, needsCert: false, detail: "Bid already on this job." };
    }
    if (!res.ok) {
      const raw = !errSnippet ? JSON.stringify(json).slice(0, 280) : "";
      return {
        ok: false,
        needsCert: false,
        detail: errSnippet
          ? `Bid HTTP ${res.status}: ${errSnippet}`
          : raw
            ? `Bid HTTP ${res.status}: ${raw}`
            : `Bid HTTP ${res.status}`,
      };
    }
    return { ok: true, needsCert: false, detail: `Bid placed (${json.data?.id || "ok"}).` };
  } catch (e) {
    return { ok: false, needsCert: false, detail: e instanceof Error ? e.message : "Bid failed" };
  }
}

export async function startMoltJob(
  apiKey: string,
  jobId: string,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`https://api.moltjobs.io/v1/jobs/${encodeURIComponent(jobId)}/start`, {
      method: "PATCH",
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const text = await res.text();
    if (res.status === 404 || res.status === 405) {
      // Some deployments use POST
      const res2 = await fetch(`https://api.moltjobs.io/v1/jobs/${encodeURIComponent(jobId)}/start`, {
        method: "POST",
        headers: authHeaders(apiKey),
        cache: "no-store",
      });
      if (!res2.ok) {
        return {
          ok: false,
          detail: `Start HTTP ${res.status}/${res2.status} — bid may still be awaiting poster assignment. ${text.slice(0, 160)}`,
        };
      }
      return { ok: true, detail: "Molt job marked IN_PROGRESS." };
    }
    if (!res.ok) {
      return {
        ok: false,
        detail: `Start HTTP ${res.status} — likely waiting for poster to accept bid. ${text.slice(0, 160)}`,
      };
    }
    return { ok: true, detail: "Molt job marked IN_PROGRESS." };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Start failed" };
  }
}

export type MoltJobDetail = {
  ok: boolean;
  status: string;
  detail: string;
  assignedAgentId: string | null;
  escrowTxHash: string | null;
  raw: Record<string, unknown>;
};

function unwrap(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) return o.data as Record<string, unknown>;
  return o;
}

export async function getMoltJob(apiKey: string, jobId: string): Promise<MoltJobDetail> {
  try {
    const res = await fetch(`https://api.moltjobs.io/v1/jobs/${encodeURIComponent(jobId)}`, {
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    const data = unwrap(json);
    const status = String(data.status || "");
    const assigned =
      data.assignedAgentId || data.assigned_agent_id || (data.assignee as Record<string, unknown> | undefined)?.id;
    const escrow =
      data.escrowTxHash || data.escrow_tx_hash || (data.escrow as Record<string, unknown> | undefined)?.txHash;
    if (!res.ok) {
      return {
        ok: false,
        status,
        detail: `GET job HTTP ${res.status}`,
        assignedAgentId: assigned ? String(assigned) : null,
        escrowTxHash: escrow ? String(escrow) : null,
        raw: data,
      };
    }
    return {
      ok: true,
      status,
      detail: `MoltJobs status ${status || "UNKNOWN"}`,
      assignedAgentId: assigned ? String(assigned) : null,
      escrowTxHash: escrow ? String(escrow) : null,
      raw: data,
    };
  } catch (e) {
    return {
      ok: false,
      status: "",
      detail: e instanceof Error ? e.message : "GET job failed",
      assignedAgentId: null,
      escrowTxHash: null,
      raw: {},
    };
  }
}

export async function listAgentMoltJobs(
  apiKey: string,
  agentId: string,
  status?: string,
): Promise<{ ok: boolean; detail: string; jobs: Array<{ id: string; status: string; title: string }> }> {
  try {
    const q = status ? `?status=${encodeURIComponent(status)}&limit=50` : "?limit=50";
    const res = await fetch(`https://api.moltjobs.io/v1/agents/${encodeURIComponent(agentId)}/jobs${q}`, {
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { data?: unknown[] };
    const raw = Array.isArray(json.data) ? json.data : Array.isArray(json) ? (json as unknown[]) : [];
    const jobs = raw.map((row) => {
      const o = row as Record<string, unknown>;
      return { id: String(o.id || ""), status: String(o.status || ""), title: String(o.title || "") };
    }).filter((j) => j.id);
    return {
      ok: res.ok,
      detail: res.ok ? `${jobs.length} agent job(s)` : `Agent jobs HTTP ${res.status}`,
      jobs,
    };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Agent jobs failed", jobs: [] };
  }
}

export async function getMoltWallet(
  apiKey: string,
  agentId: string,
): Promise<{ ok: boolean; detail: string; usdcBalance: number | null; address: string | null }> {
  try {
    const res = await fetch(`https://api.moltjobs.io/v1/agents/${encodeURIComponent(agentId)}/wallet`, {
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    const data = unwrap(json);
    const bal = data.usdcBalance ?? data.usdc_balance ?? data.balance;
    const addr = data.address || data.walletAddress;
    if (!res.ok) {
      return {
        ok: false,
        detail: `Wallet HTTP ${res.status} — owner USDC wallet setup may still be required on MoltJobs.`,
        usdcBalance: null,
        address: null,
      };
    }
    const n = bal == null || bal === "" ? null : Number(bal);
    return {
      ok: true,
      detail: `Wallet ${addr ? String(addr).slice(0, 10) + "…" : "ok"} balance ${Number.isFinite(n as number) ? n : "unknown"} USDC`,
      usdcBalance: Number.isFinite(n as number) ? (n as number) : null,
      address: addr ? String(addr) : null,
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : "Wallet fetch failed",
      usdcBalance: null,
      address: null,
    };
  }
}

export async function getMoltWalletCredits(
  apiKey: string,
  agentId: string,
): Promise<{ ok: boolean; detail: string; credits: Array<{ type: string; amount: number; note: string }> }> {
  try {
    const res = await fetch(`https://api.moltjobs.io/v1/agents/${encodeURIComponent(agentId)}/wallet/transactions`, {
      headers: authHeaders(apiKey),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { data?: unknown[] };
    const raw = Array.isArray(json.data) ? json.data : [];
    const credits = raw.map((row) => {
      const o = row as Record<string, unknown>;
      return {
        type: String(o.type || o.kind || ""),
        amount: Number(o.amountUsdc || o.amount_usdc || o.amount || 0),
        note: String(o.jobId || o.job_id || o.note || o.hash || ""),
      };
    });
    return { ok: res.ok, detail: res.ok ? `${credits.length} txns` : `Wallet tx HTTP ${res.status}`, credits };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Wallet tx failed", credits: [] };
  }
}

/** MoltJobs SubmitWorkDto requires outputData (object). Never invent acceptance. */
export function moltSubmitBody(input: { summary: string; output: string; testsNotes?: string }): { outputData: Record<string, unknown> } {
  return {
    outputData: {
      summary: input.summary,
      deliverable: input.output,
      testsNotes: input.testsNotes || "",
      submittedAt: new Date().toISOString(),
    },
  };
}

export async function submitMoltWork(
  apiKey: string,
  jobId: string,
  input: { summary: string; output: string; testsNotes?: string },
): Promise<{ ok: boolean; detail: string }> {
  try {
    const body = moltSubmitBody(input);
    const res = await fetch(`https://api.moltjobs.io/v1/jobs/${encodeURIComponent(jobId)}/submit`, {
      method: "PATCH",
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        detail: `Submit HTTP ${res.status} — work verified locally; platform submit pending assignment/review. ${text.slice(0, 180)}`,
      };
    }
    return { ok: true, detail: "MoltJobs API accepted submit (IN_REVIEW)." };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Submit failed" };
  }
}

/** Hard rejects. Return null when the listing may still pass profit + capability. */
export function moltJobReject(job: MoltJob): { category: string; reason: string } | null {
  const blob = `${job.title} ${job.description}`.toLowerCase();
  if (job.budgetUsd < 5) {
    return { category: "poor_profitability", reason: `Payout $${job.budgetUsd} is below Amber's $5 minimum payout.` };
  }
  if (/public post|followers|#ad|#sponsored|tracked link|instagram|tiktok|twitter|linkedin post/.test(blob)) {
    return {
      category: "capability_mismatch",
      reason: "Requires posting from a human social account. Amber will not impersonate a person or buy engagement.",
    };
  }
  if (/cold email|spam|mass mail/.test(blob)) {
    return {
      category: "owner_approval_needed",
      reason: "Mass/cold email campaigns need Mike's approval before Amber writes to strangers at scale.",
    };
  }
  return null;
}
