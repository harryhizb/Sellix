import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { MessageLog } from "@/models/MessageLog";
import { Customer } from "@/models/Customer";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const { customerId, content } = await req.json();
        const businessId = decoded.businessId;

        const customer = await Customer.findById(customerId);
        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

        // Call wa-service to send the actual WhatsApp message
        // We'll use a direct fetch to the worker's internal API for this
        const waServiceUrl = process.env.WA_SERVICE_URL || "http://localhost:3001";

        const res = await fetch(`${waServiceUrl}/api/messages/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pass the same auth token so the worker can verify it
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                businessId,
                to: customer.phone,
                content
            })
        });

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json({ error: err.error || "Failed to send message via WhatsApp" }, { status: res.status });
        }

        // Log the message as "agent"
        await MessageLog.create({
            customerId,
            businessId,
            from: "agent",
            content
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send Message Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
