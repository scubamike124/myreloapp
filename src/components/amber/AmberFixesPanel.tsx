"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { classifyAmberMode, shouldSendOnEnter, isAmberFixWorkIntent, type ThreadTurn } from "@/lib/amber/intent";
import { activityFromRunDiff, publicRun, type BuilderRun } from "@/lib/amber/progress";
import { useDictation } from "@/lib/amber/use-dictation";
import { PROJECTS, projectLabel } from "@/lib/amber/project-registry";
import { resolveDispatchProject } from "@/lib/amber/dispatch";
import AmberProjectSidebar, { type ProjectStatus } from "./AmberProjectSidebar";
import AmberWorkspaceHeader from "./AmberWorkspaceHeader";
import AmberActivityConsole from "./AmberActivityConsole";
import "./amber-fixes.css";

type Role = "user" | "assistant" | "activity";

type Account = { name: string | null; email: string; role?: "USER" | "ADMIN" | "OWNER" };

type Msg = {
  id: string;
  role: Role;
  content: string;
  at: number;
};

const THREAD_KEY = "amber-fixes-thread-v1";
const DRAFT_KEY = "amber-fixes-draft-v1";
const PROJECT_KEY = "amber-fixes-project-v1";
const SEEN_KEY = "amber-fixes-seen-events-v1";
const RUN_KEY = "amber-fixes-run-v1";
const ACTIVE_RUN_ID_KEY = "amber-fixes-active-run-id-v1";
const SIDEBAR_KEY = "amber-fixes-sidebar-open-v1";
const LOG_OPEN_KEY = "amber-fixes-log-open-v1";

