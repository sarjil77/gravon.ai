import { motion } from "framer-motion";
import { MessageSquare, Brain, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ConnectionGraphic = () => (
  <div className="relative w-full max-w-lg mx-auto h-64 md:h-80">
    {/* Telegram node */}
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-[10%] top-1/2 -translate-y-1/2"
    >
      <div className="glass-card p-5 md:p-6">
        <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-green-400" />
        <p className="text-xs text-muted-foreground mt-2">Telegram</p>
      </div>
    </motion.div>

    {/* Connection line */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
      <motion.path
        d="M100,100 C180,100 220,100 300,100"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="8 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(270, 80%, 60%)" />
          <stop offset="100%" stopColor="hsl(180, 80%, 60%)" />
        </linearGradient>
      </defs>
    </svg>

    {/* Zap middle */}
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <Zap className="h-6 w-6 text-cyan" />
    </motion.div>

    {/* Calvio brain */}
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-[10%] top-1/2 -translate-y-1/2"
    >
      <div className="glass-card p-5 md:p-6 border-purple/30">
        <Brain className="h-8 w-8 md:h-10 md:w-10 text-purple" />
        <p className="text-xs text-muted-foreground mt-2">Gravon AI</p>
      </div>
    </motion.div>
  </div>
);

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
            The Human-First AI Platform
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            AI that just works.
            <br />
            <span className="text-gradient">No code, no complexity.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            Connect your Telegram, choose a template, and launch your AI assistant
            in under 60 seconds. Built for creators and small businesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing" className="glow-button-pulse text-base flex items-center gap-2">
              Start Your 7-Day Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="/#features" className="glass-card px-8 py-4 text-foreground font-medium hover:bg-muted/30 transition-colors">
              See How It Works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 md:mt-20"
        >
          <ConnectionGraphic />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
