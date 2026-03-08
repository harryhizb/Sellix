import mongoose, { Document, Schema } from "mongoose";

export interface IBusiness extends Document {
    name: string;
    description?: string;
    address?: string;
    contactPhone?: string;
    operatingHours?: {
        enabled: boolean;
        schedule: Map<string, { open: string; close: string; isClosed: boolean }>;
    };
    paymentInstructions?: string;
    slug?: string;
    tone: string;
    personality: {
        greetingStyle: "warm" | "professional" | "simple" | "enthusiastic";
        responseSpeed: "immediate" | "thoughtful" | "balanced";
        useEmojis: boolean;
        includePricing: boolean;
        languagePreference: "auto" | "en" | "ur_roman" | "mixed";
        preserveToneAcrossLanguages: boolean;
        culturalAdaptation: "standard" | "enhanced" | "minimal";
    };
    aiSettings: {
        ruleEngineWeight: number;
        llmFallbackThreshold: number;
        enableMultilingual: boolean;
        languagePreferences: string[];
        contextWindow: number;
        autoDetectLanguage: boolean;
        allowLanguageSwitching: boolean;
        mixedLanguageSupport: boolean;
        defaultResponseLanguage: "en" | "ur_roman";
        languageDetectionThreshold: number;
        tonePreservationLevel: "strict" | "moderate" | "flexible";
        culturalSensitivity: "high" | "medium" | "low";
    };
    settings: {
        primaryGoal: "sales" | "support" | "information" | "hybrid";
        currency: string;
        maxProductsToShow: number;
        autoConfirmOrders: boolean;
        defaultLanguage: "en" | "ur_roman";
        supportedLanguages: string[];
        languageOverrideEnabled: boolean;
        responseLanguageStrategy: "match_customer" | "business_default" | "hybrid";
    };
    policies: {
        delivery?: {
            enabled: boolean;
            description: string;
            charges: string;
            areas: string[];
            timeframe: string;
            freeThreshold: number;
        };
        refund?: {
            enabled: boolean;
            description: string;
            durationDays: number;
            conditions: string;
        };
        payment?: {
            methods: string[];
            instructions: string;
            partialPayment: boolean;
        };
        terms?: string;
    };
    metadata?: {
        locationDetails?: string;
        specialties?: string[];
        awards?: string[];
        teamSize?: string;
        yearsOperating?: number;
    };
    capabilities: {
        supportsProducts: boolean;
        supportsServices: boolean;
        supportsBooking: boolean;
        supportsCart: boolean;
        supportsInformation: boolean;
    };
    onboardingComplete: boolean;
    lastAIConfigUpdate: Date;
    configVersion: number;
    getAIContext(): any;
}

