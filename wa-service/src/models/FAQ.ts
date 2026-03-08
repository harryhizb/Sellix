// wa-service/models/FAQ.ts
import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
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

export const FAQ = mongoose.models.FAQ || mongoose.model("FAQ", faqSchema);