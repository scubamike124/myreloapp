"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { canRecord, micPermissionError, micUnsupportedMessage, pickMimeType } from "./dictation";

const noopSubscribe = () => () => {};

export function useDictation(opts: {
  input: string;
  setInput: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onError: (message: string | null) => void;
}) {
  const { input, setInput, inputRef, onError } = opts;
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const micSupported = useSyncExternalStore(noopSubscribe, canRecord, () => false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const baseTextRef = useRef("");

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

  const transcribe = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        onError("Nothing was recorded. Check your microphone and try again.");
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
          onError(data.error || "Couldn't transcribe that. Try again, or type instead.");
          return;
        }
        if (!data.text) {
          onError(data.detail || "I didn't catch any speech in that recording.");
          return;
        }

        const base = baseTextRef.current;
        setInput(base ? `${base.replace(/\s*$/, "")} ${data.text}` : data.text);
        inputRef.current?.focus();
      } catch {
        onError("Couldn't reach the transcription service. Check your connection.");
      } finally {
        setTranscribing(false);
      }
    },
    [inputRef, onError, setInput],
  );

  const toggleDictation = useCallback(async () => {
    if (!micSupported) {
      onError(micUnsupportedMessage());
      return;
    }

    if (listening) {
      recorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      onError(micPermissionError((e as Error)?.name));
      return;
    }

    const mimeType = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      onError("This browser can't record audio. Try Chrome, Edge, or Safari.");
      return;
    }

    chunksRef.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
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
      onError("Recording stopped unexpectedly. Try again, or type instead.");
    };

    baseTextRef.current = input;
    recorderRef.current = rec;
    onError(null);
    setListening(true);
    rec.start();
  }, [input, listening, micSupported, onError, releaseMic, transcribe]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  return { micSupported, listening, transcribing, toggleDictation, releaseMic, stopRecording };
}
