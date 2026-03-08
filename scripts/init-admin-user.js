/**
 * Initialize Admin User Script
 * 
 * This creates the initial super admin account
 * Run once to set up admin access
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sellix';

// Admin Schema (simplified for script)
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    name: { type: String, required: true },
    isVerified: { type: Boolean, default: true }, // Auto-verify for initial setup
    lastLogin: Date
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

async function initializeAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne();
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.name);
            await mongoose.disconnect();
            return;
        }

        // Create admin credentials
        const adminEmail = "hizbullahkhan16651@gmail.com";
        const adminPassword = "MyGuzel@11";
        const adminName = "Super Admin";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create admin user
        const admin = await Admin.create({
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            isVerified: true
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!\n');
        console.log('Admin dashboard URL: http://localhost:3000/admin\n');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error initializing admin:', error);
        process.exit(1);
    }
}

initializeAdmin();
