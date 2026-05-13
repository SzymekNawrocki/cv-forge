import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingCta } from "@/components/landing/LandingCta";

export default function HomePage() {
  return (
    <main style={{ background: '#0D0D0E' }}>
      <LandingHero />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingCta />
    </main>
  );
}
