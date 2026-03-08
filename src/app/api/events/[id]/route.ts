import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Event } from "@/models/Event";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const event = await Event.findOneAndUpdate(
            { _id: params.id, businessId: user.businessId },
            { $set: body },
            { new: true }
        );

        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json({ event });
    } catch (error: any) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(authHeader.split(" ")[1]) as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const event = await Event.findOneAndDelete({ _id: params.id, businessId: user.businessId });
        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

        return NextResponse.json({ message: "Event deleted" });
    } catch (error: any) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
