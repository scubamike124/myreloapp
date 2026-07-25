import Link from "next/link";

const glow = (px: number) => ({ filter: `drop-shadow(0 0 ${px}px rgba(225,29,42,.85))` });

function hex(r: number) {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    p.push(`${(140 + r * Math.cos(a)).toFixed(1)},${(140 + r * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}

function Phase1Art() {
  return (
    <svg viewBox="0 0 280 280" className="h-full w-full" style={glow(10)}>
      <defs><linearGradient id="fp1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff6b73" /><stop offset="1" stopColor="#c4101c" /></linearGradient></defs>
      {[126, 104, 82].map((r, i) => <polygon key={r} points={hex(r)} fill="none" stroke="#ff3645" strokeWidth={2 - i * 0.3} opacity={0.35 + i * 0.2} strokeLinejoin="round" />)}
      <polygon points={hex(60)} fill="rgba(12,5,6,.92)" stroke="rgba(255,70,85,.5)" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="122,112 174,140 122,168" fill="url(#fp1)" />
      {[[40, 60], [240, 70], [44, 220], [236, 210], [140, 18], [140, 262]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#ff5663" />)}
    </svg>
  );
}
function Phase2Art() {
  return (
    <svg viewBox="0 0 280 280" className="h-full w-full" style={glow(10)}>
      <defs><linearGradient id="fp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6b73" /><stop offset="1" stopColor="#c4101c" /></linearGradient></defs>
      <circle cx="140" cy="130" r="104" fill="none" stroke="rgba(255,70,85,.22)" strokeWidth="1.5" />
      <ellipse cx="140" cy="232" rx="92" ry="20" fill="none" stroke="#ff3645" strokeWidth="2" opacity=".5" />
      <ellipse cx="140" cy="214" rx="70" ry="15" fill="rgba(40,10,14,.7)" stroke="#ff3645" strokeWidth="2" />
      {[100, 140, 180].map((x, i) => (
        <g key={x} fill="rgba(20,8,10,.95)" stroke="#ff3645" strokeWidth="1.6">
          <circle cx={x} cy={i === 1 ? 150 : 162} r="11" /><path d={`M${x - 15} ${i === 1 ? 205 : 210} q15 -28 30 0 Z`} />
        </g>
      ))}
      <g>
        <path d="M124 78 H156 V96 a16 16 0 0 1 -32 0 Z" fill="url(#fp2)" stroke="#ff9098" strokeWidth="1.2" />
        <path d="M124 82 H114 a8 8 0 0 0 10 10 M156 82 H166 a8 8 0 0 1 -10 10" fill="none" stroke="#ff5663" strokeWidth="2.5" />
        <rect x="135" y="112" width="10" height="12" fill="url(#fp2)" /><rect x="124" y="124" width="32" height="7" rx="2" fill="url(#fp2)" />
        <polygon points="140,80 143,87 150,87 144,91 146,98 140,94 134,98 136,91 130,87 137,87" fill="#fff5f5" />
      </g>
    </svg>
  );
}
function Phase3Art() {
  const bars = [[64, 60], [108, 95], [152, 122], [196, 150], [232, 172]];
  return (
    <svg viewBox="0 0 280 280" className="h-full w-full" style={glow(10)}>
      <defs><linearGradient id="fp3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6b73" /><stop offset="1" stopColor="#8c0c14" /></linearGradient></defs>
      {bars.map(([x, h], i) => <rect key={i} x={x} y={222 - h} width="28" height={h} rx="3" fill="url(#fp3)" stroke="rgba(255,120,120,.4)" strokeWidth="1" />)}
      <path d="M52 196 L108 150 L150 168 L210 96 L246 64" fill="none" stroke="#ff3645" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="246,58 264,66 244,82" fill="#ff3645" />
      <line x1="44" y1="224" x2="262" y2="224" stroke="rgba(255,70,85,.35)" strokeWidth="2" />
    </svg>
  );
}

const PHASES = [
  { n: "Phase 1", title: "Core Creation Studio", Art: Phase1Art, items: ["AI Avatars", "Talking Photos", "Dancing Photos", "AI Voices", "AI Videos", "Commercials & Product Videos", "20 Shorts from One Description"] },
  { n: "Phase 2", title: "Growth & Engagement", Art: Phase2Art, items: ["Groups & Social", "Trend AI – What's Working Now", "Greeting Videos (Birthdays, Holidays)", "Leaderboards & Challenges"] },
  { n: "Phase 3", title: "Scale & Automation", Art: Phase3Art, items: ["TikTok/Instagram/YouTube Scheduling", "Advanced Analytics", "Batch Creation & Queue", "Product Commercial Engine", "Enterprise & Team Tools"] },
];

function CircleCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" style={{ filter: "drop-shadow(0 0 5px rgba(225,29,42,.6))" }}>
      <circle cx="12" cy="12" r="10" stroke="#ff3645" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-6" stroke="#ff3645" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeaturesSection() {
  return (
    <div id="features" className="scroll-mt-24">
      <section className="mx-auto max-w-[1200px] px-8 pb-1.5 pt-9 text-center">
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-[44px] sm:leading-[1.08]">
          Powerful <span style={{ color: "#ff2d3f" }}>Features.</span>
          <br />
          Professional Results.
        </h2>
        <p className="mx-auto mt-4 max-w-[480px] text-[17px] leading-[1.6]" style={{ color: "#a99a9c" }}>
          Reelo gives you everything you need to create viral content and grow your brand.
        </p>
      </section>

      <section className="mx-auto flex max-w-[720px] flex-col gap-4 px-6 pb-2.5 pt-8">
        {PHASES.map(({ n, title, Art, items }) => (
          <div key={n} className="grid grid-cols-1 items-center gap-5 rounded-[18px] p-4 sm:p-5 lg:grid-cols-[150px_1fr]" style={{ border: "1px solid rgba(255,70,85,.35)", background: "linear-gradient(180deg,rgba(28,9,12,.55),rgba(10,5,7,.5))", boxShadow: "0 0 44px -18px rgba(225,29,42,.5),inset 0 0 44px -30px rgba(225,29,42,.5)" }}>
            <div className="mx-auto aspect-square w-full max-w-[140px]"><Art /></div>
            <div>
              <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "#ff2d3f" }}>{n}</div>
              <h3 className="font-display mb-3 text-[19px] font-bold tracking-[-0.01em] sm:text-[22px]">{title}</h3>
              <ul className="grid gap-2">
                {items.map((it) => <li key={it} className="flex items-start gap-2 text-[13px]" style={{ color: "#e7dada" }}><CircleCheck />{it}</li>)}
              </ul>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-start gap-4 rounded-[18px] px-[26px] py-[22px] sm:flex-row sm:items-center sm:gap-[18px]" style={{ border: "1px solid rgba(255,70,85,.22)", background: "radial-gradient(500px 160px at 10% 50%,rgba(225,29,42,.2),transparent 70%),rgba(18,7,9,.6)" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="#ff2d3f" className="shrink-0" style={glow(10)}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          <div className="flex-1">
            <div className="font-display text-lg font-bold">New features. Every week.</div>
            <div className="text-[13.5px]" style={{ color: "#a99a9c" }}>Built for creators. Built for results.</div>
          </div>
          <Link href="/#how-it-works" className="whitespace-nowrap rounded-[11px] px-5 py-[11px] text-sm font-bold text-white transition-colors hover:bg-[rgba(255,70,85,.12)]" style={{ border: "1px solid rgba(255,70,85,.4)" }}>See Roadmap</Link>
        </div>
      </section>
    </div>
  );
}
