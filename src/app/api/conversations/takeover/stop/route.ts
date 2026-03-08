// nextjs/src/app/api/conversations/takeover/stop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// POST /api/conversations/takeover/stop - Stop takeover and resume AI
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
    const { customerId, businessId, summary } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing customerId" },
        { status: 400 }
      );
    }

    // Use businessId from body or from decoded token
    const targetBusinessId = businessId || decoded.businessId || decoded.business;

    if (!targetBusinessId) {
      return NextResponse.json(
        { error: "Missing businessId" },
        { status: 400 }
      );
    }

    console.log('[Stop Takeover] Forwarding to wa-service:', { 
      customerId, 
      targetBusinessId,
      summary 
    });

    // Forward to wa-service
    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/takeover/stop`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          customerId, 
          businessId: targetBusinessId,
          summary: summary || "Resolved by owner"
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to stop takeover" },
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
        metadata: { 
          summary,
          reason: "handed_back_to_ai"
        }
      })
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Stop takeover error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
