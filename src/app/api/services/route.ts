import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Service } from "@/models/Service";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const services = await Service.find({ businessId: user.businessId, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ services });
    } catch (error: any) {
        console.error("Error fetching services:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        if (!body.name || body.price == null) {
            return NextResponse.json({ error: "Service name and price are required" }, { status: 400 });
        }

        const service = await Service.create({
            businessId: user.businessId,
            name: body.name,
            category: body.category || "general",
            duration: body.duration || 60,
            price: body.price,
            currency: body.currency || "USD",
            description: body.description || "",
            availabilityDays: body.availabilityDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
            bufferTime: body.bufferTime || 15,
        });

        return NextResponse.json({ service }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating service:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
