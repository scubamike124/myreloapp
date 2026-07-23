import DesignShell from "@/components/design/DesignShell";
import HowItWorksSection from "@/components/sections/HowItWorksSection";

export const metadata = { title: "How It Works — Reelo", description: "Upload or describe what you want, customise it, and generate a finished video in minutes. No editing skills required." };

export default function HowItWorksPage() {
  return (
    <DesignShell glow="radial-gradient(800px 500px at 50% -5%,rgba(225,29,42,.16),transparent 60%),radial-gradient(700px 500px at 100% 40%,rgba(140,12,20,.14),transparent 60%)">
      <HowItWorksSection />
    </DesignShell>
  );
}
