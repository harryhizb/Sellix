// nextjs/src/app/api/conversations/takeover/context/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET /api/conversations/takeover/context - Get conversation context for takeover
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
    const customerId = searchParams.get("customerId");
    const businessId = searchParams.get("businessId");

    if (!customerId || !businessId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/takeover/context?customerId=${customerId}&businessId=${businessId}`,
      {
        headers: {
          "x-user-id": decoded.userId,
          "x-business-id": businessId
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Get context error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}