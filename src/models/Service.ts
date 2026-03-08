import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    category: string;
    duration: number; // in minutes
    price: number;
    currency: string;
    description: string;
    availabilityDays: string[]; // e.g. ["monday","tuesday","wednesday"]
    bufferTime: number; // in minutes between appointments
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        name: { type: String, required: true },
        category: { type: String, default: "general" },
        duration: { type: Number, default: 60 },
        price: { type: Number, required: true },
        currency: { type: String, default: "USD" },
        description: { type: String, default: "" },
        availabilityDays: { type: [String], default: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
        bufferTime: { type: Number, default: 15 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

ServiceSchema.index({ businessId: 1, category: 1 });

export const Service: Model<IService> =
    mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
