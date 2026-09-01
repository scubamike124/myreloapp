import { NextResponse } from "next/server";
import { currentUser } from "@/lib/accounts";
import { isPrivilegedRole, requireAdminAccess } from "@/lib/roles";
import {
  buildCenter,
  currentSnapshot,
  loadRecord,
  refreshConnections,
  resolveApproval,
  saveRecord,
  setJobStatus,
  startDeviceLogin,
  updatePlatform,
} from "@/lib/amber-earnings";
import { fetchHqNationwide, proxyHqEarningsAction } from "@/lib/amber-earnings/hq-nationwide";
import type { EarningsLimits, MarketplaceId } from "@/lib/amber-earnings/types";
import type { CenterJobStatus } from "@/lib/amber-earnings/center-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function userOr401() {
  const user = await currentUser();
  if (!user) return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user, res: null };
}

async function payload(userId: string, privileged: boolean) {
  const base = { ok: true, snapshot: await currentSnapshot(userId), center: await buildCenter(userId) };
  if (!privileged) return base;
  return { ...base, nationwide: await fetchHqNationwide() };
}

function cronToken(req: Request): string {
  return (
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  ).trim();
}

function cronAuthorized(req: Request): boolean {
  const token = cronToken(req);
  if (!token || token.length < 8) return false;
  const allowed = [
    process.env.CRON_SECRET,
    process.env.AMBER_BUILDER_SECRET,
    process.env.ADMIN_SESSION_SECRET,
  ].filter((v): v is string => Boolean(v && v.length >= 8));
  return allowed.includes(token);
}

/** Owner/Admin DB role OR break-glass admin password session. */
async function privilegedOr401() {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return {
      access: null as null,
      res: NextResponse.json(
        { error: access.status === 403 ? "Forbidden" : "Unauthorized" },
        { status: access.status },
      ),
    };
  }
  return { access, res: null };
}

