"use client";

// ---------------------------------------------------------------------------
// The user's workspace: every video/image they actually generated.
//
// There is no auth or database yet, so this persists per-browser in
// localStorage. It is deliberately the ONE place generation history lives —
// the Library reads it, and Amber reads it to understand what the user has
// been working on. When a real backend lands, only this module changes.
//
// Large media (base64 data URLs) is NOT stored: a couple of 10MB videos would
// blow the ~5MB localStorage quota and throw. We keep the metadata that makes
// the history useful and treat the media itself as ephemeral.
// ---------------------------------------------------------------------------

export type CreationStatus = "completed" | "failed";

export type Creation = {
  id: string;
  toolSlug: string;
  toolTitle: string;
  /** Short human label, e.g. the script's opening words or the source URL. */
  title: string;
  status: CreationStatus;
  /** ISO timestamp. */
  createdAt: string;
  /** Only set while the originating tab is still alive — never persisted. */
  mediaUrl?: string;
  kind: "video" | "image";
  /** Populated on failure so Amber can explain what went wrong. */
  error?: string;
};

const KEY = "reelo.workspace.v1";
const MAX_ITEMS = 100;
const EVENT = "reelo:workspace-change";

function canStore(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Media URLs are stripped before writing — see note above. */
function persistable(c: Creation): Omit<Creation, "mediaUrl"> {
  const { mediaUrl: _drop, ...rest } = c;
  void _drop;
  return rest;
}

// useSyncExternalStore requires getSnapshot() to return a STABLE reference
// between changes, so the parsed list is cached and only invalidated on write.
// Returning a fresh array each call would loop forever.
const EMPTY: Creation[] = [];
let cache: Creation[] | null = null;

export function readCreations(): Creation[] {
  if (!canStore()) return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cache = EMPTY;
      return cache;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = EMPTY;
      return cache;
    }
    cache = parsed.filter(
      (c): c is Creation =>
        !!c && typeof c === "object" && typeof (c as Creation).id === "string" && typeof (c as Creation).createdAt === "string",
    );
    return cache;
  } catch {
    cache = EMPTY;
    return cache;
  }
}

/** Server render has no localStorage — always the empty list. */
export function getServerSnapshot(): Creation[] {
  return EMPTY;
}

function invalidate() {
  cache = null;
}

function write(list: Creation[]) {
  if (!canStore()) return;
  const next = list.slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next.map(persistable)));
  } catch {
    // Quota exceeded or storage disabled — history is a convenience, never
    // let it break an otherwise successful generation.
  }
  // Keep the in-memory cache authoritative for this tab: it retains mediaUrl,
  // which is deliberately not persisted.
  cache = next;
  window.dispatchEvent(new Event(EVENT));
}

/** Record a finished generation. Returns the stored record. */
export function recordCreation(input: Omit<Creation, "id" | "createdAt">): Creation {
  const creation: Creation = {
    ...input,
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  // Newest first.
  write([creation, ...readCreations()]);
  return creation;
}

export function deleteCreation(id: string) {
  write(readCreations().filter((c) => c.id !== id));
}

export function clearCreations() {
  write([]);
}

/** Subscribe to workspace changes (same tab via custom event, other tabs via storage). */
export function subscribe(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => fn();
  // Another tab wrote — drop our cache so the next snapshot re-reads storage.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) {
      invalidate();
      fn();
    }
  };
  window.addEventListener(EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

/** Compact summary used as grounding context for Amber. */
export function summarize(list: Creation[] = readCreations()) {
  const completed = list.filter((c) => c.status === "completed");
  const failed = list.filter((c) => c.status === "failed");
  const byTool = new Map<string, number>();
  for (const c of completed) byTool.set(c.toolTitle, (byTool.get(c.toolTitle) ?? 0) + 1);

  return {
    total: list.length,
    completed: completed.length,
    failed: failed.length,
    toolsUsed: [...byTool.entries()].map(([tool, count]) => ({ tool, count })).sort((a, b) => b.count - a.count),
    recent: list.slice(0, 8).map((c) => ({
      tool: c.toolTitle,
      title: c.title,
      status: c.status,
      createdAt: c.createdAt,
      ...(c.error ? { error: c.error } : {}),
    })),
    lastFailure: failed[0] ? { tool: failed[0].toolTitle, error: failed[0].error ?? "Unknown error" } : null,
  };
}
