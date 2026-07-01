import Image from "next/image";
import Link from "next/link";

const card = { border: "1px solid rgba(255,70,85,.3)", background: "linear-gradient(180deg,rgba(26,9,12,.6),rgba(10,5,7,.55))", boxShadow: "0 0 40px -16px rgba(225,29,42,.5)" } as const;
const field = { border: "1px solid rgba(255,70,85,.22)" } as const;

const AVATARS = ["/assets/talking-selfie.jpg", "/assets/spokesperson.jpg", "/assets/avatar-business.jpg", "/assets/talking-photo.jpg"];

const SHARE = [
  { name: "TikTok", bg: "#000000", icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { name: "Instagram", bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", icon: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
  { name: "YouTube", bg: "#FF0000", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { name: "Facebook", bg: "#1877F2", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
];

function StepNum({ n }: { n: number }) {
  return (
    <div className="font-display grid h-[60px] w-[60px] place-items-center rounded-full text-2xl font-bold" style={{ border: "2px solid rgba(255,45,63,.7)", boxShadow: "0 0 22px rgba(225,29,42,.5),inset 0 0 14px rgba(225,29,42,.35)" }}>{n}</div>
  );
}
function Step1Card() {
  return (
    <div className="rounded-[20px] p-5 sm:p-6" style={card}>
      <div className="mb-4 flex gap-2.5">
        <div className="flex-1 rounded-[10px] py-2.5 text-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>Upload Photo</div>
        <div className="flex-1 rounded-[10px] py-2.5 text-center text-sm" style={{ ...field, color: "#b9a9ab" }}>AI Avatar</div>
        <div className="flex-1 rounded-[10px] py-2.5 text-center text-sm" style={{ ...field, color: "#b9a9ab" }}>Text/Script</div>
      </div>
      <div className="mb-4 flex flex-col items-center justify-center gap-1 rounded-xl py-6 text-center" style={{ border: "1.5px dashed rgba(255,70,85,.35)" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff3645" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(225,29,42,.6))" }}><path d="M12 16V8m0 0L8.5 11.5M12 8l3.5 3.5" /><path d="M6 16a4 4 0 0 1-.5-7.96 5.5 5.5 0 0 1 10.8-1A4.5 4.5 0 0 1 18 16" /></svg>
        <div className="text-[15px] font-semibold">Upload Your Photo</div>
        <div className="text-xs" style={{ color: "#8e7f81" }}>or drag and drop</div>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {AVATARS.map((src) => <div key={src} className="relative aspect-[5/6] overflow-hidden rounded-xl" style={field}><Image src={src} alt="" fill sizes="120px" className="object-cover" /></div>)}
      </div>
    </div>
  );
}
function Step2Card() {
  return (
    <div className="overflow-hidden rounded-[20px]" style={card}>
      <div className="relative aspect-[3/2] w-full">
        <Image src="/assets/edit preview video.png" alt="Customize your video preview" fill sizes="(min-width:1024px) 600px, 100vw" className="object-cover" priority={false} />
      </div>
    </div>
  );
}
function Step3Card() {
  return (
    <div className="rounded-[20px] p-5 sm:p-6" style={card}>
      <div className="relative mb-4 aspect-video overflow-hidden rounded-xl" style={field}>
        <Image src="/assets/the lady in white.png" alt="" fill sizes="600px" className="object-cover" />
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-white" style={{ background: "rgba(10,6,8,.72)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,70,85,.18)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4" /></svg>
          <span className="text-[11px] font-medium tabular-nums">00:03 / 00:30</span>
          <div className="relative h-[3px] flex-1 rounded-full" style={{ background: "rgba(255,255,255,.25)" }}><div className="h-full w-1/5 rounded-full" style={{ background: "linear-gradient(90deg,#ff3645,#c4101c)" }} /></div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold">Share to:</span>
        <div className="flex items-center gap-2.5">
          {SHARE.map((s) => (
            <span key={s.name} className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: s.bg }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={s.icon} /></svg>
            </span>
          ))}
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={field}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#cfbfc1"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, t: "Upload", d: "Upload a photo, choose an avatar, or write a script.", Card: Step1Card },
  { n: 2, t: "Customize", d: "Choose your voice, style, and length.", Card: Step2Card },
  { n: 3, t: "Generate", d: "Download and share to TikTok, Instagram, YouTube, and Facebook.", Card: Step3Card },
];

const BADGES = [
  { t: "Super Fast", d: "Videos ready in minutes.", icon: <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" /> },
  { t: "No Experience", d: "No editing skills needed.", icon: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></> },
  { t: "Cloud Based", d: "Create anywhere, anytime.", icon: <path d="M6 18a4 4 0 0 1-.5-7.96 5.5 5.5 0 0 1 10.8-1A4.5 4.5 0 0 1 18 18z" /> },
  { t: "Secure & Private", d: "Your content is safe with us.", icon: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></> },
];

export default function HowItWorksSection() {
  return (
    <div id="how-it-works" className="scroll-mt-24">
      <section className="mx-auto max-w-[1000px] px-8 pb-2 pt-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "#ff2d3f" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ff2d3f", boxShadow: "0 0 10px #ff2d3f" }} />
          It&apos;s That Simple
        </div>
        <h2 className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-[44px] sm:leading-[1.08]">
          Create Videos in
          <br />
          <span style={{ color: "#ff2d3f" }}>3 Easy</span> Steps
        </h2>
        <p className="mx-auto mt-3 max-w-[440px] text-base leading-[1.6]" style={{ color: "#a99a9c" }}>3–4 clicks. 2–3 decisions. Your video is ready in minutes.</p>
      </section>

      <section className="mx-auto flex max-w-[1000px] flex-col gap-7 px-6 pb-10 pt-6">
        {STEPS.map(({ n, t, d, Card }) => (
          <div key={n} className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <StepNum n={n} />
              <h3 className="font-display mt-4 text-[26px] font-bold leading-tight tracking-[-0.01em]">{t}</h3>
              <p className="mt-2.5 max-w-[260px] text-[15px] leading-[1.6]" style={{ color: "#a99a9c" }}>{d}</p>
            </div>
            <Card />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-6 rounded-[20px] px-6 py-8 sm:grid-cols-4" style={{ border: "1px solid rgba(255,70,85,.25)", background: "rgba(14,6,8,.5)" }}>
          {BADGES.map((b) => (
            <div key={b.t} className="flex flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ border: "1.5px solid rgba(255,70,85,.45)", boxShadow: "0 0 16px -4px rgba(225,29,42,.6)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3645" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(225,29,42,.6))" }}>{b.icon}</svg>
              </span>
              <div>
                <div className="text-[15px] font-bold">{b.t}</div>
                <div className="mt-0.5 text-xs" style={{ color: "#8e7f81" }}>{b.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-start gap-5 rounded-[20px] px-7 py-8 sm:flex-row sm:items-center sm:gap-7" style={{ border: "1px solid rgba(255,70,85,.3)", background: "radial-gradient(600px 200px at 12% 50%,rgba(225,29,42,.18),transparent 70%),rgba(16,7,9,.6)" }}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ border: "1.5px solid rgba(255,70,85,.4)", boxShadow: "0 0 24px -6px rgba(225,29,42,.6)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff3645" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 7px rgba(225,29,42,.8))" }}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 8-10 22 22 0 0 1 2 10 22 22 0 0 1-7 3zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
          </span>
          <div className="flex-1">
            <h3 className="font-display text-2xl font-bold tracking-[-0.01em] sm:text-[28px]">Ready to Create Something Amazing?</h3>
            <p className="mt-1.5 text-[15px] leading-[1.6]" style={{ color: "#a99a9c" }}>Join thousands of creators and businesses using Reelo.</p>
          </div>
          <Link href="/create" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 12px 30px -8px rgba(225,29,42,.6)" }}>
            Start Creating for Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
