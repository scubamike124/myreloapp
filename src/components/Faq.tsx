"use client";

import { useState } from "react";

const FAQS: [string, string][] = [
  ["What is Reelo?", "Reelo is an AI-powered video creation platform that turns ideas, photos, and scripts into professional videos in minutes — no editing skills required."],
  ["How does Reelo work?", "Choose your content, customize the voice, style, and music, then let AI generate your video. Download and share anywhere in 3–4 clicks."],
  ["Can I use my own photos?", "Yes. Upload any photo to create talking photos, dancing photos, or use it as a base for AI avatars and commercials."],
  ["Do I need editing skills?", "Not at all. You describe what you want and Reelo generates the video — no timeline, no editing software. Amber can also write your caption and pull current hashtags for you to post with it."],
  ["What video formats are supported?", "Export in vertical, square, and widescreen up to 4K — ready for TikTok, Instagram, YouTube, and more."],
  ["Can I cancel anytime?", "Yes. There are no contracts. Cancel anytime from your account settings, and your plan stays active until the end of the billing cycle."],
  ["Is there a watermark?", "The Free plan includes a Reelo watermark. All paid plans export watermark-free."],
  ["How does the token system work?", "Each video generation uses tokens based on length and quality. Plans refresh tokens monthly, and you can always top up if you need more."],
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative z-[4] mx-auto max-w-[720px] scroll-mt-24 px-8 pb-[70px] pt-[34px] text-center">
      <h1 className="font-display mb-3 text-4xl font-bold tracking-[-0.02em] sm:text-[44px]">How Can We Help?</h1>
      <p className="mb-[26px] text-base" style={{ color: "#a99a9c" }}>Find answers to common questions or get in touch with our support team.</p>

      {/* search */}
      <div className="mx-auto mb-9 flex max-w-[520px] items-center gap-[11px] rounded-[14px] px-[18px] py-3.5" style={{ border: "1px solid rgba(255,70,85,.22)", background: "rgba(255,60,75,.04)" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8e7f81" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <input placeholder="Search questions..." className="flex-1 border-none bg-transparent text-[14.5px] outline-none" style={{ color: "#f3e9e9" }} />
      </div>

      <div className="text-left">
        <div className="font-display mb-4 text-xl font-bold">Frequently Asked Questions</div>
        <div className="flex flex-col gap-[11px]">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="overflow-hidden rounded-[14px]" style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full cursor-pointer items-center justify-between gap-3.5 px-5 py-[17px] text-left text-[15px] font-semibold" style={{ color: "#f3e9e9" }}>
                  {q}
                  <span className="shrink-0 text-sm transition-transform" style={{ color: "#ff5663", transform: `rotate(${isOpen ? 180 : 0}deg)` }}>▾</span>
                </button>
                <div className={`grid overflow-hidden px-5 transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-[18px]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 text-sm leading-[1.6]" style={{ color: "#a99a9c" }}>{a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* contact band */}
      <div className="mt-[34px] flex flex-col items-center gap-5 rounded-[18px] px-[30px] py-[26px] text-left sm:flex-row" style={{ border: "1px solid rgba(255,70,85,.24)", background: "radial-gradient(500px 200px at 88% 50%,rgba(225,29,42,.18),transparent 70%),rgba(18,7,9,.5)" }}>
        <div className="flex-1">
          <div className="font-display text-[19px] font-bold">Still have questions?</div>
          <div className="mt-[3px] text-sm" style={{ color: "#a99a9c" }}>Our support team is here to help.</div>
        </div>
        <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full" style={{ border: "2px solid rgba(255,70,85,.45)", boxShadow: "0 0 24px rgba(225,29,42,.35)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff5663" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="2.5" y="13" width="4" height="7" rx="1.6" /><rect x="17.5" y="13" width="4" height="7" rx="1.6" /><path d="M20 20a4 4 0 0 1-4 3h-2" /></svg>
        </div>
        <a href="mailto:support@reelo.app" className="whitespace-nowrap rounded-xl px-6 py-[13px] text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)", boxShadow: "0 8px 22px rgba(225,29,42,.4)" }}>
          Contact Support
        </a>
      </div>
    </section>
  );
}
