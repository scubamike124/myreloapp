"use client";

import {
  useCallback,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import BusinessShell from "@/components/design/BusinessShell";
import { CONTENT_TEMPLATES, type ProFeature } from "@/lib/pro-features";

// ---------------------------------------------------------------------------
// Business Center Pro — one studio for every live (non-redirect) feature card.
// Talks to /api/pro/run (generation) and /api/pro/ops (workspace/ops).
// ---------------------------------------------------------------------------

const CARD = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" } as const;
const INPUT = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.05)" } as const;
const MUTED = "#a99a9c";
const CTA = { background: "linear-gradient(135deg,#ff3645,#c4101c)" } as const;

const LANGS = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
] as const;

const PLATFORMS = ["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"] as const;
const OFFSETS = [1, 3, 7] as const;
const ROLES = ["editor", "admin", "viewer"] as const;

type RunResult = Record<string, unknown> | null;

function fileToBase64(file: Blob): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result || "");
      const comma = dataUrl.indexOf(",");
      const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      resolve({ base64, mime: file.type || "application/octet-stream" });
    };
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function opsGet(resource: string) {
  const res = await fetch(`/api/pro/ops?resource=${encodeURIComponent(resource)}`);
  return res.json();
}

async function opsPost(body: Record<string, unknown>) {
  const res = await fetch("/api/pro/ops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function runPost(body: Record<string, unknown>) {
  const res = await fetch("/api/pro/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-white/80">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 ${props.className || ""}`}
      style={{ ...INPUT, ...props.style }}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 ${props.className || ""}`}
      style={{ ...INPUT, ...props.style }}
    />
  );
}

