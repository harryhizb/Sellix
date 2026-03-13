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
exports.whatsappRoutes = void 0;
exports.setSocketUserMap = setSocketUserMap;
exports.getSocketUserMap = getSocketUserMap;
const express_1 = require("express");
const WhatsAppSessionManager_1 = require("../lib/WhatsAppSessionManager");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
// Store socket-user mapping (simple in-memory store)
const socketUserMap = new Map(); // socketId -> userId
// This function should be called from your socket.io setup
function setSocketUserMap(socketId, userId) {
    socketUserMap.set(socketId, userId);
}
function getSocketUserMap() {
    return socketUserMap;
}
/**
 * Initialize WhatsApp session for a business
 * POST /api/whatsapp/init
 */
router.post("/init", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId, userId } = decoded;
        if (!businessId) {
            return res.status(400).json({ error: "No business ID in token" });
        }
        // Phone number is optional - will be obtained after QR scan
        const { phoneNumber } = req.body;
        // Initialize session WITHOUT requiring phone number
        const result = yield WhatsAppSessionManager_1.whatsappSessionManager.initSession(businessId);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        // Get socket.io instance from session manager
        const io = WhatsAppSessionManager_1.whatsappSessionManager.io;
        if (io) {
            // Find all sockets for this user
            const sockets = yield io.fetchSockets();
            const userSockets = sockets.filter((socket) => {
                const socketUserId = socketUserMap.get(socket.id);
                return socketUserId === userId;
            });
            // Join all user sockets to business room
            userSockets.forEach((socket) => {
                socket.join(businessId);
                console.log(`Socket ${socket.id} joined business room ${businessId} for user ${userId}`);
            });
        }
        res.json({
            success: true,
            message: "WhatsApp session initialized",
            businessId,
            status: ((_b = result.session) === null || _b === void 0 ? void 0 : _b.status) || "connecting"
        });
    }
    catch (error) {
        console.error("Error initializing WhatsApp session:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Get WhatsApp session status
 * GET /api/whatsapp/status
 */
router.get("/status", (req, res) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const status = WhatsAppSessionManager_1.whatsappSessionManager.getStatus(businessId);
        const qr = WhatsAppSessionManager_1.whatsappSessionManager.getQR(businessId);
        res.json({
            businessId,
            status,
            qr: qr || null
        });
    }
    catch (error) {
        console.error("Error getting WhatsApp status:", error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get current QR code (HTTP fallback)
 * GET /api/whatsapp/qr
 */
router.get("/qr", (req, res) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const qr = WhatsAppSessionManager_1.whatsappSessionManager.getQR(businessId);
        if (!qr) {
            return res.status(404).json({ error: "No QR code available" });
        }
        res.json({ qr });
    }
    catch (error) {
        console.error("Error getting QR code:", error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Disconnect WhatsApp session
 * DELETE /api/whatsapp/disconnect
 */
router.delete("/disconnect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const result = yield WhatsAppSessionManager_1.whatsappSessionManager.disconnect(businessId);
        res.json(result);
    }
    catch (error) {
        console.error("Error disconnecting WhatsApp:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Join business room for QR updates (socket.io fallback)
 * POST /api/whatsapp/join-room
 */
router.post("/join-room", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId, userId } = decoded;
        const { socketId } = req.body;
        if (!socketId) {
            return res.status(400).json({ error: "Socket ID required" });
        }
        // Get socket.io instance
        const io = WhatsAppSessionManager_1.whatsappSessionManager.io;
        if (!io) {
            return res.status(500).json({ error: "Socket.IO not initialized" });
        }
        // Get socket
        const socket = io.sockets.sockets.get(socketId);
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
    }
    catch (error) {
        console.error("Error joining business room:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Pause AI for a specific customer (takeover)
 * POST /api/whatsapp/takeover/pause
 */
router.post("/takeover/pause", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId, userId: ownerId } = decoded;
        const { customerId } = req.body;
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID required" });
        }
        const { Customer } = require("../models/Customer");
        const customer = yield Customer.findOne({ _id: customerId, businessId });
        if (!customer)
            return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;
        const success = yield WhatsAppSessionManager_1.whatsappSessionManager.pauseAIForConversation(businessId, customerId, remoteJid, ownerId);
        if (!success) {
            return res.status(500).json({ error: "Failed to pause AI" });
        }
        res.json({
            success: true,
            message: "AI paused, owner takeover initiated"
        });
    }
    catch (error) {
        console.error("Error pausing AI:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Resume AI for a specific customer (handback)
 * POST /api/whatsapp/takeover/resume
 */
router.post("/takeover/resume", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const { customerId, handbackSummary } = req.body;
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID required" });
        }
        const { Customer } = require("../models/Customer");
        const customer = yield Customer.findOne({ _id: customerId, businessId });
        if (!customer)
            return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;
        const success = yield WhatsAppSessionManager_1.whatsappSessionManager.resumeAIForConversation(businessId, customerId, remoteJid, handbackSummary);
        if (!success) {
            return res.status(500).json({ error: "Failed to resume AI" });
        }
        res.json({
            success: true,
            message: "AI resumed, takeover ended"
        });
    }
    catch (error) {
        console.error("Error resuming AI:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Get takeover status for a customer
 * GET /api/whatsapp/takeover/status/:customerId
 */
router.get("/takeover/status/:customerId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const { customerId } = req.params;
        const status = yield WhatsAppSessionManager_1.whatsappSessionManager.getTakeoverStatus(businessId, customerId);
        res.json(status);
    }
    catch (error) {
        console.error("Error getting takeover status:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Owner sends message during takeover
 * POST /api/whatsapp/takeover/send-message
 */
router.post("/takeover/send-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId, userId: ownerId } = decoded;
        const { customerId, content } = req.body;
        if (!customerId || !content) {
            return res.status(400).json({ error: "Customer ID and content required" });
        }
        const { Customer } = require("../models/Customer");
        const customer = yield Customer.findOne({ _id: customerId, businessId });
        if (!customer)
            return res.status(404).json({ error: "Customer not found or unauthorized" });
        const remoteJid = `${customer.phone}@s.whatsapp.net`;
        const success = yield WhatsAppSessionManager_1.whatsappSessionManager.handleOwnerMessage(businessId, customerId, remoteJid, ownerId, content);
        if (!success) {
            return res.status(500).json({ error: "Failed to send message" });
        }
        res.json({
            success: true,
            message: "Message sent to customer"
        });
    }
    catch (error) {
        console.error("Error sending owner message:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * Send direct message to customer
 * POST /api/whatsapp/send-message
 */
router.post("/send-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ error: "Recipient and message required" });
        }
        yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, to, message);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
}));
exports.whatsappRoutes = router;
