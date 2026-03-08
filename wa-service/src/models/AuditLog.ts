// wa-service/models/AuditLog.ts
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConversationOverride'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
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

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);