function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none ${props.className || ""}`}
      style={{ ...INPUT, ...props.style }}
    />
  );
}

function PrimaryButton({
  children,
  busy,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={busy || disabled}
      onClick={onClick}
      className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
      style={CTA}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
      style={{ color: "#ff8892", border: "1px solid rgba(255,70,85,.28)" }}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-[13px]"
      style={{ border: "1px solid rgba(255,120,80,.35)", background: "rgba(255,80,60,.08)", color: "#ffcf9a" }}
      role="alert"
    >
      {message}
    </div>
  );
}

function SignInGate({ slug }: { slug: string }) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-[14px]" style={{ color: "#ffcf9a" }}>
        <strong className="font-bold">Sign in to use this Pro tool.</strong> Your runs and workspace data are saved to
        your account.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/login?next=${encodeURIComponent(`/business-center/pro/${slug}`)}`}
          className="rounded-lg px-3 py-2 text-[12.5px] font-bold text-white"
          style={CTA}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg px-3 py-2 text-[12.5px] font-semibold"
          style={{ color: "#b9a9ab", border: "1px solid rgba(255,70,85,.2)" }}
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: RunResult }) {
  if (!result) return null;

  const srt = typeof result.srt === "string" ? result.srt : null;
  const plain = typeof result.plain === "string" ? result.plain : null;
  const imageUrl = typeof result.imageUrl === "string" ? result.imageUrl : null;
  const queries = Array.isArray(result.queries) ? (result.queries as string[]) : null;
  const hooks = Array.isArray(result.hooks) ? (result.hooks as string[]) : null;
  const cutList = Array.isArray(result.cutList) ? (result.cutList as Record<string, unknown>[]) : null;
  const tighterCaption = typeof result.tighterCaption === "string" ? result.tighterCaption : null;
  const beats = Array.isArray(result.beats) ? (result.beats as string[]) : null;
  const translated = typeof result.translated === "string" ? result.translated : null;
  const videoId = typeof result.videoId === "string" ? result.videoId : null;
  const status = typeof result.status === "string" ? result.status : null;
  const videoUrl = typeof result.videoUrl === "string" ? result.videoUrl : null;
  const brief = typeof result.brief === "string" ? result.brief : null;
  const fullKey = typeof result.key === "string" ? result.key : typeof result.fullKey === "string" ? result.fullKey : null;

  return (
    <div className="mt-4 space-y-3 rounded-2xl p-4" style={CARD} data-pro-result>
      <div className="font-display text-[12px] font-bold uppercase tracking-wide" style={{ color: "#ff5663" }}>
        Result
      </div>

      {fullKey && (
        <div
          className="rounded-xl px-3 py-2.5 text-[13px]"
          style={{ border: "1px solid rgba(255,70,85,.28)", background: "rgba(255,60,75,.08)", color: "#ffcf9a" }}
        >
          <div className="mb-1 font-semibold">Copy this key now — it won&apos;t be shown again.</div>
          <code className="break-all text-[12px] text-white">{fullKey}</code>
        </div>
      )}

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Generated" className="max-h-[420px] w-full rounded-xl object-contain" />
      )}

      {queries && queries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {queries.map((q) => (
            <span
              key={q}
              className="rounded-md px-2 py-1 text-[11px]"
              style={{ border: "1px solid rgba(255,70,85,.22)", color: "#ff8892", background: "rgba(255,60,75,.06)" }}
            >
              {q}
            </span>
          ))}
        </div>
      )}

      {srt && (
        <div>
          <FieldLabel>SRT</FieldLabel>
          <TextArea value={srt} readOnly rows={10} className="font-mono text-[12px]" />
          <div className="mt-2">
            <GhostButton onClick={() => downloadText("captions.srt", srt, "application/x-subrip")}>
              Download .srt
            </GhostButton>
          </div>
        </div>
      )}

      {plain && (
        <div>
          <FieldLabel>Plain text</FieldLabel>
          <TextArea value={plain} readOnly rows={4} />
        </div>
      )}

      {translated && (
        <div>
          <FieldLabel>Translated script</FieldLabel>
          <TextArea value={translated} readOnly rows={5} />
        </div>
      )}

      {(status || videoId || videoUrl) && (
        <div className="space-y-1 text-[13px]" style={{ color: MUTED }}>
          {status && (
            <div>
              Status: <span className="text-white">{status}</span>
            </div>
          )}
          {videoId && (
            <div>
              Video id: <code className="text-white">{videoId}</code>
            </div>
          )}
          {videoUrl && (
            <a href={videoUrl} className="font-semibold underline underline-offset-2" style={{ color: "#ff8892" }}>
              Open video
            </a>
          )}
        </div>
      )}

      {hooks && hooks.length > 0 && (
        <div>
          <FieldLabel>Hooks</FieldLabel>
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-white/85">
            {hooks.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {cutList && cutList.length > 0 && (
        <div>
          <FieldLabel>Cut list</FieldLabel>
          <ul className="space-y-2">
            {cutList.map((c, i) => (
              <li
                key={i}
                className="rounded-lg px-3 py-2 text-[12.5px]"
                style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.04)" }}
              >
                <div className="font-semibold text-white">
                  {String(c.timecodeHint || c.timecode || `Beat ${i + 1}`)}
                </div>
                <div style={{ color: MUTED }}>{String(c.action || "")}</div>
                {c.reason ? <div className="mt-0.5 text-[12px]" style={{ color: "#8e7f81" }}>{String(c.reason)}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tighterCaption && (
        <div>
          <FieldLabel>Tighter caption</FieldLabel>
          <TextArea value={tighterCaption} readOnly rows={3} />
        </div>
      )}

      {beats && beats.length > 0 && (
        <div>
          <FieldLabel>Beats</FieldLabel>
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-white/85">
            {beats.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {brief && (
        <div>
          <FieldLabel>Brief</FieldLabel>
          <TextArea value={brief} readOnly rows={12} className="whitespace-pre-wrap" />
        </div>
      )}
    </div>
  );
}

function ListCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="font-display mb-3 text-[12px] font-bold uppercase tracking-wide" style={{ color: "#ff5663" }}>
        {title}
      </div>
      {empty ? <p className="text-[13px]" style={{ color: MUTED }}>Nothing here yet.</p> : children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature panels
// ---------------------------------------------------------------------------

function AutoSubtitlesPanel({
  cta,
  busy,
  onRun,
}: {
  cta: string;
  busy: boolean;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor="pro-audio">Audio file</FieldLabel>
        <input
          id="pro-audio"
          type="file"
          accept="audio/*"
          className="w-full text-[13px] text-white/80 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-[12.5px] file:font-bold file:text-white"
          style={{ color: MUTED }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      <PrimaryButton
        busy={busy}
        disabled={!file}
        onClick={async () => {
          if (!file) return;
          const { base64, mime } = await fileToBase64(file);
          await onRun({ action: "auto-subtitles", audioBase64: base64, audioMimeType: mime });
        }}
      >
        {cta}
      </PrimaryButton>
    </div>
  );
}

function ImageActionPanel({
  action,
  cta,
  busy,
  withPrompt,
  onRun,
}: {
  action: string;
  cta: string;
  busy: boolean;
  withPrompt?: boolean;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor={`pro-img-${action}`}>Image</FieldLabel>
        <input
          id={`pro-img-${action}`}
          type="file"
          accept="image/*"
          className="w-full text-[13px] text-white/80 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-[12.5px] file:font-bold file:text-white"
          style={{ color: MUTED }}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      {withPrompt && (
        <div>
          <FieldLabel htmlFor="pro-thumb-prompt">Prompt (optional)</FieldLabel>
          <TextInput
            id="pro-thumb-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Bold CTR thumbnail for a fitness reel…"
          />
        </div>
      )}
      <PrimaryButton
        busy={busy}
        disabled={!file && !(withPrompt && prompt.trim())}
        onClick={async () => {
          const body: Record<string, unknown> = { action };
          if (prompt.trim()) body.prompt = prompt.trim();
          if (file) {
            const { base64, mime } = await fileToBase64(file);
            body.imageBase64 = base64;
            body.mimeType = mime;
          }
          await onRun(body);
        }}
      >
        {cta}
      </PrimaryButton>
    </div>
  );
}

function PromptPanel({
  action,
  cta,
  busy,
  placeholder,
  onRun,
}: {
  action: string;
  cta: string;
  busy: boolean;
  placeholder: string;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const multiline = action === "smart-cut";
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor={`pro-prompt-${action}`}>Prompt</FieldLabel>
        {multiline ? (
          <TextArea
            id={`pro-prompt-${action}`}
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <TextInput
            id={`pro-prompt-${action}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
      <PrimaryButton
        busy={busy}
        disabled={!prompt.trim()}
        onClick={() => onRun({ action, prompt: prompt.trim() })}
      >
        {cta}
      </PrimaryButton>
    </div>
  );
}

function VoiceClonePanel({
  cta,
  busy,
  onRun,
}: {
  cta: string;
  busy: boolean;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
        Uses a studio AI voice matched to your script — not a personal voice DNA clone.
      </p>
      <div>
        <FieldLabel htmlFor="pro-voice-script">Script</FieldLabel>
        <TextArea
          id="pro-voice-script"
          rows={5}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="What should the presenter say?"
        />
      </div>
      <div>
        <FieldLabel htmlFor="pro-voice-id">Voice id (optional)</FieldLabel>
        <TextInput
          id="pro-voice-id"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          placeholder="leave blank for default AI voice"
        />
      </div>
      <PrimaryButton
        busy={busy}
        disabled={!script.trim()}
        onClick={() =>
          onRun({
            action: "voice-clone",
            script: script.trim(),
            ...(voiceId.trim() ? { voiceId: voiceId.trim() } : {}),
          })
        }
      >
        {cta}
      </PrimaryButton>
    </div>
  );
}

function TranslateDubPanel({
  cta,
  busy,
  onRun,
}: {
  cta: string;
  busy: boolean;
  onRun: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [script, setScript] = useState("");
  const [language, setLanguage] = useState("es");
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor="pro-dub-script">Script</FieldLabel>
        <TextArea
          id="pro-dub-script"
          rows={5}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="English script to translate and dub…"
        />
      </div>
      <div>
        <FieldLabel htmlFor="pro-dub-lang">Language</FieldLabel>
        <SelectInput id="pro-dub-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </SelectInput>
      </div>
      <PrimaryButton
        busy={busy}
        disabled={!script.trim()}
        onClick={() => onRun({ action: "translate-dub", script: script.trim(), language })}
      >
        {cta}
      </PrimaryButton>
    </div>
  );
}

function TemplatesPanel() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {CONTENT_TEMPLATES.map((t) => (
        <Link
          key={t.id}
          href={`/create/shorts-20?topic=${encodeURIComponent(t.prompt)}`}
          className="rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:border-[rgba(255,70,85,.45)]"
          style={CARD}
        >
          <div className="font-display text-[13px] font-bold uppercase tracking-wide">{t.name}</div>
          <div className="mt-1 text-[11px] font-semibold" style={{ color: "#ff5663" }}>
            {t.niche}
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px]" style={{ color: MUTED }}>
            {t.prompt}
          </p>
        </Link>
      ))}
    </div>
  );
}

function TeamPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("editor");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("team");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-team-email">Email</FieldLabel>
          <TextInput
            id="pro-team-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="editor@studio.com"
          />
        </div>
        <div>
          <FieldLabel htmlFor="pro-team-role">Role</FieldLabel>
          <SelectInput
            id="pro-team-role"
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectInput>
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!email.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { res, data } = await opsPost({
                resource: "team",
                op: "invite",
                email: email.trim(),
                role,
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Invite failed.");
                return;
              }
              setEmail("");
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Team" empty={items.length === 0}>
        <ul className="divide-y" style={{ borderColor: "rgba(255,70,85,.10)" }}>
          {items.map((m) => (
            <li key={String(m.id)} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <div className="font-semibold text-white">{String(m.email || "")}</div>
                <div style={{ color: MUTED }}>
                  {String(m.role || "")} · {String(m.status || "")}
                </div>
              </div>
              <GhostButton
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    const { res, data } = await opsPost({ resource: "team", op: "delete", id: m.id });
                    if (!res.ok || data.ok === false) setErr(data.error || "Remove failed.");
                    else await load();
                  } catch {
                    setErr("Network error.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove
              </GhostButton>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function RepostingPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["youtube", "tiktok"]);
  const [offsets, setOffsets] = useState<number[]>([1, 3, 7]);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("schedule");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-repost-title">Title</FieldLabel>
          <TextInput id="pro-repost-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="pro-repost-caption">Caption</FieldLabel>
          <TextArea id="pro-repost-caption" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Platforms</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-[12.5px] text-white/80">
                <input
                  type="checkbox"
                  checked={platforms.includes(p)}
                  onChange={() =>
                    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
                  }
                />
                {p}
              </label>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Schedule offsets (days)</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {OFFSETS.map((o) => (
              <label key={o} className="flex items-center gap-1.5 text-[12.5px] text-white/80">
                <input
                  type="checkbox"
                  checked={offsets.includes(o)}
                  onChange={() =>
                    setOffsets((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))
                  }
                />
                +{o}d
              </label>
            ))}
          </div>
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!title.trim() || platforms.length === 0 || offsets.length === 0}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { res, data } = await opsPost({
                resource: "schedule",
                op: "repost",
                title: title.trim(),
                caption: caption.trim(),
                platforms,
                offsets: offsets.length ? offsets : [1, 3, 7],
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not schedule reposts.");
                return;
              }
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Upcoming schedule" empty={items.length === 0}>
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={String(s.id)}
              className="rounded-lg px-3 py-2 text-[12.5px]"
              style={{ border: "1px solid rgba(255,70,85,.14)" }}
            >
              <div className="font-semibold text-white">{String(s.title || "Untitled")}</div>
              <div style={{ color: MUTED }}>
                {String(s.platforms || "")} · {String(s.scheduled_at || s.scheduledAt || "")}
              </div>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function CompetitorsPanel({
  cta,
  busy,
  setBusy,
  setErr,
  setResult,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
  setResult: (r: RunResult) => void;
}) {
  const [handle, setHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("competitors");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-comp-handle">Handle</FieldLabel>
          <TextInput
            id="pro-comp-handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@competitor"
          />
        </div>
        <div>
          <FieldLabel htmlFor="pro-comp-niche">Niche</FieldLabel>
          <TextInput
            id="pro-comp-niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Local fitness coaches"
          />
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!handle.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            setResult(null);
            try {
              const { res, data } = await opsPost({
                resource: "competitors",
                op: "run",
                handle: handle.trim(),
                niche: niche.trim(),
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Brief failed.");
                return;
              }
              if (data.brief) setResult({ brief: data.brief });
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Past briefs" empty={items.length === 0}>
        <ul className="space-y-2">
          {items.map((b) => (
            <li
              key={String(b.id)}
              className="rounded-lg px-3 py-2 text-[12.5px]"
              style={{ border: "1px solid rgba(255,70,85,.14)" }}
            >
              <div className="font-semibold text-white">{String(b.handle || "")}</div>
              <div style={{ color: MUTED }}>{String(b.niche || "")}</div>
              <p className="mt-1 line-clamp-3 text-[12px] text-white/75">{String(b.brief || "")}</p>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function LeadsPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [source, setSource] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("leads");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pro-lead-name">Name</FieldLabel>
            <TextInput id="pro-lead-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="pro-lead-email">Email</FieldLabel>
            <TextInput id="pro-lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="pro-lead-phone">Phone</FieldLabel>
            <TextInput id="pro-lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="pro-lead-source">Source</FieldLabel>
            <TextInput id="pro-lead-source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="pro-lead-note">Note</FieldLabel>
          <TextArea id="pro-lead-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!email.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { res, data } = await opsPost({
                resource: "leads",
                op: "create",
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                note: note.trim() || undefined,
                source: source.trim() || undefined,
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not add lead.");
                return;
              }
              setName("");
              setEmail("");
              setPhone("");
              setNote("");
              setSource("");
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Leads" empty={items.length === 0}>
        <ul className="divide-y" style={{ borderColor: "rgba(255,70,85,.10)" }}>
          {items.map((l) => (
            <li key={String(l.id)} className="flex items-start justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <div className="font-semibold text-white">{String(l.name || l.email || "")}</div>
                <div style={{ color: MUTED }}>
                  {String(l.email || "")}
                  {l.phone ? ` · ${String(l.phone)}` : ""}
                </div>
                {l.note ? <p className="mt-0.5 text-[12px] text-white/70">{String(l.note)}</p> : null}
              </div>
              <GhostButton
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    const { res, data } = await opsPost({ resource: "leads", op: "delete", id: l.id });
                    if (!res.ok || data.ok === false) setErr(data.error || "Delete failed.");
                    else await load();
                  } catch {
                    setErr("Network error.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete
              </GhostButton>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function ApiAccessPanel({
  cta,
  busy,
  setBusy,
  setErr,
  setResult,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
  setResult: (r: RunResult) => void;
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("api-keys");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-key-name">Key name</FieldLabel>
          <TextInput
            id="pro-key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Publishing webhook"
          />
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!name.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            setResult(null);
            try {
              const { res, data } = await opsPost({ resource: "api-keys", op: "create", name: name.trim() });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not create key.");
                return;
              }
              const key = data.key || data.fullKey || data.apiKey;
              if (key) setResult({ key: String(key) });
              setName("");
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="API keys" empty={items.length === 0}>
        <ul className="divide-y" style={{ borderColor: "rgba(255,70,85,.10)" }}>
          {items.map((k) => (
            <li key={String(k.id)} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <div className="font-semibold text-white">{String(k.name || "")}</div>
                <div style={{ color: MUTED }}>
                  <code>{String(k.key_prefix || k.keyPrefix || "reelo_…")}</code>
                  {k.revoked ? " · revoked" : ""}
                </div>
              </div>
              {!k.revoked && (
                <GhostButton
                  onClick={async () => {
                    setBusy(true);
                    setErr(null);
                    try {
                      const { res, data } = await opsPost({ resource: "api-keys", op: "revoke", id: k.id });
                      if (!res.ok || data.ok === false) setErr(data.error || "Revoke failed.");
                      else await load();
                    } catch {
                      setErr("Network error.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Revoke
                </GhostButton>
              )}
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function WebhooksPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("webhooks");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-hook-url">Webhook URL</FieldLabel>
          <TextInput
            id="pro-hook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/hooks/reelo"
          />
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!url.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { res, data } = await opsPost({ resource: "webhooks", op: "create", url: url.trim() });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not save webhook.");
                return;
              }
              setUrl("");
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Webhooks" empty={items.length === 0}>
        <ul className="divide-y" style={{ borderColor: "rgba(255,70,85,.10)" }}>
          {items.map((w) => (
            <li key={String(w.id)} className="flex items-start justify-between gap-2 py-2.5 text-[13px]">
              <div className="min-w-0 break-all">
                <div className="font-semibold text-white">{String(w.url || "")}</div>
                <div style={{ color: MUTED }}>
                  {w.active === 0 || w.active === false ? "inactive" : "active"}
                  {w.last_ping_at || w.lastPingAt ? ` · last ping ${String(w.last_ping_at || w.lastPingAt)}` : ""}
                </div>
              </div>
              <GhostButton
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    const { res, data } = await opsPost({ resource: "webhooks", op: "delete", id: w.id });
                    if (!res.ok || data.ok === false) setErr(data.error || "Delete failed.");
                    else await load();
                  } catch {
                    setErr("Network error.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete
              </GhostButton>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

function WhiteLabelPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ff2d3f");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await opsGet("settings");
        const wl = data.settings?.white_label_json || data.settings?.whiteLabel || data.white_label_json;
        const parsed = typeof wl === "string" ? JSON.parse(wl || "{}") : wl || {};
        if (parsed.brandName) setBrandName(String(parsed.brandName));
        if (parsed.primaryColor) setPrimaryColor(String(parsed.primaryColor));
      } catch {
        // ignore parse / network on first load
      }
    })();
  }, []);

  return (
    <div className="space-y-3 rounded-2xl p-4" style={CARD}>
      <p className="text-[12.5px]" style={{ color: MUTED }}>
        Logo uses Brand Kit.{" "}
        <Link href="/business-center/brand-kit" className="font-semibold underline underline-offset-2" style={{ color: "#ff8892" }}>
          Open Brand Kit
        </Link>
      </p>
      <div>
        <FieldLabel htmlFor="pro-wl-name">Brand name</FieldLabel>
        <TextInput id="pro-wl-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
      </div>
      <div>
        <FieldLabel htmlFor="pro-wl-color">Primary color</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            id="pro-wl-color"
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "#ff2d3f"}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
          />
          <TextInput
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#ff2d3f"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <PrimaryButton
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            setSaved("");
            try {
              const { res, data } = await opsPost({
                resource: "settings",
                op: "update",
                white_label_json: { brandName: brandName.trim(), primaryColor: primaryColor.trim() },
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not save.");
                return;
              }
              setSaved("Saved");
              setTimeout(() => setSaved(""), 2500);
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
        {saved && <span className="text-[12.5px]" style={{ color: "#ff8892" }}>{saved}</span>}
      </div>
    </div>
  );
}

function PriorityPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [priority, setPriority] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await opsGet("settings");
        const v = data.settings?.priority_speed ?? data.priority_speed;
        if (v !== undefined && v !== null) setPriority(Number(v) !== 0);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="space-y-3 rounded-2xl p-4" style={CARD}>
      <label className="flex items-center gap-3 text-[14px] text-white/90">
        <input
          type="checkbox"
          checked={priority}
          onChange={(e) => setPriority(e.target.checked)}
          className="h-4 w-4"
        />
        Prefer priority / faster rendering when routing jobs
      </label>
      <div className="flex items-center gap-3">
        <PrimaryButton
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            setSaved("");
            try {
              const { res, data } = await opsPost({
                resource: "settings",
                op: "update",
                priority_speed: priority ? 1 : 0,
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not save.");
                return;
              }
              setSaved("Saved");
              setTimeout(() => setSaved(""), 2500);
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
        {saved && <span className="text-[12.5px]" style={{ color: "#ff8892" }}>{saved}</span>}
      </div>
    </div>
  );
}

function AccountManagerPanel({
  cta,
  busy,
  setBusy,
  setErr,
}: {
  cta: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const data = await opsGet("support");
    setItems(Array.isArray(data.items) ? data.items : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl p-4" style={CARD}>
        <div>
          <FieldLabel htmlFor="pro-am-topic">Topic</FieldLabel>
          <TextInput
            id="pro-am-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Billing, onboarding, feature help…"
          />
        </div>
        <div>
          <FieldLabel htmlFor="pro-am-msg">Message</FieldLabel>
          <TextArea
            id="pro-am-msg"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you need — we email you back."
          />
        </div>
        <PrimaryButton
          busy={busy}
          disabled={!topic.trim() || !message.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const { res, data } = await opsPost({
                resource: "support",
                op: "create",
                topic: topic.trim(),
                message: message.trim(),
              });
              if (!res.ok || data.ok === false) {
                setErr(data.error || "Could not send.");
                return;
              }
              setTopic("");
              setMessage("");
              await load();
            } catch {
              setErr("Network error.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {cta}
        </PrimaryButton>
      </div>
      <ListCard title="Past tickets" empty={items.length === 0}>
        <ul className="space-y-2">
          {items.map((t) => (
            <li
              key={String(t.id)}
              className="rounded-lg px-3 py-2 text-[12.5px]"
              style={{ border: "1px solid rgba(255,70,85,.14)" }}
            >
              <div className="font-semibold text-white">{String(t.topic || "")}</div>
              <div style={{ color: MUTED }}>{String(t.status || "open")}</div>
              <p className="mt-1 line-clamp-3 text-[12px] text-white/75">{String(t.message || "")}</p>
            </li>
          ))}
        </ul>
      </ListCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root studio
// ---------------------------------------------------------------------------

export default function ProFeatureStudio({ feature }: { feature: ProFeature }) {
  const slug = feature.slug;
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await opsGet("settings");
        if (cancelled) return;
        setSignedIn(Boolean(data.signedIn));
      } catch {
        if (!cancelled) setSignedIn(false);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRun = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const { res, data } = await runPost(body);
      if (res.status === 401 || data.signedIn === false) {
        setSignedIn(false);
        setErr("Sign in required.");
        return;
      }
      if (!res.ok || data.ok === false) {
        setErr(data.error || `Request failed (${res.status}).`);
        return;
      }
      setResult(data as Record<string, unknown>);
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const showGate = authReady && !signedIn && feature.slug !== "templates";

  let body: ReactNode = null;
  if (!authReady) {
    body = <p className="text-[13px]" style={{ color: MUTED }}>Loading…</p>;
  } else if (showGate) {
    body = <SignInGate slug={slug} />;
  } else {
    switch (slug) {
      case "auto-subtitles":
        body = <AutoSubtitlesPanel cta={feature.cta} busy={busy} onRun={onRun} />;
        break;
      case "thumbnail-maker":
        body = <ImageActionPanel action="thumbnail" cta={feature.cta} busy={busy} withPrompt onRun={onRun} />;
        break;
      case "background-remover":
        body = <ImageActionPanel action="background-remove" cta={feature.cta} busy={busy} onRun={onRun} />;
        break;
      case "stock-media":
        body = (
          <PromptPanel
            action="stock"
            cta={feature.cta}
            busy={busy}
            placeholder="Premium coffee shop interior, natural light…"
            onRun={onRun}
          />
        );
        break;
      case "smart-cut":
        body = (
          <PromptPanel
            action="smart-cut"
            cta={feature.cta}
            busy={busy}
            placeholder="Describe the raw footage or paste the script…"
            onRun={onRun}
          />
        );
        break;
      case "voice-cloning":
        body = <VoiceClonePanel cta={feature.cta} busy={busy} onRun={onRun} />;
        break;
      case "translate-dub":
        body = <TranslateDubPanel cta={feature.cta} busy={busy} onRun={onRun} />;
        break;
      case "templates":
        body = <TemplatesPanel />;
        break;
      case "team":
        body = <TeamPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "reposting":
        body = <RepostingPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "competitors":
        body = (
          <CompetitorsPanel
            cta={feature.cta}
            busy={busy}
            setBusy={setBusy}
            setErr={setErr}
            setResult={setResult}
          />
        );
        break;
      case "leads":
        body = <LeadsPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "api-access":
        body = (
          <ApiAccessPanel
            cta={feature.cta}
            busy={busy}
            setBusy={setBusy}
            setErr={setErr}
            setResult={setResult}
          />
        );
        break;
      case "webhooks":
        body = <WebhooksPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "white-label":
        body = <WhiteLabelPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "priority":
        body = <PriorityPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      case "account-manager":
        body = <AccountManagerPanel cta={feature.cta} busy={busy} setBusy={setBusy} setErr={setErr} />;
        break;
      default:
        body = (
          <div className="rounded-2xl p-4 text-[13px]" style={{ ...CARD, color: MUTED }}>
            No studio UI for this feature.
          </div>
        );
    }
  }

  return (
    <BusinessShell active="hubpro" variant="pro">
      <div data-pro-feature={slug} className="mx-auto max-w-3xl">
        <div className="mb-5">
          <Link
            href="/business-center/pro"
            className="mb-3 inline-block text-[12.5px] font-semibold"
            style={{ color: "#ff8892" }}
          >
            ← Hub Pro
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{feature.title}</h1>
          <p className="mt-1.5 text-[14.5px]" style={{ color: MUTED }}>
            {feature.blurb}
          </p>
        </div>

        <div className="space-y-3">
          <ErrorBanner message={err} />
          {body}
          <ResultPanel result={result} />
        </div>
      </div>
    </BusinessShell>
  );
}
