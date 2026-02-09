import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 24,
    description: "Perfect for solo creators getting started.",
    features: [
      "1 WhatsApp Connection",
      "500 messages/month",
      "3 AI Templates",
      "Basic Analytics",
      "Email Support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 79,
    yearlyPrice: 65,
    description: "For growing businesses that need more power.",
    features: [
      "3 WhatsApp Connections",
      "5,000 messages/month",
      "All AI Templates",
      "Advanced Analytics",
      "Priority Support",
      "Custom Branding",
      "Team Access (3 seats)",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    monthlyPrice: 199,
    yearlyPrice: 169,
    description: "Manage multiple clients from one dashboard.",
    features: [
      "Unlimited Connections",
      "Unlimited messages",
      "All AI Templates + Custom",
      "White-label Dashboard",
      "Dedicated Support",
      "API Access",
      "Team Access (10 seats)",
      "Client Management",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="relative py-24 px-4">
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Start free. Upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 glass-card px-2 py-2">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-cyan">Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card-hover p-8 flex flex-col ${
                plan.highlighted
                  ? "border-primary/40 shadow-[0_0_40px_-10px_hsla(270,80%,60%,0.2)]"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="inline-flex items-center gap-1.5 self-start mb-4 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </div>
              )}

              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{plan.description}</p>

              <div className="mb-6">
                <motion.span
                  key={yearly ? "y" : "m"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-4xl font-bold"
                >
                  ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                </motion.span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-cyan mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={
                  plan.highlighted
                    ? "glow-button w-full text-center"
                    : "glass-card w-full text-center py-3.5 font-medium hover:bg-muted/30 transition-colors"
                }
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
