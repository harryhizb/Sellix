import { Router, Request, Response } from "express";
import { verifyToken } from "../lib/auth";
import { MessageLog } from "../models/MessageLog";
import { Customer } from "../models/Customer";
import { ConversationOverride } from "../models/ConversationOverride";

const router = Router();

/**
 * Get conversation history
 * GET /api/conversations/:customerId/messages
 */
router.get("/:customerId/messages", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { customerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const messages = await MessageLog.find({
      businessId: decoded.businessId,
      customerId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all active conversations
 * GET /api/conversations
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    // Get customers with recent activity
    const recentMessages = await MessageLog.aggregate([
      { $match: { businessId: decoded.businessId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customerId",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" }
    ]);

    const conversations = recentMessages.map(item => ({
      customerId: item._id,
      customerName: item.customer.name,
      customerPhone: item.customer.phone,
      lastMessage: item.lastMessage.content,
      timestamp: item.lastMessage.createdAt,
      unreadCount: 0 // Implement logic for unread count if needed
    }));

    res.json({ conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active takeover sessions (MOVED UP to avoid conflict with :customerId)
 * GET /api/conversations/takeover/active
 */
router.get("/takeover/active", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const businessId = req.query.businessId as string || decoded.businessId;

    // improved query to match existing models
    const activeTakeovers = await ConversationOverride.find({
      businessId,
      isActive: true
    }).populate("customerId", "name phone avatar");
    
    console.log('[Takeover Active] Found takeovers:', JSON.stringify(activeTakeovers, null, 2));

    res.json({ takeovers: activeTakeovers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start takeover
 * POST /api/conversations/takeover/start
 */
router.post("/takeover/start", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { customerId, reason } = req.body;
    if (!customerId) return res.status(400).json({ error: "Missing customerId" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const remoteJid = `${customer.phone}@s.whatsapp.net`;

    const { whatsappSessionManager } = require("../lib/WhatsAppSessionManager");
    const result = await whatsappSessionManager.pauseAIForConversation(
      decoded.businessId,
      customerId,
      remoteJid,
      decoded.userId,
      reason // Pass the reason
    );

    if (result) {
      res.json({ success: true, message: "Takeover started" });
    } else {
      res.status(500).json({ error: "Failed to start takeover" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop takeover / Resume AI
 * POST /api/conversations/takeover/stop
 */
router.post("/takeover/stop", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    console.log('[Takeover Stop] Decoded token:', decoded);
    console.log('[Takeover Stop] Request body:', req.body);

    const { customerId, businessId, summary } = req.body;
    
    // Use businessId from request body or from token
    const targetBusinessId = businessId || decoded.businessId || decoded.business;
    
    if (!customerId) return res.status(400).json({ error: "Missing customerId" });
    if (!targetBusinessId) return res.status(400).json({ error: "Missing businessId" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const remoteJid = `${customer.phone}@s.whatsapp.net`;

    console.log('[Takeover Stop] Resuming AI for customer:', customerId, 'business:', targetBusinessId);

    const { whatsappSessionManager } = require("../lib/WhatsAppSessionManager");
    const result = await whatsappSessionManager.resumeAIForConversation(
      targetBusinessId,
      customerId,
      remoteJid,
      summary
    );

    if (result) {
      res.json({ success: true, message: "Takeover stopped, AI resumed" });
    } else {
      res.status(500).json({ error: "Failed to stop takeover" });
    }
  } catch (error: any) {
    console.error('[Takeover Stop] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send message (Owner)
 * POST /api/conversations/send
 */
router.post("/send", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    const { customerId, message } = req.body;
    if (!customerId || !message) return res.status(400).json({ error: "Missing fields" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    const remoteJid = `${customer.phone}@s.whatsapp.net`;

    const { whatsappSessionManager } = require("../lib/WhatsAppSessionManager");
    const result = await whatsappSessionManager.handleOwnerMessage(
      decoded.businessId,
      customerId,
      remoteJid,
      decoded.userId,
      message
    );

    if (result) {
      res.json({ success: true, message: "Message sent" });
    } else {
      res.status(500).json({ error: "Failed to send message" });
    }
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;