import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  try {
    const body = await req.json();

    // Call WA service
    // wa-service orders router expects POST for /:id/status
    const rawUrl = process.env.WA_SERVICE_URL || "http://localhost:3001";
    const waServiceUrl = rawUrl.replace(/\/+$/, '');
    
    const response = await fetch(`${waServiceUrl}/api/orders/${params.id}/status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`Received non-JSON response from WA service (${response.status}):`, text.substring(0, 200));
      return NextResponse.json(
        { error: "Upstream service returned an invalid response", details: text.substring(0, 100) },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Failed to update order status" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}