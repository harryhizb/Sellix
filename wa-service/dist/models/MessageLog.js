"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const messageLogSchema = new mongoose_1.default.Schema({
    // Core identifiers
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true
    },
    // Message content and direction
    from: {
        type: String,
        enum: ["customer", "ai", "agent", "system"],
        required: true
    },
    // Message source (Module 2 enhancement)
    source: {
        type: String,
        enum: ["rule", "openai", "hybrid", "human", "template", "fallback"],
        default: "rule"
    },
    content: {
        type: String,
        required: true,
        index: 'text' // Enable text search
    },
    // WhatsApp specific fields
    messageId: { type: String }, // WhatsApp Message ID
    whatsappTimestamp: { type: Date }, // Original WhatsApp timestamp
    // Language and intent tracking (Module 2 enhancements)
    detectedLanguage: {
        type: String,
        enum: ["en", "ur_roman", "mixed", "unknown"],
        default: "unknown"
    },
    intent: {
        type: String,
        enum: [
            "greeting", "browse_products", "place_order", "business_info",
            "faq", "provide_product", "provide_quantity", "provide_details",
            "confirm", "cancel", "restart", "help", "out_of_scope",
            "fallback", "human_escalation", "order_status", "pricing_info",
            "delivery_info", "return_info", "thanks", "complaint"
        ]
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    // Entity extraction results
    extractedEntities: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {}
    },
    // Conversation context
    conversationState: {
        step: String,
        data: mongoose_1.default.Schema.Types.Mixed
    },
    // Response metrics
    responseTime: { type: Number }, // Time to respond in milliseconds
    messageLength: { type: Number }, // Character count
    // Processing metadata
    processingTime: { type: Number }, // Time taken to process in ms
    tokensUsed: { type: Number }, // OpenAI tokens used (if applicable)
    // Error tracking
    error: {
        occurred: { type: Boolean, default: false },
        message: String,
        stack: String,
        handled: { type: Boolean, default: false }
    },
    // Business context at time of message
    businessContext: {
        category: String,
        tone: String,
        personality: mongoose_1.default.Schema.Types.Mixed
    },
    // Customer context at time of message
    customerContext: {
        step: String,
        detectedLanguage: String,
        fallbackCount: Number
    },
    // Metadata for analytics
    metadata: {
        deviceInfo: String,
        platform: { type: String, enum: ["whatsapp", "web", "api", "other"] },
        userAgent: String,
        ipAddress: String,
        location: {
            country: String,
            city: String,
            timezone: String
        }
    },
    // Flags for special handling
    flags: {
        isOwnerMessage: { type: Boolean, default: false },
        requiresFollowUp: { type: Boolean, default: false },
        isUrgent: { type: Boolean, default: false },
        containsPII: { type: Boolean, default: false }
    },
    // Tags for categorization
    tags: [String],
    // References to other documents
    references: {
        orderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Order" },
        productId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Product" },
        conversationId: String // For grouping messages in a conversation
    },
    // Index for conversation flow
    sequenceNumber: { type: Number, default: 0 },
    // Archived flag for data management
    archived: { type: Boolean, default: false }
}, {
    timestamps: true,
    // Enable automatic indexing
    autoIndex: true
});
// Compound indexes for common queries
messageLogSchema.index({ businessId: 1, customerId: 1, createdAt: -1 });
messageLogSchema.index({ businessId: 1, createdAt: -1 });
messageLogSchema.index({ customerId: 1, createdAt: -1 });
messageLogSchema.index({ businessId: 1, from: 1, createdAt: -1 });
messageLogSchema.index({ businessId: 1, intent: 1, createdAt: -1 });
messageLogSchema.index({ businessId: 1, detectedLanguage: 1, createdAt: -1 });
messageLogSchema.index({ businessId: 1, "flags.isUrgent": 1, createdAt: -1 });
messageLogSchema.index({ conversationId: 1, sequenceNumber: 1 });
// Text index for content search is already defined in schema for 'content' field
// Virtual for formatted display
messageLogSchema.virtual('formattedContent').get(function () {
    const maxLength = 100;
    if (this.content.length <= maxLength)
        return this.content;
    return this.content.substring(0, maxLength) + '...';
});
// Virtual for message direction
messageLogSchema.virtual('direction').get(function () {
    return this.from === 'customer' ? 'incoming' : 'outgoing';
});
// Method to check if message needs human review
messageLogSchema.methods.needsHumanReview = function () {
    var _a, _b, _c;
    return (((_a = this.flags) === null || _a === void 0 ? void 0 : _a.isUrgent) ||
        ((_b = this.flags) === null || _b === void 0 ? void 0 : _b.requiresFollowUp) ||
        ((_c = this.error) === null || _c === void 0 ? void 0 : _c.occurred) ||
        this.confidence < 0.3 ||
        this.intent === 'human_escalation' ||
        this.intent === 'complaint');
};
// Method to extract language patterns
messageLogSchema.methods.extractLanguagePatterns = function () {
    const patterns = {
        isMixedLanguage: false,
        primaryLanguage: this.detectedLanguage,
        urduWords: 0,
        englishWords: 0
    };
    if (this.detectedLanguage === 'mixed') {
        patterns.isMixedLanguage = true;
        // Simple word counting for language detection
        const urduWords = ['hai', 'hain', 'nahi', 'han', 'acha', 'theek', 'zaroor', 'shukriya'];
        const words = this.content.toLowerCase().split(/\s+/);
        patterns.urduWords = words.filter((word) => urduWords.includes(word)).length;
        patterns.englishWords = words.length - patterns.urduWords;
    }
    return patterns;
};
// Method to log processing error
messageLogSchema.methods.logError = function (error, handled = true) {
    this.error = {
        occurred: true,
        message: error.message,
        stack: error.stack,
        handled
    };
    return this.save();
};
// Static method to get conversation history
messageLogSchema.statics.getConversationHistory = function (customerId, businessId, limit = 50) {
    return this.find({
        customerId,
        businessId,
        archived: false
    })
        .sort({ createdAt: 1 })
        .limit(limit)
        .select('from content intent detectedLanguage createdAt')
        .lean();
};
// Static method to get language statistics
messageLogSchema.statics.getLanguageStats = function (businessId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                businessId: new mongoose_1.default.Types.ObjectId(businessId),
                createdAt: { $gte: startDate, $lte: endDate },
                from: 'customer'
            }
        },
        {
            $group: {
                _id: '$detectedLanguage',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' }
            }
        },
        {
            $project: {
                language: '$_id',
                count: 1,
                avgConfidence: 1,
                percentage: {
                    $multiply: [
                        { $divide: ['$count', { $sum: '$count' }] },
                        100
                    ]
                }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};
// Static method to get intent statistics
messageLogSchema.statics.getIntentStats = function (businessId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                businessId: new mongoose_1.default.Types.ObjectId(businessId),
                createdAt: { $gte: startDate, $lte: endDate },
                intent: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$intent',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' },
                uniqueCustomers: { $addToSet: '$customerId' }
            }
        },
        {
            $project: {
                intent: '$_id',
                count: 1,
                avgConfidence: 1,
                uniqueCustomerCount: { $size: '$uniqueCustomers' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};
// Static method to archive old messages
messageLogSchema.statics.archiveOldMessages = function (businessId, olderThanDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    return this.updateMany({
        businessId: new mongoose_1.default.Types.ObjectId(businessId),
        createdAt: { $lt: cutoffDate },
        archived: false
    }, {
        $set: { archived: true }
    });
};
// Pre-save middleware to calculate message length and set sequence
messageLogSchema.pre('save', function (next) {
    var _a, _b;
    // Calculate message length
    this.messageLength = ((_a = this.content) === null || _a === void 0 ? void 0 : _a.length) || 0;
    // Set detected language if not set
    if (!this.detectedLanguage || this.detectedLanguage === 'unknown') {
        // Simple detection - in production, use the RuleEngine
        const content = ((_b = this.content) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
        const urduWords = ['hai', 'hain', 'nahi', 'han', 'acha', 'theek', 'zaroor', 'shukriya'];
        const hasUrduWords = urduWords.some(word => content.includes(word));
        if (hasUrduWords) {
            this.detectedLanguage = 'ur_roman';
        }
        else {
            this.detectedLanguage = 'en';
        }
    }
    next();
});
exports.MessageLog = mongoose_1.default.models.MessageLog || mongoose_1.default.model("MessageLog", messageLogSchema);
