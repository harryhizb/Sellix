import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    
    // Enhanced state management for Module 2
    state: {
        step: {
            type: String,
            enum: ["INITIAL", "BROWSING", "AWAITING_PRODUCT", "AWAITING_QUANTITY", "AWAITING_DETAILS", "CONFIRM_ORDER", "ORDER_PLACED", "CANCELLED"],
            default: "INITIAL"
        },
        
        // Enhanced data storage with structured fields
        data: { 
            type: Map, 
            of: mongoose.Schema.Types.Mixed,
            default: new Map()
        },
        
        // Track fallbacks for better recovery
        fallbackCount: { type: Number, default: 0 },
        
        // Language detection
        detectedLanguage: { 
            type: String, 
            enum: ["en", "ur_roman", "mixed"],
            default: "en"
        },
        
        // Context history for graceful switching (Module 2 enhancement)
        contextHistory: [{
            timestamp: { type: Date, default: Date.now },
            step: String,
            intent: String,
            entities: mongoose.Schema.Types.Mixed,
            response: String
        }],
        
        // Conversation context for better continuity
        conversationContext: {
            lastProductViewed: String,
            lastCategoryBrowsed: String,
            preferences: {
                language: { type: String, default: "en" },
                tone: { type: String, default: "neutral" }
            },
            // Track intent patterns
            intentPatterns: [{
                intent: String,
                count: Number,
                lastUsed: Date
            }]
        }
    },
    
    // Customer preferences and metadata
    preferences: {
        preferredLanguage: { type: String, enum: ["en", "ur_roman", "mixed"], default: "en" },
        notificationEnabled: { type: Boolean, default: true },
        marketingOptIn: { type: Boolean, default: false }
    },
    
    // Enhanced metadata for better customer understanding
    metadata: {
        firstSeen: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now },
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        
        // Customer segmentation
        customerType: {
            type: String,
            enum: ["new", "returning", "loyal", "inactive"],
            default: "new"
        },
        
        // Behavioral data
        browsingHistory: [{
            productId: mongoose.Schema.Types.ObjectId,
            productName: String,
            viewedAt: Date,
            category: String
        }],
        
        // Communication preferences
        responseTime: { type: Number, default: 0 }, // Average response time in seconds
        messageCount: { type: Number, default: 0 }
    },
    
    // Address book for returning customers
    addresses: [{
        type: {
            type: String,
            enum: ["home", "work", "other"],
            default: "home"
        },
        addressLine1: String,
        addressLine2: String,
        city: String,
        area: String,
        landmark: String,
        postalCode: String,
        isDefault: { type: Boolean, default: false }
    }],
    
    // Tags for customer segmentation
    tags: [String],
    
    // Notes for customer service
    notes: [{
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
customerSchema.index({ phone: 1, businessId: 1 }, { unique: true });
customerSchema.index({ businessId: 1, "state.step": 1 });
customerSchema.index({ businessId: 1, "metadata.lastSeen": 1 });
customerSchema.index({ businessId: 1, "metadata.customerType": 1 });
customerSchema.index({ businessId: 1, tags: 1 });

// Virtual for customer's full name
customerSchema.virtual('displayName').get(function() {
    return this.name || `Customer ${this.phone.slice(-4)}`;
});

// Virtual for customer's primary address
customerSchema.virtual('primaryAddress').get(function() {
    const defaultAddress = this.addresses?.find(addr => addr.isDefault);
    if (defaultAddress) {
        return `${defaultAddress.addressLine1}, ${defaultAddress.city}`;
    }
    return this.addresses?.[0] ? `${this.addresses[0].addressLine1}, ${this.addresses[0].city}` : null;
});

// Method to update customer state with validation
customerSchema.methods.updateState = function(newState: Partial<typeof this.state>) {
    const currentState = this.state || {};
    
    // Merge state updates
    this.state = {
        ...currentState,
        ...newState,
        data: newState.data || currentState.data || new Map(),
        contextHistory: newState.contextHistory || currentState.contextHistory || []
    };
    
    // Update last seen
    if (!this.metadata) this.metadata = {};
    this.metadata.lastSeen = new Date();
    
    return this.save();
};

// Method to add context history entry
customerSchema.methods.addContextHistory = function(entry: any) {
    if (!this.state.contextHistory) {
        this.state.contextHistory = [];
    }
    
    this.state.contextHistory.push({
        timestamp: new Date(),
        ...entry
    });
    
    // Keep only last 20 entries
    if (this.state.contextHistory.length > 20) {
        this.state.contextHistory = this.state.contextHistory.slice(-20);
    }
    
    return this.save();
};

// Method to get current context summary
customerSchema.methods.getContextSummary = function() {
    const summary = {
        currentStep: this.state?.step || "INITIAL",
        detectedLanguage: this.state?.detectedLanguage || "en",
        lastIntent: this.state?.data?.get?.("lastIntent"),
        productInProgress: this.state?.data?.get?.("product"),
        missingDetails: [],
        contextHistoryLength: this.state?.contextHistory?.length || 0
    };
    
    return summary;
};

// Method to reset state for new conversation
customerSchema.methods.resetState = function() {
    this.state = {
        step: "INITIAL",
        data: new Map(),
        fallbackCount: 0,
        detectedLanguage: this.preferences?.preferredLanguage || "en",
        contextHistory: [],
        conversationContext: {
            lastProductViewed: null,
            lastCategoryBrowsed: null,
            preferences: {
                language: this.preferences?.preferredLanguage || "en",
                tone: "neutral"
            },
            intentPatterns: []
        }
    };
    
    return this.save();
};

// Method to detect customer's preferred language from conversation
customerSchema.methods.detectPreferredLanguage = function() {
    if (!this.state?.contextHistory || this.state.contextHistory.length === 0) {
        return this.preferences?.preferredLanguage || "en";
    }
    
    // Analyze last 10 messages for language patterns
    const recentHistory = this.state.contextHistory.slice(-10);
    const languageCounts = { en: 0, ur_roman: 0, mixed: 0 };
    
    recentHistory.forEach((entry: any) => {
        if (entry.detectedLanguage && (entry.detectedLanguage === 'en' || entry.detectedLanguage === 'ur_roman' || entry.detectedLanguage === 'mixed')) {
            const lang = entry.detectedLanguage as 'en' | 'ur_roman' | 'mixed';
            languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        }
    });
    
    // Determine dominant language
    let maxCount = 0;
    let dominantLanguage = "en";
    
    Object.entries(languageCounts).forEach(([lang, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominantLanguage = lang;
        }
    });
    
    // Update preferences if different
    if (dominantLanguage !== this.preferences?.preferredLanguage) {
        this.preferences = this.preferences || {};
        this.preferences.preferredLanguage = dominantLanguage;
    }
    
    return dominantLanguage;
};

// Method to update customer metrics after order
customerSchema.methods.updateOrderMetrics = function(orderValue: number) {
    if (!this.metadata) this.metadata = {};
    
    this.metadata.totalOrders = (this.metadata.totalOrders || 0) + 1;
    this.metadata.totalSpent = (this.metadata.totalSpent || 0) + orderValue;
    this.metadata.averageOrderValue = this.metadata.totalSpent / this.metadata.totalOrders;
    
    // Update customer type based on order count
    if (this.metadata.totalOrders === 1) {
        this.metadata.customerType = "new";
    } else if (this.metadata.totalOrders >= 2 && this.metadata.totalOrders <= 5) {
        this.metadata.customerType = "returning";
    } else if (this.metadata.totalOrders > 5) {
        this.metadata.customerType = "loyal";
    }
    
    return this.save();
};

// Static method to find inactive customers
customerSchema.statics.findInactiveCustomers = function(businessId: string, daysInactive: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    return this.find({
        businessId,
        "metadata.lastSeen": { $lt: cutoffDate },
        "metadata.customerType": { $ne: "inactive" }
    });
};

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export type ICustomer = InstanceType<typeof Customer>;