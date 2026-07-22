"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { areaFromPath } from "@/lib/amber/context";
import { starterPrompts } from "@/lib/amber/persona";
import { readCreations, summarize } from "@/lib/workspace";

// ---------------------------------------------------------------------------
// The ONE Amber surface. Mounted once in the root layout so Amber is present
// on every page and keeps a single continuous conversation as the user moves
// around. Do not mount a second instance and do not build a rival assistant —
// see lib/amber/persona.ts.
// ---------------------------------------------------------------------------

type Msg = { role: "user" | "assistant"; content: string };

/** Support never changes at runtime, so there is nothing to subscribe to. */
const noopSubscribe = () => () => {};

/** Recording needs a mic, MediaRecorder, and a secure context (https or localhost). */
function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator?.mediaDevices?.getUserMedia)
  );
}

/** First container the browser will actually give us. Chrome and Firefox do
 *  webm/opus; Safari only does mp4. */
function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

const HIDDEN_ON = ["/admin/login"];

/**
 * Any part of the product can summon Amber by dispatching this event. This is
 * how we keep a single assistant instance instead of embedding chat widgets in
 * individual features.
 */
export const AMBER_OPEN_EVENT = "reelo:amber-open";

export function openAmber() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AMBER_OPEN_EVENT));
}

