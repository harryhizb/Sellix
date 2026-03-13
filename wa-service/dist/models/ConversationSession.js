"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../lib/types");
const ConversationSessionSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    // State Management
    conversationState: {
        type: String,
        required: true,
        enum: Object.values(types_1.BotState),
        default: types_1.BotState.IDLE
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
            variantAttributes: { type: mongoose_1.Schema.Types.Mixed },
            specialInstructions: String,
            discount: { type: mongoose_1.Schema.Types.Mixed }
        }],
    // User Details & Memory
    userDetails: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    deliveryDetails: { type: mongoose_1.Schema.Types.Mixed, default: null },
    memory: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    // Product browsing state
    lastShownProducts: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    currentProduct: { type: mongoose_1.Schema.Types.Mixed, default: null },
    // Generic key-value meta
    meta: { type: mongoose_1.Schema.Types.Mixed, default: {} },
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
exports.default = mongoose_1.default.model('ConversationSession', ConversationSessionSchema);
