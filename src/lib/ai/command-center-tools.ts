// ---------------------------------------------------------------------------
// Command Center tool registry.
//
// Function-calling schemas for the 11 LIVE_TOOLS are derived from
// TOOLS/Field (src/lib/tools.ts) — the same catalog the Create page and
// Amber's advisory prompt already use — rather than hand-maintained a second
// time. Only slugs with a real executor registered below are ever offered to
// the model, and only slugs in LIVE_TOOLS are eligible at all: never expose a
// tool that cannot run.
//
// Three more tools (produce_commercial, check_job_status, retry_job) are not
// derived from TOOLS — they're Command Center-specific, backed by the real,
// pre-existing engine_jobs queue via src/lib/ai/admin-jobs.ts, which only
// calls that system and never edits it.
//
// Executors call each generation route's extracted core function directly
// in-process (the "Command Center variant" functions added next to the
// existing POST handlers) — never a self-fetch back into this same server.
// ---------------------------------------------------------------------------

import { TOOLS, LIVE_TOOLS, type Field, type Tool } from "@/lib/tools";
import type { AgentToolDef } from "@/lib/ai/agent-chain";
import { generateMemoryFilm } from "@/app/api/memory-film/route";
import { generateProductCommercialSync } from "@/app/api/product-commercial/route";
import { generateAvatarPhotoSync } from "@/app/api/generate-avatar/route";
import { generateAvatarImageSync } from "@/app/api/generate-avatar-image/route";
import { generateHeygenVideoSync } from "@/app/api/heygen-video/route";
import { generateStoryEpisodeSync } from "@/app/api/story-maker/route";
import { generateShortsSync } from "@/app/api/shorts/route";
import { generateDirectionSync, type DirectorSyncResult } from "@/app/api/director/route";
import { generateStorybookSync } from "@/app/api/storybook/route";
import { estimateToolCostUsd, checkSpendAllowed, recordUsage } from "@/lib/ai/cost";
import { produceCommercial, checkJobStatus, retryJob } from "@/lib/ai/admin-jobs";
import { scheduleAdminPost, listAdminScheduledPosts, cancelAdminScheduledPost, checkAdminSocialAccounts } from "@/lib/ai/admin-scheduling";
import { publishToPlatform } from "@/lib/ai/admin-publish";
import { ebookStats } from "@/lib/storybook/store";
import { assertSafeUrl } from "@/lib/api-guard";
import { scrapePage } from "@/lib/scrape";
import { generateJson } from "@/lib/ai/text-chain";
import { startDevTask, checkDevTask, listPendingDevApprovals, approveDevTask } from "@/lib/amber/dev-bridge";

// --- schema derivation -------------------------------------------------------

/**
 * "upload" fields are deliberately excluded from the function schema — a
 * model cannot reproduce the raw bytes of an image it only perceives via
 * vision, and asking it to try either fails outright or, worse, hallucinates
 * plausible-looking base64. The server injects the current message's real
 * attachments directly into the executor instead (see EXECUTORS below); the
 * tool description tells the model this happens automatically so it doesn't
 * try to invent a value.
 */
function fieldSchema(field: Exclude<Field, { kind: "upload" }>): Record<string, unknown> {
  switch (field.kind) {
    case "text":
    case "url":
    case "textarea":
      return { type: "string", description: field.label + (field.hint ? ` — ${field.hint}` : "") };
    case "slider":
      return { type: "number", minimum: field.min, maximum: field.max, description: field.label };
    case "select":
    case "segment":
      return { type: "string", enum: field.options, description: field.label };
    case "multi":
      return { type: "array", items: { type: "string", enum: field.options }, description: field.label };
    case "choices":
      return { type: "string", enum: field.options.map((o) => o.value), description: field.label };
  }
}

/** Fields required by default unless they carry a hint that marks them optional. */
function isOptional(field: Field): boolean {
  const hint = "hint" in field ? field.hint : undefined;
  return /optional/i.test(hint ?? "");
}

