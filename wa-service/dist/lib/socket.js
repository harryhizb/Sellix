"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalIO = void 0;
exports.setupSocket = setupSocket;
const auth_1 = require("./auth");
const WhatsAppSessionManager_1 = require("./WhatsAppSessionManager");
/**
 * Setup Socket.IO for multi-tenant event routing
 *
 * Key Principles:
 * - Each business has its own room (room = businessId)
 * - Socket.IO ONLY routes events, does NOT manage WhatsApp sessions
 * - Sessions survive socket disconnects
 */
exports.globalIO = null;
function setupSocket(io) {
    exports.globalIO = io;
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        console.log("Socket connection attempt - Token present:", !!token);
        if (!token) {
            console.error("No token provided in socket authentication");
            return next(new Error("Authentication error"));
        }
        const decoded = (0, auth_1.verifyToken)(token);
        console.log("Token verification result:", !!decoded);
        if (!decoded) {
            console.error("Token verification failed");
            return next(new Error("Authentication error"));
        }
        console.log("Socket authenticated for user:", decoded);
        // @ts-ignore
        socket.data.user = decoded;
        next();
    });
    io.on("connection", (socket) => __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        const { userId, businessId } = socket.data.user;
        console.log(`Socket connected: User ${userId}, Business ${businessId}`);
        // Auto-join business room
        socket.join(businessId.toString());
        console.log(`Socket joined room: ${businessId}`);
        // Emit current status and QR if available
        const status = WhatsAppSessionManager_1.whatsappSessionManager.getStatus(businessId);
        const qr = WhatsAppSessionManager_1.whatsappSessionManager.getQR(businessId);
        socket.emit("status", status);
        if (qr && status !== "connected") {
            socket.emit("qr", qr);
            console.log(`Re-emitted existing QR to socket for ${businessId}`);
        }
        // Handle disconnect
        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: User ${userId}, Reason: ${reason}`);
            // NOTE: We do NOT destroy WhatsApp session on socket disconnect
        });
        // Handle errors
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    }));
}
