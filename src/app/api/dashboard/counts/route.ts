import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Order, OrderStatus } from "@/models/Order";
import { ConversationOverride } from "@/models/ConversationOverride";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await dbConnect();

        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const businessId = decoded.businessId;
        if (!businessId) return NextResponse.json({ error: "No business linked" }, { status: 400 });

        // 1. Get Pending Orders Count
        const pendingOrdersCount = await Order.countDocuments({
            businessId: new mongoose.Types.ObjectId(businessId),
            status: OrderStatus.PENDING,
            isDeleted: false
        });

        // 2. Get Active Unread/Human-Paused Chats Count
        const activeChatsCount = await ConversationOverride.countDocuments({
            businessId: new mongoose.Types.ObjectId(businessId),
            isActive: true,
            aiPaused: true
        });

        return NextResponse.json({
            pendingOrders: pendingOrdersCount,
            activeChats: activeChatsCount
        });
    } catch (error) {
        console.error("Dashboard counts API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
