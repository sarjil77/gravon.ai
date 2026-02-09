import { motion } from "framer-motion";
import {
  MessageSquare,
  BarChart3,
  Pause,
  Play,
  Settings,
  Plus,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";

const automations = [
  {
    name: "Customer Support Bot",
    platform: "WhatsApp",
    status: "live" as const,
    messages: 1247,
    trend: "+12%",
  },
  {
    name: "Sales Closer",
    platform: "WhatsApp",
    status: "live" as const,
    messages: 834,
    trend: "+8%",
  },
  {
    name: "Lead Qualifier",
    platform: "WhatsApp",
    status: "paused" as const,
    messages: 421,
    trend: "-2%",
  },
  {
    name: "Personal Assistant",
    platform: "WhatsApp",
    status: "live" as const,
    messages: 2103,
    trend: "+23%",
  },
];

const stats = [
  { label: "Total Messages", value: "4,605", icon: MessageSquare, change: "+15%" },
  { label: "Active Bots", value: "3", icon: Zap, change: "" },
  { label: "Response Rate", value: "98.2%", icon: TrendingUp, change: "+2.1%" },
  { label: "Team Members", value: "4", icon: Users, change: "" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mesh-gradient-tl" />
      <div className="mesh-gradient-br" />

      <main className="relative z-10 pt-28 px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Welcome back 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your automations.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                {stat.change && (
                  <span className="text-xs text-cyan font-medium">{stat.change}</span>
                )}
              </div>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Active automations header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Active Automations</h2>
          <button className="glow-button text-sm px-5 py-2.5 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Bot
          </button>
        </div>

        {/* Bento grid of automations */}
        <div className="bento-grid md:grid-cols-2">
          {automations.map((auto, i) => (
            <motion.div
              key={auto.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card-hover p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">{auto.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{auto.platform}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      auto.status === "live"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        auto.status === "live" ? "bg-green-400" : "bg-yellow-400"
                      }`}
                    />
                    {auto.status === "live" ? "Live" : "Paused"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl font-bold">
                    {auto.messages.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Messages sent</p>
                </div>
                <span className="text-xs text-cyan font-medium">{auto.trend}</span>
              </div>

              <div className="flex gap-2 mt-5">
                <button className="glass-card px-4 py-2 text-xs font-medium hover:bg-muted/30 transition-colors flex items-center gap-1.5">
                  {auto.status === "live" ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {auto.status === "live" ? "Pause" : "Resume"}
                </button>
                <button className="glass-card px-4 py-2 text-xs font-medium hover:bg-muted/30 transition-colors flex items-center gap-1.5">
                  <Settings className="h-3 w-3" />
                  Quick Edit
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
