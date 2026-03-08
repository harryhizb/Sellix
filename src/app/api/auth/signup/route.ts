import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Business } from "@/models/Business";
import { Session } from "@/models/Session";
import { hashPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { signupSchema } from "@/lib/validations/auth";
import logger from "@/lib/logger";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        const result = signupSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        const { businessName, name, email, password, phone } = result.data;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        // Create IDs explicitly to handle circular dependency
        const businessId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // Create Business instance
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
        const business = new Business({
            _id: businessId,
            name: businessName,
            slug,
            contactPhone: phone,
            ownerId: userId,
        });

        // Create User instance
        const hashedPassword = await hashPassword(password);
        const user = new User({
            _id: userId,
            name,
            email,
            password: hashedPassword,
            role: "owner",
            businessId: businessId,
        });

        // Save both
        await business.save();
        await user.save();

        // Generate Tokens
        const payload = { userId: user._id, role: user.role, businessId: business._id };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Save Session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt,
        });

        // Set Cookies
        const response = NextResponse.json({
            accessToken,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                businessId: business._id.toString(),
                role: user.role,
            },
        }, { status: 201 });

        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        logger.info(`New business registered: ${business.name} by ${user.email}`);

        return response;
    } catch (error) {
        logger.error("Signup error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
