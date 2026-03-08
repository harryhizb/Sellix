import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json(); // Expected { status: 'confirmed' | 'cancelled' | ... }

        await dbConnect();
        // @ts-ignore
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Validate Status
        const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
        if (body.status && !validStatuses.includes(body.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const order = await Order.findOneAndUpdate(
            { _id: id, businessId: user.businessId },
            { $set: { status: body.status } },
            { new: true }
        );

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // Trigger WhatsApp Notification via Backend Service
        try {
            // Updated to call the new orders endpoint in wa-service
            const baseUrl = process.env.WA_SERVICE_URL || "http://localhost:3001";
            const notifyUrl = `${baseUrl}/api/orders/${id}/status`;

            await fetch(notifyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: body.status,
                    action: body.status === 'confirmed' ? 'approve' :
                        body.status === 'cancelled' ? 'reject' :
                            body.status === 'completed' ? 'deliver' : undefined,
                    note: "Updated via Dashboard"
                })
            });
            console.log("Notification request sent to backend");

        } catch (e) {
            console.error("Failed to notify backend:", e);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ order });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
