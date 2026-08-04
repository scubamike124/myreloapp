"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BIcon from "@/components/design/BIcon";

type Account = {
  id: string;
  provider: string;
  handle: string;
  displayName: string;
  status: string;
};

type ProviderInfo = {
  id: string;
  label: string;
  future?: boolean;
  canConnect: boolean;
  connectHint: string;
  secretsReady: boolean;
};

type Creation = { id: string; title: string; toolTitle: string; mediaUrl: string | null };

type Panel = "accounts" | "operate" | "permissions" | "review";

export default function SocialAccountManager() {
  const search = useSearchParams();
  const [panel, setPanel] = useState<Panel>("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [note, setNote] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthFlash, setOauthFlash] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    company: "",
    industry: "",
    audience: "",
    goals: "",
    approvalMode: "require" as "require" | "auto",
  });

  const [creations, setCreations] = useState<Creation[]>([]);
  const [selectedCreation, setSelectedCreation] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<Record<string, unknown> | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [pickedCaption, setPickedCaption] = useState("");
  const [review, setReview] = useState<Record<string, unknown> | null>(null);
  const [recs, setRecs] = useState<Record<string, unknown> | null>(null);

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/social/accounts");
    const data = await res.json();
    setConfigured(Boolean(data.configured));
    setSignedIn(Boolean(data.signedIn));
    setAccounts(data.accounts ?? []);
    setProviders(data.providers ?? []);
    setNote(data.note ?? "");
  }, []);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/business-profile");
    const data = await res.json();
    if (data.profile) {
      setProfile({
        company: data.profile.company || "",
        industry: data.profile.industry || "",
        audience: data.profile.audience || "",
        goals: data.profile.goals || "",
        approvalMode: data.profile.approvalMode === "auto" ? "auto" : "require",
      });
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadProfile();
    void (async () => {
      const res = await fetch("/api/creations");
      const data = await res.json();
      setCreations(data.creations ?? []);
    })();
  }, [loadAccounts, loadProfile]);

  useEffect(() => {
    const oauth = search.get("oauth");
    if (!oauth) return;
    if (oauth === "connected") {
      setOauthFlash(`Connected ${search.get("provider") || "account"} successfully.`);
      setPanel("accounts");
      void loadAccounts();
    } else {
      setOauthFlash(`Connect failed: ${search.get("reason") || "unknown"}`);
    }
  }, [search, loadAccounts]);

  const byProvider = useMemo(() => {
    const map: Record<string, Account[]> = {};
    for (const a of accounts) {
      (map[a.provider] ||= []).push(a);
    }
    return map;
  }, [accounts]);

  const disconnect = async (id: string) => {
    setBusy(true);
    setErr(null);
    try {
      await fetch(`/api/social/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadAccounts();
    } finally {
      setBusy(false);
    }
  };

  const savePermissions = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, onboardingComplete: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setErr(data.error || "Couldn't save.");
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const runStrategy = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/amber/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "strategy" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Strategy failed.");
        return;
      }
      setStrategy(data);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const runCaptions = async () => {
    const c = creations.find((x) => x.id === selectedCreation);
    const topic = c?.title || profile.company || "brand short-form video";
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/amber/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "captions", topic, title: topic }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Captions failed.");
        return;
      }
      setCaptions(Array.isArray(data.captions) ? data.captions : []);
      setHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
      if (data.captions?.[0]) setPickedCaption(data.captions[0]);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const placeOnCalendar = async () => {
    const c = creations.find((x) => x.id === selectedCreation);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/amber/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_on_calendar",
          title: c?.title || "Amber scheduled post",
          creationId: selectedCreation || null,
          caption: pickedCaption,
          hashtags,
          accountIds: selectedAccounts,
          platforms: selectedAccounts.length
            ? [...new Set(accounts.filter((a) => selectedAccounts.includes(a.id)).map((a) => {
                if (a.provider === "tiktok") return "TikTok";
                if (a.provider === "instagram") return "Instagram";
                if (a.provider === "youtube") return "YouTube";
                return "Other";
              }))]
            : ["TikTok"],
          scheduledAt: new Date(Date.now() + 86400_000).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't place on calendar.");
        return;
      }
      setOauthFlash(`Amber placed item on calendar (${data.approvalStatus}).`);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const placeInQueue = async () => {
    const c = creations.find((x) => x.id === selectedCreation);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/amber/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_in_queue",
          title: c?.title || "Amber queue item",
          creationId: selectedCreation || null,
          caption: pickedCaption,
          accountIds: selectedAccounts,
          platforms: ["TikTok"],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Couldn't place in queue.");
        return;
      }
      setOauthFlash(`Amber added to publish queue (${data.approvalStatus}).`);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const runReview = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/amber/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      setReview(data.review ?? null);
      setRecs(data.recommendations ?? null);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (!configured || !signedIn) {
    return (
      <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" }}>
        <p className="text-sm" style={{ color: "#ffcf9a" }}>
          {configured ? "Sign in to connect your existing social accounts." : "Accounts aren't set up yet."}
        </p>
        {configured && (
          <Link href="/login" className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Sign in
          </Link>
        )}
      </div>
    );
  }

  const card = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.55)" } as const;

  return (
    <div className="space-y-5">
      <p className="rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(95,176,255,.25)", background: "rgba(95,176,255,.06)", color: "#c8dff5" }}>
        {note || "Connect accounts you already own. Amber never creates new social accounts."}
      </p>
      {oauthFlash && <p className="text-sm" style={{ color: "#5fd08a" }}>{oauthFlash}</p>}
      {err && <p className="text-sm" style={{ color: "#ff8a92" }}>{err}</p>}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["accounts", "Connected accounts"],
            ["operate", "Amber operate"],
            ["permissions", "Permissions"],
            ["review", "Continuous review"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            className="rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={panel === id
              ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" }
              : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "accounts" && (
        <div className="space-y-4">
          {providers.map((p) => {
            const list = byProvider[p.id] || [];
            return (
              <div key={p.id} className="rounded-2xl p-4" style={card}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-display font-bold">{p.label}</div>
                    <div className="text-xs" style={{ color: "#8e7f81" }}>{p.connectHint}</div>
                  </div>
                  {p.canConnect ? (
                    <a
                      href={`/api/oauth/${p.id}/start`}
                      className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
                    >
                      Connect existing account
                    </a>
                  ) : (
                    <span className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: "#9a8b8d", border: "1px solid rgba(255,255,255,.1)" }}>
                      {p.future ? "Future" : "Keys needed"}
                    </span>
                  )}
                </div>
                {list.length === 0 ? (
                  <p className="text-sm" style={{ color: "#9a8b8d" }}>No {p.label} accounts connected.</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ border: "1px solid rgba(255,70,85,.12)" }}>
                        <div>
                          <span className="text-sm font-semibold">✓ @{a.handle || a.displayName}</span>
                          <span className="ml-2 text-xs" style={{ color: "#8e7f81" }}>{a.displayName}</span>
                        </div>
                        <button type="button" disabled={busy} onClick={() => void disconnect(a.id)} className="text-xs font-semibold" style={{ color: "#9a8b8d" }}>
                          Disconnect
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {panel === "permissions" && (
        <div className="max-w-xl space-y-4 rounded-2xl p-5" style={card}>
          <p className="text-sm" style={{ color: "#9a8b8d" }}>
            Owner controls: connect accounts, choose whether Amber may auto-approve calendar placements, and revoke anytime.
          </p>
          {(["company", "industry", "audience", "goals"] as const).map((key) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-semibold capitalize text-white/80">{key}</span>
              <input
                value={profile[key]}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)" }}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm" style={{ color: "#cabcbe" }}>
            <input
              type="checkbox"
              checked={profile.approvalMode === "auto"}
              onChange={(e) => setProfile((p) => ({ ...p, approvalMode: e.target.checked ? "auto" : "require" }))}
            />
            Allow Amber to auto-approve calendar placements (still cannot fake publish without OAuth APIs)
          </label>
          <button type="button" disabled={busy} onClick={() => void savePermissions()} className="rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Save permissions
          </button>
        </div>
      )}

      {panel === "operate" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={card}>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <button type="button" disabled={busy} onClick={() => void runStrategy()} className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                Amber: build strategy & plan
              </button>
              <Link href="/library" className="text-sm font-bold" style={{ color: "#ff8a92" }}>Library →</Link>
              <Link href="/business-center/scheduling" className="text-sm font-bold" style={{ color: "#ff8a92" }}>Calendar →</Link>
              <Link href="/business-center/publishing" className="text-sm font-bold" style={{ color: "#ff8a92" }}>Publish queue →</Link>
            </div>
            {strategy && (
              <div className="space-y-2 text-sm" style={{ color: "#cabcbe" }}>
                <p>{String(strategy.strategySummary || "")}</p>
                {Array.isArray(strategy.pillars) && (
                  <ul className="list-disc pl-5">
                    {(strategy.pillars as string[]).map((p) => <li key={p}>{p}</li>)}
                  </ul>
                )}
                {Array.isArray(strategy.ideas) && (
                  <div className="mt-3">
                    <div className="font-semibold text-white">Video recommendations</div>
                    <ul className="mt-1 space-y-1">
                      {(strategy.ideas as { title?: string; why?: string }[]).slice(0, 6).map((idea, i) => (
                        <li key={i}><strong>{idea.title}</strong> — {idea.why}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <div className="mb-2 font-display font-bold">Library → Amber → calendar / queue</div>
            <label className="mb-2 block text-xs" style={{ color: "#8e7f81" }}>
              From Library
              <select
                value={selectedCreation}
                onChange={(e) => setSelectedCreation(e.target.value)}
                className="mt-1 w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none"
                style={{ border: "1px solid rgba(255,70,85,.22)" }}
              >
                <option value="">— pick a creation —</option>
                {creations.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} ({c.toolTitle})</option>
                ))}
              </select>
            </label>
            <div className="mb-3 text-xs" style={{ color: "#8e7f81" }}>Assign to connected accounts</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {accounts.map((a) => {
                const on = selectedAccounts.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAccounts((cur) => (on ? cur.filter((x) => x !== a.id) : [...cur, a.id]))}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={on ? { color: "#fff", background: "linear-gradient(135deg,#ff3645,#c4101c)" } : { color: "#b9a9ab", border: "1px solid rgba(255,70,85,.22)" }}
                  >
                    {a.provider}:@{a.handle}
                  </button>
                );
              })}
              {accounts.length === 0 && <span className="text-xs" style={{ color: "#9a8b8d" }}>Connect accounts first (or Amber can still draft for approval).</span>}
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void runCaptions()} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.3)", color: "#f3e9e9" }}>
                Generate captions / hashtags
              </button>
              <button type="button" disabled={busy} onClick={() => void placeOnCalendar()} className="rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                Place on calendar
              </button>
              <button type="button" disabled={busy} onClick={() => void placeInQueue()} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ border: "1px solid rgba(255,70,85,.3)", color: "#f3e9e9" }}>
                Place in publish queue
              </button>
            </div>
            {captions.length > 0 && (
              <div className="space-y-2">
                {captions.map((c) => (
                  <button key={c} type="button" onClick={() => setPickedCaption(c)} className="block w-full rounded-xl px-3 py-2 text-left text-sm" style={{ border: pickedCaption === c ? "1px solid rgba(255,70,85,.5)" : "1px solid rgba(255,70,85,.12)", color: "#cabcbe" }}>
                    {c}
                  </button>
                ))}
                <p className="text-xs" style={{ color: "#8e7f81" }}>#{hashtags.join(" #")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {panel === "review" && (
        <div className="rounded-2xl p-5" style={card}>
          <button type="button" disabled={busy} onClick={() => void runReview()} className="mb-4 rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
            Run Amber continuous review
          </button>
          {review && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Library", String((review as { libraryCount?: number }).libraryCount ?? 0)],
                ["Scheduled", String((review as { scheduledCount?: number }).scheduledCount ?? 0)],
                ["Pending approval", String((review as { pendingApproval?: number }).pendingApproval ?? 0)],
                ["Accounts", String(((review as { accounts?: unknown[] }).accounts || []).length)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl p-3" style={{ border: "1px solid rgba(255,70,85,.12)" }}>
                  <div className="font-display text-xl font-bold">{v}</div>
                  <div className="text-xs" style={{ color: "#8e7f81" }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {recs && (
            <div className="space-y-2 text-sm" style={{ color: "#cabcbe" }}>
              <p>{String(recs.summary || "")}</p>
              {Array.isArray(recs.nextActions) && (
                <ul className="list-disc pl-5">
                  {(recs.nextActions as string[]).map((a) => <li key={a}>{a}</li>)}
                </ul>
              )}
              <p className="text-xs" style={{ color: "#8e7f81" }}>No fake social reach — Reelo workspace data only until platform insights APIs are connected.</p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "#8e7f81" }}>
            <BIcon name="brain" size={16} glow={false} /> Amber reports to you here and via notifications when items need approval.
          </div>
        </div>
      )}
    </div>
  );
}
