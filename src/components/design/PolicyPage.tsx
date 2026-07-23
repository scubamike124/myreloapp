import Link from "next/link";
import DesignShell from "@/components/design/DesignShell";
import { BUSINESS } from "@/lib/legal";

/**
 * Shared frame for the support and policy pages.
 *
 * While BUSINESS.placeholder is true it renders a loud banner, so an
 * unfinished draft can never be mistaken for a policy the business is
 * actually bound by.
 */
export default function PolicyPage({
  title,
  intro,
  children,
  draft = BUSINESS.placeholder,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  /**
   * Whether to show the "not yet in force" banner. Defaults to the global
   * placeholder flag, but a page that no longer depends on any placeholder —
   * the Terms, which name no legal entity or address — passes `draft={false}`
   * so it reads as a finished policy while the others stay in draft.
   */
  draft?: boolean;
}) {
  return (
    <DesignShell>
      <main className="amber-safe mx-auto max-w-[820px] px-6 pb-20 pt-14 sm:px-9">
        {draft && (
          <div
            role="note"
            className="mb-8 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
            style={{ border: "1px solid rgba(255,159,67,.35)", background: "rgba(255,159,67,.08)", color: "#ffcf9a" }}
          >
            <strong className="font-bold">Draft — not yet in force.</strong> Every detail in square brackets is a
            placeholder. Fill them in at <code className="text-[#ffd9ae]">src/lib/legal.ts</code> and set{" "}
            <code className="text-[#ffd9ae]">placeholder: false</code> to remove this notice.
          </div>
        )}

        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-[40px] sm:leading-[1.08]">
          {title}
        </h1>
        <p className="mt-3 text-[15.5px] leading-[1.65] text-white/60">{intro}</p>
        <p className="mt-2 text-[13px] text-white/35">Last updated: {BUSINESS.lastUpdated}</p>

        <div className="mt-9 flex flex-col gap-7">{children}</div>

        <div className="mt-12 border-t border-white/10 pt-6 text-[13.5px] text-white/50">
          Still need a hand?{" "}
          <Link href="/support" className="underline underline-offset-2 hover:text-white">
            Contact support
          </Link>
          .
        </div>
      </main>
    </DesignShell>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-white sm:text-xl">{heading}</h2>
      <div className="mt-2 flex flex-col gap-2.5 text-[14.5px] leading-[1.7] text-white/62">{children}</div>
    </section>
  );
}
