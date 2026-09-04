"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { classifyAmberMode, shouldSendOnEnter, isAmberFixWorkIntent, type ThreadTurn } from "@/lib/amber/intent";
import { activityFromRunDiff, publicRun, type BuilderRun } from "@/lib/amber/progress";
import { useDictation } from "@/lib/amber/use-dictation";
import "./amber-fixes.css";

type Role = "user" | "assistant" | "activity";

type Msg = {
  id: string;
  role: Role;
  content: string;
  at: number;
};

const PROJECTS = [
  { key: "reelo", label: "Reelo" },
  { key: "forma", label: "Forma" },
  { key: "amber_hq", label: "Amber HQ" },
  { key: "launch_ready", label: "Launch Ready" },
  { key: "rest_pilot", label: "Rest Pilot" },
  { key: "dayli", label: "Dayli" },
] as const;

/** Admin-only banner on the Amber Fix console. Not rendered on any customer surface. */
const AMBER_FIX_STATUS_LINE = "Amber Fix — Autonomous Developer Online.";

const THREAD_KEY = "amber-fixes-thread-v1";
const DRAFT_KEY = "amber-fixes-draft-v1";
const PROJECT_KEY = "amber-fixes-project-v1";
const SEEN_KEY = "amber-fixes-seen-events-v1";

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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [projectKey, setProjectKey] = useState("reelo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stickBottom, setStickBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

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
    setMessages(loadJson<Msg[]>(THREAD_KEY, []));
    setInput(loadJson<string>(DRAFT_KEY, ""));
    setProjectKey(loadJson<string>(PROJECT_KEY, "reelo"));
    seenRef.current = new Set(loadJson<string[]>(SEEN_KEY, []));
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
    async (history: Msg[]) => {
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
            projectKey,
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
    async (prompt: string) => {
      const res = await fetch("/api/amber-builder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectKey, executeNow: true }),
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
      if (events.length === 0 && run.status) {
        for (const line of activityFromRunDiff(null, run)) appendActivity(line.text, line.key);
      }
    },
    [appendActivity, projectKey],
  );

  const pollRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/amber-builder", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const runs: BuilderRun[] = Array.isArray(data.runs)
        ? data.runs.map((r: Record<string, unknown>) => publicRun(r))
        : [];
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

      const live = target.status === "queued" || target.status === "running" || target.status === "testing";
      if (!live && target.id) setActiveRunId((id) => (id === target.id || id === target.taskId ? null : id));
    } catch {
      /* keep the thread usable if status is briefly unreachable */
    }
  }, [activeRunId, appendActivity]);

  useEffect(() => {
    if (!activeRunId) return;
    void pollRuns();
    const id = setInterval(() => void pollRuns(), 2500);
    return () => clearInterval(id);
  }, [activeRunId, pollRuns]);

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
          await startRepair(trimmed);
          try {
            await streamAmber(next);
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
    [busy, messages, startRepair, streamAmber],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const placeholder = dictation.listening
    ? "Recording… tap the microphone again when you're done"
    : dictation.transcribing
      ? "Transcribing…"
      : "Message Amber";

  return (
    <div className="amber-fixes-root">
      <header className="amber-fixes-head">
        <Link href="/business-center" className="amber-fixes-back">
          ← Business Center
        </Link>
        <div className="amber-fixes-titles">
          <h1>Amber Fixes</h1>
          <p>Give Amber a clear outcome. She inspects the repo, implements, tests, and ships the normal workflow.</p>
          <p className="amber-fixes-status" data-amber-fix-status="1">
            <span className="amber-fixes-status-dot" aria-hidden />
            {AMBER_FIX_STATUS_LINE}
          </p>
        </div>
        <div className="amber-fixes-projects" role="group" aria-label="Repository">
          {PROJECTS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={projectKey === p.key ? "is-on" : ""}
              onClick={() => setProjectKey(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div ref={scrollRef} className="amber-fixes-thread" onScroll={onThreadScroll}>
        {hydrated && messages.length === 0 && (
          <div className="amber-fixes-empty">
            <p>
              Hi — I&apos;m Amber. Tell me the Relo outcome you want. I&apos;ll inspect the code, queue the work, and
              keep you updated — I won&apos;t ask you to act like the developer.
            </p>
            <div className="amber-fixes-starters">
              {[
                "Fix whatever is broken on the Reelo homepage.",
                "Update Reelo's Business Center Amber Fix card copy to match how this page actually works.",
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
            <div className="amber-fixes-bubble">
              {m.content || (busy && m.role === "assistant" ? "…" : "")}
            </div>
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
          rows={4}
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
