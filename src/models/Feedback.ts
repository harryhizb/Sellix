import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
    businessId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    
    // Rating (1-5 stars)
    rating: number;
    
    // Written feedback
    comment?: string;
    
    // Feedback categories
    categories: {
        productQuality?: number;
        deliverySpeed?: number;
        customerService?: number;
        userExperience?: number;
    };
    
    // Sentiment analysis
    sentiment?: {
        score: number; // -1 to 1
        label: 'positive' | 'neutral' | 'negative';
        confidence: number;
    };
    
    // Status tracking
    status: 'pending' | 'reviewed' | 'flagged' | 'resolved';
    isFlagged: boolean;
    flagReason?: string;
    
    // Admin actions
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    adminNotes?: string;
    
    // Metadata
    source: 'whatsapp' | 'web' | 'api' | 'email';
    language?: string;
    
    // Message type (for support tickets)
    messageType?: 'support' | 'bug' | 'feature' | 'feedback';
    subject?: string; // For support tickets
    
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
    businessId: { 
        type: Schema.Types.ObjectId, 
        ref: "Business", 
        required: false,
        index: true 
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        ref: "Customer", 
        required: false,
        index: true 
    },
    orderId: { 
        type: Schema.Types.ObjectId, 
        ref: "Order",
        index: true 
    },
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    
    // Rating
    rating: { 
        type: Number, 
        required: false, 
        min: 1, 
        max: 5,
        index: true 
    },
    
    // Comment
    comment: { type: String, maxlength: 1000 },
    
    // Categories
    categories: {
        productQuality: { type: Number, min: 1, max: 5 },
        deliverySpeed: { type: Number, min: 1, max: 5 },
        customerService: { type: Number, min: 1, max: 5 },
        userExperience: { type: Number, min: 1, max: 5 }
    },
    
    // Sentiment analysis
    sentiment: {
        score: { type: Number, min: -1, max: 1 },
        label: { type: String, enum: ['positive', 'neutral', 'negative'] },
        confidence: { type: Number, min: 0, max: 1 }
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['pending', 'reviewed', 'flagged', 'resolved'],
        default: 'pending',
        index: true 
    },
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    
    // Admin actions
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    adminNotes: String,
    
    // Metadata
    source: { 
        type: String, 
        enum: ['whatsapp', 'web', 'api', 'email'],
        default: 'whatsapp'
    },
    language: String,
    
    // Message type
    messageType: { 
        type: String, 
        enum: ['support', 'bug', 'feature', 'feedback'],
        default: 'feedback'
    },
    subject: String,
}, {
    timestamps: true
});

// Indexes for analytics
feedbackSchema.index({ businessId: 1, rating: 1 });
feedbackSchema.index({ businessId: 1, status: 1 });
feedbackSchema.index({ businessId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1, status: 1 });
feedbackSchema.index({ sentiment: 1 });

// Virtual for formatted rating
feedbackSchema.virtual('displayRating').get(function() {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Static method to get business feedback statistics
feedbackSchema.statics.getBusinessStats = async function(businessId: string) {
    const stats = await this.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), isFlagged: false } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalFeedback: { $sum: 1 },
                ratingDistribution: {
                    $push: "$rating"
                },
                sentimentBreakdown: {
                    $push: "$sentiment.label"
                }
            }
        }
    ]);
    
    if (stats.length === 0) {
        return {
            averageRating: 0,
            totalFeedback: 0,
            ratingDistribution: {},
            sentimentBreakdown: {}
        };
    }
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratingDistribution.forEach((rating: number) => {
        distribution[rating as keyof typeof distribution]++;
    });
    
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    stats[0].sentimentBreakdown.forEach((label: string) => {
        if (label) sentimentBreakdown[label as keyof typeof sentimentBreakdown]++;
    });
    
    return {
        averageRating: stats[0].averageRating || 0,
        totalFeedback: stats[0].totalFeedback || 0,
        ratingDistribution: distribution,
        sentimentBreakdown
    };
};

// Static method to get platform-wide statistics
feedbackSchema.statics.getPlatformStats = async function() {
    const stats = await this.aggregate([
        { $match: { isFlagged: false } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalFeedback: { $sum: 1 },
                totalBusinesses: { $addToSet: "$businessId" }
            }
        }
    ]);
    
    return stats.length > 0 ? {
        averageRating: stats[0].averageRating || 0,
        totalFeedback: stats[0].totalFeedback || 0,
        totalBusinesses: stats[0].totalBusinesses.length || 0
    } : {
        averageRating: 0,
        totalFeedback: 0,
        totalBusinesses: 0
    };
};

export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", feedbackSchema);
