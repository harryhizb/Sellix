// wa-service/models/ConversationOverride.ts
import mongoose from "mongoose";

const takeoverSessionSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date
  },
  reason: {
    type: String
  },
  notes: {
    type: String
  },
  messagesHandled: {
    type: Number,
    default: 0
  },
  outcome: {
    type: String,
    enum: [
      'resolved',
      'escalated',
      'follow_up_needed',
      'handed_back',
      'abandoned'
    ]
  },
  contextSnapshot: {
    type: mongoose.Schema.Types.Mixed
  }
});

const conversationOverrideSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true
  },

  // Current takeover session
  currentTakeover: {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    ownerName: {
      type: String
    },
    startedAt: {
      type: Date
    },
    reason: {
      type: String
    },
    lastActivity: {
      type: Date
    },
    messageCount: {
      type: Number,
      default: 0
    },
    customerNotified: {
      type: Boolean,
      default: false
    }
  },

  // Past takeover sessions
  takeoverSessions: [takeoverSessionSchema],

  // AI control
  aiPaused: {
    type: Boolean,
    default: false
  },
  pausedAt: {
    type: Date
  },
  resumedAt: {
    type: Date
  },

  // Handback information
  handbackSummary: {
    type: String
  },
  lastHandbackAt: {
    type: Date
  },

  // Configuration
  takeoverThresholds: {
    autoHandbackMinutes: {
      type: Number,
      default: 30
    },
    maxMessagesPerTakeover: {
      type: Number,
      default: 50
    },
    inactivityTimeoutMinutes: {
      type: Number,
      default: 15
    }
  },

  // For backward compatibility
  isActive: {
    type: Boolean,
    default: true
  },
  ownerTookOver: {
    type: Boolean,
    default: false
  },

  // General notes
  notes: {
    type: String
  },

  // Tracking
  takeoverCount: {
    type: Number,
    default: 0
  },
  totalTakeoverDuration: {
    type: Number, // in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationOverrideSchema.index({ customerId: 1, businessId: 1 });
conversationOverrideSchema.index({ "currentTakeover.ownerId": 1 });
conversationOverrideSchema.index({
  "currentTakeover.startedAt": 1,
  aiPaused: 1
});
conversationOverrideSchema.index({
  businessId: 1,
  "currentTakeover.ownerId": 1
});

// Methods
conversationOverrideSchema.methods.startTakeover = async function (
  ownerId: string,
  ownerName: string,
  reason: string
) {
  this.currentTakeover = {
    ownerId,
    ownerName,
    startedAt: new Date(),
    lastActivity: new Date(),
    reason,
    messageCount: 0,
    customerNotified: false
  };

  this.aiPaused = true;
  this.pausedAt = new Date();
  this.ownerTookOver = true;
  this.isActive = true;

  return this.save();
};

conversationOverrideSchema.methods.endTakeover = async function (
  outcome: string,
  summary?: string
) {
  if (this.currentTakeover && this.currentTakeover.startedAt) {
    const sessionDuration = Math.floor(
      (new Date().getTime() - this.currentTakeover.startedAt.getTime()) / 60000
    );

    this.takeoverSessions.push({
      ownerId: this.currentTakeover.ownerId,
      startedAt: this.currentTakeover.startedAt,
      endedAt: new Date(),
      reason: this.currentTakeover.reason,
      messagesHandled: this.currentTakeover.messageCount,
      outcome,
      contextSnapshot: this.contextSnapshot
    });

    this.takeoverCount += 1;
    this.totalTakeoverDuration += sessionDuration;

    this.currentTakeover = null;
  }

  this.aiPaused = false;
  this.resumedAt = new Date();
  this.ownerTookOver = false;
  this.handbackSummary = summary;
  this.lastHandbackAt = new Date();

  return this.save();
};

conversationOverrideSchema.methods.recordOwnerMessage = async function () {
  if (this.currentTakeover) {
    this.currentTakeover.messageCount += 1;
    this.currentTakeover.lastActivity = new Date();
    return this.save();
  }
};

conversationOverrideSchema.methods.notifyCustomer = async function () {
  if (this.currentTakeover) {
    this.currentTakeover.customerNotified = true;
    return this.save();
  }
};

conversationOverrideSchema.methods.isTakeoverExpired = function () {
  if (!this.currentTakeover?.lastActivity) return false;

  const now = new Date();
  const lastActivity = this.currentTakeover.lastActivity;
  const timeoutMinutes = this.takeoverThresholds.inactivityTimeoutMinutes || 15;

  return (now.getTime() - lastActivity.getTime()) > (timeoutMinutes * 60 * 1000);
};

conversationOverrideSchema.methods.isMessageLimitReached = function () {
  if (!this.currentTakeover) return false;

  const maxMessages = this.takeoverThresholds.maxMessagesPerTakeover || 50;
  return this.currentTakeover.messageCount >= maxMessages;
};

export const ConversationOverride = mongoose.model(
  "ConversationOverride",
  conversationOverrideSchema
);

export const TakeoverSession = mongoose.model(
  "TakeoverSession",
  takeoverSessionSchema
);