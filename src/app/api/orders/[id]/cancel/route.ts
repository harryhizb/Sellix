import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { reason } = body;

        // Call backend service
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_SERVICE_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/api/orders/${params.id}/cancel`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.message || "Failed to cancel order" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error cancelling order:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
