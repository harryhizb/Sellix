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
exports.TakeoverSession = exports.ConversationOverride = void 0;
// wa-service/models/ConversationOverride.ts
const mongoose_1 = __importDefault(require("mongoose"));
const takeoverSessionSchema = new mongoose_1.default.Schema({
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.Mixed
    }
});
const conversationOverrideSchema = new mongoose_1.default.Schema({
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },
    // Current takeover session
    currentTakeover: {
        ownerId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
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
conversationOverrideSchema.methods.startTakeover = function (ownerId, ownerName, reason) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
};
conversationOverrideSchema.methods.endTakeover = function (outcome, summary) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.currentTakeover && this.currentTakeover.startedAt) {
            const sessionDuration = Math.floor((new Date().getTime() - this.currentTakeover.startedAt.getTime()) / 60000);
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
    });
};
conversationOverrideSchema.methods.recordOwnerMessage = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.currentTakeover) {
            this.currentTakeover.messageCount += 1;
            this.currentTakeover.lastActivity = new Date();
            return this.save();
        }
    });
};
conversationOverrideSchema.methods.notifyCustomer = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.currentTakeover) {
            this.currentTakeover.customerNotified = true;
            return this.save();
        }
    });
};
conversationOverrideSchema.methods.isTakeoverExpired = function () {
    var _a;
    if (!((_a = this.currentTakeover) === null || _a === void 0 ? void 0 : _a.lastActivity))
        return false;
    const now = new Date();
    const lastActivity = this.currentTakeover.lastActivity;
    const timeoutMinutes = this.takeoverThresholds.inactivityTimeoutMinutes || 15;
    return (now.getTime() - lastActivity.getTime()) > (timeoutMinutes * 60 * 1000);
};
conversationOverrideSchema.methods.isMessageLimitReached = function () {
    if (!this.currentTakeover)
        return false;
    const maxMessages = this.takeoverThresholds.maxMessagesPerTakeover || 50;
    return this.currentTakeover.messageCount >= maxMessages;
};
exports.ConversationOverride = mongoose_1.default.model("ConversationOverride", conversationOverrideSchema);
exports.TakeoverSession = mongoose_1.default.model("TakeoverSession", takeoverSessionSchema);
