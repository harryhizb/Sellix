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
exports.businessService = exports.BusinessService = void 0;
const Business_1 = require("../models/Business");
const node_cache_1 = __importDefault(require("node-cache"));
// Cache TTL: 10 minutes for business settings
const businessCache = new node_cache_1.default({ stdTTL: 600 });
class BusinessService {
    constructor() { }
    static getInstance() {
        if (!BusinessService.instance) {
            BusinessService.instance = new BusinessService();
        }
        return BusinessService.instance;
    }
    /**
     * Get Business Context with Caching
     */
    getBusinessContext(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `business:${businessId}`;
            const cached = businessCache.get(cacheKey);
            if (cached) {
                console.log(`[BusinessService] Business loaded (from cache): ${businessId}`);
                return cached;
            }
            try {
                const doc = yield Business_1.Business.findById(businessId);
                if (!doc)
                    return null;
                // Convert everything to plain JS object safely
                const context = JSON.parse(JSON.stringify(doc.getAIContext()));
                console.log(`[BusinessService] Business loaded (from DB): ${businessId}`);
                businessCache.set(cacheKey, context);
                return context;
            }
            catch (error) {
                console.error(`[BusinessService] Error fetching business ${businessId}:`, error);
                return null;
            }
        });
    }
    /**
     * Invalidate Cache for a business (Phase 2 fix)
     */
    invalidateCache(businessId) {
        const cacheKey = `business:${businessId}`;
        businessCache.del(cacheKey);
        console.log(`[BusinessService] Cache invalidated for business: ${businessId}`);
    }
    /**
    * Get Business Name (specifically for lightweight needs)
    */
    getBusinessName(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = yield this.getBusinessContext(businessId);
            return (context === null || context === void 0 ? void 0 : context.businessName) || "My Shop";
        });
    }
    /**
     * Helper: Resolve WhatsApp JID to Customer ObjectId
     */
    resolveCustomerId(businessId, customerJid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { Customer } = require('../models/Customer');
                // Extract phone number from JID (e.g., "923150933188@s.whatsapp.net" -> "923150933188")
                const phoneNumber = customerJid.split('@')[0];
                let customer = yield Customer.findOne({
                    businessId,
                    phone: phoneNumber
                }).select('_id').lean();
                if (!customer) {
                    console.log(`[BusinessService] Customer not found for ${phoneNumber}, creating new record.`);
                    customer = yield Customer.create({
                        businessId,
                        phone: phoneNumber,
                        name: "Customer",
                        state: { step: "INITIAL" }
                    });
                }
                return customer._id.toString();
            }
            catch (error) {
                console.error(`[BusinessService] Error resolving customer ID for ${customerJid}:`, error);
                return null;
            }
        });
    }
    /**
     * Activate Human Handoff (Conversation Override)
     */
    activateConversationOverride(businessId, customerJid, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ConversationOverride } = require('../models/ConversationOverride');
                // Resolve JID to actual ObjectId
                const customerId = yield this.resolveCustomerId(businessId, customerJid);
                if (!customerId)
                    return false;
                yield ConversationOverride.findOneAndUpdate({ businessId, customerId: customerId }, {
                    isActive: true,
                    ownerTookOver: true,
                    aiPaused: true,
                    pausedAt: new Date(),
                    notes: reason || "Customer requested human agent via bot",
                    reason: reason || undefined,
                    currentTakeover: {
                        startedAt: new Date(),
                        lastActivity: new Date(),
                        reason: reason ? 'support' : 'other'
                    },
                    $setOnInsert: {
                        takeoverCount: 0,
                        totalTakeoverDuration: 0
                    }
                }, { upsert: true, new: true });
                console.log(`[BusinessService] Human handoff activated for customer ${customerJid} (ID: ${customerId})${reason ? ` - Reason: ${reason}` : ''}`);
                // EMIT SOCKET EVENT for Real-time Dashboard Update
                try {
                    const { globalIO } = require('./socket');
                    if (globalIO) {
                        globalIO.to(businessId.toString()).emit('takeover-started', {
                            customerId: customerId,
                            businessId,
                            reason: reason || null
                        });
                    }
                }
                catch (socketError) {
                    console.error("[BusinessService] Failed to emit socket event:", socketError);
                }
                // NOTIFY OWNER VIA WHATSAPP
                try {
                    const { whatsappSessionManager } = require('./WhatsAppSessionManager');
                    const { TemplateRegistry } = require('./templates/TemplateRegistry');
                    const context = yield this.getBusinessContext(businessId);
                    const ownerPhone = context === null || context === void 0 ? void 0 : context.contactPhone;
                    if (ownerPhone) {
                        const cleanPhone = ownerPhone.replace(/\D/g, '');
                        const ownerJid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
                        const customerPhone = customerJid.split('@')[0];
                        const msg = `🚨 *Human Takeover Request*\n\n` +
                            `Customer *${customerPhone}* has requested a human agent.\n\n` +
                            (reason ? `📝 *Reason:* ${reason}\n\n` : '') +
                            `📱 Open your dashboard to take over:\n` +
                            `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/chat`;
                        yield whatsappSessionManager.sendMessage(businessId, ownerJid, msg);
                    }
                }
                catch (notifyError) {
                    console.warn("[BusinessService] Failed to notify owner via WhatsApp:", notifyError);
                }
                return true;
            }
            catch (error) {
                console.error(`[BusinessService] Error activating override:`, error);
                return false;
            }
        });
    }
    isConversationPaused(businessId, customerJid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ConversationOverride } = require('../models/ConversationOverride');
                // Resolve JID to actual ObjectId
                const customerId = yield this.resolveCustomerId(businessId, customerJid);
                if (!customerId)
                    return false;
                const override = yield ConversationOverride.findOne({
                    businessId,
                    customerId,
                    aiPaused: true
                }).lean();
                return !!override;
            }
            catch (error) {
                console.error("[BusinessService] Error checking pause status:", error);
                return false;
            }
        });
    }
}
exports.BusinessService = BusinessService;
exports.businessService = BusinessService.getInstance();
