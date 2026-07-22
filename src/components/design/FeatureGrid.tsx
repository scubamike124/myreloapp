// Artwork made for this grid: square, centred subject, near-black background
// with the site's red/orange glow. The repo's other imagery is bright 9:16
// video stills, which neither match the theme nor survive a square crop.
const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: "/assets/features/ai-avatars.webp", title: "AI Avatars", desc: "Realistic AI avatars that talk and engage." },
  { icon: "/assets/features/talking-photos.webp", title: "Talking Photos", desc: "Make any photo speak naturally." },
  { icon: "/assets/features/dancing-photos.webp", title: "Dancing Photos", desc: "Bring any photo to life with dance." },
  { icon: "/assets/features/ai-videos.webp", title: "AI Videos", desc: "Generate stunning videos with AI." },
  { icon: "/assets/features/commercials.webp", title: "Commercials", desc: "High-converting ads in minutes." },
  { icon: "/assets/features/ai-voices.webp", title: "AI Voices", desc: "Natural voices in multiple languages." },
];

const SOCIAL = [
  { name: "TikTok", icon: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  { name: "YouTube", icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { name: "Instagram", icon: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
  { name: "Facebook", icon: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" },
  { name: "Shopify", icon: "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" },
];

export default function FeatureGrid() {
  return (
    <section className="relative z-[4] mx-auto max-w-[1120px] px-6 py-14 sm:px-9">
      <div className="mb-4 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: "#ff2d3f" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ff2d3f", boxShadow: "0 0 10px #ff2d3f" }} />
        Powerful Tools. Endless Possibilities.
      </div>

      <h2 className="font-display text-center text-3xl font-bold tracking-[-0.02em] text-white sm:text-[42px] sm:leading-[1.1]">
        Everything You Need
        <br />
        to Create <span style={{ color: "#ff2d3f" }}>Amazing</span> Videos
      </h2>

      <p className="mx-auto mt-4 max-w-[500px] text-center text-[16px] leading-[1.6] text-white/55">
        Reelo combines AI power with simple tools to bring your ideas to life in minutes.
      </p>

      <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group flex flex-col items-center rounded-2xl px-5 py-8 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(255,70,85,.4)]"
            style={{ border: "1px solid rgba(255,70,85,.14)", background: "rgba(255,60,75,.03)" }}
          >
            <div
              className="mb-5 h-20 w-20 overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(255,70,85,.28)", boxShadow: "0 0 26px -8px rgba(255,54,69,.55)" }}
            >
              {/* object-contain, not cover: the whole picture stays visible
                  instead of being cropped to a slice of itself. */}
              <img src={f.icon} alt="" className="h-full w-full object-contain" loading="lazy" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
            <p className="mt-1.5 max-w-[210px] text-sm leading-[1.5] text-white/55">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* divider with spark */}
      <div className="mt-14 flex items-center justify-center gap-3">
        <span className="h-px w-full max-w-[300px]" style={{ background: "linear-gradient(90deg,transparent,rgba(255,70,85,.45))" }} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff2d3f" style={{ filter: "drop-shadow(0 0 6px rgba(255,54,69,.9))" }} className="shrink-0">
          <path d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8z" />
        </svg>
        <span className="h-px w-full max-w-[300px]" style={{ background: "linear-gradient(90deg,rgba(255,70,85,.45),transparent)" }} />
      </div>

      <div className="mt-6 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-white/45">
        Trusted by creators and businesses worldwide
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center text-[15px] font-semibold text-white">
        {SOCIAL.map((s, i) => (
          <div key={s.name} className="flex items-center">
            <span className="inline-flex items-center gap-2 px-4 py-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={s.icon} />
              </svg>
              {s.name}
            </span>
            {i < SOCIAL.length - 1 && <span className="h-4 w-px bg-white/20" />}
          </div>
        ))}
      </div>
    </section>
  );
}
