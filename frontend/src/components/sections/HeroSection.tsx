import { motion } from "framer-motion";
import { Zap, ArrowDown } from "lucide-react";

// ── Animated terminal that shows the deployment process ─────────────────────

const TerminalDemo = () => {
  const lines = [
    { text: "$ gravon deploy --model claude --channel telegram", delay: 0 },
    { text: "→ Validating bot token...", delay: 0.8, color: "text-cyan" },
    { text: "→ Provisioning server...", delay: 1.6, color: "text-cyan" },
    { text: "→ Configuring AI model (Claude Sonnet 4)...", delay: 2.4, color: "text-cyan" },
    { text: "→ Connecting to Telegram...", delay: 3.2, color: "text-cyan" },
    { text: "✓ @yourbot is LIVE!", delay: 4.0, color: "text-emerald-400" },
  ];

  return (
    <div className="glass-card p-1 rounded-2xl max-w-lg mx-auto">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
        <div className="h-3 w-3 rounded-full bg-red-500/60" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
        <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">gravon-deploy</span>
      </div>
      {/* Terminal body */}
      <div className="p-4 font-mono text-sm space-y-1.5 bg-black/20 rounded-b-xl min-h-[180px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: line.delay, duration: 0.3 }}
            className={line.color || "text-muted-foreground"}
          >
            {line.text}
          </motion.div>
        ))}
        {/* Blinking cursor */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 4.5, duration: 1, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-emerald-400 rounded-sm"
        />
      </div>
    </div>
  );
};

// ── Stats counter ───────────────────────────────────────────────────────────

const stats = [
  { label: "Bots Deployed", value: "2,400+" },
  { label: "Messages Sent", value: "1.2M+" },
  { label: "Avg Deploy Time", value: "47s" },
];

const StatsRow = () => (
  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mt-12">
    {stats.map((stat, i) => (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 + i * 0.15 }}
        className="text-center"
      >
        <p className="font-display text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
      </motion.div>
    ))}
  </div>
);

// ── Hero Section ────────────────────────────────────────────────────────────

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-cyan" />
            Powered by OpenClaw — the #1 open-source AI assistant
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your AI bot on Telegram
            <br />
            <span className="text-gradient">in under 60 seconds.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            Pick a model, paste your bot token, and we deploy a fully-managed
            AI assistant. No servers, no config files, no headaches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#deploy" className="glow-button-pulse text-base flex items-center gap-2">
              Deploy Your Bot Now
              <ArrowDown className="h-5 w-5" />
            </a>
            <a
              href="#comparison"
              className="glass-card px-8 py-4 text-foreground font-medium hover:bg-muted/30 transition-colors"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Terminal animation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 md:mt-20"
        >
          <TerminalDemo />
        </motion.div>

        {/* Stats */}
        <StatsRow />
      </div>
    </section>
  );
};

export default HeroSection;
