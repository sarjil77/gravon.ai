import Navbar from "../components/layout/Navbar";
import PricingSection from "../components/sections/PricingSection";

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <PricingSection />
      </div>
    </div>
  );
};

export default Pricing;
