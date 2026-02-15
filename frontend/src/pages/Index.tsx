import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import DeployWizard from "../components/sections/DeployWizard";
import ComparisonSection from "../components/sections/ComparisonSection";
import TelegramDemoSection from "../components/sections/TelegramDemoSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import UseCasesSection from "../components/sections/UseCasesSection";
import SocialProofSection from "../components/sections/SocialProofSection";
import PricingSection from "../components/sections/PricingSection";
import CTASection from "../components/sections/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <SocialProofSection />
      <DeployWizard />
      <ComparisonSection />
      <FeaturesSection />
      <TelegramDemoSection />
      <UseCasesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
