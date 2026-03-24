import { motion } from "framer-motion";
import { Agent } from "https";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="border-t border-border/30 mb-20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Ready to deploy your AI Agent?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            50 free credits. No credit card required. Your first bot can be live
            in under 2 minutes.
          </p>
          <Link
            to="/auth"
            className="btn-primary text-base inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
