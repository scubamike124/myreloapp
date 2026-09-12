"use client";

/**
 * International API Command Center.
 *
 * The requirement that shaped every layout decision here: a country's API
 * count must be readable NEXT TO the country, without opening anything. So
 * the country list is rows of "name ......... 12", the number is the largest
 * thing on the row, and nothing that matters sits to the right of a scroll.
 *
 * Built for a phone first. The owner reads this on an iPhone, which rules out
 * a wide table — a table would put the count off-screen, which is exactly the
 * failure the requirement names. Rows stack; the count never moves.
 *
 * Numbers come from Amber HQ's catalogue over the organization bridge. This
 * component keeps no inventory of its own.
 */

import { useEffect, useState } from "react";
import type {
  ApiCommandCenterSnapshot,
  ApiCountryRow,
  CountryApiDetail,
} from "@/lib/amber/organization-bridge";

type DetailState = {
  code: string;
  name: string;
  apis: CountryApiDetail[];
  alsoServing: CountryApiDetail[];
} | null;

/**
 * A measured figure, or an explicit "not measured".
 *
 * Revenue arrives as null when nothing records it. Rendering that as "0"
 * would tell the owner the business earned nothing, which is a claim about
 * the business rather than about the instrumentation — and only the second
 * is true.
 */
function Figure({ value, prefix = "" }: { value: number | null; prefix?: string }) {
  if (value === null) return <span className="text-slate-500 text-sm font-normal">not measured</span>;
  return <>{prefix}{value.toLocaleString()}</>;
}

function Metric({ label, value, prefix, tone }: { label: string; value: number | null; prefix?: string; tone?: "warn" }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-amber-400" : "text-slate-100"}`}>
        <Figure value={value} prefix={prefix} />
      </div>
    </div>
  );
}

export default function ApiCommandCenter() {
  const [snapshot, setSnapshot] = useState<ApiCommandCenterSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>(null);
  const [loadingCountry, setLoadingCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/api-command-center", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${r.status})`);
        return data.snapshot as ApiCommandCenterSnapshot;
      })
      .then((s) => !cancelled && setSnapshot(s))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function openCountry(row: ApiCountryRow) {
    if (detail?.code === row.country) {
      setDetail(null);
      return;
    }
    setLoadingCountry(row.country);
    try {
      const res = await fetch(`/api/admin/api-command-center?country=${encodeURIComponent(row.country)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load that country");
      setDetail({ code: row.country, name: row.name, apis: data.apis ?? [], alsoServing: data.alsoServing ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that country");
    } finally {
      setLoadingCountry(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
        <div className="font-semibold">International API Command Center is unavailable</div>
        <p className="mt-1 text-red-300/90">{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">Loading the API inventory…</div>;
  }

  const { totals, revenue, countries } = snapshot;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">International API Command Center</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live inventory from Amber HQ. {totals.totalApis} API{totals.totalApis === 1 ? "" : "s"} across{" "}
          {totals.countriesWithApis} countr{totals.countriesWithApis === 1 ? "y" : "ies"}.
        </p>
      </header>

      {/* Two columns on a phone: nothing important ends up off-screen. */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric label="Total APIs" value={totals.totalApis} />
        <Metric label="Live" value={totals.live} />
        <Metric label="Draft" value={totals.draft} />
        <Metric label="Countries" value={totals.countriesWithApis} />
        <Metric label="New — 7 days" value={totals.newLast7Days} />
        <Metric label="New — 30 days" value={totals.newLast30Days} />
        <Metric label="API customers" value={revenue.customers} />
        <Metric label="Verified revenue" value={revenue.verifiedLifetimeUsd} prefix="$" />
      </section>

      {revenue.verifiedLifetimeUsd === null && (
        <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">{revenue.note}</p>
      )}

      {totals.unassigned > 0 && (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 px-3 py-2.5 text-sm text-amber-200">
          <span className="font-semibold tabular-nums">{totals.unassigned}</span> API
          {totals.unassigned === 1 ? " has" : "s have"} no country assigned yet, so
          {totals.unassigned === 1 ? " it is" : " they are"} missing from the counts below.
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">APIs by country</h2>

        {countries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-4 text-sm text-slate-400">
            No API has a country yet. Counts appear here as APIs are assigned to their market.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {countries.map((row) => {
              const open = detail?.code === row.country;
              return (
                <li key={row.country} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => void openCountry(row)}
                    aria-expanded={open}
                    /* min-h-14 keeps this a comfortable tap target on a phone. */
                    className="flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-800/60"
                  >
                    <span className="flex-1 truncate text-[15px] font-medium text-slate-100">{row.name}</span>

                    {row.alsoServes > 0 && (
                      <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">+{row.alsoServes} served</span>
                    )}
                    {row.draft > 0 && (
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                        {row.draft} draft
                      </span>
                    )}

                    {/* The count. Largest thing on the row, never off-screen. */}
                    <span className="shrink-0 text-2xl font-semibold tabular-nums text-slate-100">{row.apis}</span>

                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>

                  {open && (
                    <div className="border-t border-slate-800 bg-slate-950/40 px-3.5 py-3">
                      {loadingCountry === row.country ? (
                        <p className="text-sm text-slate-400">Loading…</p>
                      ) : detail.apis.length === 0 ? (
                        <p className="text-sm text-slate-400">No APIs are owned by {row.name} yet.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {detail.apis.map((api) => (
                            <li key={api.productId} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-medium text-slate-100">{api.name}</span>
                                <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] capitalize text-slate-300">
                                  {api.status}
                                </span>
                              </div>
                              {api.purpose && <p className="mt-1 text-xs leading-relaxed text-slate-400">{api.purpose}</p>}

                              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                {api.category && (
                                  <div className="flex gap-1.5">
                                    <dt className="text-slate-500">Category</dt>
                                    <dd className="text-slate-300">{api.category}</dd>
                                  </div>
                                )}
                                {api.pricingDisplay && (
                                  <div className="flex gap-1.5">
                                    <dt className="text-slate-500">Price</dt>
                                    <dd className="text-slate-300">{api.pricingDisplay}</dd>
                                  </div>
                                )}
                                {api.serves.length > 1 && (
                                  <div className="col-span-2 flex gap-1.5">
                                    <dt className="text-slate-500">Also serves</dt>
                                    <dd className="text-slate-300">{api.serves.filter((c) => c !== row.country).join(", ")}</dd>
                                  </div>
                                )}
                              </dl>

                              {/* The regulation that justified building it, with its source. */}
                              {api.origin && (
                                <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/60 p-2">
                                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Originating requirement</div>
                                  <div className="mt-0.5 text-xs text-slate-300">{api.origin.title}</div>
                                  <a
                                    href={api.origin.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-0.5 inline-block break-all text-xs text-sky-400 underline underline-offset-2"
                                  >
                                    {api.origin.sourceUrl}
                                  </a>
                                  {api.origin.effectiveDate && (
                                    <div className="mt-0.5 text-[11px] text-slate-500">Effective {api.origin.effectiveDate}</div>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-slate-500">
        Generated {new Date(snapshot.generatedAt).toLocaleString()} · one inventory, owned by Amber HQ
      </p>
    </div>
  );
}
