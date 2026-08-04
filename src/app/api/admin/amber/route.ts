import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import {
  getAmberAutonomousFlag,
  setAmberAutonomousFlag,
  getAmberEmergencyStop,
  setAmberEmergencyStop,
  getAmberAutoGenerate,
  setAmberAutoGenerate,
  getAmberContinuousCycle,
  setAmberContinuousCycle,
  getAmberLearningMode,
  setAmberLearningMode,
  getAmberLearningWorkspaces,
  setAmberLearningWorkspaces,
  getAmberNotifyPrefs,
  setAmberNotifyPrefs,
  logAmberAction,
  resolveAmberAccess,
} from "@/lib/amber-autonomous";
import { ensureSchema, sqlAsync, dbConfigured } from "@/lib/db";
import { readJsonLimited, PayloadTooLarge } from "@/lib/api-guard";
import { runAmberWeeklyCycle, geminiJson } from "@/lib/amber-weekly";
import { createAmberMission, executeAmberMission, reviewAmberProduction } from "@/lib/amber-execute";
import { runAmberAutonomousCycle, detectInfraVerificationNeeds, resolveVerificationHold } from "@/lib/amber-cycle";
import { generateExecutiveReport } from "@/lib/amber-reports";
import { refreshBusinessIntelligence, saveBusinessIntelligence, loadBusinessIntelligence, saveWebsiteTargets, setAllWebsiteVideosPerDay, getWebsiteTargets, getDailyVideoCap } from "@/lib/amber-intelligence";
import { buildAmberCampaign, retryFailedProductions } from "@/lib/amber-campaigns";
import { runDecisionEngine } from "@/lib/amber-decision";
import { rebalanceAmberCalendar } from "@/lib/amber-schedule";
import { assignAgentJobs, recommendInfrastructure } from "@/lib/amber-agents";
import { getAmberOpsDashboard, runLearningCyclesForWorkspaces } from "@/lib/amber-launch";
import { latestHealthSnapshot, computeBusinessHealth, saveHealthSnapshot } from "@/lib/amber-health";
import { latestExecutiveBrief, buildExecutiveBrief } from "@/lib/amber-executive";
import { ensureDepartments, listDepartments, pauseDepartment } from "@/lib/amber-departments";
import { recall, remember } from "@/lib/amber-memory";
import { createObjective, listObjectives } from "@/lib/amber-objectives";
import { listImprovements, setImprovementStatus, generateImprovements } from "@/lib/amber-improvements";
import { buildOpsConsole, runOwnerCommand, resolveAlert, scanAndRaiseAlerts, computeReadinessScore } from "@/lib/amber-ops";
import {
  getExecutiveDashboard,
  runExecutiveOpsPass,
  runExecutivePlanning,
  resolveApproval,
  generateExecBriefing,
} from "@/lib/amber-exec-ops";
import {
  getEnterpriseDashboard,
  syncEnterpriseWorkspaces,
  runEnterpriseIntelligencePass,
  searchKnowledgeGraph,
  generatePredictiveInsights,
  rebuildKnowledgeGraph,
  runSelfOptimization,
  generateEnterpriseBusinessReview,
} from "@/lib/amber-enterprise";
import { str } from "@/lib/workspace-api";
import { asRecord } from "@/lib/json";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 180;

async function requireSuperAdmin(): Promise<Response | null> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    return Response.json({ ok: false, error: "Super Admin session required." }, { status: 401 });
  }
  return null;
}

