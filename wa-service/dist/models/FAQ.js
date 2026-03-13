"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ = void 0;
// wa-service/models/FAQ.ts
const mongoose_1 = __importDefault(require("mongoose"));
const faqSchema = new mongoose_1.default.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['ai', 'takeover', 'both'],
        default: 'ai'
    },
    category: {
        type: String,
        enum: ['general', 'orders', 'shipping', 'returns', 'support', 'takeover'],
        default: 'general'
    },
    tags: [{
            type: String,
            trim: true
        }],
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
// Indexes for better query performance
faqSchema.index({ businessId: 1, type: 1, isActive: 1 });
faqSchema.index({ businessId: 1, category: 1 });
faqSchema.index({ businessId: 1, tags: 1 });
faqSchema.index({ businessId: 1, usageCount: -1 });
exports.FAQ = mongoose_1.default.models.FAQ || mongoose_1.default.model("FAQ", faqSchema);
