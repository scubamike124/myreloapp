/**
 * Map real coding-agent / builder run fields into owner-readable chat lines.
 * Never invent steps. Never echo secrets, tokens, raw logs, or credentials.
 */

export type BuilderRun = {
  id?: string;
  taskId?: string;
  status?: string;
  projectName?: string;
  summary?: string;
  error?: string;
  backend?: string;
  testEvidence?: { passed?: number; failed?: number; testsRun?: string[]; failures?: string[] };
  changedFiles?: string[];
  prUrl?: string;
  prNumber?: number;
  /** Set only once the PR has actually merged (verified, not just requested) —
   *  see amberai's markCodingAgentRunMerged/listPendingApprovals. A run with
   *  prUrl but no mergedAt is done working, not done: it is waiting on the
   *  owner's approval, the same distinction listPendingApprovals() already
   *  draws elsewhere in this system. */
  mergedAt?: string;
  mergedSha?: string;
  ownerReason?: string;
  prHandoffWarning?: string;
  createdAt?: string;
  completedAt?: string;
  /** 1 on a first attempt; >1 means this exact task has been retried. */
  attempt?: number;
  updatedAt?: string;
};

export type ActivityLine = { key: string; text: string };

const SECRETISH =
  /\b(sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{12,}|Bearer\s+[A-Za-z0-9._\-]+)\b/gi;

export function sanitizeOwnerText(raw: string, max = 400): string {
  let t = raw.replace(SECRETISH, "[redacted]");
  t = t.replace(/\b(api[_-]?key|token|secret|password|credential)\s*[:=]\s*\S+/gi, "$1=[redacted]");
  t = t.replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, "[redacted key]");
  t = t.replace(/\b[A-Fa-f0-9]{32,}\b/g, "[redacted]");
  t = t.replace(/\s+/g, " ").trim();
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return t;
}

function statusLine(status: string, projectName?: string): string | null {
  const project = projectName ? ` on ${projectName}` : "";
  switch (status) {
    case "queued":
      return `Queued the work${project}.`;
    case "running":
      return `Working in the repository${project}…`;
    case "testing":
      return "Running tests…";
    case "succeeded":
      return "Work finished and verified.";
    case "failed":
      return "That run did not pass verification.";
    case "needs_owner":
      return "I need you before this can continue (owner-gated step).";
    case "needs_runtime":
      return "I cannot finish this until a required runtime or key is available. I will not invent a workaround.";
    case "interrupted":
      return "That run was interrupted. I can start it again if you want.";
    default:
      return null;
  }
}

/**
 * Diff previous vs current run snapshot. Only emit lines for fields that actually changed.
 */
export function activityFromRunDiff(prev: BuilderRun | null, next: BuilderRun): ActivityLine[] {
  const lines: ActivityLine[] = [];
  const id = next.id || "run";
  const status = String(next.status || "");

  if (!prev) {
    const first = statusLine(status || "queued", next.projectName);
    if (first) lines.push({ key: `${id}:start:${status || "queued"}`, text: first });
  } else if (prev.status !== next.status && status) {
    const line = statusLine(status, next.projectName);
    if (line) lines.push({ key: `${id}:status:${status}`, text: line });
  }

  const prevFailed = prev?.testEvidence?.failed;
  const nextFailed = next.testEvidence?.failed;
  const nextPassed = next.testEvidence?.passed;
  if (next.testEvidence && (prevFailed !== nextFailed || prev?.testEvidence?.passed !== nextPassed)) {
    if (nextFailed === 0 && (nextPassed ?? 0) >= 0 && (next.status === "succeeded" || next.status === "testing")) {
      lines.push({ key: `${id}:tests:pass`, text: "Tests passed." });
    } else if ((nextFailed ?? 0) > 0) {
      lines.push({
        key: `${id}:tests:fail`,
        text: `${nextFailed} test${nextFailed === 1 ? "" : "s"} failed.`,
      });
    }
  }

  const prevFiles = prev?.changedFiles?.length ?? 0;
  const nextFiles = next.changedFiles?.length ?? 0;
  if (nextFiles > prevFiles && nextFiles > 0) {
    lines.push({
      key: `${id}:files:${nextFiles}`,
      text: `Updated ${nextFiles} file${nextFiles === 1 ? "" : "s"}.`,
    });
  }

  if (next.prUrl && next.prUrl !== prev?.prUrl) {
    lines.push({ key: `${id}:pr`, text: `Opened a review pull request.` });
  }

  if (next.mergedAt && next.mergedAt !== prev?.mergedAt) {
    lines.push({ key: `${id}:merged`, text: "Pull request merged." });
  }

  if ((next.attempt ?? 1) > (prev?.attempt ?? 1)) {
    lines.push({ key: `${id}:retry:${next.attempt}`, text: `Retrying (attempt ${next.attempt}).` });
  }

  if (next.error && next.error !== prev?.error) {
    const cleaned = sanitizeOwnerText(next.error, 220);
    if (cleaned && !/sk-|token|secret|password|api[_-]?key/i.test(cleaned)) {
      lines.push({ key: `${id}:err`, text: cleaned });
    }
  }

  if (next.summary && next.summary !== prev?.summary && next.status === "succeeded") {
    const snippet = humanSummarySnippet(next.summary);
    if (snippet) lines.push({ key: `${id}:sum`, text: snippet });
  }

  return uniqueByKey(lines);
}

