import DesignShell from "@/components/design/DesignShell";

export const metadata = { title: "Roadmap — Reelo", description: "What is live in Reelo today and what is coming next." };

type Group = { name: string; items: string[] };
type Phase = { n: number; title: string; tag: string; groups: Group[] };

const PHASES: Phase[] = [
  {
    n: 1, title: "Core Platform", tag: "Launch",
    groups: [
      { name: "AI Creation Tools", items: ["Talking Photo", "Dancing Photo", "AI Avatar Studio", "Custom Avatar Creator", "Revoice", "Website → 30-Second Commercial Generator", "Create 20 Shorts from Website or Prompt", "Product Commercial Generator", "AI Story Maker", "Translate Videos into Multiple Languages"] },
      { name: "Avatar System", items: ["700+ curated avatar roadmap", "Creator & Host categories", "Saved Custom Avatars", "Favorites", "Voice previews", "Multiple languages", "Accent presets", "Gender filters", "Style filters"] },
      { name: "Website Commercials", items: ["AI scans website", "Generates script", "Uses uploaded business photos first", "Creates cinematic commercial", "AI voiceover", "Music", "Download", "Share", "Copy Link", "Generate 20 Shorts", "One-click regeneration"] },
      { name: "Shorts Generator", items: ["Generate from website", "Generate from prompt", "Generate from uploaded photos", "AI narration", "Multiple voice styles", "Multiple languages"] },
      { name: "Business Hub", items: ["Dedicated workspace for every business", "Video Library", "Saved Projects", "Assets", "Brand Kit", "Recent Activity", "Every generated video automatically saved"] },
      { name: "User Experience", items: ["Mobile-first design", "Extremely simple workflow", "3–4 clicks to create content", "Fast generation", "High-quality output"] },
      { name: "Payments", items: ["Stripe subscriptions", "Token system", "Admin unlimited testing", "Token refunds on failures"] },
      { name: "Every Generated Video Includes", items: ["Download", "Share", "Copy Link", "Create Another", "TikTok", "Instagram", "Facebook", "YouTube"] },
      { name: "Launch Requirements", items: ["Stable", "Bug free", "Premium quality", "Fast", "Mobile optimized"] },
    ],
  },
  {
    n: 2, title: "Retention & Growth", tag: "Growth",
    groups: [
      { name: "Business Hub Pro", items: ["Connect TikTok", "Connect Instagram", "Connect Facebook", "Connect YouTube", "Scheduled posting", "Cross-posting", "Analytics", "Revenue dashboard", "Conversion tracking", "Trend AI", "Clone My Winner", "AI Content Calendar", "AI Growth Recommendations"] },
      { name: "Trend AI", items: ["What's Trending", "Viral Hooks", "Trending Formats", "Trending Audio", "AI Recommendations", "One-click trend creation"] },
      { name: "AI Quality Enhancement", items: ["Face enhancement", "Motion enhancement", "Upscaling", "HD exports", "Texture improvements", "Premium render mode"] },
      { name: "AI Prompt Builder", items: ["Simple controls", "AI writes advanced prompts", "Camera movement", "Style", "Pacing", "Lighting", "Effects"] },
      { name: "Social Features", items: ["Groups", "Friends", "Family Groups", "Work Groups", "Birthday Videos", "Greeting Cards", "Holiday Videos", "Revenge Videos", "Notifications", "Response reminders"] },
      { name: "Avatar Battles", items: ["Dance Battles", "Roast Battles", "Comedy Battles", "AI Judges", "Scorecards", "Leaderboards", "Weekly competitions", "Seasons", "Championships"] },
      { name: "Music", items: ["Upload your own music", "Dance to custom songs", "AI synchronization"] },
      { name: "AI Story Expansion", items: ["Multi-episode stories", "Continuing series", "Character consistency", "Story memory"] },
    ],
  },
  {
    n: 3, title: "Community & Platform Expansion", tag: "Expansion",
    groups: [
      { name: "Story & Memory Generator", items: ["Family stories", "Pet stories", "Fantasy stories", "Anime stories", "Children's stories", "Tribute videos", "Memorial videos", "Wedding stories", "Vacation stories", "Life milestone videos"] },
      { name: "Community Platform", items: ["Public profiles", "Followers", "Friends", "Family history", "Shared memories", "Inside jokes", "Traditions", "Family challenges", "Community challenges"] },
      { name: "AI Competitions", items: ["National competitions", "Team competitions", "Tournament brackets", "AI scoring", "Community voting", "Championship events", "Seasonal events"] },
      { name: "Advanced AI", items: ["AI Commentators", "AI Hosts", "AI Coaches", "AI Story Directors", "AI Producers"] },
      { name: "Future Expansion", items: ["More AI video styles", "More commercial generators", "More avatar types", "More entertainment modes", "Enterprise tools", "White-label platform", "API integrations", "Advanced creator ecosystem"] },
    ],
  },
];

