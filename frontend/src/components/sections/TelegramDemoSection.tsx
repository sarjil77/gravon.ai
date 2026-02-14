import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const messages = [
  { from: "user", text: "Hey, can you summarize my last 5 emails?", delay: 0 },
  {
    from: "bot",
    text: "Sure! Here's a quick summary:\n\n1. 📧 Team standup moved to 3pm\n2. 📧 Client approved the proposal\n3. 📧 Invoice #4082 was paid\n4. 📧 New feature request from @maria\n5. 📧 Weekly report is due Friday",
    delay: 1.5,
  },
  { from: "user", text: "Draft a reply for the client approval", delay: 4 },
  {
    from: "bot",
    text: 'Done! Here\'s a draft:\n\n"Hi Sarah, great news — thank you for the approval! We\'ll kick off Phase 2 on Monday. I\'ll send the timeline by EOD tomorrow."',
    delay: 5.5,
  },
];

const TelegramDemoSection = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
            See it{" "}
            <span className="text-gradient">in action</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A real conversation with your AI-powered Telegram bot.
          </p>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-sm mx-auto"
        >
          <div className="glass-card rounded-3xl overflow-hidden border-primary/10 shadow-[0_0_80px_-20px_hsla(270,80%,60%,0.15)]">
            {/* Telegram-style header */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">GravonBot</p>
                <p className="text-sky-100 text-xs">online</p>
              </div>
            </div>

            {/* Chat body */}
            <div className="p-4 space-y-3 bg-[#0e1621] min-h-[380px]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: msg.delay * 0.4, duration: 0.3 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-sky-600 text-white rounded-br-md"
                        : "bg-[#182533] text-gray-200 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 3 }}
                className="flex justify-start"
              >
                <div className="bg-[#182533] px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className="h-2 w-2 bg-gray-400 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: dot * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TelegramDemoSection;
