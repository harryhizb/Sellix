// nextjs/src/app/api/faqs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

// DELETE /api/faqs/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/faqs/${id}`,
      {
        method: "DELETE",
        headers: {
          "x-user-id": auth.userId
        }
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Delete FAQ error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/faqs/[id]/status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isActive } = body;

    const response = await fetch(
      `${process.env.WA_SERVICE_URL}/api/faqs/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": auth.userId
        },
        body: JSON.stringify({ isActive })
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error("Update FAQ status error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}