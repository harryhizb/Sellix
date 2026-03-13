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
exports.whatsappManager = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class WhatsAppManager {
    constructor() {
        this.sessions = new Map();
        this.retryCount = new Map();
        this.sessionStatus = new Map(); // Track connection status
        this.currentQR = new Map(); // Track current QR code
    }
    connect(businessId, io) {
        return __awaiter(this, void 0, void 0, function* () {
            let sock = null;
            try {
                const currentRetries = this.retryCount.get(businessId) || 0;
                if (currentRetries > 5) {
                    console.error(`Max retries reached for ${businessId}. Stopping reconnection.`);
                    io.to(businessId).emit("error", "Failed to connect to WhatsApp after multiple attempts.");
                    return;
                }
                // Check if session already exists and is active
                if (this.sessions.has(businessId)) {
                    console.log(`Session already exists for ${businessId}, reusing existing connection`);
                    // Emit current status and QR if available
                    const currentStatus = this.sessionStatus.get(businessId) || "connecting";
                    const currentQR = this.currentQR.get(businessId);
                    io.to(businessId).emit("status", currentStatus);
                    if (currentQR && currentStatus !== "connected") {
                        io.to(businessId).emit("qr", currentQR);
                        console.log(`Re-emitting existing QR for ${businessId}`);
                    }
                    return;
                }
                const sessionDir = path_1.default.join(__dirname, "../../sessions", businessId);
                if (!fs_1.default.existsSync(sessionDir)) {
                    fs_1.default.mkdirSync(sessionDir, { recursive: true });
                }
                const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(sessionDir);
                const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
                sock = (0, baileys_1.default)({
                    version,
                    auth: state,
                    browser: ["Windows", "Chrome", "110.0.0"],
                });
                // Save session in memory
                this.sessions.set(businessId, sock);
                sock.ev.on("creds.update", saveCreds);
                sock.ev.on("connection.update", (update) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const { connection, lastDisconnect, qr } = update;
                    if (qr) {
                        // Store QR code for re-emission to new socket connections
                        this.currentQR.set(businessId, qr);
                        this.sessionStatus.set(businessId, "qr_ready");
                        // Emit QR to frontend via Socket.io room
                        io.to(businessId).emit("qr", qr);
                        console.log(`QR generated and emitted for ${businessId}`);
                    }
                    if (connection === "close") {
                        const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                        const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut;
                        console.log(`Connection closed for ${businessId}, status: ${statusCode}, reconnecting: ${shouldReconnect}`);
                        if (shouldReconnect) {
                            this.sessionStatus.set(businessId, "reconnecting");
                            this.retryCount.set(businessId, currentRetries + 1);
                            setTimeout(() => this.connect(businessId, io), 5000); // 5s delay
                        }
                        else {
                            console.log(`Session logged out for ${businessId}. Cleaning up session directory.`);
                            this.sessions.delete(businessId);
                            this.retryCount.delete(businessId);
                            this.sessionStatus.delete(businessId);
                            this.currentQR.delete(businessId);
                            // Delete session folder to allow fresh login
                            if (fs_1.default.existsSync(sessionDir)) {
                                fs_1.default.rmSync(sessionDir, { recursive: true, force: true });
                            }
                            io.to(businessId).emit("status", "disconnected");
                        }
                    }
                    else if (connection === "open") {
                        console.log(`Connection opened for ${businessId}`);
                        this.retryCount.set(businessId, 0); // Reset on success
                        this.sessionStatus.set(businessId, "connected");
                        this.currentQR.delete(businessId); // Clear QR once connected
                        io.to(businessId).emit("status", "connected");
                    }
                }));
                // Listen for messages
                sock.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    try {
                        const msg = m.messages[0];
                        if (!msg.message || m.type !== "notify" || msg.key.fromMe)
                            return;
                        const remoteJid = msg.key.remoteJid;
                        const content = msg.message.conversation || ((_a = msg.message.extendedTextMessage) === null || _a === void 0 ? void 0 : _a.text);
                        if (!content)
                            return;
                        console.log(`Msg from ${remoteJid}: ${content}`);
                        // 1. Identify/Create Customer
                        // Lazy load Customer to avoid circular dependency issues if any
                        const { Customer } = require("../models/Customer");
                        const { MessageLog } = require("../models/MessageLog");
                        const { aiService } = require("./ai"); // delayed import
                        let customer = yield Customer.findOne({ phone: remoteJid, businessId });
                        if (!customer) {
                            customer = yield Customer.create({
                                phone: remoteJid,
                                businessId,
                                name: msg.pushName || "Unknown",
                            });
                        }
                        // 2. Save User Message
                        yield MessageLog.create({
                            customerId: customer._id,
                            businessId,
                            from: "customer",
                            content,
                            messageId: msg.key.id
                        });
                        // 3. Generate AI Response
                        // Fetch recent history
                        const history = yield MessageLog.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(10);
                        const aiResponse = yield aiService.generateResponse(businessId, content, history.reverse(), customer._id);
                        // 4. Send Response
                        if (aiResponse.imageUrl) {
                            yield sock.sendMessage(remoteJid, {
                                image: { url: aiResponse.imageUrl },
                                caption: aiResponse.text
                            });
                        }
                        else {
                            yield sock.sendMessage(remoteJid, { text: aiResponse.text });
                        }
                        // 5. Save AI Message
                        yield MessageLog.create({
                            customerId: customer._id,
                            businessId,
                            from: "ai",
                            content: aiResponse.text,
                        });
                    }
                    catch (error) {
                        console.error("Error handling message:", error);
                    }
                }));
            }
            catch (error) {
                console.error(`Error in WhatsApp connect for ${businessId}:`, error);
                io.to(businessId).emit("error", "Internal server error during connection.");
            }
        });
    }
    sendMessage(businessId, to, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const sock = this.sessions.get(businessId);
            if (sock) {
                let jid = to.replace(/\+/g, "").replace(/\s/g, "");
                if (!jid.includes("@s.whatsapp.net") && !jid.includes("@g.us")) {
                    jid = jid + "@s.whatsapp.net";
                }
                try {
                    yield sock.sendMessage(jid, { text });
                    console.log(`Sent message to ${jid} from business ${businessId}`);
                }
                catch (e) {
                    console.error(`Failed to send to ${jid}`, e);
                    throw e;
                }
            }
            else {
                throw new Error("WhatsApp session not active for this business");
            }
        });
    }
    sendToOwner(businessId, ownerPhone, text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendMessage(businessId, ownerPhone, text);
        });
    }
    disconnect(businessId) {
        const sock = this.sessions.get(businessId);
        if (sock) {
            sock.end(undefined);
            this.sessions.delete(businessId);
        }
    }
}
exports.whatsappManager = new WhatsAppManager();
