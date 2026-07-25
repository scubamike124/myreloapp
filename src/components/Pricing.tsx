import Link from "next/link";
import {
  planPrice,
  planTokens,
  planLabel,
  planFaceValueLabel,
  packSaving,
  PACK_SPECS,
  PLAN_SPECS,
  tokenFaceValueLabel,
  type PlanName,
} from "@/lib/plans";
import {
  formatTokens,
  websiteCommercialTokens,
  standardVideoTokens,
  formatUsdFromTokens,
} from "@/lib/token-pricing";

type IconKey = "person" | "wand" | "crown" | "briefcase" | "diamond" | "building";

function TierIcon({ name, color }: { name: IconKey; color: string }) {
  const s = { width: 26, height: 26, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "person":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
    case "wand":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><path d="M5 15c-1 2-1 5-1 5s3 0 5-1m-4-4a8 8 0 0 1 2-5c2.5-3 6-4 9-4 0 3-1 6.5-4 9a8 8 0 0 1-5 2m-2-2l2 2m5.5-9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" /></svg>;
    case "crown":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" /></svg>;
    case "briefcase":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>;
    case "diamond":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><path d="M6 3h12l3 6-9 12L3 9l3-6z" /><path d="M3 9h18M9 3l3 6 3-6M12 9l-3 12M12 9l3 12" /></svg>;
    case "building":
      return <svg {...s} fill="none" stroke={color} strokeWidth={1.8}><rect x="4" y="3" width="9" height="18" rx="1" /><path d="M13 8h7v13H4M7 7v0M7 11v0M7 15v0M16 12v0M16 16v0" /></svg>;
  }
}

type Tier = {
  name: PlanName;
  blurb: string;
  icon: IconKey;
  accent: string;
  checkStroke: string;
  cardBg: string;
  cardBorder: string;
  cardShadow?: string;
  ringBorder: string;
  ringShadow?: string;
  tokenBorder: string;
  tokenColor: string;
  tokenLabelColor: string;
  inherit?: string;
  features: string[];
  btnBg: string;
  btnColor: string;
  btnShadow?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  note?: string;
};

const WC_FLOOR = websiteCommercialTokens(30);
const STD_FLOOR = standardVideoTokens(30);