function humanSummarySnippet(summary: string): string | null {
  const cleaned = sanitizeOwnerText(summary, 280);
  if (!cleaned) return null;
  if (/^## |shape=|workersTried=|cwd:|prompt pack/i.test(cleaned)) return null;
  return cleaned;
}

function uniqueByKey(lines: ActivityLine[]): ActivityLine[] {
  const seen = new Set<string>();
  const out: ActivityLine[] = [];
  for (const line of lines) {
    if (seen.has(line.key)) continue;
    seen.add(line.key);
    out.push(line);
  }
  return out;
}

export function publicRun(raw: Record<string, unknown>): BuilderRun {
  const te = raw.testEvidence && typeof raw.testEvidence === "object" ? (raw.testEvidence as Record<string, unknown>) : null;
  const files = Array.isArray(raw.changedFiles)
    ? raw.changedFiles.filter((f): f is string => typeof f === "string" && !/\.env|secret|credential/i.test(f)).slice(0, 40)
    : undefined;
  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    taskId: typeof raw.taskId === "string" ? raw.taskId : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    projectName: typeof raw.projectName === "string" ? raw.projectName : undefined,
    // amberai's publicCodingRun() already sanitizes and caps these (up to
    // 12000 chars) -- re-truncating hard here to 500/240 cut a real run's
    // summary/error before the actually-relevant part. This layer only
    // guards against a malformed/oversized upstream value, not normal length.
    summary: typeof raw.summary === "string" ? sanitizeOwnerText(raw.summary, 12000) : undefined,
    error: typeof raw.error === "string" ? sanitizeOwnerText(raw.error, 12000) : undefined,
    backend: typeof raw.backend === "string" ? raw.backend : undefined,
    changedFiles: files,
    prUrl: typeof raw.prUrl === "string" && raw.prUrl.startsWith("https://") ? raw.prUrl : undefined,
    prNumber: typeof raw.prNumber === "number" ? raw.prNumber : undefined,
    mergedAt: typeof raw.mergedAt === "string" ? raw.mergedAt : undefined,
    mergedSha: typeof raw.mergedSha === "string" ? raw.mergedSha : undefined,
    ownerReason: typeof raw.ownerReason === "string" ? sanitizeOwnerText(raw.ownerReason, 500) : undefined,
    prHandoffWarning: typeof raw.prHandoffWarning === "string" ? sanitizeOwnerText(raw.prHandoffWarning, 500) : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : undefined,
    attempt: typeof raw.attempt === "number" ? raw.attempt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    testEvidence: te
      ? {
          passed: typeof te.passed === "number" ? te.passed : undefined,
          failed: typeof te.failed === "number" ? te.failed : undefined,
          testsRun: Array.isArray(te.testsRun) ? te.testsRun.filter((x): x is string => typeof x === "string").slice(0, 12) : undefined,
          failures: Array.isArray(te.failures)
            ? te.failures.filter((x): x is string => typeof x === "string").map((x) => sanitizeOwnerText(x, 600)).slice(0, 5)
            : undefined,
        }
      : undefined,
  };
}