export function toolDefFor(tool: Tool): AgentToolDef {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  const hasUpload = tool.fields.some((f) => f.kind === "upload");
  for (const field of tool.fields) {
    if (field.kind === "upload") continue; // see fieldSchema's note — supplied by the server, not the model
    properties[field.name] = fieldSchema(field);
    if (!isOptional(field)) required.push(field.name);
  }
  const uploadNote = hasUpload
    ? " Any image the user attached to this message is used automatically — do not try to supply image data as an argument."
    : "";
  return {
    name: `run_${tool.slug.replace(/-/g, "_")}`,
    description: `${tool.title} — ${tool.tagline} Costs ${tool.credits}.${uploadNote}`,
    parameters: { type: "object", properties, required, additionalProperties: false },
  };
}

// --- meta-tools: production job queue ---------------------------------------
// Not derived from TOOLS — these operate on the real engine_jobs queue
// (src/lib/engine/jobs.ts, via admin-jobs.ts) rather than a Create-page tool.

const META_TOOL_DEFS: AgentToolDef[] = [
  {
    name: "produce_commercial",
    description:
      "Send an approved Commercial Director board to real production — the same multi-minute shoot-and-assemble " +
      "pipeline a customer's 'Produce' button triggers. Returns a job id immediately; the render happens on a " +
      "background worker, not in this call. Use check_job_status to follow progress. Only call this with a board " +
      "that came from a run_commercial_director result the user has reviewed and approved — never invent a board.",
    parameters: {
      type: "object",
      properties: {
        board: {
          type: "object",
          description: "The exact Storyboard object from a prior run_commercial_director result's `best.storyboard` field.",
        },
      },
      required: ["board"],
      additionalProperties: false,
    },
  },
  {
    name: "check_job_status",
    description: "Check the status of a Command Center production job, or list recent ones if no jobId is given.",
    parameters: {
      type: "object",
      properties: { jobId: { type: "string", description: "A job id from a previous produce_commercial call. Omit to list recent jobs." } },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "retry_job",
    description: "Requeue a failed Command Center production job so the worker attempts it again.",
    parameters: {
      type: "object",
      properties: { jobId: { type: "string", description: "The failed job's id." } },
      required: ["jobId"],
      additionalProperties: false,
    },
  },
  {
    name: "ebook_stats",
    description:
      "Count the personalised e-books saved to the Story Library recently, and how many of those are finished " +
      "enough to publish. Read-only — it changes nothing. 'Made' counts stories whose delivery includes a book " +
      "(the e-book and the book+movie bundle); 'readyToPublish' counts only the ones where every page has both " +
      "its words and its illustration, which is what the PDF is built from. A book with a missing illustration " +
      "is real and was charged for, it just is not sendable — those come back named in notReadyBooks. Defaults " +
      "to the last 3 days, rolling from now, so the oldest day in byDay is a partial one. Two limits worth " +
      "saying out loud rather than glossing: books made by signed-out visitors are never saved at all, so they " +
      "cannot appear here; and `truncated: true` means the row cap was hit and every number is a floor. Report " +
      "the figures exactly as returned — never estimate this one.",
    parameters: {
      type: "object",
      properties: {
        days: {
          type: "number",
          minimum: 1,
          maximum: 90,
          description: "How many days back to count. Defaults to 3.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "check_social_accounts",
    description:
      "List which social channels the Command Center's account has actually connected via real OAuth. An empty " +
      "list means none are connected yet — that is the honest, expected state until one is connected through " +
      "Business Center → Social. Never claim a channel is connected that isn't in this list. Note: YouTube is a " +
      "partial exception — see publish_post, which can still reach Amber's shared channel even when YouTube is " +
      "absent here.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "publish_post",
    description:
      "Publish RIGHT NOW to one connected platform — a real API call to the real platform, distinct from " +
      "schedule_post which only queues. For every platform except YouTube, only works if check_social_accounts " +
      "shows that platform connected; otherwise this returns a real 'not connected' error. YouTube is the one " +
      "exception: even if check_social_accounts doesn't list it, this can still succeed via Amber's shared " +
      "channel — always attempt it rather than pre-emptively refusing. Report the result exactly as returned: " +
      "the real post URL on success (the outcome's `note` field says when a post went out via Amber's shared " +
      "channel rather than this org's own), or the real error on failure. Never say a post published without " +
      "this tool returning ok:true.",
    parameters: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["tiktok", "instagram", "youtube", "facebook", "x"], description: "Must be connected — check first." },
        mediaUrl: { type: "string", description: "A public https URL or data: URL of the video/image to publish — typically a prior tool result's videoUrl/imageUrl." },
        caption: { type: "string", description: "The post caption/description." },
      },
      required: ["platform", "mediaUrl", "caption"],
      additionalProperties: false,
    },
  },
  {
    name: "schedule_post",
    description:
      "Queue a social post for a future time. This only queues it — it does NOT publish, even once the time " +
      "arrives, unless a real channel is connected (see check_social_accounts). Say this plainly when scheduling: " +
      "the post will sit as 'queued' until a channel exists to send it to.",
    parameters: {
      type: "object",
      properties: {
        caption: { type: "string", description: "The post text/caption. Required if no mediaId is given." },
        mediaId: { type: "string", description: "Optional: an existing Reelo library creation id to attach." },
        platforms: { type: "array", items: { type: "string", enum: ["tiktok", "instagram", "youtube", "facebook", "x"] }, description: "One or more target platforms." },
        scheduledAt: { type: "string", description: "ISO 8601 date-time to publish at, e.g. 2026-09-01T14:00:00Z. Must be in the future." },
      },
      required: ["platforms", "scheduledAt"],
      additionalProperties: false,
    },
  },
  {
    name: "list_scheduled_posts",
    description: "List the Command Center's queued/sent social posts.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "cancel_scheduled_post",
    description: "Cancel a queued social post.",
    parameters: {
      type: "object",
      properties: { id: { type: "string", description: "The scheduled post's id, from schedule_post or list_scheduled_posts." } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "start_dev_task",
    description:
      "Send a real engineering request (build a feature, fix a bug, add an API, change something in the codebase) to " +
      "Amber OS's coding-agent loop against the Reelo repo. This does NOT write code itself — it queues a task that a " +
      "separate, already-running cloud worker claims on its own schedule, writes real code for in an isolated clone " +
      "(never this live app's own files), tests, and gets reviewed by an automated quality gate. That can take " +
      "minutes. Returns a taskId immediately — use check_dev_task to follow up, never assume it's done. If Amber OS " +
      "reports the request needs a human decision (billing, credentials, production deploy, something only Michael " +
      "can authorize), say that plainly instead of retrying.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title." },
        description: { type: "string", description: "What to build/fix/change, in enough detail to act on." },
        acceptanceCriteria: { type: "string", description: "How to know it's done correctly. Optional but improves the result." },
      },
      required: ["title", "description"],
      additionalProperties: false,
    },
  },
  {
    name: "check_dev_task",
    description:
      "Check the real status of a dev task started with start_dev_task: what the coding agent did, whether tests " +
      "passed, whether a pull request opened, or whether it's stuck needing an owner decision. Report exactly what " +
      "this returns — never say work is done, tested, or ready without this tool showing it.",
    parameters: {
      type: "object",
      properties: { taskId: { type: "string", description: "The taskId from start_dev_task." } },
      required: ["taskId"],
      additionalProperties: false,
    },
  },
  {
    name: "list_pending_dev_approvals",
    description:
      "List dev tasks that passed the automated quality gate and have an open pull request waiting on Michael's " +
      "approval to merge. Use this when Michael asks what's waiting on him, or before calling approve_dev_task if " +
      "you don't already have the taskId.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "approve_dev_task",
    description:
      "Merge a dev task's pull request AND deploy it to production — a real, irreversible action on the actual " +
      "codebase and the live site. Only call this after Michael has explicitly and unambiguously told you, in this " +
      "exchange, to approve/merge/ship/deploy this specific task. Never call it on an inferred 'looks good', a " +
      "vague acknowledgement, or silence — if there's any doubt, ask him to confirm first. This call returns as " +
      "soon as the MERGE completes — the deploy itself keeps running in the background for a few minutes after, " +
      "so this result never tells you whether it's actually live yet (deploy will show status 'in_progress', not " +
      "success or failure). Say plainly that the merge succeeded and the deploy is running, then call " +
      "check_dev_task a little later to get the real, verified outcome (deploymentNote) — never claim it's live " +
      "before that shows a real success.",
    parameters: {
      type: "object",
      properties: { taskId: { type: "string", description: "The taskId to approve, from check_dev_task or list_pending_dev_approvals." } },
      required: ["taskId"],
      additionalProperties: false,
    },
  },
];

