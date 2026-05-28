import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { MetricsCard } from "@/components/MetricsCard";
import { ManifestoSection } from "@/components/ManifestoSection";
import { SpotlightSection } from "@/components/SpotlightSection";
import { SignalsSection } from "@/components/SignalsSection";
import { ProcessSection } from "@/components/ProcessSection";
import { LiveDemo } from "@/components/LiveDemo";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <MetricsCard />
      <ManifestoSection />
      <SpotlightSection />
      <SignalsSection />
      <ProcessSection />
      <LiveDemo />
      <CTASection />
      <Footer />
    </main>
  );
}
