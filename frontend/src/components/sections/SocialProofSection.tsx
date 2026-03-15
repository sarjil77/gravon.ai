import { motion } from "framer-motion";
import { Zap, Shield, Clock, Code2 } from "lucide-react";

const metrics = [
  { value: "3", label: "AI Models" },
  { value: "<2 min", label: "Deploy Time" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "0", label: "DevOps Required" },
];

const reasons = [
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Pick a model, paste your bot token, click deploy. Your AI bot is live in under 2 minutes.",
  },
  {
    icon: Shield,
    title: "Isolated & Reliable",
    description:
      "Each bot runs in its own Docker container with automatic health checks and restart policies.",
  },
  {
    icon: Clock,
    title: "Pay As You Go",
    description:
      "No monthly subscriptions. Buy credit packs and only pay for what your Agents actually use.",
  },
  {
    icon: Code2,
    title: "Zero DevOps",
    description:
      "No servers, no Docker knowledge, no CLI. If you can copy-paste a bot token, you can ship an AI bot.",
  },
];

const SocialProofSection = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24"
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border/40 mb-24" />

        {/* Why Gravon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Why Gravon
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Built for builders who ship fast
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="solid-card p-6 flex gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">{r.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Built with */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-8">
            Built With
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-40">
            {["Anthropic", "OpenAI", "Google", "Telegram", "Docker"].map((name) => (
              <span
                key={name}
                className="font-display text-sm font-semibold text-muted-foreground tracking-wide"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
