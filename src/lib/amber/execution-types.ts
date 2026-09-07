// ---------------------------------------------------------------------------
// Shared types for the Amber Fixes workspace. Every field here is meant to
// be filled from a real backend response — CodingAgentEvent rows and
// CodingAgentRun records — never a client-invented placeholder. If a field
// can't be filled from something real, it should be optional and left
// undefined, not defaulted to a fake value.
// ---------------------------------------------------------------------------

export type EventKind =
  | "PLAN"
  | "INSPECT_FILE"
  | "EDIT_FILE"
  | "RUN_COMMAND"
  | "COMMAND_OUTPUT"
  | "TEST_RESULT"
  | "GIT_ACTION"
  | "PR_OPENED"
  | "APPROVAL"
  | "MERGE"
  | "DEPLOY_STARTED"
  | "DEPLOY_VERIFIED"
  | "ERROR"
  | "RETRY"
  | "BLOCKED"
  | "COMPLETED";

export type EventStatus = "INFO" | "OK" | "WARNING" | "ERROR";

export type ExecutionEvent = {
  id: string;
  kind: EventKind;
  status: EventStatus;
  title: string;
  detail?: string;
  filePath?: string;
  command?: string;
  exitCode?: number;
  diff?: string;
  createdAt: string;
};

export type RunStatus =
  | "queued"
  | "running"
  | "testing"
  | "succeeded"
  | "failed"
  | "needs_owner"
  | "needs_runtime"
  | "interrupted";

/** One entry in the job history list (left sidebar / job history panel). */
export type JobSummary = {
  taskId: string;
  title: string;
  status: RunStatus;
  backend?: string;
  projectName?: string;
  changedFiles?: string[];
  prUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Maps a raw run/event status to the traffic-light color language used
 *  everywhere in the workspace: red = error, yellow = working/warning,
 *  green = verified/success, neutral = normal/informational. */
export function colorForStatus(status: RunStatus | EventStatus | undefined): "red" | "yellow" | "green" | "neutral" {
  switch (status) {
    case "failed":
    case "ERROR":
      return "red";
    case "needs_owner":
    case "needs_runtime":
    case "interrupted":
    case "WARNING":
      return "yellow";
    case "running":
    case "testing":
    case "queued":
    case "INFO":
      return "yellow";
    case "succeeded":
    case "OK":
      return "green";
    default:
      return "neutral";
  }
}
