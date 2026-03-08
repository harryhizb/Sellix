import { Business } from "../models/Business";
import NodeCache from "node-cache";

// Cache TTL: 10 minutes for business settings
const businessCache = new NodeCache({ stdTTL: 600 });

export class BusinessService {
    private static instance: BusinessService;

    private constructor() { }

    public static getInstance(): BusinessService {
        if (!BusinessService.instance) {
            BusinessService.instance = new BusinessService();
        }
        return BusinessService.instance;
    }

    /**
     * Get Business Context with Caching
     */
    async getBusinessContext(businessId: string): Promise<any> {
        const cacheKey = `business:${businessId}`;
        const cached = businessCache.get(cacheKey);

        if (cached) {
            console.log(`[BusinessService] Business loaded (from cache): ${businessId}`);
            return cached;
        }

        try {
            const doc = await Business.findById(businessId);
            if (!doc) return null;

            // Convert everything to plain JS object safely
            const context = JSON.parse(JSON.stringify(doc.getAIContext()));

            console.log(`[BusinessService] Business loaded (from DB): ${businessId}`);

            businessCache.set(cacheKey, context);
            return context;
        } catch (error) {
            console.error(`[BusinessService] Error fetching business ${businessId}:`, error);
            return null;
        }
    }

    /**
     * Invalidate Cache for a business (Phase 2 fix)
     */
    invalidateCache(businessId: string): void {
        const cacheKey = `business:${businessId}`;
        businessCache.del(cacheKey);
        console.log(`[BusinessService] Cache invalidated for business: ${businessId}`);
    }

    /**
    * Get Business Name (specifically for lightweight needs)
    */
    async getBusinessName(businessId: string): Promise<string> {
        const context = await this.getBusinessContext(businessId);
        return context?.businessName || "My Shop";
    }

    /**
     * Helper: Resolve WhatsApp JID to Customer ObjectId
     */
    private async resolveCustomerId(businessId: string, customerJid: string): Promise<string | null> {
        try {
            const { Customer } = require('../models/Customer');

            // Extract phone number from JID (e.g., "923150933188@s.whatsapp.net" -> "923150933188")
            const phoneNumber = customerJid.split('@')[0];

            let customer = await Customer.findOne({
                businessId,
                phone: phoneNumber
            }).select('_id').lean();

            if (!customer) {
                console.log(`[BusinessService] Customer not found for ${phoneNumber}, creating new record.`);
                customer = await Customer.create({
                    businessId,
                    phone: phoneNumber,
                    name: "Customer",
                    state: { step: "INITIAL" }
                });
            }

            return customer._id.toString();
        } catch (error) {
            console.error(`[BusinessService] Error resolving customer ID for ${customerJid}:`, error);
            return null;
        }
    }

    /**
     * Activate Human Handoff (Conversation Override)
     */
    async activateConversationOverride(businessId: string, customerJid: string, reason?: string): Promise<boolean> {
        try {
            const { ConversationOverride } = require('../models/ConversationOverride');

            // Resolve JID to actual ObjectId
            const customerId = await this.resolveCustomerId(businessId, customerJid);
            if (!customerId) return false;

            await ConversationOverride.findOneAndUpdate(
                { businessId, customerId: customerId },
                {
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
                },
                { upsert: true, new: true }
            );

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
            } catch (socketError) {
                console.error("[BusinessService] Failed to emit socket event:", socketError);
            }

            // NOTIFY OWNER VIA WHATSAPP
            try {
                const { whatsappSessionManager } = require('./WhatsAppSessionManager');
                const { TemplateRegistry } = require('./templates/TemplateRegistry');

                const context = await this.getBusinessContext(businessId);
                const ownerPhone = context?.contactPhone;

                if (ownerPhone) {
                    const cleanPhone = ownerPhone.replace(/\D/g, '');
                    const ownerJid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
                    const customerPhone = customerJid.split('@')[0];
                    const msg = `🚨 *Human Takeover Request*\n\n` +
                        `Customer *${customerPhone}* has requested a human agent.\n\n` +
                        (reason ? `📝 *Reason:* ${reason}\n\n` : '') +
                        `📱 Open your dashboard to take over:\n` +
                        `${process.env.DASHBOARD_URL || 'http://localhost:3000'}/dashboard/chat`;
                    await whatsappSessionManager.sendMessage(businessId, ownerJid, msg);
                }
            } catch (notifyError) {
                console.warn("[BusinessService] Failed to notify owner via WhatsApp:", notifyError);
            }

            return true;
        } catch (error) {
            console.error(`[BusinessService] Error activating override:`, error);
            return false;
        }
    }

    async isConversationPaused(businessId: string, customerJid: string): Promise<boolean> {
        try {
            const { ConversationOverride } = require('../models/ConversationOverride');

            // Resolve JID to actual ObjectId
            const customerId = await this.resolveCustomerId(businessId, customerJid);
            if (!customerId) return false;

            const override = await ConversationOverride.findOne({
                businessId,
                customerId,
                aiPaused: true
            }).lean();
            return !!override;
        } catch (error) {
            console.error("[BusinessService] Error checking pause status:", error);
            return false;
        }
    }
}

export const businessService = BusinessService.getInstance();
