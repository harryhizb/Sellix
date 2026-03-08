/**
 * Appointment model for wa-service
 * Mirrors the frontend src/models/Appointment.ts schema
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";

export interface IAppointment extends Document {
    businessId: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    date: Date;
    time: string;
    status: AppointmentStatus;
    notes: string;
    feedback: string;
    waMessageSent?: boolean;
    rescheduledTo?: Date;
    rescheduledTime?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        serviceId: { type: Schema.Types.ObjectId, ref: "Product" },
        customerName: { type: String, required: true },
        customerPhone: { type: String, required: true },
        serviceName: { type: String, default: "" },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled"],
            default: "pending"
        },
        notes: { type: String, default: "" },
        feedback: { type: String, default: "" },
        waMessageSent: { type: Boolean, default: false },
        rescheduledTo: { type: Date },
        rescheduledTime: { type: String },
    },
    { timestamps: true }
);

AppointmentSchema.index({ businessId: 1, date: -1 });
AppointmentSchema.index({ businessId: 1, status: 1 });

export const Appointment: Model<IAppointment> =
    mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);
