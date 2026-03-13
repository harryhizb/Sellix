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

    // Storefront Customization
    storefront?: {
        logoUrl?: string;
        coverUrl?: string;
        welcomeText?: string;
        storeName?: string;
        navbarTitle?: string;
        heroTitle?: string;
        heroSubtitle?: string;
        ctaText?: string;
        ctaLink?: string;
        footerText?: string;
        contactInfo?: string;
        features?: { title: string; description: string; icon: string }[];
        faqs?: { question: string; answer: string }[];

        // Footer contact & social
        contactEmail?: string;
        contactPhone?: string;
        footerStyle?: "dark" | "navy" | "slate";
        socialLinks?: {
            facebook?: string;
            instagram?: string;
            twitter?: string;
        };

        // Advanced Customization
        theme?: {
            primaryColor?: string;
            textColor?: string;
            bgColor?: string;
            fontFamily?: string;
            darkMode?: boolean;
        };
        layout?: {
            heroLayout?: "split" | "centered" | "full";
            featuresLayout?: "grid-3" | "grid-4";
            featuresStyle?: "minimal" | "cards" | "accent";
            faqStyle?: "minimal" | "cards" | "accent";
        };
        sections?: {
            order?: string[];
            hidden?: string[];
        };
    };

    // Enhanced AI Configuration Fields
    tone: string; // "formal" | "friendly" | "neutral" | "professional" | "casual"
    category: string; // "ecommerce" | "restaurant" | "service" | "institute" | "other"

    // AI Personality Configuration
    personality: {
        greetingStyle: "warm" | "professional" | "simple" | "enthusiastic";
        responseSpeed: "immediate" | "thoughtful" | "balanced";
        useEmojis: boolean;
        includePricing: boolean;
        // MODULE 5: Language and tone preferences
        languagePreference: "auto" | "en" | "ur_roman" | "mixed";
        preserveToneAcrossLanguages: boolean;
        culturalAdaptation: "standard" | "enhanced" | "minimal";
        emojiPreferences?: {
            english: string[];
            urdu: string[];
            formal: string[];
            casual: string[];
        };
    };

    // AI Settings
    aiSettings: {
        ruleEngineWeight: number;
        llmFallbackThreshold: number;
        enableMultilingual: boolean;
        languagePreferences: string[];
        contextWindow: number;
        // MODULE 5: Advanced language settings
        autoDetectLanguage: boolean;
        allowLanguageSwitching: boolean;
        mixedLanguageSupport: boolean;
        defaultResponseLanguage: "en" | "ur_roman";
        languageDetectionThreshold: number;
        tonePreservationLevel: "strict" | "moderate" | "flexible";
        culturalSensitivity: "high" | "medium" | "low";
    };

    // Business Settings
    settings: {
        primaryGoal: "sales" | "support" | "information" | "hybrid";
        currency: string;
        maxProductsToShow: number;
        autoConfirmOrders: boolean;
        requireOwnerApproval: boolean;
        // MODULE 5: Business language settings
        defaultLanguage: "en" | "ur_roman";
        supportedLanguages: string[];
        languageOverrideEnabled: boolean;
        responseLanguageStrategy: "match_customer" | "business_default" | "hybrid";
    };

    // Business Policies
    policies: {
        delivery?: {
            enabled: boolean;
            description: string;
            charges: string;
            areas: string[];
            timeframe: string;
            freeThreshold: number;
            // MODULE 5: Multilingual policy descriptions
            descriptions?: {
                en: string;
                ur_roman: string;
                mixed?: string;
            };
        };
        refund?: {
            enabled: boolean;
            description: string;
            durationDays: number;
            conditions: string;
            // MODULE 5: Multilingual policy descriptions
            descriptions?: {
                en: string;
                ur_roman: string;
                mixed?: string;
            };
        };
        payment?: {
            methods: string[];
            instructions: string;
            partialPayment: boolean;
            // MODULE 5: Multilingual payment instructions
            instructionsMultilingual?: {
                en: string;
                ur_roman: string;
                mixed?: string;
            };
        };
        terms?: string;
    };

    // Metadata
    metadata?: {
        locationDetails?: string;
        specialties?: string[];
        awards?: string[];
        teamSize?: string;
        yearsOperating?: number;
        // MODULE 5: Cultural context
        primaryMarket?: string;
        culturalContext?: "pakistani" | "international" | "mixed";
        preferredCommunicationStyle?: "formal" | "semi-formal" | "casual";
    };

    capabilities?: {
        supportsProducts: boolean;
        supportsServices: boolean;
        supportsBooking: boolean;
        supportsCart: boolean;
        supportsApproval: boolean;
        supportsInformation: boolean;
    };

    // Timestamps
    onboardingComplete: boolean;
    lastAIConfigUpdate: Date;
    configVersion: number;

    // MODULE 5: Language configuration
    languageConfig?: {
        urduTransliterationStyle: "standard" | "phonetic" | "custom";
        mixedLanguageRules?: {
            allowCodeSwitching: boolean;
            maxCodeSwitchesPerMessage: number;
            preferredCodeSwitchPatterns: string[];
        };
        toneMapping?: {
            en: Record<string, string>;
            ur_roman: Record<string, string>;
        };
        culturalReferences?: {
            urdu: string[];
            mixed: string[];
        };
    };

    // Virtual method for AI context
    getAIContext(): any;

    // MODULE 5: Get language-specific context
    getLanguageContext(language: "en" | "ur_roman" | "mixed"): any;
}

