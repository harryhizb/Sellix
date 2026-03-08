import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
    email: string;
    password: string;
    name: string;
    isVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8,
        select: false // Don't return password by default
    },
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        throw error;
    }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Index for faster email lookups
adminSchema.index({ email: 1 });
adminSchema.index({ verificationToken: 1 });

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);
