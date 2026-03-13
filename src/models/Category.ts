import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    emoji?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        name: { type: String, required: true },
        emoji: { type: String, default: "📦" },
    },
    { timestamps: true }
);

CategorySchema.index({ businessId: 1, name: 1 }, { unique: true });

// Delete the model from the cache to avoid HMR schema caching issues in development
delete mongoose.models.Category;
export const Category: Model<ICategory> = mongoose.model<ICategory>("Category", CategorySchema);