const TIERS: Tier[] = [
  {
    name: "FREE",
    blurb: "Try Reelo for free",
    icon: "person",
    accent: "#c9c9cc",
    checkStroke: "#9a9a9c",
    cardBg: "linear-gradient(180deg,rgba(26,26,28,.7),rgba(12,12,14,.55))",
    cardBorder: "1px solid rgba(255,255,255,.13)",
    ringBorder: "1.5px solid rgba(255,255,255,.28)",
    tokenBorder: "1px solid rgba(255,255,255,.18)",
    tokenColor: "#f3e9e9",
    tokenLabelColor: "#9a9a9c",
    features: ["AI Video Creation (Limited)", "Standard Templates", "720p Export", "Reelo Watermark", "Community Support", "Buy more tokens anytime"],
    btnBg: "rgba(255,255,255,.07)",
    btnColor: "#e8e8ea",
    note: "No credit card required",
  },
  {
    name: "CORE",
    blurb: "For creators getting started",
    icon: "wand",
    accent: "#ff5663",
    checkStroke: "#ff5663",
    cardBg: "linear-gradient(180deg,rgba(40,12,15,.7),rgba(12,7,9,.55))",
    cardBorder: "1px solid rgba(255,54,69,.5)",
    cardShadow: "0 0 26px rgba(225,29,42,.18),inset 0 0 30px rgba(225,29,42,.05)",
    ringBorder: "1.5px solid rgba(255,54,69,.55)",
    ringShadow: "0 0 18px rgba(225,29,42,.3)",
    tokenBorder: "1px solid rgba(255,54,69,.4)",
    tokenColor: "#ff5663",
    tokenLabelColor: "#cabcbe",
    inherit: "Everything in Free, plus:",
    features: [
      "Monthly token refresh",
      "More value than the token store",
      "Talking & Dancing Photos",
      "AI Avatar Studio",
      "Buy extra tokens anytime",
      "Email Support",
    ],
    btnBg: "linear-gradient(135deg,#ff3645,#c4101c)",
    btnColor: "#fff",
    btnShadow: "0 8px 20px rgba(225,29,42,.35)",
  },
  {
    name: "PRO",
    blurb: "For professionals & growing brands",
    icon: "crown",
    accent: "#e26bea",
    checkStroke: "#e26bea",
    badge: "Most Popular",
    badgeBg: "linear-gradient(135deg,#d633e0,#9d1fb0)",
    badgeColor: "#fff",
    cardBg: "linear-gradient(180deg,rgba(34,12,40,.78),rgba(12,7,14,.6))",
    cardBorder: "1px solid rgba(214,51,224,.62)",
    cardShadow: "0 0 40px rgba(214,51,224,.28),inset 0 0 34px rgba(214,51,224,.07)",
    ringBorder: "1.5px solid rgba(214,51,224,.6)",
    ringShadow: "0 0 20px rgba(214,51,224,.35)",
    tokenBorder: "1px solid rgba(214,51,224,.45)",
    tokenColor: "#e26bea",
    tokenLabelColor: "#d6c2da",
    inherit: "Everything in Core, plus:",
    features: [
      "No Watermark",
      "Commercial License",
      `Website Commercial from ${formatTokens(WC_FLOOR)} tokens`,
      "Priority support",
      "1080p / 4K export paths",
      "Buy extra tokens anytime",
    ],
    btnBg: "linear-gradient(135deg,#d633e0,#9d1fb0)",
    btnColor: "#fff",
    btnShadow: "0 8px 22px rgba(214,51,224,.4)",
  },
  {
    name: "BUSINESS",
    blurb: "For small businesses & teams",
    icon: "briefcase",
    accent: "#4fdc8c",
    checkStroke: "#4fdc8c",
    badge: "Business",
    badgeBg: "linear-gradient(135deg,#3ad17a,#1f9b54)",
    badgeColor: "#06210f",
    cardBg: "linear-gradient(180deg,rgba(10,32,20,.7),rgba(7,14,10,.55))",
    cardBorder: "1px solid rgba(58,209,122,.5)",
    cardShadow: "0 0 26px rgba(58,209,122,.16),inset 0 0 30px rgba(58,209,122,.05)",
    ringBorder: "1.5px solid rgba(58,209,122,.55)",
    ringShadow: "0 0 18px rgba(58,209,122,.3)",
    tokenBorder: "1px solid rgba(58,209,122,.4)",
    tokenColor: "#4fdc8c",
    tokenLabelColor: "#bcd6c6",
    inherit: "Everything in Pro, plus:",
    features: [
      "Business Center access",
      "Team collaboration",
      "Brand kits",
      "Publishing & scheduling",
      "Buy extra tokens anytime",
    ],
    btnBg: "linear-gradient(135deg,#3ad17a,#1f9b54)",
    btnColor: "#06210f",
    btnShadow: "0 8px 20px rgba(58,209,122,.3)",
  },
  {
    name: "BUSINESS PLUS",
    blurb: "For agencies & multi-brand teams",
    icon: "diamond",
    accent: "#f0b94f",
    checkStroke: "#f0b94f",
    cardBg: "linear-gradient(180deg,rgba(38,28,8,.7),rgba(14,11,6,.55))",
    cardBorder: "1px solid rgba(240,185,79,.5)",
    cardShadow: "0 0 26px rgba(240,185,79,.16),inset 0 0 30px rgba(240,185,79,.05)",
    ringBorder: "1.5px solid rgba(240,185,79,.55)",
    ringShadow: "0 0 18px rgba(240,185,79,.3)",
    tokenBorder: "1px solid rgba(240,185,79,.4)",
    tokenColor: "#f0b94f",
    tokenLabelColor: "#d6cbb0",
    inherit: "Everything in Business, plus:",
    features: [
      "Higher monthly token allotment",
      "Early access to new tools",
      "Priority AI processing",
      "Advanced analytics",
      "Buy extra tokens anytime",
    ],
    btnBg: "linear-gradient(135deg,#f0b94f,#d39322)",
    btnColor: "#1c1407",
    btnShadow: "0 8px 20px rgba(240,185,79,.3)",
  },
  {
    name: "BC PRO",
    blurb: "For enterprises & large organizations",
    icon: "building",
    accent: "#c89bff",
    checkStroke: "#c89bff",
    badge: "Enterprise",
    badgeBg: "linear-gradient(135deg,#b76bff,#7d34d6)",
    badgeColor: "#fff",
    cardBg: "linear-gradient(180deg,rgba(26,14,40,.74),rgba(11,7,16,.58))",
    cardBorder: "1px solid rgba(183,107,255,.55)",
    cardShadow: "0 0 28px rgba(183,107,255,.2),inset 0 0 32px rgba(183,107,255,.06)",
    ringBorder: "1.5px solid rgba(183,107,255,.6)",
    ringShadow: "0 0 18px rgba(183,107,255,.35)",
    tokenBorder: "1px solid rgba(183,107,255,.45)",
    tokenColor: "#c89bff",
    tokenLabelColor: "#cdc0db",
    inherit: "Everything in Business Plus, plus:",
    features: [
      "Largest monthly token allotment",
      "Unlimited team seats",
      "Client portals & approvals",
      "Dedicated account manager",
      "Buy extra tokens anytime",
    ],
    btnBg: "linear-gradient(135deg,#b76bff,#7d34d6)",
    btnColor: "#fff",
    btnShadow: "0 8px 20px rgba(183,107,255,.32)",
  },
];

const PACKS = PACK_SPECS.map(({ tokens, price }) => {
  const saved = Math.round(packSaving(tokens) * 100);
  return {
    t: `${formatTokens(tokens)} ${tokens === 1 ? "TOKEN" : "TOKENS"}`,
    p: price % 1 === 0 ? `${price.toFixed(0)}` : `${price.toFixed(2)}`,
    save: saved > 0 ? `SAVE ${saved}%` : undefined,
  };
});

