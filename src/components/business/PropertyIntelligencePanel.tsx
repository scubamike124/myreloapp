"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CA_COUNTIES } from "@/lib/property-intelligence/california";
import BusinessShell from "@/components/design/BusinessShell";
import BIcon from "@/components/design/BIcon";
import "./property-intelligence-audit.css";

const TITLE_NOTE =
  "Automated/public-record research is not a title search. Obtain a professional title report before relying on lien or ownership information.";

type PipelineStage =
  | "scanned"
  | "first_pass_rejected"
  | "deep_research"
  | "qualified"
  | "offered"
  | "paid"
  | "released";

type Dash = {
  amberStatus: string;
  lastScan: string | null;
  kpis: Record<string, number>;
  sources: Record<string, unknown>[];
  properties: Record<string, unknown>[];
  investors: Record<string, unknown>[];
  matches: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  needsMike: Record<string, unknown>[];
  introductions: Record<string, unknown>[];
  finderFees: Record<string, unknown>[];
  config: Record<string, unknown> | null;
  disclaimer: string;
  stripeMode?: string;
  ownerAudit?: boolean;
  auditPipeline?: Record<string, number>;
  clientBuyBoxes?: Array<{ id: string; user_id?: string; name?: string; criteria_json?: string; paused?: number; updated_at?: string }>;
  statewideCoverage?: {
    targetCounties: number;
    layersThisBuild: number;
    lastCounties: string[];
    countiesTouched: string[];
  };
};

type AuditRow = {
  id: string;
  canonicalKey?: string;
  address?: string;
  city?: string;
  county?: string;
  zip?: string;
  propertyType?: string;
  asking?: string;
  assessed?: string;
  taxDelinquent?: string;
  rejectReason?: string;
  rejectDetail?: string;
  matchScore?: number | string;
  matchWhy?: string;
  opportunityStatus?: string;
  lastVerified?: string;
};

function Fact({ label, value }: { label: string; value: unknown }) {
  const raw = Array.isArray(value) ? (value.length ? value.join(", ") : "Not available") : value;
  const v = raw == null || raw === "" ? "Not available" : String(raw);
  return (
    <div className="pi-fact">
      <dt>{label}</dt>
      <dd className={v === "Not available" ? "pi-na" : undefined}>{v}</dd>
    </div>
  );
}

function statusClass(kind: "ok" | "warn" | "bad" | "plain") {
  if (kind === "ok") return "pi-card status-ok";
  if (kind === "warn") return "pi-card status-warn";
  if (kind === "bad") return "pi-card status-bad";
  return "pi-card";
}

