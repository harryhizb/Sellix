import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import dbConnect from "./db";
import { Session } from "@/models/Session";
import { env } from "./env";

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: object) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1d" });
};

export const generateRefreshToken = (payload: object) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const verifyAuth = async (req: NextRequest): Promise<{ userId: string; businessId: string; role: string } | null> => {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const decoded = verifyToken(token) as any;

        if (!decoded || !decoded.userId) {
            return null;
        }

        return {
            userId: decoded.userId,
            businessId: decoded.businessId,
            role: decoded.role,
        };
    } catch (error) {
        return null;
    }
};

export interface RefreshResult {
    accessToken: string;
    refreshToken: string;
    payload: any;
}

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshResult | null> => {
    try {
        await dbConnect();

        // Verify token exists in DB and is valid
        const session = await Session.findOne({ refreshToken }).populate("userId");
        if (!session) {
            return null;
        }

        if (new Date() > session.expiresAt) {
            await Session.deleteOne({ _id: session._id });
            return null;
        }

        // Generate New Tokens
        const user = session.userId as any;
        if (!user) return null;

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            businessId: user.businessId?.toString()
        };

        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        // Update Session (Rotation)
        session.refreshToken = newRefreshToken;
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend 7 days
        await session.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            payload
        };
    } catch (error) {
        console.error("Error in refreshAccessToken utility:", error);
        return null;
    }
};
