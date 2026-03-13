"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const businessSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    address: String,
    contactPhone: String,
    operatingHours: {
        enabled: { type: Boolean, default: false },
        schedule: {
            type: Map,
            of: new mongoose_1.Schema({
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
    var _a, _b;
    // Helper to extract policy text regardless of storage format
    const getPolicyText = (policyField, subField = 'description') => {
        if (!policyField)
            return undefined;
        // If it's a string, return it directly
        if (typeof policyField === 'string')
            return policyField;
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
        operatingHours: ((_a = this.operatingHours) === null || _a === void 0 ? void 0 : _a.enabled) ? this.operatingHours.schedule : null,
        policies: this.policies,
        settings: this.settings,
        currency: ((_b = this.settings) === null || _b === void 0 ? void 0 : _b.currency) || 'PKR',
        personality: this.personality,
        aiSettings: this.aiSettings,
        capabilities: this.capabilities
    };
};
exports.Business = mongoose_1.default.models.Business || mongoose_1.default.model("Business", businessSchema);
