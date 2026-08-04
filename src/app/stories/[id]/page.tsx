import Header from "@/components/Header";
import StoryReader from "@/components/storybook/StoryReader";

export const metadata = { title: "Story — Reelo" };

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 text-white sm:px-6">
        <StoryReader storyId={id} />
      </main>
    </>
  );
}
