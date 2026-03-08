// nextjs/src/app/api/conversations/handback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// POST /api/conversations/handback - Return to AI with summary
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      businessId,
      summary = "Issue resolved",
      outcome = "handed_back"
    } = body;

    if (!customerId || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/takeover/stop`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-business-id": businessId,
          "x-user-id": decoded.userId,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          businessId,
          summary,
          outcome,
          ownerId: decoded.userId
        })
      }
    );

    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: "Invalid response from WA service" };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Handback failed" },
        { status: response.status }
      );
    }

    // Audit logging
    await fetch(`${process.env.WA_SERVICE_URL}/api/audit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TAKEOVER_END",
        userId: decoded.userId,
        businessId,
        customerId,
        metadata: { outcome, summary }
      })
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Handback error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}