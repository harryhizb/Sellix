import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Business } from "@/models/Business";
import { Session } from "@/models/Session";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import logger from "@/lib/logger";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { credential, type, businessName, phone } = await req.json();

        if (!credential) {
            return NextResponse.json({ error: "No credential provided" }, { status: 400 });
        }

        let payload;
        try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${credential}` },
            });

            if (!userInfoRes.ok) {
                const errText = await userInfoRes.text();
                logger.error(`Google userinfo fetch failed: ${userInfoRes.status} ${errText}`);
                return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
            }

            payload = await userInfoRes.json();
        } catch (error) {
            logger.error("Google fetch token error", error);
            return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
        }

        if (!payload || !payload.email) {
            return NextResponse.json({ error: "Invalid Google payload" }, { status: 400 });
        }

        const email = payload.email;
        const name = payload.name || "Google User";
        const googleId = payload.sub;
        let user = await User.findOne({ email });
        let businessIdStr = "";

        if (type === "signup") {
            if (!businessName) {
                return NextResponse.json({ error: "Business name required for signup" }, { status: 400 });
            }

            if (user) {
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

            user = new User({
                _id: userId,
                name,
                email,
                role: "owner",
                businessId: businessId,
                isEmailVerified: true,
                authProvider: "google",
                googleId,
            });

            await business.save();
            await user.save();
            businessIdStr = business._id.toString();
            logger.info(`New business registered via Google: ${business.name} by ${user.email}`);
        } else {
            // Login
            if (!user) {
                return NextResponse.json({ error: "No account found with this Google email. Please sign up." }, { status: 404 });
            }

            // Sync google provider if they previously signed up manually and now clicked login with google
            if (user.authProvider !== "google") {
                user.authProvider = "google";
                user.googleId = googleId;
                if (!user.isEmailVerified) {
                    user.isEmailVerified = true;
                }
                await user.save();
            }

            businessIdStr = user.businessId.toString();
            logger.info(`User logged in via Google: ${user.email}`);
        }

        // Generate Tokens
        const authPayload = { userId: user._id, role: user.role, businessId: user.businessId };
        const accessToken = generateAccessToken(authPayload);
        const refreshToken = generateRefreshToken(authPayload);

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
        logger.error("Google OAuth error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
