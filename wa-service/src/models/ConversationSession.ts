import mongoose, { Schema, Document } from 'mongoose';
import { SessionContext, BotState } from '../lib/types';

export interface IConversationSession extends SessionContext, Document { }

const ConversationSessionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },

    // State Management
    conversationState: {
        type: String,
        required: true,
        enum: Object.values(BotState),
        default: BotState.IDLE
    },

    // Cart
    cart: [{
        productId: String,
        name: String,
        qty: Number,
        size: String,
        color: String,
        unitPrice: Number,
        variantId: String,
        variantAttributes: { type: Schema.Types.Mixed },
        specialInstructions: String,
        discount: { type: Schema.Types.Mixed }
    }],

    // User Details & Memory
    userDetails: { type: Schema.Types.Mixed, default: {} },
    deliveryDetails: { type: Schema.Types.Mixed, default: null },
    memory: { type: Schema.Types.Mixed, default: {} },

    // Product browsing state
    lastShownProducts: { type: [Schema.Types.Mixed], default: [] },
    currentProduct: { type: Schema.Types.Mixed, default: null },

    // Generic key-value meta
    meta: { type: Schema.Types.Mixed, default: {} },

    // Logic State
    fallbackCount: { type: Number, default: 0 },
    isLockedToHuman: { type: Boolean, default: false },
    language: { type: String, enum: ['en', 'ur_roman', 'mixed'], default: 'en' },

    // Timestamps
    lastActiveAt: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});

// Compound index for efficient lookups
ConversationSessionSchema.index({ userId: 1, businessId: 1 });

// TTL index for automatic cleanup of expired sessions
ConversationSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IConversationSession>('ConversationSession', ConversationSessionSchema);