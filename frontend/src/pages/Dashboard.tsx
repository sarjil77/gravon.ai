import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Pause,
  Play,
  Settings,
  Plus,
  Zap,
  Users,
  TrendingUp,
  Mail,
  Shield,
  Calendar,
  X,
  Bot,
  Smartphone,
  Loader2,
  CheckCircle2,
  Wifi,
  WifiOff,
  Trash2,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

// ── Types ───────────────────────────────────────────────────────────────────

interface BotData {
  id: string;
  user_id: string;
  name: string;
  description: string;
  ai_provider: string;
  ai_model: string;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
}

interface WAStatus {
  connected: boolean;
  connecting: boolean;
  phone: string | null;
}

// ── Bot templates ───────────────────────────────────────────────────────────

const botTemplates = [
  {
    name: "Customer Support",
    description: "Handle FAQs, complaints, and support tickets automatically",
    icon: MessageSquare,
    prompt: "You are a professional customer support agent. Be helpful, empathetic, and resolve issues quickly. Keep responses concise.",
  },
  {
    name: "Sales Assistant",
    description: "Qualify leads, answer product questions, and close deals",
    icon: TrendingUp,
    prompt: "You are a friendly sales assistant. Help customers understand products, answer questions, and guide them toward making a purchase. Be persuasive but not pushy.",
  },
  {
    name: "Appointment Booker",
    description: "Let customers schedule, reschedule, or cancel appointments",
    icon: Calendar,
    prompt: "You are an appointment scheduling assistant. Help users book, reschedule, or cancel appointments. Ask for their preferred date, time, and any relevant details.",
  },
  {
    name: "Personal Assistant",
    description: "General purpose AI assistant for any conversation",
    icon: Bot,
    prompt: "You are a helpful personal AI assistant on WhatsApp. Answer questions, help with tasks, and have natural conversations. Keep responses concise and friendly.",
  },
];

const aiModels: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-haiku-4-20250414", label: "Claude Haiku 4" },
    ],
  },
  gemini: {
    label: "Google",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro" },
    ],
  },
};

