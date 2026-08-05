import Link from "next/link";
import DesignShell from "@/components/design/DesignShell";

/*
 * Community — honest placeholder.
 *
 * This page previously published invented numbers and invented people: "128K
 * Creators", "2.4M Videos Shared", "412 Active Challenges", four named creators
 * with follower counts, three challenges with entry counts, and an activity feed
 * timestamped "5m ago" as though it were live. None of it existed. The site had
 * 38 registered accounts at the time.
 *
 * That is not decoration — it is a false statement of popularity made to people
 * deciding whether to pay, which is the kind of claim advertising regulators
 * treat as misleading and the kind a customer feels cheated by on discovering
 * it.
 *
 * There is no community feature to switch on, so the numbers could not be made
 * true and came off instead. The route stays because the header and the footer
 * both link to it, and a dead link is its own defect.
 *
 * To bring this back: build the feature, then read real counts from the
 * database. Do not reintroduce a hard-coded STATS array.
 */

export const metadata = {
  title: "Community — Reelo",
  description: "Sharing and challenges are being built. Here is what exists today.",
};

const CARD = { border: "1px solid rgba(255,70,85,.18)", background: "rgba(20,10,12,.72)" };

export default function CommunityPage() {
  return (
    <DesignShell glow="radial-gradient(900px 450px at 50% -10%,rgba(225,29,42,.2),transparent 65%)">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-white">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ff5663" }}>
          Community
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Being built</h1>
        <p className="mt-3 max-w-[560px] text-[16px]" style={{ color: "#a99a9c" }}>
          Sharing, challenges and creator profiles are on the way. We would rather show you nothing than show you
          numbers we invented, so this page stays empty until there is something real on it.
        </p>

        <div className="mt-8 rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-semibold">What you can do today</h2>
          <ul className="mt-3 space-y-2 text-[14px]" style={{ color: "#c9babc" }}>
            <li>• Make videos, avatars and storybooks with the tools</li>
            <li>• Keep everything in your own library and story shelf</li>
            <li>• Download your work and share it wherever you like</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/create"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#ff3645,#c4101c)" }}
            >
              Start creating
            </Link>
            <Link
              href="/library"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ border: "1px solid rgba(255,70,85,.3)" }}
            >
              Your library
            </Link>
          </div>
        </div>
      </main>
    </DesignShell>
  );
}
