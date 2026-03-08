import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationCode extends Document {
    email: string;
    code: string;
    type: "signup" | "login";
    expiresAt: Date;
    createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
    {
        email: { type: String, required: true, index: true },
        code: { type: String, required: true },
        type: { type: String, enum: ["signup", "login"], required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// TTL index to automatically delete expired codes
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationCode: Model<IVerificationCode> =
    mongoose.models.VerificationCode || mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema);
