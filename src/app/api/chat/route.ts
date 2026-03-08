import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { MessageLog } from "@/models/MessageLog";
import { Customer } from "@/models/Customer";
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

        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");

        if (customerId) {
            // Get history for a specific customer
            const messages = await MessageLog.find({
                businessId: new mongoose.Types.ObjectId(businessId),
                customerId: new mongoose.Types.ObjectId(customerId)
            }).sort({ createdAt: 1 });

            return NextResponse.json({ messages });
        } else {
            // Get list of unique customers who have messaged
            const conversations = await MessageLog.aggregate([
                { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: "$customerId",
                        lastMessage: { $first: "$content" },
                        lastTimestamp: { $first: "$createdAt" },
                        from: { $first: "$from" }
                    }
                },
                {
                    $lookup: {
                        from: "customers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                { $unwind: "$customer" },
                {
                    $project: {
                        id: "$_id",
                        lastMessage: 1,
                        lastTimestamp: 1,
                        from: 1,
                        customerPhone: "$customer.phone",
                        customerName: "$customer.name"
                    }
                },
                { $sort: { lastTimestamp: -1 } }
            ]);

            return NextResponse.json({ conversations });
        }
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
