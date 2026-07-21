import Header from "@/components/Header";
import LibraryGrid from "@/components/library/LibraryGrid";

export const metadata = { title: "Video Library — Reelo" };

export default function LibraryPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 text-white sm:px-6">
        <LibraryGrid />
      </main>
    </>
  );
}
