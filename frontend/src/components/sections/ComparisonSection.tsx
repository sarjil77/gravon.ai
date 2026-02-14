import { motion } from "framer-motion";
import { Clock, Zap, Terminal, Key, Server, Download, Settings, Link2, CheckCircle2 } from "lucide-react";

// ── Traditional steps (the hard way) ────────────────────────────────────────

const traditionalSteps = [
  { icon: Server, label: "Rent & configure a cloud VM", time: "20 min" },
  { icon: Key, label: "Set up SSH keys + security", time: "10 min" },
  { icon: Terminal, label: "Install runtime & dependencies", time: "8 min" },
  { icon: Download, label: "Clone & build the AI framework", time: "12 min" },
  { icon: Settings, label: "Write config files & env vars", time: "10 min" },
  { icon: Key, label: "Wire up API keys + secrets", time: "5 min" },
  { icon: Link2, label: "Connect to Telegram + test", time: "10 min" },
  { icon: Download, label: "Set up monitoring & restarts", time: "15 min" },
];

const ComparisonSection = () => {
  return (
    <section id="comparison" className="relative py-24 px-4">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Stop wrestling with{" "}
            <span className="text-gradient">infrastructure</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Deploying an AI bot manually means 90+ minutes of DevOps pain.
            Gravon handles all of it — you just point and click.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Traditional ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Traditional Setup</h3>
                <p className="text-xs text-muted-foreground">~90 minutes if you know what you're doing</p>
              </div>
            </div>

            <div className="space-y-3">
              {traditionalSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50"
                >
                  <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">{step.label}</span>
                  <span className="text-xs font-mono text-red-400/80 shrink-0">{step.time}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="text-sm font-medium text-muted-foreground">Total time</span>
              <span className="font-display text-2xl font-bold text-red-400">90 min</span>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center italic">
              If you're non-technical, multiply by 10×
            </p>
          </motion.div>

          {/* ── Gravon.ai ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 md:p-8 border-primary/20 shadow-[0_0_60px_-15px_hsla(270,80%,60%,0.15)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple/20 to-cyan/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Gravon.ai</h3>
                <p className="text-xs text-muted-foreground">Three clicks, zero DevOps knowledge needed</p>
              </div>
            </div>

            <div className="space-y-4 py-8">
              {/* Three animated steps */}
              {[
                { num: 1, text: "Choose your AI brain", time: "10s" },
                { num: 2, text: "Select Telegram channel", time: "5s" },
                { num: 3, text: "Paste bot token & hit deploy", time: "~90s" },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-cyan/5 border border-primary/10"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {step.num}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{step.text}</span>
                  <span className="text-xs font-mono text-emerald-400 shrink-0">{step.time}</span>
                </motion.div>
              ))}

              {/* Done check */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2 pt-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Your bot is live!</span>
              </motion.div>
            </div>

            <div className="mt-2 flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-sm font-medium text-muted-foreground">Total time</span>
              <span className="font-display text-2xl font-bold text-gradient">~2 min</span>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Servers, SSH, and AI config are already set up — just waiting for you.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
