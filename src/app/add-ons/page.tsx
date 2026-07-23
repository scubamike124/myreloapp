import Link from "next/link";
import DesignShell from "@/components/design/DesignShell";

export const metadata = { title: "Add-ons — Reelo", description: "Optional add-ons and extras for your Reelo account." };

const BENEFITS = ["Their own login & profile", "Their own AI tools & videos", "Their own storage & history", "Their own settings & preferences"];

const corners = [
  "left-[calc(50%-130px)] top-[34px]",
  "right-[calc(50%-130px)] top-[34px]",
  "left-[calc(50%-130px)] bottom-[34px]",
  "right-[calc(50%-130px)] bottom-[34px]",
];

export default function AddOnsPage() {
  return (
    <DesignShell glow="radial-gradient(800px 600px at 50% 30%,rgba(225,29,42,.16),transparent 60%)">
      <section className="mx-auto max-w-[760px] px-8 pb-[70px] pt-8 text-center">
        <h1 className="font-display mb-3 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
          Add Family Members
          <br />
          for Just <span style={{ background: "linear-gradient(120deg,#ff4a57,#c4101c)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>$10</span>
          <span className="text-2xl" style={{ color: "#a99a9c" }}>/month each</span>
        </h1>
        <p className="mb-3.5 text-base" style={{ color: "#a99a9c" }}>Everyone gets their own account, AI tools, and personal videos.</p>

        {/* network diagram */}
        <div className="relative mx-auto mb-[26px] mt-1.5 grid h-[300px] place-items-center">
          <div className="absolute h-[260px] w-[260px] rounded-full" style={{ background: "radial-gradient(circle,rgba(225,29,42,.28),transparent 65%)", animation: "pulseGlow 4s ease-in-out infinite" }} />
          <svg viewBox="0 0 360 280" width="360" height="280" className="absolute overflow-visible">
            <g stroke="rgba(255,70,85,.4)" strokeWidth="1.5" fill="none">
              <line x1="180" y1="140" x2="70" y2="70" />
              <line x1="180" y1="140" x2="290" y2="70" />
              <line x1="180" y1="140" x2="70" y2="210" />
              <line x1="180" y1="140" x2="290" y2="210" />
            </g>
          </svg>
          <div className="relative z-[2] grid h-[90px] w-[90px] place-items-center rounded-full" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 0 40px rgba(225,29,42,.6)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          {corners.map((pos, i) => (
            <div key={i} className={`absolute grid h-[54px] w-[54px] place-items-center rounded-full ${pos}`} style={{ background: "linear-gradient(160deg,#5a1a1f,#1a0a0c)", border: "2px solid rgba(255,70,85,.5)", boxShadow: "0 0 20px rgba(225,29,42,.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff8a92" strokeWidth="2"><circle cx="12" cy="9" r="3.2" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></svg>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-[26px] max-w-[420px] text-left">
          <div className="font-display mb-3.5 text-center text-[17px] font-bold">Each member gets:</div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2.5 text-sm" style={{ color: "#cabcbe" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff5663" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                {b}
              </div>
            ))}
          </div>
        </div>

        <p className="mb-[22px] text-sm" style={{ color: "#8e7f81" }}>Manage your family members anytime from your account settings.</p>
        <Link href="/account" className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 10px 30px rgba(225,29,42,.45)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add Family Member
        </Link>
      </section>
    </DesignShell>
  );
}
