import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    name: { type: String },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    state: {
        step: {
            type: String,
            enum: ["INITIAL", "AWAITING_PRODUCT", "AWAITING_QUANTITY", "AWAITING_DETAILS", "CONFIRM_ORDER", "ORDER_PLACED"],
            default: "INITIAL"
        },
        data: { type: Map, of: String }, // Store temp data like { productId: "...", address: "..." }
        fallbackCount: { type: Number, default: 0 },
        detectedLanguage: { type: String, default: "en" }
    },
    metadata: { type: Map, of: String },
}, { timestamps: true });

customerSchema.index({ phone: 1, businessId: 1 }, { unique: true });

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
