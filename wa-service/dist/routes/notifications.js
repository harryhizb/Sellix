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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const WhatsAppSessionManager_1 = require("../lib/WhatsAppSessionManager");
const auth_1 = require("../lib/auth");
const app = express_1.default.Router();
/**
 * Notify customer with a message
 * POST /api/notify/customer
 */
app.post("/notify-customer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId, customerPhone, message } = req.body;
        if (!businessId || !customerPhone || !message) {
            return res.status(400).json({ error: "Missing fields: businessId, customerPhone, message" });
        }
        yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, customerPhone, message);
        res.json({ success: true, message: "Customer notified successfully" });
    }
    catch (e) {
        console.error("Error notifying customer:", e);
        res.status(500).json({ error: e.message });
    }
}));
/**
 * Send bulk notifications
 * POST /api/notify/bulk
 */
app.post("/notify-bulk", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const { recipients, message } = req.body;
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: "Recipients array required" });
        }
        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }
        const results = [];
        for (const recipient of recipients) {
            try {
                yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, recipient, message);
                results.push({ phone: recipient, success: true });
            }
            catch (error) {
                results.push({ phone: recipient, success: false, error: error.message });
            }
        }
        const successCount = results.filter(r => r.success).length;
        res.json({
            success: true,
            total: recipients.length,
            successCount,
            failureCount: recipients.length - successCount,
            results
        });
    }
    catch (e) {
        console.error("Error sending bulk notifications:", e);
        res.status(500).json({ error: e.message });
    }
}));
/**
 * Send direct message
 * POST /api/notify/messages/send
 */
app.post("/messages/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { to, message } = req.body;
        const { businessId } = decoded;
        if (!to || !message) {
            return res.status(400).json({ error: "Missing fields: to, message" });
        }
        yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, to, message);
        res.json({ success: true, message: "Message sent successfully" });
    }
    catch (e) {
        console.error("Error sending message:", e);
        res.status(500).json({ error: e.message });
    }
}));
/**
 * Check notification status
 * GET /api/notify/status
 */
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { businessId } = decoded;
        const status = WhatsAppSessionManager_1.whatsappSessionManager.getStatus(businessId);
        res.json({
            businessId,
            status,
            isActive: status === "connected"
        });
    }
    catch (e) {
        console.error("Error checking notification status:", e);
        res.status(500).json({ error: e.message });
    }
}));
exports.notificationRoutes = app;
