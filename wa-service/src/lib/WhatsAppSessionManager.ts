import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from "@whiskeysockets/baileys";
import { Server } from "socket.io";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { promisify } from "util";
import { ruleEngine } from "./RuleEngine";
import { SessionContext, BotState, CONSTANTS, RuleEngineResponse } from "./types";
import { messageDeduplicator } from "./MessageDeduplicator";
import { WhatsAppCredential } from "../models/WhatsAppCredential";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppSession {
  socket: WASocket;
  status: "connecting" | "qr_ready" | "connected" | "disconnected" | "reconnecting";
  qr: string | null;
  retryCount: number;
  /** setInterval handle for periodic credential backup */
  backupTimer?: NodeJS.Timeout;
}

// ─── WhatsAppSessionManager ───────────────────────────────────────────────────

class WhatsAppSessionManager {
  private static instance: WhatsAppSessionManager;
  private sessions: Map<string, WhatsAppSession> = new Map();
  private io: Server | null = null;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private MAX_RETRIES = 5;

  // Per-user conversation sessions (in-memory cache)
  private userSessions: Map<string, SessionContext> = new Map();

  /**
   * Per-sessionId message processing queue.
   * Stores the "tail" promise so each new message chains onto the previous one.
   * Entries are deleted once the chain resolves (no memory leak).
   */
  private messageQueues: Map<string, Promise<void>> = new Map();

  private constructor() { }

  static getInstance(): WhatsAppSessionManager {
    if (!WhatsAppSessionManager.instance) {
      WhatsAppSessionManager.instance = new WhatsAppSessionManager();
    }
    return WhatsAppSessionManager.instance;
  }

  setIO(io: Server) {
    this.io = io;
  }

