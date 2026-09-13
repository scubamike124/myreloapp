import Header from "@/components/Header";
import SiteFooter from "@/components/design/SiteFooter";
import TestMyLogWidget from "@/components/motorbridge/TestMyLogWidget";
import { CONNECTOR_CATALOG, testedConnectorCount } from "@/lib/motorbridge/connectors";
import { PLANS } from "@/lib/motorbridge/entitlements";

export const metadata = {
  title: "MotorBridge — Reelo",
  description:
    "Supported vehicles and diagnostic systems. One data language. Normalize diagnostic, tuning and telemetry data into one developer-friendly format.",
};

const TEAL = "#4fd1c5";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: TEAL }}>
      {children}
    </p>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  passenger: "Passenger vehicles",
  motorcycle: "Motorcycles",
  diesel_pickup: "Diesel pickups",
  commercial_truck_fleet: "Commercial trucks / fleets",
  marine: "Marine / boats",
  racing_motorsport: "Race cars / motorsport",
  hybrid: "Hybrid",
  ev_battery: "EV / battery",
};

export default function MotorBridgePage() {
  const tested = testedConnectorCount();
  const categories = Array.from(new Set(CONNECTOR_CATALOG.flatMap((c) => c.categories)));

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0a0d10" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: `radial-gradient(1100px 420px at 50% -8%, rgba(79,209,197,.14), transparent 65%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(180deg,rgba(0,0,0,.6),transparent 30%)",
          WebkitMaskImage: "linear-gradient(180deg,rgba(0,0,0,.6),transparent 30%)",
        }}
      />

      <div className="relative z-[1] flex min-h-screen flex-col text-white">
        <Header />
        <main className="flex-1 pb-24 pt-10">
          {/* Hero */}
          <section className="mx-auto max-w-[820px] px-6 text-center">
            <SectionLabel>MotorBridge</SectionLabel>
            <h1 className="font-display mb-4 text-[36px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
              Supported vehicles and diagnostic systems.
              <br />
              One data language.
            </h1>
            <p className="mx-auto mb-8 max-w-[560px] text-base sm:text-lg" style={{ color: "#a9b4bd" }}>
              MotorBridge normalizes supported diagnostic, tuning and telemetry data — from mechanics, racers, diesel
              shops and fleets — into one developer-friendly vehicle-data format. Keep the tools you already use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#test-my-log"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg,${TEAL},#1a8f82)`, boxShadow: "0 10px 30px rgba(79,209,197,.35)" }}
              >
                Test My Log Free
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3 text-[15px] font-bold text-white/90 transition-colors hover:border-white/30"
              >
                Start 24-Hour Trial
              </a>
            </div>
            <p className="mt-4 text-xs" style={{ color: "#6b7580" }}>
              {tested} format{tested === 1 ? "" : "s"} tested and passing today — this number only counts what has
              actually been verified against a real fixture, never a discovery count.
            </p>
          </section>

          {/* How it works */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>How it works</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-4">
              {["Scan / export / connect", "MotorBridge recognizes the format", "Normalizes to one schema", "Analyze, query, or pull via API"].map(
                (step, i) => (
                  <div key={step} className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,.02)" }}>
                    <div className="mb-2 text-xs font-bold" style={{ color: TEAL }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-sm font-semibold text-white/90">{step}</div>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Who it's for */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>Who it's for</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {[
                "Independent mechanics",
                "Tuning & dyno shops",
                "Race teams & motorsport",
                "Motorcycle shops",
                "Diesel shops",
                "Commercial fleets",
                "Marine engine shops",
                "Developers building on vehicle data",
              ].map((who) => (
                <span key={who} className="rounded-full border border-white/10 px-4 py-2 text-sm" style={{ color: "#c7d0d6" }}>
                  {who}
                </span>
              ))}
            </div>
          </section>

          {/* Supported systems — only verified integrations */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>Supported systems</SectionLabel>
            <p className="mb-6 max-w-[640px] text-sm" style={{ color: "#a9b4bd" }}>
              MotorBridge shows a format here once it has an actual passing test against a real fixture — not the
              moment it's discovered. Vendor-specific tools (a particular scanner or logger brand) are researched
              before any claim is made about them; see the honesty note on each row.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide" style={{ color: "#7d8891" }}>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Basis</th>
                    <th className="px-4 py-3">Access</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CONNECTOR_CATALOG.map((c) => (
                    <tr key={c.slug} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 font-semibold text-white/90">{c.name}</td>
                      <td className="px-4 py-3" style={{ color: "#a9b4bd" }}>
                        {c.formatBasis}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#a9b4bd" }}>
                        {c.legalAccessStatus.replace(/_/g, " ").toLowerCase()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            background: c.maturity === "TEST_PASSED" ? "rgba(79,209,197,.15)" : "rgba(255,255,255,.08)",
                            color: c.maturity === "TEST_PASSED" ? TEAL : "#c7d0d6",
                          }}
                        >
                          {c.maturity.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs" style={{ color: "#6b7580" }}>
              Categories in active development: {categories.map((c) => CATEGORY_LABEL[c] ?? c).join(", ")}.
            </p>
          </section>

          {/* Test My Log */}
          <section id="test-my-log" className="mx-auto mt-20 max-w-[960px] scroll-mt-20 px-6">
            <SectionLabel>Try it now</SectionLabel>
            <h2 className="font-display mb-4 text-2xl font-bold sm:text-3xl">Test My Log</h2>
            <p className="mb-6 max-w-[640px] text-sm" style={{ color: "#a9b4bd" }}>
              Paste a real export, or load one of our sample files, and see it normalized live — no account, nothing
              stored against you.
            </p>
            <TestMyLogWidget
              connectors={CONNECTOR_CATALOG.map((c) => ({
                slug: c.slug,
                name: c.name,
                formatBasis: c.formatBasis,
                legalAccessStatus: c.legalAccessStatus,
                maturity: c.maturity,
              }))}
            />
          </section>

          {/* Worldwide normalization */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>Worldwide</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,.02)" }}>
                <div className="mb-2 text-sm font-semibold text-white/90">Fuel and octane, correctly</div>
                <p className="text-sm" style={{ color: "#a9b4bd" }}>
                  91 AKI is not 91 RON. MotorBridge stores the original fuel measurement and method — RON, MON, AKI,
                  ethanol content, cetane, race-fuel spec — and only compares tunes across countries when the
                  equivalency can be honestly established. When it can't, you get a warning, not a silent guess.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,.02)" }}>
                <div className="mb-2 text-sm font-semibold text-white/90">Units, never destroyed</div>
                <p className="text-sm" style={{ color: "#a9b4bd" }}>
                  °F/°C, psi/bar/kPa, miles/km, gallons/liters, hp/kW, lb-ft/Nm, mpg/L per 100km — every value keeps
                  what was actually recorded next to the normalized figure, so nothing is lost converting for display.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>Privacy</SectionLabel>
            <p className="max-w-[720px] text-sm" style={{ color: "#a9b4bd" }}>
              MotorBridge sells machine intelligence, not people's identities or movements. The intelligence pipeline
              does not need names, emails, phone numbers, addresses, license plates, precise GPS histories, or raw
              VINs — identifiers are detected and stripped before anything is normalized, and any aggregate output
              requires a minimum number of independent contributors before it's ever produced.
            </p>
          </section>

          {/* Historical import / Data Partner */}
          <section className="mx-auto mt-20 max-w-[960px] px-6">
            <SectionLabel>Historical import & Data Partner</SectionLabel>
            <p className="max-w-[720px] text-sm" style={{ color: "#a9b4bd" }}>
              Years of diagnostic and repair records sitting in your shop's system don't have to start over. With
              your explicit authorization, MotorBridge can import supported historical records. Opt in as a
              MotorBridge Data Partner and permit defined, eligible data to contribute to aggregate MotorBridge
              Intelligence — in exchange for a discount on your plan. Installing a connector is never treated as
              blanket permission; historical import and ongoing aggregate use are both separate, explicit opt-ins.
            </p>
          </section>

          {/* Pricing */}
          <section id="pricing" className="mx-auto mt-20 max-w-[1100px] scroll-mt-20 px-6">
            <SectionLabel>Pricing</SectionLabel>
            <p className="mb-6 max-w-[640px] text-sm" style={{ color: "#a9b4bd" }}>
              Starting hypotheses, not fixed prices — happy to talk about what actually fits your shop.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(PLANS).map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,.02)" }}>
                  <div className="mb-1 text-sm font-semibold text-white/90">{plan.label}</div>
                  <div className="mb-3 text-2xl font-bold" style={{ color: TEAL }}>
                    {plan.priceUsd === null ? "Custom" : plan.priceUsd === 0 ? "Free" : `$${plan.priceUsd}/mo`}
                  </div>
                  <div className="text-xs" style={{ color: "#8a949d" }}>
                    {plan.vehicleLimit === null ? "Negotiated volume" : `Up to ${plan.vehicleLimit} vehicle${plan.vehicleLimit === 1 ? "" : "s"}`}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#8a949d" }}>
                    {plan.commercialUse ? "Commercial use" : "Personal / non-commercial"}
                  </div>
                  {plan.dataPartnerDiscountFraction && (
                    <div className="mt-2 text-xs" style={{ color: TEAL }}>
                      Data Partner: {Math.round(plan.dataPartnerDiscountFraction * 100)}% off
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Enterprise / contact sales */}
          <section className="mx-auto mt-20 max-w-[820px] px-6 text-center">
            <SectionLabel>Enterprise & API documentation</SectionLabel>
            <p className="mx-auto mb-6 max-w-[560px] text-sm" style={{ color: "#a9b4bd" }}>
              Need volume access, a custom integration, or MotorBridge Intelligence for your organization? Talk to
              sales — enterprise terms are negotiated, not templated.
            </p>
            <a
              href="mailto:support@myreelo.com?subject=MotorBridge%20Enterprise"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3 text-[15px] font-bold text-white/90 transition-colors hover:border-white/30"
            >
              Contact Sales
            </a>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
