import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFAQ extends Document {
    businessId: mongoose.Types.ObjectId;
    question: string;
    answer: string;
    // MODULE 5: Multilingual FAQ support
    multilingual?: {
        questions?: {
            en?: string;
            ur_roman?: string;
            mixed?: string;
        };
        answers?: {
            en?: string;
            ur_roman?: string;
            mixed?: string;
        };
    };
    category?: string;
    tags?: string[];
    language?: string; // "en" | "ur_roman"
    usageCount?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Enhanced FAQ Schema with multilingual support
const faqSchema = new Schema<IFAQ>({
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    // MODULE 5: Multilingual FAQ support
    multilingual: {
        questions: {
            en: String,
            ur_roman: String,
            mixed: String
        },
        answers: {
            en: String,
            ur_roman: String,
            mixed: String
        }
    },
    category: String,
    tags: [String],
    language: { type: String, enum: ["en", "ur_roman", "mixed"], default: "en" },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// FAQ indexes
faqSchema.index({ businessId: 1, language: 1 });
faqSchema.index({ businessId: 1, category: 1 });
faqSchema.index({ businessId: 1, tags: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

// Method to increment FAQ usage
faqSchema.methods.incrementUsage = function () {
    this.usageCount = (this.usageCount || 0) + 1;
    return this.save();
};

// Method to get FAQ in specific language
faqSchema.methods.getLocalized = function (language: "en" | "ur_roman" | "mixed") {
    if (this.multilingual?.questions?.[language] && this.multilingual?.answers?.[language]) {
        return {
            question: this.multilingual.questions[language],
            answer: this.multilingual.answers[language]
        };
    }

    return {
        question: this.question,
        answer: this.answer
    };
};

export const FAQ = mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", faqSchema);
