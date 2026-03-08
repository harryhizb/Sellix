// nextjs/src/app/api/conversations/[id]/message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// POST /api/conversations/[id]/message - Send message during takeover
export async function POST(
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

    const body = await req.json();
    const {
      businessId,
      content,
      isTemplate = false,
      templateId
    } = body;

    const customerId = id;

    if (!businessId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/whatsapp/takeover/send-message`,
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
          content
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
        { error: data.error || "Message send failed" },
        { status: response.status }
      );
    }

    // Audit logging
    await fetch(`${process.env.WA_SERVICE_URL}/api/audit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "OWNER_MESSAGE_SENT",
        userId: decoded.userId,
        businessId,
        customerId,
        metadata: {
          contentLength: content.length,
          isTemplate,
          templateId
        }
      })
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}