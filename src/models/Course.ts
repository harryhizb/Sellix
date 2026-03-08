import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScholarship {
    name: string;
    discountAmount: number;
    eligibility: string;
}

export interface ICourse extends Document {
    businessId: mongoose.Types.ObjectId;
    name: string;
    courseType: "diploma" | "degree" | "fsc" | "other";
    duration: string;
    description: string;
    admissionFee: number;
    scholarships: IScholarship[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ScholarshipSchema = new Schema<IScholarship>({
    name: { type: String, required: true },
    discountAmount: { type: Number, required: true },
    eligibility: { type: String, default: "" },
}, { _id: false });

const CourseSchema = new Schema<ICourse>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
        name: { type: String, required: true },
        courseType: { type: String, enum: ["diploma", "degree", "fsc", "other"], default: "other" },
        duration: { type: String, default: "" },
        description: { type: String, default: "" },
        admissionFee: { type: Number, default: 0 },
        scholarships: { type: [ScholarshipSchema], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CourseSchema.index({ businessId: 1, name: 1 });

export const Course: Model<ICourse> =
    mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
