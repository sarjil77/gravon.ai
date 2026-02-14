import { motion } from "framer-motion";
import { Shield, Zap, Bot, Sparkles, BarChart3, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "One-Click Deploy",
    description: "Paste your bot token and we spin up a fully-configured AI assistant in under 60 seconds.",
  },
  {
    icon: Bot,
    title: "Multi-Model Choice",
    description: "Claude, GPT-4o, or Gemini — pick the brain behind your bot. Switch anytime.",
  },
  {
    icon: BarChart3,
    title: "Usage Dashboard",
    description: "Track messages, uptime, and token usage in real-time from your control panel.",
  },
  {
    icon: Shield,
    title: "Fully Managed Infra",
    description: "We handle servers, updates, and scaling. You focus on what your bot does.",
  },
  {
    icon: RefreshCw,
    title: "Always Online",
    description: "24/7 uptime with automatic restarts. Your bot never sleeps.",
  },
  {
    icon: Sparkles,
    title: "Powered by OpenClaw",
    description: "Built on the #1 open-source AI assistant with 190k+ GitHub stars.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Everything you need,{" "}
            <span className="text-gradient">nothing you don't</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We stripped away the complexity so you can focus on what matters — your business.
          </p>
        </motion.div>

        <div className="bento-grid md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card-hover p-6 md:p-8"
            >
              <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
