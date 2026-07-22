import Link from "next/link";
import Image from "next/image";
import DesignShell from "@/components/design/DesignShell";
import { TOOLS, type Tool } from "@/lib/tools";

export const metadata = { title: "Create — Reelo" };

const AVATAR_GROUP = ["custom-avatar-creator", "ai-avatar-studio", "talking-photo"];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/create/${tool.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-red-900/30">
      <Image src={tool.poster} alt={tool.title} fill sizes="(max-width:640px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-6">
        <span className="mb-2 block h-1 w-8 sm:mb-4 sm:w-10 rounded-full bg-gradient-to-r from-amber-400 to-red-500" />
        <h3 className="font-display text-base font-bold tracking-tight sm:text-2xl">{tool.title}</h3>
        <p className="mt-1 hidden text-sm text-white/70 sm:block">{tool.tagline}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 sm:mt-4 sm:text-sm">
          Open studio
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
    </Link>
  );
}

export default function CreatePage() {
  const group = AVATAR_GROUP.map((s) => TOOLS.find((t) => t.slug === s)).filter(Boolean) as Tool[];
  const rest = TOOLS.filter((t) => !AVATAR_GROUP.includes(t.slug));

  return (
    <DesignShell glow="radial-gradient(900px 450px at 50% -10%,rgba(225,29,42,.22),transparent 65%),radial-gradient(700px 500px at 95% 30%,rgba(140,12,20,.12),transparent 60%)">
      <section className="mx-auto max-w-[1100px] px-8 pb-2 pt-10 text-center">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ff5663" }}>AI Creation Studio</div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          What do you want to <span style={{ color: "#ff2d3f" }}>create?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[16px]" style={{ color: "#a99a9c" }}>
          Pick a tool, add your idea, and Reelo builds the video — ready in 3–4 clicks.
        </p>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pt-8">
        <h2 className="font-display mb-4 text-lg font-bold">Avatar <span style={{ color: "#ff2d3f" }}>Studio</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
          {group.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-16 pt-12">
        <h2 className="font-display mb-4 text-lg font-bold">More creation tools</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {rest.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </section>
    </DesignShell>
  );
}
