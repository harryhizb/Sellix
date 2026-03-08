import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Service } from "@/models/Service";

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
        const service = await Service.findOneAndUpdate(
            { _id: params.id, businessId: user.businessId },
            { $set: body },
            { new: true }
        );

        if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
        return NextResponse.json({ service });
    } catch (error: any) {
        console.error("Error updating service:", error);
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

        const service = await Service.findOneAndDelete({ _id: params.id, businessId: user.businessId });
        if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

        return NextResponse.json({ message: "Service deleted" });
    } catch (error: any) {
        console.error("Error deleting service:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
