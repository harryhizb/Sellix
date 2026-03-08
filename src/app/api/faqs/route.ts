// nextjs/src/app/api/faqs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    // Fetch from WA service
    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/faqs?businessId=${businessId}`,
      {
        headers: {
          "x-user-id": auth.userId,
          "x-business-id": businessId
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Get FAQs error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, answer, type = "ai", category = "general", tags = [], businessId } = body;

    if (!question || !answer || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.WA_SERVICE_URL}/api/faqs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": auth.userId,
        "x-business-id": businessId
      },
      body: JSON.stringify({
        question,
        answer,
        type,
        category,
        tags,
        businessId,
        createdBy: auth.userId
      })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Create FAQ error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}