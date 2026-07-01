import HeroIndex from "@/components/design/HeroIndex";
import FeatureGrid from "@/components/design/FeatureGrid";
import SpeedBand from "@/components/design/SpeedBand";
import SiteFooter from "@/components/design/SiteFooter";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(900px 600px at 78% 8%,rgba(225,29,42,.20),transparent 60%),radial-gradient(700px 500px at 5% 40%,rgba(140,12,20,.16),transparent 60%),radial-gradient(circle at 50% 100%,rgba(225,29,42,.10),transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "radial-gradient(rgba(255,70,85,.07) 1px,transparent 1px)", backgroundSize: "26px 26px" }}
      />

      <div className="relative z-[1]">
        <main className="flex-1">
          <HeroIndex />
          <Reveal>
            <FeatureGrid />
          </Reveal>
          <Reveal>
            <SpeedBand />
          </Reveal>
          <Reveal>
            <FeaturesSection />
          </Reveal>
          <Reveal>
            <HowItWorksSection />
          </Reveal>
          <Reveal>
            <Pricing />
          </Reveal>
          <Reveal>
            <Faq />
          </Reveal>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