export async function GET(req: Request) {
  // Machine probe (Relo cron / E2E): prove HQ SoT bridge without a browser session.
  if (cronAuthorized(req)) {
    const nationwide = await fetchHqNationwide({ bypassCache: true });
    return NextResponse.json({ ok: true, nationwide, via: "cron" });
  }

  const { access, res } = await privilegedOr401();
  if (!access) return res;

  // Break-glass admin password: HQ SoT only (no per-user marketplace row).
  if (access.via === "admin_password" && !access.user) {
    return NextResponse.json({
      ok: true,
      via: "admin",
      nationwide: await fetchHqNationwide({ bypassCache: true }),
      snapshot: null,
      center: null,
    });
  }

  const user = access.user!;
  const rec = await loadRecord(user.id);
  const stale =
    !rec.state.lastTickAt || Date.now() - new Date(rec.state.lastTickAt).getTime() > 12 * 60_000;
  if (stale) await refreshConnections(user.id);
  return NextResponse.json(await payload(user.id, true));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    marketplace?: MarketplaceId | string;
    paused?: boolean;
    limits?: Partial<EarningsLimits>;
    agentId?: string;
    apiKey?: string;
    jobId?: string;
    approvalId?: string;
    ownerBusiness?: Record<string, unknown>;
  };

  const hqControl = new Set([
    "hq-tick",
    "hq-scan",
    "hq-pause-all",
    "hq-resume-all",
    "hq-pause-marketplace",
    "hq-set-owner-business",
    "set-owner-business",
  ]);
  if (body.action && (hqControl.has(body.action) || body.action === "hq-pause-marketplace")) {
    const { access, res } = await privilegedOr401();
    if (!access) return res;
    if (body.action === "hq-pause-marketplace") {
      if (!body.marketplace) {
        return NextResponse.json({ ok: false, error: "marketplace required" }, { status: 400 });
      }
      const hq = await proxyHqEarningsAction("pause-marketplace", {
        marketplace: body.marketplace,
        paused: body.paused !== false,
      });
      if (access.user) {
        const local = await payload(access.user.id, true);
        return NextResponse.json({ ...local, nationwide: hq.nationwide, hqAction: { ok: hq.ok, detail: hq.detail } });
      }
      return NextResponse.json({
        ok: true,
        nationwide: hq.nationwide,
        hqAction: { ok: hq.ok, detail: hq.detail },
      });
    }
    if (body.action === "hq-set-owner-business" || body.action === "set-owner-business") {
      const hq = await proxyHqEarningsAction("set-owner-business", {
        ownerBusiness: (body as { ownerBusiness?: Record<string, unknown> }).ownerBusiness || {},
      });
      if (access.user) {
        const local = await payload(access.user.id, true);
        return NextResponse.json({ ...local, nationwide: hq.nationwide, hqAction: { ok: hq.ok, detail: hq.detail } });
      }
      return NextResponse.json({
        ok: true,
        nationwide: hq.nationwide,
        hqAction: { ok: hq.ok, detail: hq.detail },
      });
    }
    const hq = await proxyHqEarningsAction(body.action);
    if (access.user) {
      const local = await payload(access.user.id, true);
      return NextResponse.json({
        ...local,
        nationwide: hq.nationwide,
        hqAction: { ok: hq.ok, detail: hq.detail },
      });
    }
    return NextResponse.json({
      ok: true,
      nationwide: hq.nationwide,
      hqAction: { ok: hq.ok, detail: hq.detail },
    });
  }

  const { user, res } = await userOr401();
  if (!user) return res;

  const scanActions = new Set(["tick", "scan", "discover", "refresh-earnings", "taskbounty-poll"]);
  if (body.action && scanActions.has(body.action)) {
    await refreshConnections(user.id);
    // Also pulse HQ SoT so nationwide/gov/claims update on this page.
    if (isPrivilegedRole(user.role)) {
      const hq = await proxyHqEarningsAction("hq-tick");
      const local = await payload(user.id, true);
      return NextResponse.json({ ...local, nationwide: hq.nationwide, hqAction: { ok: hq.ok, detail: hq.detail } });
    }
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "pause-all" || body.action === "resume-all") {
    const rec = await loadRecord(user.id);
    rec.state.pausedAll = body.action === "pause-all";
    const paused = rec.state.pausedAll;
    await saveRecord(user.id, rec);
    for (const slug of ["taskbounty", "sporeagent", "moltjobs", "workprotocol"]) {
      await updatePlatform(user.id, slug, { paused, status: paused ? "paused" : undefined });
    }
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "pause-marketplace" && body.marketplace) {
    const rec = await loadRecord(user.id);
    const slug = String(body.marketplace);
    if (slug === "taskbounty" || slug === "sporeagent") {
      rec.state.marketplaces[slug].paused = body.paused !== false;
      await saveRecord(user.id, rec);
    }
    await updatePlatform(user.id, slug, { paused: body.paused !== false, status: body.paused !== false ? "paused" : undefined });
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "set-limits" && body.limits) {
    const rec = await loadRecord(user.id);
    rec.state.limits = { ...rec.state.limits, ...body.limits };
    await saveRecord(user.id, rec);
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "stop-job" && body.jobId) {
    const ok = await setJobStatus(user.id, body.jobId, "stopped", { logLine: "Stopped by owner." });
    if (!ok) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "retry-job" && body.jobId) {
    const ok = await setJobStatus(user.id, body.jobId, "evaluating" as CenterJobStatus, { logLine: "Retry requested by owner." });
    if (!ok) return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "resolve-approval" && body.approvalId) {
    await resolveApproval(user.id, body.approvalId);
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "spore-connect") {
    const agentId = String(body.agentId || "").trim();
    if (!agentId || agentId.length > 120) {
      return NextResponse.json({ ok: false, error: "Paste your existing SporeAgent agent id." }, { status: 400 });
    }
    const rec = await loadRecord(user.id);
    rec.sporeAgentId = agentId;
    rec.state.connections.sporeagent = {
      ok: true,
      detail: "Existing SporeAgent id saved. Amber will not register a new agent.",
      agentId,
    };
    await saveRecord(user.id, rec);
    await updatePlatform(user.id, "sporeagent", { connected: true, status: "connected", attention: "" });
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "moltjobs-connect") {
    const apiKey = String((body as { apiKey?: string }).apiKey || "").trim();
    if (!apiKey || apiKey.length > 200) {
      return NextResponse.json({ ok: false, error: "Paste your MoltJobs API key (mj_live_…)." }, { status: 400 });
    }
    if (!/^mj[_-]/i.test(apiKey)) {
      return NextResponse.json(
        { ok: false, error: "MoltJobs keys usually start with mj_live_. Paste the API key only — never a wallet private key." },
        { status: 400 },
      );
    }
    const rec = await loadRecord(user.id);
    rec.moltjobsApiKey = apiKey;
    rec.state.connections = rec.state.connections || ({} as typeof rec.state.connections);
    await saveRecord(user.id, rec);
    await updatePlatform(user.id, "moltjobs", {
      connected: true,
      status: "connected",
      attention: "API key saved. Amber will verify on the next scan.",
    });
    await refreshConnections(user.id);
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "workprotocol-connect") {
    const apiKey = String((body as { apiKey?: string }).apiKey || "").trim();
    const agentId = String((body as { agentId?: string }).agentId || "").trim();
    if (!apiKey || apiKey.length > 200) {
      return NextResponse.json({ ok: false, error: "Paste your WorkProtocol API key (wp_agent_…)." }, { status: 400 });
    }
    if (!/^wp_/i.test(apiKey)) {
      return NextResponse.json(
        { ok: false, error: "WorkProtocol keys start with wp_agent_. Paste the API key only." },
        { status: 400 },
      );
    }
    if (!agentId || agentId.length > 80) {
      return NextResponse.json({ ok: false, error: "Paste the WorkProtocol agent UUID from registration." }, { status: 400 });
    }
    const rec = await loadRecord(user.id);
    rec.workprotocolApiKey = apiKey;
    rec.workprotocolAgentId = agentId;
    await saveRecord(user.id, rec);
    await updatePlatform(user.id, "workprotocol", {
      connected: true,
      status: "connected",
      attention: "WorkProtocol credentials saved. Amber will claim on the next scan.",
    });
    await refreshConnections(user.id);
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "workprotocol-register") {
    const { registerWorkProtocolAgent } = await import("@/lib/amber-earnings/workprotocol");
    const reg = await registerWorkProtocolAgent({ name: "Amber" });
    if (!reg.ok || !reg.apiKey || !reg.agentId) {
      return NextResponse.json({ ok: false, error: reg.detail }, { status: 400 });
    }
    const rec = await loadRecord(user.id);
    rec.workprotocolApiKey = reg.apiKey;
    rec.workprotocolAgentId = reg.agentId;
    await saveRecord(user.id, rec);
    await updatePlatform(user.id, "workprotocol", {
      connected: true,
      status: "connected",
      attention: `Registered agent ${reg.agentId}. Key stored (shown once by WorkProtocol).`,
    });
    await refreshConnections(user.id);
    return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
  }

  if (body.action === "taskbounty-connect") {
    const started = await startDeviceLogin("Amber");
    const rec = await loadRecord(user.id);
    if (started.ok && started.deviceCode) {
      rec.deviceCode = started.deviceCode;
      rec.state.deviceAuth = {
        userCode: started.userCode || "",
        verificationUri: started.verificationUri || "https://www.task-bounty.com/link",
        verificationUriComplete: started.verificationUriComplete || "",
        expiresAt: new Date(Date.now() + (started.expiresIn || 900) * 1000).toISOString(),
        deviceCode: "",
      };
      await saveRecord(user.id, rec);
    }
    return NextResponse.json({
      ...(await payload(user.id, isPrivilegedRole(user.role))),
      ok: started.ok,
      ownerStep: started.ok
        ? {
            platform: "TaskBounty",
            whatINeedToDo: `Approve code ${started.userCode} in your already-signed-in TaskBounty Google account.`,
            whereToClick: started.verificationUriComplete,
            whyRequired: "Mints a scoped tb_live_ key. Amber never asks for your Google password.",
          }
        : undefined,
      error: started.ok ? undefined : started.detail,
    });
  }

  return NextResponse.json(await payload(user.id, isPrivilegedRole(user.role)));
}
