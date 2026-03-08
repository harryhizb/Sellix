import { Server, Socket } from "socket.io";
import { verifyToken } from "./auth";
import { whatsappSessionManager } from "./WhatsAppSessionManager";

/**
 * Setup Socket.IO for multi-tenant event routing
 * 
 * Key Principles:
 * - Each business has its own room (room = businessId)
 * - Socket.IO ONLY routes events, does NOT manage WhatsApp sessions
 * - Sessions survive socket disconnects
 */
export let globalIO: Server | null = null;

export function setupSocket(io: Server) {
    globalIO = io;
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        console.log("Socket connection attempt - Token present:", !!token);

        if (!token) {
            console.error("No token provided in socket authentication");
            return next(new Error("Authentication error"));
        }

        const decoded = verifyToken(token);
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

    io.on("connection", async (socket: Socket) => {
        // @ts-ignore
        const { userId, businessId } = socket.data.user;

        console.log(`Socket connected: User ${userId}, Business ${businessId}`);

        // Auto-join business room
        socket.join(businessId.toString());
        console.log(`Socket joined room: ${businessId}`);

        // Emit current status and QR if available
        const status = whatsappSessionManager.getStatus(businessId);
        const qr = whatsappSessionManager.getQR(businessId);

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
    });
}