// --- executors ----------------------------------------------------------------

export type ToolAttachment = { data: string; mimeType: string; name?: string };

type ToolExecutor = (args: Record<string, unknown>, attachments: ToolAttachment[]) => Promise<unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "9:16 (Vertical)": { width: 720, height: 1280 },
  "1:1 (Square)": { width: 720, height: 720 },
  "16:9 (Wide)": { width: 1280, height: 720 },
};

/** Short script written from a scraped page for Website Commercial — the
 *  customer flow composes this client-side from a separate analyze step this
 *  Command Center path doesn't have, so it's written fresh here instead,
 *  using the same multi-provider text layer (text-chain.ts) the rest of the
 *  app already relies on for exactly this kind of short structured copy. */
async function writeSpokespersonScript(url: string, tone: string): Promise<string> {
  let pageText = "";
  try {
    const safe = await assertSafeUrl(url);
    pageText = await scrapePage(safe, 3000);
  } catch {
    pageText = "";
  }
  const result = await generateJson<{ script: string }>({
    prompt:
      `Write a ${(tone || "cinematic").toLowerCase()} 20-second spokesperson script advertising this business.\n\n` +
      (pageText ? `From their website:\n${pageText}\n\n` : `Website: ${url}\n\n`) +
      `Return ONLY JSON: {"script": "..."}\n` +
      `- One natural paragraph, written to be spoken aloud in about 20 seconds.\n` +
      `- Claim nothing the page didn't say.`,
    schema: { type: "object", properties: { script: { type: "string" } }, required: ["script"], additionalProperties: false },
    maxTokens: 400,
    validate: (raw) => {
      const script = String((raw as { script?: unknown })?.script ?? "").trim();
      if (!script) throw new Error("no script returned");
      return { script: script.slice(0, 900) };
    },
  });
  return result.data.script;
}

