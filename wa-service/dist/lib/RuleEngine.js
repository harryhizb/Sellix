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
exports.ruleEngine = exports.RuleEngine = void 0;
const types_1 = require("./types");
const normalization_1 = require("./normalization");
const BusinessService_1 = require("./BusinessService");
const security_1 = require("./security");
const FlowRouter_1 = require("./engines/FlowRouter");
const TemplateRegistry_1 = require("./templates/TemplateRegistry");
class RuleEngine {
    handleIncomingMessage(session, rawMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[RuleEngine] Processing message for business:${session.businessId} user:${session.userId} state:${session.conversationState}`);
            let cleanMessage = "";
            let aiContext = null;
            try {
                cleanMessage = (0, security_1.sanitizeInput)(rawMessage);
                // Check for acknowledgment/thanks messages that should be ignored
                if ((0, normalization_1.shouldIgnoreMessage)(cleanMessage)) {
                    console.log(`[RuleEngine] Ignoring acknowledgment message: "${cleanMessage}"`);
                    return {
                        response: "", // Empty response - no reply sent
                        newState: session.conversationState, // Keep current state
                        updatedSession: session
                    };
                }
                aiContext = yield BusinessService_1.businessService.getBusinessContext(session.businessId);
                console.log(`[RuleEngine] Business capabilities:`, aiContext === null || aiContext === void 0 ? void 0 : aiContext.capabilities);
                // Check for human takeover
                const isPaused = yield BusinessService_1.businessService.isConversationPaused(session.businessId, session.userId);
                if (isPaused) {
                    console.log(`[RuleEngine] AI paused for user ${session.userId}. Handing off to human.`);
                    return {
                        response: "",
                        newState: types_1.BotState.HUMAN_HANDOFF,
                        updatedSession: session
                    };
                }
            }
            catch (error) {
                console.error(`[RuleEngine] Error in handleIncomingMessage:`, error);
                return {
                    response: "Sorry, something went wrong. Please try again.",
                    newState: session.conversationState,
                    updatedSession: session
                };
            }
            this.checkSessionTimeout(session);
            session.lastActiveAt = Date.now();
            // ─────────────────────────────────────────────────────────────────────
            // ROUTING PRIORITY:
            //
            // 1. Non-numeric global commands (OWNER, MENU, CART) — safe at all states
            // 2. If state is NOT IDLE/MAIN_MENU → delegate exclusively to FlowRouter
            // 3. If state IS IDLE/MAIN_MENU → check numeric global commands, then FlowRouter
            // 4. Fallback: show main menu
            //
            // WHY: Numeric inputs like "2" are contextual. In AWAITING_QUANTITY they mean
            // "quantity 2". In MAIN_MENU they mean "track order". Global numeric shortcuts
            // must NEVER override state-specific logic in FlowRouter.
            // ─────────────────────────────────────────────────────────────────────
            // Step 1: Non-numeric global commands (safe to run at all states)
            const nonNumericResult = yield this.checkNonNumericGlobalCommands(session, cleanMessage, aiContext);
            if (nonNumericResult)
                return this.finalize(session, nonNumericResult);
            // Handle AWAITING_HUMAN_REASON state - capture reason and activate takeover
            if (session.conversationState === types_1.BotState.AWAITING_HUMAN_REASON) {
                const norm = cleanMessage.trim().toLowerCase();
                // Allow user to cancel
                if (norm === 'menu' || norm === 'cancel') {
                    return this.finalize(session, {
                        response: `✅ *Cancelled*\n\nReturning to main menu.`,
                        newState: types_1.BotState.MAIN_MENU,
                        updatedSession: session
                    });
                }
                // Save reason and activate human takeover
                try {
                    yield BusinessService_1.businessService.activateConversationOverride(session.businessId, session.userId, cleanMessage.trim() // Pass the reason
                    );
                    return this.finalize(session, {
                        response: `✅ *Connecting you to our team!*\n\n` +
                            `Reason: ${cleanMessage.trim()}\n\n` +
                            `A team member will join this chat shortly.\n` +
                            `Please stay on the line — we'll be right with you! 🙏\n\n` +
                            `_The AI will not respond while you are connected to a human agent._`,
                        newState: types_1.BotState.HUMAN_HANDOFF,
                        updatedSession: session
                    });
                }
                catch (error) {
                    console.error('[RuleEngine] Error activating human takeover:', error);
                    return this.finalize(session, {
                        response: '❌ Sorry, there was an error connecting you to support. Please try again or type MENU to return to main menu.',
                        newState: types_1.BotState.MAIN_MENU,
                        updatedSession: session
                    });
                }
            }
            // Step 2: If we are in a deep state (not IDLE/MAIN_MENU), go directly to FlowRouter
            const isMenuLevelState = (session.conversationState === types_1.BotState.IDLE ||
                session.conversationState === types_1.BotState.MAIN_MENU ||
                session.conversationState === types_1.BotState.GREETING);
            if (!isMenuLevelState) {
                const routerResult = yield FlowRouter_1.flowRouter.route(session, aiContext, cleanMessage);
                if (routerResult)
                    return this.finalize(session, routerResult);
                // If FlowRouter didn't handle it, stay in current state with a gentle nudge
                return this.finalize(session, {
                    response: TemplateRegistry_1.TemplateRegistry.fallbackMessage(),
                    newState: session.conversationState,
                    updatedSession: session
                });
            }
            // Step 3: We are at IDLE/MAIN_MENU — allow numeric global commands
            const globalResult = yield this.checkMenuLevelCommands(session, cleanMessage, aiContext);
            if (globalResult)
                return this.finalize(session, globalResult);
            // Step 4: Route via FlowRouter for IDLE/MAIN_MENU keyword handling
            const routerResult = yield FlowRouter_1.flowRouter.route(session, aiContext, cleanMessage);
            if (routerResult)
                return this.finalize(session, routerResult);
            // Step 5: Final fallback — show main menu
            const storeUrl = (aiContext === null || aiContext === void 0 ? void 0 : aiContext.slug) ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${aiContext.slug}` : undefined;
            return this.finalize(session, {
                response: TemplateRegistry_1.TemplateRegistry.mainMenu((aiContext === null || aiContext === void 0 ? void 0 : aiContext.name) || 'Store', aiContext === null || aiContext === void 0 ? void 0 : aiContext.capabilities, storeUrl),
                newState: types_1.BotState.MAIN_MENU,
                updatedSession: session
            });
        });
    }
    finalize(session, result) {
        session.conversationState = result.newState;
        session.lastActiveAt = Date.now();
        return Object.assign(Object.assign({}, result), { updatedSession: session });
    }
    /**
     * Non-numeric global commands that are safe to intercept at ANY state.
     * These are word-based commands that cannot conflict with numeric state inputs.
     */
    checkNonNumericGlobalCommands(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = (0, normalization_1.normalizeInput)(message);
            // "menu" / "home" — always valid to reset to main menu
            if (input === 'menu' || input === 'home') {
                const storeUrl = context.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${context.slug}` : undefined;
                return {
                    response: TemplateRegistry_1.TemplateRegistry.mainMenu(context.name || context.businessName || 'Store', context.capabilities, storeUrl),
                    newState: types_1.BotState.MAIN_MENU,
                    updatedSession: session
                };
            }
            // "owner" — request human handoff
            if (input === 'owner') {
                // Set state to await reason
                return {
                    response: `🤝 *Request Human Support*\n\n` +
                        `Please briefly describe why you need assistance:\n\n` +
                        `_Examples:_\n` +
                        `• "I have a question about my order #12345"\n` +
                        `• "Need help with product selection"\n` +
                        `• "Technical support needed"\n` +
                        `• "I want to speak to a person"\n\n` +
                        `Type your reason:`,
                    newState: types_1.BotState.AWAITING_HUMAN_REASON,
                    updatedSession: session
                };
            }
            // "cart" / "view cart" keyword
            if (input === 'cart' || input === 'view cart') {
                return FlowRouter_1.flowRouter.route(session, context, 'cmd_cart');
            }
            // cmd_ button payloads (from WhatsApp interactive buttons) — always route these
            if (message.trim().startsWith('cmd_')) {
                return FlowRouter_1.flowRouter.route(session, context, message.trim());
            }
            return null;
        });
    }
    /**
     * Numeric/keyword global commands that are ONLY safe at IDLE/MAIN_MENU states.
     * "2" here means "track order" — but only when user is at the main menu.
     */
    checkMenuLevelCommands(session, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = (0, normalization_1.normalizeInput)(message);
            // Order tracking — only valid at menu level
            if (input.includes('track') ||
                message.trim().toLowerCase().startsWith('#')) {
                return {
                    response: TemplateRegistry_1.TemplateRegistry.askOrderId(),
                    newState: types_1.BotState.TRACKING_ORDER,
                    updatedSession: session
                };
            }
            return null;
        });
    }
    checkSessionTimeout(session) {
        if (Date.now() - session.lastActiveAt > types_1.CONSTANTS.SESSION_TIMEOUT_MS) {
            console.log(`[RuleEngine] Session ${session.sessionId} timed out. Resetting to IDLE.`);
            session.conversationState = types_1.BotState.IDLE;
        }
    }
}
exports.RuleEngine = RuleEngine;
exports.ruleEngine = new RuleEngine();
