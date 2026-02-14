import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Key, Rocket, ChevronRight, ChevronLeft, Check, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ── Step data ───────────────────────────────────────────────────────────────

const models = [
  {
    id: "anthropic",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    icon: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg",
    color: "from-orange-500/20 to-amber-500/20",
    borderColor: "border-orange-500/30",
    description: "Best for nuanced conversations & safety",
  },
  {
    id: "openai",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: "https://img.icons8.com/androidL/512/FFFFFF/chatgpt.png",
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
    description: "Best for general-purpose tasks",
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png",
    color: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-500/30",
    description: "Best for speed & multimodal",
  },
];

const channels = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/960px-Telegram_logo.svg.png",
    available: true,
    badge: null,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/960px-WhatsApp.svg.png",
    available: false,
    badge: "Coming Soon",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg",
    available: false,
    badge: "Coming Soon",
  },
];

const TOTAL_STEPS = 3;

// ── Stepper bar ─────────────────────────────────────────────────────────────

const StepIndicator = ({ current }: { current: number }) => {
  const labels = ["Choose Model", "Pick Channel", "Connect Bot"];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <motion.div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i < current
                  ? "bg-gradient-to-br from-purple to-cyan text-white"
                  : i === current
                  ? "bg-primary/20 border-2 border-primary text-primary"
                  : "bg-muted/50 text-muted-foreground"
              }`}
              animate={i === current ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </motion.div>
            <span
              className={`hidden sm:block text-sm font-medium ${
                i <= current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div
              className={`w-8 md:w-16 h-0.5 rounded-full transition-colors ${
                i < current ? "bg-gradient-to-r from-purple to-cyan" : "bg-muted/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main Wizard Component ───────────────────────────────────────────────────

const DeployWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const canProceed =
    (step === 0 && selectedModel !== null) ||
    (step === 1 && selectedChannel !== null) ||
    (step === 2 && botToken.trim().length > 10);

  const nextStep = () => {
    if (canProceed && step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section id="deploy" className="relative py-20 px-4">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm text-muted-foreground">
            <Rocket className="h-4 w-4 text-cyan" />
            3 steps. Under 60 seconds.
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
            Deploy your AI bot{" "}
            <span className="text-gradient">right now</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose your stack, paste your token, and we handle the rest.
          </p>
        </motion.div>

        {/* Stepper */}
        <StepIndicator current={step} />

        {/* Step content */}
        <div className="glass-card p-6 md:p-10 min-h-[340px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Step 0: Pick Model ────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-model"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <h3 className="font-display text-xl font-semibold mb-2 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Which AI model should power your bot?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You can change this later from your dashboard.
                </p>

                <div className="grid gap-4">
                  {models.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedModel(m.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedModel === m.id
                          ? `bg-gradient-to-r ${m.color} ${m.borderColor} shadow-lg`
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                      }`}
                    >
                      <img src={m.icon} alt={m.name} className="h-10 w-10 rounded-lg object-contain" />
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">by {m.provider}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                      </div>
                      {selectedModel === m.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-6 w-6 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center"
                        >
                          <Check className="h-3.5 w-3.5 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Pick Channel ──────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-channel"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <h3 className="font-display text-xl font-semibold mb-2 flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Where should your bot live?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Pick the messaging platform for your AI assistant.
                </p>

                <div className="grid gap-4">
                  {channels.map((ch) => (
                    <motion.button
                      key={ch.id}
                      whileHover={ch.available ? { scale: 1.015 } : {}}
                      whileTap={ch.available ? { scale: 0.99 } : {}}
                      onClick={() => ch.available && setSelectedChannel(ch.id)}
                      disabled={!ch.available}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        !ch.available
                          ? "opacity-40 cursor-not-allowed border-border"
                          : selectedChannel === ch.id
                          ? "bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/30 shadow-lg"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                      }`}
                    >
                      <img src={ch.icon} alt={ch.name} className="h-10 w-10 object-contain" />
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{ch.name}</span>
                        {ch.badge && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {ch.badge}
                          </span>
                        )}
                      </div>
                      {selectedChannel === ch.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-6 w-6 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center"
                        >
                          <Check className="h-3.5 w-3.5 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Bot Token ─────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-token"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                <h3 className="font-display text-xl font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Paste your Telegram Bot Token
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Open Telegram → search{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan hover:underline"
                  >
                    @BotFather
                  </a>{" "}
                  → <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/newbot</code> → copy the token.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ..."
                      spellCheck={false}
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                    />
                  </div>

                  {botToken.trim().length > 10 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-emerald-400"
                    >
                      <Check className="h-4 w-4" />
                      Token format looks valid
                    </motion.div>
                  )}

                  {/* Deploy CTA */}
                  <button
                    onClick={() => {
                      const state = { botToken, model: selectedModel, channel: selectedChannel };
                      navigate(user ? "/dashboard" : "/auth", { state });
                    }}
                    disabled={botToken.trim().length <= 10}
                    className={`glow-button-pulse w-full text-center flex items-center justify-center gap-2 mt-4 ${
                      botToken.trim().length <= 10 ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Rocket className="h-5 w-5" />
                    {user ? "Deploy Your Bot" : "Sign Up & Deploy Your Bot"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Free trial — 100 messages included. No credit card required.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation ──────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                step === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {step < TOTAL_STEPS - 1 && (
              <button
                onClick={nextStep}
                disabled={!canProceed}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  canProceed
                    ? "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                    : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                }`}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scarcity nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            Limited cloud servers — <strong className="text-foreground">14 slots</strong> remaining
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default DeployWizard;
