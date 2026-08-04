import Header from "@/components/Header";
import StoryLibrary from "@/components/storybook/StoryLibrary";

export const metadata = {
  title: "Story Library — Reelo",
  description: "Every storybook you have made, the characters in them, and the series they belong to.",
};

export default function StoriesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 text-white sm:px-6">
        <h1 className="text-2xl font-semibold">Story Library</h1>
        <p className="mt-1 mb-6 text-sm text-white/55">
          Every book you have made, and the characters who star in them.
        </p>
        <StoryLibrary />
      </main>
    </>
  );
}
