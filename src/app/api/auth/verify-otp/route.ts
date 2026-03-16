import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { VerificationCode } from "@/models/VerificationCode";
import { User } from "@/models/User";
import { Business } from "@/models/Business";
import { Session } from "@/models/Session";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, code, type, name, businessName, phone, password } = await req.json();

        if (!email || !code || !type || !["signup", "login"].includes(type)) {
            return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
        }

        // Verify OTP
        const verification = await VerificationCode.findOne({ email, type, code });
        if (!verification) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        if (new Date() > verification.expiresAt) {
            await VerificationCode.deleteOne({ _id: verification._id });
            return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
        }

        let user;
        let businessIdStr = "";

        if (type === "signup") {
            if (!name || !businessName) {
                return NextResponse.json({ error: "Name and business name are required for signup" }, { status: 400 });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return NextResponse.json({ error: "Email already registered" }, { status: 409 });
            }

            const businessId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();

            const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
            const business = new Business({
                _id: businessId,
                name: businessName,
                slug,
                contactPhone: phone,
                ownerId: userId,
            });

            const { hashPassword } = await import("@/lib/auth");
            const hashedPassword = password ? await hashPassword(password) : undefined;

            user = new User({
                _id: userId,
                name,
                email,
                password: hashedPassword,
                role: "owner",
                businessId: businessId,
                isEmailVerified: true,
                authProvider: "local",
            });

            await business.save();
            await user.save();
            businessIdStr = business._id.toString();
            logger.info(`New business registered via OTP: ${business.name} by ${user.email}`);
        } else {
            // Login flow
            user = await User.findOne({ email });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // If they are logging in via email OTP, their email is inherently verified
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                await user.save();
            }
            businessIdStr = user.businessId.toString();
            logger.info(`User logged in via OTP: ${user.email}`);
        }

        // Clean up OTP after success
        await VerificationCode.deleteOne({ _id: verification._id });

        // Generate Tokens
        const payload = { userId: user._id, role: user.role, businessId: user.businessId };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Save Session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || undefined,
        });

        const response = NextResponse.json({
            accessToken,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                businessId: businessIdStr,
                role: user.role,
            },
        }, { status: type === "signup" ? 201 : 200 });

        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        logger.error("Verify OTP error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
