// ========================================
// Messages Routes
// Integration with New RuleEngine
// ========================================

import { Router } from "express";
import { whatsappSessionManager } from "../lib/WhatsAppSessionManager";
import { ruleEngine } from "../lib";
import { getOrCreateSession, saveSession } from "../services/sessionService";
import { Business } from "../models/Business";

const router = Router();

/**
 * POST /api/send-message
 * Send outgoing message from business
 */
router.post("/send-message", async (req, res) => {
    try {
        const { businessId, to, message } = req.body;

        if (!businessId || !to || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        await whatsappSessionManager.sendMessage(businessId, to, message);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/process-message
 * Process incoming message through RuleEngine
 * This is the new endpoint using the refactored RuleEngine
 */
router.post("/process-message", async (req, res) => {
    try {
        const { businessId, customerId, message } = req.body;

        if (!businessId || !customerId || !message) {
            return res.status(400).json({
                error: 'Missing required fields: businessId, customerId, message',
            });
        }

        // Get or create session
        const session = await getOrCreateSession(customerId, businessId);

        // Get business context
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Get products if needed
        const Product = business.schema.path('products') ? business.get('products') : [];

        // Process message through RuleEngine
        const result = await ruleEngine.handleIncomingMessage(session, message);

        // Save updated session
        await saveSession(result.updatedSession);

        // Return response
        res.json({
            success: true,
            reply: result.response,
            intent: result.newState,
            sessionState: result.updatedSession.conversationState,
            cartItemCount: result.updatedSession.cart.length,
            escalated: result.updatedSession.isLockedToHuman,
        });
    } catch (error: any) {
        console.error('Error processing message:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
});

/**
 * GET /api/session/:businessId/:customerId
 * Get current session state
 */
router.get("/session/:businessId/:customerId", async (req, res) => {
    try {
        const { businessId, customerId } = req.params;

        const session = await getOrCreateSession(customerId, businessId);
        // const summary = ruleEngine.getSessionSummary(session); // Not implemented in base

        res.json({
            session,
            // summary,
        });
    } catch (error: any) {
        console.error('Error getting session:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});

/**
 * POST /api/reset-session/:businessId/:customerId
 * Reset session (clear cart and state)
 */
router.post("/reset-session/:businessId/:customerId", async (req, res) => {
    try {
        const { businessId, customerId } = req.params;

        const session = await getOrCreateSession(customerId, businessId);

        // Process RESET event
        const result = await ruleEngine.handleIncomingMessage(session, '__RESET__');

        await saveSession(result.updatedSession);

        res.json({
            success: true,
            message: 'Session reset successfully',
            session: result.updatedSession,
        });
    } catch (error: any) {
        console.error('Error resetting session:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});

export default router;
