"use client";

import { useMemo, useState } from "react";
import type { KeyStatus } from "@/lib/env-vault";

// Values typed here are POSTed to our own server, which writes them to
// .env.local. Nothing is kept in localStorage, and the server only ever sends
// back masked previews — so a saved key can be recognised but never re-read.

const TESTABLE: Record<string, string> = {
  GEMINI_API_KEY: "gemini",
  HEYGEN_API_KEY: "heygen",
};

type TestState = { ok: boolean; detail: string } | "running" | undefined;

export default function VaultManager({
  initialKeys,
  canWrite,
}: {
  initialKeys: KeyStatus[];
  canWrite: boolean;
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const map = new Map<string, KeyStatus[]>();
    for (const k of keys) {
      const list = map.get(k.group) ?? [];
      list.push(k);
      map.set(k.group, list);
    }
    return [...map.entries()];
  }, [keys]);

  const dirty = Object.entries(drafts).filter(([, v]) => v !== undefined);
  const restartNeeded = keys.some((k) => k.needsRestart);

  const save = async () => {
    if (busy || dirty.length === 0) return;
    setBusy(true);
    setNotice(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: Object.fromEntries(dirty) }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setNotice({ kind: "error", text: data.error || "Could not save." });
        return;
      }

      if (Array.isArray(data.keys)) setKeys(data.keys);

      // Warnings describe keys that DID save but looked unusual, so they are
      // shown alongside the field without blocking anything.
      const warnings: { name: string; message: string }[] = Array.isArray(data.warnings) ? data.warnings : [];
      const map: Record<string, string> = {};
      for (const w of warnings) map[w.name] = w.message;

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        for (const e of data.errors) map[e.name] = e.message;
        setFieldErrors(map);
        setNotice({
          kind: "error",
          text: `Saved ${data.written?.length ?? 0}. ${data.errors.length} could not be saved.`,
        });
      } else {
        setFieldErrors(map);
        const saved = `Saved ${data.written?.length ?? 0} key${data.written?.length === 1 ? "" : "s"} to .env.local.`;
        setNotice(
          warnings.length > 0
            ? { kind: "ok", text: `${saved} ${warnings.length} looked unusual — run Test to confirm.` }
            : { kind: "ok", text: saved },
        );
      }

      // Clear only the drafts that actually landed.
      const written: string[] = data.written ?? [];
      setDrafts((d) => {
        const next = { ...d };
        for (const name of written) delete next[name];
        return next;
      });
    } catch {
      setNotice({ kind: "error", text: "Network error. Nothing was saved." });
    } finally {
      setBusy(false);
    }
  };

  const test = async (name: string) => {
    const provider = TESTABLE[name];
    if (!provider) return;
    setTests((t) => ({ ...t, [name]: "running" }));
    try {
      const res = await fetch("/api/admin/vault/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json().catch(() => ({}));
      setTests((t) => ({ ...t, [name]: { ok: Boolean(data.ok), detail: data.detail || data.error || "No response." } }));
    } catch {
      setTests((t) => ({ ...t, [name]: { ok: false, detail: "Could not run the test." } }));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-[28px]">Key vault</h1>
          <p className="mt-1 text-sm text-white/50">
            Add your API keys here instead of editing files. They&apos;re written to{" "}
            <code className="text-[#ff8892]">.env.local</code> on the server.
          </p>
        </div>
        <button
          onClick={save}
          disabled={busy || dirty.length === 0 || !canWrite}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px -8px rgba(225,29,42,.6)" }}
        >
          {busy ? "Saving…" : dirty.length > 0 ? `Save ${dirty.length} change${dirty.length === 1 ? "" : "s"}` : "Save changes"}
        </button>
      </div>

      {!canWrite && (
        <Banner tone="warn">
          <strong className="font-bold">Read-only here.</strong> This is a deployed server, and its filesystem is
          read-only — so keys can&apos;t be edited from the browser. Set them in your host&apos;s environment settings
          (Vercel → Settings → Environment Variables), then redeploy. You can still see what&apos;s configured below.
        </Banner>
      )}

      {canWrite && (
        <Banner tone="info">
          Keys are stored in <code>.env.local</code>, which is gitignored — they never get committed. Secret values are
          never sent back to this page, so once saved you&apos;ll only see a masked hint.
          <br />
          <span className="mt-1 block text-white/45">
            Only <strong className="font-semibold text-white/70">Gemini</strong> and{" "}
            <strong className="font-semibold text-white/70">HeyGen</strong> need signing up for — see{" "}
            <code>KEYS.md</code> in the project root for the full checklist. Payment keys aren&apos;t used by anything
            yet.
          </span>
        </Banner>
      )}

      {restartNeeded && (
        <Banner tone="warn">
          <strong className="font-bold">Restart needed.</strong> Some saved keys aren&apos;t loaded into the running
          server yet. Stop and restart <code>npm run dev</code> to pick them up.
        </Banner>
      )}

      {notice && <Banner tone={notice.kind === "ok" ? "ok" : "error"}>{notice.text}</Banner>}

      <div className="mt-6 space-y-6">
        {groups.map(([group, items]) => (
          <section key={group} className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="font-display mb-4 text-base font-bold">{group}</h2>
            <div className="space-y-4">
              {items.map((k) => (
                <Field
                  key={k.name}
                  status={k}
                  draft={drafts[k.name]}
                  error={fieldErrors[k.name]}
                  revealed={Boolean(reveal[k.name])}
                  test={tests[k.name]}
                  canWrite={canWrite}
                  testable={Boolean(TESTABLE[k.name])}
                  onChange={(v) => setDrafts((d) => ({ ...d, [k.name]: v }))}
                  onClear={() =>
                    setDrafts((d) => {
                      const next = { ...d };
                      delete next[k.name];
                      return next;
                    })
                  }
                  onToggleReveal={() => setReveal((r) => ({ ...r, [k.name]: !r[k.name] }))}
                  onTest={() => test(k.name)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Field({
  status,
  draft,
  error,
  revealed,
  test,
  canWrite,
  testable,
  onChange,
  onClear,
  onToggleReveal,
  onTest,
}: {
  status: KeyStatus;
  draft: string | undefined;
  error?: string;
  revealed: boolean;
  test: TestState;
  canWrite: boolean;
  testable: boolean;
  onChange: (v: string) => void;
  onClear: () => void;
  onTest: () => void;
  onToggleReveal: () => void;
}) {
  const editing = draft !== undefined;
  const isSecret = status.kind === "secret";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <label htmlFor={`k-${status.name}`} className="text-sm font-semibold text-white/85">
          {status.label}
        </label>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={
            status.set
              ? { background: "rgba(46,204,113,.14)", color: "#2ecc71" }
              : { background: "rgba(255,255,255,.07)", color: "#9a8b8d" }
          }
        >
          {status.set ? "Set" : "Not set"}
        </span>
        {status.needsRestart && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,159,67,.14)", color: "#ffcf9a" }}>
            Restart to apply
          </span>
        )}
      </div>

      <p className="mb-2 text-xs text-white/45">
        {status.purpose}
        {status.source && (
          <>
            {" · "}
            <a href={status.source} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-white/70">
              Get a key
            </a>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex min-w-0 flex-1 items-center rounded-xl pr-2"
          style={{ border: `1px solid ${error ? "#ff3645" : "rgba(255,70,85,.22)"}`, background: "rgba(255,60,75,.04)" }}
        >
          <input
            id={`k-${status.name}`}
            type={isSecret && !revealed ? "password" : "text"}
            value={draft ?? ""}
            disabled={!canWrite}
            autoComplete="off"
            spellCheck={false}
            placeholder={status.set ? (status.preview ?? "") : "Paste value…"}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-w-0 bg-transparent px-3.5 py-2.5 font-mono text-[13px] text-white placeholder-white/30 outline-none disabled:cursor-not-allowed"
          />
          {isSecret && editing && (
            <button
              type="button"
              onClick={onToggleReveal}
              aria-label={revealed ? "Hide value" : "Show value"}
              className="shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white"
            >
              {revealed ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          )}
        </div>

        {editing && (
          <button type="button" onClick={onClear} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
            Cancel
          </button>
        )}

        {testable && status.set && !editing && (
          <button
            type="button"
            onClick={onTest}
            disabled={test === "running"}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            {test === "running" ? "Testing…" : "Test"}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-[#ff8a92]">{error}</p>}

      {editing && !error && (
        <p className="mt-1.5 text-xs text-white/40">
          {draft === "" ? "Saving with an empty value removes this key." : "Not saved yet."}
        </p>
      )}

      {test && test !== "running" && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: test.ok ? "#2ecc71" : "#ff8a92" }}>
          {test.ok ? "✓ " : "✗ "}
          {test.detail}
        </p>
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "info" | "warn" | "ok" | "error"; children: React.ReactNode }) {
  const styles = {
    info: { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)", color: "#cabcbe" },
    warn: { border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" },
    ok: { border: "1px solid rgba(46,204,113,.35)", background: "rgba(46,204,113,.08)", color: "#8ee7b0" },
    error: { border: "1px solid rgba(255,70,85,.4)", background: "rgba(255,60,75,.09)", color: "#ff9aa3" },
  }[tone];

  return (
    <div className="mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed" style={styles}>
      {children}
    </div>
  );
}
