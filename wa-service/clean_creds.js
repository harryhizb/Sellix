require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function cleanCredentials() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error("No MONGODB_URI found");

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB:', mongoUri.split('@')[1] || "local");

        // Clear the WhatsAppCredential collection
        const result = await mongoose.connection.db.collection('whatsappcredentials').deleteMany({});
        console.log(`Deleted ${result.deletedCount} credentials from database.`);

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning credentials:', error);
        process.exit(1);
    }
}

cleanCredentials();