/**
 * Slugs with a working Command Center executor. `attachments` are the real
 * files dropped on the current message — never something the model supplied
 * (see toolDefFor's note on "upload" fields).
 */
const EXECUTORS: Record<string, ToolExecutor> = {
  "story-memory-generator": async (args, attachments) => {
    if (attachments.length < 2) throw new Error("Attach at least 2 photos to the message for a memory film.");
    return generateMemoryFilm({
      photos: attachments.map((a) => ({ data: a.data, mimeType: a.mimeType || "image/jpeg" })),
      type: str(args.type),
      details: str(args.details),
      languageCode: str(args.language) || "en",
    });
  },

  "product-commercial": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a product photo to the message.");
    return generateProductCommercialSync({
      imageBase64: image.data,
      mimeType: image.mimeType || "image/jpeg",
      productName: str(args.productName) || str(args.name),
      details: str(args.details),
      url: str(args.url),
      look: str(args.look),
      music: str(args.music),
    });
  },

  "talking-photo": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a photo to the message.");
    return generateAvatarPhotoSync({
      action: "talking-photo",
      imageBase64: image.data,
      mimeType: image.mimeType || "image/jpeg",
      prompt: str(args.script) ? `The person in the photo says, naturally and expressively: "${str(args.script)}"` : "",
    });
  },

  "dancing-photo": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a photo to the message.");
    const move = str(args.move) || "a fun dance move";
    const music = str(args.music) || "upbeat music";
    return generateAvatarPhotoSync({
      action: "dancing-photo",
      imageBase64: image.data,
      mimeType: image.mimeType || "image/jpeg",
      prompt: `The person in the photo dances with ${move}, energetic and fluid, in time with ${music}.`,
    });
  },

  "custom-avatar-creator": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a photo to the message.");
    const style = str(args.style) || "Realistic Studio";
    return generateAvatarImageSync({
      imageBase64: image.data,
      mimeType: image.mimeType || "image/jpeg",
      prompt: `Create a high-quality ${style.toLowerCase()} avatar portrait of this person, preserving their likeness.`,
    });
  },

  "ai-avatar-studio": async (args) => {
    // The Create page's four named choices (Ava/Leo/Nina/Maya) are marketing
    // labels, not real HeyGen avatar/voice ids — there is no catalog mapping
    // from them, so this uses HeyGen's configured defaults (a real, working
    // presenter) rather than pass through an id that would fail upstream.
    return generateHeygenVideoSync({ action: "ai-avatar-studio", script: str(args.script) });
  },

  "website-commercial": async (args) => {
    const url = str(args.url);
    if (!url) throw new Error("A website URL is required.");
    const script = await writeSpokespersonScript(url, str(args.tone));
    const dims = RATIO_DIMENSIONS[str(args.ratio)] ?? RATIO_DIMENSIONS["9:16 (Vertical)"];
    return generateHeygenVideoSync({ action: "website-commercial", script, width: dims.width, height: dims.height });
  },

  "bedtime-storybook": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a photo of the child to the message.");
    return generateStorybookSync({
      photo: image.data,
      mimeType: image.mimeType || "image/jpeg",
      childName: str(args.childName),
      idea: str(args.idea),
      theme: str(args.theme),
      languageCode: str(args.language) || "en",
      pages: num(args.pages) ?? 6,
    });
  },

  "ai-story-maker": async (args, attachments) => {
    const image = attachments[0];
    if (!image) throw new Error("Attach a photo of the character to the message.");
    return generateStoryEpisodeSync({
      avatarId: "",
      photo: image.data,
      photoMimeType: image.mimeType || "image/jpeg",
      characterName: str(args.characterName),
      premise: str(args.premise),
      genre: str(args.genre),
      languageCode: str(args.language) || "en",
      scenes: num(args.scenes) ?? 8,
      episodeNumber: 1,
      previously: [],
    });
  },

  "shorts-20": async (args) =>
    generateShortsSync({
      topic: str(args.prompt),
      url: str(args.url),
      count: num(args.count) ?? 20,
      platform: str(args.platform),
      tone: str(args.tone),
      languageCode: "en",
    }),

  "commercial-director": async (args): Promise<DirectorSyncResult> =>
    generateDirectionSync({ url: str(args.url), about: str(args.about) }),
};

