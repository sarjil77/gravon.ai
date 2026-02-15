import { motion } from "framer-motion";
import { Headphones, TrendingUp, Code2, Users, BookOpen, ShoppingBag } from "lucide-react";

const useCases = [
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Instantly answer FAQs, troubleshoot issues, and escalate complex tickets — 24/7.",
  },
  {
    icon: TrendingUp,
    title: "Sales & Lead Gen",
    description: "Qualify leads, answer product questions, and book calls — right inside Telegram.",
  },
  {
    icon: Code2,
    title: "Developer Tools",
    description: "Build internal bots for CI/CD notifications, code reviews, and team standups.",
  },
  {
    icon: Users,
    title: "HR & Onboarding",
    description: "Automate employee onboarding, policy questions, and time-off requests.",
  },
  {
    icon: BookOpen,
    title: "Education",
    description: "Create AI tutors that answer student questions, generate quizzes, and explain concepts.",
  },
  {
    icon: ShoppingBag,
    title: "E-Commerce",
    description: "Track orders, recommend products, and handle returns — all through conversational AI.",
  },
];

const UseCasesSection = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
            Use Cases
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5">
            One platform, endless possibilities
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Deploy AI bots for any department, any workflow, any use case.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="solid-card-hover p-6"
            >
              <uc.icon className="h-5 w-5 text-primary mb-4" />
              <h3 className="font-display text-base font-semibold mb-2">{uc.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {uc.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
