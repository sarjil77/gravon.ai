import { motion } from "framer-motion";
import { Shield, Zap, Bot, BarChart3, RefreshCw, Lock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Three-Click Deploy",
    description: "Choose a model, pick Telegram, paste your token. Your bot is live in under 2 minutes — no terminal needed.",
  },
  {
    icon: Bot,
    title: "Pick Your AI Brain",
    description: "Claude, GPT-4o, or Gemini Flash — each optimized for different strengths. Swap models anytime from your dashboard.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    description: "Monitor credits, message volume, and bot status in real-time. Know exactly what your bot is doing.",
  },
  {
    icon: Shield,
    title: "Zero DevOps",
    description: "No VPS, no Docker, no SSH. We provision and manage isolated containers for each bot automatically.",
  },
  {
    icon: RefreshCw,
    title: "Self-Healing Bots",
    description: "Auto-restart on crash, health checks every 30 seconds. Your bot recovers before users even notice.",
  },
  {
    icon: Lock,
    title: "Isolated & Secure",
    description: "Each bot runs in its own container with dedicated resources. Your API keys never touch shared storage.",
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
            Built different,{" "}
            <span className="text-gradient">on purpose</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every feature exists because deploying AI bots shouldn't require an engineering degree.
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
