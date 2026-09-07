import type { ExecutionEvent } from "./execution-types";

// ---------------------------------------------------------------------------
// Groups the real, ordered CodingAgentEvent stream into a short, friendly,
// continuously-updating feed — the primary view of the workspace. Every
// word here is derived from real fields on real events (title/detail/
// filePath/command/status); nothing is invented, and nothing here can
// produce a line that doesn't trace back to something Amber actually did.
// The raw, ungrouped events remain available verbatim in the "All events"
// tab (see Timeline.tsx) for anyone who wants the unsummarized log.
// ---------------------------------------------------------------------------

export type FeedTone = "pending" | "ok" | "error";

export type FeedItem = {
  id: string;
  tone: FeedTone;
  text: string;
  /** Short real detail shown inline next to text, e.g. "111 passed, 0 failed". */
  meta?: string;
  /** Link, when the item is about something with a real URL (a PR). */
  href?: string;
  /** The real underlying event(s) this line summarizes — always at least one. */
  events: ExecutionEvent[];
};

function toneFor(e: ExecutionEvent): FeedTone {
  if (e.status === "ERROR") return "error";
  if (e.status === "OK") return "ok";
  return "pending";
}

function basename(path?: string): string {
  if (!path) return "file";
  const clean = path.replace(/\/$/, "");
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}

/** Real per-kind fallback text when no smarter pairing rule below applies —
 *  always built from the event's own real title/detail, never a placeholder. */
function defaultLine(e: ExecutionEvent): FeedItem {
  return { id: e.id, tone: toneFor(e), text: e.title, events: [e] };
}

export function buildFeedItems(events: ExecutionEvent[]): FeedItem[] {
  const items: FeedItem[] = [];
  let investigating: ExecutionEvent[] = [];
  let pendingTestRun: ExecutionEvent | null = null;

  const flushInvestigating = () => {
    if (!investigating.length) return;
    const files = Array.from(
      new Set(investigating.filter((e) => e.filePath).map((e) => basename(e.filePath))),
    );
    items.push({
      id: `inspect:${investigating[0].id}`,
      tone: "ok", // this group is always in the past by the time anything else happens
      text: "Inspecting the repository…",
      meta: files.length ? `Looked at ${files.length} file${files.length === 1 ? "" : "s"}` : `${investigating.length} command(s)`,
      events: investigating,
    });
    investigating = [];
  };

  for (const e of events) {
    if (e.kind === "RUN_COMMAND" && e.title === "Running automated tests") {
      flushInvestigating();
      pendingTestRun = e;
      items.push({ id: `test:${e.id}`, tone: "pending", text: "Running tests…", events: [e] });
      continue;
    }
    if (e.kind === "TEST_RESULT") {
      flushInvestigating();
      const match = e.detail?.match(/ran:\s*(.+)/);
      const testItem: FeedItem = {
        id: pendingTestRun ? `test:${pendingTestRun.id}` : `test:${e.id}`,
        tone: toneFor(e),
        text: e.status === "ERROR" ? "Tests failed" : e.status === "WARNING" ? "No automated tests ran" : "Tests passed",
        meta: e.title.startsWith("Tests:") ? e.title.replace(/^Tests:\s*/, "") : undefined,
        events: pendingTestRun ? [pendingTestRun, e] : [e],
      };
      // Replace the "Running tests…" placeholder in place, if it's the last item.
      const idx = items.findIndex((i) => i.id === testItem.id);
      if (idx >= 0) items[idx] = testItem;
      else items.push(testItem);
      pendingTestRun = null;
      void match;
      continue;
    }
    if (e.kind === "INSPECT_FILE" || e.kind === "RUN_COMMAND" || e.kind === "COMMAND_OUTPUT") {
      investigating.push(e);
      continue;
    }

    // Anything else ends the current investigation burst, if one is open.
    flushInvestigating();

    if (e.kind === "PLAN") {
      items.push({ id: e.id, tone: "ok", text: "Planning the approach…", meta: e.detail, events: [e] });
      continue;
    }
    if (e.kind === "EDIT_FILE") {
      items.push({
        id: e.id,
        tone: toneFor(e),
        text: `Editing ${basename(e.filePath)}`,
        events: [e],
      });
      continue;
    }
    if (e.kind === "GIT_ACTION") {
      const n = e.detail ? e.detail.split("\n").filter(Boolean).length : undefined;
      items.push({
        id: e.id,
        tone: toneFor(e),
        text: "Preparing the change for review…",
        meta: n ? `${n} file${n === 1 ? "" : "s"} changed` : undefined,
        events: [e],
      });
      continue;
    }
    if (e.kind === "PR_OPENED") {
      const url = e.title.match(/https?:\/\/\S+/)?.[0];
      items.push({
        id: e.id,
        tone: toneFor(e),
        text: e.status === "OK" ? "Pull request opened" : "Could not open a pull request",
        meta: e.status === "OK" ? undefined : e.detail,
        href: url,
        events: [e],
      });
      continue;
    }
    if (e.kind === "APPROVAL") {
      items.push({ id: e.id, tone: "pending", text: "Approved — merging…", events: [e] });
      continue;
    }
    if (e.kind === "MERGE") {
      items.push({ id: e.id, tone: toneFor(e), text: "Merged", meta: e.detail?.slice(0, 7), events: [e] });
      continue;
    }
    if (e.kind === "DEPLOY_STARTED") {
      items.push({ id: e.id, tone: "pending", text: "Deploying to production…", events: [e] });
      continue;
    }
    if (e.kind === "DEPLOY_VERIFIED") {
      items.push({
        id: e.id,
        tone: toneFor(e),
        text: e.status === "OK" ? "Production verified — change is live" : "Production verification failed",
        meta: e.status === "OK" ? undefined : e.detail,
        events: [e],
      });
      continue;
    }
    if (e.kind === "RETRY") {
      items.push({ id: e.id, tone: "pending", text: e.title, meta: e.detail, events: [e] });
      continue;
    }
    if (e.kind === "BLOCKED") {
      items.push({ id: e.id, tone: "pending", text: "Needs a decision from you", meta: e.detail || e.title, events: [e] });
      continue;
    }
    if (e.kind === "ERROR") {
      items.push({ id: e.id, tone: "error", text: e.title, meta: e.detail, events: [e] });
      continue;
    }
    if (e.kind === "COMPLETED") {
      items.push({ id: e.id, tone: toneFor(e), text: e.status === "OK" ? "Task completed" : "Task did not complete", events: [e] });
      continue;
    }
    items.push(defaultLine(e));
  }

  flushInvestigating();
  return items;
}
