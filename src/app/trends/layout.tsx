import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Trends — Reelo",
  description: "What is working now in short-form video — trending topics, hooks and styles for your next Reelo creation.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