const businessSchema = new Schema<IBusiness>({
    name: { type: String, required: true },
    description: String,
    address: String,
    contactPhone: String,
    operatingHours: {
        enabled: { type: Boolean, default: false },
        schedule: {
            type: Map,
            of: new Schema({
                open: String,
                close: String,
                isClosed: { type: Boolean, default: false }
            })
        }
    },
    paymentInstructions: String,
    slug: { type: String, unique: true },
    tone: {
        type: String,
        enum: ["formal", "friendly", "neutral", "professional", "casual"],
        default: "friendly"
    },
    personality: {
        greetingStyle: {
            type: String,
            enum: ["warm", "professional", "simple", "enthusiastic"],
            default: "warm"
        },
        responseSpeed: {
            type: String,
            enum: ["immediate", "thoughtful", "balanced"],
            default: "balanced"
        },
        useEmojis: { type: Boolean, default: true },
        includePricing: { type: Boolean, default: true },
        languagePreference: {
            type: String,
            enum: ["auto", "en", "ur_roman", "mixed"],
            default: "auto"
        },
        preserveToneAcrossLanguages: { type: Boolean, default: true },
        culturalAdaptation: {
            type: String,
            enum: ["standard", "enhanced", "minimal"],
            default: "standard"
        }
    },
    aiSettings: {
        ruleEngineWeight: { type: Number, default: 0.7, min: 0, max: 1 },
        llmFallbackThreshold: { type: Number, default: 0.3, min: 0, max: 1 },
        enableMultilingual: { type: Boolean, default: true },
        languagePreferences: {
            type: [String],
            enum: ["en", "ur_roman"],
            default: ["en", "ur_roman"]
        },
        contextWindow: { type: Number, default: 5 },
        autoDetectLanguage: { type: Boolean, default: true },
        allowLanguageSwitching: { type: Boolean, default: true },
        mixedLanguageSupport: { type: Boolean, default: true },
        defaultResponseLanguage: {
            type: String,
            enum: ["en", "ur_roman"],
            default: "en"
        },
        languageDetectionThreshold: { type: Number, default: 0.6, min: 0.1, max: 0.9 },
        tonePreservationLevel: {
            type: String,
            enum: ["strict", "moderate", "flexible"],
            default: "moderate"
        },
        culturalSensitivity: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium"
        }
    },
    settings: {
        primaryGoal: {
            type: String,
            enum: ["sales", "support", "information", "hybrid"],
            default: "sales"
        },
        currency: { type: String, default: "PKR" },
        maxProductsToShow: { type: Number, default: 10, min: 1, max: 50 },
        autoConfirmOrders: { type: Boolean, default: false },
        defaultLanguage: {
            type: String,
            enum: ["en", "ur_roman"],
            default: "en"
        },
        supportedLanguages: {
            type: [String],
            enum: ["en", "ur_roman", "mixed"],
            default: ["en", "ur_roman"]
        },
        languageOverrideEnabled: { type: Boolean, default: true },
        responseLanguageStrategy: {
            type: String,
            enum: ["match_customer", "business_default", "hybrid"],
            default: "hybrid"
        }
    },
    policies: {
        delivery: {
            enabled: { type: Boolean, default: true },
            description: String,
            charges: String,
            areas: [String],
            timeframe: String,
            freeThreshold: Number,
        },
        refund: {
            enabled: { type: Boolean, default: true },
            description: String,
            durationDays: { type: Number, default: 7 },
            conditions: String,
        },
        payment: {
            methods: [{ type: String, enum: ["cod", "card", "bank", "digital"] }],
            instructions: String,
            partialPayment: { type: Boolean, default: false },
        },
        terms: String,
    },
    metadata: {
        locationDetails: String,
        specialties: [String],
        awards: [String],
        teamSize: String,
        yearsOperating: Number,
    },
    capabilities: {
        supportsProducts: { type: Boolean, default: false },
        supportsServices: { type: Boolean, default: false },
        supportsBooking: { type: Boolean, default: false },
        supportsCart: { type: Boolean, default: false },
        supportsInformation: { type: Boolean, default: false },
    },
    onboardingComplete: { type: Boolean, default: false },
    lastAIConfigUpdate: { type: Date, default: Date.now },
    configVersion: { type: Number, default: 1 },
}, { timestamps: true });

businessSchema.methods.getAIContext = function () {
    // Helper to extract policy text regardless of storage format
    const getPolicyText = (policyField: any, subField: string = 'description'): string | undefined => {
        if (!policyField) return undefined;
        // If it's a string, return it directly
        if (typeof policyField === 'string') return policyField;
        // If it's an object, try the subfield (e.g., description, instructions)
        if (typeof policyField === 'object') {
            // Check for common subfields
            return policyField[subField] || policyField.description || policyField.instructions || policyField.text;
        }
        return undefined;
    };

    return {
        _id: this._id,
        name: this.name,
        tone: this.tone,
        description: this.description,
        address: this.address,
        slug: this.slug,
        contactPhone: this.contactPhone,
        businessName: this.name,
        businessTone: this.tone,
        businessDescription: this.description,
        businessLocation: this.address,
        operatingHours: this.operatingHours?.enabled ? this.operatingHours.schedule : null,
        policies: this.policies,
        settings: this.settings,
        currency: this.settings?.currency || 'PKR',
        personality: this.personality,
        aiSettings: this.aiSettings,
        capabilities: this.capabilities
    };
};

export const Business = mongoose.models.Business || mongoose.model<IBusiness>("Business", businessSchema);