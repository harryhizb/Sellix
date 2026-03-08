import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    currency: string;
    imageUrl?: string;
    images?: { publicId: string; secureUrl: string }[];  // Cloudinary images array
    inStock: boolean;
    stockQuantity: number;
    category?: string;
    attributes?: Record<string, any>;
    variants?: Array<{
        name: string;
        price: number;
        stock: number;
        sku: string;
        attributes?: Record<string, string>;
    }>;
    discount?: {
        type: "percentage" | "fixed";
        value: number;
        validUntil?: Date;
    };
    tags?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        currency: { type: String, default: "USD" },
        imageUrl: { type: String },
        images: [{ publicId: { type: String }, secureUrl: { type: String } }],  // Cloudinary images array
        inStock: { type: Boolean, default: true },
        stockQuantity: { type: Number, default: 0 },
        category: { type: String },
        attributes: { type: Schema.Types.Mixed, default: {} },
        variants: [{ name: String, price: Number, stock: { type: Number, default: 0 }, sku: String, attributes: Schema.Types.Mixed }],
        discount: { type: { type: String, enum: ["percentage", "fixed"] }, value: Number, validUntil: Date },
        tags: [String],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
