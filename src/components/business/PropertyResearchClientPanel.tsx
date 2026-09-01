"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import BusinessShell from "@/components/design/BusinessShell";

const cardStyle: CSSProperties = {
  border: "1px solid rgba(255,70,85,.18)",
  background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))",
};
function btnPrimary(): CSSProperties {
  return { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" };
}
function btnGhost(): CSSProperties {
  return { border: "1px solid rgba(255,70,85,.28)", background: "rgba(255,60,75,.06)", color: "#ffd7db" };
}

type Criteria = Record<string, unknown>;
type Portal = {
  opportunities: Array<{ opportunityId: string; status: string; matchScore: number; matchWhy: string; preview: Record<string, unknown>; locked: boolean }>;
  unlocked: Array<Record<string, unknown>>;
  buyBoxes: Array<{ id: string; name?: string; paused: boolean; criteria: Criteria }>;
  agreements: Array<Record<string, unknown>>;
  payments: Array<{ opportunityId: string; amountUsd: number; status: string; paidAt: string | null }>;
  alerts: Array<{ id: string; title: string; body: string }>;
  library?: { discoveryIndependent?: boolean; activeBoxes?: number };
};

function csv(raw: string): string[] {
  return raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
}

function usdToCents(raw: string): number | undefined {
  const n = Number(String(raw).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

function summarize(c: Criteria): string {
  const parts: string[] = [];
  const counties = (c.targetCounties as string[]) || [];
  const cities = (c.targetCities as string[]) || [];
  const zips = (c.zips as string[]) || [];
  if (counties.length) parts.push(counties.join("/"));
  if (cities.length) parts.push(cities.join("/"));
  if (zips.length) parts.push(`ZIP ${zips.join(", ")}`);
  if (c.propertyType) parts.push(String(c.propertyType));
  if (c.maxBudgetCents) parts.push(`max $${(Number(c.maxBudgetCents) / 100).toLocaleString("en-US")}`);
  if (c.minBeds) parts.push(`${c.minBeds}+ beds`);
  if (c.taxDefaultInterest) parts.push("tax-default");
  if (c.foreclosureInterest) parts.push("foreclosure");
  if (c.auctionInterest) parts.push("auction");
  return parts.length ? parts.join(" · ") : "Incomplete — add county, type, budget, or distress";
}

const inputClass = "rounded-lg bg-black/40 px-3 py-2 text-sm text-white";

export default function PropertyResearchClientPanel() {
  const [tab, setTab] = useState<"criteria" | "available" | "unlocked" | "history" | "agreements">("available");
  const [notice, setNotice] = useState("Loading…");
  const [needSignIn, setNeedSignIn] = useState(false);
  const [hasAgreement, setHasAgreement] = useState(false);
  const [agreementDraft, setAgreementDraft] = useState("");
  const [portal, setPortal] = useState<Portal | null>(null);
  const [signer, setSigner] = useState("");
  const [signature, setSignature] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [counties, setCounties] = useState("");
  const [cities, setCities] = useState("");
  const [zips, setZips] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [maxSqft, setMaxSqft] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [dealBreakers, setDealBreakers] = useState("");
  const [taxDefault, setTaxDefault] = useState(false);
  const [foreclosure, setForeclosure] = useState(false);
  const [auction, setAuction] = useState(false);
  const [vacant, setVacant] = useState(false);
  const [absentee, setAbsentee] = useState(false);
  const [fixer, setFixer] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/property-research", { cache: "no-store", credentials: "include" });
    const json = await res.json();
    if (res.status === 401) {
      setNeedSignIn(true);
      setNotice("Sign in to view private research opportunities.");
      return;
    }
    if (!res.ok) {
      setNotice(json.error || "Load failed");
      return;
    }
    setNeedSignIn(false);
    setHasAgreement(Boolean(json.hasAgreement));
    setAgreementDraft(String(json.agreementDraft || ""));
    const next = json.portal as Portal;
    setPortal(next);
    if (!next?.buyBoxes?.length) setTab("criteria");
    setNotice("Your Client & Buy Box Library. Amber researches California public records on her own. $299 packages appear only when a completed report matches your saved criteria.");
  }, []);

  useEffect(() => {
    void load();
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") === "success") {
      setNotice("Payment submitted. Identifying research unlocks only after Stripe webhook verification — not from this page alone.");
    }
  }, [load]);

  function currentBox() {
    return {
      label: label || undefined,
      desiredState: "CA",
      targetCounties: csv(counties),
      targetCities: csv(cities),
      zips: csv(zips).map((z) => z.replace(/\D/g, "").slice(0, 5)).filter((z) => z.length === 5),
      propertyType: propertyType || undefined,
      minBudgetCents: usdToCents(minBudget),
      maxBudgetCents: usdToCents(maxBudget),
      minBeds: minBeds ? Number(minBeds) : undefined,
      minBaths: minBaths ? Number(minBaths) : undefined,
      minSqft: minSqft ? Number(minSqft) : undefined,
      maxSqft: maxSqft ? Number(maxSqft) : undefined,
      investmentPurpose: purpose || undefined,
      notes: notes || undefined,
      dealBreakers: csv(dealBreakers),
      taxDefaultInterest: taxDefault || undefined,
      foreclosureInterest: foreclosure || undefined,
      auctionInterest: auction || undefined,
      vacantInterest: vacant || undefined,
      absenteeInterest: absentee || undefined,
      fixerAcceptable: fixer,
    };
  }

  function fillFrom(b: { id: string; name?: string; criteria: Criteria }) {
    const c = b.criteria || {};
    setEditingId(b.id);
    setLabel(String(b.name || c.label || ""));
    setCounties(((c.targetCounties as string[]) || []).join(", "));
    setCities(((c.targetCities as string[]) || []).join(", "));
    setZips(((c.zips as string[]) || []).join(", "));
    setPropertyType(String(c.propertyType || ""));
    setMinBudget(c.minBudgetCents ? String(Number(c.minBudgetCents) / 100) : "");
    setMaxBudget(c.maxBudgetCents ? String(Number(c.maxBudgetCents) / 100) : "");
    setMinBeds(c.minBeds != null ? String(c.minBeds) : "");
    setMinBaths(c.minBaths != null ? String(c.minBaths) : "");
    setMinSqft(c.minSqft != null ? String(c.minSqft) : "");
    setMaxSqft(c.maxSqft != null ? String(c.maxSqft) : "");
    setPurpose(String(c.investmentPurpose || ""));
    setNotes(String(c.notes || ""));
    setDealBreakers(((c.dealBreakers as string[]) || []).join(", "));
    setTaxDefault(Boolean(c.taxDefaultInterest));
    setForeclosure(Boolean(c.foreclosureInterest));
    setAuction(Boolean(c.auctionInterest));
    setVacant(Boolean(c.vacantInterest));
    setAbsentee(Boolean(c.absenteeInterest));
    setFixer(c.fixerAcceptable !== false);
    setTab("criteria");
  }

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    const res = await fetch("/api/property-research", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (json.portal) setPortal(json.portal as Portal);
    if (json.hasAgreement != null) setHasAgreement(Boolean(json.hasAgreement));
    if (json.created != null) {
      setNotice(`Buy Box saved in your library. Matching created ${json.created} locked package(s). Unknown/low-confidence parcels stay internal. $299 still required per property.`);
    } else if (!res.ok) setNotice(json.error || "Action failed");
    else setNotice("Saved.");
    if (action === "save-buy-box") setTab("available");
    setBusy(null);
  }

  async function checkout(opportunityId: string) {
    setBusy("checkout");
    const res = await fetch("/api/property-research/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId, amountCents: 29900 }),
    });
    const json = await res.json();
    if (json.alreadyUnlocked) {
      setNotice("Already purchased — no second charge. Open Unlocked research.");
      setTab("unlocked");
      await load();
    } else if (json.url) {
      window.location.href = json.url as string;
    } else {
      setNotice(json.error || "Checkout failed");
    }
    setBusy(null);
  }

  const locked = portal?.opportunities || [];
  const unlocked = portal?.unlocked || [];

  return (
    <BusinessShell active="hubpro" variant="pro">
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "#ff2d3f" }}>
          California Property Research
        </p>
        <h1 className="font-display text-3xl text-white">Private Opportunity Discovery</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "#cabcbe" }}>
          You maintain your own Client & Buy Box Library. Amber searches all of California continuously using permitted
          public sources — San Bernardino is one county, not the map. Identifying information is released after agreement +
          verified $299 payment for that Opportunity ID. One property = one $299 unlock. Not a real-estate brokerage.
        </p>
        <p className="mt-2 text-xs" style={{ color: "#8dffb0" }}>
          {notice}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {(["criteria", "available", "unlocked", "history", "agreements"] as const).map((t) => (
          <button key={t} type="button" className="rounded-full px-3 py-1.5 capitalize" style={tab === t ? btnPrimary() : btnGhost()} onClick={() => setTab(t)}>
            {t === "criteria" ? "My search criteria" : t === "available" ? "Available private opportunities" : t === "unlocked" ? "Unlocked research" : t === "history" ? "Purchase history" : "Agreements"}
          </button>
        ))}
      </div>

      {needSignIn ? (
        <a href="/login" className="text-sm" style={{ color: "#ffd7db" }}>
          Sign in
        </a>
      ) : null}

      {tab === "criteria" && (
        <div className="rounded-xl p-4" style={cardStyle}>
          <p className="text-sm text-white/80">
            This is your permanent Buy Box Library. Save one or more requirement sets. Amber reverse-matches the whole
            library against the Property Library. A California-only box with no county, city, ZIP, type, budget, or distress
            filter is too broad to offer a $299 property. Amber will not invent extra criteria.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Box name (e.g. LA residential under 800k)" />
            <input className={inputClass} value={counties} onChange={(e) => setCounties(e.target.value)} placeholder="Counties (comma-separated)" />
            <input className={inputClass} value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Cities (optional)" />
            <input className={inputClass} value={zips} onChange={(e) => setZips(e.target.value)} placeholder="ZIP codes (optional)" />
            <input className={inputClass} value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="Property type (SFR, condo, multifamily…)" />
            <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Investment purpose (optional)" />
            <input className={inputClass} value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="Min budget USD" />
            <input className={inputClass} value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Max budget USD" />
            <input className={inputClass} value={minBeds} onChange={(e) => setMinBeds(e.target.value)} placeholder="Min bedrooms" />
            <input className={inputClass} value={minBaths} onChange={(e) => setMinBaths(e.target.value)} placeholder="Min bathrooms" />
            <input className={inputClass} value={minSqft} onChange={(e) => setMinSqft(e.target.value)} placeholder="Min sq ft" />
            <input className={inputClass} value={maxSqft} onChange={(e) => setMaxSqft(e.target.value)} placeholder="Max sq ft" />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/70">
            <label className="flex items-center gap-2"><input type="checkbox" checked={taxDefault} onChange={(e) => setTaxDefault(e.target.checked)} /> Tax-default interest</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={foreclosure} onChange={(e) => setForeclosure(e.target.checked)} /> Foreclosure / NOD interest</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={auction} onChange={(e) => setAuction(e.target.checked)} /> Auction interest</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={vacant} onChange={(e) => setVacant(e.target.checked)} /> Vacant interest</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={absentee} onChange={(e) => setAbsentee(e.target.checked)} /> Absentee-owner interest</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={fixer} onChange={(e) => setFixer(e.target.checked)} /> Fixer acceptable</label>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className={inputClass} value={dealBreakers} onChange={(e) => setDealBreakers(e.target.value)} placeholder="Deal breakers (e.g. NO HOA)" />
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for this Buy Box" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy}
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={btnPrimary()}
              onClick={() => void act("save-buy-box", { box: currentBox(), boxId: editingId })}
            >
              {busy === "save-buy-box" ? "Matching…" : editingId ? "Update this Buy Box" : "Save to my library"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-xs font-bold"
                style={btnGhost()}
                onClick={() => {
                  setEditingId(undefined);
                  setLabel("");
                  setCounties("");
                  setCities("");
                  setZips("");
                  setPropertyType("");
                }}
              >
                New Buy Box
              </button>
            ) : null}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-wide text-white/40">Your library</p>
          <div className="mt-2 space-y-2">
            {(portal?.buyBoxes || []).map((b) => (
              <div key={String(b.id)} className="rounded-lg border border-white/10 p-3 text-sm text-white/80">
                <div className="font-bold text-white">{String(b.name || "Buy Box")} · {b.paused ? "paused" : "active"}</div>
                <div className="text-xs text-white/50">{summarize(b.criteria)}</div>
                <button type="button" className="mt-2 mr-2 rounded px-2 py-1 text-xs" style={btnGhost()} onClick={() => fillFrom(b)}>
                  Edit
                </button>
                <button type="button" className="mt-2 mr-2 rounded px-2 py-1 text-xs" style={btnGhost()} onClick={() => void act(b.paused ? "resume-box" : "pause-box", { boxId: b.id })}>
                  {b.paused ? "Reactivate" : "Pause"}
                </button>
                <button type="button" className="mt-2 rounded px-2 py-1 text-xs" style={btnGhost()} onClick={() => void act("delete-box", { boxId: b.id })}>
                  Delete
                </button>
              </div>
            ))}
            {!portal?.buyBoxes?.length ? (
              <p className="text-sm text-white/50">No Buy Boxes yet. Add your requirements above. Statewide discovery still runs in the background.</p>
            ) : null}
          </div>
        </div>
      )}

      {tab === "available" && (
        <div className="space-y-3">
          {locked.map((o) => (
            <div key={o.opportunityId} className="rounded-xl p-4" style={cardStyle}>
              <div className="text-xs uppercase tracking-wide text-white/40">{String(o.preview.opportunityLabel || "Opportunity")}</div>
              <div className="mt-1 text-sm text-white">{String(o.preview.headline || "")}</div>
              {(() => {
                const why = o.preview.whyThisMayBeAGoodDeal as Record<string, unknown> | undefined;
                if (!why) return null;
                return (
                  <div className="mt-3 space-y-2 text-xs text-white/80">
                    <p className="text-[11px] uppercase tracking-wide text-white/40">Why this may be a good deal</p>
                    <p className="text-sm text-white">{String(why.plainEnglish || "")}</p>
                    <p><span className="text-white/50">Why Amber looked: </span>{String(why.whyFound || "")}</p>
                    <p><span className="text-white/50">What she found: </span>{String(why.whatDiscovered || "")}</p>
                    <p><span className="text-white/50">Why it matters: </span>{String(why.whyThoseFactsMatter || "")}</p>
                    <p><span className="text-white/50">Numbers: </span>{String(why.numbers || "")}</p>
                    <p><span className="text-white/50">Risks: </span>{String(why.risks || "")}</p>
                    <p><span className="text-white/50">Sources: </span>{String(why.sources || "")}</p>
                    <p><span className="text-white/50">Confidence: </span>{String(why.confidence || "")}</p>
                  </div>
                );
              })()}
              <div className="mt-2 text-xs text-white/60">
                {String(o.preview.generalCategory)} · {String(o.preview.approximatePriceBand)} · {String(o.preview.distressedCategory)} ·
                confidence {String(o.preview.researchConfidence)} · match {o.matchScore}/100
              </div>
              <p className="mt-2 text-[11px] text-white/40">Unlock price: $299 for this Opportunity ID only. Address, city, ZIP, APN and maps are withheld until payment is verified.</p>
              <p className="mt-1 text-[11px] font-mono text-white/50">Opportunity ID: {o.opportunityId}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg px-3 py-2 text-xs font-bold" style={btnGhost()} onClick={() => void act("ack-unlock", { opportunityId: o.opportunityId })}>
                  Accept individual unlock acknowledgment
                </button>
                <button type="button" disabled={!!busy || !hasAgreement} className="rounded-lg px-3 py-2 text-xs font-bold" style={btnPrimary()} onClick={() => void checkout(o.opportunityId)}>
                  Pay $299 to unlock this property only
                </button>
              </div>
              {!hasAgreement ? <p className="mt-2 text-xs text-amber-200">Accept the master agreement first (Agreements tab).</p> : null}
            </div>
          ))}
          {!locked.length ? (
            <div className="rounded-xl p-4" style={cardStyle}>
              <p className="text-sm text-white/70">
                No $299 opportunities yet. Amber only offers a property when she can explain, with collected evidence,
                why it may be a good deal for you. Matching your Buy Box location or property type is never enough.
                {(portal?.buyBoxes || []).length
                  ? " Save specific distress or investment criteria in your library; Amber still researches California public records in the background."
                  : " Add your search criteria in My search criteria so Amber knows what you want. Discovery does not wait on that step."}
              </p>
              <button type="button" className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={btnGhost()} onClick={() => setTab("criteria")}>
                Open my Buy Box Library
              </button>
            </div>
          ) : null}
        </div>
      )}

      {tab === "unlocked" && (
        <div className="space-y-3">
          {unlocked.map((u) => {
            const prop = (u.property || {}) as Record<string, unknown>;
            return (
              <div key={String(u.opportunityId)} className="rounded-xl p-4" style={cardStyle}>
                <div className="font-bold text-white">{String(prop.address)}</div>
                <div className="text-xs text-white/60">
                  {String(prop.city)}, {String(prop.county)} CA {String(prop.zip)} · APN {String(prop.apn)}
                </div>
                <p className="mt-2 text-sm text-white/80">{String(prop.why)}</p>
                <p className="mt-2 text-[11px] text-white/40">{String(prop.classificationNote)}</p>
              </div>
            );
          })}
          {!unlocked.length ? <p className="text-sm text-white/50">No unlocked research yet.</p> : null}
        </div>
      )}

      {tab === "history" && (
        <div className="rounded-xl p-4" style={cardStyle}>
          {(portal?.payments || []).map((p) => (
            <div key={String(p.opportunityId) + String(p.paidAt)} className="mb-2 text-sm text-white/80">
              ${p.amountUsd} · {p.status} · Opportunity {p.opportunityId.slice(0, 8)}… · {String(p.paidAt || "pending webhook")}
            </div>
          ))}
          {!portal?.payments?.length ? <p className="text-sm text-white/50">No $299 payments yet. $0 means $0.</p> : null}
        </div>
      )}

      {tab === "agreements" && (
        <div className="rounded-xl p-4" style={cardStyle}>
          <p className="mb-3 text-xs text-amber-200">Draft for legal validation — NOT attorney approved.</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] text-white/70">{agreementDraft}</pre>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className="rounded-lg bg-black/40 px-3 py-2 text-sm text-white" placeholder="Client name" value={signer} onChange={(e) => setSigner(e.target.value)} />
            <input className="rounded-lg bg-black/40 px-3 py-2 text-sm text-white" placeholder="Electronic signature (type full name)" value={signature} onChange={(e) => setSignature(e.target.value)} />
          </div>
          <button
            type="button"
            className="mt-3 rounded-lg px-3 py-2 text-xs font-bold"
            style={btnPrimary()}
            onClick={() => void act("accept-agreement", { signerName: signer, signature })}
          >
            I agree — electronic signature
          </button>
          {hasAgreement ? <p className="mt-2 text-xs text-green-300">Master agreement on file for this version.</p> : null}
          <p className="mt-4 text-xs text-white/40">Support: use Business Center Pro · Needs Mike for owner/legal items only.</p>
        </div>
      )}
    </BusinessShell>
  );
}
