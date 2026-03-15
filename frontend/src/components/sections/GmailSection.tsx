/**
 * Gmail Integration panel for the Dashboard.
 * Handles: connecting Gmail via OAuth, managing connections,
 * configuring filters, linking to bots, viewing processed emails.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  Filter,
  Link2,
  Inbox,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Clock,
  ExternalLink,
  Settings2,
  Unlink,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface GmailConnection {
  id: string;
  user_id: string;
  email_address: string;
  tenant_id: string | null;
  filters: GmailFilters;
  is_active: boolean;
  watch_expiry: string | null;
  history_id: string | null;
  created_at: string;
}

interface GmailFilters {
  from_addresses: string[];
  subject_contains: string[];
  has_attachment: boolean | null;
}

interface ProcessedMessage {
  id: string;
  connection_id: string;
  gmail_message_id: string;
  from_address: string;
  subject: string;
  action_taken: string;
  processed_at: string;
}

interface EmailPreview {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
}

interface TenantData {
  id: string;
  bot_username: string | null;
  ai_model: string;
  status: string;
}

interface GmailSectionProps {
  userId: string;
  tenants: TenantData[];
}

// ── Component ───────────────────────────────────────────────────────────────

const GmailSection = ({ userId, tenants }: GmailSectionProps) => {
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter editing state
  const [editingFilters, setEditingFilters] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [savingFilters, setSavingFilters] = useState(false);

  // Linking state
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Email preview state
  const [previewConnId, setPreviewConnId] = useState<string | null>(null);
  const [previewEmails, setPreviewEmails] = useState<EmailPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Processed messages state
  const [historyConnId, setHistoryConnId] = useState<string | null>(null);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch connections ─────────────────────────────────────────────────

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`/api/gmail/connections?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // ── Handle OAuth callback params ──────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailConnected = params.get("gmail_connected");
    const gmailError = params.get("gmail_error");

    if (gmailConnected || gmailError) {
      fetchConnections();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      url.searchParams.delete("gmail_error");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [fetchConnections]);

  // ── Auto-refresh connections and history every 5 seconds ───────────────

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConnections();
      // If history panel is open, also refresh it
      if (historyConnId) {
        const fetchHistoryRefresh = async () => {
          try {
            const res = await fetch(
              `/api/gmail/connections/${historyConnId}/history?user_id=${userId}&limit=20`
            );
            if (res.ok) {
              const data = await res.json();
              setProcessedMessages(data.messages || []);
            }
          } catch {
            // ignore
          }
        };
        fetchHistoryRefresh();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [userId, historyConnId, fetchConnections]);

  // ── Connect Gmail ─────────────────────────────────────────────────────

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`/api/gmail/connect?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
          return;
        }
      }
      alert("Failed to start Gmail connection. Please try again.");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  // ── Delete connection ─────────────────────────────────────────────────

  const handleDelete = async (connId: string) => {
    if (!confirm("Disconnect this Gmail account? Email forwarding will stop."))
      return;
    setActionLoading(connId);
    try {
      const res = await fetch(
        `/api/gmail/connections/${connId}?user_id=${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connId));
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  // ── Restart watch ─────────────────────────────────────────────────────

  const handleRewatch = async (connId: string) => {
    setActionLoading(connId);
    try {
      await fetch(`/api/gmail/connections/${connId}/rewatch?user_id=${userId}`, {
        method: "POST",
      });
      await fetchConnections();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  // ── Update filters ────────────────────────────────────────────────────

  const startEditingFilters = (conn: GmailConnection) => {
    setEditingFilters(conn.id);
    const f = conn.filters || { from_addresses: [], subject_contains: [], has_attachment: null };
    setFilterFrom((f.from_addresses || []).join(", "));
    setFilterSubject((f.subject_contains || []).join(", "));
  };

  const saveFilters = async (connId: string, tenantId?: string) => {
    setSavingFilters(true);
    const fromAddrs = filterFrom
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const subjectKw = filterSubject
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body: any = {
      filters: {
        from_addresses: fromAddrs,
        subject_contains: subjectKw,
        has_attachment: null,
      },
    };
    if (tenantId !== undefined) body.tenant_id = tenantId;

    try {
      const res = await fetch(
        `/api/gmail/connections/${connId}?user_id=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        await fetchConnections();
        setEditingFilters(null);
      }
    } catch {
      // ignore
    } finally {
      setSavingFilters(false);
    }
  };

  // ── Link to bot ───────────────────────────────────────────────────────

  const linkToBot = async (connId: string, tenantId: string) => {
    setActionLoading(connId);
    try {
      const conn = connections.find((c) => c.id === connId);
      const f = conn?.filters || { from_addresses: [], subject_contains: [], has_attachment: null };
      await fetch(`/api/gmail/connections/${connId}?user_id=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: f, tenant_id: tenantId }),
      });
      await fetchConnections();
      setLinkingId(null);
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  // ── Fetch email preview ───────────────────────────────────────────────

  const fetchPreview = async (connId: string) => {
    if (previewConnId === connId) {
      setPreviewConnId(null);
      return;
    }
    setPreviewConnId(connId);
    setLoadingPreview(true);
    try {
      const res = await fetch(
        `/api/gmail/connections/${connId}/emails?user_id=${userId}&count=5`
      );
      if (res.ok) {
        const data = await res.json();
        setPreviewEmails(data.emails || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Fetch processed history ───────────────────────────────────────────

  const fetchHistory = async (connId: string) => {
    if (historyConnId === connId) {
      setHistoryConnId(null);
      return;
    }
    setHistoryConnId(connId);
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/gmail/connections/${connId}/history?user_id=${userId}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setProcessedMessages(data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────

  const isWatchExpired = (conn: GmailConnection) => {
    if (!conn.watch_expiry) return true;
    return new Date(conn.watch_expiry) < new Date();
  };

  const getLinkedBot = (conn: GmailConnection) => {
    if (!conn.tenant_id) return null;
    return tenants.find((t) => t.id === conn.tenant_id) || null;
  };

  const runningTenants = tenants.filter((t) => t.status === "running");

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-8"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-red-400" />
          <h2 className="font-display text-lg font-semibold">
            Gmail Integration
          </h2>
          {connections.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {connections.filter((c) => c.is_active).length} active
            </span>
          )}
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="text-sm px-4 py-2 flex items-center gap-2 rounded-xl border border-border hover:border-red-400/30 hover:bg-red-400/5 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Connect Gmail
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && connections.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-red-400/10 mb-4">
            <Inbox className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="font-display font-semibold mb-1">
            No Gmail accounts connected
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Connect your Gmail to receive real-time email summaries via your
            Telegram bot. Click "Connect Gmail" above to get started.
          </p>
        </motion.div>
      )}

      {/* Connection cards */}
      {!loading && connections.length > 0 && (
        <div className="space-y-4">
          {connections.map((conn, i) => {
            const expired = isWatchExpired(conn);
            const linkedBot = getLinkedBot(conn);
            const isExpanded = expandedId === conn.id;
            const isEditing = editingFilters === conn.id;
            const isLinking = linkingId === conn.id;
            const isActing = actionLoading === conn.id;
            const hasFilters =
              (conn.filters?.from_addresses?.length ?? 0) > 0 ||
              (conn.filters?.subject_contains?.length ?? 0) > 0;

            return (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="glass-card overflow-hidden"
              >
                {/* Connection header */}
                <div
                  className="p-5 cursor-pointer hover:bg-muted/5 transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : conn.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Google icon */}
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {conn.email_address}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              conn.is_active && !expired
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            <span
                              className={`h-1 w-1 rounded-full ${
                                conn.is_active && !expired
                                  ? "bg-emerald-400"
                                  : "bg-yellow-400"
                              }`}
                            />
                            {conn.is_active && !expired
                              ? "Watching"
                              : expired
                              ? "Watch expired"
                              : "Inactive"}
                          </span>

                          {/* Linked bot */}
                          {linkedBot && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-cyan px-2 py-0.5 rounded-full bg-cyan/10">
                              <Link2 className="h-2.5 w-2.5" />@
                              {linkedBot.bot_username || "bot"}
                            </span>
                          )}

                          {/* Filters */}
                          {hasFilters && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-purple px-2 py-0.5 rounded-full bg-purple/10">
                              <Filter className="h-2.5 w-2.5" />
                              Filtered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                        {/* Action buttons row */}
                        <div className="flex flex-wrap gap-2">
                          {/* Configure filters */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isEditing
                                ? setEditingFilters(null)
                                : startEditingFilters(conn);
                            }}
                            className={`glass-card px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              isEditing
                                ? "bg-purple/10 text-purple border-purple/30"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <Settings2 className="h-3 w-3" />
                            Filters
                          </button>

                          {/* Link to bot */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkingId(isLinking ? null : conn.id);
                            }}
                            className={`glass-card px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              isLinking
                                ? "bg-cyan/10 text-cyan border-cyan/30"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <Link2 className="h-3 w-3" />
                            {linkedBot
                              ? `Linked: @${linkedBot.bot_username || "bot"}`
                              : "Link to Bot"}
                          </button>

                          {/* Preview emails */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchPreview(conn.id);
                            }}
                            className={`glass-card px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              previewConnId === conn.id
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>

                          {/* View history */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchHistory(conn.id);
                            }}
                            className={`glass-card px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              historyConnId === conn.id
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            History
                          </button>

                          {/* Restart watch */}
                          {expired && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRewatch(conn.id);
                              }}
                              disabled={isActing}
                              className="glass-card px-3 py-2 text-xs font-medium hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isActing ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Restart Watch
                            </button>
                          )}

                          {/* Disconnect */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(conn.id);
                            }}
                            disabled={isActing}
                            className="glass-card px-3 py-2 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                            Disconnect
                          </button>
                        </div>

                        {/* ─ Filter editor ────────────────────────── */}
                        <AnimatePresence>
                          {isEditing && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl bg-muted/10 border border-border/50 space-y-3">
                                <p className="text-xs text-muted-foreground">
                                  Only forward emails matching these filters. Leave
                                  blank to forward all.
                                </p>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    From addresses (comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={filterFrom}
                                    onChange={(e) => setFilterFrom(e.target.value)}
                                    placeholder="boss@company.com, alerts@service.com"
                                    className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Subject keywords (comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={filterSubject}
                                    onChange={(e) =>
                                      setFilterSubject(e.target.value)
                                    }
                                    placeholder="urgent, invoice, meeting"
                                    className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple/50"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingFilters(null)}
                                    className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveFilters(conn.id)}
                                    disabled={savingFilters}
                                    className="text-xs px-4 py-1.5 rounded-lg bg-purple/20 text-purple hover:bg-purple/30 border border-purple/30 transition-colors font-medium disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {savingFilters ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                    Save Filters
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ─ Link to bot selector ─────────────────── */}
                        <AnimatePresence>
                          {isLinking && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl bg-muted/10 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-3">
                                  Link this Gmail account to a bot. Incoming emails
                                  will be forwarded as AI-summarized messages to that
                                  bot's Telegram channel.
                                </p>
                                {runningTenants.length === 0 ? (
                                  <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    No running Agent. Deploy a bot first, then link
                                    it here.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {runningTenants.map((t) => (
                                      <button
                                        key={t.id}
                                        onClick={() => linkToBot(conn.id, t.id)}
                                        disabled={isActing}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all ${
                                          conn.tenant_id === t.id
                                            ? "border-cyan/30 bg-cyan/5 text-cyan"
                                            : "border-border hover:border-cyan/20 hover:bg-muted/20"
                                        } disabled:opacity-50`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Link2 className="h-3.5 w-3.5" />
                                          <span>
                                            @{t.bot_username || "bot"}{" "}
                                            <span className="text-muted-foreground text-xs">
                                              ({t.ai_model})
                                            </span>
                                          </span>
                                        </div>
                                        {conn.tenant_id === t.id && (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </button>
                                    ))}
                                    {/* Unlink button */}
                                    {conn.tenant_id && (
                                      <button
                                        onClick={() => {
                                          setActionLoading(conn.id);
                                          fetch(
                                            `/api/gmail/connections/${conn.id}?user_id=${userId}`,
                                            {
                                              method: "PATCH",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                filters:
                                                  conn.filters || {
                                                    from_addresses: [],
                                                    subject_contains: [],
                                                    has_attachment: null,
                                                  },
                                                tenant_id: null,
                                              }),
                                            }
                                          )
                                            .then(() => fetchConnections())
                                            .finally(() => {
                                              setActionLoading(null);
                                              setLinkingId(null);
                                            });
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-border transition-colors"
                                      >
                                        <Unlink className="h-3 w-3" />
                                        Unlink from bot
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ─ Email preview ────────────────────────── */}
                        <AnimatePresence>
                          {previewConnId === conn.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl bg-muted/10 border border-border/50">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-medium flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 text-blue-400" />
                                    Latest Emails
                                  </p>
                                  <button
                                    onClick={() => setPreviewConnId(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {loadingPreview ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : previewEmails.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    No emails found.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                    {previewEmails.map((email) => (
                                      <div
                                        key={email.id}
                                        className="p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium truncate">
                                              {email.subject || "(no subject)"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                              {email.from}
                                            </p>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground shrink-0">
                                            {email.date
                                              ? new Date(email.date).toLocaleDateString()
                                              : ""}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
                                          {email.snippet}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ─ Processed history ───────────────────── */}
                        <AnimatePresence>
                          {historyConnId === conn.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl bg-muted/10 border border-border/50">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-medium flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                    Forwarded Emails
                                  </p>
                                  <button
                                    onClick={() => setHistoryConnId(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {loadingHistory ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : processedMessages.length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    No emails forwarded yet.
                                  </p>
                                ) : (
                                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                    {processedMessages.map((msg) => (
                                      <div
                                        key={msg.id}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium truncate">
                                            {msg.subject || "(no subject)"}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground truncate">
                                            {msg.from_address}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                            {msg.action_taken}
                                          </span>
                                          <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {new Date(
                                              msg.processed_at
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Current filter display (when not editing) */}
                        {!isEditing && hasFilters && (
                          <div className="flex flex-wrap gap-1.5">
                            {(conn.filters.from_addresses || []).map((addr) => (
                              <span
                                key={addr}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20"
                              >
                                from: {addr}
                              </span>
                            ))}
                            {(conn.filters.subject_contains || []).map((kw) => (
                              <span
                                key={kw}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              >
                                subject: {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Connection info */}
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/70">
                          <span>
                            Connected{" "}
                            {new Date(conn.created_at).toLocaleDateString()}
                          </span>
                          {conn.watch_expiry && (
                            <span>
                              Watch expires{" "}
                              {new Date(
                                conn.watch_expiry
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default GmailSection;
