import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import AmberDock from "@/components/amber/AmberDock";
import MotherboardBackground from "@/components/design/MotherboardBackground";
import { SITE_URL } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const title = "Reelo — AI Video Creator for TikToks, Reels & Shorts";
const description =
  "Transform ideas, photos, and scripts into professional videos in minutes. No editing skills required.";

export const metadata: Metadata = {
  // Resolves relative URLs (canonical links, Open Graph images) against the
  // real domain once NEXT_PUBLIC_SITE_URL is set; localhost until then.
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Reelo",
    title,
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col text-foreground"
        suppressHydrationWarning
      >
        {/* The living board, mounted once behind every route. globals.css
            already reserves this: html carries the deep backdrop colour and
            body is transparent so the canvas shows through. */}
        <MotherboardBackground />
        {children}
        {/* There is only one Amber, mounted once for the whole platform. */}
        <AmberDock />
      </body>
    </html>
  );
}
