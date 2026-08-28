"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Shared microphone-dictation logic, extracted from AmberDock so the Command
// Center's Composer doesn't duplicate the same ~90 lines of MediaRecorder
// handling. Both call POST /api/transcribe the same way.
// ---------------------------------------------------------------------------

const noopSubscribe = () => () => {};

function canRecord(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator?.mediaDevices?.getUserMedia)
  );
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

export function useDictation(opts: { getBaseText: () => string; onTranscript: (text: string) => void; onError: (message: string) => void }) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const micSupported = useSyncExternalStore(noopSubscribe, canRecord, () => false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const baseTextRef = useRef("");
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const releaseMic = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec) return;
    rec.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
  }, []);

  useEffect(() => () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  const transcribe = useCallback(async (blob: Blob) => {
    if (blob.size === 0) {
      optsRef.current.onError("Nothing was recorded. Check your microphone and try again.");
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
        optsRef.current.onError(data.error || "Couldn't transcribe that. Try again, or type instead.");
        return;
      }
      if (!data.text) {
        optsRef.current.onError(data.detail || "I didn't catch any speech in that recording.");
        return;
      }
      const base = baseTextRef.current;
      optsRef.current.onTranscript(base ? `${base.replace(/\s*$/, "")} ${data.text}` : data.text);
    } catch {
      optsRef.current.onError("Couldn't reach the transcription service. Check your connection.");
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
      optsRef.current.onError(
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
      optsRef.current.onError("This browser can't record audio. Try Chrome, Edge, or Safari.");
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
      optsRef.current.onError("Recording stopped unexpectedly. Try again, or type instead.");
    };

    baseTextRef.current = optsRef.current.getBaseText();
    recorderRef.current = rec;
    setListening(true);
    rec.start();
  }, [listening, releaseMic, transcribe]);

  const stopIfRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  return { listening, transcribing, micSupported, toggleDictation, stopIfRecording };
}
