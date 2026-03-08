import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

// GET /api/admin/auth/verify - Verify admin token
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("admin_token")?.value || 
                     req.headers.get("authorization")?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { valid: false, error: "No token provided" },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Check if it's an admin token
        if (!decoded.isAdmin) {
            return NextResponse.json(
                { valid: false, error: "Not an admin token" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            valid: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                isAdmin: decoded.isAdmin
            }
        });

    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return NextResponse.json(
                { valid: false, error: "Token expired" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { valid: false, error: "Invalid token" },
            { status: 401 }
        );
    }
}
