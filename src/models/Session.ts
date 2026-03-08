import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
    createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        refreshToken: { type: String, required: true, unique: true, index: true },
        userAgent: { type: String },
        ipAddress: { type: String },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// Auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