function nid(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function AmberFixesPanel() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [projectKey, setProjectKey] = useState("reelo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stickBottom, setStickBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<BuilderRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<BuilderRun[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickRef = useRef(true);
  const runSnapRef = useRef<BuilderRun | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  const dictation = useDictation({
    input,
    setInput,
    inputRef,
    onError: setError,
  });

  useEffect(() => {
    // Amber Fixes is a full-screen, fixed-position page with its own chrome
    // -- the global AuthBar is hidden here (it used to float on top of this
    // page's own header) and this account block is its inline replacement,
    // same /api/auth source, rendered in the sidebar footer instead of
    // floating over the page.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!cancelled && data?.configured && data.user) {
          setAccount({ name: data.user.name, email: data.user.email, role: data.user.role });
        }
      } catch {
        /* account row is a convenience -- the page still works without it */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }, [router]);

  useEffect(() => {
    setMessages(loadJson<Msg[]>(THREAD_KEY, []));
    setInput(loadJson<string>(DRAFT_KEY, ""));
    setProjectKey(loadJson<string>(PROJECT_KEY, "reelo"));
    seenRef.current = new Set(loadJson<string[]>(SEEN_KEY, []));
    // Confirmed live: the workspace card vanished on every reload, even
    // seconds after a real job finished (or mid-run), because currentRun
    // lived only in React state -- reloading the page made the whole
    // fixed workspace disappear and fall back to looking like a plain
    // chat screen again, "fixed" only until the tab refreshed.
    const storedRun = loadJson<BuilderRun | null>(RUN_KEY, null);
    if (storedRun) {
      setCurrentRun(storedRun);
      runSnapRef.current = storedRun;
    }
    const storedActiveRunId = loadJson<string | null>(ACTIVE_RUN_ID_KEY, null);
    if (storedActiveRunId) setActiveRunId(storedActiveRunId);
    setLogOpen(loadJson<boolean>(LOG_OPEN_KEY, false));
    // The sidebar defaults open on a real desktop-sized viewport and closed
    // (a drawer you open on demand) on a phone-sized one -- read once from
    // the real window width rather than guessing, then let the owner's own
    // toggle (persisted below) win from then on.
    const storedSidebar = loadJson<boolean | null>(SIDEBAR_KEY, null);
    setSidebarOpen(storedSidebar ?? window.innerWidth >= 900);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(THREAD_KEY, JSON.stringify(messages.slice(-200)));
  }, [hydrated, messages]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(DRAFT_KEY, input);
  }, [hydrated, input]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(PROJECT_KEY, projectKey);
  }, [hydrated, projectKey]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(RUN_KEY, JSON.stringify(currentRun));
  }, [hydrated, currentRun]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(ACTIVE_RUN_ID_KEY, JSON.stringify(activeRunId));
  }, [hydrated, activeRunId]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarOpen));
  }, [hydrated, sidebarOpen]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(LOG_OPEN_KEY, JSON.stringify(logOpen));
  }, [hydrated, logOpen]);

  const append = useCallback((role: Role, content: string, id?: string) => {
    const msg: Msg = { id: id || nid(), role, content, at: Date.now() };
    setMessages((m) => [...m, msg]);
    if (!stickRef.current) setUnseen((n) => n + 1);
    return msg.id;
  }, []);

  const appendActivity = useCallback(
    (text: string, key: string) => {
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seenRef.current].slice(-400)));
      append("activity", text, key);
    },
    [append],
  );

  const jumpToBottom = useCallback(() => {
    stickRef.current = true;
    setStickBottom(true);
    setUnseen(0);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const onThreadScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = dist < 72;
    stickRef.current = atBottom;
    setStickBottom(atBottom);
    if (atBottom) setUnseen(0);
  };

  const streamAmber = useCallback(
    async (history: Msg[], opts: { alreadyStarted?: boolean; resolvedProjectKey?: string } = {}) => {
      const payload: ThreadTurn[] = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
        .slice(-32);

      const controller = new AbortController();
      abortRef.current = controller;
      const mode = classifyAmberMode(payload[payload.length - 1]?.content || "", payload.slice(0, -1), {
        surface: "amber-fix",
      });

      const res = await fetch("/api/amber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: payload,
          mode,
          context: {
            path: "/amber-builder",
            page: "amber-fix",
            projectKey: opts.resolvedProjectKey || projectKey,
            // Tells /api/amber a real coding task for this exact message was
            // already started via startRepair below -- without this, its own
            // work-intent check fired a SECOND, independent task (via a
            // different bridge, hardcoded to a different project) for the
            // same owner message. See dispatch.ts's file comment.
            alreadyStarted: opts.alreadyStarted || undefined,
            locale: typeof navigator !== "undefined" ? navigator.language : undefined,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Amber couldn't reply just now.");
      }

      const assistantId = nid();
      setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "", at: Date.now() }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg)),
        );
      }
    },
    [projectKey],
  );

  const startRepair = useCallback(
    async (prompt: string, resolvedProjectKey: string) => {
      const res = await fetch("/api/amber-builder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectKey: resolvedProjectKey, executeNow: true }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok || data.ok === false) {
        throw new Error(String(data.error || data.detail || "Could not start that repair."));
      }

      const events = Array.isArray(data.events) ? data.events : [];
      for (const ev of events) {
        if (ev && typeof ev === "object" && typeof (ev as { text?: string }).text === "string") {
          const key = String((ev as { key?: string }).key || (ev as { text: string }).text);
          appendActivity(String((ev as { text: string }).text), key);
        }
      }

      const runRaw = (data.codingRun && typeof data.codingRun === "object" ? data.codingRun : data) as Record<
        string,
        unknown
      >;
      const task = data.task && typeof data.task === "object" ? (data.task as Record<string, unknown>) : null;
      const taskId = typeof task?.id === "string" ? task.id : typeof runRaw.taskId === "string" ? runRaw.taskId : undefined;
      const run = publicRun({ ...runRaw, taskId: runRaw.taskId || taskId });
      setActiveRunId(run.id || run.taskId || taskId || "__latest__");
      runSnapRef.current = run;
      setCurrentRun(run);
      if (events.length === 0 && run.status) {
        for (const line of activityFromRunDiff(null, run)) appendActivity(line.text, line.key);
      }
    },
    [appendActivity],
  );

  const pollRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/amber-builder", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const runs: BuilderRun[] = Array.isArray(data.runs)
        ? data.runs.map((r: Record<string, unknown>) => publicRun(r))
        : [];
      setRecentRuns(runs);

      const target =
        activeRunId && activeRunId !== "__latest__"
          ? runs.find((r) => r.id === activeRunId || r.taskId === activeRunId)
          : runs[0];
      if (!target) return;

      const prev =
        runSnapRef.current &&
        (runSnapRef.current.id === target.id ||
          (runSnapRef.current.taskId && runSnapRef.current.taskId === target.taskId))
          ? runSnapRef.current
          : null;
      for (const line of activityFromRunDiff(prev, target)) appendActivity(line.text, line.key);
      runSnapRef.current = target;
      setCurrentRun(target);

      // Keep polling through "succeeded, PR open, not yet merged" too -- the
      // owner approves via chat/Reelo Command Center separately from this
      // panel, and without this the workspace would freeze on "needs
      // approval" forever even after a merge actually happened elsewhere.
      const pendingApproval = target.status === "succeeded" && Boolean(target.prUrl) && !target.mergedAt;
      const live = target.status === "queued" || target.status === "running" || target.status === "testing" || pendingApproval;
      if (!live && target.id) setActiveRunId((id) => (id === target.id || id === target.taskId ? null : id));
    } catch {
      /* keep the thread usable if status is briefly unreachable */
    }
  }, [activeRunId, appendActivity]);

  // Fast poll while a run is active (existing behavior).
  useEffect(() => {
    if (!activeRunId) return;
    void pollRuns();
    const id = setInterval(() => void pollRuns(), 2500);
    return () => clearInterval(id);
  }, [activeRunId, pollRuns]);

  // Slow, always-on poll so the sidebar's per-project status dots reflect
  // each project's real last-known run even when nothing is active right
  // now -- same endpoint, same real data, just less often (there is no
  // separate per-project status API to call instead).
  useEffect(() => {
    if (activeRunId) return; // the fast poll above already refreshes recentRuns
    void pollRuns();
    const id = setInterval(() => void pollRuns(), 20000);
    return () => clearInterval(id);
  }, [activeRunId, pollRuns]);

  const statusByProject = useMemo(() => {
    const byLabel = new Map<string, BuilderRun>();
    for (const run of recentRuns) {
      const label = run.projectName;
      if (!label || byLabel.has(label)) continue;
      byLabel.set(label, run);
    }
    const out: Record<string, ProjectStatus> = {};
    for (const p of PROJECTS) {
      const run = byLabel.get(p.label);
      if (run) out[p.key] = { status: run.status, prUrl: run.prUrl, mergedAt: run.mergedAt };
    }
    return out;
  }, [recentRuns]);

  const send = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || busy) return;

      const userMsg: Msg = { id: nid(), role: "user", content: trimmed, at: Date.now() };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      sessionStorage.setItem(DRAFT_KEY, "");
      setError(null);
      setBusy(true);
      if (!stickRef.current) {
        stickRef.current = true;
        setStickBottom(true);
        setUnseen(0);
      }

      const historyTurns: ThreadTurn[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const mode = isAmberFixWorkIntent(trimmed)
        ? "execution"
        : classifyAmberMode(trimmed, historyTurns, { surface: "amber-fix" });

      try {
        if (mode === "execution") {
          const dispatch = resolveDispatchProject(trimmed, projectKey);

          if (dispatch.kind === "ambiguous") {
            // Two different projects were named -- guessing either one risks
            // real work landing on the wrong repo. Ask instead.
            const names = dispatch.candidates.map((c) => c.label).join(" or ");
            appendActivity(
              `That mentions more than one project (${names}). Which one should I work on?`,
              `ambiguous-project:${nid()}`,
            );
            return;
          }

          if (dispatch.source === "text" && dispatch.projectKey !== projectKey) {
            // The message named a different project than the selected sidebar
            // entry -- the text wins, and the selection updates, not silently.
            setProjectKey(dispatch.projectKey);
            appendActivity(`Working on ${dispatch.label} — that's what you named.`, `project-switch:${nid()}`);
          }

          await startRepair(trimmed, dispatch.projectKey);
          try {
            await streamAmber(next, { alreadyStarted: true, resolvedProjectKey: dispatch.projectKey });
          } catch {
            /* repair already started; a missing chat line is not a failed job */
          }
        } else {
          await streamAmber(next);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [busy, messages, projectKey, appendActivity, startRepair, streamAmber],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const placeholder = dictation.listening
    ? "Recording… tap the microphone again when you're done"
    : dictation.transcribing
      ? "Transcribing…"
      : "Message Amber";

  return (
    <div className="amber-fixes-root">
      <AmberProjectSidebar
        projects={PROJECTS}
        activeKey={projectKey}
        onSelect={(key) => {
          setProjectKey(key);
          if (window.innerWidth < 900) setSidebarOpen(false);
        }}
        statusByProject={statusByProject}
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen((v) => !v)}
        account={account}
        signingOut={signingOut}
        onSignOut={() => void signOut()}
      />

      <div className="amber-main">
        <AmberWorkspaceHeader
          projectLabel={projectLabel(projectKey)}
          run={currentRun}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <div className="amber-main-body">
          <AmberActivityConsole run={currentRun} idleProjectLabel={projectLabel(projectKey)} />

          <details
            className="amber-log"
            open={logOpen}
            onToggle={(e) => setLogOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="amber-log-summary">
              Conversation{unseen > 0 && !logOpen ? ` · ${unseen} new` : ""}
            </summary>
            <div ref={scrollRef} className="amber-fixes-thread" onScroll={onThreadScroll}>
              {hydrated && messages.length === 0 && (
                <div className="amber-fixes-empty">
                  <p>
                    Hi — I&apos;m Amber. Tell me the outcome you want. I&apos;ll inspect the code, queue the work,
                    and keep you updated — I won&apos;t ask you to act like the developer.
                  </p>
                  <div className="amber-fixes-starters">
                    {[
                      "Fix whatever is broken on the homepage.",
                      "Update this project's docs to match how it actually works.",
                      "Can you make a video?",
                    ].map((s) => (
                      <button key={s} type="button" onClick={() => void send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <article key={m.id} className={`amber-fixes-msg amber-fixes-msg--${m.role}`}>
                  <div className="amber-fixes-who">
                    {m.role === "user" ? "You" : m.role === "activity" ? "Amber · work" : "Amber"}
                  </div>
                  <div className="amber-fixes-bubble">{m.content || (busy && m.role === "assistant" ? "…" : "")}</div>
                </article>
              ))}

              {busy && messages[messages.length - 1]?.role !== "assistant" && (
                <article className="amber-fixes-msg amber-fixes-msg--assistant">
                  <div className="amber-fixes-who">Amber</div>
                  <div className="amber-fixes-bubble amber-fixes-bubble--pending">Working…</div>
                </article>
              )}

              {error && (
                <p className="amber-fixes-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            {!stickBottom && (
              <button type="button" className="amber-fixes-jump" onClick={jumpToBottom}>
                {unseen > 0 ? `New activity · Jump to latest` : "Jump to latest"}
              </button>
            )}
          </details>
        </div>

        <form
          className="amber-fixes-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="amber-fixes-sr" htmlFor="amber-fixes-input">
            Message Amber
          </label>
          <textarea
            id="amber-fixes-input"
            ref={inputRef}
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (shouldSendOnEnter(e)) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={placeholder}
            data-amber-builder-prompt="1"
          />
          <div className="amber-fixes-composer-bar">
            <button
              type="button"
              className={dictation.listening ? "is-live" : ""}
              onClick={() => void dictation.toggleDictation()}
              disabled={dictation.transcribing}
              aria-label={
                dictation.listening ? "Stop recording" : dictation.transcribing ? "Transcribing" : "Record a message"
              }
              aria-pressed={dictation.listening}
            >
              <MicMark active={dictation.listening || dictation.transcribing} />
              <span>{dictation.listening ? "Stop" : dictation.transcribing ? "…" : "Mic"}</span>
            </button>
            <button
              type="submit"
              className="amber-fixes-send"
              disabled={busy || input.trim().length === 0}
              data-amber-builder-submit="1"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MicMark({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={active ? "amber-fixes-mic-live" : undefined}
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}
