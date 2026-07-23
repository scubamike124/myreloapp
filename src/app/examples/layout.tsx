import type { Metadata } from "next";

// A client page cannot export metadata itself, so its SEO title and
// description live here in a server layout wrapping it.
export const metadata: Metadata = {
  title: "Examples — Reelo",
  description: "See what people make with Reelo — real AI-generated videos, avatars, commercials and stories.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
