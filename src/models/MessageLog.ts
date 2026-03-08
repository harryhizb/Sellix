import mongoose from "mongoose";

const messageLogSchema = new mongoose.Schema({
    // Core identifiers
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
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
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Conversation context
    conversationState: {
        step: String,
        data: mongoose.Schema.Types.Mixed
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
        personality: mongoose.Schema.Types.Mixed
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
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
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

// Text index for content search
messageLogSchema.index({ content: 'text' });

// Virtual for formatted display
messageLogSchema.virtual('formattedContent').get(function () {
    const maxLength = 100;
    if (this.content.length <= maxLength) return this.content;
    return this.content.substring(0, maxLength) + '...';
});

// Virtual for message direction
messageLogSchema.virtual('direction').get(function () {
    return this.from === 'customer' ? 'incoming' : 'outgoing';
});

// Method to check if message needs human review
messageLogSchema.methods.needsHumanReview = function () {
    return (
        this.flags?.isUrgent ||
        this.flags?.requiresFollowUp ||
        this.error?.occurred ||
        this.confidence < 0.3 ||
        this.intent === 'human_escalation' ||
        this.intent === 'complaint'
    );
};

export const MessageLog = mongoose.models.MessageLog || mongoose.model("MessageLog", messageLogSchema);
