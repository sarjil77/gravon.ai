import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free Trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Try it out — no credit card needed.",
    features: [
      "1 Telegram Bot",
      "100 messages included",
      "All AI models available",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
    badge: null,
  },
  {
    name: "Starter",
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: "For individuals who want unlimited AI power.",
    features: [
      "1 Telegram Bot",
      "Unlimited messages",
      "All AI models",
      "Usage dashboard",
      "Email support",
      "Bot restart & config",
    ],
    cta: "Get Started — $9/mo",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 24,
    description: "For power users & small businesses.",
    features: [
      "3 Telegram Bots",
      "Unlimited messages",
      "All AI models",
      "Custom system prompts",
      "Priority support",
      "Advanced analytics",
      "Webhook integrations",
    ],
    cta: "Go Pro — $29/mo",
    highlighted: false,
    badge: null,
  },
  {
    name: "Agency",
    monthlyPrice: 99,
    yearlyPrice: 84,
    description: "Manage bots for your clients at scale.",
    features: [
      "10 Telegram Bots",
      "Unlimited messages",
      "All AI models",
      "White-label config",
      "Dedicated support",
      "API access",
      "Team management",
      "Client billing tools",
    ],
    cta: "Contact Sales",
    highlighted: false,
    badge: null,
  },
];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-24 px-4">
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
            Start free. Scale when you're ready.
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card-hover p-6 flex flex-col ${
                plan.highlighted
                  ? "border-primary/40 shadow-[0_0_40px_-10px_hsla(270,80%,60%,0.2)]"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="inline-flex items-center gap-1.5 self-start mb-4 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </div>
              )}

              {plan.monthlyPrice === 0 && (
                <div className="inline-flex items-center gap-1.5 self-start mb-4 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                  <Gift className="h-3 w-3" />
                  Free
                </div>
              )}

              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">{plan.description}</p>

              <div className="mb-5">
                <motion.span
                  key={yearly ? "y" : "m"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-3xl font-bold"
                >
                  ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                </motion.span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-muted-foreground text-sm">/month</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-cyan mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={
                  plan.highlighted
                    ? "glow-button w-full text-center text-sm"
                    : "glass-card w-full text-center py-3 font-medium text-sm hover:bg-muted/30 transition-colors"
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