function Check({ stroke }: { stroke: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0">
      <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="relative z-[4] scroll-mt-24">
      <div className="px-8 pb-2 pt-6 text-center">
        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.34em]" style={{ color: "#cfc3c4" }}>Reelo Pricing</div>
        <h1 className="font-display mb-3 text-4xl font-bold uppercase leading-[1.04] tracking-[-0.01em] sm:text-[50px]">
          Simple Pricing. <span style={{ color: "#ff2d3f", textShadow: "0 0 30px rgba(225,29,42,.5)" }}>Powerful Results.</span>
        </h1>
        <p className="text-base" style={{ color: "#a99a9c" }}>
          {tokenFaceValueLabel()}. Subscriptions unlock more token value than buying individually.
        </p>
      </div>

      <div className="mx-auto max-w-[1520px] px-6 pb-2.5 pt-7">
        <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TIERS.map((t) => {
            const spec = PLAN_SPECS.find((p) => p.name === t.name)!;
            const savePct = Math.round(spec.savingsVsStore * 100);
            return (
              <div key={t.name} className="relative flex flex-col rounded-2xl px-[15px] pb-[22px] pt-[22px]" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3.5 py-[5px] text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: t.badgeBg, color: t.badgeColor, boxShadow: "0 6px 18px rgba(0,0,0,.4)" }}>
                    {t.badge}
                  </div>
                )}
                <div className="mx-auto mb-3.5 mt-1 grid h-[58px] w-[58px] place-items-center rounded-full" style={{ border: t.ringBorder, boxShadow: t.ringShadow }}>
                  <TierIcon name={t.icon} color={t.accent} />
                </div>
                <div className="font-display text-center text-[22px] font-bold tracking-[0.02em]">{planLabel(t.name)}</div>
                <div className="mb-3.5 mt-[3px] text-center text-xs" style={{ color: "#9a9a9c" }}>{t.blurb}</div>
                <div className="mb-1 text-center">
                  <span className="font-display text-3xl font-bold">{planPrice(t.name)}</span>
                  <span className="text-[13px]" style={{ color: "#9a9a9c" }}> /month</span>
                </div>
                <div className="mb-3 text-center text-[11px]" style={{ color: t.accent }}>
                  {planFaceValueLabel(t.name)}
                  {savePct > 0 ? ` · save ${savePct}% vs store` : ""}
                </div>
                <div className="mb-4 flex items-center justify-center gap-1.5 rounded-[10px] p-[9px]" style={{ border: t.tokenBorder }}>
                  <span className="font-display text-[17px] font-bold" style={{ color: t.tokenColor }}>{planTokens(t.name)}</span>
                  <span className="text-[10px] font-bold tracking-[0.06em]" style={{ color: t.tokenLabelColor }}>TOKENS /MONTH</span>
                </div>
                {t.inherit && <div className="mb-[11px] text-[11.5px] font-bold" style={{ color: t.accent }}>{t.inherit}</div>}
                <div className="mb-[18px] flex flex-col gap-[9px]">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "#cabcbe" }}>
                      <Check stroke={t.checkStroke} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/dashboard" className="mt-auto rounded-[11px] p-[11px] text-center text-[13.5px] font-bold transition-transform hover:-translate-y-px" style={{ background: t.btnBg, color: t.btnColor, border: t.name === "FREE" ? "1px solid rgba(255,255,255,.16)" : undefined, boxShadow: t.btnShadow }}>
                  Get Started
                </Link>
                {t.note && <div className="mt-2.5 text-center text-[11px]" style={{ color: "#9a9a9c" }}>{t.note}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-10">
        <div className="mb-5 text-center">
          <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.28em]" style={{ color: "#cfc3c4" }}>Token Store</div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Need more tokens?</h2>
          <p className="mt-1.5 text-sm" style={{ color: "#a99a9c" }}>
            Pay-as-you-go at full face value ({tokenFaceValueLabel()}). Same feature costs whether tokens came from a plan or the store.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PACKS.map((p) => (
            <div key={p.t} className="relative flex flex-col items-center rounded-2xl px-3 py-5" style={{ background: "linear-gradient(180deg,rgba(40,12,15,.55),rgba(12,7,9,.45))", border: "1px solid rgba(255,54,69,.35)" }}>
              {p.save && (
                <span className="absolute -top-2 rounded-md px-2 py-0.5 text-[9px] font-bold" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" }}>{p.save}</span>
              )}
              <div className="font-display text-sm font-bold" style={{ color: "#ff8892" }}>{p.t}</div>
              <div className="mt-2 font-display text-2xl font-bold">${p.p}</div>
              <Link href="/dashboard" className="mt-3 w-full rounded-lg py-2 text-center text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>
                Buy
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px]" style={{ color: "#7a6e70" }}>
          Website Commercials from {formatTokens(WC_FLOOR)} tokens ({formatUsdFromTokens(WC_FLOOR)}) · Standard
          videos from {formatTokens(STD_FLOOR)} tokens ({formatUsdFromTokens(STD_FLOOR)})
        </p>
      </div>
    </section>
  );
}
