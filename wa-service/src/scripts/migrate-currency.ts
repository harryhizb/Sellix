/**
 * migrate-currency.ts
 * 
 * One-time migration: update all businesses with currency "USD" to "PKR"
 * Run with: npx ts-node src/scripts/migrate-currency.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-saas';

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db!;
        const result = await db.collection('businesses').updateMany(
            { 'settings.currency': 'USD' },
            { $set: { 'settings.currency': 'PKR' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} business(es) from USD → PKR`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
