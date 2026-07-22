import Link from "next/link";
import AppShell from "@/components/design/AppShell";
import AvatarLibrary from "@/components/avatars/AvatarLibrary";
import snapshot from "@/data/heygen-avatars.json";

export const metadata = {
  title: "Avatar Library — Reelo",
  description: "Browse every AI avatar available in Reelo and start a video with any of them.",
};

export default function AvatarsPage() {
  const count = (snapshot as unknown[]).length;

  return (
    <AppShell active="avatars">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
          Avatar Library
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] leading-[1.6] text-white/55">
          {count.toLocaleString()} AI avatars, ready to speak your script. Pick one and it opens straight into{" "}
          <Link href="/create/ai-avatar-studio" className="underline underline-offset-2 hover:text-white">
            AI Avatar Studio
          </Link>{" "}
          with that avatar already selected.
        </p>
      </div>

      <AvatarLibrary />
    </AppShell>
  );
}