// ... ONLY BUSINESS SCHEMA CODE, remove Product and FAQ interfaces ...

// Updated Business Schema with Module 5 enhancements
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
    slug: { type: String },

    storefront: {
        logoUrl: String,
        coverUrl: String,
        welcomeText: String,
        storeName: String,
        navbarTitle: String,
        heroTitle: String,
        heroSubtitle: String,
        ctaText: String,
        ctaLink: String,
        footerText: String,
        contactInfo: String,
        features: [{ title: String, description: String, icon: String }],
        faqs: [{ question: String, answer: String }],

        // Footer contact & social fields (required for visual editor)
        contactEmail: String,
        contactPhone: String,
        footerStyle: { type: String, enum: ["dark", "navy", "slate"], default: "dark" },
        socialLinks: {
            facebook: { type: String, default: "" },
            instagram: { type: String, default: "" },
            twitter: { type: String, default: "" },
        },

        // Advanced Customization
        theme: {
            primaryColor: { type: String, default: "#10b981" },
            textColor: { type: String, default: "#1f2937" },
            bgColor: { type: String, default: "#ffffff" },
            fontFamily: { type: String, default: "font-sans" },
            darkMode: { type: Boolean, default: false }
        },
        layout: {
            heroLayout: { type: String, enum: ["split", "centered", "full"], default: "split" },
            featuresLayout: { type: String, enum: ["grid-3", "grid-4"], default: "grid-3" },
            featuresStyle: { type: String, enum: ["minimal", "cards", "accent"], default: "cards" },
            faqStyle: { type: String, enum: ["minimal", "cards", "accent"], default: "cards" }
        },
        sections: {
            order: { type: [String], default: ["hero", "products", "features", "faq", "footer"] },
            hidden: { type: [String], default: [] }
        }
    },


    // AI Configuration
    tone: {
        type: String,
        enum: ["formal", "friendly", "neutral", "professional", "casual"],
        default: "friendly"
    },
    category: {
        type: String,
        enum: ["ecommerce", "restaurant", "service", "institute", "other"],
        default: "ecommerce"
    },

    // MODULE 5: Enhanced personality configuration
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
        // MODULE 5: Language preferences
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
        },
        emojiPreferences: {
            english: { type: [String], default: ["✨", "👍", "🙏", "🚀", "💯"] },
            urdu: { type: [String], default: ["🌟", "🌹", "💐", "✅", "🎉"] },
            formal: { type: [String], default: ["📋", "📍", "📞", "💼", "🎯"] },
            casual: { type: [String], default: ["😊", "👌", "💪", "🎊", "🔥"] }
        }
    },

    // MODULE 5: Enhanced AI settings
    aiSettings: {
        ruleEngineWeight: { type: Number, default: 0.7, min: 0, max: 1 },
        llmFallbackThreshold: { type: Number, default: 0.3, min: 0, max: 1 },
        enableMultilingual: { type: Boolean, default: true },
        languagePreferences: {
            type: [String],
            enum: ["en", "ur_roman", "mixed"],
            default: ["en", "ur_roman"]
        },
        contextWindow: { type: Number, default: 5 },
        // MODULE 5: Advanced language settings
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

    // MODULE 5: Enhanced business settings
    settings: {
        primaryGoal: {
            type: String,
            enum: ["sales", "support", "information", "hybrid"],
            default: "sales"
        },
        currency: { type: String, default: "USD" },
        maxProductsToShow: { type: Number, default: 10, min: 1, max: 50 },
        autoConfirmOrders: { type: Boolean, default: false },
        requireOwnerApproval: { type: Boolean, default: true },
        // MODULE 5: Language settings
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

    // MODULE 5: Enhanced policies with multilingual support
    policies: {
        delivery: {
            enabled: { type: Boolean, default: true },
            description: String,
            charges: String,
            areas: [String],
            timeframe: String,
            freeThreshold: Number,
            descriptions: {
                en: String,
                ur_roman: String,
                mixed: String
            }
        },
        refund: {
            enabled: { type: Boolean, default: true },
            description: String,
            durationDays: { type: Number, default: 7 },
            conditions: String,
            descriptions: {
                en: String,
                ur_roman: String,
                mixed: String
            }
        },
        payment: {
            methods: [{ type: String, enum: ["cod", "card", "bank", "digital"] }],
            instructions: String,
            partialPayment: { type: Boolean, default: false },
            instructionsMultilingual: {
                en: String,
                ur_roman: String,
                mixed: String
            }
        },
        terms: String
    },

    // MODULE 5: Enhanced metadata
    metadata: {
        locationDetails: String,
        specialties: [String],
        awards: [String],
        teamSize: String,
        yearsOperating: Number,
        // MODULE 5: Cultural context
        primaryMarket: {
            type: String,
            enum: ["pakistan", "international", "both"],
            default: "pakistan"
        },
        culturalContext: {
            type: String,
            enum: ["pakistani", "international", "mixed"],
            default: "pakistani"
        },
        preferredCommunicationStyle: {
            type: String,
            enum: ["formal", "semi-formal", "casual"],
            default: "semi-formal"
        }
    },

    // MODULE 5: Language configuration
    languageConfig: {
        urduTransliterationStyle: {
            type: String,
            enum: ["standard", "phonetic", "custom"],
            default: "standard"
        },
        mixedLanguageRules: {
            allowCodeSwitching: { type: Boolean, default: true },
            maxCodeSwitchesPerMessage: { type: Number, default: 3, min: 0, max: 10 },
            preferredCodeSwitchPatterns: { type: [String], default: [] }
        },
        toneMapping: {
            en: { type: Map, of: String, default: {} },
            ur_roman: { type: Map, of: String, default: {} }
        },
        culturalReferences: {
            urdu: { type: [String], default: ["Ramadan", "Eid", "Basant", "Jashn-e-Baharan"] },
            mixed: { type: [String], default: ["Eid Mubarak", "Happy Ramadan", "Pakistan Day"] }
        }
    },

    // Capability flags (derived from category if not set explicitly)
    capabilities: {
        supportsProducts: { type: Boolean, default: true },
        supportsServices: { type: Boolean, default: false },
        supportsBooking: { type: Boolean, default: false },
        supportsCart: { type: Boolean, default: true },
        supportsApproval: { type: Boolean, default: true },
        supportsInformation: { type: Boolean, default: false },
    },

    onboardingComplete: { type: Boolean, default: false },
    lastAIConfigUpdate: { type: Date, default: Date.now },
    configVersion: { type: Number, default: 1 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full business context (used by AI)
businessSchema.virtual('fullContext').get(function () {
    return {
        name: this.name,
        category: this.category,
        tone: this.tone,
        description: this.description,
        address: this.address,
        contactPhone: this.contactPhone,
        operatingHours: this.operatingHours,
        policies: this.policies,
        settings: this.settings,
        personality: this.personality,
        metadata: this.metadata,
        paymentInstructions: this.paymentInstructions,
        aiSettings: this.aiSettings,
        languageConfig: this.languageConfig
    };
});

// Method to get AI prompt context
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
        personality: this.personality,
        aiSettings: this.aiSettings,
        capabilities: this.capabilities
    };
};

// MODULE 5: Get language-specific context
businessSchema.methods.getLanguageContext = function (language: "en" | "ur_roman" | "mixed") {
    const baseContext = this.getAIContext();

    // Language-specific adaptations
    const languageContext: any = {
        ...baseContext,
        languageSpecific: {}
    };

    // Add language-specific policies if available
    if (language === "ur_roman" && this.policies?.delivery?.descriptions?.ur_roman) {
        languageContext.policies.delivery.description = this.policies.delivery.descriptions.ur_roman;
    }

    if (language === "mixed" && this.policies?.delivery?.descriptions?.mixed) {
        languageContext.policies.delivery.description = this.policies.delivery.descriptions.mixed;
    }

    // Add language-specific cultural references
    if (this.languageConfig?.culturalReferences) {
        languageContext.culturalReferences = this.languageConfig.culturalReferences[language] ||
            this.languageConfig.culturalReferences.en;
    }

    // Add language-specific tone mapping
    if (this.languageConfig?.toneMapping) {
        languageContext.toneMapping = this.languageConfig.toneMapping[language] || {};
    }

    // Add language-specific emoji preferences
    if (this.personality?.emojiPreferences) {
        languageContext.personality.emojiSet = this.personality.emojiPreferences[language] ||
            this.personality.emojiPreferences.english;
    }

    return languageContext;
};

// Indexes for performance
businessSchema.index({ slug: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ 'settings.primaryGoal': 1 });
businessSchema.index({ tone: 1 });
// MODULE 5: Indexes for language settings
businessSchema.index({ 'settings.defaultLanguage': 1 });
businessSchema.index({ 'aiSettings.autoDetectLanguage': 1 });
businessSchema.index({ 'personality.languagePreference': 1 });

// ONLY EXPORT BUSINESS, not Product or FAQ
export const Business = mongoose.models.Business || mongoose.model<IBusiness>("Business", businessSchema);