import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = path.resolve(__dirname, "..", "sessions");

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

const logger = pino({ level: "silent" }); // suppress baileys noise

/**
 * Manages multiple WhatsApp sessions (one per Clavio user).
 *
 *   sessions     – live Baileys socket instances keyed by userId
 *   qrCodes      – latest QR data URI keyed by userId
 *   statusMap    – connection status per userId
 *   msgCallbacks – function called when a message arrives
 */
class SessionManager {
  constructor() {
    /** @type {Map<string, import("@whiskeysockets/baileys").WASocket>} */
    this.sessions = new Map();

    /** @type {Map<string, string>} latest QR data-URI */
    this.qrCodes = new Map();

    /** @type {Map<string, object>} */
    this.statusMap = new Map();

    /** @type {((userId: string, msg: object) => Promise<void>) | null} */
    this.onMessage = null;
  }

  // ── public API ────────────────────────────────────────────────────────

  /**
   * Start (or restart) a Baileys session for `userId`.
   * Returns immediately; QR appears via getQR().
   */
  async startSession(userId) {
    // If already connected, skip
    if (this.sessions.has(userId)) {
      const status = this.statusMap.get(userId);
      if (status?.connected) {
        return { alreadyConnected: true, phone: status.phone };
      }
      // Not connected — tear down and reconnect
      this.sessions.get(userId)?.end();
      this.sessions.delete(userId);
    }

    this._setStatus(userId, { connected: false, connecting: true, phone: null });
    this.qrCodes.delete(userId);

    await this._connect(userId);
  }

  /**
   * Get the latest QR code for `userId` as a data-URI (or null).
   */
  getQR(userId) {
    return this.qrCodes.get(userId) || null;
  }

  /**
   * Get connection status for `userId`.
   */
  getStatus(userId) {
    return (
      this.statusMap.get(userId) || {
        connected: false,
        connecting: false,
        phone: null,
      }
    );
  }

  /**
   * Disconnect & remove a session (and delete stored auth).
   */
  async disconnectSession(userId) {
    const sock = this.sessions.get(userId);
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end();
    }
    this.sessions.delete(userId);
    this.qrCodes.delete(userId);
    this._setStatus(userId, { connected: false, connecting: false, phone: null });

    // Remove stored auth
    const authDir = path.join(SESSIONS_DIR, userId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  }

  /**
   * Send a text message on behalf of `userId`.
   */
  async sendMessage(userId, to, text) {
    const sock = this.sessions.get(userId);
    if (!sock) throw new Error("Session not found");

    const status = this.statusMap.get(userId);
    if (!status?.connected) throw new Error("WhatsApp not connected");

    // Ensure JID format (add @s.whatsapp.net if plain number)
    const jid = to.includes("@") ? to : `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    return { success: true, to: jid };
  }

  /**
   * Get list of all active session user IDs.
   */
  listSessions() {
    const result = [];
    for (const [userId, status] of this.statusMap) {
      result.push({ userId, ...status });
    }
    return result;
  }

  /**
   * Restore all previously saved sessions on startup.
   */
  async restoreSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const dirs = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        console.log(`[SessionManager] Restoring session: ${dir.name}`);
        await this.startSession(dir.name);
      }
    }
  }

  // ── internal ──────────────────────────────────────────────────────────

  /** @private */
  _setStatus(userId, status) {
    this.statusMap.set(userId, { ...status, updatedAt: new Date().toISOString() });
  }

  /** @private */
  async _connect(userId) {
    const authDir = path.join(SESSIONS_DIR, userId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["Clavio AI", "Chrome", "1.0.0"],
      generateHighQualityLinkPreview: false,
    });

    this.sessions.set(userId, sock);

    // ── QR code events ──
    const qrcode = (await import("qrcode")).default;

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Convert QR string to data-URI PNG
        const dataUri = await qrcode.toDataURL(qr, { width: 300 });
        this.qrCodes.set(userId, dataUri);
        this._setStatus(userId, { connected: false, connecting: true, phone: null });
      }

      if (connection === "open") {
        const phone = sock.user?.id?.split(":")[0] || sock.user?.id || "unknown";
        this.qrCodes.delete(userId);
        this._setStatus(userId, { connected: true, connecting: false, phone });
        console.log(`[SessionManager] Connected: ${userId} (${phone})`);
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = reason === DisconnectReason.loggedOut;

        if (loggedOut) {
          // User logged out — clean up auth
          console.log(`[SessionManager] Logged out: ${userId}`);
          this.sessions.delete(userId);
          this._setStatus(userId, { connected: false, connecting: false, phone: null });
          const ad = path.join(SESSIONS_DIR, userId);
          if (fs.existsSync(ad)) fs.rmSync(ad, { recursive: true, force: true });
        } else {
          // Transient disconnect — retry
          console.log(`[SessionManager] Reconnecting: ${userId} (reason ${reason})`);
          this._setStatus(userId, { connected: false, connecting: true, phone: null });
          setTimeout(() => this._connect(userId), 3000);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // ── Incoming messages ──
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message) continue;   // skip protocol messages

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) continue; // skip non-text (images, etc.) for now

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "";

        console.log(`[${userId}] Message from ${from}: ${text.slice(0, 50)}`);

        // Notify callback (Python backend will register this)
        if (this.onMessage) {
          try {
            await this.onMessage(userId, {
              from,
              pushName,
              text,
              messageId: msg.key.id,
              timestamp: msg.messageTimestamp,
            });
          } catch (err) {
            console.error(`[${userId}] onMessage callback error:`, err.message);
          }
        }
      }
    });
  }
}

export const sessionManager = new SessionManager();