export default function PropertyIntelligencePanel() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("Loading Amber Property Intelligence…");
  const [needSignIn, setNeedSignIn] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "library" | "properties" | "investors" | "sources" | "needs">("dashboard");
  const [probe, setProbe] = useState("");
  const [probeOut, setProbeOut] = useState("");
  const [buyInvestor, setBuyInvestor] = useState("");
  const [buyCounty, setBuyCounty] = useState("San Francisco");
  const [filterCounty, setFilterCounty] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [filterConf, setFilterConf] = useState("");
  const [filterDistress, setFilterDistress] = useState("");
  const [taxDefaultBox, setTaxDefaultBox] = useState(false);
  const autoScan = useRef(false);

  const [stage, setStage] = useState<PipelineStage | null>(null);
  const [stageTitle, setStageTitle] = useState("");
  const [stageTotal, setStageTotal] = useState(0);
  const [stageRows, setStageRows] = useState<AuditRow[]>([]);
  const [stageBusy, setStageBusy] = useState(false);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [verify, setVerify] = useState<Record<string, unknown> | null>(null);
  const [buyBox, setBuyBox] = useState<Record<string, unknown> | null>(null);
  const [buyBoxBusy, setBuyBoxBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/property-intelligence", { cache: "no-store", credentials: "include" });
    const json = await res.json();
    if (res.status === 401) {
      setNeedSignIn(true);
      setNotice("Sign in to Business Center Pro to open Amber Property Intelligence.");
      return;
    }
    if (!res.ok) {
      setNotice(json.error || "Load failed");
      return;
    }
    setNeedSignIn(false);
    setDash(json.dashboard as Dash);
    setNotice(`Cloud worker ${(json.dashboard as Dash).amberStatus}. Last scan ${(json.dashboard as Dash).lastScan || "never"}.`);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    const res = await fetch("/api/property-intelligence", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (json.dashboard) setDash(json.dashboard as Dash);
    if (json.decision) setProbeOut(`${json.decision.code}: ${json.decision.message}`);
    else if (!res.ok) setNotice(json.error || "Action failed");
    else setNotice(`Done: ${action.replace(/-/g, " ")}`);
    setBusy(null);
  }

  useEffect(() => {
    if (!dash || needSignIn || autoScan.current || dash.lastScan) return;
    autoScan.current = true;
    void act("scan");
  }, [dash, needSignIn]);

  async function openStage(next: PipelineStage, title: string) {
    setTab("dashboard");
    setStage(next);
    setStageTitle(title);
    setStageBusy(true);
    setDetail(null);
    const res = await fetch(`/api/property-intelligence?view=audit-list&stage=${next}&limit=250`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "Could not load that pipeline list.");
      setStageRows([]);
      setStageTotal(0);
    } else {
      setStageRows((json.rows || []) as AuditRow[]);
      setStageTotal(Number(json.total || 0));
    }
    setStageBusy(false);
  }

  async function openProperty(id: string, fromBuyBoxId?: string) {
    setDetailBusy(true);
    const boxQs = fromBuyBoxId ? `&buyBoxId=${encodeURIComponent(fromBuyBoxId)}` : "";
    const res = await fetch(`/api/property-intelligence?view=audit-property&propertyId=${encodeURIComponent(id)}${boxQs}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) setNotice(json.error || "Could not open property.");
    else setDetail(json.property as Record<string, unknown>);
    setDetailBusy(false);
  }

  async function openBuyBox(id: string) {
    setTab("library");
    setBuyBoxBusy(true);
    setDetail(null);
    const res = await fetch(`/api/property-intelligence?view=audit-buy-box&buyBoxId=${encodeURIComponent(id)}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "Could not open Buy Box.");
      setBuyBox(null);
      await load();
    } else {
      setBuyBox((json.buyBox || json) as Record<string, unknown>);
    }
    setBuyBoxBusy(false);
  }

  async function runVerify() {
    setBusy("verify");
    const res = await fetch("/api/property-intelligence?view=audit-verify", { cache: "no-store", credentials: "include" });
    const json = await res.json();
    if (!res.ok) setNotice(json.error || "Verification failed.");
    else setVerify(json.report as Record<string, unknown>);
    setBusy(null);
  }

  const k = dash?.kpis || {};
  const pipe = dash?.auditPipeline || {};
  const disabled = !!busy || needSignIn;
  const props = (dash?.properties || []).filter((p) => {
    if (filterCounty && String(p.county) !== filterCounty) return false;
    if (filterScore && Number(p.deal_score) < Number(filterScore)) return false;
    if (filterConf && Number(p.data_confidence) < Number(filterConf)) return false;
    if (filterDistress === "tax" && !Number(p.tax_delinquent)) return false;
    if (filterDistress === "fc" && !Number(p.foreclosure)) return false;
    if (filterDistress === "auction" && !Number(p.auction)) return false;
    if (filterDistress === "vacant" && !Number(p.vacant)) return false;
    if (filterDistress === "absentee" && !Number(p.absentee)) return false;
    return true;
  });

  const pipelineCards: Array<{
    label: string;
    value: number;
    hint: string;
    kind: "ok" | "warn" | "bad" | "plain";
    onClick?: () => void;
  }> = [
    {
      label: "Properties scanned",
      value: Number(pipe.scanned ?? k.propertiesScannedLifetime ?? 0),
      hint: "Unique canonical keys · click for full list",
      kind: "plain",
      onClick: () => void openStage("scanned", "Properties scanned"),
    },
    {
      label: "First-pass rejected",
      value: Number(pipe.firstPassRejected ?? 0),
      hint: "Scanned but not deep-research qualified · click for why",
      kind: "bad",
      onClick: () => void openStage("first_pass_rejected", "First-pass rejected"),
    },
    {
      label: "Deep research qualified",
      value: Number(pipe.deepResearchQualified ?? k.deepResearchQualified ?? 0),
      hint: "Unique packages that passed the quality gate",
      kind: "ok",
      onClick: () => void openStage("deep_research", "Deep research qualified"),
    },
    {
      label: "Qualified $299 opportunities",
      value: Number(pipe.qualified299 ?? k.qualifiedOpportunities ?? 0),
      hint: "Unique properties offerable at $299 · click each record",
      kind: "ok",
      onClick: () => void openStage("qualified", "Qualified $299 opportunities"),
    },
    {
      label: "Offered to client",
      value: Number(pipe.offered ?? pipe.qualified299 ?? 0),
      hint: "Preview / agreement / payment-required",
      kind: "ok",
      onClick: () => void openStage("offered", "Offered to client"),
    },
    {
      label: "Paid",
      value: Number(pipe.paid ?? k.unlocks299 ?? 0),
      hint: "Paid / unlocked / disclosed",
      kind: "ok",
      onClick: () => void openStage("paid", "Paid"),
    },
    {
      label: "Property released",
      value: Number(pipe.released ?? k.propertiesDisclosed ?? 0),
      hint: "Identifying report released after payment",
      kind: "ok",
      onClick: () => void openStage("released", "Property released"),
    },
    {
      label: "Client Buy Boxes",
      value: Number(pipe.buyBoxes ?? k.clientLibraryBuyBoxes ?? 0),
      hint: "Saved requirement sets · not the same as client count",
      kind: "plain",
      onClick: () => setTab("library"),
    },
    {
      label: "Total clients",
      value: Number(pipe.clients ?? k.totalClients ?? 0),
      hint: "One library owner can keep many Buy Boxes",
      kind: "plain",
      onClick: () => setTab("library"),
    },
    {
      label: "Outreach sent",
      value: Number(pipe.outreachSent ?? k.outreachSent ?? 0),
      hint: "Seller solicitation is off in Version 1",
      kind: Number(pipe.outreachSent ?? k.outreachSent ?? 0) ? "ok" : "warn",
    },
  ];

  return (
    <BusinessShell active="hubpro" variant="pro" tone="light">
      <div className="pi-audit mb-5" data-pro-feature="property-intelligence">
        <p className="pi-kicker">Business Center Pro · Owner audit</p>
        <h1 className="font-display">Amber Property Intelligence</h1>
        <p className="pi-lead mt-2">
          California Property &amp; Investor Intelligence — statewide California pilot (all 58 counties). San Bernardino is one
          source, not the search territory. Click any pipeline number to inspect the real unique records Amber used. Not a
          broker. Not an appraisal. Not a title search. Clients still pay $299 before identifying details are released.
        </p>
        <p className="mt-2 text-base">
          <a href="/property-research" className="pi-link">
            Open client private-opportunity portal
          </a>
          {" · "}
          Client view stays locked until payment. This owner screen does not change that.
        </p>
        <p className="pi-meta mt-2">{notice}</p>
        {(dash?.sources || []).some((s) => String(s.last_error || "").trim()) ? (
          <div className="pi-card status-warn mt-3">
            <div className="pi-card-label">Source trouble</div>
            <p className="pi-row-sub">
              A public-record feed failed. Amber will not invent tax liens or listings to fill the gap. Check Sources for the
              exact host error.
            </p>
            <ul className="mt-2 space-y-1">
              {(dash?.sources || [])
                .filter((s) => String(s.last_error || "").trim())
                .map((s) => (
                  <li key={String(s.slug || s.id)} className="pi-row-sub">
                    <strong>{String(s.name || s.slug)}</strong> — {String(s.last_error)}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
        {dash?.ownerAudit === false ? (
          <p className="mt-2 font-semibold" style={{ color: "#9a3412" }}>
            You can see counts, but identifying property lists are limited to the owner/admin account.
          </p>
        ) : null}
        {dash?.stripeMode ? (
          <p className="pi-disclaimer mt-1">
            Stripe unlock mode: {dash.stripeMode === "live" ? "live (real $299 charges — owner authorization required)" : dash.stripeMode}. Never echo keys.
          </p>
        ) : null}
        <p className="pi-disclaimer mt-1">{dash?.disclaimer}</p>
      </div>

      <div className="pi-audit mb-4 flex flex-wrap gap-2">
        {(
          [
            ["pause-all", "PAUSE ALL", "danger"],
            ["resume-all", "Resume all", "ok"],
            ["pause-property", "Pause property scanning", "ghost"],
            ["resume-property", "Resume property scanning", "ghost"],
            ["pause-investors", "Pause investor discovery", "ghost"],
            ["resume-investors", "Resume investor discovery", "ghost"],
            ["pause-outreach", "Pause outreach", "ghost"],
            ["resume-outreach", "Resume outreach", "ghost"],
            ["scan", "Run scan now", "btn"],
            ["match", "Run matching now", "btn"],
          ] as const
        ).map(([a, label, kind]) => (
          <button
            key={a}
            type="button"
            disabled={disabled}
            className={kind === "danger" ? "pi-btn-danger" : kind === "ok" ? "pi-btn-ok" : kind === "btn" ? "pi-btn" : "pi-btn-ghost"}
            onClick={() => void act(a)}
          >
            {busy === a ? "Working…" : label}
          </button>
        ))}
        <button type="button" disabled={disabled} className="pi-btn-ghost" onClick={() => void runVerify()}>
          {busy === "verify" ? "Verifying…" : "Verify qualified properties"}
        </button>
      </div>

      <div className="pi-audit mb-4 flex flex-wrap gap-2">
        {(["dashboard", "library", "properties", "investors", "sources", "needs"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`pi-tab${tab === t ? " is-on" : ""}`}
            onClick={() => {
              setTab(t);
              if (t !== "dashboard") setStage(null);
              if (t !== "library") setBuyBox(null);
            }}
          >
            {t === "needs" ? "Needs Mike" : t === "library" ? "Client & Buy Box Library" : t}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="pi-audit space-y-4">
          <h2 className="pi-section-title" style={{ marginTop: 0 }}>
            Auditable pipeline
          </h2>
          <p className="pi-row-sub">
            Scanned → First pass → Deep research → Qualified → Offered to client → Paid → Property released. Counts are unique
            properties, not repeated source hits.
          </p>
          <div className="pi-card">
            <div className="pi-card-label">California search territory</div>
            <div className="pi-card-value" style={{ fontSize: "1.55rem" }}>
              {dash?.statewideCoverage?.targetCounties ?? 58} counties
            </div>
            <p className="pi-hint">
              Amber scans all 58 California counties. Each pass works a batch; the worker then rotates so every county is
              visited. Library currently holds parcels from {k.californiaCountiesInLibrary ?? 0} counties
              {dash?.statewideCoverage?.countiesTouched?.length
                ? ` · ${dash.statewideCoverage.countiesTouched.length} counties have been opened in this rotation`
                : ""}
              .
            </p>
            {dash?.statewideCoverage?.lastCounties?.length ? (
              <p className="pi-row-sub mt-2">Last scan batch: {dash.statewideCoverage.lastCounties.join(", ")}</p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {pipelineCards.map((c) => {
              const inner: ReactNode = (
                <>
                  <div className="pi-card-label">{c.label}</div>
                  <div className="pi-card-value">{c.value}</div>
                  <div className="pi-hint">{c.hint}</div>
                </>
              );
              if (c.onClick) {
                return (
                  <button key={c.label} type="button" className={`${statusClass(c.kind)} clickable`} onClick={c.onClick}>
                    {inner}
                  </button>
                );
              }
              return (
                <div key={c.label} className={statusClass(c.kind)}>
                  {inner}
                </div>
              );
            })}
          </div>

          {stage ? (
            <div className="pi-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="pi-section-title" style={{ marginTop: 0 }}>
                    {stageTitle}
                  </h2>
                  <p className="pi-row-sub">
                    {stageBusy ? "Loading real records…" : `${stageTotal} unique properties. Click a row for the full owner detail.`}
                  </p>
                </div>
                <button type="button" className="pi-btn-ghost" onClick={() => setStage(null)}>
                  Close list
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {stageRows.map((row) => (
                  <button key={row.id} type="button" className="pi-row" onClick={() => void openProperty(row.id)}>
                    <div className="pi-row-title">{row.address || "Not available"}</div>
                    <div className="pi-row-sub">
                      {row.city || "Not available"}, {row.county || "Not available"} {row.zip || ""} · {row.propertyType || "Not available"} · asking{" "}
                      {row.asking || "Not available"}
                    </div>
                    {row.taxDelinquent ? (
                      <div className="pi-row-sub mt-1">
                        Tax lien / tax-default: {String(row.taxDelinquent)} · Assessed {String(row.assessed || "Not available")}
                      </div>
                    ) : null}
                    {row.rejectReason && row.rejectReason !== "Not available" ? (
                      <div className="mt-1">
                        <span className="pi-badge pi-badge-bad">Rejected</span>
                        <span className="pi-row-sub">
                          {row.rejectReason}
                          {row.rejectDetail && row.rejectDetail !== "Not available" ? ` — ${row.rejectDetail}` : ""}
                        </span>
                      </div>
                    ) : null}
                    {row.matchScore != null && row.matchScore !== "Not available" ? (
                      <div className="pi-row-sub mt-1">
                        Match {String(row.matchScore)} · {row.opportunityStatus || ""} · {row.matchWhy || ""}
                      </div>
                    ) : null}
                  </button>
                ))}
                {!stageBusy && !stageRows.length ? <p className="pi-row-sub">No real records in this stage.</p> : null}
              </div>
            </div>
          ) : null}

          {verify ? <VerifyBlock report={verify} onOpenProperty={(id) => void openProperty(id)} /> : null}

          <h2 className="pi-section-title">Other operating numbers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Properties scanned today", k.propertiesScannedToday],
                ["New opportunities", k.newOpportunities],
                ["Strong opportunities", k.strongOpportunities],
                ["High-confidence (internal)", k.highConfidence],
                ["Distressed properties", k.distressedProperties],
                ["Tax-default opportunities", k.taxDefaultOpportunities],
                ["Foreclosure opportunities", k.foreclosureOpportunities],
                ["Auction opportunities", k.auctionOpportunities],
                ["Prospects discovered", k.prospectsDiscovered],
                ["Prospects qualified", k.prospectsQualified],
                ["Responses", k.responses],
                ["Matches generated", k.matchesGenerated],
                ["$299 unlocks", k.unlocks299],
                ["Gross research revenue", k.grossResearchRevenueUsd],
                ["CA counties in library", k.californiaCountiesInLibrary],
                ["CA counties in scan list", k.californiaCountiesTarget ?? 58],
                ["CA counties touched so far", k.californiaCountiesTouched],
              ] as const
            ).map(([label, val]) => (
              <div key={String(label)} className="pi-card">
                <div className="pi-card-label">{label}</div>
                <div className="pi-card-value" style={{ fontSize: "1.55rem" }}>
                  {val ?? 0}
                </div>
              </div>
            ))}
          </div>
          {(dash?.alerts || []).length ? (
            <div className="pi-card">
              <div className="pi-card-label">Opportunity alerts</div>
              {(dash?.alerts || []).map((a) => (
                <div key={String(a.id)} className="mt-2">
                  <div className="font-bold">{String(a.title)}</div>
                  <p className="pi-row-sub">{String(a.body)}</p>
                </div>
              ))}
            </div>
          ) : null}
          <p className="pi-disclaimer">
            Handoff states (Amber does not impersonate these professionals): LICENSED AGENT REQUIRED · ATTORNEY REVIEW · TITLE
            VERIFICATION · ESCROW · LENDER · INSPECTION · APPRAISAL · CONTRACTOR · OWNER ACTION
          </p>
        </div>
      )}

      {tab === "library" && (
        <div className="pi-audit space-y-4">
          {buyBox || buyBoxBusy ? (
            <BuyBoxDetailView
              data={buyBox}
              busy={buyBoxBusy}
              onBack={() => setBuyBox(null)}
              onOpenProperty={(id, boxId) => void openProperty(id, boxId)}
            />
          ) : (
            <div className="pi-card">
              <p className="pi-lead">
                Click a Buy Box to inspect its requirements and every property Amber matched, qualified, or rejected against it.
                Client → Buy Box → Property. Identical requirement copies are merged automatically.
              </p>
              <div className="mt-4 space-y-2">
                {(dash?.clientBuyBoxes || []).map((b) => {
                  let criteria: Record<string, unknown> = {};
                  try {
                    criteria = JSON.parse(String(b.criteria_json || "{}")) as Record<string, unknown>;
                  } catch {
                    criteria = {};
                  }
                  const counties = ((criteria.targetCounties as string[]) || []).join("/") || "no county";
                  const type = String(criteria.propertyType || "any type");
                  return (
                    <button key={String(b.id)} type="button" className="pi-row" onClick={() => void openBuyBox(String(b.id))}>
                      <div className="pi-row-title">
                        {String(b.name || "Buy Box")} · {Number(b.paused) ? "paused" : "active"}
                      </div>
                      <div className="pi-row-sub">
                        {counties} · {type} · client {String(b.user_id || "").slice(0, 8)}… · id {String(b.id).slice(0, 8)}…
                      </div>
                      <div className="pi-hint">Click to open matched properties</div>
                    </button>
                  );
                })}
                {!dash?.clientBuyBoxes?.length ? (
                  <p className="pi-row-sub">No client Buy Boxes in the library yet. Clients add them in the private opportunity portal.</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "properties" && (
        <div className="pi-audit pi-card">
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="pi-input" placeholder="Filter county" value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)} />
            <input className="pi-input" placeholder="Min Deal Score" value={filterScore} onChange={(e) => setFilterScore(e.target.value)} />
            <input className="pi-input" placeholder="Min Data Confidence" value={filterConf} onChange={(e) => setFilterConf(e.target.value)} />
            <select className="pi-select" value={filterDistress} onChange={(e) => setFilterDistress(e.target.value)}>
              <option value="">All distress</option>
              <option value="tax">Tax-default</option>
              <option value="fc">Foreclosure</option>
              <option value="auction">Auction</option>
              <option value="vacant">Vacant</option>
              <option value="absentee">Absentee owner</option>
            </select>
          </div>
          <div className="space-y-3">
            {props.map((p) => (
              <button key={String(p.id)} type="button" className="pi-row" onClick={() => void openProperty(String(p.id))}>
                <div className="pi-row-title">{String(p.address_raw || p.apn || "Not available")}</div>
                <div className="pi-row-sub">
                  {String(p.city || "Not available")}, {String(p.county || "Not available")} CA {String(p.zip || "")} · APN{" "}
                  {String(p.apn || "Not available")}
                </div>
                <div className="pi-row-sub mt-1">
                  Deal Score {String(p.deal_score)}/100 · Data Confidence {String(p.data_confidence)}/100
                  {Number(p.tax_delinquent) ? " · tax-default FACT" : ""}
                  {Number(p.foreclosure) ? " · foreclosure" : ""}
                  {Number(p.absentee) ? " · absentee" : ""}
                </div>
                <p className="pi-row-sub mt-1">{String(p.score_why || "")}</p>
                <p className="pi-disclaimer mt-1">{TITLE_NOTE}</p>
              </button>
            ))}
            {!props.length ? <p className="pi-row-sub">No permitted California parcels ingested yet. Run scan now.</p> : null}
          </div>
        </div>
      )}

      {tab === "investors" && (
        <div className="pi-audit pi-card">
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <select className="pi-select" value={buyInvestor} onChange={(e) => setBuyInvestor(e.target.value)}>
              <option value="">Select investor for Buy Box</option>
              {(dash?.investors || []).map((i) => (
                <option key={String(i.id)} value={String(i.id)}>
                  {String(i.name)}
                </option>
              ))}
            </select>
            <select className="pi-input" value={buyCounty} onChange={(e) => setBuyCounty(e.target.value)}>
              {CA_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-base" style={{ color: "#111" }}>
              <input type="checkbox" checked={taxDefaultBox} onChange={(e) => setTaxDefaultBox(e.target.checked)} />
              Tax-default interest (do not invent other criteria)
            </label>
            <button
              type="button"
              disabled={disabled || !buyInvestor}
              className="pi-btn"
              onClick={() =>
                void act("save-buy-box", {
                  investorId: buyInvestor,
                  box: { targetCounties: [buyCounty], targetCities: [], taxDefaultInterest: taxDefaultBox },
                })
              }
            >
              Save Buy Box (do not invent extra criteria)
            </button>
          </div>
          <div className="space-y-2">
            {(dash?.investors || []).map((i) => (
              <div key={String(i.id)} className="pi-row" style={{ cursor: "default" }}>
                <div className="pi-row-title">{String(i.name)}</div>
                <div className="pi-row-sub">
                  {String(i.business)} · {String(i.city)} {String(i.zip)} · source {String(i.source_slug || "Not available")} ·{" "}
                  {String(i.qualification)} · opt-out {Number(i.opt_out) ? "yes" : "no"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="pi-audit pi-card">
          {(dash?.sources || []).map((s) => (
            <div key={String(s.slug)} className="mb-3 flex flex-wrap items-start justify-between gap-2 pi-row" style={{ cursor: "default" }}>
              <div>
                <div className="pi-row-title">{String(s.name)}</div>
                <div className="pi-row-sub">
                  {String(s.source_type)} · {String(s.public_private)} · automation {String(s.permitted_automation)} · scrape{" "}
                  {String(s.scraping_status)} · reliability {String(s.reliability)} · rate {String(s.rate_limit)} · records{" "}
                  {String(s.records_collected)} · last {String(s.last_success_at || s.last_scan_at || "never")}
                </div>
                {s.last_error ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{String(s.last_error)}</div> : null}
              </div>
              <button
                type="button"
                disabled={disabled}
                className="pi-btn-ghost"
                onClick={() => void act(Number(s.active) ? "disable-source" : "enable-source", { slug: s.slug })}
              >
                {Number(s.active) ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "needs" && (
        <div className="pi-audit pi-card">
          {(dash?.needsMike || []).map((n) => (
            <div key={String(n.id)} className="mb-3 pi-row" style={{ cursor: "default" }}>
              <div className="pi-row-title">{String(n.title)}</div>
              <p className="pi-row-sub">{String(n.detail)}</p>
            </div>
          ))}
          {!dash?.needsMike?.length ? <p className="pi-row-sub">No owner actions queued.</p> : null}

          <div className="mt-6">
            <p className="pi-card-label">Compliance probe</p>
            <textarea
              className="pi-textarea mt-2 w-full"
              rows={3}
              value={probe}
              onChange={(e) => setProbe(e.target.value)}
              placeholder="Test: Negotiate this seller down to $350,000"
            />
            <button type="button" className="pi-btn mt-2" onClick={() => void act("evaluate", { text: probe })}>
              Evaluate
            </button>
            {probeOut ? <p className="mt-2 font-semibold">{probeOut}</p> : null}
          </div>
        </div>
      )}

      {needSignIn ? (
        <a href="/login" className="pi-link mt-4 inline-flex items-center gap-2">
          <BIcon name="lock" size={16} /> Sign in
        </a>
      ) : null}

      {(detail || detailBusy) && (
        <PropertyDetailDrawer
          detail={detail}
          busy={detailBusy}
          onClose={() => setDetail(null)}
          onOpenBuyBox={(id) => void openBuyBox(id)}
          canReturnToBuyBox={!!buyBox}
        />
      )}
    </BusinessShell>
  );
}

function VerifyBlock({
  report,
  onOpenProperty,
}: {
  report: Record<string, unknown>;
  onOpenProperty: (id: string) => void;
}) {
  const properties = (Array.isArray(report.properties) ? report.properties : []) as Record<string, unknown>[];
  const boxes = (report.buyBoxesVsClients || {}) as Record<string, unknown>;
  const outreach = (report.outreach || {}) as Record<string, unknown>;
  const notes = (Array.isArray(report.notes) ? report.notes : []) as string[];
  return (
    <div className="pi-card">
      <h2 className="pi-section-title" style={{ marginTop: 0 }}>
        Verification report
      </h2>
      <p className="pi-row-sub">
        Unique qualified properties: {String(report.uniquePropertyIds ?? "Not available")} · opportunity rows:{" "}
        {String(report.opportunityRows ?? "Not available")} · unique IDs: {report.unique ? "YES" : "CHECK NOTES"}
      </p>
      <p className="pi-row-sub mt-1">
        Buy Boxes {String(boxes.buyBoxes)} vs clients {String(boxes.clients)} — {boxes.legitimate ? "legitimate" : "review"}:{" "}
        {String(boxes.why || "")}
      </p>
      <p className="pi-row-sub mt-1">
        Outreach sent {String(outreach.sent)} — {String(outreach.why || "")}
      </p>
      {notes.map((n) => (
        <p key={n} className="pi-row-sub mt-1">
          {n}
        </p>
      ))}
      <div className="mt-3 space-y-2">
        {properties.map((p) => (
          <button key={String(p.propertyId)} type="button" className="pi-row" onClick={() => onOpenProperty(String(p.propertyId))}>
            <div className="pi-row-title">{String(p.address || "Not available")}</div>
            <div className="pi-row-sub">
              {String(p.city)} · {String(p.canonicalKey)} · Buy Box {String(p.buyBoxName)} · match {String(p.matchScore)} ·
              confidence {String(p.dataConfidence)}
            </div>
            <div className="mt-1">
              {p.meetsClientRequirements ? (
                <span className="pi-badge pi-badge-ok">Meets Buy Box</span>
              ) : (
                <span className="pi-badge pi-badge-warn">Review requirements</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function contactLine(value: unknown, empty = "Not available"): string {
  if (Array.isArray(value)) {
    const parts = value.map((v) => String(v || "").trim()).filter((v) => v && v !== "Not available");
    return parts.length ? parts.join(" · ") : empty;
  }
  const s = String(value ?? "").trim();
  return s && s !== "Not available" ? s : empty;
}

function Bucket({
  title,
  count,
  rows,
  onOpen,
}: {
  title: string;
  count: number;
  rows: Record<string, unknown>[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="mt-4">
      <h3 className="pi-section-title">
        {title} ({count})
      </h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <button key={String(row.id)} type="button" className="pi-row" onClick={() => onOpen(String(row.id))}>
            <div className="pi-row-title">{String(row.fullAddress || row.address || "Not available")}</div>
            <div className="pi-row-sub">
              {String(row.city || "Not available")}, {String(row.county || "Not available")} · {String(row.propertyType || "Not available")} ·{" "}
              {String(row.asking || row.assessed || "Not available")}
            </div>
            <div className="pi-row-sub mt-1">
              Phone {contactLine(row.phones)} · Email {contactLine(row.emails)}
            </div>
            <div className="pi-row-sub mt-1">
              Agent {contactLine(row.listingAgent)} · Agent phone {contactLine(row.listingAgentPhone)} · Agent email{" "}
              {contactLine(row.listingAgentEmail)}
            </div>
            {(String(row.ownerName || "") !== "Not available" && String(row.ownerName || "")) ||
            (String(row.mailingAddress || "") !== "Not available" && String(row.mailingAddress || "")) ? (
              <div className="pi-row-sub mt-1">
                Owner {contactLine(row.ownerName)} · Mailing {contactLine(row.mailingAddress)}
              </div>
            ) : null}
            <div className="pi-row-sub mt-1">
              Asking {String(row.asking || "Not available")} · Assessed {String(row.assessed || "Not available")} · Tax lien{" "}
              {String(row.taxDelinquent || "Not available")}
            </div>
            <div className="pi-row-sub mt-1">
              Match {String(row.matchScore ?? "Not available")} · requirement {String(row.requirementMatchPct ?? "Not available")}% ·{" "}
              {String(row.matchWhy || row.bucketReason || row.rejectReason || "")}
            </div>
          </button>
        ))}
        {!rows.length ? <p className="pi-row-sub">None.</p> : null}
      </div>
    </div>
  );
}

function BuyBoxDetailView({
  data,
  busy,
  onBack,
  onOpenProperty,
}: {
  data: Record<string, unknown> | null;
  busy: boolean;
  onBack: () => void;
  onOpenProperty: (id: string, buyBoxId?: string) => void;
}) {
  const box = (data?.buyBox || {}) as Record<string, unknown>;
  const req = (box.requirements || {}) as Record<string, string>;
  const matched = (data?.matched || {}) as Record<string, { count?: number; rows?: Record<string, unknown>[] }>;
  const open = (id: string) => onOpenProperty(id, String(box.id || ""));
  return (
    <div className="pi-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="pi-kicker">Client → Buy Box</p>
          <h2 className="pi-section-title" style={{ marginTop: 0 }}>
            {String(box.name || "Buy Box")}
          </h2>
        </div>
        <button type="button" className="pi-btn-ghost" onClick={onBack}>
          Back to library
        </button>
      </div>
      {busy && !data ? <p className="pi-row-sub">Loading Buy Box records…</p> : null}
      {data ? (
        <>
          {Number(data.mergedDuplicates) > 0 ? (
            <p className="pi-row-sub mt-2">
              Merged {String(data.mergedDuplicates)} identical duplicate Buy Box row(s) for this client. Requirements were the same.
            </p>
          ) : null}
          <p className="pi-disclaimer mt-2">
            Admin/owner only on this Property Intelligence site. Property address, phones, emails, and other identifying
            contacts below are never shown in the client opportunity portal until a paid unlock (and agent/owner contact
            stays admin-audit only).
          </p>
          <dl className="pi-facts mt-3">
            <Fact label="Client" value={box.clientName} />
            <Fact label="Client email" value={box.clientEmail} />
            <Fact label="Client user ID" value={box.clientUserId} />
            <Fact label="Buy Box ID" value={box.id} />
            <Fact label="Status" value={box.status} />
            <Fact label="Complete requirements" value={req.completeRequirements} />
            <Fact label="Location requirements" value={req.location} />
            <Fact label="Property type" value={req.propertyType} />
            <Fact label="Price range" value={req.priceRange} />
            <Fact label="Beds / baths" value={req.bedsBaths} />
            <Fact label="Square footage" value={req.squareFootage} />
            <Fact label="Investment criteria" value={req.investmentCriteria} />
            <Fact label="Deal breakers" value={req.dealBreakers} />
            <Fact label="Other requirements" value={req.other} />
            <Fact label="Notes" value={req.notes} />
          </dl>
          <h2 className="pi-section-title">MATCHED PROPERTIES</h2>
          <p className="pi-row-sub">
            Full address + phones/emails when present in source data. Click a row for the complete owner audit.
          </p>
          <Bucket title="FINAL QUALIFIED" count={Number(matched.qualified?.count || 0)} rows={matched.qualified?.rows || []} onOpen={open} />
          <Bucket
            title="DEEP RESEARCH / UNDER REVIEW"
            count={Number(matched.deepResearch?.count || 0)}
            rows={matched.deepResearch?.rows || []}
            onOpen={open}
          />
          <Bucket title="REJECTED" count={Number(matched.rejected?.count || 0)} rows={matched.rejected?.rows || []} onOpen={open} />
        </>
      ) : null}
    </div>
  );
}

function DealEvidenceBlock({ detail }: { detail: Record<string, unknown> }) {
  const deal = (detail.dealEvidence || {}) as Record<string, unknown>;
  const thesis = (detail.opportunityThesis || null) as Record<string, unknown> | null;
  const ownerWhy = ((thesis?.owner || thesis?.client || {}) as Record<string, unknown>) || {};
  const signals = (Array.isArray(thesis?.signals) ? thesis?.signals : []) as Array<Record<string, unknown>>;
  const missing = (Array.isArray(deal.missingForDistressDeal) ? deal.missingForDistressDeal : []) as string[];
  const reasons = (Array.isArray(deal.pickReasons) ? deal.pickReasons : []) as string[];
  const found = (Array.isArray(deal.foundFacts) ? deal.foundFacts : []) as Array<{ label?: string; value?: string }>;
  if (!deal.headline && !deal.verdict && !thesis) return null;
  return (
    <div className="pi-card mt-3">
      <h3 className="pi-section-title" style={{ marginTop: 0 }}>
        Why this may be a good deal
      </h3>
      {thesis ? (
        <>
          {thesis.offerable ? (
            <p className="pi-lead">{String(ownerWhy.plainEnglish || "")}</p>
          ) : (
            <p className="pi-lead">REJECTED FROM $299 — {String(thesis.rejectReason || "No worthwhile opportunity thesis.")}</p>
          )}
          <dl className="pi-facts mt-2">
            <Fact label="Why Amber found it" value={ownerWhy.whyFound} />
            <Fact label="What Amber discovered" value={ownerWhy.whatDiscovered} />
            <Fact label="Why those facts matter" value={ownerWhy.whyThoseFactsMatter} />
            <Fact label="The numbers" value={ownerWhy.numbers} />
            <Fact label="The risks" value={ownerWhy.risks} />
            <Fact label="Sources / evidence" value={ownerWhy.sources} />
            <Fact label="Confidence (FACT vs ESTIMATE vs UNKNOWN)" value={ownerWhy.confidence} />
          </dl>
          {signals.length ? (
            <div className="mt-2">
              <p className="pi-card-label">Signals Amber will stand behind</p>
              {signals.map((s) => (
                <p key={String(s.id)} className="pi-row-sub mt-1">
                  [{String(s.kind)}] {String(s.label)} — {String(s.evidence)} ({String(s.source)})
                </p>
              ))}
            </div>
          ) : (
            <p className="pi-row-sub mt-2">No FACT-level opportunity signal. Spec match is not a deal thesis.</p>
          )}
        </>
      ) : null}

      <h3 className="pi-section-title">Assessor / source facts (not a bargain certificate)</h3>
      <p className="pi-lead">{String(deal.verdict || deal.headline)}</p>
      <p className="pi-row-sub mt-2">{String(deal.whyAmberOffered || "")}</p>

      <h4 className="pi-section-title">Price and value</h4>
      <dl className="pi-facts">
        <Fact label="Asking / list price" value={deal.askingPrice} />
        <Fact label="Asking price note" value={deal.askingPriceNote} />
        <Fact label="Estimated market value" value={deal.marketValue} />
        <Fact label="Assessor tax-roll total" value={deal.assessedTotal} />
        <Fact label="What the tax-roll number means" value={deal.assessedNote} />
        <Fact label="Assessed land" value={deal.assessedLand} />
        <Fact label="Assessed building" value={deal.assessedImprovement} />
      </dl>

      <h4 className="pi-section-title">What is the problem?</h4>
      <p className="pi-lead">{String(deal.problemFound || "Not available")}</p>
      <dl className="pi-facts mt-2">
        <Fact label="Tax lien / tax-default on record" value={deal.taxLienOnRecord} />
        <Fact label="Tax / lien amount" value={deal.taxLienAmount} />
        <Fact label="Foreclosure" value={deal.foreclosure} />
        <Fact label="Auction" value={deal.auction} />
        <Fact label="Vacant" value={deal.vacant} />
        <Fact label="Absentee owner" value={deal.absentee} />
      </dl>

      <h4 className="pi-section-title">Why Amber picked it</h4>
      {reasons.map((r) => (
        <p key={r} className="pi-row-sub mt-1">
          {r}
        </p>
      ))}

      <h4 className="pi-section-title">What Amber found on the source</h4>
      <p className="pi-row-sub">Every field below came from the county assessor payload. Nothing here is invented.</p>
      <dl className="pi-facts mt-2">
        {found.map((f) => (
          <Fact key={String(f.label)} label={String(f.label)} value={f.value} />
        ))}
      </dl>
      {!found.length ? <p className="pi-na">No retained source payload fields.</p> : null}

      {missing.length ? (
        <div className="mt-3">
          <p className="pi-card-label">What Amber does not have (will not invent)</p>
          {missing.map((m) => (
            <p key={m} className="pi-row-sub mt-1">
              {m}
            </p>
          ))}
        </div>
      ) : null}
      <p className="pi-disclaimer mt-3">
        Assessor value is not an appraisal. Public records are not a title search. A $299 research offer is not a statement
        that the property is a good buy.
      </p>
    </div>
  );
}

function PropertyDetailDrawer({
  detail,
  busy,
  onClose,
  onOpenBuyBox,
  canReturnToBuyBox,
}: {
  detail: Record<string, unknown> | null;
  busy: boolean;
  onClose: () => void;
  onOpenBuyBox: (id: string) => void;
  canReturnToBuyBox?: boolean;
}) {
  const identity = (detail?.identity || {}) as Record<string, unknown>;
  const facts = (detail?.facts || {}) as Record<string, unknown>;
  const why = (detail?.whyAmberQualified || {}) as Record<string, unknown>;
  const pipeline = (detail?.pipeline || {}) as Record<string, unknown>;
  const boxes = (Array.isArray(why.buyBoxes) ? why.buyBoxes : []) as Record<string, unknown>[];
  const sources = (Array.isArray(why.sourcesChecked) ? why.sourcesChecked : []) as Record<string, unknown>[];
  const warnings = (Array.isArray(why.warnings) ? why.warnings : []) as string[];
  const photos = (Array.isArray(facts.photos) ? facts.photos : []) as string[];
  const listingUrl = String(identity.listingUrl || "");
  const client = (why.client || {}) as Record<string, unknown>;

  return (
    <div className="pi-drawer" role="dialog" aria-label="Property detail" onClick={onClose}>
      <div className="pi-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <h2 className="pi-section-title" style={{ marginTop: 0 }}>
            {String(identity.address || identity.addressRaw || "Property detail (owner audit)")}
          </h2>
          <button type="button" className="pi-btn-ghost" onClick={onClose}>
            {canReturnToBuyBox ? "Back to Buy Box" : "Close"}
          </button>
        </div>
        {busy && !detail ? <p className="pi-row-sub">Loading the real record…</p> : null}
        {detail ? (
          <>
            <p className="pi-kicker mt-1">Property → Matching Buy Box → Client</p>
            <p className="pi-disclaimer">
              This identifying information is for owner audit only. It is not shown to the client until $299 payment/unlock.
            </p>
            <DealEvidenceBlock detail={detail} />
            <dl className="pi-facts">
              <Fact label="Client" value={client.userId} />
              <Fact label="Matching Buy Box" value={client.buyBoxName} />
            </dl>
            {client.buyBoxId && String(client.buyBoxId) !== "Not available" ? (
              <button type="button" className="pi-btn mt-2" onClick={() => onOpenBuyBox(String(client.buyBoxId))}>
                Open matching Buy Box
              </button>
            ) : null}
            <h3 className="pi-section-title">Admin contacts (this site only)</h3>
            <dl className="pi-facts">
              <Fact label="Full address" value={(detail.contacts as Record<string, unknown> | undefined)?.fullAddress || identity.address} />
              <Fact label="Phones" value={(detail.contacts as Record<string, unknown> | undefined)?.phones || facts.phones} />
              <Fact label="Emails" value={(detail.contacts as Record<string, unknown> | undefined)?.emails || facts.emails} />
              <Fact label="Listing agent" value={facts.listingAgent} />
              <Fact label="Agent phone" value={facts.listingAgentPhone} />
              <Fact label="Agent email" value={facts.listingAgentEmail} />
              <Fact label="Broker" value={facts.broker} />
              <Fact label="Owner name" value={facts.ownerName} />
              <Fact label="Mailing address" value={facts.mailingAddress} />
              <Fact
                label="Other contacts found"
                value={(detail.contacts as Record<string, unknown> | undefined)?.otherContacts || "Not available"}
              />
            </dl>
            <h3 className="pi-section-title">The actual property</h3>
            <dl className="pi-facts">
              <Fact label="Street address" value={identity.address} />
              <Fact label="Assessor / source address as stored" value={identity.addressRaw} />
              <Fact label="City / state / ZIP" value={[identity.city, identity.state, identity.zip].filter(Boolean).join(", ")} />
              <Fact label="County" value={identity.county} />
              <Fact label="Listing URL" value={listingUrl} />
              <Fact label="Source website / database" value={identity.sourceWebsite} />
              <Fact label="Listing / property ID" value={identity.listingId} />
              <Fact label="Stable unique ID" value={identity.propertyId} />
              <Fact label="Canonical key" value={identity.canonicalKey} />
              <Fact label="APN" value={identity.apn} />
              <Fact label="Date discovered" value={identity.dateDiscovered} />
              <Fact label="Last verified" value={identity.lastVerified} />
              <Fact label="Property type" value={facts.propertyType} />
              <Fact label="Asking / list price" value={facts.askingPrice} />
              <Fact label="Assessed value" value={facts.assessedValue} />
              <Fact label="Bedrooms" value={facts.bedrooms} />
              <Fact label="Bathrooms" value={facts.bathrooms} />
              <Fact label="Square footage" value={facts.squareFootage} />
              <Fact label="Lot size" value={facts.lotSize} />
              <Fact label="Year built" value={facts.yearBuilt} />
              <Fact label="Days on market" value={facts.daysOnMarket} />
              <Fact label="Listing status" value={facts.listingStatus} />
              <Fact label="Listing agent" value={facts.listingAgent} />
              <Fact label="Broker" value={facts.broker} />
              <Fact label="Price history" value={facts.priceHistory} />
              <Fact label="Tax information" value={facts.taxInformation} />
              <Fact label="Tax delinquent" value={facts.taxDelinquent} />
              <Fact label="Foreclosure" value={facts.foreclosure} />
              <Fact label="Auction" value={facts.auction} />
              <Fact label="Vacant" value={facts.vacant} />
              <Fact label="Absentee" value={facts.absentee} />
              <Fact label="Zoning" value={facts.zoning} />
              <Fact label="Units" value={facts.units} />
            </dl>
            {listingUrl.startsWith("http") ? (
              <p className="mt-3">
                <a className="pi-link" href={listingUrl} target="_blank" rel="noreferrer">
                  Open original source
                </a>
              </p>
            ) : null}
            <h3 className="pi-section-title">Photos</h3>
            {photos.length ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="Property photo from source payload" className="rounded-lg border border-gray-300" />
                ))}
              </div>
            ) : (
              <p className="pi-na">Not available</p>
            )}

            <h3 className="pi-section-title">WHY AMBER MATCHED THIS PROPERTY</h3>
            <dl className="pi-facts">
              <Fact label="Found" value={why.foundAt} />
              <Fact label="Last verified" value={why.lastVerified} />
              <Fact label="High-confidence / deep-research score" value={why.highConfidenceScore} />
              <Fact label="Opportunity score" value={why.opportunityScore} />
              <Fact label="Currently a $299 opportunity" value={pipeline.currentlyQualified299 ? "Yes" : "No"} />
            </dl>
            <p className="pi-lead mt-3">{String(why.belief || "Not available")}</p>
            <p className="pi-row-sub mt-1">{String(why.scoreWhy || "")}</p>
            <h4 className="pi-section-title">Sources checked</h4>
            {sources.length ? (
              sources.map((s, i) => (
                <p key={i} className="pi-row-sub">
                  {String(s.slug || "Not available")} · {String(s.url || "Not available")} · {String(s.collectedAt || "Not available")}
                </p>
              ))
            ) : (
              <p className="pi-na">Not available</p>
            )}
            {warnings.length ? (
              <div className="mt-3">
                <h4 className="pi-section-title">Warning signs / missing information</h4>
                {warnings.map((w) => (
                  <p key={w} className="pi-row-sub">
                    <span className="pi-badge pi-badge-warn">Warning</span>
                    {w}
                  </p>
                ))}
              </div>
            ) : null}
            {boxes.map((b) => {
              const reqs = (Array.isArray(b.requirements) ? b.requirements : []) as Record<string, unknown>[];
              return (
                <div key={String(b.buyBoxId)} className="mt-4 pi-card">
                  <div className="pi-row-title">{String(b.buyBoxName || "Buy Box")}</div>
                  <div className="pi-row-sub">
                    Client {String(b.clientUserId || "").slice(0, 8) || "Not available"}… · match {String(b.matchScore)} ·
                    requirement match {String(b.requirementMatchPct)}% · status {String(b.opportunityStatus)}
                  </div>
                  <p className="pi-row-sub mt-1">{String(b.matchWhy || "")}</p>
                  <div className="pi-req pi-req-head mt-3">
                    <span>Requirement</span>
                    <span>Buy Box value</span>
                    <span>Property value</span>
                    <span>Result</span>
                  </div>
                  {reqs.map((r) => (
                    <div key={String(r.id)} className="pi-req">
                      <span>{String(r.requirement)}</span>
                      <span>{String(r.expected)}</span>
                      <span>{String(r.actual)}</span>
                      <span
                        className={
                          r.status === "pass" ? "pi-badge pi-badge-ok" : r.status === "fail" ? "pi-badge pi-badge-bad" : "pi-badge pi-badge-na"
                        }
                      >
                        {String(r.status).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {String(b.buyBoxId) && String(b.buyBoxId) !== "Not available" ? (
                    <button type="button" className="pi-btn-ghost mt-3" onClick={() => onOpenBuyBox(String(b.buyBoxId))}>
                      Open this Buy Box
                    </button>
                  ) : null}
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}

