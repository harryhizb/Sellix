import mongoose, { Schema, Document, Model } from "mongoose";
import { ProductAttributes, ProductVariant, ProductDiscount } from "@/types/product";

export interface IProduct extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    currency: string;
    imageUrl?: string;  // legacy single image
    images?: { publicId: string; secureUrl: string }[];  // Cloudinary images
    inStock: boolean;
    stockQuantity: number;
    category?: string;
    attributes?: ProductAttributes;
    variants?: ProductVariant[];
    discount?: ProductDiscount;
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
        images: [{ publicId: { type: String }, secureUrl: { type: String } }],
        inStock: { type: Boolean, default: true },
        stockQuantity: { type: Number, default: 0 },
        category: { type: String, default: "general" },
        attributes: { type: Schema.Types.Mixed, default: {} },
        variants: [{
            name: String,
            price: Number,
            stock: { type: Number, default: 0 },
            sku: String,
            attributes: Schema.Types.Mixed
        }],
        discount: {
            type: { type: String, enum: ["percentage", "fixed"] },
            value: Number,
            validUntil: Date
        },
        tags: [String],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Indexes for performance
ProductSchema.index({ businessId: 1, name: 1 });
ProductSchema.index({ businessId: 1, category: 1 });
ProductSchema.index({ businessId: 1, isActive: 1 });
ProductSchema.index({ businessId: 1, inStock: 1 });
ProductSchema.index({ businessId: 1, tags: 1 });

export const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);