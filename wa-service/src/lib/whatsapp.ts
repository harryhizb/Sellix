import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";

class WhatsAppManager {
    private sessions: Map<string, any> = new Map();
    private retryCount: Map<string, number> = new Map();
    private sessionStatus: Map<string, string> = new Map(); // Track connection status
    private currentQR: Map<string, string> = new Map(); // Track current QR code

    async connect(businessId: string, io: Server) {
        let sock: any = null;
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

            const sessionDir = path.join(__dirname, "../../sessions", businessId);
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
            const { version } = await fetchLatestBaileysVersion();

            sock = makeWASocket({
                version,
                auth: state,
                browser: ["Windows", "Chrome", "110.0.0"],
            });

            // Save session in memory
            this.sessions.set(businessId, sock);

            sock.ev.on("creds.update", saveCreds);

            sock.ev.on("connection.update", async (update: any) => {
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
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    console.log(`Connection closed for ${businessId}, status: ${statusCode}, reconnecting: ${shouldReconnect}`);

                    if (shouldReconnect) {
                        this.sessionStatus.set(businessId, "reconnecting");
                        this.retryCount.set(businessId, currentRetries + 1);
                        setTimeout(() => this.connect(businessId, io), 5000); // 5s delay
                    } else {
                        console.log(`Session logged out for ${businessId}. Cleaning up session directory.`);
                        this.sessions.delete(businessId);
                        this.retryCount.delete(businessId);
                        this.sessionStatus.delete(businessId);
                        this.currentQR.delete(businessId);

                        // Delete session folder to allow fresh login
                        if (fs.existsSync(sessionDir)) {
                            fs.rmSync(sessionDir, { recursive: true, force: true });
                        }
                        io.to(businessId).emit("status", "disconnected");
                    }
                } else if (connection === "open") {
                    console.log(`Connection opened for ${businessId}`);
                    this.retryCount.set(businessId, 0); // Reset on success
                    this.sessionStatus.set(businessId, "connected");
                    this.currentQR.delete(businessId); // Clear QR once connected
                    io.to(businessId).emit("status", "connected");
                }
            });
            // Listen for messages
            sock.ev.on("messages.upsert", async (m: any) => {
                try {
                    const msg = m.messages[0];
                    if (!msg.message || m.type !== "notify" || msg.key.fromMe) return;

                    const remoteJid = msg.key.remoteJid!;
                    const content = msg.message.conversation || msg.message.extendedTextMessage?.text;

                    if (!content) return;

                    console.log(`Msg from ${remoteJid}: ${content}`);

                    // 1. Identify/Create Customer
                    // Lazy load Customer to avoid circular dependency issues if any
                    const { Customer } = require("../models/Customer");
                    const { MessageLog } = require("../models/MessageLog");
                    const { aiService } = require("./ai"); // delayed import

                    let customer = await Customer.findOne({ phone: remoteJid, businessId });
                    if (!customer) {
                        customer = await Customer.create({
                            phone: remoteJid,
                            businessId,
                            name: msg.pushName || "Unknown",
                        });
                    }

                    // 2. Save User Message
                    await MessageLog.create({
                        customerId: customer._id,
                        businessId,
                        from: "customer",
                        content,
                        messageId: msg.key.id
                    });

                    // 3. Generate AI Response
                    // Fetch recent history
                    const history = await MessageLog.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(10);

                    const aiResponse = await aiService.generateResponse(businessId, content, history.reverse(), customer._id);

                    // 4. Send Response
                    if (aiResponse.imageUrl) {
                        await sock.sendMessage(remoteJid, {
                            image: { url: aiResponse.imageUrl },
                            caption: aiResponse.text
                        });
                    } else {
                        await sock.sendMessage(remoteJid, { text: aiResponse.text });
                    }

                    // 5. Save AI Message
                    await MessageLog.create({
                        customerId: customer._id,
                        businessId,
                        from: "ai",
                        content: aiResponse.text,
                    });

                } catch (error) {
                    console.error("Error handling message:", error);
                }
            });
        } catch (error) {
            console.error(`Error in WhatsApp connect for ${businessId}:`, error);
            io.to(businessId).emit("error", "Internal server error during connection.");
        }
    }

    async sendMessage(businessId: string, to: string, text: string) {
        const sock = this.sessions.get(businessId);
        if (sock) {
            let jid = to.replace(/\+/g, "").replace(/\s/g, "");
            if (!jid.includes("@s.whatsapp.net") && !jid.includes("@g.us")) {
                jid = jid + "@s.whatsapp.net";
            }
            try {
                await sock.sendMessage(jid, { text });
                console.log(`Sent message to ${jid} from business ${businessId}`);
            } catch (e) {
                console.error(`Failed to send to ${jid}`, e);
                throw e;
            }
        } else {
            throw new Error("WhatsApp session not active for this business");
        }
    }

    async sendToOwner(businessId: string, ownerPhone: string, text: string) {
        await this.sendMessage(businessId, ownerPhone, text);
    }

    disconnect(businessId: string) {
        const sock = this.sessions.get(businessId);
        if (sock) {
            sock.end(undefined);
            this.sessions.delete(businessId);
        }
    }
}

export const whatsappManager = new WhatsAppManager();
