import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET /api/conversations/takeover/active
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || typeof decoded === 'string' || !decoded.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return NextResponse.json(
                { error: "businessId is required" },
                { status: 400 }
            );
        }

        // Call Backend
        const response = await fetch(
            `${process.env.WA_SERVICE_URL}/api/conversations/takeover/active?businessId=${businessId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-user-id": decoded.userId,
                    "x-business-id": businessId
                }
            }
        );

        if (!response.ok) {
            // If backend fails, return empty list to prevent frontend crash
            return NextResponse.json({ takeovers: [] });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Get active takeovers error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
