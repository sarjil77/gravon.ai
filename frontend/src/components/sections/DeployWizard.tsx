import { motion } from "framer-motion";
import { Bot, Send, Key } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Bot,
    title: "Choose your AI model",
    description:
      "Pick from Claude Sonnet 4, GPT-4o, or Gemini Flash. Each model is optimized for different strengths — switch anytime from your dashboard.",
  },
  {
    num: "02",
    icon: Send,
    title: "Connect Telegram",
    description:
      "Create a bot via @BotFather, copy the token, and paste it into Gravon. That's the only setup you'll ever do.",
  },
  {
    num: "03",
    icon: Key,
    title: "Go live instantly",
    description:
      "Hit deploy and your bot is live in under 2 minutes. We handle the container, networking, auto-restarts, and monitoring — zero config.",
  },
];

const DeployWizard = () => {
  return (
    <section id="how-it-works" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            How It Works
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            Three steps. Zero DevOps.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative"
            >
              {/* Step number */}
              <span className="font-display text-6xl font-bold text-[#1A1A1A] select-none leading-none">
                {step.num}
              </span>

              <div className="mt-5 mb-4">
                <step.icon className="h-5 w-5 text-primary" />
              </div>

              <h3 className="font-display text-xl font-semibold mb-3 tracking-tight">
                {step.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeployWizard;
