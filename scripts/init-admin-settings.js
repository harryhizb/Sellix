/**
 * Admin Settings Initialization Script
 * 
 * This script creates the initial admin settings document in the database.
 * Run this once to set up the platform configuration.
 * 
 * Usage: 
 * 1. Make sure MongoDB is running
 * 2. Set up environment variables
 * 3. Run: node scripts/init-admin-settings.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sellix';

// Import models
const { Business } = require('../dist/models/Business');
const { Order } = require('../dist/models/Order');
const { Customer } = require('../dist/models/Customer');
const { Feedback } = require('../dist/models/Feedback');
const { AdminSettings } = require('../dist/models/AdminSettings');

async function initializeAdminSettings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin settings already exist
        const existingSettings = await AdminSettings.findOne();
        
        if (existingSettings) {
            console.log('⚠️  Admin settings already exist. Skipping initialization.');
            console.log('Current settings:', JSON.stringify(existingSettings, null, 2));
            await mongoose.disconnect();
            return;
        }

        // Create default admin settings
        const defaultSettings = {
            systemConfig: {
                maintenanceMode: false,
                globalMessageLimit: 10000,
                enableNewBusinessRegistration: true,
                maxProductsPerBusiness: 100,
                maxOrdersPerDay: 500
            },
            whatsappApi: {
                apiKey: process.env.WHATSAPP_API_KEY || '',
                apiUrl: process.env.WHATSAPP_API_URL || 'http://localhost:3001',
                webhookUrl: '',
                enableNotifications: true,
                retryAttempts: 3,
                timeoutMs: 30000
            },
            smtpSettings: {
                host: process.env.SMTP_HOST || '',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER || '',
                password: process.env.SMTP_PASSWORD || '',
                fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@sellix.com',
                fromName: 'Sellix Platform'
            },
            featureToggles: {
                ecommerceModule: true,
                serviceModule: true,
                instituteModule: true,
                appointmentBooking: true,
                courseEnrollment: true,
                eventManagement: true,
                faqSystem: true,
                aiChatbot: true,
                humanHandoff: true,
                feedbackSystem: true,
                analyticsDashboard: true
            },
            rateLimiting: {
                enabled: true,
                windowMs: 60000,
                maxRequests: 100,
                maxMessagesPerMinute: 20
            },
            security: {
                requireTwoFactor: false,
                sessionTimeoutMinutes: 1440,
                maxLoginAttempts: 5,
                passwordMinLength: 8,
                allowCorsOrigins: []
            },
            notifications: {
                emailEnabled: true,
                smsEnabled: false,
                pushEnabled: true,
                escalationThreshold: 10
            },
            analytics: {
                enabled: true,
                retentionDays: 90,
                trackUserBehavior: true,
                trackErrors: true
            }
        };

        // Create settings document
        const settings = await AdminSettings.create(defaultSettings);
        console.log('✅ Admin settings created successfully!');
        console.log('Settings ID:', settings._id);
        console.log('\nDefault Configuration:');
        console.log('- Maintenance Mode: OFF');
        console.log('- New Registrations: ENABLED');
        console.log('- Max Products per Business: 100');
        console.log('- WhatsApp API URL:', settings.whatsappApi.apiUrl);
        console.log('- Feature Toggles: ALL ENABLED');
        console.log('\nYou can now access the admin dashboard at: /admin');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error initializing admin settings:', error);
        process.exit(1);
    }
}

// Run initialization
initializeAdminSettings();