const GOAL = ["AI Video Creation", "AI Avatars", "Website-to-Commercial", "Product Commercials", "AI Storytelling", "Social Sharing", "Business Marketing", "Content Automation", "Community Features", "AI Entertainment"];

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors hover:border-[rgba(255,70,85,.4)] hover:text-white" style={{ border: "1px solid rgba(255,70,85,.15)", background: "rgba(255,60,75,.03)", color: "#cabcbe" }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#ff3645", boxShadow: "0 0 6px rgba(225,29,42,.8)" }} />
      {label}
    </span>
  );
}

export default function RoadmapPage() {
  return (
    <DesignShell glow="radial-gradient(900px 450px at 50% -10%,rgba(225,29,42,.22),transparent 65%),radial-gradient(700px 500px at 0% 35%,rgba(140,12,20,.12),transparent 60%)">
      <section className="mx-auto max-w-[1100px] px-8 pb-3 pt-10 text-center">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ff5663" }}>Product Roadmap</div>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-[52px] sm:leading-[1.04]">
          Reelo <span style={{ color: "#ff2d3f" }}>Roadmap</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-[16px]" style={{ color: "#a99a9c" }}>
          From launch to a complete AI video platform — built in three phases across creation, growth, and community.
        </p>
        <div className="mx-auto mt-7 flex flex-wrap justify-center gap-2">
          {PHASES.map((p) => (
            <a key={p.n} href={`#phase-${p.n}`} className="rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors hover:text-white" style={{ border: "1px solid rgba(255,70,85,.2)", color: "#b9a9ab" }}>
              Phase {p.n} · {p.title}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-[1100px] flex-col gap-8 px-6 pb-10 pt-8">
        {PHASES.map((p) => (
          <div key={p.n} id={`phase-${p.n}`} className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-4">
              <span className="font-display grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl font-bold" style={{ border: "2px solid rgba(255,45,63,.7)", boxShadow: "0 0 22px rgba(225,29,42,.5),inset 0 0 14px rgba(225,29,42,.35)" }}>{p.n}</span>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: "#ff5663" }}>Phase {p.n}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}>{p.tag}</span>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-[-0.01em] sm:text-3xl">{p.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.groups.map((g) => (
                <div key={g.name} className="rounded-2xl p-5" style={{ border: "1px solid rgba(255,70,85,.18)", background: "linear-gradient(180deg,rgba(24,9,12,.5),rgba(10,5,7,.5))" }}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-display text-[15px] font-bold">{g.name}</h3>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "#ff8a92", background: "rgba(255,70,85,.12)" }}>{g.items.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">{g.items.map((it) => <Chip key={it} label={it} />)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* long-term goal */}
        <div className="rounded-[24px] p-7 sm:p-9" style={{ border: "1px solid rgba(255,70,85,.3)", background: "radial-gradient(600px 220px at 50% 0,rgba(225,29,42,.22),transparent 70%),rgba(14,6,8,.6)" }}>
          <div className="text-center">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#ff5663" }}>Long-Term Goal</div>
            <h2 className="font-display mx-auto max-w-[720px] text-2xl font-bold sm:text-3xl">
              The most complete AI video creation platform available.
            </h2>
            <p className="mx-auto mt-3 max-w-[640px] text-[15px]" style={{ color: "#a99a9c" }}>
              A platform where businesses and creators produce premium-quality AI content in minutes — from a phone or computer — while continuously expanding into social, storytelling, marketing, and community experiences.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {GOAL.map((g) => <Chip key={g} label={g} />)}
          </div>
        </div>
      </section>
    </DesignShell>
  );
}
