import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto w-full">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-muted-foreground mb-6 tracking-wide uppercase"
          >
            AI Bot Deployment Platform
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-7"
          >
            Deploy AI Agents
            <br />
            <span className="text-accent-gradient">in 2 minutes.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Choose Claude, GPT-4o, or Gemini. Connect your Telegram bot.
            We handle the infrastructure — you focus on your business.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            <Link
              to="/auth"
              className="btn-primary text-base flex items-center gap-2"
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary text-base"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Proof line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 text-sm text-muted-foreground/70"
          >
            3 AI models &middot; &lt;2 min deploy &middot; 99.9% uptime &middot; Zero DevOps
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-xl border border-border/60 bg-[#0A0A0A] overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-[#141414] text-xs text-muted-foreground/50 font-mono">
                  gravon.ai/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup content */}
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Active Bots", value: "3" },
                  { label: "Messages Today", value: "1,247" },
                  { label: "Credits Left", value: "4,820" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-[#111] border border-border/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { name: "Support Bot", model: "Claude Sonnet 4", status: "Running", msgs: "892" },
                  { name: "Sales Assistant", model: "GPT-4o", status: "Running", msgs: "243" },
                  { name: "FAQ Bot", model: "Gemini Flash", status: "Running", msgs: "112" },
                ].map((bot) => (
                  <div
                    key={bot.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#111] border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-2 h-2">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                        <div className="relative w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{bot.name}</p>
                        <p className="text-xs text-muted-foreground">{bot.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-500">{bot.status}</p>
                      <p className="text-xs text-muted-foreground">{bot.msgs} msgs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
