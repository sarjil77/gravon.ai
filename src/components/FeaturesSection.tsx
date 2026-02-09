import { motion } from "framer-motion";
import { Shield, Zap, Users, Sparkles, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "One-Click WhatsApp",
    description: "Scan a QR code and your AI is live on WhatsApp. No API keys, no setup docs.",
  },
  {
    icon: Sparkles,
    title: "Smart Templates",
    description: "Choose from Customer Support, Sales Closer, or Personal Assistant — ready in seconds.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description: "See messages, response times, and satisfaction scores in real-time on your dashboard.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "End-to-end encryption and SOC 2 compliant infrastructure for your peace of mind.",
  },
  {
    icon: Zap,
    title: "Instant Automations",
    description: "Set up workflows with simple toggles. No flowcharts, no code, no confusion.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite your team, assign roles, and manage everything from one workspace.",
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
            Everything you need,{" "}
            <span className="text-gradient">nothing you don't</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We stripped away the complexity so you can focus on what matters — your business.
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
