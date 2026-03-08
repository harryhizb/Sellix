import mongoose from "mongoose";

export async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log(`MongoDB Connected (Worker): ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
}