// ── Dashboard Component ─────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();

  // Bot state
  const [bots, setBots] = useState<BotData[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);

  // WhatsApp state
  const [waStatus, setWaStatus] = useState<WAStatus>({ connected: false, connecting: false, phone: null });
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // New bot modal state
  const [showNewBot, setShowNewBot] = useState(false);
  const [newBotStep, setNewBotStep] = useState<"template" | "config">("template");
  const [newBotForm, setNewBotForm] = useState({
    name: "",
    description: "",
    ai_provider: "openai",
    ai_model: "gpt-4o",
    system_prompt: "",
  });
  const [creatingBot, setCreatingBot] = useState(false);

  // ── Fetch bots ──────────────────────────────────────────────────────────

  const fetchBots = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bots/?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingBots(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  // ── Fetch WhatsApp status ───────────────────────────────────────────────

  const fetchWAStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/whatsapp/status/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch {
      // WhatsApp service might not be running
    }
  }, [user]);

  useEffect(() => {
    fetchWAStatus();
  }, [fetchWAStatus]);

  // ── QR code polling ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!showQR || !user || waStatus.connected) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/qr/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "connected") {
          setWaStatus({ connected: true, connecting: false, phone: data.phone });
          setShowQR(false);
          setQrData(null);
          return;
        }

        if (data.qr) {
          setQrData(data.qr);
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [showQR, user, waStatus.connected]);

  // ── Connect WhatsApp ────────────────────────────────────────────────────

  const connectWhatsApp = async () => {
    if (!user) return;
    setShowQR(true);
    setQrLoading(true);
    setQrData(null);

    try {
      const res = await fetch(`/api/whatsapp/connect/${user.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start session");

      const data = await res.json();
      if (data.status === "already_connected") {
        setWaStatus({ connected: true, connecting: false, phone: data.phone });
        setShowQR(false);
        return;
      }
      if (data.qr) {
        setQrData(data.qr);
      }
    } catch {
      // ignore — QR polling will pick it up
    } finally {
      setQrLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!user) return;
    try {
      await fetch(`/api/whatsapp/disconnect/${user.id}`, { method: "POST" });
      setWaStatus({ connected: false, connecting: false, phone: null });
    } catch {
      // ignore
    }
  };

  // ── Create bot ──────────────────────────────────────────────────────────

  const handleCreateBot = async () => {
    if (!user || !newBotForm.name.trim()) return;
    setCreatingBot(true);
    try {
      const res = await fetch(`/api/bots/?user_id=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBotForm),
      });

      if (!res.ok) throw new Error("Failed to create bot");

      setShowNewBot(false);
      setNewBotStep("template");
      setNewBotForm({ name: "", description: "", ai_provider: "openai", ai_model: "gpt-4o", system_prompt: "" });
      await fetchBots();
    } catch {
      // ignore
    } finally {
      setCreatingBot(false);
    }
  };

  const selectTemplate = (tpl: typeof botTemplates[0]) => {
    setNewBotForm({
      ...newBotForm,
      name: tpl.name,
      description: tpl.description,
      system_prompt: tpl.prompt,
    });
    setNewBotStep("config");
  };

  // ── Toggle bot active/paused ────────────────────────────────────────────

  const toggleBot = async (bot: BotData) => {
    try {
      await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !bot.is_active }),
      });
      await fetchBots();
    } catch {
      // ignore
    }
  };

  const deleteBot = async (botId: string) => {
    try {
      await fetch(`/api/bots/${botId}`, { method: "DELETE" });
      await fetchBots();
    } catch {
      // ignore
    }
  };

  // ── Stats (computed) ────────────────────────────────────────────────────

  const activeBots = bots.filter((b) => b.is_active).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />

      <main className="relative z-10 pt-28 px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        {/* User Profile Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple to-cyan flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary-foreground">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
                  Welcome back, {user.full_name.split(" ")[0]} 👋
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                  </span>
                  {user.created_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* WhatsApp Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  waStatus.connected
                    ? "bg-green-500/10"
                    : "bg-muted/30"
                }`}
              >
                {waStatus.connected ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-display font-semibold">WhatsApp Connection</h3>
                <p className="text-xs text-muted-foreground">
                  {waStatus.connected
                    ? `Connected — ${waStatus.phone}`
                    : "Not connected — scan QR to link your WhatsApp"}
                </p>
              </div>
            </div>

            {waStatus.connected ? (
              <button
                onClick={disconnectWhatsApp}
                className="glass-card px-4 py-2 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button onClick={connectWhatsApp} className="glow-button text-sm px-5 py-2.5 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Connect WhatsApp
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bots", value: bots.length.toString(), icon: Bot, change: "" },
            { label: "Active Bots", value: activeBots.toString(), icon: Zap, change: "" },
            { label: "WhatsApp", value: waStatus.connected ? "Connected" : "Offline", icon: Smartphone, change: "" },
            { label: "AI Providers", value: [...new Set(bots.map((b) => b.ai_provider))].length.toString(), icon: TrendingUp, change: "" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Bots header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Your Bots</h2>
          <button
            onClick={() => { setShowNewBot(true); setNewBotStep("template"); }}
            className="glow-button text-sm px-5 py-2.5 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Bot
          </button>
        </div>

        {/* Bot cards */}
        {loadingBots ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bots.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No bots yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first AI bot and connect it to WhatsApp.
            </p>
            <button
              onClick={() => { setShowNewBot(true); setNewBotStep("template"); }}
              className="glow-button text-sm px-6 py-3"
            >
              Create Your First Bot
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bots.map((bot, i) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card-hover p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold">{bot.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aiModels[bot.ai_provider]?.label || bot.ai_provider} — {bot.ai_model}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      bot.is_active
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        bot.is_active ? "bg-green-400" : "bg-yellow-400"
                      }`}
                    />
                    {bot.is_active ? "Active" : "Paused"}
                  </span>
                </div>

                {bot.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{bot.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBot(bot)}
                    className="glass-card px-4 py-2 text-xs font-medium hover:bg-muted/30 transition-colors flex items-center gap-1.5"
                  >
                    {bot.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {bot.is_active ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteBot(bot.id)}
                    className="glass-card px-4 py-2 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ── QR Code Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-sm p-6 md:p-8 relative text-center"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <Smartphone className="h-10 w-10 text-purple mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Connect WhatsApp</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan this QR code
              </p>

              <div className="bg-white rounded-2xl p-4 inline-block mb-4">
                {qrLoading && !qrData ? (
                  <div className="h-[268px] w-[268px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : qrData ? (
                  <img src={qrData} alt="WhatsApp QR Code" className="h-[268px] w-[268px]" />
                ) : (
                  <div className="h-[268px] w-[268px] flex items-center justify-center text-gray-400 text-sm">
                    Waiting for QR code...
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                QR code refreshes automatically. Keep this window open.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Bot Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewBot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewBot(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg p-6 md:p-8 relative"
            >
              <button
                onClick={() => { setShowNewBot(false); setNewBotStep("template"); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {newBotStep === "template" ? (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2">Create New Bot</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Choose a template to get started quickly.
                  </p>

                  <div className="grid gap-3">
                    {botTemplates.map((tpl) => (
                      <button
                        key={tpl.name}
                        onClick={() => selectTemplate(tpl)}
                        className="glass-card-hover p-4 text-left flex items-start gap-4 transition-all hover:border-purple/40"
                      >
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple/20 to-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                          <tpl.icon className="h-5 w-5 text-purple" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-sm">{tpl.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2">Configure Bot</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Customize your bot's name, AI provider, and behavior.
                  </p>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bot Name</label>
                      <input
                        type="text"
                        value={newBotForm.name}
                        onChange={(e) => setNewBotForm({ ...newBotForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple/50"
                        placeholder="My Awesome Bot"
                      />
                    </div>

                    {/* AI Provider */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">AI Provider</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(aiModels).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() =>
                              setNewBotForm({
                                ...newBotForm,
                                ai_provider: key,
                                ai_model: val.models[0].value,
                              })
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                              newBotForm.ai_provider === key
                                ? "border-purple bg-purple/10 text-purple"
                                : "border-border bg-muted/20 text-muted-foreground hover:border-muted-foreground/40"
                            }`}
                          >
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Model */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
                      <select
                        value={newBotForm.ai_model}
                        onChange={(e) => setNewBotForm({ ...newBotForm, ai_model: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple/50 appearance-none"
                      >
                        {aiModels[newBotForm.ai_provider]?.models.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* System Prompt */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">System Prompt</label>
                      <textarea
                        value={newBotForm.system_prompt}
                        onChange={(e) => setNewBotForm({ ...newBotForm, system_prompt: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple/50 resize-none"
                        placeholder="You are a helpful assistant..."
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setNewBotStep("template")}
                        className="glass-card px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateBot}
                        disabled={creatingBot || !newBotForm.name.trim()}
                        className="glow-button text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                      >
                        {creatingBot ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {creatingBot ? "Creating..." : "Create Bot"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
