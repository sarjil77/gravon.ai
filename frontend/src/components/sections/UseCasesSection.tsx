import { motion } from "framer-motion";

const useCaseRows = [
  [
    "Read & summarize email",
    "Draft replies and follow-ups",
    "Translate messages in real time",
    "Answer support tickets",
    "Summarize long documents",
    "Schedule meetings from chat",
    "Create daily task lists",
    "Generate social media posts",
  ],
  [
    "Remind you of deadlines",
    "Plan your week",
    "Take meeting notes",
    "Track expenses and receipts",
    "Manage subscriptions",
    "Compare product options",
    "Write marketing copy",
    "Handle customer FAQs",
  ],
];

const UseCasesSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
            One assistant,{" "}
            <span className="text-gradient">endless possibilities</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Whatever you need done, your AI bot handles it in Telegram.
          </p>
        </motion.div>
      </div>

      {/* Scrolling marquee rows */}
      <div className="space-y-4">
        {useCaseRows.map((row, rowIdx) => (
          <div key={rowIdx} className="relative flex overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

            <motion.div
              className="flex gap-3 shrink-0"
              animate={{ x: rowIdx % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {/* Duplicate for seamless loop */}
              {[...row, ...row].map((item, i) => (
                <div
                  key={`${rowIdx}-${i}`}
                  className="shrink-0 px-5 py-3 rounded-xl border border-border/50 bg-muted/10 text-sm text-muted-foreground whitespace-nowrap hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UseCasesSection;
