import { randomUUID } from "node:crypto";
import { asRecord } from "@/lib/json";
import { geminiJson } from "@/lib/amber-weekly";
import { logAmberAction, getAmberContinuousCycle, getAmberLearningMode } from "@/lib/amber-autonomous";
import { loadBusinessIntelligence, refreshBusinessIntelligence, biPromptBlock, recordPerformance } from "@/lib/amber-intelligence";
import { generateExecutiveReport, collectWorkspaceOutcomes } from "@/lib/amber-reports";
import { createAmberMission, executeAmberMission } from "@/lib/amber-execute";
import { buildAmberCampaign, retryFailedProductions } from "@/lib/amber-campaigns";
import { runDecisionEngine } from "@/lib/amber-decision";
import { rebalanceAmberCalendar, detectDuplicateScheduleTopics } from "@/lib/amber-schedule";
import { assignAgentJobs, recommendInfrastructure } from "@/lib/amber-agents";
import {
  applyCycleLearning,
  completeCycleRun,
  recordOpsMetric,
  startCycleRun,
} from "@/lib/amber-launch";
import { writeCheckpoint, raiseAlert } from "@/lib/amber-ops";
import { recall, writeCycleMemories, memoryPromptBlock } from "@/lib/amber-memory";
import { computeBusinessHealth, saveHealthSnapshot } from "@/lib/amber-health";
import { buildExecutiveBrief } from "@/lib/amber-executive";
import { applyBriefPriorities, ensureDepartments } from "@/lib/amber-departments";
import { activeObjectiveGoal, linkObjectiveArtifacts } from "@/lib/amber-objectives";
import { generateImprovements } from "@/lib/amber-improvements";
import { AMBER_HONESTY_NOTE } from "@/lib/amber-explain";
import { runExecutiveOpsPass } from "@/lib/amber-exec-ops";
import type { Sql } from "@/lib/workspace-api";

/**
 * Amber 32 BOS weekly cycle — COO orchestration over Learning Mode.
 * All data scoped to userId (workspace isolation).
 */
