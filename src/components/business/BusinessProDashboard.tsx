"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import BIcon, { type IconKey } from "@/components/design/BIcon";
import { TOOLS, LIVE_TOOLS } from "@/lib/tools";

export type ProStat = { value: string; label: string };
export type ProActivity = {
  id: string;
  title: string;
  toolTitle: string;
  status: string;
  kind: string;
  createdAt: string;
};

type Tab = "overview" | "profile" | "tools" | "assist" | "content" | "reports";

const TABS: { id: Tab; label: string; icon: IconKey }[] = [
  { id: "overview", label: "Dashboard", icon: "home" },
  { id: "profile", label: "Business profile", icon: "contact" },
  { id: "tools", label: "Pro tools", icon: "chip" },
  { id: "assist", label: "AI assist", icon: "brain" },
  { id: "content", label: "Content hub", icon: "film" },
  { id: "reports", label: "Reports", icon: "chart" },
];

const PROFILE_KEY = "reelo.pro.business-profile.v1";

type BusinessProfile = {
  company: string;
  industry: string;
  website: string;
  videosPerDay: number;
  contact: string;
  voice: string;
  notes: string;
};

const DEFAULT_PROFILE: BusinessProfile = {
  company: "",
  industry: "Creator / Brand",
  website: "",
  videosPerDay: 1,
  contact: "",
  voice: "Bold & clear",
  notes: "",
};

/** Pro tools that ship today — every CTA opens a live studio. */
const PRO_TOOL_SLUGS = [
  "thumbnail-maker",
  "background-remover",
  "auto-subtitles",
  "shorts-20",
  "ai-avatar-studio",
  "product-commercial",
  "website-commercial",
  "talking-photo",
  "dancing-photo",
  "custom-avatar-creator",
  "bedtime-storybook",
  "story-memory-generator",
] as const;

const QUICK: { icon: IconKey; label: string; href: string; hint: string }[] = [
  { icon: "image", label: "Thumbnail", href: "/create/thumbnail-maker", hint: "Click magnets" },
  { icon: "magic", label: "Remove BG", href: "/create/background-remover", hint: "Cutout ready" },
  { icon: "cc", label: "Subtitles", href: "/create/auto-subtitles", hint: "SRT / VTT" },
  { icon: "pen", label: "Scripts", href: "/create/shorts-20", hint: "Hooks + captions" },
  { icon: "users", label: "Avatar", href: "/create/ai-avatar-studio", hint: "Talking talent" },
  { icon: "rocket", label: "Product ad", href: "/create/product-commercial", hint: "Sell the shot" },
];

const ASSISTS: { title: string; prompt: string; href: string }[] = [
  {
    title: "Week of Shorts",
    prompt: "Plan 7 punchy short-form scripts for my brand this week.",
    href: "/create/shorts-20",
  },
  {
    title: "Thumbnail pack",
    prompt: "Make a bold YouTube thumbnail for my latest tip video.",
    href: "/create/thumbnail-maker",
  },
  {
    title: "Caption + SRT",
    prompt: "Turn this spoken script into timed subtitles.",
    href: "/create/auto-subtitles",
  },
  {
    title: "Product commercial",
    prompt: "Animate my product photo into a 15s ad.",
    href: "/create/product-commercial",
  },
];

