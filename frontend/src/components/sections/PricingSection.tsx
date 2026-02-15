import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "0",
    priceLabel: "$0",
    description: "Try it out — no credit card needed.",
    credits: "50 credits",
    features: [
      "50 free credits",
      "1 Telegram bot",
      "All AI models",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "9",
    priceLabel: "$9",
    description: "Great for getting started.",
    credits: "500 credits",
    features: [
      "500 credits",
      "1 Telegram bot",
      "All AI models",
      "Usage dashboard",
      "Email support",
    ],
    cta: "Buy Starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    priceLabel: "$29",
    description: "Best value for regular use.",
    credits: "2,000 credits",
    features: [
      "2,000 credits",
      "3 Telegram bots",
      "All AI models",
      "Priority support",
      "Advanced analytics",
      "Webhook integrations",
    ],
    cta: "Buy Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "79",
    priceLabel: "$79",
    description: "For heavy usage & teams.",
    credits: "6,000 credits",
    features: [
      "6,000 credits",
      "10 Telegram bots",
      "All AI models",
      "Dedicated support",
      "API access",
      "Team management",
      "White-label config",
    ],
    cta: "Buy Business",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Pricing
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pay-as-you-go credit packs. Start free, buy more when you need them.
          </p>
        </motion.div>

        {/* Credit cost explainer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-4 text-sm text-muted-foreground">
            <span>Credit cost per message:</span>
            <span className="text-foreground/80">Claude = 2</span>
            <span className="text-border">|</span>
            <span className="text-foreground/80">GPT-4o = 1</span>
            <span className="text-border">|</span>
            <span className="text-foreground/80">Gemini = 1</span>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`solid-card p-6 flex flex-col ${
                plan.highlighted ? "border-primary/40 relative" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                  Popular
                </div>
              )}

              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">{plan.description}</p>

              <div className="mb-6">
                <span className="font-display text-3xl font-bold">
                  {plan.priceLabel}
                </span>
                {plan.price !== "0" && (
                  <span className="text-muted-foreground text-sm ml-1.5">one-time</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={
                  plan.highlighted
                    ? "btn-primary w-full text-center text-sm"
                    : "btn-secondary w-full text-center text-sm"
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
