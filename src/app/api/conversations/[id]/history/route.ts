// nextjs/src/app/api/conversations/[id]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const customerId = id;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/${customerId}/messages?businessId=${businessId}&limit=50`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-user-id": decoded.userId,
          "x-business-id": businessId
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}