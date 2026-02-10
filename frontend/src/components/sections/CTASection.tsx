import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Ready to launch your{" "}
            <span className="text-gradient">AI assistant?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of creators and small businesses already using Clavio.ai.
          </p>
          <Link
            to="/auth"
            className="glow-button-pulse text-base flex items-center gap-2 mx-auto"
          >
            Start Your 7-Day Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
