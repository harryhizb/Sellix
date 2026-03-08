import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    dateTime: Date;
    registrationType: "free" | "paid";
    registrationFee: number;
    allowedParticipants: number;
    registrationDeadline: Date;
    description: string;
    confirmationMethod: "manual" | "auto_after_payment";
    paymentInstructions: string;
    registeredCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        name: { type: String, required: true },
        dateTime: { type: Date, required: true },
        registrationType: { type: String, enum: ["free", "paid"], default: "free" },
        registrationFee: { type: Number, default: 0 },
        allowedParticipants: { type: Number, default: 100 },
        registrationDeadline: { type: Date },
        description: { type: String, default: "" },
        confirmationMethod: { type: String, enum: ["manual", "auto_after_payment"], default: "manual" },
        paymentInstructions: { type: String, default: "" },
        registeredCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

EventSchema.index({ businessId: 1, dateTime: -1 });

export const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
