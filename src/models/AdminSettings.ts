import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSettings extends Document {
    // System configuration
    systemConfig: {
        maintenanceMode: boolean;
        globalMessageLimit: number;
        enableNewBusinessRegistration: boolean;
        maxProductsPerBusiness: number;
        maxOrdersPerDay: number;
    };
    
    // WhatsApp API settings
    whatsappApi: {
        apiKey?: string;
        apiUrl?: string;
        webhookUrl?: string;
        enableNotifications: boolean;
        retryAttempts: number;
        timeoutMs: number;
    };
    
    // SMTP/Email settings
    smtpSettings: {
        host?: string;
        port?: number;
        secure: boolean;
        user?: string;
        password?: string;
        fromEmail?: string;
        fromName?: string;
    };
    
    // Feature toggles
    featureToggles: {
        ecommerceModule: boolean;
        serviceModule: boolean;
        instituteModule: boolean;
        appointmentBooking: boolean;
        courseEnrollment: boolean;
        eventManagement: boolean;
        faqSystem: boolean;
        aiChatbot: boolean;
        humanHandoff: boolean;
        feedbackSystem: boolean;
        analyticsDashboard: boolean;
    };
    
    // Rate limiting
    rateLimiting: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
        maxMessagesPerMinute: number;
    };
    
    // Security settings
    security: {
        requireTwoFactor: boolean;
        sessionTimeoutMinutes: number;
        maxLoginAttempts: number;
        passwordMinLength: number;
        allowCorsOrigins: string[];
    };
    
    // Notification settings
    notifications: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        pushEnabled: boolean;
        escalationThreshold: number; // Number of failed messages before alert
    };
    
    // Analytics settings
    analytics: {
        enabled: boolean;
        retentionDays: number;
        trackUserBehavior: boolean;
        trackErrors: boolean;
    };
    
    // Last updated metadata
    updatedBy?: mongoose.Types.ObjectId;
    lastBackupAt?: Date;
    
    createdAt: Date;
    updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>({
    // System configuration
    systemConfig: {
        maintenanceMode: { type: Boolean, default: false },
        globalMessageLimit: { type: Number, default: 10000 },
        enableNewBusinessRegistration: { type: Boolean, default: true },
        maxProductsPerBusiness: { type: Number, default: 100 },
        maxOrdersPerDay: { type: Number, default: 500 }
    },
    
    // WhatsApp API
    whatsappApi: {
        apiKey: String,
        apiUrl: { type: String, default: process.env.WHATSAPP_API_URL || 'http://localhost:3001' },
        webhookUrl: String,
        enableNotifications: { type: Boolean, default: true },
        retryAttempts: { type: Number, default: 3 },
        timeoutMs: { type: Number, default: 30000 }
    },
    
    // SMTP Settings
    smtpSettings: {
        host: String,
        port: Number,
        secure: { type: Boolean, default: true },
        user: String,
        password: String,
        fromEmail: String,
        fromName: { type: String, default: "Sellix Platform" }
    },
    
    // Feature Toggles
    featureToggles: {
        ecommerceModule: { type: Boolean, default: true },
        serviceModule: { type: Boolean, default: true },
        instituteModule: { type: Boolean, default: true },
        appointmentBooking: { type: Boolean, default: true },
        courseEnrollment: { type: Boolean, default: true },
        eventManagement: { type: Boolean, default: true },
        faqSystem: { type: Boolean, default: true },
        aiChatbot: { type: Boolean, default: true },
        humanHandoff: { type: Boolean, default: true },
        feedbackSystem: { type: Boolean, default: true },
        analyticsDashboard: { type: Boolean, default: true }
    },
    
    // Rate Limiting
    rateLimiting: {
        enabled: { type: Boolean, default: true },
        windowMs: { type: Number, default: 60000 }, // 1 minute
        maxRequests: { type: Number, default: 100 },
        maxMessagesPerMinute: { type: Number, default: 20 }
    },
    
    // Security
    security: {
        requireTwoFactor: { type: Boolean, default: false },
        sessionTimeoutMinutes: { type: Number, default: 1440 }, // 24 hours
        maxLoginAttempts: { type: Number, default: 5 },
        passwordMinLength: { type: Number, default: 8 },
        allowCorsOrigins: { type: [String], default: [] }
    },
    
    // Notifications
    notifications: {
        emailEnabled: { type: Boolean, default: true },
        smsEnabled: { type: Boolean, default: false },
        pushEnabled: { type: Boolean, default: true },
        escalationThreshold: { type: Number, default: 10 }
    },
    
    // Analytics
    analytics: {
        enabled: { type: Boolean, default: true },
        retentionDays: { type: Number, default: 90 },
        trackUserBehavior: { type: Boolean, default: true },
        trackErrors: { type: Boolean, default: true }
    },
    
    // Metadata
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastBackupAt: Date
}, {
    timestamps: true
});

// Ensure only one document exists
adminSettingsSchema.index({});

// Static helper to get settings (use in API routes instead)
// Note: Use findOne() directly in API routes

export const AdminSettings = mongoose.models.AdminSettings || 
    mongoose.model<IAdminSettings>("AdminSettings", adminSettingsSchema);