function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 ${className}`}
      style={{ border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.55),rgba(10,5,7,.55))" }}
    >
      {children}
    </div>
  );
}

export default function BusinessProDashboard({
  stats,
  recent,
  signedIn,
  personal,
  userName,
  userEmail,
  role,
}: {
  stats: ProStat[];
  recent: ProActivity[];
  signedIn: boolean;
  personal: boolean;
  userName: string;
  userEmail: string;
  /** Owner/admin recognition must be visible, not just the signed-in name. */
  role?: "USER" | "ADMIN" | "OWNER" | null;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const tabParamRaw = search.get("tab") || "overview";
  const tabParam = (TABS.some((t) => t.id === tabParamRaw) ? tabParamRaw : "overview") as Tab;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? tabParam : "overview";

  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [assistNote, setAssistNote] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const liveTools = useMemo(
    () =>
      PRO_TOOL_SLUGS.map((slug) => TOOLS.find((t) => t.slug === slug)).filter(
        (t): t is (typeof TOOLS)[number] => Boolean(t) && LIVE_TOOLS.has(t!.slug),
      ),
    [],
  );

  const setTab = (id: Tab) => {
    const q = id === "overview" ? "/business-center/pro" : `/business-center/pro?tab=${id}`;
    router.push(q);
  };

  const saveProfile = async () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    const videosPerDay = Math.min(20, Math.max(0, Math.round(Number(profile.videosPerDay)) || 1));
    const website = profile.website.trim();
    let existingIntel: Record<string, unknown> = {};
    try {
      const existing = await fetch("/api/business-profile");
      const data = await existing.json();
      if (data?.profile?.intelligence && typeof data.profile.intelligence === "object") {
        existingIntel = data.profile.intelligence as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
    const priorSites = Array.isArray(existingIntel.websites) ? existingIntel.websites : [];
    const websites = website
      ? [
          {
            url: website.startsWith("http") ? website : `https://${website}`,
            videosPerDay,
            label: "Primary",
          },
          ...priorSites
            .filter((row) => {
              const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
              const u = String(r.url || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
              const cur = website.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
              return u && u !== cur;
            })
            .map((row) => {
              const r = row as Record<string, unknown>;
              return {
                url: String(r.url || ""),
                videosPerDay: Number(r.videosPerDay ?? 1),
                label: r.label ? String(r.label) : undefined,
              };
            }),
        ]
      : priorSites;
    void fetch("/api/business-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: profile.company,
        industry: profile.industry,
        audience: profile.notes,
        style: profile.voice,
        goals: website,
        intelligence: { ...existingIntel, websites },
        approvalMode: "require",
        onboardingComplete: true,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const companyLabel = profile.company.trim() || userName || "Your business";

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-5 sm:px-7 sm:py-6"
        style={{
          border: "1px solid rgba(255,70,85,.28)",
          background:
            "radial-gradient(900px 280px at 12% -10%,rgba(225,29,42,.38),transparent 55%),radial-gradient(700px 240px at 90% 0%,rgba(255,80,90,.12),transparent 50%),rgba(12,6,8,.75)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "#ff5663" }}>
              Business Center Pro
            </p>
            <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {companyLabel}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm" style={{ color: "#cabcbe" }}>
              Run creation, brand assets, and workspace reporting from one Pro desk.
              Every control here opens a live workflow — nothing routes to a roadmap dead-end.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/create"
                className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Open Create Studio
              </Link>
              <button
                type="button"
                onClick={() => setTab("tools")}
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid rgba(255,70,85,.35)", color: "#f3e9e9" }}
              >
                Browse Pro tools
              </button>
              <Link
                href="/account"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid rgba(255,70,85,.22)", color: "#b9a9ab" }}
              >
                Account & tokens
              </Link>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3 text-right" style={{ border: "1px solid rgba(255,70,85,.25)", background: "rgba(0,0,0,.35)" }}>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "#8e7f81" }}>Signed in</div>
            <div className="flex items-center justify-end gap-1.5">
              <div className="font-display text-lg font-bold">{signedIn ? userName || "Member" : "Guest"}</div>
              {signedIn && (role === "OWNER" || role === "ADMIN") && (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                >
                  {role}
                </span>
              )}
            </div>
            <div className="text-xs" style={{ color: "#ff8a92" }}>{signedIn ? userEmail || "Session active" : "Sign in for personal stats"}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Panel key={s.label} className="!p-3.5">
            <div className="font-display text-2xl font-bold leading-none">{s.value}</div>
            <div className="mt-1 text-[11px]" style={{ color: "#8e7f81" }}>{s.label}</div>
          </Panel>
        ))}
      </div>
      {!personal && (
        <p className="text-sm" style={{ color: "#a99a9c" }}>
          {signedIn
            ? "Workspace figures appear after you generate content."
            : (
              <>
                <Link href="/login" className="font-semibold underline underline-offset-2" style={{ color: "#ff8a92" }}>Sign in</Link>
                {" "}to load your Pro workspace numbers.
              </>
            )}
        </p>
      )}

      {/* Section nav */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl p-1.5" style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(14,6,8,.5)" }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors"
              style={on
                ? { color: "#fff", background: "linear-gradient(135deg,rgba(255,54,69,.35),rgba(196,16,28,.22))", border: "1px solid rgba(255,70,85,.45)" }
                : { color: "#b9a9ab" }}
            >
              <BIcon name={t.icon} size={15} color={on ? "#ff5663" : "#9a8b8d"} glow={on} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel>
            <h2 className="font-display text-lg font-bold">Quick launch</h2>
            <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>Jump straight into a live Pro workflow.</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {QUICK.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="rounded-xl p-3 transition-transform hover:-translate-y-0.5"
                  style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.04)" }}
                >
                  <BIcon name={q.icon} size={22} />
                  <div className="mt-2 text-sm font-bold">{q.label}</div>
                  <div className="text-[11px]" style={{ color: "#8e7f81" }}>{q.hint}</div>
                </Link>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Recent work</h2>
              <Link href="/library" className="text-xs font-semibold" style={{ color: "#ff8a92" }}>Library →</Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "#9a8b8d" }}>
                Nothing yet. Generate a thumbnail, subtitle file, or short script and it shows up here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {recent.map((r) => (
                  <li key={r.id} className="rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(255,70,85,.12)" }}>
                    <div className="truncate text-sm font-semibold">{r.title || r.toolTitle}</div>
                    <div className="mt-0.5 flex justify-between text-[11px]" style={{ color: "#8e7f81" }}>
                      <span>{r.toolTitle}</span>
                      <span style={{ color: r.status === "completed" ? "#5fd08a" : "#ff8892" }}>{r.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/business-center/brand-kit" className="rounded-lg py-2 text-center text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.25)" }}>Brand Kit</Link>
              <Link href="/business-center/assets" className="rounded-lg py-2 text-center text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.25)" }}>Assets</Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === "profile" && (
        <Panel>
          <h2 className="font-display text-lg font-bold">Business profile</h2>
          <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
            Saved in this browser for Pro workflows. Brand colors and logos live in Brand Kit.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["company", "Company / brand name", "e.g. Aurixa Studio"],
                ["industry", "Industry", "e.g. Beauty / SaaS"],
                ["contact", "Contact email", "hello@brand.com"],
                ["voice", "Brand voice", "Bold & clear"],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block font-semibold text-white/80">{label}</span>
                <input
                  value={profile[key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid rgba(255,70,85,.22)" }}
                />
              </label>
            ))}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-white/80">Website</span>
                <input
                  value={profile.website}
                  onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid rgba(255,70,85,.22)" }}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-white/80">
                  How many videos per day should Amber make on that website?
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={profile.videosPerDay}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      videosPerDay: Math.min(20, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-32 rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid rgba(255,70,85,.22)" }}
                />
              </label>
              <p className="text-xs" style={{ color: "#9a8b8d" }}>
                Manage multiple websites and bulk cadence in Admin → Amber → Intel / Launch.
              </p>
            </div>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-semibold text-white/80">Notes for AI assist</span>
              <textarea
                rows={4}
                value={profile.notes}
                onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Audience, offer, do-not-say list…"
                className="w-full resize-y rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)" }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveProfile}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Save profile
            </button>
            <Link href="/business-center/brand-kit" className="text-sm font-semibold" style={{ color: "#ff8a92" }}>
              Open Brand Kit →
            </Link>
            {saved && <span className="text-sm" style={{ color: "#5fd08a" }}>Saved</span>}
          </div>
        </Panel>
      )}

      {tab === "tools" && (
        <div>
          <h2 className="font-display text-lg font-bold">Pro tools</h2>
          <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
            Only live studios appear here. Unfinished modules stay in the internal backlog — not on this desk.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((t) => (
              <Link
                key={t.slug}
                href={`/create/${t.slug}`}
                className="group rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(255,70,85,.45)]"
                style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.03)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <BIcon name={(t.icon as IconKey) || "chip"} size={22} />
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: "#ff8892", background: "rgba(0,0,0,.45)" }}>Live</span>
                </div>
                <h3 className="font-display mt-3 text-[15px] font-bold">{t.title}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: "#9a8b8d" }}>{t.tagline}</p>
                <span className="mt-3 inline-block text-xs font-bold" style={{ color: "#ff8a92" }}>{t.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "assist" && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Panel>
            <h2 className="font-display text-lg font-bold">AI business assist</h2>
            <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
              Start from a guided brief, then open the studio that actually generates the asset.
            </p>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-semibold text-white/80">Brief for this session</span>
              <textarea
                rows={4}
                value={assistNote}
                onChange={(e) => setAssistNote(e.target.value)}
                placeholder={profile.notes || "What should we make for the business this week?"}
                className="w-full resize-y rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)" }}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/create/shorts-20"
                className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
              >
                Generate scripts
              </Link>
              <p className="w-full text-xs" style={{ color: "#8e7f81" }}>
                For freeform coaching, use <span className="font-semibold text-white/70">Ask Amber</span> in the corner.
              </p>
            </div>
          </Panel>
          <div className="space-y-2.5">
            {ASSISTS.map((a) => (
              <Link
                key={a.href + a.title}
                href={a.href}
                className="block rounded-xl px-4 py-3"
                style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(14,6,8,.45)" }}
              >
                <div className="text-sm font-bold">{a.title}</div>
                <div className="mt-0.5 text-[12px]" style={{ color: "#9a8b8d" }}>{a.prompt}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "content" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Video Library", d: "Every finished generation you kept.", href: "/library", icon: "film" as IconKey },
            { t: "Assets", d: "Upload and reuse media for ads and avatars.", href: "/business-center/assets", icon: "folder" as IconKey },
            { t: "Brand Kit", d: "Logos, colors, voice, and brand extras.", href: "/business-center/brand-kit", icon: "palette" as IconKey },
            { t: "Publish queue", d: "Prepare captions and mark exports — no auto-post.", href: "/business-center/publishing", icon: "rocket" as IconKey },
            { t: "Content calendar", d: "Plan posting intent by date.", href: "/business-center/scheduling", icon: "calendar" as IconKey },
            { t: "Workspace analytics", d: "Creations and token spend — not social reach.", href: "/business-center/analytics", icon: "chart" as IconKey },
            { t: "Create Studio", d: "Full tool catalog for new work.", href: "/create", icon: "pen" as IconKey },
            { t: "Product commercials", d: "Photo → cinematic product ad.", href: "/create/product-commercial", icon: "image" as IconKey },
            { t: "Website commercials", d: "URL → brand video ideas.", href: "/create/website-commercial", icon: "globe" as IconKey },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              style={{ border: "1px solid rgba(255,70,85,.2)", background: "rgba(255,60,75,.03)" }}
            >
              <BIcon name={c.icon} size={24} />
              <h3 className="font-display mt-3 font-bold">{c.t}</h3>
              <p className="mt-1 text-[12.5px]" style={{ color: "#9a8b8d" }}>{c.d}</p>
              <span className="mt-3 inline-block text-xs font-bold" style={{ color: "#ff8a92" }}>Open →</span>
            </Link>
          ))}
          <Panel className="sm:col-span-2 lg:col-span-3">
            <h3 className="font-display font-bold">Social posting</h3>
            <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
              Amber Autonomous Mode is admin-only while we verify it. Use Publish queue and Content calendar to prepare posts; connect-your-accounts automation is not customer-facing yet.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/business-center/publishing" className="text-sm font-bold" style={{ color: "#ff8a92" }}>
                Open publish queue →
              </Link>
              <Link href="/business-center/scheduling" className="text-sm font-bold" style={{ color: "#ff8a92" }}>
                Content calendar →
              </Link>
            </div>
          </Panel>
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <h2 className="font-display text-lg font-bold">Workspace report</h2>
            <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
              Counts from your account — not invented social reach.
            </p>
            <div className="mt-4 space-y-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(255,70,85,.12)" }}>
                  <span className="text-sm" style={{ color: "#cabcbe" }}>{s.label}</span>
                  <span className="font-display text-lg font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2 className="font-display text-lg font-bold">Production pulse</h2>
            <p className="mt-1 text-sm" style={{ color: "#9a8b8d" }}>
              Recent generations across Pro tools.
            </p>
            {recent.length === 0 ? (
              <p className="mt-6 text-sm" style={{ color: "#9a8b8d" }}>No generations yet to chart.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{r.toolTitle}</span>
                    <span className="shrink-0 text-[11px]" style={{ color: "#8e7f81" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/pricing" className="mt-5 inline-block text-sm font-bold" style={{ color: "#ff8a92" }}>
              Buy tokens →
            </Link>
          </Panel>
        </div>
      )}
    </div>
  );
}
