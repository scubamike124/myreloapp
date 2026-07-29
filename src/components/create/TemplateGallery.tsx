"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ReeloVideoTemplate } from "@/lib/reelo-templates";

type Filters = {
  industries: string[];
  goals: string[];
  platforms: string[];
  styles: string[];
  lengths: number[];
};

type PlanResult = {
  script: string;
  handoffUrl: string;
  avatarId: string;
  videoType: string;
  durationSec: number;
  publishAuthorized: false;
  note: string;
  template: ReeloVideoTemplate;
};

const inputStyle = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
} as const;

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors"
      style={
        on
          ? { color: "#0a0607", background: "linear-gradient(135deg,#f5d78e,#c9a227)" }
          : { color: "rgba(255,255,255,.65)", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)" }
      }
    >
      {label}
    </button>
  );
}

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<ReeloVideoTemplate[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [style, setStyle] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReeloVideoTemplate | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [productOrService, setProductOrService] = useState("");
  const [website, setWebsite] = useState("");
  const [cta, setCta] = useState("Start free today");
  const [audience, setAudience] = useState("");
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [planErr, setPlanErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (industry) params.set("industry", industry);
      if (goal) params.set("goal", goal);
      if (platform) params.set("platform", platform);
      if (style) params.set("style", style);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/video-templates?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      setTemplates(data.templates || []);
      setFilters(data.filters || null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [industry, goal, platform, style, q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 180);
    return () => clearTimeout(t);
  }, [load]);

  const storyboardLabels = useMemo(() => {
    if (!selected) return [];
    return selected.sceneBlueprint.map((s) => s.role);
  }, [selected]);

  const buildPlan = async () => {
    if (!selected) return;
    setPlanning(true);
    setPlanErr(null);
    setPlan(null);
    try {
      const res = await fetch("/api/video-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selected.id,
          businessName,
          productOrService,
          website: website || undefined,
          cta,
          audience,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not build plan");
      setPlan(data as PlanResult);
    } catch (e) {
      setPlanErr(e instanceof Error ? e.message : "Plan failed");
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] px-4 pb-20 pt-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/create" className="text-sm font-semibold text-white/50 hover:text-white">
          ← Create
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/90">
          Production templates · VQOS gated
        </p>
      </div>

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Template library
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">
          Pick a polished template. Add your business details. Reelo writes the script, scene plan, and
          avatar choice — then opens the right studio. Every render still passes Video Quality gates
          before publish.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search templates…"
          className="min-w-[180px] flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
          style={inputStyle}
        />
      </div>

      {filters && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip label="All industries" on={!industry} onClick={() => setIndustry("")} />
            {filters.industries.slice(0, 12).map((i) => (
              <Chip key={i} label={i} on={industry === i} onClick={() => setIndustry(industry === i ? "" : i)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip label="All goals" on={!goal} onClick={() => setGoal("")} />
            {filters.goals.map((g) => (
              <Chip key={g} label={g} on={goal === g} onClick={() => setGoal(goal === g ? "" : g)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip label="All platforms" on={!platform} onClick={() => setPlatform("")} />
            {filters.platforms.map((p) => (
              <Chip key={p} label={p} on={platform === p} onClick={() => setPlatform(platform === p ? "" : p)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip label="All styles" on={!style} onClick={() => setStyle("")} />
            {filters.styles.slice(0, 14).map((s) => (
              <Chip key={s} label={s} on={style === s} onClick={() => setStyle(style === s ? "" : s)} />
            ))}
          </div>
        </div>
      )}

      {err && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
          ))}
        {!loading &&
          templates.map((t) => {
            const on = selected?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelected(t);
                  setPlan(null);
                  setPlanErr(null);
                }}
                className="rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  border: on ? "1px solid rgba(245,215,142,.55)" : "1px solid rgba(255,255,255,.1)",
                  background: on
                    ? "linear-gradient(160deg,rgba(245,215,142,.12),rgba(8,4,6,.9))"
                    : "linear-gradient(160deg,rgba(255,255,255,.05),rgba(8,4,6,.85))",
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    {t.category} · {t.lengthsSec[0]}s · {t.defaultAspect}
                  </span>
                  {t.previewKind === "annie-rank1" && (
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                      Sample ready
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight">{t.name}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{t.tagline}</p>
                <p className="mt-3 text-[10px] uppercase tracking-wide text-white/35">
                  {t.industries.slice(0, 3).join(" · ")}
                </p>
                  {t.previewKind === "annie-rank1" ? (
                    <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/templates/product-demo-preview.jpg"
                        alt=""
                        className="aspect-[16/10] w-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-1">
                      {t.sceneBlueprint.slice(0, 5).map((s) => (
                        <div
                          key={s.id}
                          className="h-8 flex-1 rounded-md bg-gradient-to-b from-white/10 to-white/5"
                          title={s.role}
                        />
                      ))}
                    </div>
                  )}
              </button>
            );
          })}
      </div>

      {!loading && templates.length === 0 && (
        <p className="py-12 text-center text-sm text-white/45">No templates match those filters.</p>
      )}

      {selected && (
        <section
          className="mt-10 rounded-3xl p-5 sm:p-7"
          style={{
            border: "1px solid rgba(245,215,142,.25)",
            background: "linear-gradient(165deg,rgba(20,12,14,.95),rgba(6,4,8,.98))",
          }}
        >
          <h2 className="font-display text-2xl font-bold">{selected.name}</h2>
          <p className="mt-1 text-sm text-white/55">{selected.tagline}</p>

          {selected.previewKind === "annie-rank1" && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/25 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/product-demo-preview.jpg"
                alt="Annie Rank-1 Product Demo sample frame"
                className="aspect-[9/16] max-h-[360px] w-full object-cover object-top sm:max-h-[420px]"
              />
              <p className="px-3 py-2 text-xs text-emerald-100/90">
                Sample ready: Annie Rank-1 Product Demo (VQOS-authorized). Full MP4 lives in Amber review —
                no new paid render required to preview this template.
              </p>
            </div>
          )}

          {selected.previewKind === "storyboard" && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Scene storyboard preview
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {storyboardLabels.map((role, i) => (
                  <div
                    key={`${role}-${i}`}
                    className="rounded-xl px-2 py-4 text-center"
                    style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}
                  >
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/30 to-red-600/20" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-white/70">
              Business name
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                placeholder="Acme Co"
              />
            </label>
            <label className="block text-xs font-semibold text-white/70">
              Product or service
              <input
                value={productOrService}
                onChange={(e) => setProductOrService(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                placeholder="AI video ads"
              />
            </label>
            <label className="block text-xs font-semibold text-white/70">
              Website (optional)
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                placeholder="https://…"
              />
            </label>
            <label className="block text-xs font-semibold text-white/70">
              Target audience
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                placeholder="Busy founders"
              />
            </label>
            <label className="block text-xs font-semibold text-white/70 sm:col-span-2">
              Call to action
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={inputStyle}
                placeholder="Book a demo"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={planning}
            onClick={() => void buildPlan()}
            className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-[#0a0607] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#f5d78e,#c9a227)" }}
          >
            {planning ? "Building plan…" : "Generate script & open studio"}
          </button>

          {planErr && (
            <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {planErr}
            </p>
          )}

          {plan && (
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Script · {plan.videoType} · {plan.durationSec}s · publishAuthorized: false
              </p>
              <textarea
                readOnly
                value={plan.script}
                rows={4}
                className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white/90 outline-none"
                style={inputStyle}
              />
              <p className="text-xs text-white/45">{plan.note}</p>
              <Link
                href={plan.handoffUrl}
                className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Continue in studio →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