export function liveExecutableSlugs(): string[] {
  return Object.keys(EXECUTORS).filter((slug) => LIVE_TOOLS.has(slug));
}

/** The full tool list to hand to runAgentTurn — TOOLS-derived tools with a
 *  real executor, plus the job-queue meta-tools. */
export function commandCenterToolDefs(): AgentToolDef[] {
  return [...TOOLS.filter((t) => liveExecutableSlugs().includes(t.slug)).map(toolDefFor), ...META_TOOL_DEFS];
}

const NAME_TO_SLUG = new Map(TOOLS.map((t) => [`run_${t.slug.replace(/-/g, "_")}`, t.slug]));
const META_TOOL_NAMES = new Set(META_TOOL_DEFS.map((t) => t.name));

/**
 * Executes one function call by name. Enforces the spend cap and records
 * usage regardless of outcome — a failed generation still cost the call to
 * whichever provider it partially reached, and even if it didn't, logging the
 * attempt is what makes the usage dashboard trustworthy. Meta-tools
 * (job queue) are free — they don't call a paid provider themselves — so
 * they skip the spend gate and usage ledger entirely.
 */
export async function executeCommandCenterTool(
  name: string,
  args: unknown,
  conversationId: string | null,
  attachments: ToolAttachment[] = [],
): Promise<{ ok: boolean; result: unknown }> {
  const argObj = args && typeof args === "object" ? (args as Record<string, unknown>) : {};

  if (META_TOOL_NAMES.has(name)) {
    try {
      if (name === "produce_commercial") {
        const result = await produceCommercial(argObj.board as never);
        return { ok: result.ok, result };
      }
      if (name === "check_job_status") {
        const result = await checkJobStatus(str(argObj.jobId) || undefined);
        return { ok: result.ok, result };
      }
      if (name === "retry_job") {
        const jobId = str(argObj.jobId);
        if (!jobId) return { ok: false, result: { error: "jobId is required." } };
        const result = await retryJob(jobId);
        return { ok: result.ok, result };
      }
      if (name === "publish_post") {
        const platform = str(argObj.platform);
        const mediaUrl = str(argObj.mediaUrl);
        const caption = str(argObj.caption);
        if (!platform || !mediaUrl) return { ok: false, result: { error: "platform and mediaUrl are required." } };
        const result = await publishToPlatform({ platform, mediaUrl, caption });
        return { ok: result.ok, result };
      }
      if (name === "ebook_stats") {
        const stats = await ebookStats(num(argObj.days) ?? 3);
        // null is "storage unavailable", which must not be reported as a quiet
        // week — see ebookStats. Zero books is a real answer; no database is not.
        if (!stats) return { ok: false, result: { error: "The Story Library database is not reachable, so there is no count to give." } };
        return { ok: true, result: stats };
      }
      if (name === "check_social_accounts") {
        const result = await checkAdminSocialAccounts();
        return { ok: result.ok, result };
      }
      if (name === "schedule_post") {
        const platforms = Array.isArray(argObj.platforms) ? argObj.platforms.map(str) : [];
        const result = await scheduleAdminPost({
          caption: str(argObj.caption),
          mediaId: str(argObj.mediaId) || null,
          platforms,
          scheduledAt: str(argObj.scheduledAt),
        });
        return { ok: result.ok, result };
      }
      if (name === "list_scheduled_posts") {
        const result = await listAdminScheduledPosts();
        return { ok: result.ok, result };
      }
      if (name === "cancel_scheduled_post") {
        const id = str(argObj.id);
        if (!id) return { ok: false, result: { error: "id is required." } };
        const result = await cancelAdminScheduledPost(id);
        return { ok: result.ok, result };
      }
      if (name === "start_dev_task") {
        const title = str(argObj.title);
        const description = str(argObj.description);
        if (!title || !description) return { ok: false, result: { error: "title and description are required." } };
        const result = await startDevTask({ title, description, acceptanceCriteria: str(argObj.acceptanceCriteria) || undefined });
        return { ok: true, result };
      }
      if (name === "check_dev_task") {
        const taskId = str(argObj.taskId);
        if (!taskId) return { ok: false, result: { error: "taskId is required." } };
        const result = await checkDevTask(taskId);
        return { ok: true, result };
      }
      if (name === "list_pending_dev_approvals") {
        const result = await listPendingDevApprovals();
        return { ok: true, result };
      }
      if (name === "approve_dev_task") {
        const taskId = str(argObj.taskId);
        if (!taskId) return { ok: false, result: { error: "taskId is required." } };
        const result = await approveDevTask(taskId);
        return { ok: true, result };
      }
    } catch (e) {
      return { ok: false, result: { error: e instanceof Error ? e.message : "The job-queue call failed." } };
    }
  }

  const slug = NAME_TO_SLUG.get(name);
  const executor = slug ? EXECUTORS[slug] : undefined;
  if (!slug || !executor) {
    return { ok: false, result: { error: `Unknown or unavailable tool: ${name}` } };
  }

  const estimatedCost = estimateToolCostUsd(slug);
  const allowed = await checkSpendAllowed(estimatedCost);
  if (!allowed.ok) {
    return { ok: false, result: { error: allowed.reason } };
  }

  try {
    const result = await executor(argObj, attachments);
    await recordUsage({ conversationId, kind: "tool", provider: "reelo", toolName: slug, estimatedCostUsd: estimatedCost, ok: true });
    return { ok: true, result };
  } catch (e) {
    await recordUsage({ conversationId, kind: "tool", provider: "reelo", toolName: slug, estimatedCostUsd: estimatedCost, ok: false });
    return { ok: false, result: { error: e instanceof Error ? e.message : "The tool failed." } };
  }
}
