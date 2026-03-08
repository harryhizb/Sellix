import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    role: { type: String, default: "owner" },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, unique: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
