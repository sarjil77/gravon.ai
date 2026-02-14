import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Shield, Cpu, Clock, Wifi } from "lucide-react";

// ── Floating particle system (canvas-based) ─────────────────────────────────

const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      hue: number;
      alpha: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      hue: Math.random() > 0.5 ? 270 : 180, // purple or cyan
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
        ctx.fill();
      });

      // Draw faint connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(270, 60%, 60%, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

// ── 3D animated bot mascot ──────────────────────────────────────────────────

const BotMascot = () => (
  <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto" style={{ perspective: "800px" }}>
    {/* Glow backdrop */}
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          "radial-gradient(circle, hsla(270, 80%, 60%, 0.25) 0%, hsla(180, 80%, 60%, 0.1) 40%, transparent 70%)",
      }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Orbiting ring 1 */}
    <motion.div
      className="absolute inset-4 rounded-full border border-purple-500/20"
      animate={{ rotateX: 70, rotateZ: [0, 360] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      style={{ transformStyle: "preserve-3d" }}
    />

    {/* Orbiting ring 2 */}
    <motion.div
      className="absolute inset-8 rounded-full border border-cyan-400/20"
      animate={{ rotateX: 60, rotateZ: [360, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      style={{ transformStyle: "preserve-3d" }}
    />

    {/* The robot body */}
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative">
        {/* Head */}
        <motion.div
          className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl mx-auto"
          style={{
            background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(180 80% 60%))",
            boxShadow:
              "0 20px 60px -15px hsla(270, 80%, 60%, 0.5), inset 0 -4px 12px hsla(0, 0%, 0%, 0.3)",
          }}
          animate={{ rotateY: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Eyes */}
          <div className="absolute top-1/3 left-0 right-0 flex items-center justify-center gap-5 md:gap-6">
            <motion.div
              className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            />
            <motion.div
              className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              animate={{ scaleY: [1, 0.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            />
          </div>

          {/* Mouth / indicator */}
          <motion.div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 w-8 h-1.5 md:w-10 md:h-2 rounded-full bg-white/60"
            animate={{ width: ["2rem", "2.5rem", "2rem"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Antenna */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.div
              className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_16px_hsla(180,80%,60%,0.8)]"
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="w-0.5 h-4 bg-gradient-to-b from-cyan-400/80 to-transparent" />
          </div>
        </motion.div>

        {/* Body accent line */}
        <div className="w-16 h-1 mx-auto mt-2 rounded-full bg-gradient-to-r from-purple-500/40 via-cyan-400/40 to-purple-500/40" />
      </div>
    </motion.div>

    {/* Floating tech badges around the bot */}
    {[
      { icon: "🤖", angle: 30, delay: 0 },
      { icon: "⚡", angle: 150, delay: 1 },
      { icon: "🧠", angle: 270, delay: 2 },
    ].map((badge, i) => {
      const radius = 130;
      const x = Math.cos((badge.angle * Math.PI) / 180) * radius;
      const y = Math.sin((badge.angle * Math.PI) / 180) * radius;
      return (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-10 h-10 rounded-xl glass-card flex items-center justify-center text-lg"
          style={{ marginLeft: x - 20, marginTop: y - 20 }}
          animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: badge.delay * 0.5,
          }}
        >
          {badge.icon}
        </motion.div>
      );
    })}
  </div>
);

// ── Capability Stats ────────────────────────────────────────────────────────

const capabilities = [
  { icon: Cpu, label: "AI Models", value: "3 Top-Tier" },
  { icon: Clock, label: "Deploy Time", value: "< 2 min" },
  { icon: Wifi, label: "Uptime", value: "99.9%" },
  { icon: Shield, label: "Infrastructure", value: "Fully Managed" },
];

const CapabilitiesRow = () => (
  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-14">
    {capabilities.map((cap, i) => (
      <motion.div
        key={cap.label}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 + i * 0.12 }}
        className="glass-card px-5 py-3 flex items-center gap-3"
      >
        <cap.icon className="h-5 w-5 text-cyan shrink-0" />
        <div>
          <p className="font-display text-lg font-bold text-gradient">{cap.value}</p>
          <p className="text-xs text-muted-foreground">{cap.label}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

// ── Hero Section ────────────────────────────────────────────────────────────

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />
      <ParticleField />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Powered by OpenClaw — 190k+ Stars on GitHub
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Deploy AI bots
              <br />
              <span className="text-gradient">that actually work.</span>
            </h1>

            <p className="max-w-xl text-lg md:text-xl text-muted-foreground mb-10 mx-auto lg:mx-0">
              Three steps. Pick your AI brain, connect Telegram, and you're live.
              We handle the servers, scaling, and uptime — you focus on your business.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <a href="#deploy" className="glow-button-pulse text-base flex items-center gap-2">
                Deploy Your Bot
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

          {/* Right — 3D Bot Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <BotMascot />
          </motion.div>
        </div>

        {/* Capabilities */}
        <CapabilitiesRow />
      </div>
    </section>
  );
};

export default HeroSection;