  /** Returns the number of currently active (connected) WA sessions. */
  getActiveSessionCount(): number {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.status === "connected") count++;
    }
    return count;
  }

  // ─── Session Init / Disconnect ──────────────────────────────────────────────

  async initSession(businessId: string): Promise<{ success: boolean; error?: string; session?: any }> {
    try {
      const existing = this.sessions.get(businessId);
      if (existing) {
        if (existing.status === "connected") return { success: true, session: { status: "connected" } };
        if (existing.status === "connecting" || existing.status === "qr_ready") {
          return { success: true, session: { status: existing.status, qr: existing.qr } };
        }
      }
      await this.createWhatsAppClient(businessId);
      return { success: true, session: { status: "connecting" } };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  getStatus(businessId: string) {
    return this.sessions.get(businessId)?.status || "disconnected";
  }

  getQR(businessId: string) {
    return this.sessions.get(businessId)?.qr || null;
  }

  async disconnect(businessId: string): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(businessId);
    if (!session?.socket) return { success: false, error: "No active session" };
    try {
      this.clearBackupTimer(businessId);
      await session.socket.end(new Error("User disconnected"));
      session.status = "disconnected";
      this.sessions.delete(businessId);
      const sessionDir = path.join(process.cwd(), "sessions", `session-${businessId}`);
      if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // ─── Session Credential Persistence (MongoDB) ───────────────────────────────

  /**
   * Backs up the current session's creds.json to MongoDB as a gzip buffer.
   * Called every 5 minutes once connected, and on graceful shutdown.
   */
  async backupSessionCredentials(businessId: string): Promise<void> {
    const sessionDir = path.join(process.cwd(), "sessions", `session-${businessId}`);
    const credsFile = path.join(sessionDir, "creds.json");
    if (!fs.existsSync(credsFile)) return;

    try {
      const raw = fs.readFileSync(credsFile);
      const compressed = await gzip(raw);
      await WhatsAppCredential.findOneAndUpdate(
        { businessId },
        { credentialsGzip: compressed },
        { upsert: true, new: true }
      );
      console.log(`[SessionBackup] ✅ Credentials backed up for business ${businessId}`);
    } catch (err: any) {
      console.error(`[SessionBackup] ❌ Failed to backup credentials for ${businessId}:`, err.message);
    }
  }

  /**
   * Restores credentials from MongoDB to the filesystem.
   * Skips if the session directory already exists (session still intact after soft restart).
   */
  async restoreSessionCredentials(businessId: string): Promise<boolean> {
    const sessionDir = path.join(process.cwd(), "sessions", `session-${businessId}`);

    // ✅ User requirement: skip restore if folder already exists
    if (fs.existsSync(sessionDir)) {
      console.log(`[SessionRestore] Session folder already exists for ${businessId}, skipping restore.`);
      return true;
    }

    try {
      const record = await WhatsAppCredential.findOne({ businessId });
      if (!record) {
        console.log(`[SessionRestore] No saved credentials for ${businessId}`);
        return false;
      }

      fs.mkdirSync(sessionDir, { recursive: true });
      const raw = await gunzip(record.credentialsGzip);
      fs.writeFileSync(path.join(sessionDir, "creds.json"), raw);
      console.log(`[SessionRestore] ✅ Credentials restored from MongoDB for business ${businessId}`);
      return true;
    } catch (err: any) {
      console.error(`[SessionRestore] ❌ Failed to restore credentials for ${businessId}:`, err.message);
      return false;
    }
  }

  /**
   * On service startup: restore credentials for all businesses that have a backup,
   * then attempt to reconnect them automatically.
   */
  async restoreAllSessions(): Promise<void> {
    try {
      const records = await WhatsAppCredential.find({}, { businessId: 1 }).lean();
      if (records.length === 0) {
        console.log("[SessionRestore] No saved sessions found.");
        return;
      }
      console.log(`[SessionRestore] Restoring ${records.length} session(s)...`);
      for (const { businessId } of records) {
        const restored = await this.restoreSessionCredentials(businessId);
        if (restored) {
          await this.initSession(businessId);
        }
      }
    } catch (err: any) {
      console.error("[SessionRestore] Error during startup restore:", err.message);
    }
  }

  private startBackupTimer(businessId: string) {
    this.clearBackupTimer(businessId);
    const timer = setInterval(
      () => this.backupSessionCredentials(businessId),
      5 * 60 * 1000 // every 5 minutes
    );
    // Don't block Node.js exit
    timer.unref();
    const session = this.sessions.get(businessId);
    if (session) session.backupTimer = timer;
  }

  private clearBackupTimer(businessId: string) {
    const session = this.sessions.get(businessId);
    if (session?.backupTimer) {
      clearInterval(session.backupTimer);
      session.backupTimer = undefined;
    }
  }

  // ─── Human Takeover ─────────────────────────────────────────────────────────

  async pauseAIForConversation(businessId: string, customerId: string, remoteJid: string, userId: string, reason?: string): Promise<boolean> {
    const sessionId = `${businessId}:${remoteJid}`;
    const session = this.getSessionContext(sessionId);
    if (session) session.isLockedToHuman = true;
    try {
      const { ConversationOverride } = require("../models/ConversationOverride");
      await ConversationOverride.findOneAndUpdate(
        { businessId, customerId },
        {
          aiPaused: true,
          isActive: true,
          pausedAt: new Date(),
          ownerTookOver: true,
          reason: reason || undefined,
          "currentTakeover.ownerId": userId,
          "currentTakeover.startedAt": new Date(),
          "currentTakeover.lastActivity": new Date(),
          "currentTakeover.reason": reason ? "support" : "other",
        },
        { upsert: true }
      );
      return true;
    } catch {
      return false;
    }
  }

  async resumeAIForConversation(businessId: string, customerId: string, remoteJid: string, summary: string): Promise<boolean> {
    try {
      console.log("[Resume AI] Starting for customer:", customerId, "business:", businessId);
      const sessionId = `${businessId}:${remoteJid}`;
      const session = this.getSessionContext(sessionId);
      if (session) {
        session.isLockedToHuman = false;
        session.memory["last_takeover_summary"] = summary;
      }
      const { ConversationOverride } = require("../models/ConversationOverride");
      const result = await ConversationOverride.findOneAndUpdate(
        { businessId, customerId },
        { $set: { isActive: false, aiPaused: false, ownerTookOver: false, resumedAt: new Date(), notes: summary } },
        { new: true }
      );
      if (!result) console.log("[Resume AI] No override record found to update");
      return true;
    } catch (error: any) {
      console.error("[Resume AI] Error:", error.message);
      return false;
    }
  }

  getTakeoverStatus(businessId: string, customerId: string) {
    const sessionId = `${businessId}:${customerId}`;
    const session = this.getSessionContext(sessionId);
    return { active: session?.isLockedToHuman || false };
  }

  async handleOwnerMessage(businessId: string, customerId: string, remoteJid: string, ownerId: string, content: string): Promise<boolean> {
    try {
      await this.pauseAIForConversation(businessId, customerId, remoteJid, ownerId, content);
      const { ConversationOverride } = require("../models/ConversationOverride");
      const override = await ConversationOverride.findOne({ businessId, customerId });
      if (override) await override.recordOwnerMessage();
      await this.sendMessage(businessId, remoteJid, content);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Incoming Message Handling ───────────────────────────────────────────────

  async handleIncomingMessage(businessId: string, msg: any) {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    // ✅ Ignore messages sent by the bot/business itself
    if (msg.key.fromMe) return;

    const messageId = msg.key.id;

    // ✅ Deduplication: skip if already processed within last 60s
    if (messageId && (await messageDeduplicator.isDuplicate(messageId))) {
      console.log(`[DEDUP] Skipping duplicate message ${messageId} for business ${businessId}`);
      return;
    }

    const content =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.buttonsResponseMessage?.selectedButtonId ||
      msg.message?.buttonsResponseMessage?.selectedDisplayText ||
      msg.message?.templateButtonReplyMessage?.selectedId ||
      msg.message?.templateButtonReplyMessage?.selectedDisplayText ||
      msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.message?.listResponseMessage?.title ||
      "";
    if (!content) return;

    const sessionId = `${businessId}:${remoteJid}`;
    this.enqueueMessage(sessionId, () =>
      this.processSingleMessage(businessId, remoteJid, sessionId, content)
    );
  }

  /**
   * Per-user sequential queue.
   * Chains each message onto the tail of that user's promise chain.
   * Cleans up the map entry once the chain resolves (✅ no memory leak).
   */
  private enqueueMessage(sessionId: string, task: () => Promise<void>): void {
    const tail = this.messageQueues.get(sessionId) ?? Promise.resolve();
    const next = tail
      .then(() => task())
      .catch((err) => {
        console.error(`[Queue] Unhandled error for session ${sessionId}:`, err);
      })
      .finally(() => {
        // ✅ Clean up entry when this is still the tail
        if (this.messageQueues.get(sessionId) === next) {
          this.messageQueues.delete(sessionId);
        }
      });
    this.messageQueues.set(sessionId, next);
  }

  private async processSingleMessage(businessId: string, userId: string, sessionId: string, text: string) {
    let session = await this.loadSession(sessionId, userId, businessId);
    console.log(`[SESSION] id=${sessionId} state=${session.conversationState} text="${text}" cart=${session.cart?.length ?? 0}`);

    const now = Date.now();
    if (session && now - session.lastActiveAt > CONSTANTS.SESSION_TIMEOUT_MS) {
      console.log(`[SESSION_TIMEOUT] Resetting session for ${sessionId}`);
      session = this.createNewSession(sessionId, userId, businessId);
    }

    if (session.isLockedToHuman) {
      console.log(`[HUMAN_LOCKED] Message from ${userId} skipped by bot.`);
      return;
    }

    if (text.length > 1000) {
      await this.sendMessage(businessId, userId, "Message too long. Please shorten it.");
      return;
    }

    try {
      const phoneNumber = userId.split("@")[0];
      const { Customer } = require("../models/Customer");
      let customer = await Customer.findOne({ businessId, phone: phoneNumber }).select("_id").lean();
      if (!customer) {
        customer = await Customer.create({ businessId, phone: phoneNumber, name: "Customer", state: { step: "INITIAL" } });
      }
      const customerObjectId = customer._id.toString();

      const { ConversationOverride } = require("../models/ConversationOverride");
      const override = await ConversationOverride.findOne({ businessId, customerId: customerObjectId, aiPaused: true })
        .select("aiPaused")
        .lean();
      if (override?.aiPaused) {
        console.log(`[HUMAN_LOCKED] DB says paused for ${userId}. Updating session.`);
        session.isLockedToHuman = true;
        this.userSessions.set(sessionId, session);
        await this.saveSession(session);
        return;
      }

      const result: RuleEngineResponse = await ruleEngine.handleIncomingMessage(session, text);
      this.userSessions.set(sessionId, result.updatedSession);
      await this.saveSession(result.updatedSession);

      if (result.response) {
        // Send main message (with primary image if it's a BaileysMessage)
        await this.sendMessage(businessId, userId, result.response);

        // Send additional images if available (for product details with multiple images)
        const additionalImageUrls = (result.response as any).additionalImageUrls;
        if (additionalImageUrls && additionalImageUrls.length > 0) {
          for (const imageUrl of additionalImageUrls) {
            try {
              await this.sendMessage(businessId, userId, { image: { url: imageUrl } });
              // Small delay between images to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e: any) {
              console.error(`[IMG_ERROR] Failed to send additional image ${imageUrl}:`, e?.message || e);
            }
          }
        }
      }

      if (result.actions?.includes("NOTIFY_ADMIN"))
        console.log(`[ESCALATION] Notify admin for session ${sessionId}`);
    } catch (e: any) {
      console.error(`[MSG_ERROR] businessId=${businessId} sessionId=${sessionId} error=${e?.message}`, e);
      await this.sendMessage(businessId, userId, "Sorry, I encountered an error. Please try again later.");
    }
  }

  // ─── Session Context (Conversation State) ───────────────────────────────────

  private async loadSession(sessionId: string, userId: string, businessId: string): Promise<SessionContext> {
    const cached = this.userSessions.get(sessionId);
    if (cached) return cached;

    try {
      const ConversationSessionModel = require("../models/ConversationSession").default;
      const doc = await ConversationSessionModel.findOne({ sessionId }).lean();
      if (doc) {
        const session: SessionContext = {
          sessionId: doc.sessionId,
          userId: doc.userId,
          businessId: doc.businessId,
          conversationState: doc.conversationState,
          language: doc.language || "en",
          cart: doc.cart || [],
          userDetails: doc.userDetails || {},
          deliveryDetails: doc.deliveryDetails || undefined,
          memory: doc.memory || {},
          fallbackCount: doc.fallbackCount || 0,
          isLockedToHuman: doc.isLockedToHuman || false,
          lastActiveAt: doc.lastActiveAt || Date.now(),
          lastShownProducts: doc.lastShownProducts || [],
          currentProduct: doc.currentProduct || null,
          meta: doc.meta || {},
        };
        this.userSessions.set(sessionId, session);
        return session;
      }
    } catch (e) {
      console.error("[SESSION] Failed to load session from DB:", e);
    }
    return this.createNewSession(sessionId, userId, businessId);
  }

  private async saveSession(session: SessionContext): Promise<void> {
    try {
      const ConversationSessionModel = require("../models/ConversationSession").default;
      const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
      await ConversationSessionModel.findOneAndUpdate(
        { sessionId: session.sessionId },
        { $set: { ...session, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      console.error("[SESSION] Failed to save session to DB:", e);
    }
  }

  private getSessionContext(sessionId: string): SessionContext | undefined {
    return this.userSessions.get(sessionId);
  }

  private createNewSession(sessionId: string, userId: string, businessId: string): SessionContext {
    return {
      sessionId,
      userId,
      businessId,
      conversationState: BotState.IDLE,
      language: "en",
      cart: [],
      userDetails: {},
      memory: {},
      fallbackCount: 0,
      isLockedToHuman: false,
      lastActiveAt: Date.now(),
      lastShownProducts: [],
      currentProduct: null,
      meta: {},
    };
  }

  // ─── Send Message ────────────────────────────────────────────────────────────

  async sendMessage(businessId: string, to: string, content: string | any): Promise<boolean> {
    const session = this.sessions.get(businessId);
    if (!session?.socket) {
      console.warn(`[WhatsAppSessionManager] Cannot send message: No active session for business ${businessId}. Status: ${session?.status || "unknown"}`);
      return false;
    }
    if (session.status !== "connected") {
      console.warn(`[WhatsAppSessionManager] Cannot send message: Session not connected. Status: ${session.status}`);
      return false;
    }

    const payload = typeof content === "object" && content !== null ? content : { text: content };
    try {
      const result = await session.socket.sendMessage(to, payload);
      if (result) {
        console.log(`[WhatsAppSessionManager] ✅ Message sent to ${to} for business ${businessId}`);
        return true;
      }
      console.warn(`[WhatsAppSessionManager] ⚠️ Message send returned no result for ${to}`);
      return false;
    } catch (e: any) {
      console.error(`[WhatsAppSessionManager] ❌ Failed to send message to ${to}:`, e?.message || e);
      return false;
    }
  }

  // ─── Baileys Client Creation ─────────────────────────────────────────────────

  async createWhatsAppClient(businessId: string) {
    const existingSession = this.sessions.get(businessId);
    if (existingSession?.socket) {
      try { existingSession.socket.end(new Error("Reconnecting")); } catch { }
      // Delay to let WhatsApp servers fully release the old session before connecting anew
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const sessionDir = path.join(process.cwd(), "sessions", `session-${businessId}`);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    let version;
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch {
      version = [2, 3000, 1015901307] as [number, number, number];
    }

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
    });

    this.sessions.set(businessId, {
      socket: sock,
      status: existingSession?.status === "connected" ? "connected" : "connecting",
      qr: null,
      retryCount: existingSession?.retryCount || 0,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const s = this.sessions.get(businessId);
        if (s && s.status === "connected") return;
        if (s) { s.qr = qr; s.status = "qr_ready"; }
        qrcode.generate(qr, { small: true });
        this.notifyDashboard(businessId, "connection-update", { status: "qr_ready", qr });
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const isConflict = statusCode === 440;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const shouldReconnect = !isLoggedOut && !isConflict;

        const s = this.sessions.get(businessId);
        if (s) { s.status = "disconnected"; s.qr = null; }

        // Stop backup timer on disconnect
        this.clearBackupTimer(businessId);

        // Log structured disconnect event
        console.log(`[WA_DISCONNECT] businessId=${businessId} statusCode=${statusCode} shouldReconnect=${shouldReconnect} retryCount=${s?.retryCount ?? 0}`);

        if (shouldReconnect) {
          if (this.reconnectTimers.has(businessId)) return;
          const current = this.sessions.get(businessId);
          const retryCount = current?.retryCount ?? 0;
          if (retryCount >= this.MAX_RETRIES) {
            this.sessions.delete(businessId);
            this.reconnectTimers.delete(businessId);
            this.notifyDashboard(businessId, "connection-update", {
              status: "disconnected",
              message: "Max reconnection attempts reached. Please reconnect manually.",
            });
            return;
          }
          const delayMs = Math.min(3000 * Math.pow(2, retryCount), 30000);
          const timer = setTimeout(async () => {
            this.reconnectTimers.delete(businessId);
            const s2 = this.sessions.get(businessId);
            if (s2) s2.retryCount = retryCount + 1;
            await this.createWhatsAppClient(businessId);
          }, delayMs);
          this.reconnectTimers.set(businessId, timer);
        } else {
          this.sessions.delete(businessId);
          this.reconnectTimers.delete(businessId);
          if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });

          // CRUCIAL: Remove the bad credentials from the database as well so it doesn't get restored on restart
          const { WhatsAppCredential } = require("../models/WhatsAppCredential");
          WhatsAppCredential.deleteOne({ businessId }).catch(console.error);

          let message = "Disconnected.";
          if (isConflict) message = "Disconnected because WhatsApp was opened elsewhere (Conflict). Please scan again if you wish to use this device.";
          if (isLoggedOut || statusCode === 401) message = "Session invalid or logged out. Please scan the QR code to reconnect.";

          this.notifyDashboard(businessId, "connection-update", { status: "disconnected", message });
        }
      } else if (connection === "open") {
        // Validate duplicate numbers across businesses
        const currentUserId = sock.user?.id?.split(':')[0];
        if (currentUserId) {
          let duplicateBusinessId = null;
          for (const [otherBusinessId, otherSession] of this.sessions.entries()) {
            if (otherBusinessId !== businessId && otherSession.status === "connected") {
              const otherUserId = otherSession.socket?.user?.id?.split(':')[0];
              if (otherUserId === currentUserId) {
                duplicateBusinessId = otherBusinessId;
                break;
              }
            }
          }

          if (duplicateBusinessId) {
            console.warn(`[WA_DUPLICATE] Number ${currentUserId} is already used by business ${duplicateBusinessId}`);

            // Clean up this duplicate attempt
            sock.logout();
            this.sessions.delete(businessId);

            // Notify frontend
            this.notifyDashboard(businessId, "connection-update", {
              status: "disconnected",
              message: "This WhatsApp number is already connected to another business in the system. You must use a unique number."
            });

            // Delete the conflicting local credentials
            if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });

            // Also notify the DB to delete credentials for this business so it doesn't try to restore
            const { WhatsAppCredential } = require("../models/WhatsAppCredential");
            WhatsAppCredential.deleteOne({ businessId }).catch(console.error);

            return;
          }
        }

        const s = this.sessions.get(businessId);
        if (s) { s.status = "connected"; s.qr = null; s.retryCount = 0; }
        const timer = this.reconnectTimers.get(businessId);
        if (timer) { clearTimeout(timer); this.reconnectTimers.delete(businessId); }

        // ✅ Start periodic credential backup to MongoDB
        this.startBackupTimer(businessId);
        // Also do an immediate backup on first connect
        this.backupSessionCredentials(businessId);

        this.notifyDashboard(businessId, "connection-update", { status: "connected" });
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (m.type === "notify") {
        for (const msg of m.messages) {
          // ✅ fromMe check happens inside handleIncomingMessage
          await this.handleIncomingMessage(businessId, msg);
        }
      }
    });
  }

  // ─── Dashboard Notification ──────────────────────────────────────────────────

  notifyDashboard(businessId: string, event: string, data: any) {
    if (this.io) this.io.to(businessId).emit(event, { ...data, businessId });
  }
}

export const whatsappSessionManager = WhatsAppSessionManager.getInstance();