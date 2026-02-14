import { motion } from "framer-motion";
import { Check, Sparkles, Gift, Coins } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free Trial",
    price: 0,
    priceLabel: "Free",
    description: "Try it out — no credit card needed.",
    credits: "50 credits",
    features: [
      "50 free credits on signup",
      "1 Telegram Bot",
      "All AI models available",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
    badge: null,
  },
  {
    name: "Starter",
    price: 9,
    priceLabel: "$9",
    description: "500 credits — great for getting started.",
    credits: "500 credits",
    features: [
      "500 credits",
      "1 Telegram Bot",
      "All AI models",
      "Usage dashboard",
      "Email support",
    ],
    cta: "Buy Starter — $9",
    highlighted: false,
    badge: null,
  },
  {
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    description: "2,000 credits — best value for regular use.",
    credits: "2,000 credits",
    features: [
      "2,000 credits",
      "3 Telegram Bots",
      "All AI models",
      "Priority support",
      "Advanced analytics",
      "Webhook integrations",
    ],
    cta: "Buy Pro — $29",
    highlighted: true,
    badge: "Best Value",
  },
  {
    name: "Business",
    price: 79,
    priceLabel: "$79",
    description: "6,000 credits — for heavy usage & teams.",
    credits: "6,000 credits",
    features: [
      "6,000 credits",
      "10 Telegram Bots",
      "All AI models",
      "Dedicated support",
      "API access",
      "Team management",
      "White-label config",
    ],
    cta: "Buy Business — $79",
    highlighted: false,
    badge: null,
  },
];

const PricingSection = () => {
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
          <p className="text-muted-foreground text-lg mb-4">
            Pay-as-you-go credits. Start free, buy more when you need them.
          </p>

          {/* Credit cost explainer */}
          <div className="inline-flex items-center gap-4 glass-card px-5 py-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-cyan" />
              <span className="text-muted-foreground">Credit cost:</span>
            </span>
            <span className="text-orange-400 font-medium">Claude = 2/msg</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-emerald-400 font-medium">GPT-4o = 1/msg</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-blue-400 font-medium">Gemini = 1/msg</span>
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
                <span className="font-display text-3xl font-bold">
                  {plan.priceLabel}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground text-sm ml-1">one-time</span>
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
