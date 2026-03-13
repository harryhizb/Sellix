"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
// wa-service/models/AuditLog.ts
const mongoose_1 = __importDefault(require("mongoose"));
const auditLogSchema = new mongoose_1.default.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'TAKEOVER_START',
            'TAKEOVER_END',
            'TAKEOVER_FORCE_END',
            'OWNER_MESSAGE_SENT',
            'AI_PAUSED',
            'AI_RESUMED',
            'CUSTOMER_NOTIFIED',
            'HANDOVER_COMPLETE'
        ]
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ConversationOverride'
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Indexes for faster queries
auditLogSchema.index({ businessId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
exports.AuditLog = mongoose_1.default.model("AuditLog", auditLogSchema);
