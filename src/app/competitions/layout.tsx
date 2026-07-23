import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Competitions — Reelo",
  description: "Reelo competitions — enter, compete and win with your AI-made videos.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