export async function runAmberAutonomousCycle(input: {
  q: Sql;
  userId: string;
  goal?: string | null;
  actorEmail: string | null;
  actorUserId: string | null;
  learningMode?: boolean;
}): Promise<Record<string, unknown>> {
  const { q, userId, actorEmail, actorUserId } = input;
  const started = Date.now();
  const now = new Date().toISOString();
  const steps: { step: string; ok: boolean; detail?: unknown }[] = [];
  const learningMode = Boolean(input.learningMode) || (await getAmberLearningMode());
  const cycleRunId = await startCycleRun(q, userId, (input.goal || "").slice(0, 2000) || "pending");
  const orchestrationId = randomUUID();

  await q`
    INSERT INTO amber_orchestration_runs (
      id, user_id, cycle_id, objective_id, executive_brief_id, campaign_id, mission_id, report_id,
      department_jobs, status, created_at, completed_at
    ) VALUES (
      ${orchestrationId}, ${userId}, ${cycleRunId}, ${null}, ${null}, ${null}, ${null}, ${null},
      ${"[]"}, ${"running"}, ${now}, ${null}
    )`;

  try {
    // 1. Memory + BI
    const memory = await recall(q, userId, { limit: 20 });
    steps.push({ step: "recall_company_memory", ok: true, detail: { count: memory.length } });
    await writeCheckpoint(q, { cycleId: cycleRunId, userId, step: "recall_company_memory", detail: { count: memory.length } });

    let biRefresh: Record<string, unknown> = {};
    try {
      const r = await refreshBusinessIntelligence(q, userId, actorEmail);
      biRefresh = { summary: r.insights.summary };
      steps.push({ step: "refresh_business_intelligence", ok: true, detail: biRefresh });
    } catch (e) {
      steps.push({
        step: "refresh_business_intelligence",
        ok: false,
        detail: e instanceof Error ? e.message : "bi failed",
      });
    }

    const priorOutcomes = await collectWorkspaceOutcomes(q, userId);
    steps.push({ step: "review_previous_week", ok: true, detail: { scheduled: priorOutcomes.postsScheduled } });

    // 2. Health
    const healthScores = await computeBusinessHealth(q, userId);
    await saveHealthSnapshot(q, userId, healthScores, cycleRunId, actorEmail);
    steps.push({ step: "compute_business_health", ok: true, detail: { overall: healthScores.overall } });
    await writeCheckpoint(q, {
      cycleId: cycleRunId,
      userId,
      step: "compute_business_health",
      detail: { overall: healthScores.overall },
    });

    const bi = await loadBusinessIntelligence(q, userId);
    const activeObj = await activeObjectiveGoal(q, userId);

    // 3. Goal
    let goal = (input.goal || "").trim();
    if (!goal && activeObj) goal = activeObj.goal;
    if (!goal) {
      try {
        const g = await geminiJson(`Amber BOS strategy: pick ONE weekly marketing mission goal.
Business:
${biPromptBlock(bi)}
Memory:
${memoryPromptBlock(memory)}
Health overall: ${healthScores.overall}
Prior: ${JSON.stringify(priorOutcomes).slice(0, 1200)}
Return JSON: { "goal": "...", "priorities": ["..."] }`);
        goal = String(g.goal || bi.marketingObjectives || bi.goals || "Grow brand awareness this week").slice(0, 2000);
      } catch {
        goal = (bi.marketingObjectives || bi.goals || "Grow brand awareness this week").slice(0, 2000);
      }
    }
    await q`UPDATE amber_cycle_runs SET goal = ${goal} WHERE id = ${cycleRunId}`;
    steps.push({ step: "build_strategy", ok: true, detail: { goal, objectiveId: activeObj?.id || null } });

    // 4. Executive brief
    const brief = await buildExecutiveBrief(q, userId, {
      health: healthScores,
      goal,
      cycleId: cycleRunId,
      actorEmail,
    });
    steps.push({
      step: "build_executive_brief",
      ok: true,
      detail: { briefId: brief.briefId, confidence: brief.confidence },
    });
    await writeCheckpoint(q, {
      cycleId: cycleRunId,
      userId,
      step: "build_executive_brief",
      detail: { briefId: brief.briefId },
    });

    // 5. Decisions
    const decisions = await runDecisionEngine(q, userId, actorEmail);
    steps.push({
      step: "review_competitors_opportunities",
      ok: true,
      detail: { count: decisions.decisions.length },
    });

    // 6. Departments
    await ensureDepartments(q, userId);
    const priorities = Array.isArray(brief.body.priorities)
      ? (brief.body.priorities as unknown[]).map(String)
      : [goal];
    const departments = await applyBriefPriorities(q, userId, priorities, actorEmail);
    steps.push({ step: "department_priorities", ok: true, detail: { count: departments.length } });

    // 7. Campaign
    const campaign = await buildAmberCampaign({ q, userId, objective: goal, actorEmail });
    steps.push({ step: "generate_campaigns", ok: true, detail: { campaignId: campaign.campaignId } });

    // 8. Workforce
    const agents = await assignAgentJobs({
      q,
      userId,
      goal,
      campaignId: campaign.campaignId,
      actorEmail,
    });
    steps.push({
      step: "assign_department_workers",
      ok: true,
      detail: { jobs: agents.jobs.length },
    });

    const infra = await recommendInfrastructure(q, userId);
    steps.push({ step: "infra_recommendations", ok: true, detail: infra });

    // 9. Mission execute
    const { missionId } = await createAmberMission(q, userId, goal);
    await q`UPDATE amber_campaigns SET mission_id = ${missionId}, updated_at = ${now} WHERE id = ${campaign.campaignId}`;
    if (activeObj?.id) {
      await linkObjectiveArtifacts(q, activeObj.id, userId, {
        missionId,
        campaignId: campaign.campaignId,
      });
    }

    let missionResult: Record<string, unknown> = {};
    try {
      missionResult = await executeAmberMission({
        q,
        userId,
        missionId,
        actorEmail,
        actorUserId,
      });
      steps.push({
        step: "qa_content_calendar_queue",
        ok: true,
        detail: {
          status: missionResult.status,
          productions: missionResult.productionIds,
          schedules: missionResult.scheduleIds,
        },
      });
      await writeCheckpoint(q, {
        cycleId: cycleRunId,
        userId,
        step: "qa_content_calendar_queue",
        detail: { status: missionResult.status },
      });
    } catch (e) {
      steps.push({
        step: "qa_content_calendar_queue",
        ok: false,
        detail: e instanceof Error ? e.message : "mission failed",
      });
      await writeCheckpoint(q, {
        cycleId: cycleRunId,
        userId,
        step: "qa_content_calendar_queue",
        status: "failed",
        detail: { error: e instanceof Error ? e.message : "mission failed" },
      });
      throw e;
    }

    const retries = await retryFailedProductions(q, userId, 2);
    steps.push({ step: "improve_content_if_needed", ok: true, detail: retries });

    const dups = await detectDuplicateScheduleTopics(q, userId);
    const rebalance = await rebalanceAmberCalendar(q, userId, actorEmail);
    steps.push({
      step: "organize_library_calendar",
      ok: true,
      detail: { rebalanced: rebalance.updated, duplicates: dups.duplicates.length },
    });

    // 10. Performance
    const after = await collectWorkspaceOutcomes(q, userId);
    await recordPerformance(
      q,
      userId,
      "cycle_outcomes",
      {
        videosCreated: after.videosCreated,
        scheduled: after.postsScheduled,
        publishedAttempted: after.postsPublishedAttempted,
        publishFailures: after.publishFailures,
        approved: after.productionsApproved,
        rejected: after.productionsRejected,
      },
      missionId,
      "Post-cycle workspace snapshot",
    );
    steps.push({ step: "collect_performance", ok: true, detail: after });

    // 11. Report
    const report = await generateExecutiveReport({
      q,
      userId,
      weekId: typeof missionResult.weekId === "string" ? missionResult.weekId : null,
      missionId,
      actorEmail,
      ownerNarrative: brief.narrative,
    });
    steps.push({ step: "generate_executive_report", ok: true, detail: { reportId: report.reportId } });

    // 12. Memory + improvements
    await writeCycleMemories(q, userId, {
      goal,
      stepsOk: steps.filter((s) => s.ok).length,
      stepsFailed: steps.filter((s) => !s.ok).length,
      reportSummary: report.summary,
      cycleId: cycleRunId,
      actorEmail: actorEmail ?? undefined,
    });
    steps.push({ step: "write_company_memory", ok: true });

    const improvements = await generateImprovements(q, userId, {
      goal,
      health: healthScores,
      reportSummary: report.summary,
      actorEmail,
    });
    steps.push({ step: "generate_improvements", ok: true, detail: { count: improvements.length } });

    let nextWeek: Record<string, unknown> = {};
    try {
      nextWeek = await geminiJson(`Prepare next week's Amber BOS focus.
Goal: ${goal}
Narrative: ${brief.narrative.slice(0, 600)}
Interrupt owner ONLY for verification/OAuth/permissions/legal/approval.
Return JSON: { "focus": "...", "campaignIdeas": ["..."], "ownerAsks": [] }`);
    } catch {
      nextWeek = { focus: "Continue BOS priorities", campaignIdeas: [], ownerAsks: [] };
    }
    steps.push({ step: "prepare_next_week", ok: true, detail: nextWeek });

    const continuous = await getAmberContinuousCycle();
    const learningDelta = learningMode
      ? await applyCycleLearning(q, userId, {
          cycleId: cycleRunId,
          goal,
          steps,
          nextWeek,
          reportSummary: report.summary,
          campaignId: campaign.campaignId,
          outcomes: {
            videosCreated: after.videosCreated,
            scheduled: after.postsScheduled,
            publishedAttempted: after.postsPublishedAttempted,
            publishFailures: after.publishFailures,
          },
        })
      : {};
    steps.push({ step: "update_learning_engine", ok: true, detail: { applied: learningMode } });

    let executiveOps: Record<string, unknown> = {};
    try {
      executiveOps = await runExecutiveOpsPass(q, userId, goal, actorEmail);
      steps.push({
        step: "executive_ops_pass",
        ok: true,
        detail: {
          planId: (executiveOps.planning as { planId?: string } | undefined)?.planId,
          briefingId: (executiveOps.briefing as { briefingId?: string } | undefined)?.briefingId,
        },
      });
      await writeCheckpoint(q, {
        cycleId: cycleRunId,
        userId,
        step: "executive_ops_pass",
        detail: { ok: true },
      });
    } catch (e) {
      steps.push({
        step: "executive_ops_pass",
        ok: false,
        detail: e instanceof Error ? e.message : "exec ops failed",
      });
    }

    await writeCheckpoint(q, {
      cycleId: cycleRunId,
      userId,
      step: "cycle_complete",
      detail: { reportId: report.reportId, learningMode },
    });

    const ownerAsks = Array.isArray(nextWeek.ownerAsks) ? nextWeek.ownerAsks : [];
    const durationMs = Date.now() - started;
    const qaPassRate =
      after.productionsApproved + after.productionsRejected > 0
        ? after.productionsApproved / (after.productionsApproved + after.productionsRejected)
        : null;

    await completeCycleRun(q, cycleRunId, {
      status: "completed",
      steps,
      decisions: decisions.decisions,
      learningDelta,
      reportId: report.reportId,
      missionId,
      campaignId: campaign.campaignId,
      ownerAsks,
      durationMs,
    });

    await q`
      UPDATE amber_orchestration_runs SET
        objective_id = ${activeObj?.id ?? null},
        executive_brief_id = ${brief.briefId},
        campaign_id = ${campaign.campaignId},
        mission_id = ${missionId},
        report_id = ${report.reportId},
        department_jobs = ${JSON.stringify(agents.jobs)},
        status = ${"completed"},
        completed_at = ${new Date().toISOString()}
      WHERE id = ${orchestrationId}`;

    await recordOpsMetric(q, {
      kind: "cycle_complete",
      workspaceUserId: userId,
      cycleId: cycleRunId,
      metrics: {
        durationMs,
        stepsOk: steps.filter((s) => s.ok).length,
        stepsFailed: steps.filter((s) => !s.ok).length,
        ownerAsks: ownerAsks.length,
        qaPassRate,
        learningMode,
        continuous,
        recoveryRetries: retries.retried.length,
        healthOverall: healthScores.overall,
        executiveConfidence: brief.confidence,
        bos: true,
      },
      note: "Amber 32 BOS operational metrics",
    });

    await logAmberAction({
      actorUserId: actorUserId,
      actorEmail,
      kind: "autonomous_cycle",
      title: "Amber 32 BOS weekly cycle complete",
      detail: {
        cycleId: cycleRunId,
        orchestrationId,
        missionId,
        reportId: report.reportId,
        briefId: brief.briefId,
        continuous,
        learningMode,
        workspaceUserId: userId,
        durationMs,
        honestyNote: AMBER_HONESTY_NOTE,
        steps: steps.map((s) => ({ step: s.step, ok: s.ok })),
      },
    });

    return {
      ok: true,
      bos: true,
      cycleId: cycleRunId,
      orchestrationId,
      missionId,
      campaignId: campaign.campaignId,
      weekId: missionResult.weekId,
      goal,
      status: missionResult.status,
      reportId: report.reportId,
      reportSummary: report.summary,
      report: report.body,
      ownerNarrative: brief.narrative,
      executiveBriefId: brief.briefId,
      executiveConfidence: brief.confidence,
      recommendations: brief.recommendations,
      health: healthScores,
      departments,
      improvements,
      decisions: decisions.decisions,
      agentJobs: agents.jobs,
      infraRecommendations: infra.recommendations,
      executiveOps,
      nextWeek,
      steps,
      learningDelta,
      learningMode,
      continuousEnabled: continuous,
      durationMs,
      honestyNote: AMBER_HONESTY_NOTE,
      note: "Amber 32 BOS cycle — admin Learning Mode workspaces only.",
      completedAt: new Date().toISOString(),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cycle failed";
    const durationMs = Date.now() - started;
    await completeCycleRun(q, cycleRunId, {
      status: "failed",
      steps,
      decisions: [],
      learningDelta: {},
      ownerAsks: [],
      durationMs,
      error: msg,
    });
    await q`
      UPDATE amber_orchestration_runs SET status = ${"failed"}, completed_at = ${new Date().toISOString()}
      WHERE id = ${orchestrationId}`;
    await recordOpsMetric(q, {
      kind: "cycle_failed",
      workspaceUserId: userId,
      cycleId: cycleRunId,
      metrics: { durationMs, error: msg, bos: true },
      note: "Failed BOS cycle",
    });
    try {
      await raiseAlert(q, {
        severity: "critical",
        kind: "failed_cycle",
        title: "BOS cycle failed",
        detail: msg,
        workspaceUserId: userId,
        recommended: "Use Command → Retry cycle after reviewing Logs/checkpoints.",
        meta: { cycleId: cycleRunId },
      });
    } catch {
      /* alert table may not exist yet on first boot */
    }
    await logAmberAction({
      actorUserId: actorUserId,
      actorEmail,
      kind: "autonomous_cycle_error",
      title: "Amber 32 BOS cycle failed",
      detail: { cycleId: cycleRunId, orchestrationId, workspaceUserId: userId, error: msg, steps },
    });
    throw e;
  }
}

export async function createVerificationHold(
  q: Sql,
  userId: string,
  input: { provider: string; step: string; explanation: string; resumeHint?: string; meta?: Record<string, unknown> },
): Promise<string> {
  const id = randomUUID();
  await q`
    INSERT INTO amber_verification_holds (
      id, user_id, provider, step, status, explanation, resume_hint, meta, created_at, resolved_at
    ) VALUES (
      ${id}, ${userId}, ${input.provider.slice(0, 80)}, ${input.step.slice(0, 120)},
      ${"paused"}, ${input.explanation.slice(0, 2000)}, ${(input.resumeHint || "").slice(0, 1000)},
      ${JSON.stringify(input.meta || {})}, ${new Date().toISOString()}, ${null}
    )`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "verification_hold",
    title: `Paused: ${input.provider} / ${input.step}`,
    detail: { id, explanation: input.explanation.slice(0, 300) },
  });
  return id;
}

