import express from "express";
import cors from "cors";
import { sessionManager } from "./session-manager.js";

const app = express();
const PORT = process.env.WA_PORT || 3001;
const PYTHON_BACKEND = process.env.PYTHON_BACKEND || "http://localhost:8000";

app.use(cors({ origin: ["http://localhost:8080", "http://localhost:8000"] }));
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "Gravon-whatsapp", sessions: sessionManager.listSessions().length });
});

// ── Start session / generate QR ─────────────────────────────────────────────

app.post("/session/:userId/start", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await sessionManager.startSession(userId);

    if (result?.alreadyConnected) {
      return res.json({ status: "already_connected", phone: result.phone });
    }

    // Wait a moment for QR to generate
    await new Promise((r) => setTimeout(r, 2000));

    const qr = sessionManager.getQR(userId);
    const status = sessionManager.getStatus(userId);

    res.json({ status: status.connected ? "connected" : "qr_ready", qr, ...status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get QR code ─────────────────────────────────────────────────────────────

app.get("/session/:userId/qr", (req, res) => {
  const { userId } = req.params;
  const qr = sessionManager.getQR(userId);
  const status = sessionManager.getStatus(userId);

  if (status.connected) {
    return res.json({ status: "connected", phone: status.phone, qr: null });
  }

  res.json({ status: qr ? "qr_ready" : "waiting", qr });
});

// ── Get session status ──────────────────────────────────────────────────────

app.get("/session/:userId/status", (req, res) => {
  const { userId } = req.params;
  const status = sessionManager.getStatus(userId);
  res.json(status);
});

// ── Disconnect session ──────────────────────────────────────────────────────

app.post("/session/:userId/disconnect", async (req, res) => {
  try {
    const { userId } = req.params;
    await sessionManager.disconnectSession(userId);
    res.json({ status: "disconnected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send message ────────────────────────────────────────────────────────────

app.post("/session/:userId/send", async (req, res) => {
  try {
    const { userId } = req.params;
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: "Missing 'to' and 'text' in body" });
    }

    const result = await sessionManager.sendMessage(userId, to, text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List all sessions ───────────────────────────────────────────────────────

app.get("/sessions", (_req, res) => {
  res.json({ sessions: sessionManager.listSessions() });
});

// ── Incoming message callback → forward to Python backend ───────────────────

sessionManager.onMessage = async (userId, msg) => {
  try {
    const resp = await fetch(`${PYTHON_BACKEND}/api/whatsapp/incoming`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...msg }),
    });
    const data = await resp.json();

    // If Python returns a reply, send it back via WhatsApp
    if (data.reply) {
      await sessionManager.sendMessage(userId, msg.from, data.reply);
    }
  } catch (err) {
    console.error(`[onMessage] Failed to forward to Python:`, err.message);
  }
};

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`\n🟢 Gravon WhatsApp Service running on http://localhost:${PORT}`);
  console.log(`   Forwarding messages to ${PYTHON_BACKEND}\n`);

  // Restore any previously authenticated sessions
  await sessionManager.restoreSessions();
});