function parseDetail(detail: unknown) {
  try {
    return typeof detail === "string" ? JSON.parse(detail) : detail;
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  if (!dbConfigured()) {
    return Response.json({ ok: false, error: "Database not configured." }, { status: 503 });
  }
  const q = await sqlAsync();
  if (!q || !(await ensureSchema())) {
    return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
  }

  const url = new URL(req.url);
  const kindFilter = url.searchParams.get("kind") || "";
  const testerUserId = url.searchParams.get("userId") || "";

  const flagEnabled = await getAmberAutonomousFlag();
  const emergencyStop = await getAmberEmergencyStop();
  const autoGenerate = await getAmberAutoGenerate();
  const continuousCycle = await getAmberContinuousCycle();
  const learningMode = await getAmberLearningMode();
  const learningWorkspaces = await getAmberLearningWorkspaces();
  const notifyPrefs = await getAmberNotifyPrefs();
  const access = await resolveAmberAccess();
  let launchOps = null;
  let opsConsole = null;
  let enterprise = null;
  try {
    launchOps = await getAmberOpsDashboard(q);
  } catch {
    launchOps = null;
  }
  try {
    opsConsole = await buildOpsConsole(q);
  } catch {
    opsConsole = null;
  }
  try {
    enterprise = await getEnterpriseDashboard(q);
  } catch {
    enterprise = null;
  }

  const accounts = (await q`
    SELECT id, user_id AS "userId", provider, handle, display_name AS "displayName",
           status, created_at AS "createdAt"
    FROM social_accounts
    WHERE status != 'revoked'
    ORDER BY created_at DESC
    LIMIT 200
  `) as Record<string, unknown>[];

  const schedules = (await q`
    SELECT id, user_id AS "userId", title, status, approval_status AS "approvalStatus",
           amber_placed AS "amberPlaced", scheduled_at AS "scheduledAt", publish_result AS "publishResult"
    FROM schedule_items
    ORDER BY scheduled_at DESC
    LIMIT 100
  `) as Record<string, unknown>[];

  const publish = (await q`
    SELECT id, user_id AS "userId", title, status, approval_status AS "approvalStatus",
           updated_at AS "updatedAt", publish_result AS "publishResult"
    FROM publish_items
    ORDER BY updated_at DESC
    LIMIT 100
  `) as Record<string, unknown>[];

  const logsRaw = (await q`
    SELECT id, actor_user_id AS "actorUserId", actor_email AS "actorEmail", kind, title,
           detail, href, created_at AS "createdAt"
    FROM amber_action_logs
    ORDER BY created_at DESC
    LIMIT 300
  `) as Record<string, unknown>[];

  const logs = kindFilter
    ? logsRaw.filter((l) => String(l.kind).toLowerCase().includes(kindFilter.toLowerCase()))
    : logsRaw;

  const users = (await q`
    SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 100
  `) as { id: string; email: string; name: string | null }[];

  let tester: Record<string, unknown> | null = null;
  if (testerUserId) {
    const profile = (await q`
      SELECT company, industry, audience, goals, brand_rules AS "brandRules",
             approval_mode AS "approvalMode"
      FROM business_profiles WHERE user_id = ${testerUserId} LIMIT 1
    `) as Record<string, unknown>[];
    const emails = (await q`
      SELECT id, email, role, notes FROM amber_infra_emails WHERE user_id = ${testerUserId}
    `) as Record<string, unknown>[];
    const services = (await q`
      SELECT id, service, status, meta FROM amber_service_links WHERE user_id = ${testerUserId}
    `) as Record<string, unknown>[];
    const weeks = (await q`
      SELECT id, week_start AS "weekStart", status, report, strategy, created_at AS "createdAt"
      FROM amber_weeks WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 10
    `) as Record<string, unknown>[];
    const content = (await q`
      SELECT id, title, tool_slug AS "toolSlug", status, parent_id AS "parentId", week_id AS "weekId"
      FROM amber_content_requests WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 40
    `) as Record<string, unknown>[];
    const learning = (await q`
      SELECT patterns, updated_at AS "updatedAt" FROM amber_learning WHERE user_id = ${testerUserId} LIMIT 1
    `) as { patterns: string; updatedAt: string }[];
    const map = (await q`
      SELECT m.social_account_id AS "socialAccountId", m.infra_role AS "infraRole",
             a.provider, a.handle
      FROM amber_account_map m
      JOIN social_accounts a ON a.id = m.social_account_id
      WHERE m.user_id = ${testerUserId}
    `) as Record<string, unknown>[];
    const missions = (await q`
      SELECT id, goal, status, week_id AS "weekId", report, strategy, created_at AS "createdAt"
      FROM amber_missions WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 15
    `) as Record<string, unknown>[];
    const productions = (await q`
      SELECT id, title, tool_slug AS "toolSlug", status, review_status AS "reviewStatus",
             review_notes AS "reviewNotes", parent_id AS "parentId", mission_id AS "missionId",
             creation_id AS "creationId", schedule_id AS "scheduleId"
      FROM amber_productions WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 60
    `) as Record<string, unknown>[];
    const reports = (await q`
      SELECT id, period, summary, body, created_at AS "createdAt"
      FROM amber_reports WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 10
    `) as Record<string, unknown>[];
    const holds = (await q`
      SELECT id, provider, step, status, explanation, resume_hint AS "resumeHint", created_at AS "createdAt"
      FROM amber_verification_holds WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 20
    `) as Record<string, unknown>[];
    const campaigns = (await q`
      SELECT id, title, objective, status, created_at AS "createdAt"
      FROM amber_campaigns WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 20
    `) as Record<string, unknown>[];
    const decisions = (await q`
      SELECT id, kind, priority, title, rationale, action, status
      FROM amber_decisions WHERE user_id = ${testerUserId}
      ORDER BY priority ASC, created_at DESC LIMIT 30
    `) as Record<string, unknown>[];
    const agentJobs = (await q`
      SELECT id, agent, title, status, department, created_at AS "createdAt"
      FROM amber_agent_jobs WHERE user_id = ${testerUserId}
      ORDER BY created_at DESC LIMIT 30
    `) as Record<string, unknown>[];
    let intelligence = null;
    let infraRecs: { area: string; severity: string; detail: string }[] = [];
    let bos: Record<string, unknown> = {};
    try {
      intelligence = await loadBusinessIntelligence(q, testerUserId);
      infraRecs = (await recommendInfrastructure(q, testerUserId)).recommendations;
    } catch {
      intelligence = null;
    }
    try {
      await ensureDepartments(q, testerUserId);
      bos = {
        health: await latestHealthSnapshot(q, testerUserId),
        executive: await latestExecutiveBrief(q, testerUserId),
        departments: await listDepartments(q, testerUserId),
        objectives: await listObjectives(q, testerUserId),
        memory: await recall(q, testerUserId, { limit: 30 }),
        improvements: await listImprovements(q, testerUserId),
        execOps: await getExecutiveDashboard(q, testerUserId),
      };
    } catch {
      bos = {};
    }

    tester = {
      userId: testerUserId,
      profile: profile[0] || null,
      intelligence,
      emails,
      services,
      accountMap: map,
      weeks: weeks.map((w) => ({
        ...w,
        report: parseDetail(w.report),
        strategy: parseDetail(w.strategy),
      })),
      contentRequests: content,
      missions: missions.map((m) => ({
        ...m,
        report: parseDetail(m.report),
        strategy: parseDetail(m.strategy),
      })),
      productions,
      reports: reports.map((r) => ({ ...r, body: parseDetail(r.body) })),
      holds,
      campaigns,
      decisions,
      agentJobs,
      infraRecommendations: infraRecs,
      bos,
      learning: learning[0]
        ? { patterns: parseDetail(learning[0].patterns), updatedAt: learning[0].updatedAt }
        : null,
      accounts: accounts.filter((a) => a.userId === testerUserId),
      schedules: schedules.filter((s) => s.userId === testerUserId),
      publish: publish.filter((p) => p.userId === testerUserId),
    };
  }

  const errors = logs.filter((l) => String(l.kind).includes("error") || String(l.kind).includes("fail"));
  const amberPlaced = schedules.filter((s) => s.amberPlaced);
  const logKinds = [...new Set(logsRaw.map((l) => String(l.kind)))].sort();

  return Response.json({
    ok: true,
    flagEnabled,
    emergencyStop,
    autoGenerate,
    continuousCycle,
    learningMode,
    learningWorkspaces,
    launchOps,
    opsConsole,
    enterprise,
    notifyPrefs,
    access,
    summary: {
      connectedAccounts: accounts.length,
      scheduled: schedules.length,
      amberPlaced: amberPlaced.length,
      publishQueue: publish.length,
      logCount: logs.length,
      errorLike: errors.length,
    },
    users,
    tester,
    accounts,
    schedules,
    publish,
    logKinds,
    logs: logs.map((l) => ({ ...l, detail: parseDetail(l.detail) })),
    note: "Admin testing cockpit — customers cannot see Amber Autonomous Mode.",
  });
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonLimited(req, 64_000)) ?? {}) as Record<string, unknown>;
  } catch (e) {
    const tooBig = e instanceof PayloadTooLarge;
    return Response.json({ ok: false, error: tooBig ? "Too large." : "Invalid." }, { status: tooBig ? 413 : 400 });
  }

  if (body.action === "set_flag") {
    const enabled = Boolean(body.enabled);
    await setAmberAutonomousFlag(enabled, "super_admin");
    return Response.json({ ok: true, flagEnabled: enabled });
  }

  if (body.action === "set_emergency_stop") {
    const stopped = Boolean(body.stopped);
    await setAmberEmergencyStop(stopped, "super_admin");
    return Response.json({ ok: true, emergencyStop: stopped });
  }

  if (body.action === "set_auto_generate") {
    const enabled = Boolean(body.enabled);
    await setAmberAutoGenerate(enabled, "super_admin");
    return Response.json({ ok: true, autoGenerate: enabled });
  }

  if (body.action === "set_continuous_cycle") {
    const enabled = Boolean(body.enabled);
    await setAmberContinuousCycle(enabled, "super_admin");
    return Response.json({ ok: true, continuousCycle: enabled });
  }

  if (body.action === "set_learning_mode") {
    const enabled = Boolean(body.enabled);
    await setAmberLearningMode(enabled, "super_admin");
    return Response.json({ ok: true, learningMode: enabled });
  }

  if (body.action === "set_learning_workspaces") {
    const raw = body.userIds;
    const userIds = Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
    const next = await setAmberLearningWorkspaces(userIds, "super_admin");
    return Response.json({ ok: true, learningWorkspaces: next });
  }

  if (body.action === "run_learning_cycles") {
    if (!dbConfigured()) {
      return Response.json({ ok: false, error: "Database not configured." }, { status: 503 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const raw = body.userIds;
    const userIds = Array.isArray(raw) ? raw.map(String).filter(Boolean) : undefined;
    try {
      const batch = await runLearningCyclesForWorkspaces({
        q,
        actorEmail: "super_admin",
        actorUserId: null,
        userIds,
        goal: str(body.goal, 2000) || null,
      });
      return Response.json(batch);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Learning cycles failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "set_notify_prefs") {
    const prefs = await setAmberNotifyPrefs(
      {
        weeklyReport: body.weeklyReport !== undefined ? Boolean(body.weeklyReport) : undefined,
        verificationHolds: body.verificationHolds !== undefined ? Boolean(body.verificationHolds) : undefined,
        publishFailures: body.publishFailures !== undefined ? Boolean(body.publishFailures) : undefined,
        missionComplete: body.missionComplete !== undefined ? Boolean(body.missionComplete) : undefined,
        ownerInterventionsOnly:
          body.ownerInterventionsOnly !== undefined ? Boolean(body.ownerInterventionsOnly) : undefined,
      },
      "super_admin",
    );
    return Response.json({ ok: true, notifyPrefs: prefs });
  }

  if (body.action === "save_brand_rules") {
    const userId = str(body.userId, 80);
    const brandRules = str(body.brandRules, 4000);
    const approvalMode = body.approvalMode === "auto" ? "auto" : "require";
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const existing = (await q`
      SELECT company, industry, location, audience, style, goals, onboarding_complete
      FROM business_profiles WHERE user_id = ${userId} LIMIT 1
    `) as Record<string, unknown>[];
    const now = new Date().toISOString();
    const e = existing[0];
    await q`DELETE FROM business_profiles WHERE user_id = ${userId}`;
    await q`
      INSERT INTO business_profiles (
        user_id, company, industry, location, audience, style, goals, brand_rules,
        approval_mode, onboarding_complete, updated_at
      ) VALUES (
        ${userId},
        ${String(e?.company || "")},
        ${String(e?.industry || "")},
        ${String(e?.location || "")},
        ${String(e?.audience || "")},
        ${String(e?.style || "")},
        ${String(e?.goals || "")},
        ${brandRules},
        ${approvalMode},
        ${Boolean(e?.onboarding_complete ?? true)},
        ${now}
      )`;
    await logAmberAction({
      actorUserId: null,
      actorEmail: "super_admin",
      kind: "brand_rules",
      title: "Brand rules / approval updated",
      detail: { userId, approvalMode },
    });
    return Response.json({ ok: true, userId, brandRules, approvalMode });
  }

  if (body.action === "run_week") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const stop = await getAmberEmergencyStop();
    if (stop) {
      return Response.json(
        { ok: false, error: "amber_emergency_stop", message: "Emergency stop is ON." },
        { status: 403 },
      );
    }
    const flag = await getAmberAutonomousFlag();
    if (!flag) {
      return Response.json(
        { ok: false, error: "amber_admin_only", message: "Enable Amber Autonomous Mode first." },
        { status: 403 },
      );
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    try {
      const result = await runAmberWeeklyCycle({
        q,
        userId,
        actorEmail: "super_admin",
        actorUserId: null,
      });
      return Response.json({ ok: true, ...result });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Weekly cycle failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "create_mission" || body.action === "execute_mission") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop", message: "Emergency stop is ON." }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only", message: "Enable Amber first." }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }

    let missionId = str(body.missionId, 80);
    if (body.action === "create_mission" || body.action === "execute_mission") {
      const goal = str(body.goal, 2000);
      if (!missionId) {
        if (!goal) return Response.json({ ok: false, error: "goal or missionId required." }, { status: 400 });
        const created = await createAmberMission(q, userId, goal);
        missionId = created.missionId;
        if (body.action === "create_mission") {
          return Response.json({ ok: true, missionId, goal });
        }
      }
    }

    try {
      const result = await executeAmberMission({
        q,
        userId,
        missionId,
        actorEmail: "super_admin",
        actorUserId: null,
      });
      return Response.json({ ok: true, ...result });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Mission execute failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "review_production") {
    const userId = str(body.userId, 80);
    const productionId = str(body.productionId, 80);
    const decision = str(body.decision, 20) as "approve" | "improve" | "reject" | "";
    if (!userId || !productionId) {
      return Response.json({ ok: false, error: "userId and productionId required." }, { status: 400 });
    }
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop" }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const force = decision === "approve" || decision === "improve" || decision === "reject" ? decision : undefined;
    try {
      const result = await reviewAmberProduction(q, userId, productionId, force);
      return Response.json({ ok: true, productionId, ...result });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Review failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "run_cycle" || body.action === "run_bos_cycle") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop", message: "Emergency stop is ON." }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only", message: "Enable Amber first." }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    try {
      const result = await runAmberAutonomousCycle({
        q,
        userId,
        goal: str(body.goal, 2000) || null,
        actorEmail: "super_admin",
        actorUserId: null,
        learningMode: true,
      });
      return Response.json({ ok: true, ...result });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Cycle failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "build_executive_brief") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const health = await computeBusinessHealth(q, userId);
    const brief = await buildExecutiveBrief(q, userId, {
      health,
      goal: str(body.goal, 2000) || null,
      actorEmail: "super_admin",
    });
    return Response.json({ ok: true, ...brief, health });
  }

  if (body.action === "compute_health") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const scores = await computeBusinessHealth(q, userId);
    const saved = await saveHealthSnapshot(q, userId, scores, null, "super_admin");
    return Response.json({ ok: true, ...saved });
  }

  if (body.action === "save_objective") {
    const userId = str(body.userId, 80);
    const goal = str(body.goal, 2000);
    if (!userId || !goal) return Response.json({ ok: false, error: "userId and goal required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const result = await createObjective(q, userId, goal, { actorEmail: "super_admin" });
    return Response.json({ ok: true, ...result, objectives: await listObjectives(q, userId) });
  }

  if (body.action === "ensure_departments") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    return Response.json({ ok: true, departments: await ensureDepartments(q, userId) });
  }

  if (body.action === "set_department") {
    const userId = str(body.userId, 80);
    const slug = str(body.slug, 40);
    if (!userId || !slug) return Response.json({ ok: false, error: "userId and slug required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    await pauseDepartment(q, userId, slug, Boolean(body.paused));
    return Response.json({ ok: true, departments: await listDepartments(q, userId) });
  }

  if (body.action === "write_memory") {
    const userId = str(body.userId, 80);
    const title = str(body.title, 200);
    if (!userId || !title) return Response.json({ ok: false, error: "userId and title required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const id = await remember(q, userId, {
      kind: (str(body.kind, 40) || "preference") as "preference" | "decision" | "win" | "loss" | "seasonal" | "customer" | "campaign" | "lesson",
      title,
      body: str(body.body, 4000),
      actorEmail: "super_admin",
    });
    return Response.json({ ok: true, id, memory: await recall(q, userId, { limit: 30 }) });
  }

  if (body.action === "list_improvements" || body.action === "generate_improvements") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    if (body.action === "generate_improvements") {
      const health = await computeBusinessHealth(q, userId);
      await generateImprovements(q, userId, {
        goal: str(body.goal, 2000) || "Improve operations",
        health,
        actorEmail: "super_admin",
      });
    }
    return Response.json({ ok: true, improvements: await listImprovements(q, userId) });
  }

  if (body.action === "set_improvement_status") {
    const userId = str(body.userId, 80);
    const improvementId = str(body.improvementId, 80);
    const status = str(body.status, 20) as "open" | "accepted" | "dismissed" | "done";
    if (!userId || !improvementId || !["open", "accepted", "dismissed", "done"].includes(status)) {
      return Response.json({ ok: false, error: "userId, improvementId, status required." }, { status: 400 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    await setImprovementStatus(q, userId, improvementId, status);
    return Response.json({ ok: true, improvements: await listImprovements(q, userId) });
  }

  if (body.action === "generate_report") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop" }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only" }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const result = await generateExecutiveReport({
      q,
      userId,
      weekId: str(body.weekId, 80) || null,
      missionId: str(body.missionId, 80) || null,
      actorEmail: "super_admin",
    });
    return Response.json({ ok: true, ...result });
  }

  if (body.action === "refresh_intelligence") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop" }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only" }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const result = await refreshBusinessIntelligence(q, userId, "super_admin");
    return Response.json({ ok: true, ...result });
  }

  if (body.action === "save_intelligence") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const intelligence = await saveBusinessIntelligence(q, userId, {
      competitors: str(body.competitors, 2000),
      serviceAreas: str(body.serviceAreas, 1000),
      seasonalTrends: str(body.seasonalTrends, 2000),
      products: str(body.products, 2000),
      services: str(body.services, 2000),
      marketingObjectives: str(body.marketingObjectives, 2000),
      brandRules: body.brandRules != null ? str(body.brandRules, 4000) : undefined,
      goals: body.goals != null ? str(body.goals, 500) : undefined,
    });
    return Response.json({ ok: true, intelligence });
  }

  if (body.action === "save_websites") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const raw = Array.isArray(body.websites) ? body.websites : [];
    const websites = raw.map((row) => {
      const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      return {
        url: str(r.url, 300),
        videosPerDay: Number(r.videosPerDay ?? 1),
        label: str(r.label, 80) || undefined,
      };
    });
    const intelligence = await saveWebsiteTargets(q, userId, websites, "super_admin");
    return Response.json({
      ok: true,
      websites: getWebsiteTargets(intelligence),
      dailyCap: getDailyVideoCap(intelligence),
      intelligence,
    });
  }

  if (body.action === "set_all_videos_per_day") {
    const videosPerDay = Number(body.videosPerDay);
    if (!Number.isFinite(videosPerDay)) {
      return Response.json({ ok: false, error: "videosPerDay required." }, { status: 400 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.map((id) => str(id, 80)).filter(Boolean)
      : str(body.userId, 80)
        ? [str(body.userId, 80)]
        : [];
    if (!userIds.length) {
      return Response.json({ ok: false, error: "userId or userIds required." }, { status: 400 });
    }
    const results: { userId: string; dailyCap: number; websites: ReturnType<typeof getWebsiteTargets> }[] = [];
    for (const userId of userIds.slice(0, 40)) {
      const intelligence = await setAllWebsiteVideosPerDay(q, userId, videosPerDay, "super_admin");
      results.push({
        userId,
        dailyCap: getDailyVideoCap(intelligence),
        websites: getWebsiteTargets(intelligence),
      });
    }
    return Response.json({ ok: true, videosPerDay, results });
  }

  if (body.action === "detect_holds") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const result = await detectInfraVerificationNeeds(q, userId);
    return Response.json({ ok: true, ...result });
  }

  if (body.action === "resolve_hold") {
    const userId = str(body.userId, 80);
    const holdId = str(body.holdId, 80);
    if (!userId || !holdId) return Response.json({ ok: false, error: "userId and holdId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    await resolveVerificationHold(q, userId, holdId);
    return Response.json({ ok: true, holdId });
  }

  if (body.action === "build_campaign" || body.action === "run_decisions" || body.action === "assign_agents" || body.action === "rebalance_calendar" || body.action === "retry_productions") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop" }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only" }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    if (body.action === "build_campaign") {
      const objective = str(body.objective, 2000) || str(body.goal, 2000);
      if (!objective) return Response.json({ ok: false, error: "objective required." }, { status: 400 });
      const result = await buildAmberCampaign({ q, userId, objective, actorEmail: "super_admin" });
      return Response.json({ ok: true, ...result });
    }
    if (body.action === "run_decisions") {
      const result = await runDecisionEngine(q, userId, "super_admin");
      return Response.json({ ok: true, ...result });
    }
    if (body.action === "assign_agents") {
      const goal = str(body.goal, 2000) || "Weekly marketing operations";
      const result = await assignAgentJobs({ q, userId, goal, actorEmail: "super_admin" });
      return Response.json({ ok: true, ...result });
    }
    if (body.action === "rebalance_calendar") {
      const result = await rebalanceAmberCalendar(q, userId, "super_admin");
      return Response.json({ ok: true, ...result });
    }
    const result = await retryFailedProductions(q, userId, 2);
    return Response.json({ ok: true, ...result });
  }

  if (body.action === "setup_generate") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop", message: "Emergency stop is ON." }, { status: 403 });
    }
    if (!(await getAmberAutonomousFlag())) {
      return Response.json({ ok: false, error: "amber_admin_only", message: "Enable Amber first." }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const profile = (await q`
      SELECT company, industry, audience, goals, brand_rules AS "brandRules"
      FROM business_profiles WHERE user_id = ${userId} LIMIT 1
    `) as Record<string, unknown>[];
    const kit = (await q`
      SELECT brand_name AS "brandName", extra FROM brand_kits WHERE user_id = ${userId} LIMIT 1
    `) as Record<string, unknown>[];
    const company = String(kit[0]?.brandName || profile[0]?.company || "the business");
    const domainGuess =
      company
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24) || "company";

    let plan: Record<string, unknown>;
    try {
      plan = await geminiJson(`You are Amber planning business email/account infrastructure (plan only).
Brand: ${company}
Industry: ${profile[0]?.industry || ""}
Audience: ${profile[0]?.audience || ""}
Goals: ${profile[0]?.goals || ""}
Brand rules: ${profile[0]?.brandRules || ""}
Return JSON:
{
  "summary": "2 sentences",
  "emails": [{"email":"role@${domainGuess}.com","role":"admin|marketing|social|content|other","notes":"..."}],
  "services": [{"service":"google_workspace|microsoft365|other","status":"planned","notes":"..."}]
}
Include admin, marketing, social, content. Status planned only.`);
    } catch {
      plan = {
        summary: `Recommended mailbox plan for ${company} (tracking only).`,
        emails: [
          { email: `admin@${domainGuess}.com`, role: "admin", notes: "Owner / billing" },
          { email: `marketing@${domainGuess}.com`, role: "marketing", notes: "Campaigns" },
          { email: `social@${domainGuess}.com`, role: "social", notes: "Social ops" },
          { email: `content@${domainGuess}.com`, role: "content", notes: "Creators" },
        ],
        services: [
          { service: "google_workspace", status: "planned", notes: "Owner connects manually" },
          { service: "microsoft365", status: "n/a", notes: "Optional" },
        ],
      };
    }

    const now = new Date().toISOString();
    await q`DELETE FROM amber_infra_emails WHERE user_id = ${userId}`;
    await q`DELETE FROM amber_service_links WHERE user_id = ${userId}`;
    for (const e of (Array.isArray(plan.emails) ? plan.emails : []).slice(0, 12)) {
      const row = asRecord(e);
      const email = String(row.email || "").slice(0, 160);
      if (!email) continue;
      await q`
        INSERT INTO amber_infra_emails (id, user_id, email, role, notes, created_at)
        VALUES (
          ${randomUUID()}, ${userId}, ${email},
          ${String(row.role || "other").slice(0, 40)},
          ${String(row.notes || "").slice(0, 500)}, ${now}
        )`;
    }
    for (const s of (Array.isArray(plan.services) ? plan.services : []).slice(0, 8)) {
      const row = asRecord(s);
      await q`
        INSERT INTO amber_service_links (id, user_id, service, status, meta, created_at)
        VALUES (
          ${randomUUID()}, ${userId},
          ${String(row.service || "other").slice(0, 60)},
          ${String(row.status || "planned").slice(0, 40)},
          ${JSON.stringify({ notes: String(row.notes || "").slice(0, 500) })}, ${now}
        )`;
    }
    await logAmberAction({
      actorUserId: null,
      actorEmail: "super_admin",
      kind: "setup_generate",
      title: "Amber business setup plan generated",
      detail: { userId },
    });
    return Response.json({ ok: true, summary: plan.summary, note: "Plan + track only." });
  }

  if (body.action === "map_account") {
    const userId = str(body.userId, 80);
    const socialAccountId = str(body.socialAccountId, 80);
    const infraRole = str(body.infraRole, 40) || "social";
    if (!userId || !socialAccountId) {
      return Response.json({ ok: false, error: "userId and socialAccountId required." }, { status: 400 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    const owns = (await q`
      SELECT id FROM social_accounts WHERE id = ${socialAccountId} AND user_id = ${userId} LIMIT 1
    `) as { id: string }[];
    if (!owns[0]) return Response.json({ ok: false, error: "Account not found." }, { status: 404 });
    await q`DELETE FROM amber_account_map WHERE social_account_id = ${socialAccountId}`;
    await q`
      INSERT INTO amber_account_map (social_account_id, user_id, infra_role, notes)
      VALUES (${socialAccountId}, ${userId}, ${infraRole}, ${""})`;
    await logAmberAction({
      actorUserId: null,
      actorEmail: "super_admin",
      kind: "setup_map_account",
      title: "Mapped social account to infra role",
      detail: { socialAccountId, infraRole, userId },
    });
    return Response.json({ ok: true, socialAccountId, infraRole });
  }

  if (body.action === "log_note") {
    await logAmberAction({
      actorUserId: null,
      actorEmail: "super_admin",
      kind: "admin_note",
      title: String(body.title || "Admin note").slice(0, 200),
      detail: { body: String(body.body || "").slice(0, 2000) },
    });
    return Response.json({ ok: true });
  }

  if (body.action === "ops_console_refresh" || body.action === "scan_alerts" || body.action === "compute_readiness") {
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    if (body.action === "scan_alerts") {
      const scanned = await scanAndRaiseAlerts(q);
      return Response.json({ ok: true, ...scanned, opsConsole: await buildOpsConsole(q) });
    }
    if (body.action === "compute_readiness") {
      const readiness = await computeReadinessScore(q);
      return Response.json({ ok: true, ...readiness, opsConsole: await buildOpsConsole(q) });
    }
    return Response.json({ ok: true, opsConsole: await buildOpsConsole(q) });
  }

  if (body.action === "resolve_ops_alert") {
    const alertId = str(body.alertId, 80);
    if (!alertId) return Response.json({ ok: false, error: "alertId required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    await resolveAlert(q, alertId, "super_admin");
    return Response.json({ ok: true, alertId, opsConsole: await buildOpsConsole(q) });
  }

  if (body.action === "owner_command") {
    const command = str(body.command, 80);
    if (!command) return Response.json({ ok: false, error: "command required." }, { status: 400 });
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    try {
      const result = await runOwnerCommand(q, {
        command,
        userId: str(body.userId, 80) || null,
        actorEmail: "super_admin",
        meta: (body.meta as Record<string, unknown>) || {},
      });
      return Response.json({ ok: true, ...result, opsConsole: await buildOpsConsole(q) });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Command failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "exec_plan" || body.action === "exec_ops_pass" || body.action === "exec_briefing") {
    const userId = str(body.userId, 80);
    if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
    if (await getAmberEmergencyStop()) {
      return Response.json({ ok: false, error: "amber_emergency_stop" }, { status: 403 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    try {
      if (body.action === "exec_plan") {
        const goal = str(body.goal, 2000);
        if (!goal) return Response.json({ ok: false, error: "goal required." }, { status: 400 });
        const result = await runExecutivePlanning(q, userId, goal, "super_admin");
        return Response.json({ ok: true, ...result });
      }
      if (body.action === "exec_briefing") {
        const kind = (str(body.kind, 20) || "weekly") as "daily" | "weekly" | "monthly";
        return Response.json({ ok: true, ...(await generateExecBriefing(q, userId, kind, "super_admin")) });
      }
      const result = await runExecutiveOpsPass(q, userId, str(body.goal, 2000) || null, "super_admin");
      return Response.json(result);
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Executive ops failed." },
        { status: 500 },
      );
    }
  }

  if (body.action === "resolve_approval") {
    const userId = str(body.userId, 80);
    const approvalId = str(body.approvalId, 80);
    const decision = str(body.decision, 20) as "approved" | "rejected";
    if (!userId || !approvalId || !["approved", "rejected"].includes(decision)) {
      return Response.json({ ok: false, error: "userId, approvalId, decision required." }, { status: 400 });
    }
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    await resolveApproval(q, userId, approvalId, decision, "super_admin");
    return Response.json({ ok: true, approvalId, decision });
  }

  if (
    body.action === "enterprise_sync" ||
    body.action === "enterprise_pass" ||
    body.action === "enterprise_predict" ||
    body.action === "enterprise_review" ||
    body.action === "enterprise_graph" ||
    body.action === "enterprise_optimize" ||
    body.action === "enterprise_search"
  ) {
    const q = await sqlAsync();
    if (!q || !(await ensureSchema())) {
      return Response.json({ ok: false, error: "Storage unavailable." }, { status: 503 });
    }
    try {
      if (body.action === "enterprise_sync") {
        return Response.json({ ok: true, ...(await syncEnterpriseWorkspaces(q, "super_admin")), enterprise: await getEnterpriseDashboard(q) });
      }
      if (body.action === "enterprise_pass") {
        const result = await runEnterpriseIntelligencePass(q, "super_admin");
        return Response.json({ ok: true, ...result, enterprise: await getEnterpriseDashboard(q) });
      }
      if (body.action === "enterprise_predict") {
        return Response.json({
          ok: true,
          forecasts: await generatePredictiveInsights(q, str(body.userId, 80) || null),
          enterprise: await getEnterpriseDashboard(q),
        });
      }
      if (body.action === "enterprise_review") {
        const kind = (str(body.kind, 20) || "weekly") as
          | "daily"
          | "weekly"
          | "monthly"
          | "quarterly"
          | "annual";
        return Response.json({
          ok: true,
          ...(await generateEnterpriseBusinessReview(q, kind, "super_admin")),
          enterprise: await getEnterpriseDashboard(q),
        });
      }
      if (body.action === "enterprise_graph") {
        const userId = str(body.userId, 80);
        if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
        return Response.json({ ok: true, ...(await rebuildKnowledgeGraph(q, userId)) });
      }
      if (body.action === "enterprise_optimize") {
        const userId = str(body.userId, 80);
        if (!userId) return Response.json({ ok: false, error: "userId required." }, { status: 400 });
        return Response.json({ ok: true, ...(await runSelfOptimization(q, userId, "super_admin")) });
      }
      if (body.action === "enterprise_search") {
        return Response.json({
          ok: true,
          ...(await searchKnowledgeGraph(q, str(body.q, 120) || "", str(body.userId, 80) || null)),
        });
      }
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "Enterprise action failed." },
        { status: 500 },
      );
    }
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
