// nextjs/src/app/api/conversations/takeover/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// POST /api/conversations/takeover - Initiate takeover
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
    const { customerId, businessId } = body;

    if (!customerId || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Forward to wa-service
    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/takeover/start`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ customerId })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Takeover failed" },
        { status: response.status }
      );
    }

    // Audit logging
    await fetch(`${process.env.WA_SERVICE_URL}/api/audit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TAKEOVER_START",
        userId: decoded.userId,
        businessId,
        customerId,
        metadata: { source: "order_page" }
      })
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Takeover error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/conversations/takeover/active - Get active takeover sessions
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

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Get active takeovers error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/takeover - Force handback
export async function DELETE(req: NextRequest) {
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
        { error: "Missing customerId or businessId" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/conversations/takeover/force-handback`,
      {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-business-id": businessId,
          "x-user-id": decoded.userId
        },
        body: JSON.stringify({ customerId, businessId })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Force handback failed" },
        { status: response.status }
      );
    }

    // Audit logging
    await fetch(`${process.env.WA_SERVICE_URL}/api/audit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TAKEOVER_FORCE_END",
        userId: decoded.userId,
        businessId,
        customerId,
        metadata: { forcedBy: decoded.userId }
      })
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Force handback error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}