export default function AmberDock() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // Recording works anywhere there's a mic and a secure context. The server
  // snapshot is `false` so the markup matches until hydration decides.
  const micSupported = useSyncExternalStore(noopSubscribe, canRecord, () => false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  // Text already in the box when recording started, so the transcript appends
  // rather than replacing what the user typed by hand.
  const baseTextRef = useRef("");

  const area = areaFromPath(pathname);
  const toolSlug = pathname.startsWith("/create/") ? pathname.split("/")[2] : undefined;

  // Autoscroll as the reply streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  // Focus the composer when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes; Ctrl/Cmd+K toggles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Cancel any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Never leave the mic running after the component goes away.
  /** Release the mic. Without this the browser's recording indicator stays lit. */
  const releaseMic = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec) return;
    rec.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
  }, []);

  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  // Stop recording when the panel closes, so the mic is never left hot on a
  // screen the user has navigated away from.
  useEffect(() => {
    if (!open && recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, [open]);

  const transcribe = useCallback(async (blob: Blob) => {
    if (blob.size === 0) {
      setError("Nothing was recorded. Check your microphone and try again.");
      return;
    }

    setTranscribing(true);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Couldn't transcribe that. Try again, or type instead.");
        return;
      }
      if (!data.text) {
        setError(data.detail || "I didn't catch any speech in that recording.");
        return;
      }

      const base = baseTextRef.current;
      setInput(base ? `${base.replace(/\s*$/, "")} ${data.text}` : data.text);
      inputRef.current?.focus();
    } catch {
      setError("Couldn't reach the transcription service. Check your connection.");
    } finally {
      setTranscribing(false);
    }
  }, []);

  const toggleDictation = useCallback(async () => {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as Error)?.name;
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access is blocked. Click the icon at the left of your browser's address bar, allow the microphone, then try again."
          : name === "NotFoundError"
            ? "No microphone was found. Check one is plugged in and enabled in your system settings."
            : "Couldn't open your microphone. Another app may be using it.",
      );
      return;
    }

    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setError("This browser can't record audio. Try Chrome, Edge, or Safari.");
      return;
    }

    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      setListening(false);
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
      chunksRef.current = [];
      releaseMic();
      void transcribe(blob);
    };
    rec.onerror = () => {
      setListening(false);
      releaseMic();
      setError("Recording stopped unexpectedly. Try again, or type instead.");
    };

    baseTextRef.current = input;
    recorderRef.current = rec;
    setError(null);
    setListening(true);
    rec.start();
  }, [listening, input, releaseMic, transcribe]);

  // Let any feature open Amber (see openAmber above).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(AMBER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AMBER_OPEN_EVENT, onOpen);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setInput("");
      setError(null);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/amber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: next,
            context: {
              path: pathname,
              toolSlug,
              // Lets Amber answer "what's trending" for the user's own country
              // instead of defaulting to the US. Neither needs a permission
              // prompt, unlike geolocation.
              locale: typeof navigator !== "undefined" ? navigator.language : undefined,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              workspace: summarize(readCreations()),
            },
          }),
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Amber couldn't reply just now.");
          return;
        }

        // Append an empty assistant turn, then fill it as chunks arrive.
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Connection lost. Try again.");
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, pathname, toolSlug],
  );

  if (HIDDEN_ON.includes(pathname)) return null;

  const starters = starterPrompts(area);

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="amber-panel"
        aria-label={open ? "Close Amber" : "Ask Amber"}
        // On mobile the panel is a full-width sheet and this launcher floats
        // directly over its send button, so it hides while open. On desktop the
        // panel sits above the launcher and there is no overlap.
        className={`fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8892] sm:bottom-6 sm:right-6 ${
          open ? "max-sm:hidden" : ""
        }`}
        style={{
          background: "linear-gradient(135deg,#ff3645,#c4101c)",
          boxShadow: "0 10px 30px -8px rgba(225,29,42,.65)",
        }}
      >
        <AmberMark />
        <span className="hidden sm:inline">{open ? "Close" : "Ask Amber"}</span>
      </button>

      {open && (
        <>
          {/* Backdrop — mobile only, so desktop users can keep working. */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[68] bg-black/50 backdrop-blur-[2px] sm:hidden"
          />

          <div
            id="amber-panel"
            role="dialog"
            aria-label="Amber assistant"
            className="fixed inset-x-0 bottom-0 z-[69] flex h-[78vh] flex-col overflow-hidden rounded-t-3xl border border-white/12 text-white shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,72vh)] sm:w-[400px] sm:rounded-3xl"
            style={{ background: "rgba(14,8,10,.97)", backdropFilter: "blur(12px)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                style={{ background: "linear-gradient(135deg,#ff3645,#b3121d)" }}
              >
                <AmberMark />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-bold leading-tight">Amber</div>
                <div className="truncate text-[11px] text-white/40">Your Reelo assistant</div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    abortRef.current?.abort();
                    setMessages([]);
                    setError(null);
                  }}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white/40 transition-colors hover:text-white"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Amber"
                className="rounded-lg p-1.5 text-white/45 transition-colors hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div>
                  <p className="text-sm leading-relaxed text-white/70">
                    Hi — I&apos;m Amber. I can help you pick the right tool, write a script, or figure out what to make
                    next.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {starters.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-xl border border-white/12 bg-white/[.04] px-3.5 py-2.5 text-left text-[13px] font-medium text-white/80 transition-colors hover:border-[rgba(255,70,85,.4)] hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" }
                        : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.88)" }
                    }
                  >
                    {m.content || (busy && i === messages.length - 1 ? <Dots /> : null)}
                  </div>
                </div>
              ))}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed"
                  style={{ border: "1px solid rgba(255,70,85,.3)", background: "rgba(255,60,75,.07)", color: "#ff9aa3" }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-white/10 px-3 py-3"
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-3 py-2"
                style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={
                    listening
                      ? "Recording… click the mic again when you're done"
                      : transcribing
                        ? "Transcribing…"
                        : "Ask Amber anything…"
                  }
                  className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
                />
                {/* Always rendered. Hiding it in unsupported browsers made a
                    missing feature look like a broken one. */}
                <button
                  type="button"
                  onClick={
                    micSupported
                      ? toggleDictation
                      : () =>
                          setError(
                            "Voice input needs a microphone and a secure page (https or localhost). This browser or address can't record.",
                          )
                  }
                  disabled={transcribing}
                  aria-label={
                    listening ? "Stop recording" : transcribing ? "Transcribing" : "Record a message"
                  }
                  aria-pressed={listening}
                  className={`shrink-0 rounded-xl p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    listening ? "text-white" : "text-white/45 hover:text-white"
                  }`}
                  style={listening ? { background: "rgba(255,60,75,.22)" } : undefined}
                >
                  <MicMark active={listening || transcribing} />
                </button>
                <button
                  type="submit"
                  disabled={busy || input.trim().length === 0}
                  aria-label="Send"
                  className="shrink-0 rounded-xl p-2 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

function AmberMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function MicMark({ active }: { active: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={active ? "animate-pulse" : undefined}
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Amber is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
