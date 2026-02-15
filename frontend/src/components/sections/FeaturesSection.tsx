import { motion } from "framer-motion";
import { Zap, Shield, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Three-click deploy",
    description:
      "Choose a model, paste your Telegram token, and deploy. Your AI bot is live in under 2 minutes — no terminal, no config files, no DevOps.",
    visual: (
      <div className="rounded-lg bg-[#0A0A0A] border border-border/40 p-5 space-y-3">
        {["Claude Sonnet 4", "GPT-4o", "Gemini Flash"].map((model, i) => (
          <div
            key={model}
            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all ${
              i === 0
                ? "bg-primary/10 border border-primary/20 text-foreground"
                : "border border-border/30 text-muted-foreground"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary" : "bg-[#333]"}`} />
            {model}
            {i === 0 && <span className="ml-auto text-xs text-primary">Selected</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Shield,
    title: "Isolated & secure",
    description:
      "Each bot runs in its own container with dedicated resources. Your API keys are encrypted at rest and never touch shared storage. Full tenant isolation.",
    visual: (
      <div className="rounded-lg bg-[#0A0A0A] border border-border/40 p-5 font-mono text-xs space-y-2">
        <div className="text-muted-foreground">
          <span className="text-emerald-400">$</span> docker ps
        </div>
        <div className="text-muted-foreground/70 leading-relaxed">
          <div>CONTAINER ID &nbsp; STATUS &nbsp;&nbsp;&nbsp; NAMES</div>
          <div>a1b2c3d4 &nbsp;&nbsp;&nbsp;&nbsp; Up 3h &nbsp;&nbsp;&nbsp; gravon-tenant-a1b2</div>
          <div>e5f6g7h8 &nbsp;&nbsp;&nbsp;&nbsp; Up 12h &nbsp;&nbsp; gravon-tenant-e5f6</div>
          <div>i9j0k1l2 &nbsp;&nbsp;&nbsp;&nbsp; Up 42h &nbsp;&nbsp; gravon-tenant-i9j0</div>
        </div>
        <div className="pt-1 text-emerald-400/70">3 containers running · 0 issues</div>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    title: "Self-healing bots",
    description:
      "Auto-restart on crash. Health checks every 30 seconds. Your bot recovers before users even notice — with full uptime monitoring in your dashboard.",
    visual: (
      <div className="rounded-lg bg-[#0A0A0A] border border-border/40 p-5 space-y-3">
        {[
          { time: "14:32:01", event: "Health check passed", status: "ok" },
          { time: "14:32:31", event: "Health check passed", status: "ok" },
          { time: "14:33:01", event: "Process exited (OOM)", status: "error" },
          { time: "14:33:02", event: "Container restarting...", status: "warn" },
          { time: "14:33:04", event: "Bot back online", status: "ok" },
        ].map((log) => (
          <div key={log.time + log.event} className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted-foreground/50">{log.time}</span>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                log.status === "ok"
                  ? "bg-emerald-500"
                  : log.status === "error"
                  ? "bg-red-400"
                  : "bg-yellow-400"
              }`}
            />
            <span className="text-muted-foreground">{log.event}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Platform
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Built for reliability
          </h2>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${
                i % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              {/* Text */}
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <feature.icon className="h-5 w-5 text-primary mb-5" />
                <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Visual */}
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                {feature.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