export async function resolveVerificationHold(q: Sql, userId: string, holdId: string): Promise<void> {
  await q`
    UPDATE amber_verification_holds
    SET status = ${"resolved"}, resolved_at = ${new Date().toISOString()}
    WHERE id = ${holdId} AND user_id = ${userId}`;
  await logAmberAction({
    actorUserId: userId,
    actorEmail: null,
    kind: "verification_resume",
    title: "Verification hold resolved — Amber may resume that step",
    detail: { holdId },
  });
}

export async function detectInfraVerificationNeeds(q: Sql, userId: string): Promise<{ holds: string[]; notes: string[] }> {
  const accounts = (await q`
    SELECT id, provider, handle, status FROM social_accounts WHERE user_id = ${userId}
  `) as { id: string; provider: string; handle: string; status: string }[];
  const services = (await q`
    SELECT id, service, status, meta FROM amber_service_links WHERE user_id = ${userId}
  `) as { id: string; service: string; status: string; meta: string }[];

  const holds: string[] = [];
  const notes: string[] = [];

  for (const a of accounts) {
    if (a.status === "keys_needed" || a.status === "error") {
      const id = await createVerificationHold(q, userId, {
        provider: a.provider,
        step: "oauth_reconnect",
        explanation: `${a.provider} account @${a.handle} needs owner action (status: ${a.status}). Amber cannot bypass platform security.`,
        resumeHint: "Reconnect OAuth in Business Center → Social, then mark hold resolved in Admin → Setup.",
        meta: { socialAccountId: a.id },
      });
      holds.push(id);
      notes.push(`${a.provider}: reconnect required`);
    }
  }

  for (const s of services) {
    if (s.status === "planned") {
      let meta: Record<string, unknown> = {};
      try {
        meta = asRecord(JSON.parse(s.meta || "{}"));
      } catch {
        meta = {};
      }
      const id = await createVerificationHold(q, userId, {
        provider: s.service,
        step: "owner_provisioning",
        explanation: `${s.service} is planned only. Owner must complete identity/legal/payment with the provider. Amber tracks status and will not create mailboxes.`,
        resumeHint: "After you connect Google Workspace / M365 (or mark N/A), update service status and resolve this hold.",
        meta: { serviceLinkId: s.id, ...meta },
      });
      holds.push(id);
      notes.push(`${s.service}: owner provisioning required`);
    }
  }

  return { holds, notes };
}
