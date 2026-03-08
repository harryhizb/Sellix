import { Router, Request, Response } from "express";
import { whatsappSessionManager } from "../lib/WhatsAppSessionManager";
import { verifyToken } from "../lib/auth";
import { Socket } from "socket.io";

const router = Router();

// Store socket-user mapping (simple in-memory store)
const socketUserMap = new Map<string, string>(); // socketId -> userId

// This function should be called from your socket.io setup
export function setSocketUserMap(socketId: string, userId: string) {
    socketUserMap.set(socketId, userId);
}

export function getSocketUserMap() {
    return socketUserMap;
}

/**
 * Initialize WhatsApp session for a business
 * POST /api/whatsapp/init
 */
router.post("/init", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId, userId } = decoded as any;
        if (!businessId) {
            return res.status(400).json({ error: "No business ID in token" });
        }

        // Phone number is optional - will be obtained after QR scan
        const { phoneNumber } = req.body;

        // Initialize session WITHOUT requiring phone number
        const result = await whatsappSessionManager.initSession(businessId);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        // Get socket.io instance from session manager
        const io = (whatsappSessionManager as any).io;
        if (io) {
            // Find all sockets for this user
            const sockets = await io.fetchSockets();
            const userSockets = sockets.filter((socket: Socket) => {
                const socketUserId = socketUserMap.get(socket.id);
                return socketUserId === userId;
            });

            // Join all user sockets to business room
            userSockets.forEach((socket: Socket) => {
                socket.join(businessId);
                console.log(`Socket ${socket.id} joined business room ${businessId} for user ${userId}`);
            });
        }

        res.json({
            success: true,
            message: "WhatsApp session initialized",
            businessId,
            status: result.session?.status || "connecting"
        });
    } catch (error: any) {
        console.error("Error initializing WhatsApp session:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get WhatsApp session status
 * GET /api/whatsapp/status
 */
router.get("/status", (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const status = whatsappSessionManager.getStatus(businessId);
        const qr = whatsappSessionManager.getQR(businessId);

        res.json({
            businessId,
            status,
            qr: qr || null
        });
    } catch (error: any) {
        console.error("Error getting WhatsApp status:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current QR code (HTTP fallback)
 * GET /api/whatsapp/qr
 */
router.get("/qr", (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const qr = whatsappSessionManager.getQR(businessId);

        if (!qr) {
            return res.status(404).json({ error: "No QR code available" });
        }

        res.json({ qr });
    } catch (error: any) {
        console.error("Error getting QR code:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Disconnect WhatsApp session
 * DELETE /api/whatsapp/disconnect
 */
router.delete("/disconnect", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const result = await whatsappSessionManager.disconnect(businessId);

        res.json(result);
    } catch (error: any) {
        console.error("Error disconnecting WhatsApp:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Join business room for QR updates (socket.io fallback)
 * POST /api/whatsapp/join-room
 */
router.post("/join-room", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId, userId } = decoded as any;
        const { socketId } = req.body;

        if (!socketId) {
            return res.status(400).json({ error: "Socket ID required" });
        }

        // Get socket.io instance
        const io = (whatsappSessionManager as any).io;
        if (!io) {
            return res.status(500).json({ error: "Socket.IO not initialized" });
        }

        // Get socket
        const socket = io.sockets.sockets.get(socketId) as Socket;
        if (!socket) {
            return res.status(404).json({ error: "Socket not found" });
        }

        // Join business room
        socket.join(businessId);
        console.log(`Socket ${socketId} joined business room ${businessId}`);

        // Store mapping
        setSocketUserMap(socketId, userId);

        res.json({
            success: true,
            message: `Joined business room ${businessId}`
        });
    } catch (error: any) {
        console.error("Error joining business room:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Pause AI for a specific customer (takeover)
 * POST /api/whatsapp/takeover/pause
 */
router.post("/takeover/pause", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId, userId: ownerId } = decoded as any;
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: "Customer ID required" });
        }

        const { Customer } = require("../models/Customer");
        const customer = await Customer.findOne({ _id: customerId, businessId });
        if (!customer) return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;

        const success = await whatsappSessionManager.pauseAIForConversation(businessId, customerId, remoteJid, ownerId);

        if (!success) {
            return res.status(500).json({ error: "Failed to pause AI" });
        }

        res.json({
            success: true,
            message: "AI paused, owner takeover initiated"
        });
    } catch (error: any) {
        console.error("Error pausing AI:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Resume AI for a specific customer (handback)
 * POST /api/whatsapp/takeover/resume
 */
router.post("/takeover/resume", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const { customerId, handbackSummary } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: "Customer ID required" });
        }

        const { Customer } = require("../models/Customer");
        const customer = await Customer.findOne({ _id: customerId, businessId });
        if (!customer) return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;

        const success = await whatsappSessionManager.resumeAIForConversation(businessId, customerId, remoteJid, handbackSummary);

        if (!success) {
            return res.status(500).json({ error: "Failed to resume AI" });
        }

        res.json({
            success: true,
            message: "AI resumed, takeover ended"
        });
    } catch (error: any) {
        console.error("Error resuming AI:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get takeover status for a customer
 * GET /api/whatsapp/takeover/status/:customerId
 */
router.get("/takeover/status/:customerId", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const { customerId } = req.params;

        const status = await whatsappSessionManager.getTakeoverStatus(businessId, customerId);

        res.json(status);
    } catch (error: any) {
        console.error("Error getting takeover status:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Owner sends message during takeover
 * POST /api/whatsapp/takeover/send-message
 */
router.post("/takeover/send-message", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId, userId: ownerId } = decoded as any;
        const { customerId, content } = req.body;

        if (!customerId || !content) {
            return res.status(400).json({ error: "Customer ID and content required" });
        }

        const { Customer } = require("../models/Customer");
        const customer = await Customer.findOne({ _id: customerId, businessId });
        if (!customer) return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;

        const success = await whatsappSessionManager.handleOwnerMessage(businessId, customerId, remoteJid, ownerId, content);

        if (!success) {
            return res.status(500).json({ error: "Failed to send message" });
        }

        res.json({
            success: true,
            message: "Message sent to customer"
        });
    } catch (error: any) {
        console.error("Error sending owner message:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Send direct message to customer
 * POST /api/whatsapp/send-message
 */
router.post("/send-message", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: "Recipient and message required" });
        }

        await whatsappSessionManager.sendMessage(businessId, to, message);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
});

export const whatsappRoutes = router;
