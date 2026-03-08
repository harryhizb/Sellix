import express, { Router, Request, Response } from "express";
import { whatsappSessionManager } from "../lib/WhatsAppSessionManager";
import { verifyToken } from "../lib/auth";

const app = express.Router();

/**
 * Notify customer with a message
 * POST /api/notify/customer
 */
app.post("/notify-customer", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId, customerPhone, message } = req.body;

        if (!businessId || !customerPhone || !message) {
            return res.status(400).json({ error: "Missing fields: businessId, customerPhone, message" });
        }

        await whatsappSessionManager.sendMessage(businessId, customerPhone, message);
        res.json({ success: true, message: "Customer notified successfully" });
    } catch (e: any) {
        console.error("Error notifying customer:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Send bulk notifications
 * POST /api/notify/bulk
 */
app.post("/notify-bulk", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
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
                await whatsappSessionManager.sendMessage(businessId, recipient, message);
                results.push({ phone: recipient, success: true });
            } catch (error: any) {
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
    } catch (e: any) {
        console.error("Error sending bulk notifications:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Send direct message
 * POST /api/notify/messages/send
 */
app.post("/messages/send", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { to, message } = req.body;
        const { businessId } = decoded as any;

        if (!to || !message) {
            return res.status(400).json({ error: "Missing fields: to, message" });
        }

        await whatsappSessionManager.sendMessage(businessId, to, message);
        res.json({ success: true, message: "Message sent successfully" });
    } catch (e: any) {
        console.error("Error sending message:", e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Check notification status
 * GET /api/notify/status
 */
app.get("/status", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const { businessId } = decoded as any;
        
        const status = whatsappSessionManager.getStatus(businessId);
        
        res.json({
            businessId,
            status,
            isActive: status === "connected"
        });
    } catch (e: any) {
        console.error("Error checking notification status:", e);
        res.status(500).json({ error: e.message });
    }
});

export const notificationRoutes = app;
