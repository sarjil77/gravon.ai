import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const traditionalSteps = [
  "Rent & configure a cloud VM",
  "Set up SSH keys & firewalls",
  "Install runtime & dependencies",
  "Clone, build, and configure the AI framework",
  "Write env files & wire up API keys",
  "Connect to Telegram & debug webhooks",
  "Set up monitoring, logging & auto-restarts",
];

const gravonSteps = [
  { step: "Pick your AI model", time: "10 sec" },
  { step: "Paste your Telegram bot token", time: "15 sec" },
  { step: "Click deploy — bot is live", time: "~90 sec" },
];

const ComparisonSection = () => {
  return (
    <section id="comparison" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Why Gravon
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Stop wrestling with infrastructure
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Deploying an AI bot manually means 90+ minutes of DevOps.
            Gravon handles all of it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="solid-card p-8"
          >
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h3 className="font-display text-lg font-semibold">Traditional Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">If you know what you're doing</p>
              </div>
              <span className="font-display text-2xl font-bold text-red-400/80">~90 min</span>
            </div>

            <ul className="space-y-4">
              {traditionalSteps.map((step, i) => (
                <motion.li
                  key={step}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <X className="h-4 w-4 text-red-400/60 mt-0.5 shrink-0" />
                  {step}
                </motion.li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground/60 mt-6 italic">
              Non-technical? Multiply by 10x.
            </p>
          </motion.div>

          {/* Gravon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="solid-card p-8 border-primary/20"
          >
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <h3 className="font-display text-lg font-semibold">With Gravon</h3>
                <p className="text-sm text-muted-foreground mt-1">No DevOps knowledge needed</p>
              </div>
              <span className="font-display text-2xl font-bold text-emerald-400">~2 min</span>
            </div>

            <div className="space-y-5 py-4">
              {gravonSteps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-center gap-4"
                >
                  <div className="h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-foreground flex-1">{item.step}</span>
                  <span className="text-xs text-emerald-400/80 font-mono shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-2 mt-8 pt-6 border-t border-border/40"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Your bot is live and responding</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
