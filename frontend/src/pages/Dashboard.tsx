import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Plus,
  Zap,
  Mail,
  Shield,
  Calendar,
  Loader2,
  Trash2,
  Send,
  RefreshCw,
  Power,
  AlertCircle,
  Key,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Clock,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

// ── Types ───────────────────────────────────────────────────────────────────

interface TenantData {
  id: string;
  user_id: string;
  bot_token: string;
  bot_username: string | null;
  ai_model: string;
  channel: string;
  container_id: string | null;
  status: string;
  credits_used: number;
  credits_limit: number;
  plan: string;
  error_message: string | null;
  created_at: string;
}

// ── Model data (shared with homepage wizard) ────────────────────────────────

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

// ── Status helpers ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
  running: { bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400", label: "Running" },
  stopped: { bg: "bg-yellow-500/10 text-yellow-400", dot: "bg-yellow-400", label: "Stopped" },
  provisioning: { bg: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400", label: "Provisioning" },
  error: { bg: "bg-red-500/10 text-red-400", dot: "bg-red-400", label: "Error" },
  suspended: { bg: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400", label: "Suspended" },
};

// ── Deploy progress steps ───────────────────────────────────────────────────

const deploySteps = [
  { label: "Validating bot token…", duration: 1500 },
  { label: "Pulling AI container image…", duration: 2500 },
  { label: "Configuring model & channels…", duration: 1500 },
  { label: "Starting your bot…", duration: 2000 },
  { label: "Running health check…", duration: 1000 },
];

// ═════════════════════════════════════════════════════════════════════════════
// ── Dashboard Component ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Wizard state (may come from homepage → auth → here)
  const passedState = location.state as {
    botToken?: string;
    model?: string;
    channel?: string;
  } | null;

  // ── Tenant state ────────────────────────────────────────────────────────
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantAction, setTenantAction] = useState<string | null>(null);

  // ── Inline deploy wizard state ──────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // 0=model, 1=token
  const [selectedModel, setSelectedModel] = useState<string | null>(passedState?.model ?? null);
  const [botToken, setBotToken] = useState(passedState?.botToken ?? "");
  const [wizardDirection, setWizardDirection] = useState(1);

  // ── Deploy progress state ───────────────────────────────────────────────
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [justDeployed, setJustDeployed] = useState(false);

  // ── Copied token feedback ───────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Fetch tenants ───────────────────────────────────────────────────────

  const fetchTenants = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/telegram/?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTenants(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // ── Auto-open wizard if state was passed from homepage ──────────────────

  useEffect(() => {
    if (passedState?.botToken && passedState?.model && !loadingTenants) {
      setShowWizard(true);
      setWizardStep(1); // jump to token step since model is pre-selected
    }
  }, [passedState, loadingTenants]);

  // ── Tenant actions ──────────────────────────────────────────────────────

  const tenantActionHandler = async (tenantId: string, action: "start" | "stop" | "restart") => {
    setTenantAction(tenantId);
    try {
      await fetch(`/api/telegram/${tenantId}/${action}`, { method: "POST" });
      await fetchTenants();
    } catch {
      // ignore
    } finally {
      setTenantAction(null);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm("Delete this bot? This cannot be undone.")) return;
    setTenantAction(tenantId);
    try {
      await fetch(`/api/telegram/${tenantId}`, { method: "DELETE" });
      await fetchTenants();
    } catch {
      // ignore
    } finally {
      setTenantAction(null);
    }
  };

  const copyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Deploy bot ──────────────────────────────────────────────────────────

  const handleDeploy = async () => {
    if (!user || !selectedModel || botToken.trim().length <= 10) return;
    setDeploying(true);
    setDeployProgress(0);
    setDeployError(null);

    // Animate progress steps
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < deploySteps.length) {
        setDeployProgress(stepIdx);
      }
    }, deploySteps[0].duration);

    try {
      const res = await fetch(`/api/telegram/?user_id=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken.trim(),
          ai_model: selectedModel,
          channel: "telegram",
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Deployment failed. Please try again.");
      }

      setDeployProgress(deploySteps.length);
      setJustDeployed(true);

      await fetchTenants();
      setTimeout(() => {
        setDeploying(false);
        setShowWizard(false);
        setJustDeployed(false);
        setBotToken("");
        setSelectedModel(null);
        setWizardStep(0);
      }, 2500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setDeployError(err.message);
      setDeploying(false);
    }
  };

  // ── Wizard slide animation ──────────────────────────────────────────────

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Computed ────────────────────────────────────────────────────────────

  const runningCount = tenants.filter((t) => t.status === "running").length;
  const totalCreditsUsed = tenants.reduce((sum, t) => sum + t.credits_used, 0);
  const hasTenants = tenants.length > 0;
  const showEmptyState = !loadingTenants && !hasTenants && !showWizard;

  // ═════════════════════════════════════════════════════════════════════════
  // ── Render ────────────────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />

      <main className="relative z-10 pt-28 px-4 md:px-8 pb-16 max-w-5xl mx-auto">

        {/* ── User header ──────────────────────────────────────────────── */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary-foreground">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold">
                  Welcome back, {user.full_name.split(" ")[0]}
                </h1>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                  </span>
                  {user.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {hasTenants && !showWizard && !deploying && (
              <button
                onClick={() => { setShowWizard(true); setWizardStep(0); setDeployError(null); }}
                className="glow-button text-sm px-5 py-2.5 flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Deploy New Bot
              </button>
            )}
          </motion.div>
        )}

        {/* ── Quick stats (only when bots exist & wizard not open) ──────── */}
        {hasTenants && !showWizard && !deploying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {[
              { label: "Active Bots", value: runningCount.toString(), icon: Zap, accent: "text-emerald-400" },
              { label: "Total Messages", value: totalCreditsUsed.toLocaleString(), icon: BarChart3, accent: "text-cyan" },
              { label: "Avg Deploy", value: "47s", icon: Clock, accent: "text-purple" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card p-4 md:p-5"
              >
                <stat.icon className={`h-4 w-4 mb-2 ${stat.accent}`} />
                <p className="font-display text-xl md:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Loading state ────────────────────────────────────────────── */}
        {loadingTenants && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── Empty state: first-time user ──────────────────────────────  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showEmptyState && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 md:p-12 text-center max-w-lg mx-auto"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple/20 to-cyan/20 mb-6"
              >
                <Rocket className="h-8 w-8 text-purple" />
              </motion.div>

              <h2 className="font-display text-2xl font-bold mb-2">
                Deploy your first AI bot
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
                Pick a model, paste your Telegram token, and your bot is live in under 60 seconds.
              </p>

              <button
                onClick={() => { setShowWizard(true); setWizardStep(0); }}
                className="glow-button text-sm px-8 py-3 inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Let's Go
              </button>

              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Free 100 messages
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── Inline Deploy Wizard ──────────────────────────────────────  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showWizard && !deploying && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 md:p-8 mb-8"
            >
              {/* Wizard header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple/20 to-cyan/20 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-purple" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">Deploy a Bot</h2>
                    <p className="text-xs text-muted-foreground">
                      Step {wizardStep + 1} of 2 — {wizardStep === 0 ? "Choose AI Model" : "Paste Bot Token"}
                    </p>
                  </div>
                </div>
                {hasTenants && (
                  <button
                    onClick={() => { setShowWizard(false); setDeployError(null); }}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Step indicator bars */}
              <div className="flex gap-2 mb-6">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= wizardStep
                        ? "bg-gradient-to-r from-purple to-cyan"
                        : "bg-muted/30"
                    }`}
                  />
                ))}
              </div>

              {/* Error banner */}
              {deployError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{deployError}</span>
                </motion.div>
              )}

              <AnimatePresence mode="wait" custom={wizardDirection}>
                {/* ── Step 0: Pick Model ────────────────────── */}
                {wizardStep === 0 && (
                  <motion.div
                    key="wiz-model"
                    custom={wizardDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      Which AI model should power your bot?
                    </p>

                    <div className="grid gap-3">
                      {models.map((m) => (
                        <motion.button
                          key={m.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setSelectedModel(m.id)}
                          className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                            selectedModel === m.id
                              ? `bg-gradient-to-r ${m.color} ${m.borderColor} shadow-lg`
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                          }`}
                        >
                          <img src={m.icon} alt={m.name} className="h-10 w-10 rounded-lg object-contain" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground">{m.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">by {m.provider}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                          </div>
                          {selectedModel === m.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="h-6 w-6 rounded-full bg-gradient-to-br from-purple to-cyan flex items-center justify-center shrink-0"
                            >
                              <Check className="h-3.5 w-3.5 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => {
                          if (selectedModel) { setWizardDirection(1); setWizardStep(1); }
                        }}
                        disabled={!selectedModel}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          selectedModel
                            ? "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                            : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        Continue
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 1: Bot Token ─────────────────────── */}
                {wizardStep === 1 && (
                  <motion.div
                    key="wiz-token"
                    custom={wizardDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      Paste your Telegram Bot Token
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4">
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

                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ..."
                      spellCheck={false}
                      autoFocus
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                    />

                    {botToken.trim().length > 10 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-sm text-emerald-400 mt-3"
                      >
                        <Check className="h-4 w-4" />
                        Token format looks valid
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => { setWizardDirection(-1); setWizardStep(0); }}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </button>

                      <button
                        onClick={handleDeploy}
                        disabled={botToken.trim().length <= 10}
                        className={`glow-button text-sm px-6 py-2.5 flex items-center gap-2 ${
                          botToken.trim().length <= 10 ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <Rocket className="h-4 w-4" />
                        Deploy Now
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── Deploy progress screen ────────────────────────────────────  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {deploying && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 md:p-12 mb-8 text-center relative overflow-hidden"
            >
              {!justDeployed ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-purple/20 to-cyan/20 mb-6"
                  >
                    <Loader2 className="h-7 w-7 text-purple" />
                  </motion.div>

                  <h2 className="font-display text-xl font-bold mb-6">
                    Deploying your bot…
                  </h2>

                  <div className="max-w-sm mx-auto space-y-3 text-left">
                    {deploySteps.map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: i <= deployProgress ? 1 : 0.3,
                          x: 0,
                        }}
                        transition={{ delay: i * 0.15, duration: 0.3 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        {i < deployProgress ? (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : i === deployProgress ? (
                          <Loader2 className="h-4 w-4 text-cyan animate-spin shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={i <= deployProgress ? "text-foreground" : "text-muted-foreground"}>
                          {s.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                /* ── Success celebration ────────────────────── */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, damping: 12 }}
                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 mb-6"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </motion.div>

                  <h2 className="font-display text-2xl font-bold mb-2 text-emerald-400">
                    Bot Deployed!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Your Telegram bot is now live and responding to messages.
                  </p>

                  {/* Confetti dots */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-2 w-2 rounded-full"
                      style={{
                        background: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#06b6d4" : "#10b981",
                        left: `${20 + Math.random() * 60}%`,
                        top: `${10 + Math.random() * 30}%`,
                      }}
                      initial={{ opacity: 0, scale: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        y: [0, -40 - Math.random() * 60],
                        x: [-20 + Math.random() * 40],
                      }}
                      transition={{ duration: 1.5, delay: i * 0.08 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── Tenant cards ──────────────────────────────────────────────  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {hasTenants && !deploying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Send className="h-5 w-5 text-sky-400" />
              <h2 className="font-display text-lg font-semibold">Your Bots</h2>
              <span className="text-xs text-muted-foreground">
                {runningCount} of {tenants.length} running
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {tenants.map((tenant, i) => {
                const isActing = tenantAction === tenant.id;
                const cfg = statusConfig[tenant.status] || statusConfig.error;
                const modelInfo = models.find((m) => m.id === tenant.ai_model);

                return (
                  <motion.div
                    key={tenant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.05 }}
                    className="glass-card-hover p-5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {modelInfo && (
                          <img src={modelInfo.icon} alt="" className="h-8 w-8 rounded-lg object-contain shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold truncate">
                            {tenant.bot_username ? `@${tenant.bot_username}` : "Telegram Bot"}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {modelInfo?.name || tenant.ai_model}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cfg.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Credits bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Messages</span>
                        <span>
                          {tenant.credits_used.toLocaleString()} / {tenant.credits_limit >= 999999 ? "∞" : tenant.credits_limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple to-cyan rounded-full transition-all"
                          style={{
                            width: `${Math.min((tenant.credits_used / Math.max(tenant.credits_limit, 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Error message */}
                    {tenant.error_message && (
                      <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-400 line-clamp-2">{tenant.error_message}</p>
                      </div>
                    )}

                    {/* Telegram link + copy token */}
                    <div className="flex items-center gap-3 mb-3">
                      {tenant.bot_username && (
                        <a
                          href={`https://t.me/${tenant.bot_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in Telegram
                        </a>
                      )}
                      <button
                        onClick={() => copyToken(tenant.id, tenant.bot_token)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedId === tenant.id ? (
                          <><Check className="h-3 w-3 text-emerald-400" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3" /> Copy Token</>
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {tenant.status === "running" && (
                        <>
                          <button
                            onClick={() => tenantActionHandler(tenant.id, "restart")}
                            disabled={isActing}
                            className="glass-card px-3 py-2 text-xs font-medium hover:bg-muted/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Restart
                          </button>
                          <button
                            onClick={() => tenantActionHandler(tenant.id, "stop")}
                            disabled={isActing}
                            className="glass-card px-3 py-2 text-xs font-medium hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Pause className="h-3 w-3" />
                            Stop
                          </button>
                        </>
                      )}
                      {(tenant.status === "stopped" || tenant.status === "error") && (
                        <button
                          onClick={() => tenantActionHandler(tenant.id, "start")}
                          disabled={isActing}
                          className="glass-card px-3 py-2 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => deleteTenant(tenant.id)}
                        disabled={isActing}
                        className="glass-card px-3 py-2 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
