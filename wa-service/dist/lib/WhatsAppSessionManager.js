"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappSessionManager = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const zlib_1 = __importDefault(require("zlib"));
const util_1 = require("util");
const RuleEngine_1 = require("./RuleEngine");
const types_1 = require("./types");
const MessageDeduplicator_1 = require("./MessageDeduplicator");
const WhatsAppCredential_1 = require("../models/WhatsAppCredential");
const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
const gunzip = (0, util_1.promisify)(zlib_1.default.gunzip);
// ─── WhatsAppSessionManager ───────────────────────────────────────────────────
class WhatsAppSessionManager {
    constructor() {
        this.sessions = new Map();
        this.io = null;
        this.reconnectTimers = new Map();
        this.MAX_RETRIES = 5;
        // Per-user conversation sessions (in-memory cache)
        this.userSessions = new Map();
        /**
         * Per-sessionId message processing queue.
         * Stores the "tail" promise so each new message chains onto the previous one.
         * Entries are deleted once the chain resolves (no memory leak).
         */
        this.messageQueues = new Map();
    }
    static getInstance() {
        if (!WhatsAppSessionManager.instance) {
            WhatsAppSessionManager.instance = new WhatsAppSessionManager();
        }
        return WhatsAppSessionManager.instance;
    }
    setIO(io) {
        this.io = io;
    }
    /** Returns the number of currently active (connected) WA sessions. */
    getActiveSessionCount() {
        let count = 0;
        for (const s of this.sessions.values()) {
            if (s.status === "connected")
                count++;
        }
        return count;
    }
    // ─── Session Init / Disconnect ──────────────────────────────────────────────
    initSession(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = this.sessions.get(businessId);
                if (existing) {
                    if (existing.status === "connected")
                        return { success: true, session: { status: "connected" } };
                    if (existing.status === "connecting" || existing.status === "qr_ready") {
                        return { success: true, session: { status: existing.status, qr: existing.qr } };
                    }
                }
                yield this.createWhatsAppClient(businessId);
                return { success: true, session: { status: "connecting" } };
            }
            catch (e) {
                return { success: false, error: e.message };
            }
        });
    }
    getStatus(businessId) {
        var _a;
        return ((_a = this.sessions.get(businessId)) === null || _a === void 0 ? void 0 : _a.status) || "disconnected";
    }
    getQR(businessId) {
        var _a;
        return ((_a = this.sessions.get(businessId)) === null || _a === void 0 ? void 0 : _a.qr) || null;
    }
    disconnect(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.sessions.get(businessId);
            if (!(session === null || session === void 0 ? void 0 : session.socket))
                return { success: false, error: "No active session" };
            try {
                this.clearBackupTimer(businessId);
                yield session.socket.end(new Error("User disconnected"));
                session.status = "disconnected";
                this.sessions.delete(businessId);
                const sessionDir = path_1.default.join(process.cwd(), "sessions", `session-${businessId}`);
                if (fs_1.default.existsSync(sessionDir))
                    fs_1.default.rmSync(sessionDir, { recursive: true, force: true });
                return { success: true };
            }
            catch (e) {
                return { success: false, error: e.message };
            }
        });
    }
    // ─── Session Credential Persistence (MongoDB) ───────────────────────────────
    /**
     * Backs up the current session's creds.json to MongoDB as a gzip buffer.
     * Called every 5 minutes once connected, and on graceful shutdown.
     */
    backupSessionCredentials(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionDir = path_1.default.join(process.cwd(), "sessions", `session-${businessId}`);
            const credsFile = path_1.default.join(sessionDir, "creds.json");
            if (!fs_1.default.existsSync(credsFile))
                return;
            try {
                const raw = fs_1.default.readFileSync(credsFile);
                const compressed = yield gzip(raw);
                yield WhatsAppCredential_1.WhatsAppCredential.findOneAndUpdate({ businessId }, { credentialsGzip: compressed }, { upsert: true, new: true });
                console.log(`[SessionBackup] ✅ Credentials backed up for business ${businessId}`);
            }
            catch (err) {
                console.error(`[SessionBackup] ❌ Failed to backup credentials for ${businessId}:`, err.message);
            }
        });
    }
    /**
     * Restores credentials from MongoDB to the filesystem.
     * Skips if the session directory already exists (session still intact after soft restart).
     */
    restoreSessionCredentials(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionDir = path_1.default.join(process.cwd(), "sessions", `session-${businessId}`);
            // ✅ User requirement: skip restore if folder already exists
            if (fs_1.default.existsSync(sessionDir)) {
                console.log(`[SessionRestore] Session folder already exists for ${businessId}, skipping restore.`);
                return true;
            }
            try {
                const record = yield WhatsAppCredential_1.WhatsAppCredential.findOne({ businessId });
                if (!record) {
                    console.log(`[SessionRestore] No saved credentials for ${businessId}`);
                    return false;
                }
                fs_1.default.mkdirSync(sessionDir, { recursive: true });
                const raw = yield gunzip(record.credentialsGzip);
                fs_1.default.writeFileSync(path_1.default.join(sessionDir, "creds.json"), raw);
                console.log(`[SessionRestore] ✅ Credentials restored from MongoDB for business ${businessId}`);
                return true;
            }
            catch (err) {
                console.error(`[SessionRestore] ❌ Failed to restore credentials for ${businessId}:`, err.message);
                return false;
            }
        });
    }
    /**
     * On service startup: restore credentials for all businesses that have a backup,
     * then attempt to reconnect them automatically.
     */
    restoreAllSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const records = yield WhatsAppCredential_1.WhatsAppCredential.find({}, { businessId: 1 }).lean();
                if (records.length === 0) {
                    console.log("[SessionRestore] No saved sessions found.");
                    return;
                }
                console.log(`[SessionRestore] Restoring ${records.length} session(s)...`);
                for (const { businessId } of records) {
                    const restored = yield this.restoreSessionCredentials(businessId);
                    if (restored) {
                        yield this.initSession(businessId);
                    }
                }
            }
            catch (err) {
                console.error("[SessionRestore] Error during startup restore:", err.message);
            }
        });
    }
    startBackupTimer(businessId) {
        this.clearBackupTimer(businessId);
        const timer = setInterval(() => this.backupSessionCredentials(businessId), 5 * 60 * 1000 // every 5 minutes
        );
        // Don't block Node.js exit
        timer.unref();
        const session = this.sessions.get(businessId);
        if (session)
            session.backupTimer = timer;
    }
    clearBackupTimer(businessId) {
        const session = this.sessions.get(businessId);
        if (session === null || session === void 0 ? void 0 : session.backupTimer) {
            clearInterval(session.backupTimer);
            session.backupTimer = undefined;
        }
    }
    // ─── Human Takeover ─────────────────────────────────────────────────────────
    pauseAIForConversation(businessId, customerId, remoteJid, userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = `${businessId}:${remoteJid}`;
            const session = this.getSessionContext(sessionId);
            if (session)
                session.isLockedToHuman = true;
            try {
                const { ConversationOverride } = require("../models/ConversationOverride");
                yield ConversationOverride.findOneAndUpdate({ businessId, customerId }, {
                    aiPaused: true,
                    isActive: true,
                    pausedAt: new Date(),
                    ownerTookOver: true,
                    reason: reason || undefined,
                    "currentTakeover.ownerId": userId,
                    "currentTakeover.startedAt": new Date(),
                    "currentTakeover.lastActivity": new Date(),
                    "currentTakeover.reason": reason ? "support" : "other",
                }, { upsert: true });
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    resumeAIForConversation(businessId, customerId, remoteJid, summary) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("[Resume AI] Starting for customer:", customerId, "business:", businessId);
                const sessionId = `${businessId}:${remoteJid}`;
                const session = this.getSessionContext(sessionId);
                if (session) {
                    session.isLockedToHuman = false;
                    session.memory["last_takeover_summary"] = summary;
                }
                const { ConversationOverride } = require("../models/ConversationOverride");
                const result = yield ConversationOverride.findOneAndUpdate({ businessId, customerId }, { $set: { isActive: false, aiPaused: false, ownerTookOver: false, resumedAt: new Date(), notes: summary } }, { new: true });
                if (!result)
                    console.log("[Resume AI] No override record found to update");
                return true;
            }
            catch (error) {
                console.error("[Resume AI] Error:", error.message);
                return false;
            }
        });
    }
    getTakeoverStatus(businessId, customerId) {
        const sessionId = `${businessId}:${customerId}`;
        const session = this.getSessionContext(sessionId);
        return { active: (session === null || session === void 0 ? void 0 : session.isLockedToHuman) || false };
    }
    handleOwnerMessage(businessId, customerId, remoteJid, ownerId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pauseAIForConversation(businessId, customerId, remoteJid, ownerId, content);
                const { ConversationOverride } = require("../models/ConversationOverride");
                const override = yield ConversationOverride.findOne({ businessId, customerId });
                if (override)
                    yield override.recordOwnerMessage();
                yield this.sendMessage(businessId, remoteJid, content);
                return true;
            }
            catch (_a) {
                return false;
            }
        });
    }
    // ─── Incoming Message Handling ───────────────────────────────────────────────
    handleIncomingMessage(businessId, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            const remoteJid = msg.key.remoteJid;
            if (!remoteJid)
                return;
            // ✅ Ignore messages sent by the bot/business itself
            if (msg.key.fromMe)
                return;
            const messageId = msg.key.id;
            // ✅ Deduplication: skip if already processed within last 60s
            if (messageId && (yield MessageDeduplicator_1.messageDeduplicator.isDuplicate(messageId))) {
                console.log(`[DEDUP] Skipping duplicate message ${messageId} for business ${businessId}`);
                return;
            }
            const content = ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation) ||
                ((_c = (_b = msg.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
                ((_e = (_d = msg.message) === null || _d === void 0 ? void 0 : _d.buttonsResponseMessage) === null || _e === void 0 ? void 0 : _e.selectedButtonId) ||
                ((_g = (_f = msg.message) === null || _f === void 0 ? void 0 : _f.buttonsResponseMessage) === null || _g === void 0 ? void 0 : _g.selectedDisplayText) ||
                ((_j = (_h = msg.message) === null || _h === void 0 ? void 0 : _h.templateButtonReplyMessage) === null || _j === void 0 ? void 0 : _j.selectedId) ||
                ((_l = (_k = msg.message) === null || _k === void 0 ? void 0 : _k.templateButtonReplyMessage) === null || _l === void 0 ? void 0 : _l.selectedDisplayText) ||
                ((_p = (_o = (_m = msg.message) === null || _m === void 0 ? void 0 : _m.listResponseMessage) === null || _o === void 0 ? void 0 : _o.singleSelectReply) === null || _p === void 0 ? void 0 : _p.selectedRowId) ||
                ((_r = (_q = msg.message) === null || _q === void 0 ? void 0 : _q.listResponseMessage) === null || _r === void 0 ? void 0 : _r.title) ||
                "";
            if (!content)
                return;
            const sessionId = `${businessId}:${remoteJid}`;
            this.enqueueMessage(sessionId, () => this.processSingleMessage(businessId, remoteJid, sessionId, content));
        });
    }
    /**
     * Per-user sequential queue.
     * Chains each message onto the tail of that user's promise chain.
     * Cleans up the map entry once the chain resolves (✅ no memory leak).
     */
    enqueueMessage(sessionId, task) {
        var _a;
        const tail = (_a = this.messageQueues.get(sessionId)) !== null && _a !== void 0 ? _a : Promise.resolve();
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
    processSingleMessage(businessId, userId, sessionId, text) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            let session = yield this.loadSession(sessionId, userId, businessId);
            console.log(`[SESSION] id=${sessionId} state=${session.conversationState} text="${text}" cart=${(_b = (_a = session.cart) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0}`);
            const now = Date.now();
            if (session && now - session.lastActiveAt > types_1.CONSTANTS.SESSION_TIMEOUT_MS) {
                console.log(`[SESSION_TIMEOUT] Resetting session for ${sessionId}`);
                session = this.createNewSession(sessionId, userId, businessId);
            }
            if (session.isLockedToHuman) {
                console.log(`[HUMAN_LOCKED] Message from ${userId} skipped by bot.`);
                return;
            }
            if (text.length > 1000) {
                yield this.sendMessage(businessId, userId, "Message too long. Please shorten it.");
                return;
            }
            try {
                const phoneNumber = userId.split("@")[0];
                const { Customer } = require("../models/Customer");
                let customer = yield Customer.findOne({ businessId, phone: phoneNumber }).select("_id").lean();
                if (!customer) {
                    customer = yield Customer.create({ businessId, phone: phoneNumber, name: "Customer", state: { step: "INITIAL" } });
                }
                const customerObjectId = customer._id.toString();
                const { ConversationOverride } = require("../models/ConversationOverride");
                const override = yield ConversationOverride.findOne({ businessId, customerId: customerObjectId, aiPaused: true })
                    .select("aiPaused")
                    .lean();
                if (override === null || override === void 0 ? void 0 : override.aiPaused) {
                    console.log(`[HUMAN_LOCKED] DB says paused for ${userId}. Updating session.`);
                    session.isLockedToHuman = true;
                    this.userSessions.set(sessionId, session);
                    yield this.saveSession(session);
                    return;
                }
                const result = yield RuleEngine_1.ruleEngine.handleIncomingMessage(session, text);
                this.userSessions.set(sessionId, result.updatedSession);
                yield this.saveSession(result.updatedSession);
                if (result.response) {
                    // Send main message (with primary image if it's a BaileysMessage)
                    yield this.sendMessage(businessId, userId, result.response);
                    // Send additional images if available (for product details with multiple images)
                    const additionalImageUrls = result.response.additionalImageUrls;
                    if (additionalImageUrls && additionalImageUrls.length > 0) {
                        for (const imageUrl of additionalImageUrls) {
                            try {
                                yield this.sendMessage(businessId, userId, { image: { url: imageUrl } });
                                // Small delay between images to avoid rate limiting
                                yield new Promise(resolve => setTimeout(resolve, 500));
                            }
                            catch (e) {
                                console.error(`[IMG_ERROR] Failed to send additional image ${imageUrl}:`, (e === null || e === void 0 ? void 0 : e.message) || e);
                            }
                        }
                    }
                }
                if ((_c = result.actions) === null || _c === void 0 ? void 0 : _c.includes("NOTIFY_ADMIN"))
                    console.log(`[ESCALATION] Notify admin for session ${sessionId}`);
            }
            catch (e) {
                console.error(`[MSG_ERROR] businessId=${businessId} sessionId=${sessionId} error=${e === null || e === void 0 ? void 0 : e.message}`, e);
                yield this.sendMessage(businessId, userId, "Sorry, I encountered an error. Please try again later.");
            }
        });
    }
    // ─── Session Context (Conversation State) ───────────────────────────────────
    loadSession(sessionId, userId, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.userSessions.get(sessionId);
            if (cached)
                return cached;
            try {
                const ConversationSessionModel = require("../models/ConversationSession").default;
                const doc = yield ConversationSessionModel.findOne({ sessionId }).lean();
                if (doc) {
                    const session = {
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
            }
            catch (e) {
                console.error("[SESSION] Failed to load session from DB:", e);
            }
            return this.createNewSession(sessionId, userId, businessId);
        });
    }
    saveSession(session) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ConversationSessionModel = require("../models/ConversationSession").default;
                const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
                yield ConversationSessionModel.findOneAndUpdate({ sessionId: session.sessionId }, { $set: Object.assign(Object.assign({}, session), { expiresAt: new Date(Date.now() + SESSION_TTL_MS) }) }, { upsert: true, new: true, setDefaultsOnInsert: true });
            }
            catch (e) {
                console.error("[SESSION] Failed to save session to DB:", e);
            }
        });
    }
    getSessionContext(sessionId) {
        return this.userSessions.get(sessionId);
    }
    createNewSession(sessionId, userId, businessId) {
        return {
            sessionId,
            userId,
            businessId,
            conversationState: types_1.BotState.IDLE,
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
    sendMessage(businessId, to, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.sessions.get(businessId);
            if (!(session === null || session === void 0 ? void 0 : session.socket)) {
                console.warn(`[WhatsAppSessionManager] Cannot send message: No active session for business ${businessId}. Status: ${(session === null || session === void 0 ? void 0 : session.status) || "unknown"}`);
                return false;
            }
            if (session.status !== "connected") {
                console.warn(`[WhatsAppSessionManager] Cannot send message: Session not connected. Status: ${session.status}`);
                return false;
            }
            const payload = typeof content === "object" && content !== null ? content : { text: content };
            try {
                const result = yield session.socket.sendMessage(to, payload);
                if (result) {
                    console.log(`[WhatsAppSessionManager] ✅ Message sent to ${to} for business ${businessId}`);
                    return true;
                }
                console.warn(`[WhatsAppSessionManager] ⚠️ Message send returned no result for ${to}`);
                return false;
            }
            catch (e) {
                console.error(`[WhatsAppSessionManager] ❌ Failed to send message to ${to}:`, (e === null || e === void 0 ? void 0 : e.message) || e);
                return false;
            }
        });
    }
    // ─── Baileys Client Creation ─────────────────────────────────────────────────
    createWhatsAppClient(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingSession = this.sessions.get(businessId);
            if (existingSession === null || existingSession === void 0 ? void 0 : existingSession.socket) {
                try {
                    existingSession.socket.end(new Error("Reconnecting"));
                }
                catch (_a) { }
                // Delay to let WhatsApp servers fully release the old session before connecting anew
                yield new Promise(resolve => setTimeout(resolve, 2000));
            }
            const sessionDir = path_1.default.join(process.cwd(), "sessions", `session-${businessId}`);
            if (!fs_1.default.existsSync(sessionDir))
                fs_1.default.mkdirSync(sessionDir, { recursive: true });
            const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(sessionDir);
            let version;
            try {
                const v = yield (0, baileys_1.fetchLatestBaileysVersion)();
                version = v.version;
            }
            catch (_b) {
                version = [2, 3000, 1015901307];
            }
            const sock = (0, baileys_1.default)({
                version,
                auth: state,
                printQRInTerminal: false,
                browser: ["Ubuntu", "Chrome", "20.0.04"],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
            });
            this.sessions.set(businessId, {
                socket: sock,
                status: (existingSession === null || existingSession === void 0 ? void 0 : existingSession.status) === "connected" ? "connected" : "connecting",
                qr: null,
                retryCount: (existingSession === null || existingSession === void 0 ? void 0 : existingSession.retryCount) || 0,
            });
            sock.ev.on("creds.update", saveCreds);
            sock.ev.on("connection.update", (update) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const s = this.sessions.get(businessId);
                    if (s && s.status === "connected")
                        return;
                    if (s) {
                        s.qr = qr;
                        s.status = "qr_ready";
                    }
                    qrcode_terminal_1.default.generate(qr, { small: true });
                    this.notifyDashboard(businessId, "connection-update", { status: "qr_ready", qr });
                }
                if (connection === "close") {
                    const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                    const isConflict = statusCode === 440;
                    const isLoggedOut = statusCode === baileys_1.DisconnectReason.loggedOut;
                    const shouldReconnect = !isLoggedOut && !isConflict;
                    const s = this.sessions.get(businessId);
                    if (s) {
                        s.status = "disconnected";
                        s.qr = null;
                    }
                    // Stop backup timer on disconnect
                    this.clearBackupTimer(businessId);
                    // Log structured disconnect event
                    console.log(`[WA_DISCONNECT] businessId=${businessId} statusCode=${statusCode} shouldReconnect=${shouldReconnect} retryCount=${(_c = s === null || s === void 0 ? void 0 : s.retryCount) !== null && _c !== void 0 ? _c : 0}`);
                    if (shouldReconnect) {
                        if (this.reconnectTimers.has(businessId))
                            return;
                        const current = this.sessions.get(businessId);
                        const retryCount = (_d = current === null || current === void 0 ? void 0 : current.retryCount) !== null && _d !== void 0 ? _d : 0;
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
                        const timer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                            this.reconnectTimers.delete(businessId);
                            const s2 = this.sessions.get(businessId);
                            if (s2)
                                s2.retryCount = retryCount + 1;
                            yield this.createWhatsAppClient(businessId);
                        }), delayMs);
                        this.reconnectTimers.set(businessId, timer);
                    }
                    else {
                        this.sessions.delete(businessId);
                        this.reconnectTimers.delete(businessId);
                        if (fs_1.default.existsSync(sessionDir))
                            fs_1.default.rmSync(sessionDir, { recursive: true, force: true });
                        // CRUCIAL: Remove the bad credentials from the database as well so it doesn't get restored on restart
                        const { WhatsAppCredential } = require("../models/WhatsAppCredential");
                        WhatsAppCredential.deleteOne({ businessId }).catch(console.error);
                        let message = "Disconnected.";
                        if (isConflict)
                            message = "Disconnected because WhatsApp was opened elsewhere (Conflict). Please scan again if you wish to use this device.";
                        if (isLoggedOut || statusCode === 401)
                            message = "Session invalid or logged out. Please scan the QR code to reconnect.";
                        this.notifyDashboard(businessId, "connection-update", { status: "disconnected", message });
                    }
                }
                else if (connection === "open") {
                    // Validate duplicate numbers across businesses
                    const currentUserId = (_f = (_e = sock.user) === null || _e === void 0 ? void 0 : _e.id) === null || _f === void 0 ? void 0 : _f.split(':')[0];
                    if (currentUserId) {
                        let duplicateBusinessId = null;
                        for (const [otherBusinessId, otherSession] of this.sessions.entries()) {
                            if (otherBusinessId !== businessId && otherSession.status === "connected") {
                                const otherUserId = (_j = (_h = (_g = otherSession.socket) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.id) === null || _j === void 0 ? void 0 : _j.split(':')[0];
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
                            if (fs_1.default.existsSync(sessionDir))
                                fs_1.default.rmSync(sessionDir, { recursive: true, force: true });
                            // Also notify the DB to delete credentials for this business so it doesn't try to restore
                            const { WhatsAppCredential } = require("../models/WhatsAppCredential");
                            WhatsAppCredential.deleteOne({ businessId }).catch(console.error);
                            return;
                        }
                    }
                    const s = this.sessions.get(businessId);
                    if (s) {
                        s.status = "connected";
                        s.qr = null;
                        s.retryCount = 0;
                    }
                    const timer = this.reconnectTimers.get(businessId);
                    if (timer) {
                        clearTimeout(timer);
                        this.reconnectTimers.delete(businessId);
                    }
                    // ✅ Start periodic credential backup to MongoDB
                    this.startBackupTimer(businessId);
                    // Also do an immediate backup on first connect
                    this.backupSessionCredentials(businessId);
                    this.notifyDashboard(businessId, "connection-update", { status: "connected" });
                }
            });
            sock.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
                if (m.type === "notify") {
                    for (const msg of m.messages) {
                        // ✅ fromMe check happens inside handleIncomingMessage
                        yield this.handleIncomingMessage(businessId, msg);
                    }
                }
            }));
        });
    }
    // ─── Dashboard Notification ──────────────────────────────────────────────────
    notifyDashboard(businessId, event, data) {
        if (this.io)
            this.io.to(businessId).emit(event, Object.assign(Object.assign({}, data), { businessId }));
    }
}
exports.whatsappSessionManager = WhatsAppSessionManager.getInstance();
