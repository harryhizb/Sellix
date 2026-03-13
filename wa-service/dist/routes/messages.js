"use strict";
// ========================================
// Messages Routes
// Integration with New RuleEngine
// ========================================
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
const express_1 = require("express");
const WhatsAppSessionManager_1 = require("../lib/WhatsAppSessionManager");
const lib_1 = require("../lib");
const sessionService_1 = require("../services/sessionService");
const Business_1 = require("../models/Business");
const router = (0, express_1.Router)();
/**
 * POST /api/send-message
 * Send outgoing message from business
 */
router.post("/send-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, to, message } = req.body;
        if (!businessId || !to || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        yield WhatsAppSessionManager_1.whatsappSessionManager.sendMessage(businessId, to, message);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: error.message });
    }
}));
/**
 * POST /api/process-message
 * Process incoming message through RuleEngine
 * This is the new endpoint using the refactored RuleEngine
 */
router.post("/process-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, customerId, message } = req.body;
        if (!businessId || !customerId || !message) {
            return res.status(400).json({
                error: 'Missing required fields: businessId, customerId, message',
            });
        }
        // Get or create session
        const session = yield (0, sessionService_1.getOrCreateSession)(customerId, businessId);
        // Get business context
        const business = yield Business_1.Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        // Get products if needed
        const Product = business.schema.path('products') ? business.get('products') : [];
        // Process message through RuleEngine
        const result = yield lib_1.ruleEngine.handleIncomingMessage(session, message);
        // Save updated session
        yield (0, sessionService_1.saveSession)(result.updatedSession);
        // Return response
        res.json({
            success: true,
            reply: result.response,
            intent: result.newState,
            sessionState: result.updatedSession.conversationState,
            cartItemCount: result.updatedSession.cart.length,
            escalated: result.updatedSession.isLockedToHuman,
        });
    }
    catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}));
/**
 * GET /api/session/:businessId/:customerId
 * Get current session state
 */
router.get("/session/:businessId/:customerId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, customerId } = req.params;
        const session = yield (0, sessionService_1.getOrCreateSession)(customerId, businessId);
        // const summary = ruleEngine.getSessionSummary(session); // Not implemented in base
        res.json({
            session,
            // summary,
        });
    }
    catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
}));
/**
 * POST /api/reset-session/:businessId/:customerId
 * Reset session (clear cart and state)
 */
router.post("/reset-session/:businessId/:customerId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { businessId, customerId } = req.params;
        const session = yield (0, sessionService_1.getOrCreateSession)(customerId, businessId);
        // Process RESET event
        const result = yield lib_1.ruleEngine.handleIncomingMessage(session, '__RESET__');
        yield (0, sessionService_1.saveSession)(result.updatedSession);
        res.json({
            success: true,
            message: 'Session reset successfully',
            session: result.updatedSession,
        });
    }
    catch (error) {
        console.error('Error resetting session:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
}));
exports.default = router;
