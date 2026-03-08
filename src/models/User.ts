import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string; // Hashed
    role: "owner" | "admin" | "support";
    businessId: mongoose.Types.ObjectId;
    authProvider: "local" | "google";
    googleId?: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, select: false }, // Do not return password by default
        role: {
            type: String,
            enum: ["owner", "admin", "support"],
            default: "owner",
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        googleId: { type: String, unique: true, sparse: true },
        isEmailVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
