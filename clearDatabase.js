const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGO_URI = process.env.MONGODB_URI;

async function clearDatabase() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGODB_URI not found in .env.local");
        }

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const collections = await mongoose.connection.db.collections();

        for (const collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared: ${collection.collectionName}`);
        }

        console.log("✅ Database cleared");
        process.exit();
    } catch (error) {
        console.error("Error clearing database:", error);
        process.exit(1);
    }
}

clearDatabase();
