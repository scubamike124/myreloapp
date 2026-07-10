"use client";

import { useEffect, useState } from "react";

type StripeCfg = { enabled: boolean; mode: "test" | "live"; publishableKey: string; secretKey: string; webhookSecret: string };
type PaypalCfg = { enabled: boolean; mode: "sandbox" | "live"; clientId: string; clientSecret: string; webhookId: string };

const STORE_KEY = "reelo-admin-gateways";

const emptyStripe: StripeCfg = { enabled: false, mode: "test", publishableKey: "", secretKey: "", webhookSecret: "" };
const emptyPaypal: PaypalCfg = { enabled: false, mode: "sandbox", clientId: "", clientSecret: "", webhookId: "" };

const field = { border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" } as const;

const STRIPE_ICON = "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.007z";
const PAYPAL_ICON = "M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z";

export default function AdminGateways() {
  const [stripe, setStripe] = useState<StripeCfg>(emptyStripe);
  const [paypal, setPaypal] = useState<PaypalCfg>(emptyPaypal);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.stripe) setStripe({ ...emptyStripe, ...p.stripe });
        if (p.paypal) setPaypal({ ...emptyPaypal, ...p.paypal });
      }
    } catch {}
  }, []);

  const save = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ stripe, paypal }));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const connected = (c: StripeCfg | PaypalCfg, keys: string[]) => c.enabled && keys.every((k) => (c as Record<string, unknown>)[k]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-[28px]">Payment gateways</h1>
          <p className="mt-1 text-sm text-white/50">Enter your Stripe and PayPal credentials to accept payments.</p>
        </div>
        <button onClick={save} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px -8px rgba(225,29,42,.6)" }}>
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
        Secret keys should live in server environment variables in production — this demo stores them locally in your browser only. Never expose live secret keys in front-end code.
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Stripe */}
        <GatewayCard
          title="Stripe"
          brandColor="#635bff"
          icon={STRIPE_ICON}
          connected={connected(stripe, ["publishableKey", "secretKey"])}
          enabled={stripe.enabled}
          onToggle={() => setStripe((s) => ({ ...s, enabled: !s.enabled }))}
        >
          <Segment label="Mode" value={stripe.mode} options={[["test", "Test"], ["live", "Live"]]} onChange={(v) => setStripe((s) => ({ ...s, mode: v as StripeCfg["mode"] }))} />
          <Text label="Publishable key" placeholder="pk_live_..." value={stripe.publishableKey} onChange={(v) => setStripe((s) => ({ ...s, publishableKey: v }))} />
          <Secret label="Secret key" placeholder="sk_live_..." value={stripe.secretKey} onChange={(v) => setStripe((s) => ({ ...s, secretKey: v }))} />
          <Secret label="Webhook signing secret" placeholder="whsec_..." value={stripe.webhookSecret} onChange={(v) => setStripe((s) => ({ ...s, webhookSecret: v }))} />
        </GatewayCard>

        {/* PayPal */}
        <GatewayCard
          title="PayPal"
          brandColor="#0070ba"
          icon={PAYPAL_ICON}
          connected={connected(paypal, ["clientId", "clientSecret"])}
          enabled={paypal.enabled}
          onToggle={() => setPaypal((p) => ({ ...p, enabled: !p.enabled }))}
        >
          <Segment label="Mode" value={paypal.mode} options={[["sandbox", "Sandbox"], ["live", "Live"]]} onChange={(v) => setPaypal((p) => ({ ...p, mode: v as PaypalCfg["mode"] }))} />
          <Text label="Client ID" placeholder="AeA1QIZ..." value={paypal.clientId} onChange={(v) => setPaypal((p) => ({ ...p, clientId: v }))} />
          <Secret label="Client secret" placeholder="EGnHDxD..." value={paypal.clientSecret} onChange={(v) => setPaypal((p) => ({ ...p, clientSecret: v }))} />
          <Text label="Webhook ID (optional)" placeholder="WH-..." value={paypal.webhookId} onChange={(v) => setPaypal((p) => ({ ...p, webhookId: v }))} />
        </GatewayCard>
      </div>
    </div>
  );
}

function GatewayCard({ title, brandColor, icon, connected, enabled, onToggle, children }: { title: string; brandColor: string; icon: string; connected: boolean; enabled: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: brandColor }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d={icon} /></svg>
          </span>
          <div>
            <div className="font-display text-lg font-bold">{title}</div>
            <div className="text-xs font-medium" style={{ color: connected ? "#2ecc71" : "#9a8b8d" }}>{connected ? "● Connected" : "○ Not connected"}</div>
          </div>
        </div>
        <button onClick={onToggle} role="switch" aria-checked={enabled} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: enabled ? "#ff3645" : "rgba(255,255,255,.15)" }}>
          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: enabled ? "22px" : "2px" }} />
        </button>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

function Text({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-white/60">{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 font-mono text-[13px] text-white placeholder-white/25 outline-none" style={field} />
    </div>
  );
}

function Secret({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-white/60">{label}</label>
      <div className="flex items-center rounded-xl pr-2" style={field}>
        <input type={show ? "text" : "password"} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent px-3.5 py-2.5 font-mono text-[13px] text-white placeholder-white/25 outline-none" />
        <button type="button" onClick={() => setShow((s) => !s)} className="shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white" aria-label={show ? "Hide" : "Show"}>
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

function Segment({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-white/60">{label}</label>
      <div className="inline-flex gap-1 rounded-xl p-1" style={field}>
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)} className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors" style={value === val ? { background: "linear-gradient(135deg,#ff3645,#c4101c)", color: "#fff" } : { color: "#b9a9ab" }}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}
