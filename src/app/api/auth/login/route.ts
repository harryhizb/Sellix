import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { comparePassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import logger from "@/lib/logger";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        const { email, password } = result.data;

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password!);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

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
                businessId: user.businessId?.toString(),
                role: user.role,
            },
        });

        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        logger.info(`User logged in: ${user.email}`);

        return response;
    } catch (error) {
        logger.error("Login error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
