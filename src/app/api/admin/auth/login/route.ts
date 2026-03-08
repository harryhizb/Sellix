import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import { Admin } from "@/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

// POST /api/admin/auth/login - Admin login
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find admin with password field selected
        const admin = await Admin.findOne({ email }).select("+password");
        
        if (!admin) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if admin is verified
        if (!admin.isVerified) {
            return NextResponse.json(
                { error: "Please verify your email before logging in" },
                { status: 403 }
            );
        }

        // Compare passwords
        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: admin._id, 
                email: admin.email,
                isAdmin: true 
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Create response with secure cookie
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });

        // Set HTTP-only cookie
        response.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/"
        });

        return response;

    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { error: "Failed to login" },
            { status: 500 }
        );
    }
}
