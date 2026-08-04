import Link from "next/link";
import DesignShell from "@/components/design/DesignShell";

export const metadata = {
  title: "Add-ons — Reelo",
  description: "Optional add-ons and extras for your Reelo account.",
};

/**
 * Family seats are not billed yet. Keep this page honest until seat billing ships.
 */
export default function AddOnsPage() {
  return (
    <DesignShell glow="radial-gradient(800px 600px at 50% 30%,rgba(225,29,42,.16),transparent 60%)">
      <section className="mx-auto max-w-[640px] px-8 pb-[70px] pt-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#ff8a92" }}>
          Coming soon
        </p>
        <h1 className="font-display mb-3 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
          Family seats
        </h1>
        <p className="mb-6 text-base" style={{ color: "#a99a9c" }}>
          Shared family logins and per-seat billing are not available yet. Your account still has full access to
          Reelo&apos;s AI tools — we will open family seats here when billing is ready.
        </p>
        <div className="mx-auto mb-8 max-w-[420px] rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-left text-sm" style={{ color: "#cabcbe" }}>
          <div className="mb-2 font-semibold text-white">Planned for each seat</div>
          <ul className="list-disc space-y-1 pl-5">
            <li>Separate login and profile</li>
            <li>Own AI tools and videos</li>
            <li>Own storage and history</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg,#ff3645,#c4101c)",
              boxShadow: "0 10px 30px rgba(225,29,42,.45)",
            }}
          >
            Back to account
          </Link>
          <Link href="/create" className="text-sm underline" style={{ color: "#a99a9c" }}>
            Create a video
          </Link>
        </div>
      </section>
    </DesignShell>
  );
}
