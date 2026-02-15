import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const messages = [
  { from: "user", text: "Hey, can you summarize my last 5 emails?" },
  {
    from: "bot",
    text: "Sure! Here's a quick summary:\n\n1. Team standup moved to 3pm\n2. Client approved the proposal\n3. Invoice #4082 was paid\n4. New feature request from @maria\n5. Weekly report is due Friday",
  },
  { from: "user", text: "Draft a reply for the client approval" },
  {
    from: "bot",
    text: '"Hi Sarah, great news — thank you for the approval! We\'ll kick off Phase 2 on Monday. I\'ll send the timeline by EOD tomorrow."',
  },
];

const TelegramDemoSection = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-muted-foreground mb-4 tracking-wide uppercase">
              Live Preview
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-5">
              Your AI assistant, right inside Telegram
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Your bot handles real conversations — summarizing, drafting, answering
              questions — all in the chat app your users already have.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Natural language understanding out of the box",
                "Handles follow-up questions with full context",
                "Responds in seconds, 24/7",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            {/* Phone bezel */}
            <div className="relative w-[320px]">
              <div className="rounded-[2.5rem] border-[3px] border-[#222] bg-[#0A0A0A] p-2 shadow-2xl shadow-black/50">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0A0A0A] rounded-b-2xl z-10" />

                <div className="rounded-[2rem] overflow-hidden">
                  {/* Telegram header */}
                  <div className="bg-[#1C2733] px-4 py-3 flex items-center gap-3 pt-7">
                    <div className="h-9 w-9 rounded-full bg-primary/80 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">GravonBot</p>
                      <p className="text-[#7A8A99] text-xs">online</p>
                    </div>
                  </div>

                  {/* Chat body */}
                  <div className="p-3 space-y-2.5 bg-[#0E1621] min-h-[380px]">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2, duration: 0.4 }}
                        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
                            msg.from === "user"
                              ? "bg-[#2B5278] text-white rounded-br-md"
                              : "bg-[#182533] text-[#D4DEE8] rounded-bl-md"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="bg-[#17212B] px-3 py-2.5 flex items-center gap-2 border-t border-[#1C2733]">
                    <div className="flex-1 bg-[#242F3D] rounded-full px-4 py-2 text-xs text-[#6C7883]">
                      Message...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/70 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TelegramDemoSection;
