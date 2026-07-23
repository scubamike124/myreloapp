import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Prompt Builder — Reelo",
  description: "Build better prompts for Reelo — craft the perfect brief for your next video.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
