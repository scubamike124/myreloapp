import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment gateways — Reelo Admin" };

// This page previously collected live Stripe/PayPal secret keys into
// localStorage. That put long-lived payment credentials in browser storage
// where any XSS could read them, and they never reached a server that could
// use them anyway. Credentials now come from server environment variables
// only; this page reports whether they are present and never reads a value.
// Only booleans cross to the client.

const STRIPE_ICON =
  "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.007z";
const PAYPAL_ICON =
  "M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z";

type EnvVar = { name: string; label: string; set: boolean; secret: boolean; optional?: boolean };

function has(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0;
}

export default function AdminGateways() {
  const stripeVars: EnvVar[] = [
    { name: "STRIPE_PUBLISHABLE_KEY", label: "Publishable key", set: has("STRIPE_PUBLISHABLE_KEY"), secret: false },
    { name: "STRIPE_SECRET_KEY", label: "Secret key", set: has("STRIPE_SECRET_KEY"), secret: true },
    { name: "STRIPE_WEBHOOK_SECRET", label: "Webhook signing secret", set: has("STRIPE_WEBHOOK_SECRET"), secret: true },
  ];
  const paypalVars: EnvVar[] = [
    { name: "PAYPAL_CLIENT_ID", label: "Client ID", set: has("PAYPAL_CLIENT_ID"), secret: false },
    { name: "PAYPAL_CLIENT_SECRET", label: "Client secret", set: has("PAYPAL_CLIENT_SECRET"), secret: true },
    { name: "PAYPAL_WEBHOOK_ID", label: "Webhook ID", set: has("PAYPAL_WEBHOOK_ID"), secret: false, optional: true },
  ];

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-[28px]">Payment gateways</h1>
        <p className="mt-1 text-sm text-white/50">
          Credentials are read from server environment variables. Nothing is entered or stored in the browser.
        </p>
      </div>

      <div
        className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed"
        style={{ border: "1px solid rgba(255,159,67,.3)", background: "rgba(255,159,67,.07)", color: "#ffcf9a" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-px shrink-0"
          aria-hidden
        >
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
        <span>
          Billing is not wired up yet. Setting these variables makes the credentials available to the server, but no
          checkout flow consumes them so far — this page reports configuration status only.
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <GatewayCard title="Stripe" brandColor="#635bff" icon={STRIPE_ICON} vars={stripeVars} />
        <GatewayCard title="PayPal" brandColor="#0070ba" icon={PAYPAL_ICON} vars={paypalVars} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="font-display text-base font-bold">How to set these</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          Add them to <code className="text-[#ff8892]">.env.local</code> for local development, or to your host&apos;s
          environment settings (Vercel → Settings → Environment Variables) for deployments. Restart the server after
          changing them.
        </p>
      </div>
    </div>
  );
}

function GatewayCard({
  title,
  brandColor,
  icon,
  vars,
}: {
  title: string;
  brandColor: string;
  icon: string;
  vars: EnvVar[];
}) {
  const connected = vars.filter((v) => !v.optional).every((v) => v.set);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: brandColor }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d={icon} />
          </svg>
        </span>
        <div>
          <div className="font-display text-lg font-bold">{title}</div>
          <div className="text-xs font-medium" style={{ color: connected ? "#2ecc71" : "#9a8b8d" }}>
            {connected ? "● Credentials configured" : "○ Not configured"}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {vars.map((v) => (
          <li
            key={v.name}
            className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
            style={{ border: "1px solid rgba(255,70,85,.16)", background: "rgba(255,60,75,.03)" }}
          >
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/70">
                {v.label}
                {v.optional && <span className="ml-1.5 font-normal text-white/35">optional</span>}
              </div>
              <code className="block truncate font-mono text-[11px] text-white/35">{v.name}</code>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={
                v.set
                  ? { background: "rgba(46,204,113,.14)", color: "#2ecc71" }
                  : { background: "rgba(255,255,255,.07)", color: "#9a8b8d" }
              }
            >
              {v.set ? (v.secret ? "Set (hidden)" : "Set") : "Missing"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
