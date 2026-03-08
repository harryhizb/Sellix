import mongoose from "mongoose";

const conversationOverrideSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    isActive: { type: Boolean, default: true },
    ownerTookOver: { type: Boolean, default: false },
    aiPaused: { type: Boolean, default: true },
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    notes: { type: String },
    reason: { type: String }, // Reason why customer wants to contact owner
    currentTakeover: {
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        startedAt: { type: Date },
        lastActivity: { type: Date },
        reason: { type: String, enum: ["support", "complaint", "inquiry", "other"], default: "other" }
    }
}, { timestamps: true });

// Instance method to end takeover
conversationOverrideSchema.methods.endTakeover = async function(endReason: string, summary?: string) {
    // Simply mark as inactive and resume AI
    this.isActive = false;
    this.aiPaused = false;
    this.ownerTookOver = false;
    this.resumedAt = new Date();
    
    if (summary) {
        this.notes = summary;
    }
    
    await this.save();
    console.log(`[ConversationOverride] Ended takeover for customer ${this.customerId}, reason: ${endReason}`);
};

conversationOverrideSchema.index({ customerId: 1, businessId: 1 });

export const ConversationOverride = mongoose.models.ConversationOverride || mongoose.model("ConversationOverride", conversationOverrideSchema);
